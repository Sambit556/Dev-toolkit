'use client';

import React, { useState, useMemo, useCallback } from 'react';
import {
  RefreshCw,
  ArrowLeftRight,
  Sparkles,
  Lock,
  Key,
  Eye,
  EyeOff,
  Sliders,
  Download,
  Upload,
  Layers,
  Wand2,
  FileText,
  HelpCircle,
  Hash,
  Shield,
  Activity,
  Check,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from '@/components/ui/select';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import { CopyButton } from '@/components/ui/copy-button';
import {
  ConversionMethodId,
  ConversionOptions,
  MethodCategory,
  METHOD_DEFINITIONS,
  executeConversion,
  detectFormat,
  calculateShannonEntropy,
} from '@/lib/encoder-decoder';
import { CaesarMatrixModal } from './CaesarMatrixModal';
import { MorseAudioPlayer } from './MorseAudioPlayer';
import { MultiAlgorithmGrid } from './MultiAlgorithmGrid';

// Presets for quick testing
const TEST_PRESETS = [
  {
    name: 'Plaintext Greeting',
    value: 'Hello, World! Welcome to the Universal Encoder / Decoder & Encryption Suite.',
    method: 'base64',
    isDecode: false,
  },
  {
    name: 'OpenSSL AES-256 Ciphertext (Passphrase: "secret")',
    value: 'U2FsdGVkX1+vupppZksvRf5pq5g5XwbOSinKKjhoc3D+jKlhfXb1yJqQW/iTf+v4',
    method: 'aes-256',
    isDecode: true,
    passphrase: 'secret',
  },
  {
    name: 'Base64 Encoded String',
    value: 'RGV2S2l0cyBTYW5kYm94IC0gU2VjdXJlIEVuY29kZXIgJiBDcnlwdG8gU3VpdGUh',
    method: 'base64',
    isDecode: true,
  },
  {
    name: 'Morse Code Message',
    value: '.... . .-.. .-.. --- / .-- --- .-. .-.. -..',
    method: 'morse',
    isDecode: true,
  },
  {
    name: 'Hexadecimal Dump',
    value: '44 65 76 6B 69 74 73 2E 73 70 61 63 65',
    method: 'hex',
    isDecode: true,
  },
  {
    name: 'Caesar Cipher (Shift 7)',
    value: 'Olssv, Dvysk! Aopz pz jhlzhy jpwoly.',
    method: 'caesar',
    isDecode: true,
    shift: 7,
  },
  {
    name: 'URL Encoded Query',
    value: 'https%3A%2F%2Fdevkits.space%2Fencoder-decoder%3Fquery%3Dcrypto%26mode%3Dauto',
    method: 'url',
    isDecode: true,
  },
  {
    name: 'Binary Stream',
    value: '01001000 01100101 01101100 01101100 01101111',
    method: 'binary',
    isDecode: true,
  },
];

export function EncoderDecoderTool() {
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [conversionType, setConversionType] = useState<ConversionMethodId>('base64');
  const [inputVal, setInputVal] = useState<string>('Hello, World!');
  const [isDecodeMode, setIsDecodeMode] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'single' | 'grid'>('single');

  // Algorithm Parameters
  const [passphrase, setPassphrase] = useState<string>('secret');
  const [showPassphrase, setShowPassphrase] = useState<boolean>(false);
  const [caesarShift, setCaesarShift] = useState<number>(3);
  const [affineA, setAffineA] = useState<number>(5);
  const [affineB, setAffineB] = useState<number>(8);
  const [railCount, setRailCount] = useState<number>(3);
  const [cipherKey, setCipherKey] = useState<string>('SECRET');
  const [aesMode, setAesMode] = useState<'CBC' | 'CTR' | 'ECB' | 'CFB' | 'OFB'>('CBC');
  const [hexDelimiter, setHexDelimiter] = useState<'space' | 'none' | 'colon' | 'prefix-0x' | 'escaped'>('space');

  // Caesar Matrix Modal State
  const [isCaesarModalOpen, setIsCaesarModalOpen] = useState<boolean>(false);

  // Conversion Options bundle
  const options: ConversionOptions = useMemo(
    () => ({
      passphrase,
      caesarShift,
      affineA,
      affineB,
      railCount,
      cipherKey,
      aesMode,
      hexDelimiter,
    }),
    [passphrase, caesarShift, affineA, affineB, railCount, cipherKey, aesMode, hexDelimiter]
  );

  // Current method definition
  const currentMethodDef = useMemo(() => {
    return METHOD_DEFINITIONS.find((m) => m.id === conversionType) || METHOD_DEFINITIONS[0];
  }, [conversionType]);

  // Real-time Auto-Detection analysis
  const detections = useMemo(() => {
    return detectFormat(inputVal);
  }, [inputVal]);

  const topDetection = detections.length > 0 ? detections[0] : null;

  // Execute Conversion
  const conversionResult = useMemo(() => {
    return executeConversion(inputVal, conversionType, isDecodeMode, options);
  }, [inputVal, conversionType, isDecodeMode, options]);

  const outputVal = conversionResult.output;
  const stats = conversionResult.stats;

  // Filtered methods for dropdown based on active category
  const filteredMethods = useMemo(() => {
    if (activeCategory === 'all') return METHOD_DEFINITIONS;
    if (activeCategory === 'try-all') return METHOD_DEFINITIONS;
    return METHOD_DEFINITIONS.filter((m) => m.category === activeCategory);
  }, [activeCategory]);

  // Apply auto-detected method
  const handleApplyDetection = (det: typeof topDetection) => {
    if (!det) return;
    setConversionType(det.methodId);
    setIsDecodeMode(det.suggestedAction === 'decode');
    if (det.detectedParams?.caesarShift) {
      setCaesarShift(det.detectedParams.caesarShift);
    }
    toast.success(`Switched to ${det.name}`);
  };

  // Load preset sample
  const handleLoadPreset = (preset: (typeof TEST_PRESETS)[0]) => {
    setInputVal(preset.value);
    setConversionType(preset.method as ConversionMethodId);
    setIsDecodeMode(preset.isDecode);
    if (preset.passphrase) setPassphrase(preset.passphrase);
    if (preset.shift) setCaesarShift(preset.shift);
    toast.info(`Loaded preset: ${preset.name}`);
  };

  // Drag and drop file handling
  const handleFileDrop = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      readFile(file);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      readFile(file);
    }
  };

  const readFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        if (conversionType === 'base64') {
          const rawB64 = reader.result.split(',')[1] || reader.result;
          setInputVal(rawB64);
          setIsDecodeMode(true);
        } else {
          setInputVal(reader.result);
        }
        toast.success(`Loaded file: ${file.name} (${file.size} bytes)`);
      }
    };
    if (conversionType === 'base64' && file.type.startsWith('image/')) {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
  };

  // Download result output as file
  const handleDownload = () => {
    if (!outputVal) return;
    const blob = new Blob([outputVal], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `converted-${conversionType}-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Downloaded result file');
  };

  // Entropy color and label
  const entropyInfo = useMemo(() => {
    const ent = stats?.entropy || 0;
    if (ent > 7.2) {
      return {
        label: 'High Entropy (Encrypted / Compressed)',
        badgeColor: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30',
      };
    } else if (ent > 4.5) {
      return {
        label: 'Medium Entropy (Code / Rich Text)',
        badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30',
      };
    } else {
      return {
        label: 'Low Entropy (Plain Natural Text)',
        badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      };
    }
  }, [stats?.entropy]);

  return (
    <div className="space-y-6">
      {/* Top Header Controls: Category Tabs & View Switch */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Category Filter Tabs */}
        <div className="overflow-x-auto pb-1 scrollbar-none">
          <Tabs
            value={viewMode === 'grid' ? 'try-all' : activeCategory}
            onValueChange={(val) => {
              if (val === 'try-all') {
                setViewMode('grid');
              } else {
                setViewMode('single');
                setActiveCategory(val);
                if (val === 'auto') {
                  setConversionType('auto');
                }
              }
            }}
            className="w-auto"
          >
            <TabsList className="h-9 p-1 bg-muted/60">
              <TabsTrigger value="all" className="text-xs px-2.5">
                All
              </TabsTrigger>
              <TabsTrigger value="auto" className="text-xs px-2.5 gap-1 font-semibold text-primary">
                <Sparkles className="h-3 w-3" />
                Auto-Detect
              </TabsTrigger>
              <TabsTrigger value="encoding" className="text-xs px-2.5">
                🔤 Encodings
              </TabsTrigger>
              <TabsTrigger value="ciphers" className="text-xs px-2.5">
                🗝️ Ciphers
              </TabsTrigger>
              <TabsTrigger value="encryption" className="text-xs px-2.5">
                🔒 Encryption
              </TabsTrigger>
              <TabsTrigger value="web" className="text-xs px-2.5">
                🌐 Web
              </TabsTrigger>
              <TabsTrigger value="hashes" className="text-xs px-2.5">
                🛡️ Hashes
              </TabsTrigger>
              <TabsTrigger value="try-all" className="text-xs px-2.5 font-bold gap-1 text-primary">
                <Layers className="h-3 w-3" />
                Try / Compare All
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Presets Selector & Actions */}
        <div className="flex items-center gap-2">
          <Select onValueChange={(val) => {
            const preset = TEST_PRESETS.find((p) => p.name === val);
            if (preset) handleLoadPreset(preset);
          }}>
            <SelectTrigger className="h-8 text-xs w-48">
              <Sparkles className="h-3.5 w-3.5 text-primary mr-1 shrink-0" />
              <SelectValue placeholder="Load Sample Preset..." />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel className="text-[11px] font-bold">Interactive Test Presets</SelectLabel>
                {TEST_PRESETS.map((p) => (
                  <SelectItem key={p.name} value={p.name} className="text-xs font-mono">
                    {p.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>

          <Button
            size="sm"
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            onClick={() => setViewMode(viewMode === 'grid' ? 'single' : 'grid')}
            className="h-8 text-xs font-bold gap-1.5"
          >
            <Layers className="h-3.5 w-3.5" />
            {viewMode === 'grid' ? 'Single View' : 'Compare All'}
          </Button>
        </div>
      </div>

      {/* Auto-Detection Banner */}
      {topDetection && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border-primary/20 shadow-sm transition-all animate-in fade-in-50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/20 text-primary">
              <Wand2 className="h-4 w-4 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-foreground">
                  Detected: <span className="text-primary">{topDetection.name}</span>
                </span>
                <Badge variant="outline" className="text-[10px] h-4.5 px-1.5 font-bold border-primary/30 text-primary">
                  {topDetection.confidence}% Match
                </Badge>
                {topDetection.requiresPassphrase && (
                  <Badge variant="destructive" className="text-[10px] h-4.5 px-1.5 gap-1">
                    <Lock className="h-2.5 w-2.5" />
                    Passphrase Required
                  </Badge>
                )}
              </div>
              <p className="text-[11px] text-muted-foreground">{topDetection.reason}</p>
            </div>
          </div>

          <Button
            size="sm"
            variant="default"
            onClick={() => handleApplyDetection(topDetection)}
            className="h-7 text-xs font-bold gap-1"
          >
            <Check className="h-3.5 w-3.5" />
            Use Detected Algorithm
          </Button>
        </div>
      )}

      {/* Dynamic Parameters & Options Panel */}
      <Card className="bg-card/90 shadow-sm border-border/80">
        <CardContent className="p-3.5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Algorithm Dropdown */}
            <div className="flex items-center gap-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider shrink-0">
                Algorithm:
              </Label>
              <Select
                value={conversionType}
                onValueChange={(val) => setConversionType(val as ConversionMethodId)}
              >
                <SelectTrigger className="w-64 h-8 text-xs font-semibold">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  {['auto', 'encoding', 'ciphers', 'encryption', 'web', 'hashes'].map((cat) => {
                    const methodsInCat = filteredMethods.filter((m) => m.category === cat);
                    if (methodsInCat.length === 0) return null;
                    const catLabel =
                      cat === 'auto'
                        ? '⚡ Auto-Detection'
                        : cat === 'encoding'
                        ? '🔤 Data Encodings'
                        : cat === 'ciphers'
                        ? '🗝️ Classical Ciphers'
                        : cat === 'encryption'
                        ? '🔒 Symmetric Encryption (Passphrase)'
                        : cat === 'web'
                        ? '🌐 Web & Formatting'
                        : '🛡️ Hashes & HMACs';

                    return (
                      <SelectGroup key={cat}>
                        <SelectLabel className="text-[11px] font-bold text-muted-foreground">
                          {catLabel}
                        </SelectLabel>
                        {methodsInCat.map((m) => (
                          <SelectItem key={m.id} value={m.id} className="text-xs">
                            <span className="flex items-center gap-1.5">
                              {m.requiresPassphrase && <Lock className="h-3 w-3 text-amber-500" />}
                              {m.name}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    );
                  })}
                </SelectContent>
              </Select>

              {/* Encode/Decode Toggle */}
              {!currentMethodDef.isOneWay && conversionType !== 'auto' && (
                <div className="flex items-center gap-1 ml-1">
                  <Button
                    size="sm"
                    variant={!isDecodeMode ? 'default' : 'outline'}
                    onClick={() => setIsDecodeMode(false)}
                    className="h-8 text-xs font-bold px-3"
                  >
                    Encode
                  </Button>
                  <Button
                    size="sm"
                    variant={isDecodeMode ? 'default' : 'outline'}
                    onClick={() => setIsDecodeMode(true)}
                    className="h-8 text-xs font-bold px-3"
                  >
                    Decode
                  </Button>
                </div>
              )}
            </div>

            {/* Method Description */}
            <p className="text-xs text-muted-foreground italic hidden lg:block max-w-sm text-right">
              {currentMethodDef.description}
            </p>
          </div>

          {/* Conditional Algorithm Parameters (Passphrase, Shift, Rails, etc.) */}
          <div className="flex flex-wrap items-center gap-4 pt-2 border-t text-xs">
            {/* Passphrase / Secret Key */}
            {(currentMethodDef.requiresPassphrase || conversionType.startsWith('aes-') || conversionType === 'vigenere' || conversionType === 'xor') && (
              <div className="flex items-center gap-2">
                <Label htmlFor="param-pass" className="text-[11px] font-bold flex items-center gap-1 text-primary shrink-0">
                  <Key className="h-3.5 w-3.5" />
                  Passphrase / Key:
                </Label>
                <div className="relative flex items-center">
                  <Input
                    id="param-pass"
                    type={showPassphrase ? 'text' : 'password'}
                    placeholder="Enter secret passphrase..."
                    value={passphrase}
                    onChange={(e) => {
                      setPassphrase(e.target.value);
                      setCipherKey(e.target.value);
                    }}
                    className="w-48 h-7.5 text-xs font-mono pr-7"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassphrase(!showPassphrase)}
                    className="absolute right-2 text-muted-foreground hover:text-foreground"
                    title={showPassphrase ? 'Hide passphrase' : 'Show passphrase'}
                  >
                    {showPassphrase ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>
            )}

            {/* AES Mode */}
            {conversionType.startsWith('aes-') && (
              <div className="flex items-center gap-2">
                <Label className="text-[11px] font-bold text-muted-foreground shrink-0">Mode:</Label>
                <Select value={aesMode} onValueChange={(v: any) => setAesMode(v)}>
                  <SelectTrigger className="w-24 h-7.5 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CBC">CBC</SelectItem>
                    <SelectItem value="CTR">CTR</SelectItem>
                    <SelectItem value="ECB">ECB</SelectItem>
                    <SelectItem value="CFB">CFB</SelectItem>
                    <SelectItem value="OFB">OFB</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Caesar Shift & Matrix */}
            {conversionType === 'caesar' && (
              <div className="flex items-center gap-2">
                <Label className="text-[11px] font-bold text-muted-foreground shrink-0">
                  Shift: {caesarShift}
                </Label>
                <Slider
                  value={[caesarShift]}
                  min={1}
                  max={25}
                  step={1}
                  onValueChange={(val: number[]) => setCaesarShift(val[0])}
                  className="w-24"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsCaesarModalOpen(true)}
                  className="h-7 text-xs font-bold gap-1 text-primary hover:bg-primary/10"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Crack / View 25 Shifts
                </Button>
              </div>
            )}

            {/* Affine Cipher Parameters */}
            {conversionType === 'affine' && (
              <div className="flex items-center gap-2">
                <Label className="text-[11px] font-bold text-muted-foreground shrink-0">Key a:</Label>
                <Select value={affineA.toString()} onValueChange={(v) => setAffineA(Number(v))}>
                  <SelectTrigger className="w-16 h-7.5 text-xs font-mono font-bold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 3, 5, 7, 9, 11, 15, 17, 19, 21, 23, 25].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Label className="text-[11px] font-bold text-muted-foreground shrink-0 ml-1">Key b:</Label>
                <Input
                  type="number"
                  min="0"
                  max="25"
                  value={affineB}
                  onChange={(e) => setAffineB(Number(e.target.value))}
                  className="w-16 h-7.5 text-xs font-mono font-bold"
                />
              </div>
            )}

            {/* Rail Fence Rails */}
            {conversionType === 'railfence' && (
              <div className="flex items-center gap-2">
                <Label className="text-[11px] font-bold text-muted-foreground shrink-0">
                  Rails: {railCount}
                </Label>
                <Slider
                  value={[railCount]}
                  min={2}
                  max={20}
                  step={1}
                  onValueChange={(val: number[]) => setRailCount(val[0])}
                  className="w-24"
                />
              </div>
            )}

            {/* Hex Delimiter */}
            {conversionType === 'hex' && !isDecodeMode && (
              <div className="flex items-center gap-2">
                <Label className="text-[11px] font-bold text-muted-foreground shrink-0">Format:</Label>
                <Select value={hexDelimiter} onValueChange={(v: any) => setHexDelimiter(v)}>
                  <SelectTrigger className="w-32 h-7.5 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="space">Space (48 65 6C)</SelectItem>
                    <SelectItem value="none">Continuous (48656C)</SelectItem>
                    <SelectItem value="colon">Colon (48:65:6C)</SelectItem>
                    <SelectItem value="prefix-0x">0x Prefix (0x48 0x65)</SelectItem>
                    <SelectItem value="escaped">\x Escaped (\x48\x65)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Morse Audio Player when Morse Code is active */}
      {conversionType === 'morse' && (
        <MorseAudioPlayer morseText={isDecodeMode ? inputVal : outputVal} />
      )}

      {/* Main Content Area: Single View or Multi-Algorithm Grid */}
      {viewMode === 'grid' ? (
        <MultiAlgorithmGrid
          inputText={inputVal}
          isDecode={isDecodeMode}
          options={options}
          onSelectMethod={(methodId) => {
            setConversionType(methodId);
            setViewMode('single');
          }}
        />
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Input Panel */}
          <Card className="border-border/80 shadow-sm flex flex-col justify-between">
            <CardContent className="p-4 space-y-3 flex-1 flex flex-col">
              <div className="flex items-center justify-between border-b pb-2">
                <Label htmlFor="raw-input" className="font-bold text-xs flex items-center gap-1.5">
                  <FileText className="h-3.5 w-3.5 text-primary" />
                  {isDecodeMode ? 'Encoded / Ciphertext Input' : 'Raw Text Input'}
                </Label>

                <div className="flex items-center gap-2">
                  <label className="cursor-pointer inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground font-medium px-2 py-1 rounded border bg-muted/30">
                    <Upload className="h-3 w-3" />
                    Browse File
                    <input type="file" className="hidden" onChange={handleFileUpload} />
                  </label>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 text-[11px] px-2"
                    onClick={() => setInputVal('')}
                    disabled={!inputVal}
                  >
                    Clear
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5 flex-1 flex flex-col">
                <Textarea
                  id="raw-input"
                  placeholder={
                    isDecodeMode
                      ? 'Paste encoded text or encrypted ciphertext to decode...'
                      : 'Type or paste plain text to encode / encrypt...'
                  }
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFileDrop}
                  className="flex-1 min-h-[300px] text-xs font-mono bg-background/50 leading-relaxed scrollbar-thin resize-y"
                />
                
                {/* Input Stats Bar */}
                <div className="flex flex-wrap items-center justify-between text-[10px] text-muted-foreground pt-1 px-1">
                  <div className="flex items-center gap-3">
                    <span>Lines: {stats?.inputLines || 0}</span>
                    <span>Length: {stats?.inputChars || 0} chars</span>
                    <span>Size: {stats?.inputBytes || 0} bytes</span>
                  </div>
                  <Badge variant="outline" className={`text-[9px] h-4.5 px-1.5 ${entropyInfo.badgeColor}`}>
                    <Activity className="h-2.5 w-2.5 mr-1" />
                    Entropy: {stats?.entropy || 0} ({entropyInfo.label.split(' ')[0]})
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Output Panel */}
          <Card className="border-border/80 shadow-sm flex flex-col justify-between">
            <CardContent className="p-4 space-y-3 flex-1 flex flex-col">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="font-bold text-xs flex items-center gap-1.5 text-primary">
                  <ArrowLeftRight className="h-3.5 w-3.5" />
                  {isDecodeMode ? 'Decoded Text Output' : 'Encoded / Encrypted Output'}
                </span>

                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs font-bold gap-1"
                    onClick={handleDownload}
                    disabled={!outputVal}
                  >
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </Button>
                  <CopyButton
                    value={outputVal}
                    disabled={!outputVal}
                    toastMessage="Result copied to clipboard!"
                    tooltip="Copy result string"
                    iconClassName="h-3.5 w-3.5"
                  />
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        onClick={() => {
                          setInputVal(outputVal);
                          setIsDecodeMode(!isDecodeMode);
                        }}
                        disabled={!outputVal}
                        className="h-7 w-7"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Swap Input and Output</TooltipContent>
                  </Tooltip>
                </div>
              </div>

              <div className="space-y-1.5 flex-1 flex flex-col">
                <Textarea
                  id="conv-output"
                  readOnly
                  placeholder="Processed conversion result will render here..."
                  value={outputVal}
                  className={`flex-1 min-h-[300px] text-xs font-mono leading-relaxed scrollbar-thin resize-y focus-visible:ring-0 ${
                    conversionResult.error
                      ? 'bg-destructive/10 text-destructive border-destructive/30'
                      : 'bg-muted/30 text-foreground'
                  }`}
                />

                {/* Output Stats Bar */}
                <div className="flex items-center justify-between text-[10px] text-muted-foreground pt-1 px-1">
                  <div className="flex items-center gap-3">
                    <span>Lines: {stats?.outputLines || 0}</span>
                    <span>Length: {stats?.outputChars || 0} chars</span>
                    <span>Size: {stats?.outputBytes || 0} bytes</span>
                  </div>
                  {conversionResult.error && (
                    <span className="text-destructive font-semibold">
                      Conversion Error
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Caesar Matrix Modal */}
      <CaesarMatrixModal
        isOpen={isCaesarModalOpen}
        onClose={() => setIsCaesarModalOpen(false)}
        inputText={inputVal}
        onSelectShift={(shift) => {
          setCaesarShift(shift);
          setConversionType('caesar');
          setIsDecodeMode(true);
        }}
      />
    </div>
  );
}
