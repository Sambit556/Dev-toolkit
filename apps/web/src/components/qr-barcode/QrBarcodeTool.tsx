'use client';

import React, { useState, useEffect, useRef } from 'react';
import { QrCode, Barcode, Download, Copy, RefreshCw, LayoutGrid } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';
import { toast } from 'sonner';

export function QrBarcodeTool() {
  const [activeTab, setActiveTab] = useState('qr-gen');

  // --- QR CODE GENERATOR STATES ---
  const [qrText, setQrText] = useState('https://devtoolkit.app');
  const [qrFgColor, setQrFgColor] = useState('#000000');
  const [qrBgColor, setQrBgColor] = useState('#FFFFFF');
  const [qrSize, setQrSize] = useState<number>(256);
  const [qrEcc, setQrEcc] = useState<'L' | 'M' | 'Q' | 'H'>('M');
  const [qrImgSrc, setQrImgSrc] = useState<string>('');

  // --- BARCODE GENERATOR STATES ---
  const [bcText, setBcText] = useState('123456789012');
  const [bcFormat, setBcFormat] = useState('CODE128');
  const [bcFgColor, setBcFgColor] = useState('#000000');
  const [bcBgColor, setBcBgColor] = useState('#FFFFFF');
  const [bcWidth, setBcWidth] = useState<number>(2);
  const [bcHeight, setBcHeight] = useState<number>(80);
  const [bcDisplayVal, setBcDisplayVal] = useState<boolean>(true);
  const [bcError, setBcError] = useState<string | null>(null);

  const [barcodeSvgNode, setBarcodeSvgNode] = useState<SVGSVGElement | null>(null);

  // --- GENERATE QR CODE ---
  useEffect(() => {
    if (!qrText) {
      setQrImgSrc('');
      return;
    }

    QRCode.toDataURL(
      qrText,
      {
        width: qrSize,
        margin: 2,
        errorCorrectionLevel: qrEcc,
        color: {
          dark: qrFgColor,
          light: qrBgColor,
        },
      },
      (err, url) => {
        if (err) {
          console.error(err);
          toast.error('Failed to generate QR code');
          return;
        }
        setQrImgSrc(url);
      }
    );
  }, [qrText, qrFgColor, qrBgColor, qrSize, qrEcc]);

  // --- GENERATE BARCODE ---
  useEffect(() => {
    if (!bcText || !barcodeSvgNode) return;

    try {
      JsBarcode(barcodeSvgNode, bcText, {
        format: bcFormat,
        width: bcWidth,
        height: bcHeight,
        displayValue: bcDisplayVal,
        lineColor: bcFgColor,
        background: bcBgColor,
        valid: (valid) => {
          if (!valid) {
            setBcError(`Invalid character sequence for format ${bcFormat}`);
          } else {
            setBcError(null);
          }
        },
      });
    } catch (e: any) {
      setBcError(e.message || 'Error generating barcode');
    }
  }, [bcText, bcFormat, bcFgColor, bcBgColor, bcWidth, bcHeight, bcDisplayVal, barcodeSvgNode, activeTab]);

  const handleDownloadQr = () => {
    if (!qrImgSrc) return;
    const link = document.createElement('a');
    link.href = qrImgSrc;
    link.download = `qrcode_${Date.now()}.png`;
    link.click();
    toast.success('QR Code downloaded!');
  };

  const handleDownloadBarcode = () => {
    if (!barcodeSvgNode || bcError) return;

    // Convert SVG to dataURL for downloading as PNG
    try {
      const svg = barcodeSvgNode;
      const svgString = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const DOMURL = window.URL || window.webkitURL || window;
      const url = DOMURL.createObjectURL(svgBlob);

      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = svg.getBoundingClientRect().width || 300;
        canvas.height = svg.getBoundingClientRect().height || 150;
        const context = canvas.getContext('2d');
        if (context) {
          context.fillStyle = bcBgColor;
          context.fillRect(0, 0, canvas.width, canvas.height);
          context.drawImage(image, 0, 0);
          
          const pngUrl = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.href = pngUrl;
          link.download = `barcode_${bcText}.png`;
          link.click();
          DOMURL.revokeObjectURL(url);
          toast.success('Barcode downloaded as PNG!');
        }
      };
      image.src = url;
    } catch (e) {
      toast.error('Download failed. Try copying instead.');
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <div className="flex justify-center">
        <TabsList className="grid grid-cols-2 w-full max-w-md h-auto p-1 gap-1">
          <TabsTrigger value="qr-gen" className="gap-2 py-2 text-xs">
            <QrCode className="h-4 w-4" />
            QR Code Generator
          </TabsTrigger>
          <TabsTrigger value="barcode-gen" className="gap-2 py-2 text-xs">
            <Barcode className="h-4 w-4" />
            Barcode Generator
          </TabsTrigger>
        </TabsList>
      </div>

      {/* --- QR CODE GENERATOR CONTENT --- */}
      <TabsContent value="qr-gen" className="m-0 space-y-6 animate-fade-in">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Controls */}
          <Card className="border bg-card/60 backdrop-blur-sm shadow-sm md:col-span-1">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center pb-2 border-b">
                <Label className="font-bold text-sm">QR Code Settings</Label>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="qr-content">Content (Text or URL)</Label>
                <Input
                  id="qr-content"
                  type="text"
                  value={qrText}
                  onChange={(e) => setQrText(e.target.value)}
                  placeholder="https://example.com"
                  className="text-xs h-9"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                <div className="space-y-1.5">
                  <Label htmlFor="qr-fg">Foreground Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="qr-fg"
                      type="color"
                      value={qrFgColor}
                      onChange={(e) => setQrFgColor(e.target.value)}
                      className="h-8 w-10 p-0 cursor-pointer border-none"
                    />
                    <span className="font-mono text-[10px]">{qrFgColor}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="qr-bg">Background Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="qr-bg"
                      type="color"
                      value={qrBgColor}
                      onChange={(e) => setQrBgColor(e.target.value)}
                      className="h-8 w-10 p-0 cursor-pointer border-none"
                    />
                    <span className="font-mono text-[10px]">{qrBgColor}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                <div className="space-y-1.5">
                  <Label>Error Correction</Label>
                  <Select value={qrEcc} onValueChange={(v: any) => setQrEcc(v)}>
                    <SelectTrigger className="h-8.5 bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="L">L (7% Recovery)</SelectItem>
                      <SelectItem value="M">M (15% Recovery)</SelectItem>
                      <SelectItem value="Q">Q (25% Recovery)</SelectItem>
                      <SelectItem value="H">H (30% Recovery)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Image Size (px)</Label>
                  <Select value={String(qrSize)} onValueChange={(v) => setQrSize(Number(v))}>
                    <SelectTrigger className="h-8.5 bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="128">128 x 128</SelectItem>
                      <SelectItem value="256">256 x 256</SelectItem>
                      <SelectItem value="384">384 x 384</SelectItem>
                      <SelectItem value="512">512 x 512</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Visual Preview */}
          <Card className="border shadow-md md:col-span-2 flex flex-col justify-center items-center py-10">
            <CardContent className="flex flex-col items-center gap-6">
              <div className="p-4 border rounded-2xl bg-white shadow-inner flex items-center justify-center">
                {qrImgSrc ? (
                  <img
                    src={qrImgSrc}
                    alt="QR Code Preview"
                    className="max-h-[220px] max-w-[220px] rounded-lg select-none"
                  />
                ) : (
                  <div className="h-44 w-44 flex items-center justify-center text-xs text-muted-foreground/50 italic">
                    Type text to preview
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button onClick={handleDownloadQr} className="w-32 gap-1.5 text-xs font-bold" disabled={!qrImgSrc}>
                  <Download className="h-3.5 w-3.5" />
                  Download
                </Button>
                <Button variant="outline" onClick={() => { navigator.clipboard.writeText(qrText); toast.success('Encoded text copied!'); }} className="w-32 gap-1.5 text-xs" disabled={!qrText}>
                  <Copy className="h-3.5 w-3.5" />
                  Copy Data
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* --- BARCODE GENERATOR CONTENT --- */}
      <TabsContent value="barcode-gen" className="m-0 space-y-6 animate-fade-in">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Controls */}
          <Card className="border bg-card/60 backdrop-blur-sm shadow-sm md:col-span-1">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center pb-2 border-b">
                <Label className="font-bold text-sm">Barcode Settings</Label>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bc-content">Value (Code data)</Label>
                <Input
                  id="bc-content"
                  type="text"
                  value={bcText}
                  onChange={(e) => setBcText(e.target.value)}
                  placeholder="1234567890"
                  className="text-xs h-9 font-mono"
                />
              </div>

              <div className="space-y-1.5 text-xs">
                <Label>Symbology Format</Label>
                <Select value={bcFormat} onValueChange={setBcFormat}>
                  <SelectTrigger className="h-8.5 bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CODE128">CODE128 (Standard)</SelectItem>
                    <SelectItem value="CODE39">CODE39 (Alphanumeric)</SelectItem>
                    <SelectItem value="EAN13">EAN-13 (13 digits)</SelectItem>
                    <SelectItem value="UPC">UPC-A (12 digits)</SelectItem>
                    <SelectItem value="ITF14">ITF-14 (14 digits)</SelectItem>
                    <SelectItem value="MSI">MSI / Plessey</SelectItem>
                    <SelectItem value="pharmacode">Pharmacode (Medical)</SelectItem>
                    <SelectItem value="codabar">Codabar</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                <div className="space-y-1.5">
                  <Label htmlFor="bc-fg">Bar Color</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="bc-fg"
                      type="color"
                      value={bcFgColor}
                      onChange={(e) => setBcFgColor(e.target.value)}
                      className="h-8 w-10 p-0 cursor-pointer border-none"
                    />
                    <span className="font-mono text-[10px]">{bcFgColor}</span>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="bc-bg">Background</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      id="bc-bg"
                      type="color"
                      value={bcBgColor}
                      onChange={(e) => setBcBgColor(e.target.value)}
                      className="h-8 w-10 p-0 cursor-pointer border-none"
                    />
                    <span className="font-mono text-[10px]">{bcBgColor}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs pt-1">
                <div className="space-y-1.5">
                  <Label>Bar Width</Label>
                  <Select value={String(bcWidth)} onValueChange={(v) => setBcWidth(Number(v))}>
                    <SelectTrigger className="h-8.5 bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 px</SelectItem>
                      <SelectItem value="2">2 px (Default)</SelectItem>
                      <SelectItem value="3">3 px</SelectItem>
                      <SelectItem value="4">4 px</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Bar Height (px)</Label>
                  <Input
                    type="number"
                    min={40}
                    max={150}
                    value={bcHeight}
                    onChange={(e) => setBcHeight(Math.max(40, Math.min(150, parseInt(e.target.value) || 40)))}
                    className="h-8.5 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t text-xs">
                <Label htmlFor="bc-text" className="cursor-pointer">Display Code Text</Label>
                <Switch
                  id="bc-text"
                  checked={bcDisplayVal}
                  onCheckedChange={setBcDisplayVal}
                />
              </div>
            </CardContent>
          </Card>

          {/* Preview Panel */}
          <Card className="border shadow-md md:col-span-2 flex flex-col justify-center items-center py-10">
            <CardContent className="flex flex-col items-center gap-6 w-full max-w-sm">
              <div className="p-4 border rounded-2xl bg-white shadow-inner min-h-[140px] flex items-center justify-center w-full overflow-x-auto">
                <svg ref={setBarcodeSvgNode} className={`${bcError ? 'hidden' : 'block'} select-none mx-auto`} />
                {bcError && (
                  <div className="text-xs text-red-500 font-bold text-center px-4 max-w-xs leading-normal">
                    {bcError}
                  </div>
                )}
                {!bcText && !bcError && (
                  <div className="text-xs text-muted-foreground/50 italic text-center">
                    Type text to preview
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button onClick={handleDownloadBarcode} className="w-32 gap-1.5 text-xs font-bold" disabled={!!bcError || !bcText}>
                  <Download className="h-3.5 w-3.5" />
                  Download
                </Button>
                <Button variant="outline" onClick={() => { navigator.clipboard.writeText(bcText); toast.success('Barcode value copied!'); }} className="w-32 gap-1.5 text-xs" disabled={!bcText}>
                  <Copy className="h-3.5 w-3.5" />
                  Copy Value
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
}
