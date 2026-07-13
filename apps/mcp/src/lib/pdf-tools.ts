import { PDFDocument, degrees } from 'pdf-lib';
import { encryptPDF } from '@pdfsmaller/pdf-encrypt-lite';
import { jsPDF } from 'jspdf';

function parsePageRange(rangeStr: string, maxPages: number): number[] {
  const pages: number[] = [];
  for (const part of rangeStr.split(',')) {
    const trimmed = part.trim();
    if (trimmed.includes('-')) {
      const [startStr, endStr] = trimmed.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (!Number.isNaN(start) && !Number.isNaN(end)) {
        for (let i = Math.max(1, start); i <= Math.min(maxPages, end); i++) pages.push(i - 1);
      }
    } else {
      const num = parseInt(trimmed, 10);
      if (!Number.isNaN(num) && num >= 1 && num <= maxPages) pages.push(num - 1);
    }
  }
  return Array.from(new Set(pages)).sort((a, b) => a - b);
}

/** Merges PDFs given as base64-encoded byte strings. Returns the merged PDF as base64. */
export async function mergePdfs(base64Pdfs: string[]): Promise<string> {
  if (base64Pdfs.length < 2) throw new Error('At least 2 PDFs are required to merge');
  const merged = await PDFDocument.create();
  for (const b64 of base64Pdfs) {
    const src = await PDFDocument.load(Buffer.from(b64, 'base64'));
    const pages = await merged.copyPages(src, src.getPageIndices());
    pages.forEach((p) => merged.addPage(p));
  }
  return Buffer.from(await merged.save()).toString('base64');
}

/** Extracts a page range (e.g. "1-3,5") from a base64-encoded PDF. Returns the result as base64. */
export async function splitPdf(base64Pdf: string, rangeStr: string): Promise<string> {
  const src = await PDFDocument.load(Buffer.from(base64Pdf, 'base64'));
  const targetPages = parsePageRange(rangeStr, src.getPageCount());
  if (targetPages.length === 0) throw new Error(`Invalid or empty page range: "${rangeStr}"`);
  const out = await PDFDocument.create();
  const pages = await out.copyPages(src, targetPages);
  pages.forEach((p) => out.addPage(p));
  return Buffer.from(await out.save()).toString('base64');
}

/** Password-protects a base64-encoded PDF. Returns the encrypted PDF as base64. */
export async function protectPdf(base64Pdf: string, userPassword: string, ownerPassword?: string): Promise<string> {
  if (!userPassword) throw new Error('A user password is required');
  const src = await PDFDocument.load(Buffer.from(base64Pdf, 'base64'));
  const bytes = await src.save();
  const protectedBytes = await encryptPDF(bytes, userPassword, ownerPassword || undefined);
  return Buffer.from(protectedBytes).toString('base64');
}

/** Generates a simple text PDF. Returns the PDF as base64. */
export function generatePdfFromText(text: string, fontSize = 12): string {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'a4' });
  doc.setFontSize(fontSize);
  const splitText = doc.splitTextToSize(text, 500);
  doc.text(splitText, 45, 60);
  const arrayBuffer = doc.output('arraybuffer') as ArrayBuffer;
  return Buffer.from(arrayBuffer).toString('base64');
}

/** Embeds a PNG signature image (base64) into a base64-encoded PDF at a given page/position. Returns the result as base64. */
export async function embedPdfSignature(opts: {
  base64Pdf: string;
  base64PngSignature: string;
  page: number;
  posXPct: number;
  posYPct: number;
  scale: number;
  rotationDeg: number;
  opacity: number;
}): Promise<string> {
  const pdfDoc = await PDFDocument.load(Buffer.from(opts.base64Pdf, 'base64'));
  const totalPages = pdfDoc.getPageCount();
  const pageIndex = Math.max(0, Math.min(totalPages - 1, opts.page - 1));
  const page = pdfDoc.getPages()[pageIndex];
  const { width: pageWidth, height: pageHeight } = page.getSize();

  const sigImg = await pdfDoc.embedPng(Buffer.from(opts.base64PngSignature, 'base64'));
  const aspect = sigImg.width / sigImg.height;
  const defaultWidth = 150;
  const drawWidth = defaultWidth * opts.scale;
  const drawHeight = (defaultWidth / aspect) * opts.scale;
  const pdfX = (opts.posXPct / 100) * pageWidth - drawWidth / 2;
  const pdfY = (1 - opts.posYPct / 100) * pageHeight - drawHeight / 2;

  page.drawImage(sigImg, {
    x: pdfX, y: pdfY, width: drawWidth, height: drawHeight,
    rotate: degrees(opts.rotationDeg), opacity: opts.opacity,
  });

  return Buffer.from(await pdfDoc.save()).toString('base64');
}
