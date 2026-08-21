'use client';

import { jsPDF } from 'jspdf';
import { marked } from 'marked';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';

// Safe dynamic loader for docx
async function getDocx() {
  const mod: any = await import('docx');
  return {
    Document: mod.Document || mod.default?.Document,
    Packer: mod.Packer || mod.default?.Packer,
    Paragraph: mod.Paragraph || mod.default?.Paragraph,
    TextRun: mod.TextRun || mod.default?.TextRun,
    HeadingLevel: mod.HeadingLevel || mod.default?.HeadingLevel,
  };
}

// Safe dynamic loader for pdfjs
async function getPdfJs() {
  const { pdfjs } = await import('react-pdf');
  if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
    try {
      pdfjs.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
    } catch {
      pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjs.version || '5.4.296'}/build/pdf.worker.min.mjs`;
    }
  }
  return pdfjs;
}

/**
 * Extracts raw text and HTML from a Word .docx document using JSZip and OpenXML parsing.
 */
export async function extractDocxContent(file: File): Promise<{
  text: string;
  html: string;
  markdown: string;
}> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    const documentXmlFile = zip.file('word/document.xml');

    if (documentXmlFile) {
      const xml = await documentXmlFile.async('text');
      const paragraphs: string[] = [];

      // Match all paragraph tags <w:p>
      const pRegex = /<w:p(?:\s[^>]*)?>([\s\S]*?)<\/w:p>/g;
      let pMatch;

      while ((pMatch = pRegex.exec(xml)) !== null) {
        const pContent = pMatch[1];
        // Match all text nodes <w:t>
        const tRegex = /<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g;
        let tMatch;
        let pText = '';
        while ((tMatch = tRegex.exec(pContent)) !== null) {
          pText += tMatch[1];
        }
        if (pText.trim()) {
          paragraphs.push(pText.trim());
        }
      }

      const text = paragraphs.join('\n\n') || `Content from ${file.name}`;
      const html = paragraphs.map((p) => `<p>${p}</p>`).join('\n');
      const markdown = paragraphs.join('\n\n');

      return { text, html, markdown };
    }
  } catch (err) {
    console.warn('Word docx extraction fallback:', err);
  }

  // Fallback to plain text read
  const fallbackText = await file.text().catch(() => `Document content from ${file.name}`);
  return {
    text: fallbackText,
    html: `<p>${fallbackText}</p>`,
    markdown: fallbackText,
  };
}

/**
 * Strips RTF control words and extracts plain text.
 */
export function rtfToPlainText(rtf: string): string {
  let text = rtf;
  // Remove binary data blocks
  text = text.replace(/\\bin\d+ /g, '');
  // Remove font tables, color tables, stylesheets, generator info
  text = text.replace(/{\\fonttbl[\s\S]*?}/gi, '');
  text = text.replace(/{\\colortbl[\s\S]*?}/gi, '');
  text = text.replace(/{\\stylesheet[\s\S]*?}/gi, '');
  text = text.replace(/{\\info[\s\S]*?}/gi, '');
  text = text.replace(/{\\\*[\s\S]*?}/g, '');
  
  // Replace line breaks and paragraph breaks
  text = text.replace(/\\par(\r\n|\r|\n| )/g, '\n');
  text = text.replace(/\\line(\r\n|\r|\n| )/g, '\n');
  text = text.replace(/\\tab(\r\n|\r|\n| )/g, '\t');
  
  // Handle Unicode hex escapes \'xx
  text = text.replace(/\\'([0-9a-fA-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  // Handle Unicode \uN escapes
  text = text.replace(/\\u([0-9]{2,5})\??/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
  
  // Remove remaining RTF control words
  text = text.replace(/\\[a-zA-Z]+(-?\d+)? ?/g, '');
  // Remove remaining group brackets
  text = text.replace(/[{}]/g, '');
  
  return text.trim();
}

/**
 * Extracts plain text from an EPUB file (zipped XHTML spine).
 */
export async function extractTextFromEpub(file: File): Promise<{ text: string; title: string }> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);
  
  // Find container.xml to locate rootfile OPF
  let opfPath = '';
  const containerFile = zip.file('META-INF/container.xml');
  if (containerFile) {
    const containerXml = await containerFile.async('text');
    const parser = new DOMParser();
    const doc = parser.parseFromString(containerXml, 'application/xml');
    const rootfile = doc.querySelector('rootfile');
    if (rootfile) {
      opfPath = rootfile.getAttribute('full-path') || '';
    }
  }

  let textContent: string[] = [];
  let title = file.name.replace(/\.epub$/i, '');

  if (opfPath && zip.file(opfPath)) {
    const opfXml = await zip.file(opfPath)!.async('text');
    const parser = new DOMParser();
    const opfDoc = parser.parseFromString(opfXml, 'application/xml');
    
    const titleEl = opfDoc.querySelector('title');
    if (titleEl && titleEl.textContent) title = titleEl.textContent;

    const basePath = opfPath.includes('/') ? opfPath.substring(0, opfPath.lastIndexOf('/') + 1) : '';
    const manifestItems = new Map<string, string>();
    opfDoc.querySelectorAll('manifest > item').forEach((item) => {
      const id = item.getAttribute('id');
      const href = item.getAttribute('href');
      if (id && href) manifestItems.set(id, basePath + href);
    });

    const spineItemrefs = opfDoc.querySelectorAll('spine > itemref');
    for (let i = 0; i < spineItemrefs.length; i++) {
      const idref = spineItemrefs[i].getAttribute('idref');
      if (idref && manifestItems.has(idref)) {
        const filePath = manifestItems.get(idref)!;
        const chapterFile = zip.file(filePath);
        if (chapterFile) {
          const html = await chapterFile.async('text');
          const doc = parser.parseFromString(html, 'text/html');
          const chapterText = doc.body.innerText || doc.body.textContent || '';
          if (chapterText.trim()) {
            textContent.push(chapterText.trim());
          }
        }
      }
    }
  }

  // Fallback if spine wasn't parsed: read all html/xhtml files
  if (textContent.length === 0) {
    const parser = new DOMParser();
    for (const [filename, zipEntry] of Object.entries(zip.files)) {
      if ((filename.endsWith('.xhtml') || filename.endsWith('.html')) && !filename.startsWith('__MACOSX')) {
        const html = await zipEntry.async('text');
        const doc = parser.parseFromString(html, 'text/html');
        const chapterText = doc.body.innerText || doc.body.textContent || '';
        if (chapterText.trim()) textContent.push(chapterText.trim());
      }
    }
  }

  return {
    title,
    text: textContent.join('\n\n--- Page Break ---\n\n') || 'No readable text content found in EPUB.',
  };
}

/**
 * Creates a clean formatted .docx Word document from plain text or lines.
 */
export async function createDocxFromText(title: string, text: string): Promise<Blob> {
  const { Document: DocxDocument, Packer, Paragraph, TextRun, HeadingLevel } = await getDocx();
  const paragraphs: any[] = [];

  if (title) {
    paragraphs.push(
      new Paragraph({
        text: title,
        heading: HeadingLevel?.TITLE || 'Title',
        spacing: { after: 300 },
      })
    );
  }

  const lines = text.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      paragraphs.push(new Paragraph({ text: '', spacing: { after: 120 } }));
      continue;
    }

    if (trimmed.startsWith('# ')) {
      paragraphs.push(
        new Paragraph({
          text: trimmed.replace(/^#\s+/, ''),
          heading: HeadingLevel?.HEADING_1 || 'Heading1',
          spacing: { before: 240, after: 120 },
        })
      );
    } else if (trimmed.startsWith('## ')) {
      paragraphs.push(
        new Paragraph({
          text: trimmed.replace(/^##\s+/, ''),
          heading: HeadingLevel?.HEADING_2 || 'Heading2',
          spacing: { before: 200, after: 100 },
        })
      );
    } else if (trimmed.startsWith('### ')) {
      paragraphs.push(
        new Paragraph({
          text: trimmed.replace(/^###\s+/, ''),
          heading: HeadingLevel?.HEADING_3 || 'Heading3',
          spacing: { before: 160, after: 80 },
        })
      );
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun(trimmed.replace(/^[-*]\s+/, ''))],
          bullet: { level: 0 },
          spacing: { after: 80 },
        })
      );
    } else {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun(trimmed)],
          spacing: { after: 120 },
        })
      );
    }
  }

  const doc = new DocxDocument({
    sections: [
      {
        properties: {},
        children: paragraphs,
      },
    ],
  });

  const rawDocxBlob = await Packer.toBlob(doc);
  return new Blob([rawDocxBlob], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
}

/**
 * Extracts plain text, pages, and metadata from a PDF file with multi-layer fallback.
 */
export async function extractPdfContent(file: File): Promise<{
  text: string;
  pageCount: number;
  pagesText: string[];
}> {
  const arrayBuffer = await file.arrayBuffer();
  const uint8Data = new Uint8Array(arrayBuffer);

  // Layer 1: PDF.js renderer
  try {
    const pdfjs = await getPdfJs();
    const loadingTask = pdfjs.getDocument({
      data: uint8Data,
      useSystemFonts: true,
      stopAtErrors: false,
    });
    const pdfDoc = await loadingTask.promise;
    const numPages = pdfDoc.numPages;
    const pagesText: string[] = [];

    for (let i = 1; i <= numPages; i++) {
      const page = await pdfDoc.getPage(i);
      const textContent = await page.getTextContent();
      const pageStrings = textContent.items
        .map((item: any) => (item && item.str !== undefined ? item.str : ''))
        .join(' ');
      pagesText.push(pageStrings.trim());
    }

    const fullText = pagesText.join('\n\n--- Page Break ---\n\n').trim();
    if (fullText.length > 0) {
      return {
        pageCount: numPages,
        pagesText,
        text: fullText,
      };
    }
  } catch (pdfJsErr) {
    console.warn('PDF.js text parsing error, attempting fallback parser', pdfJsErr);
  }

  // Layer 2: PDF-Lib & Binary Text Extraction Fallback
  try {
    const { PDFDocument } = await import('pdf-lib');
    const pdfDoc = await PDFDocument.load(uint8Data, { ignoreEncryption: true });
    const numPages = pdfDoc.getPageCount();

    const decoder = new TextDecoder('latin1');
    const rawString = decoder.decode(uint8Data);
    
    const textMatches: string[] = [];
    const btRegex = /BT[\s\S]*?ET/g;
    let match;
    while ((match = btRegex.exec(rawString)) !== null) {
      const block = match[0];
      const stringLiteralRegex = /\(([^)]+)\)/g;
      let strMatch;
      while ((strMatch = stringLiteralRegex.exec(block)) !== null) {
        textMatches.push(strMatch[1]);
      }
    }

    const fallbackText = textMatches.join(' ').replace(/\\([()\\])/g, '$1').trim() || `Extracted content from ${file.name}`;
    return {
      pageCount: numPages,
      pagesText: [fallbackText],
      text: fallbackText,
    };
  } catch (pdfLibErr) {
    console.warn('PDF-Lib parser failed', pdfLibErr);
  }

  return {
    pageCount: 1,
    pagesText: [`Extracted text from ${file.name}`],
    text: `Extracted text from ${file.name}`,
  };
}

/**
 * Render all pages of a PDF to Canvas and output as JPG or PNG images (or ZIP for multi-page).
 */
export async function renderPdfToImages(
  file: File,
  format: 'png' | 'jpg'
): Promise<{ blob: Blob; filename: string; isZip: boolean }> {
  const pdfjs = await getPdfJs();
  const arrayBuffer = await file.arrayBuffer();
  const uint8Data = new Uint8Array(arrayBuffer);
  const loadingTask = pdfjs.getDocument({ data: uint8Data });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;
  const baseName = file.name.replace(/\.pdf$/i, '');
  const mime = format === 'png' ? 'image/png' : 'image/jpeg';
  const ext = format === 'png' ? 'png' : 'jpg';

  if (numPages === 1) {
    const page = await pdfDoc.getPage(1);
    const viewport = page.getViewport({ scale: 2.0 }); // 2x scale for sharp output
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Could not create canvas context');

    if (format === 'jpg') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    await (page.render as any)({ canvasContext: ctx, viewport, canvas }).promise;

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Canvas export failed'))), mime, 0.95);
    });

    return { blob, filename: `${baseName}.${ext}`, isZip: false };
  }

  // Multi-page PDF: bundle all rendered pages into a ZIP archive
  const zip = new JSZip();
  for (let i = 1; i <= numPages; i++) {
    const page = await pdfDoc.getPage(i);
    const viewport = page.getViewport({ scale: 2.0 });
    const canvas = document.createElement('canvas');
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;

    if (format === 'jpg') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    await (page.render as any)({ canvasContext: ctx, viewport, canvas }).promise;

    const pageBlob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b || new Blob([])), mime, 0.95);
    });

    const pageNumPad = String(i).padStart(3, '0');
    zip.file(`${baseName}_page_${pageNumPad}.${ext}`, pageBlob);
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  return { blob: zipBlob, filename: `${baseName}_pages_${ext}.zip`, isZip: true };
}

/**
 * Generate a styled PDF from plain text with multi-page line wrapping.
 */
export function generatePdfFromText(title: string, text: string): Blob {
  const doc = new jsPDF({
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const maxLineWidth = pageWidth - margin * 2;
  let cursorY = margin + 20;

  // Title header
  if (title) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(33, 37, 41);
    doc.text(title, margin, cursorY);
    cursorY += 24;

    doc.setDrawColor(220, 224, 230);
    doc.setLineWidth(1);
    doc.line(margin, cursorY - 10, pageWidth - margin, cursorY - 10);
    cursorY += 10;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(50, 50, 50);

  const lines = text.split('\n');

  for (const rawLine of lines) {
    if (cursorY > pageHeight - margin) {
      doc.addPage();
      cursorY = margin + 20;
    }

    if (!rawLine.trim()) {
      cursorY += 10;
      continue;
    }

    const wrappedLines = doc.splitTextToSize(rawLine, maxLineWidth);
    for (const subLine of wrappedLines) {
      if (cursorY > pageHeight - margin) {
        doc.addPage();
        cursorY = margin + 20;
      }
      doc.text(subLine, margin, cursorY);
      cursorY += 14;
    }
  }

  return new Blob([doc.output('blob')], { type: 'application/pdf' });
}

/**
 * Converts Excel or CSV data into formatted PDF table grid with responsive column sizing.
 */
export function generatePdfFromTable(title: string, headers: string[], rows: any[][]): Blob {
  const cleanHeaders = headers && headers.length > 0 ? headers.map(String) : (rows[0] ? rows[0].map((_, i) => `Column ${i + 1}`) : ['Data']);
  const cleanRows = rows && rows.length > 0 ? rows : [];
  const isWide = cleanHeaders.length > 4;

  const doc = new jsPDF({
    unit: 'pt',
    format: 'a4',
    orientation: isWide ? 'landscape' : 'portrait',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 24;
  let cursorY = margin + 20;

  // Header Title
  if (title) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(20, 24, 33);
    doc.text(title.substring(0, 90), margin, cursorY);
    cursorY += 20;
  }

  const numCols = Math.max(cleanHeaders.length, 1);
  const colWidth = (pageWidth - margin * 2) / numCols;
  const rowHeight = 20;
  const maxCharPerCell = Math.max(5, Math.floor(colWidth / 4.8));
  const fontSize = Math.max(6, Math.min(9, 72 / numCols));

  const drawHeaderRow = () => {
    doc.setFillColor(240, 243, 246);
    doc.rect(margin, cursorY, pageWidth - margin * 2, rowHeight, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(fontSize);
    doc.setTextColor(30, 35, 45);

    cleanHeaders.forEach((h, idx) => {
      const rawText = String(h || '').replace(/[\r\n]+/g, ' ').trim();
      const text = rawText.length > maxCharPerCell ? rawText.substring(0, maxCharPerCell - 1) + '…' : rawText;
      doc.text(text, margin + idx * colWidth + 4, cursorY + 13);
    });
    cursorY += rowHeight;
  };

  drawHeaderRow();

  // Table Rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(fontSize);
  doc.setTextColor(60, 64, 72);

  cleanRows.forEach((row, rowIndex) => {
    if (cursorY > pageHeight - margin - 30) {
      doc.addPage();
      cursorY = margin + 20;
      drawHeaderRow();
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(fontSize);
      doc.setTextColor(60, 64, 72);
    }

    if (rowIndex % 2 === 1) {
      doc.setFillColor(249, 250, 252);
      doc.rect(margin, cursorY, pageWidth - margin * 2, rowHeight, 'F');
    }

    cleanHeaders.forEach((_, colIndex) => {
      const rawVal = row && row[colIndex] !== undefined && row[colIndex] !== null ? String(row[colIndex]) : '';
      const cleanVal = rawVal.replace(/[\r\n]+/g, ' ').trim();
      const text = cleanVal.length > maxCharPerCell ? cleanVal.substring(0, maxCharPerCell - 1) + '…' : cleanVal;
      doc.text(text, margin + colIndex * colWidth + 4, cursorY + 13);
    });

    // Horizontal row separator line
    doc.setDrawColor(230, 233, 238);
    doc.setLineWidth(0.5);
    doc.line(margin, cursorY + rowHeight, pageWidth - margin, cursorY + rowHeight);

    cursorY += rowHeight;
  });

  return new Blob([doc.output('blob')], { type: 'application/pdf' });
}

export interface PptxSlideData {
  slideNumber: number;
  title: string;
  content: string[];
  allText: string;
}

/**
 * Extracts slides, titles, and text from a PowerPoint (.pptx) file.
 */
export async function extractPptxContent(file: File): Promise<{
  slideCount: number;
  slides: PptxSlideData[];
  fullText: string;
  markdown: string;
}> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);

    // Find and sort all slide XML files
    const slideFiles = Object.keys(zip.files)
      .filter((name) => name.startsWith('ppt/slides/slide') && name.endsWith('.xml'))
      .sort((a, b) => {
        const numA = parseInt(a.match(/slide(\d+)\.xml/)?.[1] || '0', 10);
        const numB = parseInt(b.match(/slide(\d+)\.xml/)?.[1] || '0', 10);
        return numA - numB;
      });

    const slides: PptxSlideData[] = [];

    for (let i = 0; i < slideFiles.length; i++) {
      const fileName = slideFiles[i];
      const xml = await zip.file(fileName)!.async('text');
      const slideNumber = i + 1;

      const paragraphs: string[] = [];
      const pRegex = /<a:p(?:\s[^>]*)?>([\s\S]*?)<\/a:p>/g;
      let pMatch;

      while ((pMatch = pRegex.exec(xml)) !== null) {
        const pContent = pMatch[1];
        const tRegex = /<a:t(?:\s[^>]*)?>([\s\S]*?)<\/a:t>/g;
        let tMatch;
        let pText = '';
        while ((tMatch = tRegex.exec(pContent)) !== null) {
          pText += tMatch[1];
        }
        if (pText.trim()) {
          paragraphs.push(pText.trim());
        }
      }

      const title = paragraphs[0] || `Slide ${slideNumber}`;
      const content = paragraphs.slice(1);
      slides.push({
        slideNumber,
        title,
        content,
        allText: paragraphs.join('\n'),
      });
    }

    if (slides.length > 0) {
      const fullText = slides
        .map((s) => `--- Slide ${s.slideNumber}: ${s.title} ---\n${s.allText}`)
        .join('\n\n');

      const markdown = slides
        .map((s) => `## Slide ${s.slideNumber}: ${s.title}\n\n${s.content.map((c) => `- ${c}`).join('\n')}`)
        .join('\n\n---\n\n');

      return {
        slideCount: slides.length,
        slides,
        fullText,
        markdown,
      };
    }
  } catch (err) {
    console.warn('PPTX parsing fallback:', err);
  }

  const fallbackText = await file.text().catch(() => `PowerPoint presentation: ${file.name}`);
  return {
    slideCount: 1,
    slides: [{ slideNumber: 1, title: file.name, content: [fallbackText], allText: fallbackText }],
    fullText: fallbackText,
    markdown: `# ${file.name}\n\n${fallbackText}`,
  };
}

/**
 * Creates a clean formatted Word (.docx) document from PowerPoint slides.
 */
export async function createDocxFromSlides(title: string, slides: PptxSlideData[]): Promise<Blob> {
  const { Document: DocxDocument, Packer, Paragraph, TextRun, HeadingLevel } = await getDocx();
  const paragraphs: any[] = [];

  if (title) {
    paragraphs.push(
      new Paragraph({
        text: title,
        heading: HeadingLevel?.TITLE || 'Title',
        spacing: { after: 300 },
      })
    );
  }

  slides.forEach((slide) => {
    // Slide Header
    paragraphs.push(
      new Paragraph({
        text: `Slide ${slide.slideNumber}: ${slide.title}`,
        heading: HeadingLevel?.HEADING_1 || 'Heading1',
        spacing: { before: 240, after: 120 },
      })
    );

    // Slide Content Items
    if (slide.content.length === 0 && slide.allText) {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun(slide.allText)],
          spacing: { after: 100 },
        })
      );
    } else {
      slide.content.forEach((item) => {
        paragraphs.push(
          new Paragraph({
            children: [new TextRun(item)],
            bullet: { level: 0 },
            spacing: { after: 80 },
          })
        );
      });
    }
  });

  const doc = new DocxDocument({
    sections: [{ properties: {}, children: paragraphs }],
  });

  const rawDocxBlob = await Packer.toBlob(doc);
  return new Blob([rawDocxBlob], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
}

/**
 * Creates a styled slide-deck PDF from PowerPoint slides.
 */
export function generatePdfFromSlides(title: string, slides: PptxSlideData[]): Blob {
  const doc = new jsPDF({
    unit: 'pt',
    format: 'a4',
    orientation: 'landscape',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 36;

  slides.forEach((slide, idx) => {
    if (idx > 0) {
      doc.addPage('a4', 'landscape');
    }

    // Slide Background Card
    doc.setFillColor(250, 251, 253);
    doc.roundedRect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2, 8, 8, 'F');
    doc.setDrawColor(225, 230, 238);
    doc.setLineWidth(1);
    doc.roundedRect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2, 8, 8, 'D');

    // Slide Header Bar
    doc.setFillColor(240, 243, 249);
    doc.roundedRect(margin, margin, pageWidth - margin * 2, 44, 8, 8, 'F');
    doc.rect(margin, margin + 20, pageWidth - margin * 2, 24, 'F');

    // Slide Number Badge
    doc.setFillColor(99, 102, 241);
    doc.roundedRect(margin + 12, margin + 10, 60, 24, 4, 4, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(`Slide ${slide.slideNumber}`, margin + 18, margin + 25);

    // Slide Title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(25, 30, 45);
    doc.text(slide.title.substring(0, 70), margin + 82, margin + 26);

    // Slide Content Lines
    let cursorY = margin + 70;
    const maxLineWidth = pageWidth - margin * 2 - 40;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(55, 65, 81);

    const itemsToRender = slide.content.length > 0 ? slide.content : slide.allText.split('\n');

    itemsToRender.forEach((item) => {
      if (cursorY > pageHeight - margin - 30) return;
      const bulletPrefix = '•  ';
      const wrapped = doc.splitTextToSize(bulletPrefix + item.trim(), maxLineWidth);
      wrapped.forEach((lineText: string) => {
        if (cursorY <= pageHeight - margin - 30) {
          doc.text(lineText, margin + 24, cursorY);
          cursorY += 18;
        }
      });
      cursorY += 4;
    });

    // Footer
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(140, 148, 160);
    doc.text(`${title || 'PowerPoint Presentation'} • Page ${idx + 1} of ${slides.length}`, margin + 20, pageHeight - margin - 12);
  });

  return new Blob([doc.output('blob')], { type: 'application/pdf' });
}
