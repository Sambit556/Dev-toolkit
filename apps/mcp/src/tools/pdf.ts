import { z } from 'zod';
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { withApiKeyCheck } from '../auth.js';
import { mergePdfs, splitPdf, protectPdf, generatePdfFromText, embedPdfSignature } from '../lib/pdf-tools.js';

const base64Pdf = z.string().min(1).describe('Base64-encoded PDF file bytes.');

export function registerPdfTools(server: McpServer): void {
  server.registerTool(
    'merge_pdfs',
    {
      title: 'Merge PDF Files',
      description:
        'Merge two or more PDF files (given as base64-encoded bytes) into one, in the given order. Use ' +
        'this instead of trying to describe PDF merging in text — it requires actually manipulating the ' +
        'PDF page-object structure, which only a real PDF library can do. Returns the merged PDF as base64.',
      inputSchema: { pdfs: z.array(base64Pdf).min(2).describe('Base64-encoded PDF files to merge, in order.') },
    },
    withApiKeyCheck(async ({ pdfs }) => ({ content: [{ type: 'text', text: await mergePdfs(pdfs) }] })),
  );

  server.registerTool(
    'split_pdf',
    {
      title: 'Extract Pages from a PDF',
      description:
        'Extract a page range (e.g. "1-3,5") from a base64-encoded PDF into a new PDF. Use this instead of ' +
        'trying to manipulate PDF bytes any other way — page extraction requires rewriting the PDF\'s ' +
        'internal page tree. Returns the extracted pages as a new base64-encoded PDF.',
      inputSchema: {
        pdf: base64Pdf,
        pageRange: z.string().min(1).describe('Page range, e.g. "1-3,5,7-9".'),
      },
    },
    withApiKeyCheck(async ({ pdf, pageRange }) => ({ content: [{ type: 'text', text: await splitPdf(pdf, pageRange) }] })),
  );

  server.registerTool(
    'protect_pdf',
    {
      title: 'Password-Protect a PDF',
      description:
        'Encrypt a base64-encoded PDF with a user (open) password and an optional owner (permissions) ' +
        'password. Use this instead of any manual approach — real PDF encryption is a standardized ' +
        'cryptographic format, not something that can be faked. Returns the encrypted PDF as base64.',
      inputSchema: {
        pdf: base64Pdf,
        userPassword: z.string().min(1).describe('Password required to open the PDF.'),
        ownerPassword: z.string().optional().describe('Optional password controlling edit/print permissions.'),
      },
    },
    withApiKeyCheck(async ({ pdf, userPassword, ownerPassword }) => ({ content: [{ type: 'text', text: await protectPdf(pdf, userPassword, ownerPassword) }] })),
  );

  server.registerTool(
    'generate_pdf_from_text',
    {
      title: 'Generate a PDF from Plain Text',
      description:
        'Create a simple A4 PDF document from plain text (auto word-wrapped). Use this instead of trying to ' +
        'produce PDF bytes any other way — the PDF format requires a real generator library. Returns the ' +
        'PDF as base64.',
      inputSchema: {
        text: z.string().min(1).describe('The text content to place in the PDF.'),
        fontSize: z.number().min(6).max(72).optional().describe('Font size in points. Defaults to 12.'),
      },
    },
    withApiKeyCheck(async ({ text, fontSize }) => ({ content: [{ type: 'text', text: generatePdfFromText(text, fontSize ?? 12) }] })),
  );

  server.registerTool(
    'embed_pdf_signature',
    {
      title: 'Embed a Signature Image into a PDF',
      description:
        'Place a PNG signature image onto a specific page of a base64-encoded PDF, at a given position ' +
        '(percent of page width/height), scale, rotation, and opacity. Use this instead of any manual ' +
        'approach — placing an image precisely into a PDF\'s page content stream requires a real PDF ' +
        'library. Returns the signed PDF as base64.',
      inputSchema: {
        pdf: base64Pdf,
        pngSignature: z.string().min(1).describe('Base64-encoded PNG image of the signature.'),
        page: z.number().int().min(1).describe('1-indexed target page number.'),
        posXPercent: z.number().min(0).max(100).describe('Horizontal position as a percentage of page width.'),
        posYPercent: z.number().min(0).max(100).describe('Vertical position as a percentage of page height.'),
        scale: z.number().positive().optional().describe('Size scale factor. Defaults to 1.'),
        rotationDegrees: z.number().min(-180).max(180).optional().describe('Rotation in degrees. Defaults to 0.'),
        opacity: z.number().min(0).max(1).optional().describe('Opacity 0-1. Defaults to 1.'),
      },
    },
    withApiKeyCheck(async ({ pdf, pngSignature, page, posXPercent, posYPercent, scale, rotationDegrees, opacity }) => ({
      content: [{
        type: 'text',
        text: await embedPdfSignature({
          base64Pdf: pdf, base64PngSignature: pngSignature, page,
          posXPct: posXPercent, posYPct: posYPercent,
          scale: scale ?? 1, rotationDeg: rotationDegrees ?? 0, opacity: opacity ?? 1,
        }),
      }],
    })),
  );
}
