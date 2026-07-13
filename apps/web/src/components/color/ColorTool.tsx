'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Palette, Copy, RefreshCw, Layers, ShieldCheck, Check, X, ShieldAlert, Lock, Unlock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { hexToRgb, rgbToHex, rgbToHsl, hslToRgb, rgbToHsv, rgbToCmyk, getContrastRatio, getColorHarmonies } from '@/lib/color';
import { toast } from 'sonner';

const DEFAULT_COLORS = {
  rgb: { r: 59, g: 130, b: 246, a: 1 },
  hsl: { h: 217, s: 91, l: 60, a: 1 },
  hsv: { h: 217, s: 76, v: 96 },
  cmyk: { c: 76, m: 47, y: 0, k: 4 },
};
const DEFAULT_CONTRAST_RATIO = 4.5;

export function ColorTool() {
  const [hexColor, setHexColor] = useState<string>('#3B82F6');

  // RGB, HSL, HSV, CMYK are pure derivations of hexColor. Falls back to a fixed
  // default while the hex field is mid-edit and momentarily invalid (e.g. "#3B").
  const { rgb, hsl, hsv, cmyk } = useMemo(() => {
    const parsed = hexToRgb(hexColor);
    if (!parsed) {
      return DEFAULT_COLORS;
    }
    const activeRgb = { r: parsed.r, g: parsed.g, b: parsed.b, a: parsed.a ?? 1 };
    const activeHslRaw = rgbToHsl(activeRgb);
    const activeHsl = { h: activeHslRaw.h, s: activeHslRaw.s, l: activeHslRaw.l, a: activeHslRaw.a ?? 1 };
    const activeHsv = rgbToHsv(activeRgb);
    const activeCmyk = rgbToCmyk(activeRgb);
    return { rgb: activeRgb, hsl: activeHsl, hsv: activeHsv, cmyk: activeCmyk };
  }, [hexColor]);

  // Contrast states
  const [fgColor, setFgColor] = useState<string>('#FFFFFF');
  const [bgColor, setBgColor] = useState<string>('#3B82F6');
  const contrastRatio = useMemo(() => {
    const rgbFg = hexToRgb(fgColor);
    const rgbBg = hexToRgb(bgColor);
    return rgbFg && rgbBg ? getContrastRatio(rgbFg, rgbBg) : DEFAULT_CONTRAST_RATIO;
  }, [fgColor, bgColor]);

  // Palette Generator state
  const [palette, setPalette] = useState<{ hex: string; locked: boolean }[]>([
    { hex: '#3B82F6', locked: false },
    { hex: '#10B981', locked: false },
    { hex: '#F59E0B', locked: false },
    { hex: '#EF4444', locked: false },
    { hex: '#8B5CF6', locked: false },
  ]);

  const generatePalette = () => {
    setPalette(prev =>
      prev.map(c => {
        if (c.locked) return c;
        const randomHex = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0').toUpperCase();
        return { hex: randomHex, locked: false };
      })
    );
  };

  const toggleLockColor = (idx: number) => {
    setPalette(prev =>
      prev.map((c, i) => (i === idx ? { ...c, locked: !c.locked } : c))
    );
  };

  // Listen for spacebar to regenerate colors
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        generatePalette();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleHexInput = (val: string) => {
    setHexColor(val);
  };

  const handleRgbSlider = (key: 'r' | 'g' | 'b', val: number) => {
    const nextRgb = { ...rgb, [key]: val };
    const nextHex = rgbToHex(nextRgb);
    setHexColor(nextHex);
  };

  const handleHslSlider = (key: 'h' | 's' | 'l', val: number) => {
    const nextHsl = { ...hsl, [key]: val };
    const nextRgb = hslToRgb(nextHsl);
    const nextHex = rgbToHex(nextRgb);
    setHexColor(nextHex);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  const harmonies = getColorHarmonies(hexColor);

  const getWcagStatus = (ratio: number, size: 'normal' | 'large' | 'ui') => {
    if (size === 'normal') {
      return {
        aa: ratio >= 4.5,
        aaa: ratio >= 7.0,
      };
    } else if (size === 'large') {
      return {
        aa: ratio >= 3.0,
        aaa: ratio >= 4.5,
      };
    } else {
      return {
        aa: ratio >= 3.0,
        aaa: ratio >= 3.0,
      };
    }
  };

  const wcag = getWcagStatus(contrastRatio, 'normal');
  const wcagLarge = getWcagStatus(contrastRatio, 'large');
  const wcagUi = getWcagStatus(contrastRatio, 'ui');

  return (
    <Tabs defaultValue="picker" className="space-y-6">
      <TabsList>
        <TabsTrigger value="picker" className="gap-2">
          <Palette className="h-4 w-4" />
          Color Converter & Harmonies
        </TabsTrigger>
        <TabsTrigger value="contrast" className="gap-2">
          <ShieldCheck className="h-4 w-4" />
          Contrast Ratio Checker (WCAG)
        </TabsTrigger>
        <TabsTrigger value="palette-gen" className="gap-2">
          <Palette className="h-4 w-4" />
          Random Palette Generator
        </TabsTrigger>
      </TabsList>

      {/* --- COLOR PICKER TAB --- */}
      <TabsContent value="picker" className="space-y-6">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Main Picker Block */}
          <Card className="md:col-span-1">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b">
                <span className="text-sm font-bold">Active Color</span>
                <span className="font-mono text-xs text-muted-foreground">{hexColor}</span>
              </div>

              {/* Large color square */}
              <div
                className="w-full h-32 rounded-xl shadow-inner border border-muted"
                style={{ backgroundColor: hexColor }}
              />

              {/* Native Picker Trigger */}
              <div className="flex items-center gap-3">
                <div className="relative h-10 w-10 overflow-hidden rounded-md border border-border cursor-pointer">
                  <input
                    type="color"
                    className="absolute inset-[-4px] h-20 w-20 cursor-pointer p-0"
                    value={hexColor.substring(0, 7)}
                    onChange={(e) => handleHexInput(e.target.value)}
                  />
                </div>
                <div className="flex-1">
                  <Input
                    type="text"
                    value={hexColor}
                    onChange={(e) => handleHexInput(e.target.value)}
                    className="font-mono text-xs"
                    placeholder="#3B82F6"
                  />
                </div>
              </div>

              {/* RGB Sliders */}
              <div className="space-y-3 pt-2 text-xs">
                <p className="font-bold text-muted-foreground uppercase text-[9px] tracking-wider border-b pb-1">RGB Channels</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <span className="w-8 text-red-500 font-bold">Red</span>
                    <input
                      type="range"
                      min={0}
                      max={255}
                      value={rgb.r}
                      onChange={(e) => handleRgbSlider('r', Number(e.target.value))}
                      className="flex-1 accent-red-500 h-1.5 rounded bg-muted cursor-pointer"
                    />
                    <span className="w-8 text-right font-mono">{rgb.r}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="w-8 text-green-600 font-bold">Green</span>
                    <input
                      type="range"
                      min={0}
                      max={255}
                      value={rgb.g}
                      onChange={(e) => handleRgbSlider('g', Number(e.target.value))}
                      className="flex-1 accent-green-600 h-1.5 rounded bg-muted cursor-pointer"
                    />
                    <span className="w-8 text-right font-mono">{rgb.g}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="w-8 text-blue-500 font-bold">Blue</span>
                    <input
                      type="range"
                      min={0}
                      max={255}
                      value={rgb.b}
                      onChange={(e) => handleRgbSlider('b', Number(e.target.value))}
                      className="flex-1 accent-blue-500 h-1.5 rounded bg-muted cursor-pointer"
                    />
                    <span className="w-8 text-right font-mono">{rgb.b}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conversions Side */}
          <div className="md:col-span-2 space-y-4">
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="font-semibold text-sm">Color Formats</h3>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Conversions</span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 text-xs">
                  {/* HEX */}
                  <div className="space-y-1 bg-muted/20 border p-2.5 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="font-bold text-[9px] uppercase text-muted-foreground">HEX</p>
                      <p className="font-mono font-bold text-sm text-primary">{hexColor}</p>
                    </div>
                    <Button variant="ghost" size="icon-sm" onClick={() => handleCopy(hexColor, 'HEX')} className="h-7 w-7 text-muted-foreground">
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {/* RGB */}
                  <div className="space-y-1 bg-muted/20 border p-2.5 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="font-bold text-[9px] uppercase text-muted-foreground">RGB</p>
                      <p className="font-mono font-bold text-sm">{`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`}</p>
                    </div>
                    <Button variant="ghost" size="icon-sm" onClick={() => handleCopy(`rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`, 'RGB')} className="h-7 w-7 text-muted-foreground">
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {/* HSL */}
                  <div className="space-y-1 bg-muted/20 border p-2.5 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="font-bold text-[9px] uppercase text-muted-foreground">HSL</p>
                      <p className="font-mono font-bold text-sm">{`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`}</p>
                    </div>
                    <Button variant="ghost" size="icon-sm" onClick={() => handleCopy(`hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`, 'HSL')} className="h-7 w-7 text-muted-foreground">
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>

                  {/* CMYK */}
                  <div className="space-y-1 bg-muted/20 border p-2.5 rounded-lg flex items-center justify-between">
                    <div>
                      <p className="font-bold text-[9px] uppercase text-muted-foreground">CMYK</p>
                      <p className="font-mono font-bold text-sm">{`cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`}</p>
                    </div>
                    <Button variant="ghost" size="icon-sm" onClick={() => handleCopy(`cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`, 'CMYK')} className="h-7 w-7 text-muted-foreground">
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Harmonies & Palettes */}
            {harmonies && (
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center gap-1.5 border-b pb-2">
                    <Palette className="h-4 w-4 text-primary" />
                    <h3 className="font-semibold text-sm">Color Harmonies</h3>
                  </div>

                  <div className="space-y-3.5">
                    {Object.entries(harmonies).map(([type, colors]) => (
                      <div key={type} className="space-y-1.5">
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider capitalize">
                          {type.replace(/([A-Z])/g, ' $1')}
                        </span>
                        <div className="flex gap-1.5">
                          {colors.map((color) => (
                            <Tooltip key={color}>
                              <TooltipTrigger asChild>
                                <div
                                  className="h-10 flex-1 rounded-md shadow-sm border border-black/10 cursor-pointer relative group overflow-hidden"
                                  style={{ backgroundColor: color }}
                                  onClick={() => setHexColor(color)}
                                >
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-[10px] font-mono text-white font-bold">
                                    {color}
                                  </div>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>{`Click to select: ${color}`}</TooltipContent>
                            </Tooltip>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </TabsContent>

      {/* --- WCAG CONTRAST TAB --- */}
      <TabsContent value="contrast" className="space-y-6">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Inputs Column */}
          <Card className="md:col-span-1">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <h3 className="font-semibold text-sm">Contrast Setup</h3>
              </div>

              {/* Text Foreground Color */}
              <div className="space-y-1.5">
                <Label htmlFor="fg-color">Text Color (Foreground)</Label>
                <div className="flex gap-2">
                  <div className="relative h-10 w-10 overflow-hidden rounded-md border border-border cursor-pointer">
                    <input
                      type="color"
                      className="absolute inset-[-4px] h-20 w-20 cursor-pointer p-0"
                      value={fgColor.substring(0, 7)}
                      onChange={(e) => setFgColor(e.target.value)}
                    />
                  </div>
                  <Input
                    id="fg-color"
                    value={fgColor}
                    onChange={(e) => setFgColor(e.target.value)}
                    className="font-mono text-xs"
                  />
                </div>
              </div>

              {/* Background Color */}
              <div className="space-y-1.5">
                <Label htmlFor="bg-color">Background Color</Label>
                <div className="flex gap-2">
                  <div className="relative h-10 w-10 overflow-hidden rounded-md border border-border cursor-pointer">
                    <input
                      type="color"
                      className="absolute inset-[-4px] h-20 w-20 cursor-pointer p-0"
                      value={bgColor.substring(0, 7)}
                      onChange={(e) => setBgColor(e.target.value)}
                    />
                  </div>
                  <Input
                    id="bg-color"
                    value={bgColor}
                    onChange={(e) => setBgColor(e.target.value)}
                    className="font-mono text-xs"
                  />
                </div>
              </div>

              {/* Swap Button */}
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={() => {
                  const temp = fgColor;
                  setFgColor(bgColor);
                  setBgColor(temp);
                }}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Swap Colors
              </Button>
            </CardContent>
          </Card>

          {/* Results Column */}
          <div className="md:col-span-2 space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              {/* Contrast Large Metric */}
              <Card className="sm:col-span-1 flex flex-col justify-center text-center p-4">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Contrast Ratio</span>
                <p className="text-4xl font-black text-primary leading-none font-mono">{contrastRatio}:1</p>
                
                <div className="mt-4 flex justify-center">
                  {contrastRatio >= 4.5 ? (
                    <Badge variant="success" className="gap-1.5">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      Compliant
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="gap-1.5">
                      <ShieldAlert className="h-3.5 w-3.5" />
                      Poor Contrast
                    </Badge>
                  )}
                </div>
              </Card>

              {/* WCAG Compliance checklist */}
              <Card className="sm:col-span-2">
                <CardContent className="p-4 space-y-3 text-xs leading-normal">
                  <h4 className="font-bold border-b pb-1 text-[11px] text-muted-foreground uppercase">WCAG 2.1 Compliance Checks</h4>
                  
                  {/* Normal Text */}
                  <div className="flex items-center justify-between py-1 border-b">
                    <span>Normal Text (under 18pt)</span>
                    <div className="flex gap-2">
                      <Badge variant={wcag.aa ? 'success' : 'destructive'} className="gap-0.5 text-[9px]">
                        {wcag.aa ? <Check className="h-2.5 w-2.5" /> : <X className="h-2.5 w-2.5" />} AA (4.5:1)
                      </Badge>
                      <Badge variant={wcag.aaa ? 'success' : 'destructive'} className="gap-0.5 text-[9px]">
                        {wcag.aaa ? <Check className="h-2.5 w-2.5" /> : <X className="h-2.5 w-2.5" />} AAA (7.0:1)
                      </Badge>
                    </div>
                  </div>

                  {/* Large Text */}
                  <div className="flex items-center justify-between py-1 border-b">
                    <span>Large Text (over 18pt or bold 14pt)</span>
                    <div className="flex gap-2">
                      <Badge variant={wcagLarge.aa ? 'success' : 'destructive'} className="gap-0.5 text-[9px]">
                        {wcagLarge.aa ? <Check className="h-2.5 w-2.5" /> : <X className="h-2.5 w-2.5" />} AA (3.0:1)
                      </Badge>
                      <Badge variant={wcagLarge.aaa ? 'success' : 'destructive'} className="gap-0.5 text-[9px]">
                        {wcagLarge.aaa ? <Check className="h-2.5 w-2.5" /> : <X className="h-2.5 w-2.5" />} AAA (4.5:1)
                      </Badge>
                    </div>
                  </div>

                  {/* UI components */}
                  <div className="flex items-center justify-between py-1">
                    <span>UI Elements & Icons</span>
                    <Badge variant={wcagUi.aa ? 'success' : 'destructive'} className="gap-0.5 text-[9px]">
                      {wcagUi.aa ? <Check className="h-2.5 w-2.5" /> : <X className="h-2.5 w-2.5" />} AA (3.0:1)
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Live Interactive Preview */}
            <Card className="overflow-hidden">
              <div className="p-2 border-b bg-muted/40 flex items-center justify-between">
                <span className="text-xs font-bold text-muted-foreground uppercase">Live Rendering Preview</span>
              </div>
              <div
                className="p-6 transition-colors flex flex-col justify-center space-y-4 border-t h-48"
                style={{ backgroundColor: bgColor }}
              >
                <div>
                  <h3 className="text-xl font-bold font-sans" style={{ color: fgColor }}>
                    Large Headline Preview (Bold)
                  </h3>
                  <p className="text-sm font-sans mt-1" style={{ color: fgColor }}>
                    This is a preview of standard paragraph text. High contrast is vital to keep interfaces readable 
                    for all users, preventing eye strain and ensuring full accessibility.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </TabsContent>

      {/* --- HARMONIOUS PALETTE GENERATOR --- */}
      <TabsContent value="palette-gen" className="space-y-6 animate-fade-in">
        <Card className="border bg-card/65 backdrop-blur-sm shadow-xl p-5 border-primary/20 shadow-[0_0_30px_rgba(59,130,246,0.05)]">
          <CardContent className="p-0 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-3 border-b border-border/60">
              <div>
                <h3 className="font-extrabold text-sm flex items-center gap-2">
                  <Palette className="h-4.5 w-4.5 text-primary" />
                  Harmonious Palette Generator
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Lock colors you like and roll the rest. Press <kbd className="px-1.5 py-0.5 rounded bg-muted font-mono text-[10px] font-bold text-foreground">SPACEBAR</kbd> to generate!
                </p>
              </div>
              <Button onClick={generatePalette} size="sm" className="gap-1.5 text-xs font-bold">
                <RefreshCw className="h-3.5 w-3.5" />
                Generate Palette
              </Button>
            </div>

            {/* Grid display */}
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 pt-2">
              {palette.map((color, idx) => {
                // Determine text color based on background luminance
                const rgbVal = hexToRgb(color.hex);
                const isDark = rgbVal ? ((rgbVal.r * 299 + rgbVal.g * 587 + rgbVal.b * 114) / 1000) < 128 : false;
                const textColorClass = isDark ? 'text-white' : 'text-slate-900';

                return (
                  <div
                    key={idx}
                    className="h-36 sm:h-72 rounded-xl flex flex-col justify-between p-4 shadow-sm relative overflow-hidden transition-all duration-300 group hover:shadow-md border border-black/10 dark:border-white/10"
                    style={{ backgroundColor: color.hex }}
                  >
                    {/* Top actions */}
                    <div className="flex justify-between items-center opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg ${textColorClass}`}
                        onClick={() => toggleLockColor(idx)}
                      >
                        {color.locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`h-8 w-8 hover:bg-black/10 dark:hover:bg-white/10 rounded-lg ${textColorClass}`}
                        onClick={() => handleCopy(color.hex, `Color ${color.hex}`)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Color hex title at bottom */}
                    <div className="space-y-1">
                      <span className={`text-[10px] uppercase font-bold tracking-widest block opacity-70 ${textColorClass}`}>
                        {color.locked ? 'Locked' : 'Random'}
                      </span>
                      <button
                        onClick={() => handleCopy(color.hex, `Color ${color.hex}`)}
                        className={`font-mono text-base font-black tracking-wide uppercase focus:outline-none text-left select-all hover:underline decoration-2 ${textColorClass}`}
                      >
                        {color.hex}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
