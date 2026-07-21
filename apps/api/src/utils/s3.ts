import {
  S3Client,
  HeadBucketCommand,
  PutObjectCommand,
  ListObjectsV2Command,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
  GetObjectCommand,
  PutBucketCorsCommand,
  PutBucketEncryptionCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { logger } from './logger';
import { getTransactionId } from './context';
import { HttpStatus } from './httpStatus';
import { AppError } from '../middleware/errorHandler';

import { getEnv } from './env';

const bucketName = getEnv('S3_BUCKET') || getEnv('AWS_S3_BUCKET');
export const s3BucketName = bucketName;
const region = getEnv('AWS_REGION') || 'us-east-1';
const accessKeyId = getEnv('AWS_ACCESS_KEY_ID');
const secretAccessKey = getEnv('AWS_SECRET_ACCESS_KEY');

export let s3Client: S3Client | null = null;
export let isS3Healthy = false;
export let s3ErrorDetails = '';
export let s3ConfigError = false;

if (bucketName && accessKeyId && secretAccessKey) {
  s3Client = new S3Client({
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  });
} else {
  s3ErrorDetails = 'AWS S3 environment variables are not fully configured (S3_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY).';
  s3ConfigError = true;
  logger.warn(s3ErrorDetails);
}

export async function initS3(): Promise<void> {
  if (!s3Client || !bucketName) {
    isS3Healthy = false;
    return;
  }

  try {
    logger.info(`Verifying AWS S3 bucket: ${bucketName}...`);
    await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
    logger.info(`AWS S3 bucket ${bucketName} exists and is accessible.`);
  } catch (err: any) {
    isS3Healthy = false;
    const isCredentialsErr = err.name === 'InvalidSignatureException' || err.name === 'SignatureDoesNotMatch' || err.name === 'UnrecognizedClientException' || err.$metadata?.httpStatusCode === HttpStatus.FORBIDDEN;
    const isNotFound = err.name === 'NotFound' || err.$metadata?.httpStatusCode === HttpStatus.NOT_FOUND;

    if (isNotFound) {
      s3ErrorDetails = `S3 bucket "${bucketName}" not found.`;
      logger.error(s3ErrorDetails, { error: err.message });
      s3ConfigError = true;
    } else if (isCredentialsErr) {
      s3ErrorDetails = 'Invalid AWS credentials or insufficient permissions.';
      logger.error(s3ErrorDetails, { error: err.message });
    } else {
      s3ErrorDetails = `S3 connection failed: ${err.message}`;
      logger.error(s3ErrorDetails, { error: err.message });
    }
    return;
  }

  // Verify and self-heal bucket CORS so browser-based presigned PUT/GET requests
  // (multipart upload parts, downloads) aren't blocked by the S3 CORS policy.
  try {
    const corsOrigins = (getEnv('CORS_ORIGIN') || 'http://localhost:4001')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);

    await s3Client.send(
      new PutBucketCorsCommand({
        Bucket: bucketName,
        CORSConfiguration: {
          CORSRules: [
            {
              AllowedOrigins: corsOrigins,
              AllowedMethods: ['GET', 'PUT', 'POST', 'HEAD'],
              AllowedHeaders: ['*'],
              ExposeHeaders: ['ETag'],
              MaxAgeSeconds: 3600,
            },
          ],
        },
      })
    );
    logger.info('S3 bucket CORS policy verified/applied.', { origins: corsOrigins });
  } catch (err: any) {
    logger.error('Failed to self-heal S3 bucket CORS policy', { error: err.message });
    // Don't crash init — uploads may fail from the browser until this is fixed, but
    // server-side operations (downloads via API, notes) are unaffected.
  }

  // Verify and self-heal bucket-default encryption (SSE-S3/AES256), so every object
  // is encrypted at rest even if a future code path forgets to set it per-request.
  try {
    await s3Client.send(
      new PutBucketEncryptionCommand({
        Bucket: bucketName,
        ServerSideEncryptionConfiguration: {
          Rules: [
            {
              ApplyServerSideEncryptionByDefault: { SSEAlgorithm: 'AES256' },
              BucketKeyEnabled: true,
            },
          ],
        },
      })
    );
    logger.info('S3 bucket default encryption (SSE-S3/AES256) verified/applied.');
  } catch (err: any) {
    logger.error('Failed to self-heal S3 bucket default encryption', { error: err.message });
  }

  // Verify and self-heal required prefixes: notes/, uploads/, temp/, trash/
  const requiredPrefixes = ['notes/', 'uploads/', 'temp/', 'trash/'];
  for (const prefix of requiredPrefixes) {
    try {
      const listResp = await s3Client.send(
        new ListObjectsV2Command({
          Bucket: bucketName,
          Prefix: prefix,
          MaxKeys: 1,
        })
      );

      const exists = listResp.Contents && listResp.Contents.length > 0;
      if (!exists) {
        logger.info(`Prefix "${prefix}" is missing in bucket "${bucketName}". Self-healing by creating placeholder...`);
        const transactionId = getTransactionId();
        await s3Client.send(
          new PutObjectCommand({
            Bucket: bucketName,
            Key: `${prefix}.keep`,
            Body: Buffer.from('placeholder'),
            Metadata: transactionId ? { 'transaction-id': transactionId } : undefined,
          })
        );
        logger.info(`Successfully created "${prefix}.keep" placeholder.`);
      }
    } catch (err: any) {
      logger.error(`Failed to self-heal S3 prefix "${prefix}"`, { error: err.message });
      // Don't crash or stop here, try other folders
    }
  }

  isS3Healthy = true;
  s3ErrorDetails = '';
  logger.info('S3 initialization complete.');
}

// Same self-heal rationale as db.ts's ensureDbInitialized: init is deferred until
// POST /health/api, but that in-memory flag is wiped by any process restart (e.g.
// ts-node-dev --respawn in dev), leaving requireS3 permanently rejecting requests
// from an already-logged-in session until the manual trigger is replayed. Retry lazily.
let lazyS3InitPromise: Promise<void> | null = null;
export async function ensureS3Initialized(): Promise<void> {
  if (isS3Healthy || s3ConfigError || !s3Client) return;
  if (!lazyS3InitPromise) {
    lazyS3InitPromise = initS3().finally(() => {
      lazyS3InitPromise = null;
    });
  }
  await lazyS3InitPromise;
}

// AWS retry helper with exponential backoff for transient errors
async function retryAws<T>(fn: () => Promise<T>, retries = 3, delay = 500): Promise<T> {
  try {
    return await fn();
  } catch (err: any) {
    const isTransient = err.$metadata?.httpStatusCode >= HttpStatus.INTERNAL_SERVER_ERROR || err.name === 'TimeoutError' || err.name === 'RequestTimeoutException';
    if (isTransient && retries > 1) {
      logger.warn(`Transient AWS error: ${err.message}. Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      return retryAws(fn, retries - 1, delay * 2);
    }
    throw err;
  }
}

// Helper to generate presigned download URL
export async function getDownloadPresignedUrl(key: string, expiresInSeconds = 900, fileName?: string): Promise<string> {
  if (!s3Client || !bucketName) {
    throw new Error('S3 Client is not initialized.');
  }

  return retryAws(async () => {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
      ...(fileName && {
        ResponseContentDisposition: `attachment; filename="${fileName.replace(/"/g, '')}"`
      })
    });
    return getSignedUrl(s3Client!, command, { expiresIn: expiresInSeconds });
  });
}

// For the in-app file preview (viewer/img/video/audio/pdf) — every other presigned
// URL in this file forces `attachment` so the browser always downloads; this is the
// one deliberate exception, `inline`, so <img>/<video>/<audio>/canvas-PDF can render
// it directly. Callers must only reach this for a narrow, server-side-validated
// allowlist of preview-safe MIME types (see storage.service.ts getFilePreview) —
// never for arbitrary uploaded content.
export async function getInlinePresignedUrl(key: string, expiresInSeconds: number, mimeType?: string): Promise<string> {
  if (!s3Client || !bucketName) {
    throw new Error('S3 Client is not initialized.');
  }

  return retryAws(async () => {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
      ResponseContentDisposition: 'inline',
      ...(mimeType && { ResponseContentType: mimeType }),
    });
    return getSignedUrl(s3Client!, command, { expiresIn: expiresInSeconds });
  });
}

// Presigned download URL that forces a "Save As" (attachment) response and expires
// quickly — used for the "share a link" feature (10-minute validity).
export async function getShareUrl(key: string, fileName: string, expiresInSeconds = 600): Promise<string> {
  if (!s3Client || !bucketName) {
    throw new Error('S3 Client is not initialized.');
  }

  return retryAws(async () => {
    const command = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
      ResponseContentDisposition: `attachment; filename="${fileName.replace(/"/g, '')}"`,
    });
    return getSignedUrl(s3Client!, command, { expiresIn: expiresInSeconds });
  });
}

// Fetch a small leading byte-range of an object — used to run the post-upload
// security scan (magic-byte / embedded-script detection) without ever pulling an
// entire multi-GB object server-side just to inspect it.
export async function getObjectPrefixBytes(key: string, maxBytes = 4096): Promise<Buffer> {
  if (!s3Client || !bucketName) throw new Error('S3 client not initialized');
  try {
    const cmd = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
      Range: `bytes=0-${maxBytes - 1}`,
    });
    const res = await s3Client.send(cmd);
    const byteArray = await res.Body?.transformToByteArray();
    return byteArray ? Buffer.from(byteArray) : Buffer.alloc(0);
  } catch (err: any) {
    if (err.name === 'NoSuchKey') {
      throw new AppError(HttpStatus.NOT_FOUND, 'File not found in storage', 'S3_ERROR');
    }
    logger.error('Failed to get object prefix', { key, error: err.message, stack: err.stack, trxId: getTransactionId() });
    throw new AppError(HttpStatus.INTERNAL_SERVER_ERROR, 'Failed to read file from storage', 'S3_ERROR');
  }
}

export async function getObjectContent(key: string): Promise<string> {
  if (!s3Client || !bucketName) throw new Error('S3 client not initialized');
  try {
    const cmd = new GetObjectCommand({
      Bucket: bucketName,
      Key: key,
    });
    const res = await s3Client.send(cmd);
    return (await res.Body?.transformToString('utf-8')) || '';
  } catch (err: any) {
    if (err.name === 'NoSuchKey') {
      throw new AppError(HttpStatus.NOT_FOUND, 'File not found in storage', 'S3_ERROR');
    }
    logger.error('Failed to get object content', { key, error: err.message, stack: err.stack, trxId: getTransactionId() });
    throw new AppError(HttpStatus.INTERNAL_SERVER_ERROR, 'Failed to read file from storage', 'S3_ERROR');
  }
}

// Helper to generate presigned upload URL (for single-file put)
export async function getUploadPresignedUrl(key: string, mimeType: string, expiresInSeconds = 900): Promise<string> {
  if (!s3Client || !bucketName) {
    throw new Error('S3 Client is not initialized.');
  }

  return retryAws(async () => {
    const transactionId = getTransactionId();
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: mimeType,
      ServerSideEncryption: 'AES256',
      Metadata: transactionId ? { 'transaction-id': transactionId } : undefined,
    });
    return getSignedUrl(s3Client!, command, { expiresIn: expiresInSeconds });
  });
}

// Start multipart upload
export async function createMultipartUpload(key: string, mimeType: string): Promise<string> {
  if (!s3Client || !bucketName) {
    throw new Error('S3 Client is not initialized.');
  }

  return retryAws(async () => {
    const transactionId = getTransactionId();
    const command = new CreateMultipartUploadCommand({
      Bucket: bucketName,
      Key: key,
      ContentType: mimeType,
      ServerSideEncryption: 'AES256',
      Metadata: transactionId ? { 'transaction-id': transactionId } : undefined,
    });
    const resp = await s3Client!.send(command);
    if (!resp.UploadId) throw new Error('Failed to get UploadId from S3.');
    return resp.UploadId;
  });
}

// Presign upload part URL
export async function getUploadPartPresignedUrl(
  key: string,
  uploadId: string,
  partNumber: number,
  expiresInSeconds = 900
): Promise<string> {
  if (!s3Client || !bucketName) {
    throw new Error('S3 Client is not initialized.');
  }

  return retryAws(async () => {
    const command = new UploadPartCommand({
      Bucket: bucketName,
      Key: key,
      UploadId: uploadId,
      PartNumber: partNumber,
    });
    return getSignedUrl(s3Client!, command, { expiresIn: expiresInSeconds });
  });
}

// Complete multipart upload
export async function completeMultipartUpload(
  key: string,
  uploadId: string,
  parts: { ETag: string; PartNumber: number }[]
): Promise<void> {
  if (!s3Client || !bucketName) {
    throw new Error('S3 Client is not initialized.');
  }

  await retryAws(async () => {
    const command = new CompleteMultipartUploadCommand({
      Bucket: bucketName,
      Key: key,
      UploadId: uploadId,
      MultipartUpload: {
        Parts: parts.sort((a, b) => a.PartNumber - b.PartNumber),
      },
    });
    await s3Client!.send(command);
  });
}

// Abort multipart upload (for cleanup)
export async function abortMultipartUpload(key: string, uploadId: string): Promise<void> {
  if (!s3Client || !bucketName) {
    throw new Error('S3 Client is not initialized.');
  }

  await retryAws(async () => {
    const command = new AbortMultipartUploadCommand({
      Bucket: bucketName,
      Key: key,
      UploadId: uploadId,
    });
    await s3Client!.send(command);
  });
}

// Delete a single object (used for permanent file deletion and rejected uploads)
export async function deleteObject(key: string): Promise<void> {
  if (!s3Client || !bucketName) {
    throw new Error('S3 Client is not initialized.');
  }
  const { DeleteObjectCommand } = await import('@aws-sdk/client-s3');
  await retryAws(async () => {
    await s3Client!.send(new DeleteObjectCommand({ Bucket: bucketName, Key: key }));
  });
}

// Direct put object (e.g. for small text notes)
export async function putObjectDirect(key: string, content: string, mimeType = 'text/plain'): Promise<void> {
  if (!s3Client || !bucketName) {
    throw new Error('S3 Client is not initialized.');
  }

  await retryAws(async () => {
    const transactionId = getTransactionId();
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: Buffer.from(content),
      ContentType: mimeType,
      ServerSideEncryption: 'AES256',
      Metadata: transactionId ? { 'transaction-id': transactionId } : undefined,
    });
    await s3Client!.send(command);
  });
}

// Direct put for binary content (e.g. profile avatars) — small enough to go
// through the server (already validated in memory) rather than a presigned
// direct-to-S3 upload, so the content can be fully checked before it ever
// reaches the bucket.
export async function putBinaryObject(key: string, data: Buffer, mimeType: string): Promise<void> {
  if (!s3Client || !bucketName) {
    throw new Error('S3 Client is not initialized.');
  }

  await retryAws(async () => {
    const transactionId = getTransactionId();
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: data,
      ContentType: mimeType,
      ServerSideEncryption: 'AES256',
      Metadata: transactionId ? { 'transaction-id': transactionId } : undefined,
    });
    await s3Client!.send(command);
  });
}
