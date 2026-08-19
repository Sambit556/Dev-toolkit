'use client';

import React, { useState, useRef } from 'react';
import { marked } from 'marked';
import jsyaml from 'js-yaml';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import { 
  FileUp, 
  RefreshCw, 
  Download, 
  CheckCircle, 
  Trash2, 
  FileText, 
  Image as ImageIcon,
  Table as TableIcon,
  ArrowRightLeft,
  ArrowRight,
  Sparkles,
  Copy,
  Check,
  Layers,
  Archive,
  Plus
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

import {
  extractDocxContent,
  createDocxFromText,
  extractPdfContent,
  renderPdfToImages,
  generatePdfFromText,
  generatePdfFromTable,
  rtfToPlainText,
  extractTextFromEpub,
} from '@/lib/converters/documentConverters';

import {
  convertRasterImage,
  convertImageToPdf,
  convertImageToSvg,
} from '@/lib/converters/imageConverters';

// Helper to convert any File to Base64 data URL
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') resolve(reader.result);
      else reject(new Error('Failed to read file.'));
    };
    reader.onerror = () => reject(reader.error);
  });
};

function jsonToXml(obj: any, rootName = 'root'): string {
  let xml = '';
  if (typeof obj !== 'object' || obj === null) return String(obj);
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const val = obj[key];
      const cleanKey = key.replace(/[^a-zA-Z0-9_-]/g, '_');
      if (Array.isArray(val)) {
        val.forEach((item) => {
          xml += `<${cleanKey}>${jsonToXml(item, '')}</${cleanKey}>`;
        });
      } else if (typeof val === 'object' && val !== null) {
        xml += `<${cleanKey}>${jsonToXml(val, '')}</${cleanKey}>`;
      } else {
        xml += `<${cleanKey}>${val}</${cleanKey}>`;
      }
    }
  }
  return rootName ? `<${rootName}>${xml}</${rootName}>` : xml;
}

function xmlToJson(xmlNode: Node): any {
  if (xmlNode.nodeType === Node.TEXT_NODE) return xmlNode.nodeValue?.trim();
  const obj: any = {};
  if (xmlNode.nodeType === Node.ELEMENT_NODE) {
    const element = xmlNode as Element;
    if (element.hasAttributes()) {
      obj['@attributes'] = {};
      for (let j = 0; j < element.attributes.length; j++) {
        const attribute = element.attributes.item(j);
        if (attribute) obj['@attributes'][attribute.nodeName] = attribute.nodeValue;
      }
    }
  }
  if (xmlNode.hasChildNodes()) {
    for (let i = 0; i < xmlNode.childNodes.length; i++) {
      const item = xmlNode.childNodes.item(i);
      const nodeName = item.nodeName;
      if (item.nodeType === Node.TEXT_NODE) {
        const text = item.nodeValue?.trim();
        if (text) {
          if (xmlNode.childNodes.length === 1) return text;
          else obj['#text'] = text;
        }
        continue;
      }
      const childVal = xmlToJson(item);
      if (obj[nodeName] === undefined) {
        obj[nodeName] = childVal;
      } else {
        if (!Array.isArray(obj[nodeName])) {
          obj[nodeName] = [obj[nodeName]];
        }
        obj[nodeName].push(childVal);
      }
    }
  }
  return obj;
}

function jsonToIni(obj: any): string {
  let ini = '';
  for (const key in obj) {
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      ini += `[${key}]\n`;
      for (const subKey in obj[key]) {
        ini += `${subKey}=${obj[key][subKey]}\n`;
      }
      ini += '\n';
    } else {
      ini += `${key}=${obj[key]}\n`;
    }
  }
  return ini.trim();
}

function iniToJson(text: string): any {
  const obj: any = {};
  let currentSection = obj;
  const lines = text.split('\n');
  lines.forEach((line) => {
    const cleanLine = line.trim();
    if (!cleanLine || cleanLine.startsWith(';') || cleanLine.startsWith('#')) return;
    if (cleanLine.startsWith('[') && cleanLine.endsWith(']')) {
      const sectionName = cleanLine.substring(1, cleanLine.length - 1).trim();
      obj[sectionName] = {};
      currentSection = obj[sectionName];
    } else if (cleanLine.includes('=')) {
      const parts = cleanLine.split('=');
      const key = parts[0].trim();
      const val = parts.slice(1).join('=').trim();
      currentSection[key] = val;
    }
  });
  return obj;
}

interface ConversionStat {
  duration: number;
  originalSize: number;
  convertedSize: number;
  savings: number;
}

interface FileQueueItem {
  id: string;
  file: File;
  targetFormat: string;
  status: 'pending' | 'converting' | 'completed' | 'error';
  resultBlob?: Blob;
  resultUrl?: string;
  resultFilename?: string;
  previewContent?: string | null;
  error?: string;
  stats?: ConversionStat;
}

const GLOBAL_COMMON_FORMATS = [
  { label: 'PDF Document (.pdf)', value: 'pdf' },
  { label: 'Word Document (.docx)', value: 'docx' },
  { label: 'Plain Text (.txt)', value: 'txt' },
  { label: 'HTML Webpage (.html)', value: 'html' },
  { label: 'Markdown (.md)', value: 'md' },
  { label: 'PNG Image (.png)', value: 'png' },
  { label: 'JPG Image (.jpg)', value: 'jpg' },
  { label: 'WebP Image (.webp)', value: 'webp' },
  { label: 'Vector SVG (.svg)', value: 'svg' },
  { label: 'Excel Workbook (.xlsx)', value: 'xlsx' },
  { label: 'CSV Spreadsheet (.csv)', value: 'csv' },
  { label: 'JSON Format (.json)', value: 'json' },
  { label: 'Base64 Encoded Text', value: 'base64' },
];

export function FileConverterTool() {
  // --- MULTI-FILE UNIVERSAL CONVERTER STATE ---
  const [dragActive, setDragActive] = useState(false);
  const [fileQueue, setFileQueue] = useState<FileQueueItem[]>([]);
  const [activePreviewId, setActivePreviewId] = useState<string | null>(null);
  const [isConvertingAll, setIsConvertingAll] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getFileTypeIcon = (filename: string) => {
    const ext = filename.split('.').pop()?.toLowerCase() || '';
    if (['png', 'jpg', 'jpeg', 'webp', 'svg', 'heic', 'heif', 'avif', 'bmp', 'tiff', 'tif', 'gif'].includes(ext)) {
      return <ImageIcon className="h-4 w-4 text-amber-500" />;
    }
    if (['xlsx', 'xls', 'csv'].includes(ext)) {
      return <TableIcon className="h-4 w-4 text-emerald-500" />;
    }
    return <FileText className="h-4 w-4 text-blue-500" />;
  };

  // Determine available target formats based on file extension
  const getAvailableFormats = (file: File | null) => {
    if (!file) return [];
    const ext = file.name.split('.').pop()?.toLowerCase() || '';

    // 1. Documents: Word (.docx, .doc)
    if (['docx', 'doc'].includes(ext)) {
      return [
        { label: 'PDF Document (.pdf)', value: 'pdf', category: 'Document' },
        { label: 'Plain Text (.txt)', value: 'txt', category: 'Document' },
        { label: 'HTML Webpage (.html)', value: 'html', category: 'Document' },
        { label: 'Markdown Document (.md)', value: 'md', category: 'Document' },
      ];
    }

    // 2. Documents: PDF (.pdf)
    if (ext === 'pdf') {
      return [
        { label: 'Word Document (.docx)', value: 'docx', category: 'Document' },
        { label: 'Plain Text (.txt)', value: 'txt', category: 'Document' },
        { label: 'HTML Document (.html)', value: 'html', category: 'Document' },
        { label: 'JPG Images (.jpg)', value: 'jpg', category: 'Images' },
        { label: 'PNG Images (.png)', value: 'png', category: 'Images' },
      ];
    }

    // 3. Documents: HTML (.html, .htm)
    if (['html', 'htm'].includes(ext)) {
      return [
        { label: 'PDF Document (.pdf)', value: 'pdf', category: 'Document' },
        { label: 'Markdown Document (.md)', value: 'md', category: 'Document' },
        { label: 'Plain Text (.txt)', value: 'txt', category: 'Document' },
      ];
    }

    // 4. Documents: Markdown (.md, .markdown)
    if (['md', 'markdown'].includes(ext)) {
      return [
        { label: 'HTML Webpage (.html)', value: 'html', category: 'Document' },
        { label: 'PDF Document (.pdf)', value: 'pdf', category: 'Document' },
        { label: 'Word Document (.docx)', value: 'docx', category: 'Document' },
        { label: 'Plain Text (.txt)', value: 'txt', category: 'Document' },
      ];
    }

    // 5. Documents: TXT (.txt)
    if (ext === 'txt') {
      return [
        { label: 'PDF Document (.pdf)', value: 'pdf', category: 'Document' },
        { label: 'Word Document (.docx)', value: 'docx', category: 'Document' },
        { label: 'HTML Document (.html)', value: 'html', category: 'Document' },
        { label: 'Markdown Document (.md)', value: 'md', category: 'Document' },
        { label: 'Base64 Encoded Text', value: 'base64', category: 'Data' },
      ];
    }

    // 6. Documents: RTF (.rtf)
    if (ext === 'rtf') {
      return [
        { label: 'PDF Document (.pdf)', value: 'pdf', category: 'Document' },
        { label: 'Word Document (.docx)', value: 'docx', category: 'Document' },
        { label: 'Plain Text (.txt)', value: 'txt', category: 'Document' },
      ];
    }

    // 7. Documents: EPUB (.epub)
    if (ext === 'epub') {
      return [
        { label: 'PDF Document (.pdf)', value: 'pdf', category: 'Document' },
        { label: 'Plain Text (.txt)', value: 'txt', category: 'Document' },
      ];
    }

    // 8. Spreadsheets: Excel (.xlsx, .xls)
    if (['xlsx', 'xls'].includes(ext)) {
      return [
        { label: 'PDF Table Grid (.pdf)', value: 'pdf', category: 'Document' },
        { label: 'CSV Spreadsheet (.csv)', value: 'csv', category: 'Data' },
        { label: 'JSON Array (.json)', value: 'json', category: 'Data' },
      ];
    }

    // 9. Spreadsheets / Data: CSV (.csv)
    if (ext === 'csv') {
      return [
        { label: 'Excel Workbook (.xlsx)', value: 'xlsx', category: 'Spreadsheet' },
        { label: 'PDF Table Grid (.pdf)', value: 'pdf', category: 'Document' },
        { label: 'JSON Array (.json)', value: 'json', category: 'Data' },
      ];
    }

    // 10. Data: JSON (.json)
    if (ext === 'json') {
      return [
        { label: 'CSV Spreadsheet (.csv)', value: 'csv', category: 'Spreadsheet' },
        { label: 'PDF Document (.pdf)', value: 'pdf', category: 'Document' },
        { label: 'Excel Workbook (.xlsx)', value: 'xlsx', category: 'Spreadsheet' },
        { label: 'YAML Configuration (.yaml)', value: 'yaml', category: 'Config' },
        { label: 'XML Configuration (.xml)', value: 'xml', category: 'Config' },
        { label: 'INI Configuration (.ini)', value: 'ini', category: 'Config' },
        { label: 'Base64 Encoded Text', value: 'base64', category: 'Data' },
      ];
    }

    // 11. Images: JPG, PNG, WebP, SVG, HEIC, AVIF, BMP, TIFF, GIF
    if (['png', 'jpg', 'jpeg', 'webp', 'svg', 'heic', 'heif', 'avif', 'bmp', 'tiff', 'tif', 'gif'].includes(ext)) {
      const formats = [
        { label: 'PNG Image (.png)', value: 'png', category: 'Image' },
        { label: 'JPG / JPEG Image (.jpg)', value: 'jpg', category: 'Image' },
        { label: 'WebP Modern Image (.webp)', value: 'webp', category: 'Image' },
        { label: 'PDF Document (.pdf)', value: 'pdf', category: 'Document' },
        { label: 'Vector SVG (.svg)', value: 'svg', category: 'Vector' },
        { label: 'Base64 Data URI (.txt)', value: 'base64', category: 'Data' },
      ];
      return formats.filter((f) => {
        if (f.value === ext) return false;
        if (f.value === 'jpg' && ext === 'jpeg') return false;
        if (f.value === 'jpeg' && ext === 'jpg') return false;
        return true;
      });
    }

    // 12. Configs: YAML, XML, INI
    if (['yaml', 'yml'].includes(ext)) {
      return [
        { label: 'JSON Format (.json)', value: 'json', category: 'Data' },
        { label: 'CSV Spreadsheet (.csv)', value: 'csv', category: 'Data' },
      ];
    }
    if (ext === 'xml') {
      return [{ label: 'JSON Format (.json)', value: 'json', category: 'Data' }];
    }
    if (ext === 'ini') {
      return [{ label: 'JSON Format (.json)', value: 'json', category: 'Data' }];
    }

    // Fallback: Base64
    return [{ label: 'Base64 Encoded Text', value: 'base64', category: 'Data' }];
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const addFilesToQueue = (files: FileList | File[]) => {
    const newItems: FileQueueItem[] = Array.from(files).map((file) => {
      const available = getAvailableFormats(file);
      const defaultFmt = available.length > 0 ? available[0].value : 'base64';
      return {
        id: Math.random().toString(36).substring(7),
        file,
        targetFormat: defaultFmt,
        status: 'pending',
      };
    });

    setFileQueue((prev) => {
      const updated = [...prev, ...newItems];
      if (!activePreviewId && updated.length > 0) {
        setActivePreviewId(updated[0].id);
      }
      return updated;
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFilesToQueue(e.dataTransfer.files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFilesToQueue(e.target.files);
    }
  };

  const updateItemTargetFormat = (id: string, newFmt: string) => {
    setFileQueue((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          if (item.resultUrl) URL.revokeObjectURL(item.resultUrl);
          return {
            ...item,
            targetFormat: newFmt,
            status: 'pending',
            resultBlob: undefined,
            resultUrl: undefined,
            resultFilename: undefined,
            previewContent: null,
            error: undefined,
            stats: undefined,
          };
        }
        return item;
      })
    );
  };

  const removeItemFromQueue = (id: string) => {
    setFileQueue((prev) => {
      const item = prev.find((i) => i.id === id);
      if (item?.resultUrl) URL.revokeObjectURL(item.resultUrl);
      const updated = prev.filter((i) => i.id !== id);
      if (activePreviewId === id) {
        setActivePreviewId(updated.length > 0 ? updated[0].id : null);
      }
      return updated;
    });
  };

  const clearAllQueue = () => {
    fileQueue.forEach((item) => {
      if (item.resultUrl) URL.revokeObjectURL(item.resultUrl);
    });
    setFileQueue([]);
    setActivePreviewId(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Change all files to a selected target format
  const handleChangeAllFormat = (newFmt: string) => {
    let count = 0;
    setFileQueue((prev) =>
      prev.map((item) => {
        const available = getAvailableFormats(item.file);
        const isSupported = available.some((f) => f.value === newFmt);
        if (isSupported) {
          count++;
          if (item.resultUrl) URL.revokeObjectURL(item.resultUrl);
          return {
            ...item,
            targetFormat: newFmt,
            status: 'pending',
            resultBlob: undefined,
            resultUrl: undefined,
            resultFilename: undefined,
            previewContent: null,
            error: undefined,
            stats: undefined,
          };
        }
        return item;
      })
    );
    toast.success(`Updated target format to ${newFmt.toUpperCase()} for ${count} file(s)`);
  };

  // Process a single file conversion
  const processSingleFile = async (item: FileQueueItem): Promise<FileQueueItem> => {
    const startTime = performance.now();
    const originalSize = item.file.size;
    const ext = item.file.name.split('.').pop()?.toLowerCase() || '';
    const baseName = item.file.name.substring(0, item.file.name.lastIndexOf('.')) || item.file.name;
    const targetFormat = item.targetFormat;

    let resultBlob: Blob | null = null;
    let outputFilename = `${baseName}.${targetFormat}`;
    let textPreview: string | null = null;

    try {
      // 1. Word (.docx, .doc)
      if (['docx', 'doc'].includes(ext)) {
        const docxData = await extractDocxContent(item.file);
        if (targetFormat === 'pdf') {
          resultBlob = generatePdfFromText(baseName, docxData.text);
          outputFilename = `${baseName}.pdf`;
        } else if (targetFormat === 'txt') {
          resultBlob = new Blob([docxData.text], { type: 'text/plain;charset=utf-8;' });
          outputFilename = `${baseName}.txt`;
          textPreview = docxData.text.slice(0, 1000);
        } else if (targetFormat === 'html') {
          const wrapperHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${baseName}</title><style>body{font-family:system-ui,-apple-system,sans-serif;line-height:1.6;max-width:800px;margin:40px auto;padding:20px;}</style></head><body>${docxData.html}</body></html>`;
          resultBlob = new Blob([wrapperHtml], { type: 'text/html;charset=utf-8;' });
          outputFilename = `${baseName}.html`;
          textPreview = docxData.html.slice(0, 1000);
        } else if (targetFormat === 'md') {
          resultBlob = new Blob([docxData.markdown], { type: 'text/markdown;charset=utf-8;' });
          outputFilename = `${baseName}.md`;
          textPreview = docxData.markdown.slice(0, 1000);
        }
      }

      // 2. PDF (.pdf)
      else if (ext === 'pdf') {
        if (targetFormat === 'docx') {
          const pdfData = await extractPdfContent(item.file);
          resultBlob = await createDocxFromText(baseName, pdfData.text);
          outputFilename = `${baseName}.docx`;
          textPreview = `Converted ${pdfData.pageCount} pages to Word .docx document.`;
        } else if (targetFormat === 'txt') {
          const pdfData = await extractPdfContent(item.file);
          resultBlob = new Blob([pdfData.text], { type: 'text/plain;charset=utf-8;' });
          outputFilename = `${baseName}.txt`;
          textPreview = pdfData.text.slice(0, 1000);
        } else if (targetFormat === 'html') {
          const pdfData = await extractPdfContent(item.file);
          const htmlContent = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${baseName}</title></head><body><h1>${baseName}</h1>${pdfData.pagesText.map((p, idx) => `<section><h2>Page ${idx + 1}</h2><p>${p.replace(/\n/g, '<br/>')}</p></section>`).join('<hr/>')}</body></html>`;
          resultBlob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
          outputFilename = `${baseName}.html`;
          textPreview = htmlContent.slice(0, 1000);
        } else if (targetFormat === 'jpg' || targetFormat === 'png') {
          const imgResult = await renderPdfToImages(item.file, targetFormat);
          resultBlob = imgResult.blob;
          outputFilename = imgResult.filename;
        }
      }

      // 3. HTML (.html, .htm)
      else if (['html', 'htm'].includes(ext)) {
        const text = await item.file.text();
        if (targetFormat === 'pdf') {
          const parser = new DOMParser();
          const doc = parser.parseFromString(text, 'text/html');
          const cleanText = doc.body.innerText || doc.body.textContent || text;
          resultBlob = generatePdfFromText(baseName, cleanText);
          outputFilename = `${baseName}.pdf`;
        } else if (targetFormat === 'txt') {
          const parser = new DOMParser();
          const doc = parser.parseFromString(text, 'text/html');
          const cleanText = doc.body.innerText || doc.body.textContent || '';
          resultBlob = new Blob([cleanText], { type: 'text/plain;charset=utf-8;' });
          outputFilename = `${baseName}.txt`;
          textPreview = cleanText.slice(0, 1000);
        } else if (targetFormat === 'md') {
          let md = text
            .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
            .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
            .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
            .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
            .replace(/<[^>]*>/g, '')
            .trim();
          resultBlob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
          outputFilename = `${baseName}.md`;
          textPreview = md.slice(0, 1000);
        }
      }

      // 4. Markdown (.md)
      else if (['md', 'markdown'].includes(ext)) {
        const text = await item.file.text();
        if (targetFormat === 'html') {
          const bodyHtml = await marked.parse(text);
          const wrapperHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${baseName}</title></head><body>${bodyHtml}</body></html>`;
          resultBlob = new Blob([wrapperHtml], { type: 'text/html;charset=utf-8;' });
          outputFilename = `${baseName}.html`;
          textPreview = wrapperHtml.slice(0, 1000);
        } else if (targetFormat === 'pdf') {
          resultBlob = generatePdfFromText(baseName, text);
          outputFilename = `${baseName}.pdf`;
        } else if (targetFormat === 'docx') {
          resultBlob = await createDocxFromText(baseName, text);
          outputFilename = `${baseName}.docx`;
        } else if (targetFormat === 'txt') {
          const plain = text.replace(/#+\s+/g, '').replace(/[*_`[\]]/g, '');
          resultBlob = new Blob([plain], { type: 'text/plain;charset=utf-8;' });
          outputFilename = `${baseName}.txt`;
          textPreview = plain.slice(0, 1000);
        }
      }

      // 5. Plain Text (.txt)
      else if (ext === 'txt') {
        const text = await item.file.text();
        if (targetFormat === 'pdf') {
          resultBlob = generatePdfFromText(baseName, text);
          outputFilename = `${baseName}.pdf`;
        } else if (targetFormat === 'docx') {
          resultBlob = await createDocxFromText(baseName, text);
          outputFilename = `${baseName}.docx`;
        } else if (targetFormat === 'html') {
          const htmlContent = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${baseName}</title></head><body><pre>${text}</pre></body></html>`;
          resultBlob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
          outputFilename = `${baseName}.html`;
          textPreview = htmlContent.slice(0, 1000);
        } else if (targetFormat === 'md') {
          resultBlob = new Blob([text], { type: 'text/markdown;charset=utf-8;' });
          outputFilename = `${baseName}.md`;
          textPreview = text.slice(0, 1000);
        } else if (targetFormat === 'base64') {
          const b64 = btoa(text);
          resultBlob = new Blob([b64], { type: 'text/plain;charset=utf-8;' });
          outputFilename = `${baseName}_base64.txt`;
          textPreview = b64.slice(0, 1000);
        }
      }

      // 6. RTF (.rtf)
      else if (ext === 'rtf') {
        const rtfRaw = await item.file.text();
        const plainText = rtfToPlainText(rtfRaw);
        if (targetFormat === 'pdf') {
          resultBlob = generatePdfFromText(baseName, plainText);
          outputFilename = `${baseName}.pdf`;
        } else if (targetFormat === 'docx') {
          resultBlob = await createDocxFromText(baseName, plainText);
          outputFilename = `${baseName}.docx`;
        } else if (targetFormat === 'txt') {
          resultBlob = new Blob([plainText], { type: 'text/plain;charset=utf-8;' });
          outputFilename = `${baseName}.txt`;
          textPreview = plainText.slice(0, 1000);
        }
      }

      // 7. EPUB (.epub)
      else if (ext === 'epub') {
        const { text: epubText, title } = await extractTextFromEpub(item.file);
        if (targetFormat === 'pdf') {
          resultBlob = generatePdfFromText(title || baseName, epubText);
          outputFilename = `${baseName}.pdf`;
        } else if (targetFormat === 'txt') {
          resultBlob = new Blob([epubText], { type: 'text/plain;charset=utf-8;' });
          outputFilename = `${baseName}.txt`;
          textPreview = epubText.slice(0, 1000);
        }
      }

      // 8. Excel (.xlsx, .xls)
      else if (['xlsx', 'xls'].includes(ext)) {
        const arrayBuf = await item.file.arrayBuffer();
        const wb = XLSX.read(arrayBuf, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];

        if (targetFormat === 'csv') {
          const csvText = XLSX.utils.sheet_to_csv(sheet);
          resultBlob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
          outputFilename = `${baseName}.csv`;
          textPreview = csvText.slice(0, 1000);
        } else if (targetFormat === 'json') {
          const jsonData = XLSX.utils.sheet_to_json(sheet);
          const jsonStr = JSON.stringify(jsonData, null, 2);
          resultBlob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
          outputFilename = `${baseName}.json`;
          textPreview = jsonStr.slice(0, 1000);
        } else if (targetFormat === 'pdf') {
          const aoa: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          if (aoa.length === 0) throw new Error('Excel sheet is empty.');
          resultBlob = generatePdfFromTable(baseName, aoa[0].map(String), aoa.slice(1));
          outputFilename = `${baseName}.pdf`;
        }
      }

      // 9. CSV (.csv)
      else if (ext === 'csv') {
        const text = await item.file.text();
        const wb = XLSX.read(text, { type: 'string', raw: true });
        const sheetName = wb.SheetNames[0] || 'Sheet1';
        const sheet = wb.Sheets[sheetName] || {};

        if (targetFormat === 'xlsx') {
          const wbOut = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
          resultBlob = new Blob([wbOut], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          });
          outputFilename = `${baseName}.xlsx`;
        } else if (targetFormat === 'json') {
          const jsonData = XLSX.utils.sheet_to_json(sheet);
          const jsonStr = JSON.stringify(jsonData, null, 2);
          resultBlob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
          outputFilename = `${baseName}.json`;
          textPreview = jsonStr.slice(0, 1000);
        } else if (targetFormat === 'pdf') {
          const aoa: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 });
          if (!aoa || aoa.length === 0) {
            resultBlob = generatePdfFromText(baseName, text);
          } else {
            const headers = (aoa[0] || []).map(String);
            const dataRows = aoa.slice(1);
            resultBlob = generatePdfFromTable(baseName, headers, dataRows);
          }
          outputFilename = `${baseName}.pdf`;
        }
      }

      // 10. JSON (.json)
      else if (ext === 'json') {
        const text = await item.file.text();
        const parsed = JSON.parse(text);

        if (targetFormat === 'csv') {
          let rows = Array.isArray(parsed) ? parsed : [parsed];
          const ws = XLSX.utils.json_to_sheet(rows);
          const csvText = XLSX.utils.sheet_to_csv(ws);
          resultBlob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
          outputFilename = `${baseName}.csv`;
          textPreview = csvText.slice(0, 1000);
        } else if (targetFormat === 'xlsx') {
          let rows = Array.isArray(parsed) ? parsed : [parsed];
          const ws = XLSX.utils.json_to_sheet(rows);
          const wb = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(wb, ws, 'Data');
          const wbOut = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
          resultBlob = new Blob([wbOut], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          });
          outputFilename = `${baseName}.xlsx`;
        } else if (targetFormat === 'pdf') {
          resultBlob = generatePdfFromText(baseName, JSON.stringify(parsed, null, 2));
          outputFilename = `${baseName}.pdf`;
        } else if (targetFormat === 'yaml') {
          const yamlStr = jsyaml.dump(parsed, { indent: 2 });
          resultBlob = new Blob([yamlStr], { type: 'text/yaml;charset=utf-8;' });
          outputFilename = `${baseName}.yaml`;
          textPreview = yamlStr.slice(0, 1000);
        } else if (targetFormat === 'xml') {
          const xmlStr = '<?xml version="1.0" encoding="UTF-8"?>\n' + jsonToXml(parsed, 'root');
          resultBlob = new Blob([xmlStr], { type: 'application/xml;charset=utf-8;' });
          outputFilename = `${baseName}.xml`;
          textPreview = xmlStr.slice(0, 1000);
        } else if (targetFormat === 'ini') {
          const iniStr = jsonToIni(parsed);
          resultBlob = new Blob([iniStr], { type: 'text/plain;charset=utf-8;' });
          outputFilename = `${baseName}.ini`;
          textPreview = iniStr.slice(0, 1000);
        } else if (targetFormat === 'base64') {
          const b64 = btoa(text);
          resultBlob = new Blob([b64], { type: 'text/plain;charset=utf-8;' });
          outputFilename = `${baseName}_base64.txt`;
          textPreview = b64.slice(0, 1000);
        }
      }

      // 11. Images: JPG, PNG, WebP, SVG, HEIC, AVIF, BMP, TIFF, GIF
      else if (
        ['png', 'jpg', 'jpeg', 'webp', 'svg', 'heic', 'heif', 'avif', 'bmp', 'tiff', 'tif', 'gif'].includes(ext)
      ) {
        if (targetFormat === 'pdf') {
          resultBlob = await convertImageToPdf(item.file);
          outputFilename = `${baseName}.pdf`;
        } else if (targetFormat === 'svg') {
          resultBlob = await convertImageToSvg(item.file);
          outputFilename = `${baseName}.svg`;
        } else if (targetFormat === 'base64') {
          const b64 = await fileToBase64(item.file);
          resultBlob = new Blob([b64], { type: 'text/plain;charset=utf-8;' });
          outputFilename = `${baseName}_base64.txt`;
          textPreview = b64.slice(0, 1000);
        } else if (['jpg', 'png', 'webp', 'avif', 'bmp'].includes(targetFormat)) {
          resultBlob = await convertRasterImage(
            item.file,
            targetFormat as 'jpg' | 'png' | 'webp' | 'avif' | 'bmp'
          );
          outputFilename = `${baseName}.${targetFormat}`;
        }
      }

      // 12. Configs: YAML, XML, INI
      else if (['yaml', 'yml'].includes(ext) && targetFormat === 'json') {
        const text = await item.file.text();
        const parsed = jsyaml.load(text);
        const jsonStr = JSON.stringify(parsed, null, 2);
        resultBlob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
        outputFilename = `${baseName}.json`;
        textPreview = jsonStr.slice(0, 1000);
      } else if (ext === 'xml' && targetFormat === 'json') {
        const text = await item.file.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'application/xml');
        if (doc.querySelector('parsererror')) throw new Error('XML parsing failed.');
        const parsed = xmlToJson(doc.documentElement);
        const jsonStr = JSON.stringify({ [doc.documentElement.nodeName]: parsed }, null, 2);
        resultBlob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
        outputFilename = `${baseName}.json`;
        textPreview = jsonStr.slice(0, 1000);
      } else if (ext === 'ini' && targetFormat === 'json') {
        const text = await item.file.text();
        const parsed = iniToJson(text);
        const jsonStr = JSON.stringify(parsed, null, 2);
        resultBlob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
        outputFilename = `${baseName}.json`;
        textPreview = jsonStr.slice(0, 1000);
      }

      if (!resultBlob) throw new Error(`Cannot convert ${ext.toUpperCase()} to ${targetFormat.toUpperCase()}`);

      const url = URL.createObjectURL(resultBlob);
      const convertedSize = resultBlob.size;

      return {
        ...item,
        status: 'completed',
        resultBlob,
        resultUrl: url,
        resultFilename: outputFilename,
        previewContent: textPreview,
        error: undefined,
        stats: {
          duration: Math.round(performance.now() - startTime),
          originalSize,
          convertedSize,
          savings: Math.round(((originalSize - convertedSize) / originalSize) * 100),
        },
      };
    } catch (err: any) {
      return {
        ...item,
        status: 'error',
        error: err.message || 'Conversion failed',
      };
    }
  };

  // Convert All Files in Queue
  const handleConvertAll = async () => {
    if (fileQueue.length === 0) return;
    setIsConvertingAll(true);

    const queueSnapshot = [...fileQueue];
    const results: FileQueueItem[] = [];

    for (let i = 0; i < queueSnapshot.length; i++) {
      // Set status to converting
      setFileQueue((prev) =>
        prev.map((item, idx) => (idx === i ? { ...item, status: 'converting', error: undefined } : item))
      );

      const convertedItem = await processSingleFile(queueSnapshot[i]);
      results.push(convertedItem);

      setFileQueue((prev) =>
        prev.map((item, idx) => (idx === i ? convertedItem : item))
      );
    }

    setIsConvertingAll(false);
    toast.success('All files converted successfully!');
  };

  // Safe programmatic download helper to avoid browser security warnings
  const triggerSafeDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.setAttribute('download', filename);
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 1000);
  };

  // Download All as ZIP for multiple files
  const handleDownloadAllZip = async () => {
    const completedItems = fileQueue.filter((i) => i.status === 'completed' && i.resultBlob);
    if (completedItems.length === 0) {
      toast.error('No converted files ready for download.');
      return;
    }

    // If single file, download directly without ZIP
    if (completedItems.length === 1) {
      const single = completedItems[0];
      if (single.resultBlob && single.resultFilename) {
        triggerSafeDownload(single.resultBlob, single.resultFilename);
      }
      return;
    }

    setIsZipping(true);
    try {
      const zip = new JSZip();
      completedItems.forEach((item) => {
        if (item.resultBlob && item.resultFilename) {
          zip.file(item.resultFilename, item.resultBlob);
        }
      });

      const zipBlob = await zip.generateAsync({
        type: 'blob',
        mimeType: 'application/zip',
        compression: 'DEFLATE',
        compressionOptions: { level: 6 },
      });

      triggerSafeDownload(zipBlob, 'converted_files.zip');
      toast.success('Downloaded all converted files in ZIP archive!');
    } catch (err: any) {
      toast.error('Failed to create ZIP package.');
    } finally {
      setIsZipping(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const completedFiles = fileQueue.filter((i) => i.status === 'completed');
  const activePreviewItem = fileQueue.find((i) => i.id === activePreviewId) || completedFiles[0] || fileQueue[0];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Col: Upload & Multi-File Queue */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="border-border/80 shadow-md backdrop-blur-sm bg-card/60 relative overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <ArrowRightLeft className="h-5 w-5 text-primary" />
                   Universal Converter
                </CardTitle>
                <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                  100% In-Browser Privacy
                </Badge>
              </div>
              <CardDescription className="text-xs">
                Select one or multiple Word, PDF, Excel, RTF, EPUB, CSV, JSON, Markdown, or Image files.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <input
                type="file"
                ref={fileInputRef}
                multiple
                className="hidden"
                onChange={handleFileChange}
                accept=".docx,.doc,.pdf,.xlsx,.xls,.rtf,.epub,.csv,.json,.md,.markdown,.html,.htm,.txt,.png,.jpg,.jpeg,.webp,.svg,.heic,.heif,.avif,.bmp,.tiff,.tif,.gif,.yaml,.yml,.xml,.ini"
              />

              {fileQueue.length === 0 ? (
                <div
                  className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                    dragActive
                      ? 'border-primary bg-primary/5 scale-[0.99] shadow-inner'
                      : 'border-border/60 hover:border-primary/40 hover:bg-muted/10'
                  }`}
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className="h-16 w-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
                    <FileUp className="h-8 w-8 animate-pulse" />
                  </div>
                  <h3 className="font-bold text-sm text-foreground">Click to Browse or Drag & Drop Multiple Files</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                    Select multiple files to convert simultaneously with individual or batch output options.
                  </p>
                  <div className="flex flex-wrap items-center justify-center gap-1.5 mt-4 max-w-md">
                    {['Word', 'PDF', 'Excel', 'JPG', 'PNG', 'WebP', 'SVG', 'HEIC', 'Markdown', 'CSV', 'JSON', 'RTF', 'EPUB'].map((badge) => (
                      <span key={badge} className="text-[10px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/50">
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Queue Header Controls & Convert All Dropdown */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1 border-b">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                      <Layers className="h-4 w-4 text-primary" />
                      Selected Files ({fileQueue.length})
                    </span>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Convert all files dropdown button */}
                      {fileQueue.length > 1 && (
                        <div className="flex items-center gap-1.5 bg-muted/50 p-1 rounded-lg border border-border/80">
                          <span className="text-[11px] font-medium text-muted-foreground pl-1.5 flex items-center gap-1">
                            <Sparkles className="h-3 w-3 text-primary" />
                            Convert all to:
                          </span>
                          <Select onValueChange={handleChangeAllFormat}>
                            <SelectTrigger className="text-xs h-7 w-36 bg-background">
                              <SelectValue placeholder="Select format..." />
                            </SelectTrigger>
                            <SelectContent>
                              {GLOBAL_COMMON_FORMATS.map((fmt) => (
                                <SelectItem key={fmt.value} value={fmt.value} className="text-xs">
                                  {fmt.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fileInputRef.current?.click()}
                        className="h-7 text-xs gap-1"
                      >
                        <Plus className="h-3 w-3" />
                        Add
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearAllQueue}
                        className="h-7 text-xs text-rose-500 hover:bg-rose-500/10"
                      >
                        Clear
                      </Button>
                    </div>
                  </div>

                  {/* File Queue Items List */}
                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {fileQueue.map((item) => {
                      const fileExt = item.file.name.split('.').pop()?.toLowerCase() || '';
                      return (
                        <div
                          key={item.id}
                          onClick={() => setActivePreviewId(item.id)}
                          className={`p-3 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all cursor-pointer ${
                            activePreviewId === item.id
                              ? 'border-primary/50 bg-primary/5 shadow-sm'
                              : 'bg-muted/30 hover:bg-muted/50 border-border/60'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className="h-9 w-9 bg-primary/10 text-primary rounded-lg flex items-center justify-center shrink-0">
                              {getFileTypeIcon(item.file.name)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-xs text-foreground truncate">{item.file.name}</p>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                <span className="text-[10px] text-muted-foreground">{formatBytes(item.file.size)}</span>
                                
                                {/* Visual Conversion Symbol / Badges: FROM -> TO */}
                                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-muted/80 border border-border/60 text-[10px] font-mono">
                                  <span className="font-bold text-muted-foreground uppercase">{fileExt}</span>
                                  <ArrowRight className="h-2.5 w-2.5 text-primary" />
                                  <span className="font-bold text-primary uppercase">{item.targetFormat}</span>
                                </div>

                                {item.status === 'completed' && <span className="text-emerald-500 font-bold text-[10px]">✓ Converted</span>}
                                {item.status === 'error' && <span className="text-rose-500 font-bold text-[10px]">✗ {item.error}</span>}
                                {item.status === 'converting' && <span className="text-primary font-bold text-[10px] animate-pulse">Converting...</span>}
                              </div>
                            </div>
                          </div>

                          {/* Format selector for this specific file with animated moving right arrow */}
                          <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center text-primary" title="Convert to">
                              <ArrowRight className="h-4 w-4 animate-move-right" />
                            </div>

                            <Select
                              value={item.targetFormat}
                              onValueChange={(val) => updateItemTargetFormat(item.id, val)}
                              disabled={isConvertingAll}
                            >
                              <SelectTrigger className="text-xs h-8 w-36">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {getAvailableFormats(item.file).map((fmt) => (
                                  <SelectItem key={fmt.value} value={fmt.value} className="text-xs">
                                    {fmt.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            <button
                              onClick={() => removeItemFromQueue(item.id)}
                              className="p-1 rounded-md text-rose-500 hover:bg-rose-500/10 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Convert All Action Button */}
                  <Button
                    onClick={handleConvertAll}
                    disabled={isConvertingAll || fileQueue.length === 0}
                    className="w-full gap-2 text-xs font-bold py-5 shadow-lg shadow-primary/15"
                  >
                    {isConvertingAll ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Converting {fileQueue.length} File(s)...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Convert {fileQueue.length} File{fileQueue.length > 1 ? 's' : ''} Now
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Conversion Statistics for active item */}
          {activePreviewItem?.stats && (
            <Card className="border-border/80 bg-card/60">
              <CardContent className="pt-4 grid grid-cols-4 gap-2 text-center">
                <div className="p-2 bg-muted/40 rounded-lg">
                  <p className="text-[10px] text-muted-foreground uppercase">Duration</p>
                  <p className="text-xs font-bold text-primary mt-0.5">{activePreviewItem.stats.duration} ms</p>
                </div>
                <div className="p-2 bg-muted/40 rounded-lg">
                  <p className="text-[10px] text-muted-foreground uppercase">Original</p>
                  <p className="text-xs font-bold text-foreground mt-0.5">{formatBytes(activePreviewItem.stats.originalSize)}</p>
                </div>
                <div className="p-2 bg-muted/40 rounded-lg">
                  <p className="text-[10px] text-muted-foreground uppercase">Output</p>
                  <p className="text-xs font-bold text-emerald-500 mt-0.5">{formatBytes(activePreviewItem.stats.convertedSize)}</p>
                </div>
                <div className="p-2 bg-muted/40 rounded-lg">
                  <p className="text-[10px] text-muted-foreground uppercase">Ratio</p>
                  <p className="text-xs font-bold text-cyan-500 mt-0.5">
                    {activePreviewItem.stats.savings > 0 ? `-${activePreviewItem.stats.savings}%` : 'Standard'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Col: Converted Output & ZIP Batch Download */}
        <div className="lg:col-span-5 space-y-6">
          <Card className="border-border/80 shadow-md backdrop-blur-sm bg-card/60 h-full flex flex-col justify-between">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                  Converted Output
                </CardTitle>
                {completedFiles.length > 0 && (
                  <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/20">
                    {completedFiles.length} Ready
                  </Badge>
                )}
              </div>
              <CardDescription className="text-xs">
                {completedFiles.length > 0
                  ? 'All converted files are ready for instant download.'
                  : 'Converted results and download links will appear here.'}
              </CardDescription>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col justify-between space-y-4">
              {completedFiles.length > 0 ? (
                <div className="space-y-4 flex-1 flex flex-col justify-between">
                  {/* Converted Files List in Upper Side */}
                  <div className="space-y-2.5 flex-1">
                    <div className="flex items-center justify-between pb-1.5 border-b">
                      <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                        <CheckCircle className="h-4 w-4 text-emerald-500" />
                        Converted Files ({completedFiles.length})
                      </p>
                      <span className="text-[10px] text-muted-foreground">Ready for instant download</span>
                    </div>

                    <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                      {completedFiles.map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 transition-all text-xs"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className="h-8 w-8 bg-emerald-500/10 text-emerald-600 rounded-lg flex items-center justify-center shrink-0">
                              {getFileTypeIcon(item.resultFilename || item.file.name)}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold text-xs text-foreground truncate">{item.resultFilename}</p>
                              <p className="text-[10px] text-muted-foreground flex items-center gap-2 mt-0.5">
                                <span>{formatBytes(item.resultBlob?.size || 0)}</span>
                                <span className="text-emerald-500 font-bold">✓ Converted</span>
                              </p>
                            </div>
                          </div>

                          <Button
                            size="sm"
                            onClick={() => {
                              if (item.resultBlob && item.resultFilename) {
                                triggerSafeDownload(item.resultBlob, item.resultFilename);
                              }
                            }}
                            className="flex items-center gap-1 h-7 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs transition-colors shrink-0 shadow-sm"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span>Download</span>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Download Action Buttons at Bottom */}
                  <div className="space-y-2 pt-2 border-t">
                    {/* If Multiple Files: Show Download All as ZIP button */}
                    {completedFiles.length > 1 ? (
                      <Button
                        onClick={handleDownloadAllZip}
                        disabled={isZipping}
                        className="w-full gap-2 font-bold text-xs py-5 bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20"
                      >
                        {isZipping ? (
                          <>
                            <RefreshCw className="h-4 w-4 animate-spin" />
                            Packaging ZIP Archive...
                          </>
                        ) : (
                          <>
                            <Archive className="h-4 w-4" />
                            Download All as ZIP ({completedFiles.length} Files)
                          </>
                        )}
                      </Button>
                    ) : (
                      /* If Single File: Standard direct safe download */
                      completedFiles[0] && (
                        <Button
                          onClick={() => {
                            if (completedFiles[0]?.resultBlob && completedFiles[0]?.resultFilename) {
                              triggerSafeDownload(completedFiles[0].resultBlob, completedFiles[0].resultFilename);
                            }
                          }}
                          className="w-full gap-2 font-bold text-xs py-5 bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-500/20"
                        >
                          <Download className="h-4 w-4" />
                          Download {completedFiles[0].resultFilename}
                        </Button>
                      )
                    )}
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground border-2 border-dashed rounded-xl">
                  <Layers className="h-10 w-10 mb-2 opacity-30 text-muted-foreground" />
                  <p className="text-xs font-medium">Add files and click convert to generate outputs.</p>
                  <p className="text-[11px] opacity-70 mt-1">Multi-file batch conversion with ZIP export.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Comprehensive Conversion Matrix Card */}
      <Card className="border-border/80 bg-card/40">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            Supported Format Conversions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-muted/20 border rounded-lg space-y-1.5">
              <h4 className="font-bold text-foreground flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-blue-500" /> Documents
              </h4>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Word ↔ PDF ↔ TXT ↔ HTML ↔ Markdown, RTF → PDF/Word, EPUB → PDF/TXT.
              </p>
            </div>
            <div className="p-3 bg-muted/20 border rounded-lg space-y-1.5">
              <h4 className="font-bold text-foreground flex items-center gap-1.5">
                <ImageIcon className="h-3.5 w-3.5 text-amber-500" /> Images
              </h4>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                JPG, PNG, WebP, SVG, HEIC, AVIF, BMP, TIFF, GIF ↔ Raster / PDF / Base64 / Vector SVG.
              </p>
            </div>
            <div className="p-3 bg-muted/20 border rounded-lg space-y-1.5">
              <h4 className="font-bold text-foreground flex items-center gap-1.5">
                <TableIcon className="h-3.5 w-3.5 text-emerald-500" /> Spreadsheets & Data
              </h4>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Excel (.xlsx, .xls) ↔ CSV ↔ JSON ↔ PDF Table Grid, YAML, XML, INI.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
