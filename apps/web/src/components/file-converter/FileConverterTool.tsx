'use client';

import React, { useState, useRef } from 'react';
import { marked } from 'marked';
import jsyaml from 'js-yaml';
import { 
  FileUp, 
  RefreshCw, 
  Download, 
  CheckCircle, 
  AlertCircle, 
  Trash2, 
  FileText, 
  Image as ImageIcon,
  Table,
  ArrowRightLeft,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLocale } from '@/context/LocalizationContext';

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to read file.'));
      }
    };
    reader.onerror = () => reject(reader.error);
  });
};

function jsonToXml(obj: any, rootName = 'root'): string {
  let xml = '';
  if (typeof obj !== 'object' || obj === null) {
    return String(obj);
  }
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
  if (xmlNode.nodeType === Node.TEXT_NODE) {
    return xmlNode.nodeValue?.trim();
  }
  const obj: any = {};
  if (xmlNode.nodeType === Node.ELEMENT_NODE) {
    const element = xmlNode as Element;
    if (element.hasAttributes()) {
      obj['@attributes'] = {};
      for (let j = 0; j < element.attributes.length; j++) {
        const attribute = element.attributes.item(j);
        if (attribute) {
          obj['@attributes'][attribute.nodeName] = attribute.nodeValue;
        }
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
          if (xmlNode.childNodes.length === 1) {
            return text;
          } else {
            obj['#text'] = text;
          }
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

export function FileConverterTool() {
  const { t } = useLocale();
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Conversion state
  const [targetFormat, setTargetFormat] = useState<string>('');
  const [converting, setConverting] = useState(false);
  const [convertedDataUrl, setConvertedDataUrl] = useState<string | null>(null);
  const [convertedFilename, setConvertedFilename] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [stats, setStats] = useState<ConversionStat | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Determine available target formats based on file extension
  const getAvailableFormats = (file: File | null) => {
    if (!file) return [];
    const ext = file.name.split('.').pop()?.toLowerCase();
    
    if (['csv'].includes(ext || '')) return [{ label: 'JSON Array', value: 'json' }];
    if (['json'].includes(ext || '')) {
      return [
        { label: 'CSV Spreadsheet', value: 'csv' },
        { label: 'YAML Configuration', value: 'yaml' },
        { label: 'XML Configuration', value: 'xml' },
        { label: 'INI Configuration', value: 'ini' },
        { label: 'Base64 Encoded Text', value: 'base64' },
      ];
    }
    if (['yaml', 'yml'].includes(ext || '')) return [{ label: 'JSON Format', value: 'json' }];
    if (['xml'].includes(ext || '')) return [{ label: 'JSON Format', value: 'json' }];
    if (['ini'].includes(ext || '')) return [{ label: 'JSON Format', value: 'json' }];
    if (['md', 'markdown'].includes(ext || '')) return [{ label: 'HTML Webpage', value: 'html' }];
    if (['html', 'htm'].includes(ext || '')) return [{ label: 'Markdown Document', value: 'md' }];
    if (['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(ext || '')) {
      return [
        { label: 'WebP Image', value: 'webp' },
        { label: 'PNG Image', value: 'png' },
        { label: 'JPEG Image', value: 'jpg' },
        { label: 'Base64 Encoded Text', value: 'base64' },
      ].filter(f => f.value !== ext && !(ext === 'jpeg' && f.value === 'jpg'));
    }
    if (ext === 'txt') {
      return [
        { label: 'Base64 Encoded Text', value: 'base64' },
        { label: 'Decode Base64 to Binary File', value: 'binary' }
      ];
    }
    return [
      { label: 'Base64 Encoded Text', value: 'base64' }
    ];
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const resetState = () => {
    setSelectedFile(null);
    setTargetFormat('');
    setConvertedDataUrl(null);
    setConvertedFilename('');
    setErrorMsg(null);
    setStats(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      setErrorMsg(null);
      setConvertedDataUrl(null);
      
      const formats = getAvailableFormats(file);
      if (formats.length > 0) {
        setTargetFormat(formats[0].value);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setErrorMsg(null);
      setConvertedDataUrl(null);
      
      const formats = getAvailableFormats(file);
      if (formats.length > 0) {
        setTargetFormat(formats[0].value);
      }
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const convertFile = async () => {
    if (!selectedFile || !targetFormat) return;
    setConverting(true);
    setErrorMsg(null);
    setConvertedDataUrl(null);
    setStats(null);

    const startTime = performance.now();
    const originalSize = selectedFile.size;
    const ext = selectedFile.name.split('.').pop()?.toLowerCase() || '';
    const baseName = selectedFile.name.substring(0, selectedFile.name.lastIndexOf('.'));

    try {
      // 1. JSON to YAML
      if (ext === 'json' && targetFormat === 'yaml') {
        const text = await selectedFile.text();
        const parsed = JSON.parse(text);
        const yamlStr = jsyaml.dump(parsed, { indent: 2 });
        const blob = new Blob([yamlStr], { type: 'text/yaml;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        setConvertedDataUrl(url);
        setConvertedFilename(`${baseName}.yaml`);
        const convertedSize = blob.size;
        setStats({
          duration: Math.round(performance.now() - startTime),
          originalSize,
          convertedSize,
          savings: Math.round(((originalSize - convertedSize) / originalSize) * 100)
        });
        setConverting(false);
      }
      // 2. YAML to JSON
      else if ((ext === 'yaml' || ext === 'yml') && targetFormat === 'json') {
        const text = await selectedFile.text();
        const parsed = jsyaml.load(text);
        const jsonStr = JSON.stringify(parsed, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        setConvertedDataUrl(url);
        setConvertedFilename(`${baseName}.json`);
        const convertedSize = blob.size;
        setStats({
          duration: Math.round(performance.now() - startTime),
          originalSize,
          convertedSize,
          savings: Math.round(((originalSize - convertedSize) / originalSize) * 100)
        });
        setConverting(false);
      }
      // 3. JSON to XML
      else if (ext === 'json' && targetFormat === 'xml') {
        const text = await selectedFile.text();
        const parsed = JSON.parse(text);
        const xmlStr = '<?xml version="1.0" encoding="UTF-8"?>\n' + jsonToXml(parsed, 'root');
        const blob = new Blob([xmlStr], { type: 'application/xml;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        setConvertedDataUrl(url);
        setConvertedFilename(`${baseName}.xml`);
        const convertedSize = blob.size;
        setStats({
          duration: Math.round(performance.now() - startTime),
          originalSize,
          convertedSize,
          savings: Math.round(((originalSize - convertedSize) / originalSize) * 100)
        });
        setConverting(false);
      }
      // 4. XML to JSON
      else if (ext === 'xml' && targetFormat === 'json') {
        const text = await selectedFile.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'application/xml');
        const errorNode = doc.querySelector('parsererror');
        if (errorNode) throw new Error('XML parsing failed');
        const parsed = xmlToJson(doc.documentElement);
        const jsonStr = JSON.stringify({ [doc.documentElement.nodeName]: parsed }, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        setConvertedDataUrl(url);
        setConvertedFilename(`${baseName}.json`);
        const convertedSize = blob.size;
        setStats({
          duration: Math.round(performance.now() - startTime),
          originalSize,
          convertedSize,
          savings: Math.round(((originalSize - convertedSize) / originalSize) * 100)
        });
        setConverting(false);
      }
      // 5. JSON to INI
      else if (ext === 'json' && targetFormat === 'ini') {
        const text = await selectedFile.text();
        const parsed = JSON.parse(text);
        const iniStr = jsonToIni(parsed);
        const blob = new Blob([iniStr], { type: 'text/plain;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        setConvertedDataUrl(url);
        setConvertedFilename(`${baseName}.ini`);
        const convertedSize = blob.size;
        setStats({
          duration: Math.round(performance.now() - startTime),
          originalSize,
          convertedSize,
          savings: Math.round(((originalSize - convertedSize) / originalSize) * 100)
        });
        setConverting(false);
      }
      // 6. INI to JSON
      else if (ext === 'ini' && targetFormat === 'json') {
        const text = await selectedFile.text();
        const parsed = iniToJson(text);
        const jsonStr = JSON.stringify(parsed, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        setConvertedDataUrl(url);
        setConvertedFilename(`${baseName}.json`);
        const convertedSize = blob.size;
        setStats({
          duration: Math.round(performance.now() - startTime),
          originalSize,
          convertedSize,
          savings: Math.round(((originalSize - convertedSize) / originalSize) * 100)
        });
        setConverting(false);
      }
      // 7. File to Base64
      else if (targetFormat === 'base64') {
        const base64Str = await fileToBase64(selectedFile);
        const blob = new Blob([base64Str], { type: 'text/plain;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        setConvertedDataUrl(url);
        setConvertedFilename(`${baseName}_base64.txt`);
        const convertedSize = blob.size;
        setStats({
          duration: Math.round(performance.now() - startTime),
          originalSize,
          convertedSize,
          savings: Math.round(((originalSize - convertedSize) / originalSize) * 100)
        });
        setConverting(false);
      }
      // 8. Base64 back to binary file
      else if (targetFormat === 'binary') {
        const text = await selectedFile.text();
        const base64Regex = /^(?:data:\w+\/\w+;base64,)?([A-Za-z0-9+/=]+)$/;
        const match = text.trim().match(base64Regex);
        if (!match) throw new Error('Invalid Base64 text file content');
        const base64Data = match[1];
        
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        
        let mime = 'application/octet-stream';
        const mimeMatch = text.trim().match(/^data:([\w+\/\w+]+);base64,/);
        if (mimeMatch) mime = mimeMatch[1];
        const fileExt = mime.split('/')[1] || 'bin';

        const blob = new Blob([byteArray], { type: mime });
        const url = URL.createObjectURL(blob);
        setConvertedDataUrl(url);
        setConvertedFilename(`${baseName}_decoded.${fileExt}`);
        const convertedSize = blob.size;
        setStats({
          duration: Math.round(performance.now() - startTime),
          originalSize,
          convertedSize,
          savings: Math.round(((originalSize - convertedSize) / originalSize) * 100)
        });
        setConverting(false);
      }
      else if (ext === 'csv' && targetFormat === 'json') {
        const text = await selectedFile.text();
        const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
        if (lines.length === 0) throw new Error('Empty CSV data.');
        
        // Robust CSV line parser matching Excel rules (escaped commas in quotes)
        const parseCSVLine = (line: string) => {
          const result = [];
          let current = '';
          let inQuotes = false;
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim().replace(/^["']|["']$/g, ''));
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current.trim().replace(/^["']|["']$/g, ''));
          return result;
        };

        const headers = parseCSVLine(lines[0]);
        const rows = [];
        
        for (let i = 1; i < lines.length; i++) {
          const cols = parseCSVLine(lines[i]);
          const row: Record<string, string> = {};
          headers.forEach((header, idx) => {
            row[header] = cols[idx] || '';
          });
          rows.push(row);
        }
        
        const jsonStr = JSON.stringify(rows, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        setConvertedDataUrl(url);
        setConvertedFilename(`${baseName}.json`);
        
        const convertedSize = blob.size;
        setStats({
          duration: Math.round(performance.now() - startTime),
          originalSize,
          convertedSize,
          savings: Math.round(((originalSize - convertedSize) / originalSize) * 100)
        });
        setConverting(false);

      } else if (ext === 'json' && targetFormat === 'csv') {
        const text = await selectedFile.text();
        const rows = JSON.parse(text);
        if (!Array.isArray(rows) || rows.length === 0) {
          throw new Error('JSON must be a non-empty array of objects.');
        }
        
        const headers = Object.keys(rows[0]);
        const csvLines = [headers.join(',')];
        
        rows.forEach(row => {
          const values = headers.map(h => {
            const val = String(row[h] || '').replace(/"/g, '""');
            return val.includes(',') || val.includes('"') || val.includes('\n') ? `"${val}"` : val;
          });
          csvLines.push(values.join(','));
        });
        
        const csvStr = csvLines.join('\n');
        const blob = new Blob([csvStr], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        setConvertedDataUrl(url);
        setConvertedFilename(`${baseName}.csv`);
        
        const convertedSize = blob.size;
        setStats({
          duration: Math.round(performance.now() - startTime),
          originalSize,
          convertedSize,
          savings: Math.round(((originalSize - convertedSize) / originalSize) * 100)
        });
        setConverting(false);

      } else if ((ext === 'md' || ext === 'markdown') && targetFormat === 'html') {
        const text = await selectedFile.text();
        const bodyHtml = await marked.parse(text);

        const wrapperHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${baseName}</title>
  <style>
    body { font-family: system-ui, -apple-system, sans-serif; line-height: 1.6; max-width: 800px; margin: 40px auto; padding: 0 20px; color: #1f2937; background-color: #f9fafb; }
    h1, h2, h3 { color: #111827; margin-top: 24px; font-weight: 800; }
    a { color: #2563eb; text-decoration: none; }
    a:hover { text-decoration: underline; }
    code { font-family: monospace; background: #e5e7eb; padding: 2px 4px; border-radius: 4px; font-size: 0.9em; }
    pre { background: #1f2937; color: #f9fafb; padding: 16px; border-radius: 8px; overflow-x: auto; }
    pre code { background: none; color: inherit; padding: 0; }
  </style>
</head>
<body>
  ${bodyHtml}
</body>
</html>`;

        const blob = new Blob([wrapperHtml], { type: 'text/html;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        setConvertedDataUrl(url);
        setConvertedFilename(`${baseName}.html`);
        
        const convertedSize = blob.size;
        setStats({
          duration: Math.round(performance.now() - startTime),
          originalSize,
          convertedSize,
          savings: Math.round(((originalSize - convertedSize) / originalSize) * 100)
        });
        setConverting(false);

      } else if (ext === 'html' && targetFormat === 'md') {
        const text = await selectedFile.text();
        let md = text
          .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n')
          .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n')
          .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n')
          .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
          .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
          .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
          .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
          .replace(/<li[^>]*>(.*?)<\/li>/gi, '* $1')
          .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
          .replace(/<a[^>]*href=["'](.*?)["'][^>]*>(.*?)<\/a>/gi, '[$2]($1)')
          .replace(/<[^>]*>/g, '');

        const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        setConvertedDataUrl(url);
        setConvertedFilename(`${baseName}.md`);
        
        const convertedSize = blob.size;
        setStats({
          duration: Math.round(performance.now() - startTime),
          originalSize,
          convertedSize,
          savings: Math.round(((originalSize - convertedSize) / originalSize) * 100)
        });
        setConverting(false);

      } else if (['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(ext)) {
        const imgUrl = URL.createObjectURL(selectedFile);
        const img = new Image();
        
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = () => reject(new Error('Failed to load image file.'));
          img.src = imgUrl;
        });

        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Graphics buffer creation failed.');
        
        // Draw white background for JPEGs if needed
        if (targetFormat === 'jpg') {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        ctx.drawImage(img, 0, 0);

        let mimeType = 'image/webp';
        let outputExt = 'webp';
        if (targetFormat === 'png') {
          mimeType = 'image/png';
          outputExt = 'png';
        } else if (targetFormat === 'jpg') {
          mimeType = 'image/jpeg';
          outputExt = 'jpg';
        }

        canvas.toBlob((blob) => {
          if (!blob) {
            setErrorMsg('Failed to process image buffer.');
            setConverting(false);
            return;
          }
          const url = URL.createObjectURL(blob);
          setConvertedDataUrl(url);
          setConvertedFilename(`${baseName}.${outputExt}`);
          
          setStats({
            duration: Math.round(performance.now() - startTime),
            originalSize,
            convertedSize: blob.size,
            savings: Math.round(((originalSize - blob.size) / originalSize) * 100)
          });
          setConverting(false);
        }, mimeType, 0.92);
        
        URL.revokeObjectURL(imgUrl);
      } else {
        throw new Error('Unsupported format matching configuration.');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'File conversion error occurred.');
      setConverting(false);
    }
  };

  const getFormatBadgeColor = (ext: string) => {
    if (['csv', 'json'].includes(ext)) return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
    if (['md', 'html'].includes(ext)) return 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20';
    return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* File Drop and Config zone */}
      <div className="lg:col-span-7 space-y-6">
        <Card className="bg-card/45 border-border/80 shadow-md backdrop-blur-sm relative overflow-hidden">
          <CardHeader className="pb-0">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-primary shrink-0" />
              File Format Convert Tool
            </CardTitle>
            <CardDescription className="font-semibold text-xs mt-1">
              Convert between CSV, JSON, Markdown, and images. All processing is run client-side.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              onChange={handleFileChange} 
              accept=".csv,.json,.md,.markdown,.html,.png,.jpg,.jpeg,.webp,.svg,.yaml,.yml,.xml,.ini,.txt"
            />

            {!selectedFile ? (
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
                onClick={triggerFileInput}
              >
                <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4 shadow-sm">
                  <FileUp className="h-6 w-6" />
                </div>
                <h4 className="text-sm font-bold mb-1">Drag and drop file here</h4>
                <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                  Support formats include CSV, JSON, XML, YAML, INI, Markdown, HTML, PNG, JPG, WebP, SVG, and Base64 text.
                </p>
                <Button size="sm" variant="secondary" className="mt-4 font-bold">
                  Browse Files
                </Button>
              </div>
            ) : (
              <div className="space-y-5">
                {/* File Info Block */}
                <div className="flex items-center justify-between p-3.5 bg-muted/40 rounded-xl border border-border/50">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                      {['png', 'jpg', 'jpeg', 'webp', 'svg'].includes(selectedFile.name.split('.').pop()?.toLowerCase() || '') ? (
                        <ImageIcon className="h-5 w-5" />
                      ) : ['csv', 'json'].includes(selectedFile.name.split('.').pop()?.toLowerCase() || '') ? (
                        <Table className="h-5 w-5" />
                      ) : (
                        <FileText className="h-5 w-5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate max-w-[220px]">{selectedFile.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 font-semibold">
                        Size: {formatBytes(selectedFile.size)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getFormatBadgeColor(selectedFile.name.split('.').pop()?.toLowerCase() || '')}>
                      {(selectedFile.name.split('.').pop() || '').toUpperCase()}
                    </Badge>
                    <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-red-500" onClick={resetState}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Target Format Config */}
                <div className="space-y-2.5">
                  <label className="text-xs font-black uppercase tracking-wider text-muted-foreground">Target Format</label>
                  <Select value={targetFormat} onValueChange={setTargetFormat}>
                    <SelectTrigger className="w-full h-11 bg-background/50 font-bold">
                      <SelectValue placeholder="Select export format..." />
                    </SelectTrigger>
                    <SelectContent>
                      {getAvailableFormats(selectedFile).map((format) => (
                        <SelectItem key={format.value} value={format.value} className="font-bold">
                          {format.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Action Row */}
                <div className="pt-2 flex gap-3">
                  <Button 
                    className="flex-1 font-bold h-11" 
                    onClick={convertFile} 
                    disabled={converting || !targetFormat}
                  >
                    {converting ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                        Converting File...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Convert File
                      </>
                    )}
                  </Button>
                </div>

                {errorMsg && (
                  <div className="flex items-center gap-2 text-xs text-red-500 font-medium bg-red-500/10 border border-red-500/20 p-2.5 rounded-lg">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {errorMsg}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Conversion Output Panel */}
      <div className="lg:col-span-5">
        <Card className="bg-card/45 border-border/80 h-full flex flex-col min-h-[320px]">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-black uppercase tracking-wider text-muted-foreground">Conversion Output</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between pt-0">
            {convertedDataUrl ? (
              <div className="flex-1 flex flex-col justify-between space-y-5">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl">
                    <CheckCircle className="h-5 w-5 shrink-0" />
                    <span className="text-xs font-bold">Conversion successfully complete!</span>
                  </div>

                  {stats && (
                    <div className="bg-muted/30 p-3.5 rounded-xl border border-border/50 text-xs space-y-2 select-none">
                      <div className="flex justify-between border-b border-border/40 pb-2">
                        <span className="text-muted-foreground">Processing Time:</span>
                        <span className="font-bold font-mono">{stats.duration} ms</span>
                      </div>
                      <div className="flex justify-between border-b border-border/40 pb-2">
                        <span className="text-muted-foreground">Original Size:</span>
                        <span className="font-bold font-mono">{formatBytes(stats.originalSize)}</span>
                      </div>
                      <div className="flex justify-between border-b border-border/40 pb-2">
                        <span className="text-muted-foreground">Converted Size:</span>
                        <span className="font-bold font-mono">{formatBytes(stats.convertedSize)}</span>
                      </div>
                      {stats.savings !== 0 && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Size change:</span>
                          <span className={`font-bold font-mono ${stats.savings > 0 ? 'text-emerald-500' : 'text-amber-500'}`}>
                            {stats.savings > 0 ? `Reduced by ${stats.savings}%` : `Increased by ${Math.abs(stats.savings)}%`}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <a 
                  href={convertedDataUrl} 
                  download={convertedFilename} 
                  className="block w-full"
                >
                  <Button className="w-full font-bold h-11 bg-emerald-600 hover:bg-emerald-700 flex items-center justify-center gap-2 text-white">
                    <Download className="h-4 w-4" />
                    Download Converted File
                  </Button>
                </a>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground text-center py-10">
                <Sparkles className="h-8 w-8 text-muted-foreground/30 animate-pulse mb-2" />
                <p className="text-sm">Awaiting conversion trigger from upload panel.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
