export interface JwtDecoded {
  header: unknown;
  payload: unknown;
  signature: string;
  rawHeader: string;
  rawPayload: string;
}

function base64UrlDecodeToString(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}

function base64UrlEncode(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeJwt(token: string): JwtDecoded | null {
  const parts = token.trim().split('.');
  if (parts.length !== 3) return null;
  try {
    const rawHeader = base64UrlDecodeToString(parts[0]);
    const rawPayload = base64UrlDecodeToString(parts[1]);
    return {
      header: JSON.parse(rawHeader),
      payload: JSON.parse(rawPayload),
      signature: parts[2],
      rawHeader,
      rawPayload,
    };
  } catch {
    return null;
  }
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const cleanPem = pem.replace(/-----BEGIN [A-Z ]+-----/, '').replace(/-----END [A-Z ]+-----/, '').replace(/\s+/g, '');
  const binary = atob(cleanPem);
  const buffer = new ArrayBuffer(binary.length);
  const view = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i++) view[i] = binary.charCodeAt(i);
  return buffer;
}

export async function verifyJwtSignature(token: string, secretOrKey: string, algorithm: string): Promise<boolean> {
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  const data = new TextEncoder().encode(`${parts[0]}.${parts[1]}`);
  let sigBase64 = parts[2].replace(/-/g, '+').replace(/_/g, '/');
  while (sigBase64.length % 4) sigBase64 += '=';
  const signatureBytes = new Uint8Array(atob(sigBase64).split('').map((c) => c.charCodeAt(0)));

  if (algorithm.startsWith('HS')) {
    const hashName = algorithm === 'HS384' ? 'SHA-384' : algorithm === 'HS512' ? 'SHA-512' : 'SHA-256';
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secretOrKey), { name: 'HMAC', hash: { name: hashName } }, false, ['verify']);
    return crypto.subtle.verify('HMAC', key, signatureBytes, data);
  }
  if (algorithm.startsWith('RS') && secretOrKey.includes('-----BEGIN PUBLIC KEY-----')) {
    const keyBuffer = pemToArrayBuffer(secretOrKey);
    const key = await crypto.subtle.importKey('spki', keyBuffer, { name: 'RSASSA-PKCS1-v1_5', hash: { name: 'SHA-256' } }, false, ['verify']);
    return crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, signatureBytes, data);
  }
  throw new Error(`Unsupported algorithm or key format: ${algorithm}`);
}

export async function signJwt(header: Record<string, unknown>, payload: Record<string, unknown>, secretOrKey: string): Promise<string> {
  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(payload));
  const data = new TextEncoder().encode(`${headerB64}.${payloadB64}`);
  const algorithm = (header.alg as string) || 'HS256';

  let signatureBuffer: ArrayBuffer;
  if (algorithm.startsWith('HS')) {
    const hashName = algorithm === 'HS384' ? 'SHA-384' : algorithm === 'HS512' ? 'SHA-512' : 'SHA-256';
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secretOrKey), { name: 'HMAC', hash: { name: hashName } }, false, ['sign']);
    signatureBuffer = await crypto.subtle.sign('HMAC', key, data);
  } else if (algorithm.startsWith('RS') && secretOrKey.includes('-----BEGIN PRIVATE KEY-----')) {
    const keyBuffer = pemToArrayBuffer(secretOrKey);
    const key = await crypto.subtle.importKey('pkcs8', keyBuffer, { name: 'RSASSA-PKCS1-v1_5', hash: { name: 'SHA-256' } }, false, ['sign']);
    signatureBuffer = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, data);
  } else {
    throw new Error(`Unsupported algorithm or key format: ${algorithm}. Use HS256/384/512 with a secret, or RS256 with a PKCS8 private key.`);
  }

  const signatureBytes = new Uint8Array(signatureBuffer);
  let binary = '';
  for (let i = 0; i < signatureBytes.byteLength; i++) binary += String.fromCharCode(signatureBytes[i]);
  const signatureB64 = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${headerB64}.${payloadB64}.${signatureB64}`;
}
