'use client';

import { jsPDF } from 'jspdf';
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
    Table: mod.Table || mod.default?.Table,
    TableRow: mod.TableRow || mod.default?.TableRow,
    TableCell: mod.TableCell || mod.default?.TableCell,
    WidthType: mod.WidthType || mod.default?.WidthType,
    BorderStyle: mod.BorderStyle || mod.default?.BorderStyle,
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

export interface DocRun {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
}

export type DocBlock =
  | { type: 'heading'; level: 1 | 2 | 3; text: string; runs?: DocRun[] }
  | { type: 'paragraph'; text: string; runs?: DocRun[] }
  | { type: 'bullet'; text: string; runs?: DocRun[] }
  | { type: 'table'; rows: string[][] }
  | { type: 'pagebreak' };

export interface StructuredDoc {
  title: string;
  blocks: DocBlock[];
  text: string;
  html: string;
  markdown: string;
}

/**
 * Extracts rich structured content (headings, runs, bullet lists, tables) from a Word .docx file.
 */
export async function extractDocxContent(file: File): Promise<StructuredDoc> {
  const baseName = file.name.replace(/\.docx?$/i, '');
  const blocks: DocBlock[] = [];
  const textParagraphs: string[] = [];
  const markdownLines: string[] = [];
  const htmlSections: string[] = [];

  try {
    const arrayBuffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(arrayBuffer);
    const documentXmlFile = zip.file('word/document.xml');

    if (documentXmlFile) {
      const xml = await documentXmlFile.async('text');

      // Match paragraphs (<w:p>) and tables (<w:tbl>) in order
      const blockRegex = /<w:(p|tbl)(?:\s[^>]*)?>([\s\S]*?)<\/w:\1>/g;
      let blockMatch;

      while ((blockMatch = blockRegex.exec(xml)) !== null) {
        const type = blockMatch[1];
        const content = blockMatch[2];

        if (type === 'p') {
          // Check style (e.g. Heading1, Heading2, Title)
          const styleMatch = content.match(/<w:pStyle\s+w:val="([^"]+)"/i);
          const style = styleMatch ? styleMatch[1].toLowerCase() : '';
          const isBullet = /<w:numPr>/i.test(content);

          // Extract runs (<w:r>)
          const runs: DocRun[] = [];
          const rRegex = /<w:r(?:\s[^>]*)?>([\s\S]*?)<\/w:r>/g;
          let rMatch;

          while ((rMatch = rRegex.exec(content)) !== null) {
            const rContent = rMatch[1];
            const isBold = /<w:b(?:\s|\/|>)/i.test(rContent);
            const isItalic = /<w:i(?:\s|\/|>)/i.test(rContent);
            const isUnderline = /<w:u(?:\s|\/|>)/i.test(rContent);

            const tRegex = /<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g;
            let tMatch;
            let runText = '';
            while ((tMatch = tRegex.exec(rContent)) !== null) {
              runText += tMatch[1];
            }

            if (runText) {
              runs.push({
                text: runText,
                bold: isBold,
                italic: isItalic,
                underline: isUnderline,
              });
            }
          }

          const fullText = runs.map((r) => r.text).join('').trim();
          if (!fullText) continue;

          textParagraphs.push(fullText);

          if (style.includes('heading1') || style.includes('title')) {
            blocks.push({ type: 'heading', level: 1, text: fullText, runs });
            markdownLines.push(`# ${fullText}\n`);
            htmlSections.push(`<h1>${fullText}</h1>`);
          } else if (style.includes('heading2')) {
            blocks.push({ type: 'heading', level: 2, text: fullText, runs });
            markdownLines.push(`## ${fullText}\n`);
            htmlSections.push(`<h2>${fullText}</h2>`);
          } else if (style.includes('heading3')) {
            blocks.push({ type: 'heading', level: 3, text: fullText, runs });
            markdownLines.push(`### ${fullText}\n`);
            htmlSections.push(`<h3>${fullText}</h3>`);
          } else if (isBullet) {
            blocks.push({ type: 'bullet', text: fullText, runs });
            markdownLines.push(`- ${fullText}`);
            htmlSections.push(`<li>${fullText}</li>`);
          } else {
            blocks.push({ type: 'paragraph', text: fullText, runs });
            const mdRunText = runs
              .map((r) => (r.bold ? `**${r.text}**` : r.italic ? `*${r.text}*` : r.text))
              .join('');
            markdownLines.push(`${mdRunText}\n`);
            htmlSections.push(`<p>${fullText}</p>`);
          }
        } else if (type === 'tbl') {
          // Table parsing
          const rows: string[][] = [];
          const trRegex = /<w:tr(?:\s[^>]*)?>([\s\S]*?)<\/w:tr>/g;
          let trMatch;

          while ((trMatch = trRegex.exec(content)) !== null) {
            const trContent = trMatch[1];
            const cells: string[] = [];
            const tcRegex = /<w:tc(?:\s[^>]*)?>([\s\S]*?)<\/w:tc>/g;
            let tcMatch;

            while ((tcMatch = tcRegex.exec(trContent)) !== null) {
              const tcContent = tcMatch[1];
              const tRegex = /<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g;
              let tMatch;
              let cellText = '';
              while ((tMatch = tRegex.exec(tcContent)) !== null) {
                cellText += tMatch[1];
              }
              cells.push(cellText.trim());
            }

            if (cells.length > 0) {
              rows.push(cells);
            }
          }

          if (rows.length > 0) {
            blocks.push({ type: 'table', rows });
            const tableMd = rows
              .map((r, idx) => {
                const rowStr = `| ${r.join(' | ')} |`;
                if (idx === 0) {
                  return `${rowStr}\n| ${r.map(() => '---').join(' | ')} |`;
                }
                return rowStr;
              })
              .join('\n');
            markdownLines.push(`${tableMd}\n`);
            htmlSections.push(
              `<table border="1">${rows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</table>`
            );
          }
        }
      }

      if (blocks.length > 0) {
        return {
          title: baseName,
          blocks,
          text: textParagraphs.join('\n\n'),
          markdown: markdownLines.join('\n'),
          html: htmlSections.join('\n'),
        };
      }
    }
  } catch (err) {
    console.warn('Advanced DOCX XML parsing error:', err);
  }

  // Fallback to text read
  const fallbackText = await file.text().catch(() => `Document: ${file.name}`);
  const fallbackBlocks: DocBlock[] = fallbackText
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      if (line.startsWith('# ')) return { type: 'heading', level: 1, text: line.slice(2).trim() };
      if (line.startsWith('## ')) return { type: 'heading', level: 2, text: line.slice(3).trim() };
      if (line.startsWith('### ')) return { type: 'heading', level: 3, text: line.slice(4).trim() };
      if (line.startsWith('- ') || line.startsWith('* ')) return { type: 'bullet', text: line.replace(/^[-*]\s+/, '').trim() };
      return { type: 'paragraph', text: line };
    });

  return {
    title: baseName,
    blocks: fallbackBlocks,
    text: fallbackText,
    markdown: fallbackText,
    html: `<pre>${fallbackText}</pre>`,
  };
}

/**
 * Parses markdown or formatted text into structured blocks.
 */
export function parseTextToDocBlocks(text: string): DocBlock[] {
  const lines = text.split(/\r?\n/);
  const blocks: DocBlock[] = [];
  let tableRows: string[][] = [];

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      if (tableRows.length > 0) {
        blocks.push({ type: 'table', rows: tableRows });
        tableRows = [];
      }
      continue;
    }

    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      if (trimmed.includes('---')) continue;
      const cells = trimmed.slice(1, -1).split('|').map((c) => c.trim());
      tableRows.push(cells);
      continue;
    } else if (tableRows.length > 0) {
      blocks.push({ type: 'table', rows: tableRows });
      tableRows = [];
    }

    if (trimmed.startsWith('# ')) {
      blocks.push({ type: 'heading', level: 1, text: trimmed.slice(2).trim() });
    } else if (trimmed.startsWith('## ')) {
      blocks.push({ type: 'heading', level: 2, text: trimmed.slice(3).trim() });
    } else if (trimmed.startsWith('### ')) {
      blocks.push({ type: 'heading', level: 3, text: trimmed.slice(4).trim() });
    } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
      blocks.push({ type: 'bullet', text: trimmed.replace(/^[-*•]\s+/, '').trim() });
    } else {
      blocks.push({ type: 'paragraph', text: trimmed });
    }
  }

  if (tableRows.length > 0) {
    blocks.push({ type: 'table', rows: tableRows });
  }

  return blocks;
}

/**
 * Creates a rich Microsoft Word (.docx) document with Headings, Tables, Bullets, and formatting.
 */
export async function createDocxFromStructuredDoc(title: string, blocks: DocBlock[]): Promise<Blob> {
  const { Document: DocxDocument, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, WidthType, BorderStyle } = await getDocx();
  const children: any[] = [];

  // Title
  if (title) {
    children.push(
      new Paragraph({
        text: title,
        heading: HeadingLevel?.TITLE || 'Title',
        spacing: { before: 200, after: 280 },
      })
    );
  }

  for (const block of blocks) {
    if (block.type === 'heading') {
      const headingType =
        block.level === 1
          ? HeadingLevel?.HEADING_1 || 'Heading1'
          : block.level === 2
          ? HeadingLevel?.HEADING_2 || 'Heading2'
          : HeadingLevel?.HEADING_3 || 'Heading3';

      children.push(
        new Paragraph({
          text: block.text,
          heading: headingType,
          spacing: { before: 240, after: 120 },
        })
      );
    } else if (block.type === 'bullet') {
      children.push(
        new Paragraph({
          children: [new TextRun(block.text)],
          bullet: { level: 0 },
          spacing: { after: 80 },
        })
      );
    } else if (block.type === 'paragraph') {
      if (block.runs && block.runs.length > 0) {
        const textRuns = block.runs.map(
          (r) =>
            new TextRun({
              text: r.text,
              bold: r.bold,
              italics: r.italic,
              underline: r.underline ? {} : undefined,
            })
        );
        children.push(new Paragraph({ children: textRuns, spacing: { after: 120 } }));
      } else {
        children.push(new Paragraph({ children: [new TextRun(block.text)], spacing: { after: 120 } }));
      }
    } else if (block.type === 'table') {
      const tableRows = block.rows.map((rowCells, rIdx) => {
        const cells = rowCells.map(
          (cellText) =>
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: cellText, bold: rIdx === 0 })],
                  spacing: { before: 60, after: 60 },
                }),
              ],
              shading: rIdx === 0 ? { fill: 'F3F4F6' } : undefined,
            })
        );
        return new TableRow({ children: cells });
      });

      if (tableRows.length > 0) {
        children.push(
          new Table({
            rows: tableRows,
            width: { size: 100, type: WidthType?.PERCENTAGE || 'pct' },
          })
        );
        children.push(new Paragraph({ text: '', spacing: { after: 120 } }));
      }
    }
  }

  const doc = new DocxDocument({
    sections: [{ properties: {}, children }],
  });

  const rawDocxBlob = await Packer.toBlob(doc);
  return new Blob([rawDocxBlob], {
    type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });
}

/**
 * Creates a clean formatted .docx Word document from text or markdown.
 */
export async function createDocxFromText(title: string, text: string): Promise<Blob> {
  const blocks = parseTextToDocBlocks(text);
  return createDocxFromStructuredDoc(title, blocks);
}

/**
 * Generates a styled, multi-page PDF document preserving headings, tables, bullets, and margins.
 */
export function generatePdfFromStructuredDoc(title: string, blocks: DocBlock[]): Blob {
  const doc = new jsPDF({
    unit: 'pt',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const maxContentWidth = pageWidth - margin * 2;
  let cursorY = margin + 20;

  const checkPageBreak = (neededHeight: number) => {
    if (cursorY + neededHeight > pageHeight - margin) {
      doc.addPage();
      cursorY = margin + 20;
      return true;
    }
    return false;
  };

  // Document Title Header
  if (title) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(20, 24, 33);
    doc.text(title.substring(0, 80), margin, cursorY);
    cursorY += 24;

    doc.setDrawColor(220, 225, 235);
    doc.setLineWidth(1);
    doc.line(margin, cursorY - 10, pageWidth - margin, cursorY - 10);
    cursorY += 8;
  }

  for (const block of blocks) {
    if (block.type === 'heading') {
      const fontSize = block.level === 1 ? 15 : block.level === 2 ? 13 : 11;
      const spaceBefore = block.level === 1 ? 20 : 14;
      const spaceAfter = 10;

      checkPageBreak(fontSize + spaceBefore + spaceAfter);
      cursorY += spaceBefore;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(fontSize);
      doc.setTextColor(30, 35, 48);

      const wrapped = doc.splitTextToSize(block.text, maxContentWidth);
      wrapped.forEach((lineText: string) => {
        checkPageBreak(fontSize + 4);
        doc.text(lineText, margin, cursorY);
        cursorY += fontSize + 4;
      });

      cursorY += spaceAfter;
    } else if (block.type === 'bullet') {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(55, 60, 70);

      const bulletDot = '•';
      const bulletIndent = 16;
      const textWidth = maxContentWidth - bulletIndent;
      const wrapped = doc.splitTextToSize(block.text, textWidth);

      checkPageBreak(wrapped.length * 14 + 6);
      doc.text(bulletDot, margin + 4, cursorY);

      wrapped.forEach((lineText: string) => {
        doc.text(lineText, margin + bulletIndent, cursorY);
        cursorY += 14;
      });
      cursorY += 4;
    } else if (block.type === 'paragraph') {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(50, 54, 62);

      const wrapped = doc.splitTextToSize(block.text, maxContentWidth);
      checkPageBreak(wrapped.length * 14 + 8);

      wrapped.forEach((lineText: string) => {
        checkPageBreak(14);
        doc.text(lineText, margin, cursorY);
        cursorY += 14;
      });
      cursorY += 8;
    } else if (block.type === 'table') {
      if (block.rows.length === 0) continue;

      const numCols = Math.max(block.rows[0].length, 1);
      const colWidth = maxContentWidth / numCols;
      const rowHeight = 18;
      const fontSize = Math.max(6, Math.min(8.5, 60 / numCols));

      checkPageBreak(rowHeight * Math.min(block.rows.length, 3));

      block.rows.forEach((rowCells, rIdx) => {
        checkPageBreak(rowHeight + 4);

        if (rIdx === 0) {
          doc.setFillColor(243, 244, 246);
          doc.rect(margin, cursorY, maxContentWidth, rowHeight, 'F');
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(30, 35, 45);
        } else {
          if (rIdx % 2 === 1) {
            doc.setFillColor(250, 251, 253);
            doc.rect(margin, cursorY, maxContentWidth, rowHeight, 'F');
          }
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(60, 65, 75);
        }

        doc.setFontSize(fontSize);
        const maxChars = Math.max(6, Math.floor(colWidth / 5));

        rowCells.forEach((cellVal, cIdx) => {
          const raw = String(cellVal || '').replace(/[\r\n]+/g, ' ').trim();
          const cleanText = raw.length > maxChars ? raw.substring(0, maxChars - 1) + '…' : raw;
          doc.text(cleanText, margin + cIdx * colWidth + 4, cursorY + 12);
        });

        doc.setDrawColor(225, 230, 238);
        doc.setLineWidth(0.5);
        doc.line(margin, cursorY + rowHeight, pageWidth - margin, cursorY + rowHeight);

        cursorY += rowHeight;
      });

      cursorY += 12;
    } else if (block.type === 'pagebreak') {
      doc.addPage();
      cursorY = margin + 20;
    }
  }

  return new Blob([doc.output('blob')], { type: 'application/pdf' });
}

/**
 * Generate a styled PDF from plain text or markdown with headings and multi-page layout.
 */
export function generatePdfFromText(title: string, text: string): Blob {
  const blocks = parseTextToDocBlocks(text);
  return generatePdfFromStructuredDoc(title, blocks);
}

/**
 * Extracts plain text, pages, and metadata from a PDF file with spatial line grouping.
 */
export async function extractPdfContent(file: File): Promise<{
  text: string;
  pageCount: number;
  pagesText: string[];
  markdown: string;
}> {
  const arrayBuffer = await file.arrayBuffer();
  const uint8Data = new Uint8Array(arrayBuffer);

  // Layer 1: PDF.js with sorted 2D coordinate text reconstruction
  try {
    const pdfjs = await getPdfJs();
    const loadingTask = pdfjs.getDocument({
      data: uint8Data,
      useSystemFonts: true,
      stopAtErrors: false,
    });

    // Timeout guard: 8 seconds max to prevent getting stuck on corrupted PDFs
    const pdfDoc = await Promise.race([
      loadingTask.promise,
      new Promise<never>((_, reject) => setTimeout(() => reject(new Error('PDF.js timeout')), 8000)),
    ]);

    const numPages = pdfDoc.numPages;
    const pagesText: string[] = [];
    const markdownPages: string[] = [];

    for (let i = 1; i <= numPages; i++) {
      const page = await pdfDoc.getPage(i);
      const textContent = await page.getTextContent();
      const items = textContent.items as any[];

      if (items.length === 0) {
        pagesText.push('');
        continue;
      }

      // Sort items by Y (top to bottom: descending) and X (left to right: ascending)
      const sorted = [...items].sort((a, b) => {
        const yA = a.transform ? a.transform[5] : 0;
        const yB = b.transform ? b.transform[5] : 0;
        if (Math.abs(yA - yB) > 3) return yB - yA;
        const xA = a.transform ? a.transform[4] : 0;
        const xB = b.transform ? b.transform[4] : 0;
        return xA - xB;
      });

      const lines: Array<{ text: string; fontSize: number }> = [];
      let currentLine: string[] = [];
      let currentY = sorted[0]?.transform ? sorted[0].transform[5] : 0;
      let currentFontSize = sorted[0]?.transform ? Math.abs(sorted[0].transform[3]) : 12;

      for (const item of sorted) {
        const y = item.transform ? item.transform[5] : 0;
        const fontSize = item.transform ? Math.abs(item.transform[3]) : 12;
        const str = (item.str || '').trim();
        if (!str) continue;

        if (Math.abs(y - currentY) > 4) {
          if (currentLine.length > 0) {
            lines.push({
              text: currentLine.join(' ').trim(),
              fontSize: currentFontSize,
            });
          }
          currentLine = [str];
          currentY = y;
          currentFontSize = fontSize;
        } else {
          currentLine.push(str);
        }
      }

      if (currentLine.length > 0) {
        lines.push({
          text: currentLine.join(' ').trim(),
          fontSize: currentFontSize,
        });
      }

      // Format markdown & paragraphs
      const pageMdBlocks: string[] = [];
      const pagePlainBlocks: string[] = [];

      lines.forEach((l) => {
        if (!l.text) return;
        pagePlainBlocks.push(l.text);

        if (l.fontSize >= 15) {
          pageMdBlocks.push(`# ${l.text}\n`);
        } else if (l.fontSize >= 13) {
          pageMdBlocks.push(`## ${l.text}\n`);
        } else if (l.text.startsWith('•') || l.text.startsWith('-')) {
          pageMdBlocks.push(`- ${l.text.replace(/^[•-]\s*/, '')}`);
        } else {
          pageMdBlocks.push(l.text);
        }
      });

      pagesText.push(pagePlainBlocks.join('\n\n'));
      markdownPages.push(pageMdBlocks.join('\n\n'));
    }

    const fullText = pagesText.join('\n\n--- Page Break ---\n\n').trim();
    const fullMarkdown = markdownPages.join('\n\n---\n\n').trim();

    if (fullText.length > 0) {
      return {
        pageCount: numPages,
        pagesText,
        text: fullText,
        markdown: fullMarkdown,
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

    const fallbackText =
      textMatches.join(' ').replace(/\\([()\\])/g, '$1').trim() || `Extracted content from ${file.name}`;
    return {
      pageCount: numPages,
      pagesText: [fallbackText],
      text: fallbackText,
      markdown: `# ${file.name}\n\n${fallbackText}`,
    };
  } catch (pdfLibErr) {
    console.warn('PDF-Lib parser failed', pdfLibErr);
  }

  const defaultText = `Extracted text from ${file.name}`;
  return {
    pageCount: 1,
    pagesText: [defaultText],
    text: defaultText,
    markdown: `# ${file.name}\n\n${defaultText}`,
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
    const viewport = page.getViewport({ scale: 2.0 });
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
 * Converts Excel or CSV data into formatted PDF table grid with responsive column sizing.
 */
export function generatePdfFromTable(title: string, headers: string[], rows: any[][]): Blob {
  const cleanHeaders =
    headers && headers.length > 0 ? headers.map(String) : rows[0] ? rows[0].map((_, i) => `Column ${i + 1}`) : ['Data'];
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
    paragraphs.push(
      new Paragraph({
        text: `Slide ${slide.slideNumber}: ${slide.title}`,
        heading: HeadingLevel?.HEADING_1 || 'Heading1',
        spacing: { before: 240, after: 120 },
      })
    );

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

    // Slide Card
    doc.setFillColor(250, 251, 253);
    doc.roundedRect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2, 8, 8, 'F');
    doc.setDrawColor(225, 230, 238);
    doc.setLineWidth(1);
    doc.roundedRect(margin, margin, pageWidth - margin * 2, pageHeight - margin * 2, 8, 8, 'D');

    // Slide Header
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

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(140, 148, 160);
    doc.text(
      `${title || 'PowerPoint Presentation'} • Page ${idx + 1} of ${slides.length}`,
      margin + 20,
      pageHeight - margin - 12
    );
  });

  return new Blob([doc.output('blob')], { type: 'application/pdf' });
}

/**
 * Strips RTF control words and extracts plain text.
 */
export function rtfToPlainText(rtf: string): string {
  let text = rtf;
  text = text.replace(/\\bin\d+ /g, '');
  text = text.replace(/{\\fonttbl[\s\S]*?}/gi, '');
  text = text.replace(/{\\colortbl[\s\S]*?}/gi, '');
  text = text.replace(/{\\stylesheet[\s\S]*?}/gi, '');
  text = text.replace(/{\\info[\s\S]*?}/gi, '');
  text = text.replace(/{\\\*[\s\S]*?}/g, '');
  text = text.replace(/\\par(\r\n|\r|\n| )/g, '\n');
  text = text.replace(/\\line(\r\n|\r|\n| )/g, '\n');
  text = text.replace(/\\tab(\r\n|\r|\n| )/g, '\t');
  text = text.replace(/\\'([0-9a-fA-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  text = text.replace(/\\u([0-9]{2,5})\??/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
  text = text.replace(/\\[a-zA-Z]+(-?\d+)? ?/g, '');
  text = text.replace(/[{}]/g, '');
  return text.trim();
}

/**
 * Extracts plain text from an EPUB file.
 */
export async function extractTextFromEpub(file: File): Promise<{ text: string; title: string }> {
  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

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
