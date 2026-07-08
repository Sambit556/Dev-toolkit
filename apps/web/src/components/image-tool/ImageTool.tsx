'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Upload, Image as ImageIcon, Sliders, Check, Download, RefreshCw, Sparkles, Scale, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

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
  const [lockRatio, setLockRatio] = useState<boolean>(true);

  // Filters
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(100);
  const [saturation, setSaturation] = useState<number>(100);
  const [blur, setBlur] = useState<number>(0);
  const [grayscale, setGrayscale] = useState<number>(0);

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
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setOriginalSrc(reader.result);
      }
    };
    reader.readAsDataURL(file);
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
    
    // Auto-detect format from file
    if (originalFile) {
      const type = originalFile.type as any;
      if (['image/jpeg', 'image/png', 'image/webp'].includes(type)) {
        setFormat(type);
      }
    }
  };

  // 2. Perform Processing (Resizing, Compression, Filter)
  const processImage = () => {
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
  };

  useEffect(() => {
    processImage();
  }, [originalSrc, scale, customWidth, customHeight, quality, format, brightness, contrast, saturation, blur, grayscale]);

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
                <Button variant="ghost" size="icon-sm" onClick={() => { setOriginalFile(null); setOriginalSrc(''); setProcessedSrc(''); }} className="h-6 text-destructive">
                  Clear
                </Button>
              </div>

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
