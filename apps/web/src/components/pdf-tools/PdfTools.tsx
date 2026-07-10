'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FileText, Plus, ArrowUp, ArrowDown, Trash2, Shield, Scissors, Combine, Loader2, Download, PenTool, Eraser, Move } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { PDFDocument, degrees } from 'pdf-lib';
import { encryptPDF } from '@pdfsmaller/pdf-encrypt-lite';
import { cn } from '@/lib/utils';
import { jsPDF } from 'jspdf';
import { toast } from 'sonner';

interface PdfFileEntry {
  id: string;
  name: string;
  size: number;
  arrayBuffer: ArrayBuffer;
  pageCount: number;
}

export function PdfTools() {
  const [activeTab, setActiveTab] = useState('merge');
  const [loading, setLoading] = useState(false);

  // --- MERGE STATES ---
  const [mergeFiles, setMergeFiles] = useState<PdfFileEntry[]>([]);

  // --- SPLIT STATES ---
  const [splitFile, setSplitFile] = useState<PdfFileEntry | null>(null);
  const [splitRange, setSplitRange] = useState<string>('1-2');

  // --- PROTECT STATES ---
  const [protectFile, setProtectFile] = useState<PdfFileEntry | null>(null);
  const [userPassword, setUserPassword] = useState<string>('');
  const [ownerPassword, setOwnerPassword] = useState<string>('');
  // --- TEXT TO PDF STATES ---
  const [pdfText, setPdfText] = useState<string>(
    'Developer Tool PDF Export\n==========================\n\nThis document was generated fully client-side using JavaScript!\n\nAll computations occurred in the browser. No server calls were made.'
  );
  const [pdfFontSize, setPdfFontSize] = useState<number>(12);
  const [pdfTitle, setPdfTitle] = useState<string>('Developer Export');

  // --- SIGNATURE STATES ---
  const [sigFile, setSigFile] = useState<PdfFileEntry | null>(null);
  const [sigImageSrc, setSigImageSrc] = useState<string | null>(null);
  const [sigRawUploadedSrc, setSigRawUploadedSrc] = useState<string | null>(null);
  const [sigRemoveBg, setSigRemoveBg] = useState<boolean>(true);
  const [sigTolerance, setSigTolerance] = useState<number>(40);
  
  const [sigPage, setSigPage] = useState<number>(1);
  const [sigPosX, setSigPosX] = useState<number>(50); // percentage 0-100
  const [sigPosY, setSigPosY] = useState<number>(50); // percentage 0-100
  const [sigScale, setSigScale] = useState<number>(1); // factor 0.1 - 3
  const [sigRotation, setSigRotation] = useState<number>(0); // degrees -180 to 180
  const [sigOpacity, setSigOpacity] = useState<number>(1); // 0 to 1
  
  const [isDraggingSig, setIsDraggingSig] = useState<boolean>(false);
  const [sigBrushSize, setSigBrushSize] = useState<number>(3);
  const [sigAspectRatio, setSigAspectRatio] = useState<number>(2.0); // default 2:1 ratio for canvas
  
  const sigCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef<boolean>(false);

  useEffect(() => {
    if (sigRawUploadedSrc) {
      processSignatureImage(sigRawUploadedSrc, sigRemoveBg, sigTolerance);
    }
  }, [sigRawUploadedSrc, sigRemoveBg, sigTolerance]);

  const processSignatureImage = (rawSrc: string, removeBg: boolean, tolerance: number) => {
    if (!removeBg) {
      setSigImageSrc(rawSrc);
      return;
    }
    const img = new Image();
    img.src = rawSrc;
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      try {
        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imgData.data;
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          // Calculate RGB Euclidean distance from pure white (255, 255, 255)
          const dist = Math.sqrt((255 - r) ** 2 + (255 - g) ** 2 + (255 - b) ** 2);
          if (dist < tolerance) {
            data[i + 3] = 0; // transparent
          }
        }
        ctx.putImageData(imgData, 0, 0);
        setSigImageSrc(canvas.toDataURL('image/png'));
        setSigAspectRatio(img.width / img.height);
      } catch (err) {
        console.warn('Background removal canvas error', err);
        setSigImageSrc(rawSrc);
      }
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    isDrawingRef.current = true;
    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;
    
    if ('touches' in e) {
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineWidth = sigBrushSize;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#000000';
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current) return;
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    let clientX = 0;
    let clientY = 0;
    
    if ('touches' in e) {
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
      if (e.cancelable) e.preventDefault();
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    saveCanvasSignature();
  };

  const clearSigCanvas = () => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSigImageSrc(null);
    setSigRawUploadedSrc(null);
  };

  const saveCanvasSignature = () => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const buffer = new Uint32Array(ctx.getImageData(0, 0, canvas.width, canvas.height).data.buffer);
    const hasDrawing = buffer.some(color => color !== 0);
    
    if (hasDrawing) {
      const dataUrl = canvas.toDataURL('image/png');
      setSigImageSrc(dataUrl);
      setSigRawUploadedSrc(null);
      setSigAspectRatio(canvas.width / canvas.height);
    } else {
      setSigImageSrc(null);
    }
  };

  const handleSigFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const entry = await readPdfFile(file);
      setSigFile(entry);
      setSigPage(1);
      toast.success(`Uploaded ${file.name} for signing`);
    } catch (err: any) {
      toast.error(err.message || 'Error uploading PDF file');
    }
  };

  const handleSigImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setSigRawUploadedSrc(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const executeAddSignature = async () => {
    if (!sigFile) {
      toast.error('Please upload a PDF file to sign');
      return;
    }
    if (!sigImageSrc) {
      toast.error('Please draw or upload a signature first');
      return;
    }

    setLoading(true);
    try {
      const pdfDoc = await PDFDocument.load(sigFile.arrayBuffer);
      const totalPages = pdfDoc.getPageCount();
      const pageIndex = Math.max(0, Math.min(totalPages - 1, sigPage - 1));
      const page = pdfDoc.getPages()[pageIndex];
      const { width: pageWidth, height: pageHeight } = page.getSize();
      
      const response = await fetch(sigImageSrc);
      const imageBytes = await response.arrayBuffer();
      const sigImg = await pdfDoc.embedPng(imageBytes);
      
      const aspect = sigAspectRatio || (sigImg.width / sigImg.height);
      const defaultWidth = 150;
      const drawWidth = defaultWidth * sigScale;
      const drawHeight = (defaultWidth / aspect) * sigScale;
      
      const pdfX = (sigPosX / 100) * pageWidth - drawWidth / 2;
      const pdfY = (1 - (sigPosY / 100)) * pageHeight - drawHeight / 2;
      
      page.drawImage(sigImg, {
        x: pdfX,
        y: pdfY,
        width: drawWidth,
        height: drawHeight,
        rotate: degrees(sigRotation),
        opacity: sigOpacity,
      });

      const signedBytes = await pdfDoc.save();
      downloadPdf(signedBytes, `signed_${sigFile.name}`);
      toast.success('Signature successfully embedded in PDF!');
    } catch (err: any) {
      console.error(err);
      toast.error(`Failed to add signature: ${err.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePdf = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4',
      });

      doc.setFontSize(pdfFontSize);
      const splitText = doc.splitTextToSize(pdfText, 500);
      
      // Page styling / margins
      doc.text(splitText, 45, 60);

      doc.save(`${pdfTitle.toLowerCase().replace(/\s+/g, '-')}.pdf`);
      toast.success('PDF generated and downloaded successfully!');
    } catch (e: any) {
      toast.error(`PDF generate failed: ${e.message}`);
    }
  };

  const isPageInRange = (pageNum: number, rangeStr: string, maxPages: number): boolean => {
    try {
      const pages = new Set<number>();
      const parts = rangeStr.split(',');
      for (const part of parts) {
        const trimmed = part.trim();
        if (trimmed.includes('-')) {
          const [startStr, endStr] = trimmed.split('-');
          const start = parseInt(startStr) || 1;
          const end = parseInt(endStr) || maxPages;
          for (let i = Math.min(start, end); i <= Math.max(start, end); i++) {
            pages.add(i);
          }
        } else {
          const val = parseInt(trimmed);
          if (!isNaN(val)) pages.add(val);
        }
      }
      return pages.has(pageNum);
    } catch {
      return false;
    }
  };

  const handleTogglePageInSplitRange = (pageNum: number) => {
    if (!splitFile) return;
    const currentPages = new Set<number>();
    const parts = splitRange.split(',');
    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;
      if (trimmed.includes('-')) {
        const [startStr, endStr] = trimmed.split('-');
        const start = parseInt(startStr) || 1;
        const end = parseInt(endStr) || splitFile.pageCount;
        for (let i = Math.min(start, end); i <= Math.max(start, end); i++) {
          currentPages.add(i);
        }
      } else {
        const val = parseInt(trimmed);
        if (!isNaN(val)) currentPages.add(val);
      }
    }

    if (currentPages.has(pageNum)) {
      currentPages.delete(pageNum);
    } else {
      currentPages.add(pageNum);
    }

    const sorted = Array.from(currentPages).sort((a, b) => a - b);
    if (sorted.length === 0) {
      setSplitRange('');
      return;
    }

    const ranges: string[] = [];
    let rangeStart = sorted[0];
    let prev = sorted[0];

    for (let i = 1; i < sorted.length; i++) {
      const curr = sorted[i];
      if (curr !== prev + 1) {
        if (rangeStart === prev) {
          ranges.push(`${rangeStart}`);
        } else {
          ranges.push(`${rangeStart}-${prev}`);
        }
        rangeStart = curr;
      }
      prev = curr;
    }
    if (rangeStart === prev) {
      ranges.push(`${rangeStart}`);
    } else {
      ranges.push(`${rangeStart}-${prev}`);
    }

    setSplitRange(ranges.join(', '));
  };

  // Common file read helper
  const readPdfFile = (file: File): Promise<PdfFileEntry> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
          const pageCount = pdfDoc.getPageCount();
          resolve({
            id: Math.random().toString(36).substring(7),
            name: file.name,
            size: file.size,
            arrayBuffer,
            pageCount,
          });
        } catch (err) {
          reject(new Error(`Failed to load PDF "${file.name}". It might be password protected or corrupted.`));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file.'));
      reader.readAsArrayBuffer(file);
    });
  };

  // --- MERGE LOGIC ---
  const handleMergeFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setLoading(true);
    const loadedList: PdfFileEntry[] = [];
    for (let i = 0; i < files.length; i++) {
      try {
        const entry = await readPdfFile(files[i]);
        loadedList.push(entry);
      } catch (err: any) {
        toast.error(err.message || 'Error uploading file');
      }
    }
    setMergeFiles((prev) => [...prev, ...loadedList]);
    setLoading(false);
    toast.success(`Uploaded ${loadedList.length} PDFs for merging`);
  };

  const moveMergeFile = (index: number, direction: 'up' | 'down') => {
    const nextList = [...mergeFiles];
    if (direction === 'up' && index > 0) {
      const temp = nextList[index];
      nextList[index] = nextList[index - 1];
      nextList[index - 1] = temp;
    } else if (direction === 'down' && index < nextList.length - 1) {
      const temp = nextList[index];
      nextList[index] = nextList[index + 1];
      nextList[index + 1] = temp;
    }
    setMergeFiles(nextList);
  };

  const removeMergeFile = (id: string) => {
    setMergeFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const executeMerge = async () => {
    if (mergeFiles.length < 2) {
      toast.error('Please upload at least 2 PDF files to merge');
      return;
    }

    setLoading(true);
    try {
      const mergedPdf = await PDFDocument.create();

      for (const entry of mergeFiles) {
        const srcPdf = await PDFDocument.load(entry.arrayBuffer);
        const pageIndices = srcPdf.getPageIndices();
        const copiedPages = await mergedPdf.copyPages(srcPdf, pageIndices);
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedPdfBytes = await mergedPdf.save();
      downloadPdf(mergedPdfBytes, `merged_${Date.now()}.pdf`);
      toast.success('PDFs merged successfully!');
    } catch (err) {
      toast.error('Error merging PDF files');
    } finally {
      setLoading(false);
    }
  };

  // --- SPLIT LOGIC ---
  const handleSplitFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const entry = await readPdfFile(file);
      setSplitFile(entry);
      setSplitRange(`1-${entry.pageCount}`);
      toast.success(`Uploaded ${file.name} for splitting`);
    } catch (err: any) {
      toast.error(err.message || 'Error uploading file');
    } finally {
      setLoading(false);
    }
  };

  const parsePageRange = (rangeStr: string, maxPages: number): number[] => {
    const pages: number[] = [];
    const parts = rangeStr.split(',');

    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.includes('-')) {
        const [startStr, endStr] = trimmed.split('-');
        const start = parseInt(startStr);
        const end = parseInt(endStr);
        if (!isNaN(start) && !isNaN(end)) {
          for (let i = Math.max(1, start); i <= Math.min(maxPages, end); i++) {
            pages.push(i - 1); // 0-indexed indices
          }
        }
      } else {
        const num = parseInt(trimmed);
        if (!isNaN(num) && num >= 1 && num <= maxPages) {
          pages.push(num - 1);
        }
      }
    }
    return Array.from(new Set(pages)).sort((a, b) => a - b);
  };

  const executeSplit = async () => {
    if (!splitFile) {
      toast.error('Please upload a PDF file to split');
      return;
    }

    setLoading(true);
    try {
      const srcPdf = await PDFDocument.load(splitFile.arrayBuffer);
      const targetPages = parsePageRange(splitRange, splitFile.pageCount);

      if (targetPages.length === 0) {
        toast.error('Invalid page range specified');
        setLoading(false);
        return;
      }

      const splitPdf = await PDFDocument.create();
      const copiedPages = await splitPdf.copyPages(srcPdf, targetPages);
      copiedPages.forEach((page) => splitPdf.addPage(page));

      const splitBytes = await splitPdf.save();
      downloadPdf(splitBytes, `split_${splitFile.name}`);
      toast.success('Pages extracted and split successfully!');
    } catch (err) {
      toast.error('Failed to split PDF');
    } finally {
      setLoading(false);
    }
  };

  // --- PROTECT LOGIC ---
  const handleProtectFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const entry = await readPdfFile(file);
      setProtectFile(entry);
      toast.success(`Uploaded ${file.name} for protection`);
    } catch (err: any) {
      toast.error(err.message || 'Error uploading file');
    } finally {
      setLoading(false);
    }
  };

  const executeProtect = async () => {
    if (!protectFile) {
      toast.error('Please upload a PDF file to protect');
      return;
    }
    if (!userPassword) {
      toast.error('Please enter a user password to lock the PDF');
      return;
    }

    setLoading(true);
    try {
      const srcPdf = await PDFDocument.load(protectFile.arrayBuffer);
      const pdfBytes = await srcPdf.save();
      
      // Encrypt PDF bytes using standard RC4/AES algorithms in the browser
      const protectedBytes = await encryptPDF(pdfBytes, userPassword, ownerPassword || undefined);

      downloadPdf(protectedBytes, `protected_${protectFile.name}`);
      toast.success('PDF encrypted and password-protected successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to encrypt PDF');
    } finally {
      setLoading(false);
    }
  };

  const downloadPdf = (bytes: Uint8Array, fileName: string) => {
    const blob = new Blob([bytes as any], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  // Support reading tab from query search params
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam && ['merge', 'split', 'protect', 'text-to-pdf', 'signature'].includes(tabParam)) {
        setActiveTab(tabParam);
      }
    }
  }, []);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <div className="flex justify-center">
        <TabsList className="grid grid-cols-5 w-full max-w-4xl h-auto p-1 gap-1">
          <TabsTrigger value="merge" className="gap-2 py-2 text-xs">
            <Combine className="h-4 w-4" />
            Merge PDF
          </TabsTrigger>
          <TabsTrigger value="split" className="gap-2 py-2 text-xs">
            <Scissors className="h-4 w-4" />
            Split / Extract
          </TabsTrigger>
          <TabsTrigger value="protect" className="gap-2 py-2 text-xs">
            <Shield className="h-4 w-4" />
            Protect PDF
          </TabsTrigger>
          <TabsTrigger value="signature" className="gap-2 py-2 text-xs">
            <PenTool className="h-4 w-4" />
            Add Signature
          </TabsTrigger>
          <TabsTrigger value="text-to-pdf" className="gap-2 py-2 text-xs">
            <FileText className="h-4 w-4" />
            Text to PDF
          </TabsTrigger>
        </TabsList>
      </div>

      {/* --- MERGE PDF TAB --- */}
      <TabsContent value="merge" className="m-0 space-y-6 animate-fade-in">
        <div className="grid gap-6 md:grid-cols-3">
          {/* File Upload Zone */}
          <Card className="border bg-card/60 backdrop-blur-sm shadow-sm md:col-span-1 h-fit">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center pb-2 border-b">
                <Label className="font-bold text-sm">Select PDF Files</Label>
              </div>

              <div className="border border-dashed rounded-xl p-6 text-center hover:bg-muted/40 transition-colors relative cursor-pointer">
                <input
                  type="file"
                  accept=".pdf"
                  multiple
                  onChange={handleMergeFilesUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  disabled={loading}
                />
                <Plus className="h-8 w-8 text-primary mx-auto mb-2" />
                <span className="text-xs font-bold text-muted-foreground block">Click or Drag PDF files here</span>
                <span className="text-[10px] text-muted-foreground/60 block mt-1">Multi-file upload supported</span>
              </div>

              {mergeFiles.length >= 2 && (
                <Button onClick={executeMerge} className="w-full text-xs font-bold" disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                  Merge {mergeFiles.length} Documents
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Merge Playlist Details */}
          <Card className="border shadow-md md:col-span-2">
            <CardContent className="p-4 space-y-4">
              <div className="flex justify-between items-center pb-2 border-b">
                <Label className="font-bold text-sm flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-primary" />
                  Merge Queue Order
                </Label>
                {mergeFiles.length > 0 && (
                  <Button variant="ghost" size="sm" onClick={() => setMergeFiles([])} className="h-6 text-red-500 hover:text-red-600">
                    Clear List
                  </Button>
                )}
              </div>

              <div className="space-y-2">
                {mergeFiles.length > 0 ? (
                  mergeFiles.map((file, idx) => (
                    <div key={file.id} className="flex items-center gap-3 border rounded-xl px-3 py-2 bg-muted/20 text-xs justify-between group">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Badge variant="secondary" className="font-mono text-[9px] font-extrabold h-5">{idx + 1}</Badge>
                        <div className="truncate">
                          <p className="font-bold truncate max-w-[280px] sm:max-w-[340px] text-foreground">{file.name}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {formatSize(file.size)} • <span className="font-semibold text-primary">{file.pageCount} pages</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          disabled={idx === 0 || loading}
                          onClick={() => moveMergeFile(idx, 'up')}
                        >
                          <ArrowUp className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          disabled={idx === mergeFiles.length - 1 || loading}
                          onClick={() => moveMergeFile(idx, 'down')}
                        >
                          <ArrowDown className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-red-500"
                          disabled={loading}
                          onClick={() => removeMergeFile(file.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-16 text-xs text-muted-foreground/50 italic border border-dashed rounded-xl bg-card">
                    Add at least 2 PDF files to begin merging
                  </div>
                )}
              </div>

              {/* Visual Merge Order Timeline Preview */}
              {mergeFiles.length > 0 && (
                <div className="space-y-2 border border-border/40 bg-muted/10 p-3.5 rounded-xl pt-2 mt-4">
                  <p className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1.5">
                    <Combine className="h-3.5 w-3.5" /> Assembled Document Preview
                  </p>
                  <div className="flex gap-2 overflow-x-auto py-2 pr-1.5 scrollbar-thin">
                    {mergeFiles.map((file, fileIdx) => (
                      <div key={file.id} className="flex items-center shrink-0">
                        <div className="flex flex-col p-2.5 border rounded-xl bg-card border-primary/20 text-center w-24 h-24 justify-between relative shadow-sm hover:scale-105 transition-all">
                          <span className="text-[9px] font-black text-primary uppercase tracking-wider">File #{fileIdx + 1}</span>
                          <div className="flex items-center justify-center gap-0.5 mt-1">
                            <FileText className="h-4.5 w-4.5 text-primary shrink-0" />
                            <span className="text-xs font-black font-mono">x{file.pageCount}</span>
                          </div>
                          <p className="text-[9px] font-bold text-muted-foreground truncate w-full mt-1.5 px-0.5">{file.name}</p>
                        </div>
                        {fileIdx < mergeFiles.length - 1 && (
                          <div className="h-0.5 w-6 bg-border mx-1 flex items-center justify-center text-[10px] text-muted-foreground/60 font-bold shrink-0">
                            +
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* --- SPLIT / EXTRACT TAB --- */}
      <TabsContent value="split" className="m-0 space-y-6 animate-fade-in">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Controls */}
          <Card className="border bg-card/60 backdrop-blur-sm shadow-sm md:col-span-1">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center pb-2 border-b">
                <Label className="font-bold text-sm">Extraction Settings</Label>
              </div>

              <div className="border border-dashed rounded-xl p-6 text-center hover:bg-muted/40 transition-colors relative cursor-pointer">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleSplitFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  disabled={loading}
                />
                <Scissors className="h-8 w-8 text-primary mx-auto mb-2" />
                <span className="text-xs font-bold text-muted-foreground block">Select target PDF</span>
                <span className="text-[10px] text-muted-foreground/60 block mt-1">Extract specific page sequences</span>
              </div>

              {splitFile && (
                <>
                  <div className="space-y-1.5 text-xs pt-2 border-t">
                    <Label htmlFor="page-range">Page Ranges (e.g. 1-3, 5)</Label>
                    <Input
                      id="page-range"
                      type="text"
                      value={splitRange}
                      onChange={(e) => setSplitRange(e.target.value)}
                      className="h-8.5 font-mono text-xs"
                      disabled={loading}
                    />
                  </div>

                  <Button onClick={executeSplit} className="w-full text-xs font-bold pt-1" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                    Extract Pages
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Details */}
          <Card className="border shadow-md md:col-span-2">
            <CardContent className="p-4 space-y-4">
              <div className="flex justify-between items-center pb-2 border-b">
                <Label className="font-bold text-sm flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-primary" />
                  Target Document
                </Label>
              </div>

              {splitFile ? (
                <div className="border rounded-xl p-4 bg-muted/20 space-y-3">
                  <div className="flex justify-between text-xs items-center">
                    <div>
                      <p className="font-bold text-foreground truncate max-w-sm">{splitFile.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{formatSize(splitFile.size)}</p>
                    </div>
                    <Badge variant="secondary" className="h-6 font-bold">{splitFile.pageCount} Pages Total</Badge>
                  </div>
                  <div className="text-[10px] text-muted-foreground leading-normal border-t pt-2.5">
                    <strong>Range formatting help:</strong> Use numbers separated by commas for single pages (e.g. <code>1, 3, 5</code>) or hyphens for continuous page sequences (e.g. <code>2-5</code>). You can combine styles like: <code>1-3, 5, 7-9</code>.
                  </div>

                  {/* Visual Page Selection Preview Grid */}
                  <div className="space-y-2 pt-2 border-t">
                    <Label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">Click Pages to Include / Exclude</Label>
                    <div className="grid grid-cols-5 sm:grid-cols-7 md:grid-cols-9 gap-1.5 max-h-[160px] overflow-y-auto p-2 border rounded-xl bg-background/50">
                      {Array.from({ length: splitFile.pageCount }).map((_, idx) => {
                        const pageNum = idx + 1;
                        const isSelected = isPageInRange(pageNum, splitRange, splitFile.pageCount);
                        return (
                          <button
                            key={pageNum}
                            type="button"
                            onClick={() => handleTogglePageInSplitRange(pageNum)}
                            className={cn(
                              "h-12 flex flex-col items-center justify-center border rounded-lg transition-all text-xs font-mono select-none hover:bg-muted/40",
                              isSelected
                                ? "bg-primary/10 border-primary text-primary font-bold shadow-[0_0_8px_rgba(59,130,246,0.15)]"
                                : "bg-muted/15 border-border/80 text-muted-foreground"
                            )}
                          >
                            <span className="text-[8px] text-muted-foreground/60">P.</span>
                            <span>{pageNum}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 text-xs text-muted-foreground/50 italic border border-dashed rounded-xl bg-card">
                  Upload a PDF document to parse pages and configure extraction
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* --- PROTECT PDF TAB --- */}
      <TabsContent value="protect" className="m-0 space-y-6 animate-fade-in">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Settings */}
          <Card className="border bg-card/60 backdrop-blur-sm shadow-sm md:col-span-1">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center pb-2 border-b">
                <Label className="font-bold text-sm">Security Locking</Label>
              </div>

              <div className="border border-dashed rounded-xl p-6 text-center hover:bg-muted/40 transition-colors relative cursor-pointer">
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleProtectFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer"
                  disabled={loading}
                />
                <Shield className="h-8 w-8 text-primary mx-auto mb-2" />
                <span className="text-xs font-bold text-muted-foreground block">Upload target PDF</span>
                <span className="text-[10px] text-muted-foreground/60 block mt-1">Add strong password encryption</span>
              </div>

              {protectFile && (
                <>
                  <div className="space-y-1.5 text-xs pt-2 border-t">
                    <Label htmlFor="pdf-user-pass">User Password (To Open)</Label>
                    <Input
                      id="pdf-user-pass"
                      type="password"
                      value={userPassword}
                      onChange={(e) => setUserPassword(e.target.value)}
                      className="h-8.5 text-xs"
                      disabled={loading}
                    />
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <Label htmlFor="pdf-owner-pass">Owner Password (Optional)</Label>
                    <Input
                      id="pdf-owner-pass"
                      type="password"
                      value={ownerPassword}
                      onChange={(e) => setOwnerPassword(e.target.value)}
                      className="h-8.5 text-xs"
                      disabled={loading}
                    />
                  </div>

                  <Button onClick={executeProtect} className="w-full text-xs font-bold pt-1" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                    Encrypt Document
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Target File details */}
          <Card className="border shadow-md md:col-span-2">
            <CardContent className="p-4 space-y-4">
              <div className="flex justify-between items-center pb-2 border-b">
                <Label className="font-bold text-sm flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-primary" />
                  Target Document
                </Label>
              </div>

              {protectFile ? (
                <div className="border rounded-xl p-4 bg-muted/20 space-y-3">
                  <div className="flex justify-between text-xs items-center">
                    <div>
                      <p className="font-bold text-foreground truncate max-w-sm">{protectFile.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{formatSize(protectFile.size)}</p>
                    </div>
                    <Badge variant="secondary" className="h-6 font-bold">{protectFile.pageCount} Pages</Badge>
                  </div>
                  <div className="text-[10px] text-muted-foreground leading-normal border-t pt-2.5">
                    <strong>Encryption details:</strong> Locking a PDF with a User password encrypts its content and displays a password entry prompt when opened in any standard viewer.
                  </div>
                </div>
              ) : (
                <div className="text-center py-16 text-xs text-muted-foreground/50 italic border border-dashed rounded-xl bg-card">
                  Upload a PDF document to apply password restrictions
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* --- ADD SIGNATURE TAB --- */}
      <TabsContent value="signature" className="m-0 space-y-6 animate-fade-in">
        <div className="grid gap-6 md:grid-cols-12">
          {/* Controls Column */}
          <div className="md:col-span-5 space-y-4">
            
            {/* Step 1: Target Document Uploader */}
            <Card className="border bg-card/60 backdrop-blur-sm shadow-sm">
              <CardContent className="p-4 space-y-3">
                <div className="flex justify-between items-center border-b pb-2">
                  <Label className="font-extrabold text-sm">1. Target PDF Document</Label>
                  {sigFile && (
                    <Button variant="ghost" size="icon-sm" onClick={() => setSigFile(null)} className="h-6 text-destructive text-[10px] font-bold">
                      Remove
                    </Button>
                  )}
                </div>

                {!sigFile ? (
                  <div className="border border-dashed rounded-xl p-6 text-center hover:bg-muted/40 transition-colors relative cursor-pointer">
                    <input
                      type="file"
                      accept=".pdf"
                      onChange={handleSigFileUpload}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                    />
                    <FileText className="h-8 w-8 text-primary mx-auto mb-2" />
                    <span className="text-xs font-bold text-muted-foreground block">Upload target PDF to sign</span>
                    <span className="text-[10px] text-muted-foreground/60 block mt-1">Files are processed 100% locally</span>
                  </div>
                ) : (
                  <div className="flex justify-between items-center text-xs p-2 bg-muted/40 rounded-lg border">
                    <div className="min-w-0">
                      <p className="font-bold truncate max-w-[200px]">{sigFile.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{formatSize(sigFile.size)} • {sigFile.pageCount} Pages</p>
                    </div>
                    <Badge variant="secondary" className="font-mono h-6 font-bold">{sigFile.pageCount} Pgs</Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Step 2: Signature Input Generation */}
            <Card className="border bg-card/60 backdrop-blur-sm shadow-sm">
              <CardContent className="p-4 space-y-4">
                <div className="border-b pb-2 flex justify-between items-center">
                  <Label className="font-extrabold text-sm">2. Create Your Signature</Label>
                  {sigImageSrc && (
                    <Badge className="bg-emerald-500 text-white text-[8px] font-bold">Ready</Badge>
                  )}
                </div>

                <Tabs defaultValue="draw" className="w-full">
                  <TabsList className="grid grid-cols-2 w-full h-8.5 p-0.5">
                    <TabsTrigger value="draw" className="text-[10.5px] py-1 gap-1"><PenTool className="h-3 w-3" /> Draw Pen</TabsTrigger>
                    <TabsTrigger value="upload" className="text-[10.5px] py-1 gap-1"><Download className="h-3 w-3" /> Upload Image</TabsTrigger>
                  </TabsList>

                  {/* Draw Pad Canvas */}
                  <TabsContent value="draw" className="space-y-3 mt-3">
                    <div className="relative border rounded-xl overflow-hidden bg-white shadow-sm flex justify-center items-center">
                      <canvas
                        ref={sigCanvasRef}
                        width={320}
                        height={160}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className="bg-transparent touch-none cursor-crosshair"
                      />
                    </div>
                    
                    <div className="flex justify-between items-center gap-2">
                      <div className="flex items-center gap-1.5 text-xs flex-1">
                        <Label htmlFor="sig-brush-size" className="text-[10px] text-muted-foreground shrink-0">Pen: {sigBrushSize}px</Label>
                        <input
                          type="range"
                          id="sig-brush-size"
                          min={1}
                          max={10}
                          value={sigBrushSize}
                          onChange={(e) => setSigBrushSize(Number(e.target.value))}
                          className="w-full accent-primary h-1 rounded cursor-pointer bg-muted"
                        />
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={clearSigCanvas} className="h-7 text-xs font-bold gap-1 shrink-0">
                        <Eraser className="h-3.5 w-3.5" /> Clear
                      </Button>
                    </div>
                  </TabsContent>

                  {/* Image Uploader */}
                  <TabsContent value="upload" className="space-y-3 mt-3 text-xs">
                    <div className="border border-dashed rounded-xl p-4 text-center hover:bg-muted/40 transition-colors relative cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleSigImageUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                      <Plus className="h-6 w-6 text-primary mx-auto mb-1" />
                      <span className="text-[11px] font-bold text-muted-foreground block">Select signature image</span>
                    </div>

                    {sigRawUploadedSrc && (
                      <div className="space-y-3.5 border-t pt-3">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="remove-bg-switch" className="cursor-pointer">Remove Background (Make Transparent)</Label>
                          <input
                            type="checkbox"
                            id="remove-bg-switch"
                            checked={sigRemoveBg}
                            onChange={(e) => setSigRemoveBg(e.target.checked)}
                            className="accent-primary h-4 w-4 cursor-pointer"
                          />
                        </div>

                        {sigRemoveBg && (
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px]">
                              <Label htmlFor="tolerance-slider">Color Tolerance</Label>
                              <span className="font-mono font-bold">{sigTolerance}</span>
                            </div>
                            <input
                              type="range"
                              id="tolerance-slider"
                              min={10}
                              max={150}
                              value={sigTolerance}
                              onChange={(e) => setSigTolerance(Number(e.target.value))}
                              className="w-full accent-primary h-1.5 rounded cursor-pointer bg-muted"
                            />
                            <span className="text-[9px] text-muted-foreground leading-normal block">Adjust slider to remove grey/dirty shadows from signed papers.</span>
                          </div>
                        )}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>

                {/* Signature Preview */}
                {sigImageSrc && (
                  <div className="border border-dashed rounded-xl p-2.5 bg-muted/15 flex flex-col items-center justify-center space-y-1.5">
                    <span className="text-[8px] font-black text-muted-foreground/60 uppercase tracking-widest block">Signature Output Preview</span>
                    <div className="bg-white border rounded p-2 max-h-24 flex items-center justify-center shadow-inner relative overflow-hidden">
                      <img src={sigImageSrc} alt="Signature Preview" className="max-h-20 object-contain" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Step 3: Embed Settings & Controls */}
            {sigFile && sigImageSrc && (
              <Card className="border bg-card/60 backdrop-blur-sm shadow-sm">
                <CardContent className="p-4 space-y-4 text-xs">
                  <div className="border-b pb-2">
                    <Label className="font-extrabold text-sm">3. Overlay Adjustments</Label>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="sig-page-select">Target Page</Label>
                      <Input
                        id="sig-page-select"
                        type="number"
                        min={1}
                        max={sigFile.pageCount}
                        value={sigPage}
                        onChange={(e) => setSigPage(Math.max(1, Math.min(sigFile.pageCount, parseInt(e.target.value) || 1)))}
                        className="h-8.5 text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="sig-opacity">Opacity ({Math.round(sigOpacity * 100)}%)</Label>
                      <input
                        type="range"
                        id="sig-opacity"
                        min={0.1}
                        max={1}
                        step={0.05}
                        value={sigOpacity}
                        onChange={(e) => setSigOpacity(parseFloat(e.target.value))}
                        className="w-full accent-primary h-1 rounded cursor-pointer bg-muted mt-2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <Label htmlFor="sig-scale">Scale ({Math.round(sigScale * 100)}%)</Label>
                      <input
                        type="range"
                        id="sig-scale"
                        min={0.2}
                        max={3.0}
                        step={0.05}
                        value={sigScale}
                        onChange={(e) => setSigScale(parseFloat(e.target.value))}
                        className="w-full accent-primary h-1 rounded cursor-pointer bg-muted mt-1.5"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="sig-rotate">Rotation ({sigRotation}°)</Label>
                      <input
                        type="range"
                        id="sig-rotate"
                        min={-180}
                        max={180}
                        step={5}
                        value={sigRotation}
                        onChange={(e) => setSigRotation(parseInt(e.target.value))}
                        className="w-full accent-primary h-1 rounded cursor-pointer bg-muted mt-1.5"
                      />
                    </div>
                  </div>

                  <Button onClick={executeAddSignature} className="w-full text-xs font-bold gap-1.5 h-9" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> : null}
                    Embed Signature & Download
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Visual Placement Layout Sheet */}
          <div className="md:col-span-7 space-y-4">
            <Card className="border shadow-md h-full flex flex-col justify-center items-center py-6 min-h-[460px] relative overflow-hidden bg-slate-950/5">
              <CardContent className="flex flex-col items-center gap-4 w-full">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground border-b pb-2 w-full justify-between px-2">
                  <span className="font-extrabold flex items-center gap-1.5">
                    <Move className="h-4 w-4 text-primary" /> Visual Signature Editor
                  </span>
                  {sigFile && (
                    <span className="font-mono text-[10px] bg-muted/40 px-2 py-0.5 rounded border">
                      Coords: X: {Math.round(sigPosX)}% • Y: {Math.round(sigPosY)}%
                    </span>
                  )}
                </div>

                {sigFile ? (
                  <div className="relative w-full max-w-[340px] flex justify-center py-4 select-none">
                    
                    {/* Interactive A4 Document Container */}
                    <div
                      onMouseMove={(e) => {
                        if (!isDraggingSig) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = ((e.clientX - rect.left) / rect.width) * 100;
                        const y = ((e.clientY - rect.top) / rect.height) * 100;
                        setSigPosX(Math.max(0, Math.min(100, x)));
                        setSigPosY(Math.max(0, Math.min(100, y)));
                      }}
                      onTouchMove={(e) => {
                        if (!isDraggingSig) return;
                        if (e.touches.length === 0) return;
                        const rect = e.currentTarget.getBoundingClientRect();
                        const x = ((e.touches[0].clientX - rect.left) / rect.width) * 100;
                        const y = ((e.touches[0].clientY - rect.top) / rect.height) * 100;
                        setSigPosX(Math.max(0, Math.min(100, x)));
                        setSigPosY(Math.max(0, Math.min(100, y)));
                      }}
                      onMouseUp={() => setIsDraggingSig(false)}
                      onTouchEnd={() => setIsDraggingSig(false)}
                      onMouseLeave={() => setIsDraggingSig(false)}
                      style={{ aspectRatio: '595/842' }}
                      className="relative w-full border bg-white rounded shadow-lg overflow-hidden flex flex-col justify-between p-4"
                    >
                      {/* Document Watermark background grid */}
                      <div className="absolute inset-0 flex flex-col justify-between p-8 pointer-events-none opacity-[0.03] select-none text-black font-extrabold text-center uppercase tracking-widest">
                        <span>DOCUMENT HEADER BOUNDS</span>
                        <div className="text-lg">PAGE {sigPage} OF {sigFile.pageCount}</div>
                        <span>DOCUMENT FOOTER BOUNDS</span>
                      </div>

                      {/* Guide margins */}
                      <div className="absolute inset-4 border border-dashed border-slate-900/10 pointer-events-none rounded" />

                      {/* Embedded Drag-and-Drop Signature Box Overlay */}
                      {sigImageSrc && (
                        <div
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setIsDraggingSig(true);
                          }}
                          onTouchStart={(e) => {
                            setIsDraggingSig(true);
                          }}
                          style={{
                            position: 'absolute',
                            left: `${sigPosX}%`,
                            top: `${sigPosY}%`,
                            transform: `translate(-50%, -50%) rotate(${sigRotation}deg) scale(${sigScale})`,
                            opacity: sigOpacity,
                            cursor: isDraggingSig ? 'grabbing' : 'grab',
                            transition: isDraggingSig ? 'none' : 'transform 0.15s ease-out'
                          }}
                          className={cn(
                            "p-1 border border-dashed rounded bg-primary/5 hover:border-primary/80 transition-colors select-none z-20 shrink-0",
                            isDraggingSig ? "border-primary bg-primary/10 shadow-md ring-2 ring-primary/20 scale-105" : "border-slate-300"
                          )}
                        >
                          <img
                            src={sigImageSrc}
                            alt="Signature overlay"
                            style={{
                              width: '80px',
                              height: `${80 / sigAspectRatio}px`
                            }}
                            className="object-contain pointer-events-none"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-32 text-xs text-muted-foreground/50 italic border border-dashed rounded-xl bg-card w-full">
                    Upload a PDF document to view interactive signature positioning
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </TabsContent>

      {/* --- TEXT TO PDF TAB --- */}
      <TabsContent value="text-to-pdf" className="space-y-6 m-0 animate-fade-in">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Controls */}
          <Card className="md:col-span-1 border bg-card/60 backdrop-blur-sm shadow-md">
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold text-sm border-b pb-2 flex items-center gap-1.5">
                <FileText className="h-4 w-4 text-primary" />
                PDF Document Setup
              </h3>

              <div className="space-y-1.5 text-xs">
                <Label htmlFor="pdf-doc-title">Document Title</Label>
                <Input
                  id="pdf-doc-title"
                  value={pdfTitle}
                  onChange={(e) => setPdfTitle(e.target.value)}
                  className="h-8.5 text-xs"
                />
              </div>

              <div className="space-y-1.5 text-xs">
                <Label htmlFor="pdf-font-slider">Font Size ({pdfFontSize}pt)</Label>
                <input
                  type="range"
                  id="pdf-font-slider"
                  min={8}
                  max={24}
                  value={pdfFontSize}
                  onChange={(e) => setPdfFontSize(Number(e.target.value))}
                  className="w-full accent-primary h-1.5 rounded bg-muted cursor-pointer"
                />
              </div>

              <Button onClick={handleGeneratePdf} className="w-full text-xs font-bold gap-1.5">
                <Download className="h-3.5 w-3.5" />
                Download PDF
              </Button>
            </CardContent>
          </Card>

          {/* Textarea */}
          <Card className="md:col-span-2 border bg-card/60 backdrop-blur-sm shadow-md">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-sm font-bold">Write Text Content</span>
                <span className="text-xs text-muted-foreground">Standard text will wrap automatically</span>
              </div>
              <Textarea
                value={pdfText}
                onChange={(e) => setPdfText(e.target.value)}
                className="font-mono text-xs h-[300px] resize-y bg-black/5 dark:bg-black/20"
                placeholder="Start typing your PDF text content here..."
              />
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
}
