'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Image as ImageIcon, Sliders, Check, Download, RefreshCw, Sparkles, Scale, Info, Palette, Camera, FileText, Star, Loader2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { CopyButton } from '@/components/ui/copy-button';
import { toast } from 'sonner';
import JSZip from 'jszip';
import { buildIco } from '@/lib/ico';

const FAVICON_SIZES = [16, 32, 48, 64, 180, 192, 512] as const;

async function resizeToPngBytes(img: HTMLImageElement, size: number): Promise<Uint8Array> {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context unavailable');
  ctx.clearRect(0, 0, size, size);
  ctx.drawImage(img, 0, 0, size, size);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Canvas export failed'))), 'image/png');
  });
  return new Uint8Array(await blob.arrayBuffer());
}

function parseExif(arrayBuffer: ArrayBuffer): Record<string, any> | null {
  try {
    const dataView = new DataView(arrayBuffer);
    if (dataView.byteLength < 4) return null;
    
    // Check JPEG SOI marker (0xFFD8)
    if (dataView.getUint16(0, false) !== 0xFFD8) {
      return null;
    }
    
    const length = dataView.byteLength;
    let offset = 2;
    while (offset < length - 4) {
      const marker = dataView.getUint16(offset, false);
      if (marker === 0xFFE1) { // APP1 segment containing EXIF
        return readEXIFData(dataView, offset + 4);
      }
      if ((marker & 0xFF00) !== 0xFF00) {
        break; // Invalid segment
      }
      const segmentLen = dataView.getUint16(offset + 2, false);
      offset += 2 + segmentLen;
    }
  } catch (e) {
    console.warn('Error parsing EXIF binary data', e);
  }
  return null;
}

function readEXIFData(file: DataView, start: number): Record<string, any> | null {
  if (file.byteLength < start + 10) return null;
  // Check "Exif" header (0x45786966)
  if (file.getUint32(start, false) !== 0x45786966) {
    return null;
  }
  
  const tiffOffset = start + 6;
  let bigEndian = false;
  
  if (file.getUint16(tiffOffset, false) === 0x4949) {
    bigEndian = false; // Intel - Little Endian
  } else if (file.getUint16(tiffOffset, false) === 0x4D4D) {
    bigEndian = true; // Motorola - Big Endian
  } else {
    return null;
  }
  
  if (file.getUint16(tiffOffset + 2, !bigEndian) !== 0x002A) {
    return null;
  }
  
  const firstIFDOffset = file.getUint32(tiffOffset + 4, !bigEndian);
  if (firstIFDOffset < 8) {
    return null;
  }
  
  const tags: Record<string, any> = {};
  readTags(file, tiffOffset, tiffOffset + firstIFDOffset, bigEndian, tags);
  return tags;
}

function readTags(file: DataView, tiffOffset: number, dirOffset: number, bigEndian: boolean, tags: Record<string, any>) {
  if (dirOffset + 2 > file.byteLength) return;
  const entriesCount = file.getUint16(dirOffset, !bigEndian);
  
  for (let i = 0; i < entriesCount; i++) {
    const entryOffset = dirOffset + 2 + i * 12;
    if (entryOffset + 12 > file.byteLength) break;
    
    const tag = file.getUint16(entryOffset, !bigEndian);
    const type = file.getUint16(entryOffset + 2, !bigEndian);
    const numValues = file.getUint32(entryOffset + 4, !bigEndian);
    const valueOffset = file.getUint32(entryOffset + 8, !bigEndian) + tiffOffset;
    
    let val: any = null;
    try {
      if (type === 2) { // ASCII
        const offset = numValues > 4 ? valueOffset : entryOffset + 8;
        if (offset + numValues <= file.byteLength) {
          const chars: string[] = [];
          for (let j = 0; j < numValues - 1; j++) {
            chars.push(String.fromCharCode(file.getUint8(offset + j)));
          }
          val = chars.join('').trim();
        }
      } else if (type === 3) { // Short
        val = file.getUint16(entryOffset + 8, !bigEndian);
      } else if (type === 4) { // Long
        val = file.getUint32(entryOffset + 8, !bigEndian);
      } else if (type === 5) { // Rational
        if (valueOffset + 8 <= file.byteLength) {
          const num = file.getUint32(valueOffset, !bigEndian);
          const den = file.getUint32(valueOffset + 4, !bigEndian);
          val = den === 0 ? num : parseFloat((num / den).toFixed(2));
        }
      }
    } catch {
      // Ignore tag read error
    }
    
    if (val !== null) {
      if (tag === 0x010f) tags.make = val;
      else if (tag === 0x0110) tags.model = val;
      else if (tag === 0x9003) tags.dateTaken = val;
      else if (tag === 0x829a) {
        tags.exposureTime = val < 1 ? `1/${Math.round(1 / val)}s` : `${val}s`;
      }
      else if (tag === 0x829d) tags.aperture = `f/${val}`;
      else if (tag === 0x8827) tags.iso = val;
      else if (tag === 0x920a) tags.focalLength = `${val}mm`;
      else if (tag === 0x013b) tags.artist = val;
      else if (tag === 0x0131) tags.software = val;
    }
  }
}

export function ImageTool() {
  const [originalFile, setOriginalFile] = useState<File | null>(null);
  const [originalSrc, setOriginalSrc] = useState<string>('');
  const [processedSrc, setProcessedSrc] = useState<string>('');
  const [processedSize, setProcessedSize] = useState<number>(0);
  
  // Controls
  const [quality, setQuality] = useState<number>(80);
  const [format, setFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/jpeg');
  const [scale, setScale] = useState<number>(100);
  
  // Custom dimensions
  const [customWidth, setCustomWidth] = useState<string>('');
  const [customHeight, setCustomHeight] = useState<string>('');
  const [aspectRatio, setAspectRatio] = useState<number>(1);
  const [naturalWidth, setNaturalWidth] = useState<number>(0);
  const [naturalHeight, setNaturalHeight] = useState<number>(0);
  const [lockRatio, setLockRatio] = useState<boolean>(true);

  // Filters
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [saturation, setSaturation] = useState<number>(100);
  const [blur, setBlur] = useState<number>(0);
  const [grayscale, setGrayscale] = useState<number>(0);

  // Sub-tabs & Metadata states
  const [activeSubTab, setActiveSubTab] = useState<'compress' | 'metadata' | 'favicon'>('compress');
  const [exifData, setExifData] = useState<Record<string, any> | null>(null);
  const [dominantColors, setDominantColors] = useState<string[]>([]);
  const [copiedColor, setCopiedColor] = useState<string | null>(null);

  // Favicon generator states
  const [faviconGenerating, setFaviconGenerating] = useState(false);
  const [faviconHtmlSnippet, setFaviconHtmlSnippet] = useState<string>('');

  const imgRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      loadOriginalFile(file);
    }
  };

  const loadOriginalFile = (file: File) => {
    setOriginalFile(file);
    
    // Read for preview & dominant colors extraction
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        const src = reader.result;
        setOriginalSrc(src);
        extractDominantColors(src);
      }
    };
    reader.readAsDataURL(file);

    // Read for EXIF binary tags
    const bufferReader = new FileReader();
    bufferReader.onload = () => {
      const buffer = bufferReader.result as ArrayBuffer;
      const parsed = parseExif(buffer);
      setExifData(parsed);
    };
    bufferReader.readAsArrayBuffer(file);
  };

  const extractDominantColors = (imgSrc: string) => {
    const img = new Image();
    img.src = imgSrc;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 40;
      canvas.height = 40;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0, 40, 40);
      try {
        const imgData = ctx.getImageData(0, 0, 40, 40);
        const data = imgData.data;
        const counts: Record<string, number> = {};
        for (let i = 0; i < data.length; i += 4) {
          const a = data[i+3];
          if (a < 128) continue; // skip transparent
          
          const r = data[i];
          const g = data[i+1];
          const b = data[i+2];
          
          // Quantize color values to aggregate counts
          const qr = Math.round(r / 20) * 20;
          const qg = Math.round(g / 20) * 20;
          const qb = Math.round(b / 20) * 20;
          
          const hex = '#' + [qr, qg, qb].map(x => {
            const h = Math.max(0, Math.min(255, x)).toString(16);
            return h.length === 1 ? '0' + h : h;
          }).join('');
          
          counts[hex] = (counts[hex] || 0) + 1;
        }
        const sorted = Object.entries(counts)
          .sort((a, b) => b[1] - a[1])
          .map(e => e[0])
          .slice(0, 5);
        setDominantColors(sorted);
      } catch (err) {
        console.warn('Canvas pixel extraction failed', err);
      }
    };
  };

  const handleCopyColor = (color: string) => {
    navigator.clipboard.writeText(color);
    setCopiedColor(color);
    toast.success(`Color ${color} copied to clipboard!`);
    setTimeout(() => setCopiedColor(null), 1500);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      loadOriginalFile(file);
    } else {
      toast.error('Only image uploads are supported');
    }
  };

  // 1. Initial image loads -> extract metadata
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setCustomWidth(img.naturalWidth.toString());
    setCustomHeight(img.naturalHeight.toString());
    setAspectRatio(img.naturalWidth / img.naturalHeight);
    setNaturalWidth(img.naturalWidth);
    setNaturalHeight(img.naturalHeight);
    
    // Auto-detect format from file
    if (originalFile) {
      const type = originalFile.type as any;
      if (['image/jpeg', 'image/png', 'image/webp'].includes(type)) {
        setFormat(type);
      }
    }
  };

  // 2. Perform Processing (Resizing, Compression, Filter)
  const processImage = useCallback(() => {
    if (!originalSrc || !imgRef.current) return;

    const img = imgRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Calculate final dimensions
    let w = Number(customWidth) || img.naturalWidth;
    let h = Number(customHeight) || img.naturalHeight;

    if (scale !== 100) {
      w = Math.round((img.naturalWidth * scale) / 100);
      h = Math.round((img.naturalHeight * scale) / 100);
    }

    canvas.width = w;
    canvas.height = h;

    // Apply Canvas Filters
    ctx.filter = `
      brightness(${brightness}%)
      contrast(${contrast}%)
      saturate(${saturation}%)
      blur(${blur}px)
      grayscale(${grayscale}%)
    `.trim().replace(/\s+/g, ' ');

    // Draw image onto canvas
    ctx.drawImage(img, 0, 0, w, h);

    // Compress & convert
    const qualityFactor = format === 'image/png' ? undefined : quality / 100;
    const dataUrl = canvas.toDataURL(format, qualityFactor);
    setProcessedSrc(dataUrl);

    // Calculate approximate size from Base64
    const head = dataUrl.split(',')[0] || '';
    const body = dataUrl.split(',')[1] || '';
    const bytes = Math.round((body.length * 3) / 4);
    setProcessedSize(bytes);
  }, [originalSrc, scale, customWidth, customHeight, quality, format, brightness, contrast, saturation, blur, grayscale]);

  useEffect(() => {
    // processImage reads the mounted <img> DOM node via imgRef and draws to a canvas;
    // it depends on real DOM/Canvas APIs, not just props/state, so it can't be a pure useMemo.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    processImage();
  }, [processImage]);

  const handleWidthChange = (val: string) => {
    setCustomWidth(val);
    setScale(100); // disable scale preset if custom size is typed
    if (lockRatio) {
      const num = Number(val);
      if (num > 0) {
        setCustomHeight(Math.round(num / aspectRatio).toString());
      }
    }
  };

  const handleHeightChange = (val: string) => {
    setCustomHeight(val);
    setScale(100);
    if (lockRatio) {
      const num = Number(val);
      if (num > 0) {
        setCustomWidth(Math.round(num * aspectRatio).toString());
      }
    }
  };

  const handleDownload = () => {
    if (!processedSrc) return;
    const extension = format.split('/')[1] || 'jpg';
    const originalName = originalFile ? originalFile.name.substring(0, originalFile.name.lastIndexOf('.')) : 'image';
    const filename = `${originalName}-processed.${extension}`;

    const link = document.createElement('a');
    link.href = processedSrc;
    link.download = filename;
    link.click();
    toast.success('Processed image downloaded!');
  };

  const handleResetFilters = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
    setBlur(0);
    setGrayscale(0);
    toast.success('Filters reset!');
  };

  const handleGenerateFavicons = async () => {
    if (!imgRef.current) return;
    setFaviconGenerating(true);
    try {
      const img = imgRef.current;
      const pngBySize = new Map<number, Uint8Array>();
      for (const size of FAVICON_SIZES) {
        pngBySize.set(size, await resizeToPngBytes(img, size));
      }

      const ico = buildIco(
        [16, 32, 48].map((size) => ({ width: size, height: size, pngData: pngBySize.get(size)! }))
      );

      const htmlSnippet = [
        '<link rel="icon" type="image/x-icon" href="/favicon.ico" />',
        '<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />',
        '<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />',
        '<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />',
        '<link rel="manifest" href="/site.webmanifest" />',
      ].join('\n');

      const zip = new JSZip();
      zip.file('favicon.ico', ico);
      zip.file('favicon-16x16.png', pngBySize.get(16)!);
      zip.file('favicon-32x32.png', pngBySize.get(32)!);
      zip.file('apple-touch-icon.png', pngBySize.get(180)!);
      zip.file('android-chrome-192x192.png', pngBySize.get(192)!);
      zip.file('android-chrome-512x512.png', pngBySize.get(512)!);
      zip.file(
        'site.webmanifest',
        JSON.stringify(
          {
            name: '',
            icons: [
              { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
              { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
            ],
            theme_color: '#ffffff',
            background_color: '#ffffff',
            display: 'standalone',
          },
          null,
          2
        )
      );
      zip.file('head-snippet.html', htmlSnippet);

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'favicon-package.zip';
      link.click();
      URL.revokeObjectURL(url);

      setFaviconHtmlSnippet(htmlSnippet);
      toast.success('Favicon package downloaded!');
    } catch (e) {
      console.error(e);
      toast.error('Failed to generate favicons');
    } finally {
      setFaviconGenerating(false);
    }
  };

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const compressionSavings = () => {
    if (!originalFile || processedSize === 0) return 0;
    const diff = originalFile.size - processedSize;
    if (diff <= 0) return 0;
    return Math.round((diff / originalFile.size) * 100);
  };

  return (
    <div className="space-y-6">
      {!originalSrc ? (
        /* Dropzone view */
        <Card
          className="border-2 border-dashed hover:border-primary/50 transition-colors cursor-pointer"
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          <CardContent className="p-12 text-center flex flex-col items-center justify-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center">
              <Upload className="h-6 w-6" />
            </div>
            <div>
              <p className="font-bold text-sm">Drag & drop your image here, or click to upload</p>
              <p className="text-xs text-muted-foreground mt-1">Supports PNG, JPEG, WebP (up to 20MB)</p>
            </div>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              id="img-upload-input"
              onChange={handleFileChange}
            />
            <Button size="sm" asChild>
              <label htmlFor="img-upload-input" className="cursor-pointer">
                Select File
              </label>
            </Button>
          </CardContent>
        </Card>
      ) : (
        /* Main Image Workspace */
        <div className="grid gap-6 md:grid-cols-3">
          {/* Controls Panel */}
          <Card className="md:col-span-1 space-y-4 max-h-[85vh] overflow-y-auto pr-1">
            <CardContent className="p-4 space-y-4 text-xs">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="font-bold text-sm flex items-center gap-1">
                  <Sliders className="h-4 w-4 text-primary" />
                  Adjustment Panel
                </span>
                <Button variant="ghost" size="icon-sm" onClick={() => { setOriginalFile(null); setOriginalSrc(''); setProcessedSrc(''); setExifData(null); setDominantColors([]); }} className="h-6 text-destructive">
                  Clear
                </Button>
              </div>

              <Tabs value={activeSubTab} onValueChange={(v: any) => setActiveSubTab(v)} className="w-full">
                <TabsList className="grid grid-cols-3 w-full mb-3 h-auto gap-1 p-1">
                  <TabsTrigger value="compress" className="flex-col h-auto py-2 gap-1 text-[10px] leading-tight whitespace-normal">
                    <Sliders className="h-4 w-4" /> Compress
                  </TabsTrigger>
                  <TabsTrigger value="metadata" className="flex-col h-auto py-2 gap-1 text-[10px] leading-tight whitespace-normal">
                    <Palette className="h-4 w-4" /> Metadata
                  </TabsTrigger>
                  <TabsTrigger value="favicon" className="flex-col h-auto py-2 gap-1 text-[10px] leading-tight whitespace-normal">
                    <Star className="h-4 w-4" /> Favicon
                  </TabsTrigger>
                </TabsList>

                {/* --- COMPRESS & FILTER CONTENT --- */}
                <TabsContent value="compress" className="m-0 space-y-4">
                  {/* Format & quality */}
                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="img-format">Target Format</Label>
                      <Select value={format} onValueChange={(v) => setFormat(v as any)}>
                        <SelectTrigger id="img-format">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="image/jpeg">JPEG (Lossy)</SelectItem>
                          <SelectItem value="image/webp">WebP (Lossy/Lossless)</SelectItem>
                          <SelectItem value="image/png">PNG (Lossless)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {format !== 'image/png' && (
                      <div className="space-y-1.5">
                        <div className="flex justify-between">
                          <Label htmlFor="quality-slider">Quality ({quality}%)</Label>
                        </div>
                        <input
                          type="range"
                          id="quality-slider"
                          min={10}
                          max={100}
                          value={quality}
                          onChange={(e) => setQuality(Number(e.target.value))}
                          className="w-full accent-primary h-1.5 rounded bg-muted cursor-pointer"
                        />
                      </div>
                    )}
                  </div>

                  {/* Dimensions / Scaling */}
                  <div className="space-y-3 pt-2 border-t">
                    <div className="flex items-center gap-1.5">
                      <Scale className="h-4 w-4 text-primary" />
                      <span className="font-bold text-[10px] uppercase text-muted-foreground">Resizing / Scale</span>
                    </div>

                    <div className="grid gap-2 grid-cols-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="img-width">Width (px)</Label>
                        <Input id="img-width" value={customWidth} onChange={(e) => handleWidthChange(e.target.value)} />
                      </div>
                      <div className="space-y-1.5">
                        <Label htmlFor="img-height">Height (px)</Label>
                        <Input id="img-height" value={customHeight} onChange={(e) => handleHeightChange(e.target.value)} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="lock-ratio-switch">Maintain Aspect Ratio</Label>
                      <input
                        type="checkbox"
                        id="lock-ratio-switch"
                        checked={lockRatio}
                        onChange={(e) => setLockRatio(e.target.checked)}
                        className="accent-primary h-4 w-4 cursor-pointer"
                      />
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <div className="flex justify-between">
                        <Label htmlFor="scale-slider">Quick Scale ({scale}%)</Label>
                      </div>
                      <input
                        type="range"
                        id="scale-slider"
                        min={10}
                        max={200}
                        value={scale}
                        onChange={(e) => setScale(Number(e.target.value))}
                        className="w-full accent-primary h-1.5 rounded bg-muted cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Filter controls */}
                  <div className="space-y-3 pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4 text-primary" />
                        <span className="font-bold text-[10px] uppercase text-muted-foreground">Enhancement Filters</span>
                      </div>
                      <Button variant="ghost" size="icon-sm" onClick={handleResetFilters} className="h-5 text-[9px] font-bold">
                        Reset
                      </Button>
                    </div>

                    {/* Brightness */}
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Brightness ({brightness}%)</span>
                      </div>
                      <input type="range" min={50} max={150} value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} className="w-full accent-primary h-1 cursor-pointer bg-muted" />
                    </div>
                    {/* Contrast */}
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Contrast ({contrast}%)</span>
                      </div>
                      <input type="range" min={50} max={150} value={contrast} onChange={(e) => setContrast(Number(e.target.value))} className="w-full accent-primary h-1 cursor-pointer bg-muted" />
                    </div>
                    {/* Saturation */}
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Saturation ({saturation}%)</span>
                      </div>
                      <input type="range" min={0} max={200} value={saturation} onChange={(e) => setSaturation(Number(e.target.value))} className="w-full accent-primary h-1 cursor-pointer bg-muted" />
                    </div>
                    {/* Grayscale */}
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Grayscale ({grayscale}%)</span>
                      </div>
                      <input type="range" min={0} max={100} value={grayscale} onChange={(e) => setGrayscale(Number(e.target.value))} className="w-full accent-primary h-1 cursor-pointer bg-muted" />
                    </div>
                    {/* Blur */}
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span>Blur ({blur}px)</span>
                      </div>
                      <input type="range" min={0} max={10} value={blur} onChange={(e) => setBlur(Number(e.target.value))} className="w-full accent-primary h-1 cursor-pointer bg-muted" />
                    </div>
                  </div>
                </TabsContent>

                {/* --- METADATA & PALETTE CONTENT --- */}
                <TabsContent value="metadata" className="m-0 space-y-4">
                  {/* File specifications */}
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-1.5 border-b pb-1.5">
                      <FileText className="h-4 w-4 text-primary" />
                      <span className="font-bold text-[10px] uppercase text-muted-foreground">File Information</span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                      <div>
                        <span className="text-muted-foreground block">File Name</span>
                        <span className="font-mono font-bold truncate block">{originalFile?.name}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">File Size</span>
                        <span className="font-mono font-bold block">{originalFile ? formatSize(originalFile.size) : '0 B'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">MIME Type</span>
                        <span className="font-mono font-bold block">{originalFile?.type || 'image/unknown'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Resolution</span>
                        <span className="font-mono font-bold block">{naturalWidth} x {naturalHeight} px</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Aspect Ratio</span>
                        <span className="font-mono font-bold block">{aspectRatio.toFixed(2)} ({aspectRatio > 1.2 ? 'Landscape' : aspectRatio < 0.8 ? 'Portrait' : 'Square'})</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground block">Color Depth</span>
                        <span className="font-mono font-bold block">24-bit (sRGB)</span>
                      </div>
                    </div>
                  </div>

                  {/* Dominant Color Palette */}
                  {dominantColors.length > 0 && (
                    <div className="space-y-2 pt-2 border-t">
                      <div className="flex items-center gap-1.5 pb-1">
                        <Palette className="h-4 w-4 text-primary" />
                        <span className="font-bold text-[10px] uppercase text-muted-foreground">Dominant Color Palette</span>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {dominantColors.map((color, idx) => (
                          <Tooltip key={idx}>
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                onClick={() => handleCopyColor(color)}
                                style={{ backgroundColor: color }}
                                className="h-8 w-8 rounded-full border border-white/20 shadow-md relative hover:scale-110 active:scale-95 transition-all group flex items-center justify-center cursor-pointer"
                              >
                                {copiedColor === color && (
                                  <Check className="h-4 w-4 text-white drop-shadow animate-check-pop" />
                                )}
                                <span className="opacity-0 group-hover:opacity-100 text-[8px] bg-slate-900/90 text-white font-mono rounded px-1 absolute -bottom-5 z-10 transition-opacity pointer-events-none">
                                  {color}
                                </span>
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>{`Click to copy: ${color}`}</TooltipContent>
                          </Tooltip>
                        ))}
                      </div>
                      <span className="text-[9px] text-muted-foreground block italic">Click any swatch to copy its Hex color value.</span>
                    </div>
                  )}

                  {/* Camera EXIF Details */}
                  <div className="space-y-2.5 pt-2 border-t">
                    <div className="flex items-center gap-1.5 border-b pb-1.5">
                      <Camera className="h-4 w-4 text-primary" />
                      <span className="font-bold text-[10px] uppercase text-muted-foreground">Camera EXIF Data</span>
                    </div>

                    {exifData && Object.keys(exifData).length > 0 ? (
                      <div className="grid grid-cols-2 gap-2 text-[10px]">
                        {exifData.make && (
                          <div>
                            <span className="text-muted-foreground block">Camera Make</span>
                            <span className="font-mono font-bold block">{exifData.make}</span>
                          </div>
                        )}
                        {exifData.model && (
                          <div>
                            <span className="text-muted-foreground block">Camera Model</span>
                            <span className="font-mono font-bold block">{exifData.model}</span>
                          </div>
                        )}
                        {exifData.dateTaken && (
                          <div>
                            <span className="text-muted-foreground block">Date Taken</span>
                            <span className="font-mono font-bold block">{exifData.dateTaken}</span>
                          </div>
                        )}
                        {exifData.aperture && (
                          <div>
                            <span className="text-muted-foreground block">Aperture</span>
                            <span className="font-mono font-bold block">{exifData.aperture}</span>
                          </div>
                        )}
                        {exifData.exposureTime && (
                          <div>
                            <span className="text-muted-foreground block">Exposure Time</span>
                            <span className="font-mono font-bold block">{exifData.exposureTime}</span>
                          </div>
                        )}
                        {exifData.iso && (
                          <div>
                            <span className="text-muted-foreground block">ISO Rating</span>
                            <span className="font-mono font-bold block">ISO {exifData.iso}</span>
                          </div>
                        )}
                        {exifData.focalLength && (
                          <div>
                            <span className="text-muted-foreground block">Focal Length</span>
                            <span className="font-mono font-bold block">{exifData.focalLength}</span>
                          </div>
                        )}
                        {exifData.software && (
                          <div className="col-span-2">
                            <span className="text-muted-foreground block">Software Editor</span>
                            <span className="font-mono font-bold block">{exifData.software}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-4 bg-muted/20 border border-dashed rounded-lg text-[10px] text-muted-foreground/60 italic leading-snug">
                        No camera EXIF metadata detected.<br />(Usually present in original uncompressed photos from cameras/phones).
                      </div>
                    )}
                  </div>
                </TabsContent>

                {/* --- FAVICON GENERATOR CONTENT --- */}
                <TabsContent value="favicon" className="m-0 space-y-4">
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-1.5 border-b pb-1.5">
                      <Star className="h-4 w-4 text-primary" />
                      <span className="font-bold text-[10px] uppercase text-muted-foreground">Favicon Package Generator</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground leading-relaxed">
                      Generates a full favicon set from the source image above: a multi-resolution <code>.ico</code> (16/32/48px),
                      standalone PNGs (16, 32, 64, 180 Apple touch, 192 & 512 Android Chrome), a <code>site.webmanifest</code>,
                      and an HTML snippet — packaged as a downloadable ZIP.
                    </p>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {FAVICON_SIZES.map((s) => (
                        <span key={s} className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-muted/60 border">{s}×{s}</span>
                      ))}
                    </div>

                    <Button onClick={handleGenerateFavicons} disabled={faviconGenerating} size="sm" className="w-full text-xs gap-1.5 mt-2">
                      {faviconGenerating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                      Generate & Download ZIP
                    </Button>
                  </div>

                  {faviconHtmlSnippet && (
                    <div className="space-y-1.5 pt-2 border-t">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[10px] uppercase text-muted-foreground">HTML &lt;head&gt; snippet</span>
                        <CopyButton value={faviconHtmlSnippet} toastMessage="Snippet copied!" className="h-5 w-5" iconClassName="h-3 w-3" />
                      </div>
                      <pre className="text-[9px] font-mono p-2 bg-muted/30 border rounded-md overflow-x-auto whitespace-pre-wrap break-all">
                        {faviconHtmlSnippet}
                      </pre>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Workspaces Comparison View */}
          <div className="md:col-span-2 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Original Preview */}
              <Card>
                <div className="p-2 border-b bg-muted/40 text-[10px] text-muted-foreground font-mono flex justify-between">
                  <span>ORIGINAL PREVIEW</span>
                  {originalFile && <span>{formatSize(originalFile.size)}</span>}
                </div>
                <CardContent className="p-3 flex items-center justify-center bg-muted/20 min-h-[220px]">
                  {/* eslint-disable-next-line @next/next/no-img-element -- client-side blob preview of an arbitrary user upload, no fixed dimensions to give next/image */}
                  <img
                    src={originalSrc}
                    alt="Original"
                    className="max-h-60 rounded object-contain border bg-card shadow-sm"
                    onLoad={handleImageLoad}
                    ref={imgRef}
                  />
                </CardContent>
              </Card>

              {/* Compressed/Enhanced Preview */}
              <Card>
                <div className="p-2 border-b bg-muted/40 text-[10px] text-muted-foreground font-mono flex justify-between">
                  <span>PROCESSED OUTPUT</span>
                  <span>{formatSize(processedSize)}</span>
                </div>
                <CardContent className="p-3 flex items-center justify-center bg-muted/20 min-h-[220px]">
                  {processedSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element -- client-side canvas output data URL, no fixed dimensions to give next/image
                    <img
                      src={processedSrc}
                      alt="Processed"
                      className="max-h-60 rounded object-contain border bg-card shadow-sm"
                    />
                  ) : (
                    <div className="text-muted-foreground italic text-xs">Processing...</div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Savings & Download Panel */}
            <Card>
              <CardContent className="p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3 text-xs leading-normal">
                  <div className="h-10 w-10 rounded-full bg-emerald-500/10 text-emerald-600 flex items-center justify-center font-bold">
                    {compressionSavings()}%
                  </div>
                  <div>
                    <h4 className="font-bold">Compression Savings</h4>
                    <p className="text-muted-foreground">
                      {compressionSavings() > 0 
                        ? `Reduced image size by ${formatSize(originalFile ? originalFile.size - processedSize : 0)}.`
                        : 'Current settings do not reduce file size.'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => { setScale(100); handleResetFilters(); }} className="text-xs">
                    <RefreshCw className="h-3 w-3 mr-1" />
                    Reset Details
                  </Button>
                  <Button size="sm" onClick={handleDownload} className="text-xs">
                    <Download className="h-3.5 w-3.5 mr-1" />
                    Download Image
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
