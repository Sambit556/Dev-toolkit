'use client';

import React, { useState } from 'react';
import { FileText, Plus, ArrowUp, ArrowDown, Trash2, Shield, Scissors, Combine, Loader2, Download } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { PDFDocument } from 'pdf-lib';
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
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam && ['merge', 'split', 'protect', 'text-to-pdf'].includes(tabParam)) {
        setActiveTab(tabParam);
      }
    }
  }, []);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <div className="flex justify-center">
        <TabsList className="grid grid-cols-4 w-full max-w-3xl h-auto p-1 gap-1">
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
