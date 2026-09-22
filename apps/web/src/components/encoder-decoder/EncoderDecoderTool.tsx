'use client';

import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  RefreshCw,
  Sparkles,
  Lock,
  Key,
  Eye,
  EyeOff,
  Download,
  Upload,
  Layers,
  Wand2,
  Copy,
  Check,
  Play,
  Square,
  Sliders,
  ChevronDown,
  ChevronUp,
  Volume2,
  Trash2,
  Clipboard,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
  METHOD_DEFINITIONS,
  executeConversion,
  detectFormat,
  calculateShannonEntropy,
} from '@/lib/encoder-decoder';
import { CaesarMatrixModal } from './CaesarMatrixModal';
import { MultiAlgorithmGrid } from './MultiAlgorithmGrid';

// Quick Access Pill Formats (Most Popular)
const QUICK_FORMATS: { id: ConversionMethodId; label: string }[] = [
  { id: 'auto', label: '⚡ Auto-Detect' },
  { id: 'base64', label: 'Base64' },
  { id: 'url', label: 'URL' },
  { id: 'hex', label: 'Hex' },
  { id: 'binary', label: 'Binary' },
  { id: 'aes-256', label: 'AES-256' },
  { id: 'caesar', label: 'Caesar' },
  { id: 'morse', label: 'Morse' },
  { id: 'sha256', label: 'SHA-256' },
  { id: 'md5', label: 'MD5' },
];

// Interactive sample presets
const SAMPLE_PRESETS = [
  {
    name: 'Plaintext Greeting',
    value: 'Hello, World! Welcome to DevKits.',
    method: 'base64' as ConversionMethodId,
    isDecode: false,
  },
  {
    name: 'OpenSSL AES-256 Ciphertext',
    value: 'U2FsdGVkX1+vupppZksvRf5pq5g5XwbOSinKKjhoc3D+jKlhfXb1yJqQW/iTf+v4',
    method: 'aes-256' as ConversionMethodId,
    isDecode: true,
    passphrase: 'secret',
  },
  {
    name: 'Base64 String',
    value: 'RGV2S2l0cyBTYW5kYm94IC0gU2VjdXJlIEVuY29kZXIgJiBDcnlwdG8gU3VpdGUh',
    method: 'base64' as ConversionMethodId,
    isDecode: true,
  },
  {
    name: 'Morse Code',
    value: '.... . .-.. .-.. --- / .-- --- .-. .-.. -..',
    method: 'morse' as ConversionMethodId,
    isDecode: true,
  },
  {
    name: 'Hex Dump',
    value: '44 65 76 6B 69 74 73 2E 73 70 61 63 65',
    method: 'hex' as ConversionMethodId,
    isDecode: true,
  },
  {
    name: 'Caesar Cipher (Shift 7)',
    value: 'Olssv, Dvysk! Aopz pz jhlzhy jpwoly.',
    method: 'caesar' as ConversionMethodId,
    isDecode: true,
    shift: 7,
  },
  {
    name: 'URL Encoded Query',
    value: 'https%3A%2F%2Fdevkits.space%2Fencoder-decoder%3Fquery%3Dcrypto',
    method: 'url' as ConversionMethodId,
    isDecode: true,
  },
  {
    name: 'Binary Stream',
    value: '01001000 01100101 01101100 01101100 01101111',
    method: 'binary' as ConversionMethodId,
    isDecode: true,
  },
];

export function EncoderDecoderTool() {
  const [conversionType, setConversionType] = useState<ConversionMethodId>('base64');
  const [inputVal, setInputVal] = useState<string>('Hello, World!');
  const [isDecodeMode, setIsDecodeMode] = useState<boolean>(false);
  const [showCompareAll, setShowCompareAll] = useState<boolean>(false);

  // Dynamic Parameters (shown cleanly only when relevant)
  const [passphrase, setPassphrase] = useState<string>('secret');
  const [showPassphrase, setShowPassphrase] = useState<boolean>(false);
  const [caesarShift, setCaesarShift] = useState<number>(3);
  const [affineA, setAffineA] = useState<number>(5);
  const [affineB, setAffineB] = useState<number>(8);
  const [railCount, setRailCount] = useState<number>(3);
  const [cipherKey, setCipherKey] = useState<string>('SECRET');
  const [aesMode, setAesMode] = useState<'CBC' | 'CTR' | 'ECB' | 'CFB' | 'OFB'>('CBC');

  // Caesar Matrix Modal State
  const [isCaesarModalOpen, setIsCaesarModalOpen] = useState<boolean>(false);

  // Audio Playback State for Morse
  const [isMorsePlaying, setIsMorsePlaying] = useState<boolean>(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const morseStopRef = useRef<boolean>(false);

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
    }),
    [passphrase, caesarShift, affineA, affineB, railCount, cipherKey, aesMode]
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

  // Stop Morse sound
  const stopMorseAudio = useCallback(() => {
    morseStopRef.current = true;
    setIsMorsePlaying(false);
  }, []);

  // Play Morse sound
  const playMorseAudio = async () => {
    if (isMorsePlaying) {
      stopMorseAudio();
      return;
    }
    const textToPlay = isDecodeMode ? inputVal : outputVal;
    if (!textToPlay || !/^[.\-/_| ]+$/.test(textToPlay.trim())) {
      toast.error('No valid Morse code dots and dashes to play.');
      return;
    }

    setIsMorsePlaying(true);
    morseStopRef.current = false;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const dotDuration = 60; // 60ms per dot (~20 WPM)
      const freq = 650;

      for (let i = 0; i < textToPlay.length; i++) {
        if (morseStopRef.current) break;
        const char = textToPlay[i];

        if (char === '.' || char === '-') {
          const duration = char === '.' ? dotDuration : dotDuration * 3;
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, ctx.currentTime);

          gain.gain.setValueAtTime(0, ctx.currentTime);
          gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 0.005);
          gain.gain.setValueAtTime(0.15, ctx.currentTime + duration / 1000 - 0.005);
          gain.gain.linearRampToValueAtTime(0, ctx.currentTime + duration / 1000);

          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + duration / 1000);

          await new Promise((r) => setTimeout(r, duration + dotDuration));
        } else if (char === ' ') {
          await new Promise((r) => setTimeout(r, dotDuration * 2));
        } else if (char === '/' || char === '|') {
          await new Promise((r) => setTimeout(r, dotDuration * 6));
        }
      }
    } catch {
      // Ignored
    } finally {
      setIsMorsePlaying(false);
    }
  };

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
  const handleLoadPreset = (preset: (typeof SAMPLE_PRESETS)[0]) => {
    setInputVal(preset.value);
    setConversionType(preset.method);
    setIsDecodeMode(preset.isDecode);
    if (preset.passphrase) setPassphrase(preset.passphrase);
    if (preset.shift) setCaesarShift(preset.shift);
    toast.info(`Loaded: ${preset.name}`);
  };

  // Paste from clipboard
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setInputVal(text);
        toast.success('Pasted from clipboard');
      }
    } catch {
      toast.error('Unable to read clipboard.');
    }
  };

  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
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
          toast.success(`Loaded file: ${file.name}`);
        }
      };
      if (conversionType === 'base64' && file.type.startsWith('image/')) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    }
  };

  // Download result output
  const handleDownload = () => {
    if (!outputVal) return;
    const blob = new Blob([outputVal], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `result-${conversionType}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Downloaded output file');
  };

  // Requires passphrase / key check
  const requiresKey =
    currentMethodDef.requiresPassphrase ||
    conversionType.startsWith('aes-') ||
    conversionType === 'vigenere' ||
    conversionType === 'xor';

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* 1. Main Unified Control Toolbar */}
      <Card className="border shadow-sm bg-card/90">
        <CardContent className="p-3.5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Left: Algorithm Select & Mode Segmented Switch */}
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={conversionType}
                onValueChange={(val) => setConversionType(val as ConversionMethodId)}
              >
                <SelectTrigger className="w-56 h-8.5 text-xs font-semibold bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  <SelectItem value="auto" className="font-bold text-primary">
                    ⚡ Auto-Detect Format
                  </SelectItem>
                  <SelectGroup>
                    <SelectLabel className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                      Data Encodings
                    </SelectLabel>
                    <SelectItem value="base64">Base64 (RFC 4648)</SelectItem>
                    <SelectItem value="base64url">Base64URL</SelectItem>
                    <SelectItem value="base32">Base32</SelectItem>
                    <SelectItem value="base58">Base58 (Bitcoin)</SelectItem>
                    <SelectItem value="base85">Base85 / Ascii85</SelectItem>
                    <SelectItem value="z85">Z85 (ZeroMQ)</SelectItem>
                    <SelectItem value="hex">Hexadecimal (Base16)</SelectItem>
                    <SelectItem value="binary">Binary (Base2)</SelectItem>
                    <SelectItem value="octal">Octal (Base8)</SelectItem>
                    <SelectItem value="decimal">Decimal / Byte Array</SelectItem>
                    <SelectItem value="unicode">Unicode (\uXXXX)</SelectItem>
                    <SelectItem value="quoted-printable">Quoted-Printable</SelectItem>
                    <SelectItem value="uuencode">UUEncode</SelectItem>
                  </SelectGroup>

                  <SelectGroup>
                    <SelectLabel className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                      Web & Text
                    </SelectLabel>
                    <SelectItem value="url">URL / Percent-Encoding</SelectItem>
                    <SelectItem value="html">HTML Entities</SelectItem>
                    <SelectItem value="punycode">Punycode (IDNA Domains)</SelectItem>
                  </SelectGroup>

                  <SelectGroup>
                    <SelectLabel className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                      Symmetric Encryption (Key / Passphrase)
                    </SelectLabel>
                    <SelectItem value="aes-256">AES-256 (Passphrase)</SelectItem>
                    <SelectItem value="aes-192">AES-192</SelectItem>
                    <SelectItem value="aes-128">AES-128</SelectItem>
                    <SelectItem value="des">DES (56-bit)</SelectItem>
                    <SelectItem value="tripledes">Triple DES (3DES)</SelectItem>
                    <SelectItem value="rc4">RC4 (ARC4)</SelectItem>
                    <SelectItem value="rabbit">Rabbit Stream</SelectItem>
                    <SelectItem value="blowfish">Blowfish</SelectItem>
                    <SelectItem value="xor">XOR Cipher</SelectItem>
                  </SelectGroup>

                  <SelectGroup>
                    <SelectLabel className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                      Classical Ciphers
                    </SelectLabel>
                    <SelectItem value="caesar">Caesar Cipher</SelectItem>
                    <SelectItem value="rot13">ROT13</SelectItem>
                    <SelectItem value="rot5">ROT5 (Digits)</SelectItem>
                    <SelectItem value="rot18">ROT18</SelectItem>
                    <SelectItem value="rot47">ROT47</SelectItem>
                    <SelectItem value="atbash">Atbash Cipher</SelectItem>
                    <SelectItem value="vigenere">Vigenère (Passphrase)</SelectItem>
                    <SelectItem value="affine">Affine Cipher</SelectItem>
                    <SelectItem value="railfence">Rail Fence (Zig-Zag)</SelectItem>
                    <SelectItem value="bacon">Bacon&apos;s Cipher</SelectItem>
                    <SelectItem value="polybius">Polybius Square</SelectItem>
                    <SelectItem value="morse">Morse Code</SelectItem>
                    <SelectItem value="braille">Braille Code</SelectItem>
                    <SelectItem value="tapcode">Tap Code</SelectItem>
                    <SelectItem value="reverse">Reverse String</SelectItem>
                  </SelectGroup>

                  <SelectGroup>
                    <SelectLabel className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                      Hashes & Digests (One-Way)
                    </SelectLabel>
                    <SelectItem value="md5">MD5</SelectItem>
                    <SelectItem value="sha1">SHA-1</SelectItem>
                    <SelectItem value="sha256">SHA-256</SelectItem>
                    <SelectItem value="sha512">SHA-512</SelectItem>
                    <SelectItem value="sha3">SHA-3 (Keccak)</SelectItem>
                    <SelectItem value="ripemd160">RIPEMD-160</SelectItem>
                    <SelectItem value="crc32">CRC32 Checksum</SelectItem>
                    <SelectItem value="hmac-sha256">HMAC-SHA256</SelectItem>
                    <SelectItem value="hmac-sha512">HMAC-SHA512</SelectItem>
                    <SelectItem value="hmac-md5">HMAC-MD5</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>

              {/* Encode / Decode Segmented Switch */}
              {!currentMethodDef.isOneWay && conversionType !== 'auto' && (
                <div className="inline-flex rounded-md border p-0.5 bg-muted/40">
                  <Button
                    size="sm"
                    variant={!isDecodeMode ? 'default' : 'ghost'}
                    onClick={() => setIsDecodeMode(false)}
                    className="h-7 text-xs font-semibold px-3"
                  >
                    Encode
                  </Button>
                  <Button
                    size="sm"
                    variant={isDecodeMode ? 'default' : 'ghost'}
                    onClick={() => setIsDecodeMode(true)}
                    className="h-7 text-xs font-semibold px-3"
                  >
                    Decode
                  </Button>
                </div>
              )}
            </div>

            {/* Right: Presets & Compare All Button */}
            <div className="flex items-center gap-2">
              <Select
                onValueChange={(val) => {
                  const preset = SAMPLE_PRESETS.find((p) => p.name === val);
                  if (preset) handleLoadPreset(preset);
                }}
              >
                <SelectTrigger className="h-8 text-xs w-36 bg-background">
                  <SelectValue placeholder="Load Sample..." />
                </SelectTrigger>
                <SelectContent>
                  {SAMPLE_PRESETS.map((p) => (
                    <SelectItem key={p.name} value={p.name} className="text-xs">
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                size="sm"
                variant={showCompareAll ? 'default' : 'outline'}
                onClick={() => setShowCompareAll(!showCompareAll)}
                className="h-8 text-xs font-semibold gap-1"
              >
                <Layers className="h-3.5 w-3.5" />
                {showCompareAll ? 'Hide Comparison' : 'Compare All'}
              </Button>
            </div>
          </div>

          {/* Inline Algorithm Parameters (Clean, only appears when needed) */}
          {(requiresKey || conversionType === 'caesar' || conversionType === 'affine' || conversionType === 'railfence') && (
            <div className="flex flex-wrap items-center gap-3 pt-2.5 border-t text-xs">
              {/* Passphrase Input */}
              {requiresKey && (
                <div className="flex items-center gap-2">
                  <Label htmlFor="quick-pass" className="text-[11px] font-bold text-primary flex items-center gap-1 shrink-0">
                    <Key className="h-3.5 w-3.5" />
                    Passphrase / Secret Key:
                  </Label>
                  <div className="relative flex items-center">
                    <Input
                      id="quick-pass"
                      type={showPassphrase ? 'text' : 'password'}
                      placeholder="Enter key/passphrase..."
                      value={passphrase}
                      onChange={(e) => {
                        setPassphrase(e.target.value);
                        setCipherKey(e.target.value);
                      }}
                      className="w-48 h-7 text-xs font-mono pr-7 bg-background"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassphrase(!showPassphrase)}
                      className="absolute right-2 text-muted-foreground hover:text-foreground"
                    >
                      {showPassphrase ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                    </button>
                  </div>
                </div>
              )}

              {/* Caesar Shift Slider & Crack */}
              {conversionType === 'caesar' && (
                <div className="flex items-center gap-2">
                  <Label className="text-[11px] font-bold text-muted-foreground shrink-0">
                    Shift ({caesarShift}):
                  </Label>
                  <input
                    type="range"
                    min={1}
                    max={25}
                    value={caesarShift}
                    onChange={(e) => setCaesarShift(Number(e.target.value))}
                    className="w-24 h-1.5 accent-primary cursor-pointer"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsCaesarModalOpen(true)}
                    className="h-6.5 text-[11px] font-bold px-2 text-primary"
                  >
                    <Sparkles className="h-3 w-3 mr-1" />
                    Crack (View All 25)
                  </Button>
                </div>
              )}

              {/* Affine Keys */}
              {conversionType === 'affine' && (
                <div className="flex items-center gap-2">
                  <Label className="text-[11px] font-bold text-muted-foreground shrink-0">Key a:</Label>
                  <Select value={affineA.toString()} onValueChange={(v) => setAffineA(Number(v))}>
                    <SelectTrigger className="w-14 h-7 text-xs font-mono">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 3, 5, 7, 9, 11, 15, 17, 19, 21, 23, 25].map((n) => (
                        <SelectItem key={n} value={n.toString()}>
                          {n}
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
                    className="w-14 h-7 text-xs font-mono bg-background"
                  />
                </div>
              )}

              {/* Rail Fence */}
              {conversionType === 'railfence' && (
                <div className="flex items-center gap-2">
                  <Label className="text-[11px] font-bold text-muted-foreground shrink-0">
                    Rails ({railCount}):
                  </Label>
                  <input
                    type="range"
                    min={2}
                    max={20}
                    value={railCount}
                    onChange={(e) => setRailCount(Number(e.target.value))}
                    className="w-24 h-1.5 accent-primary cursor-pointer"
                  />
                </div>
              )}
            </div>
          )}

          {/* Quick-Access Pills Row */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] uppercase font-bold text-muted-foreground mr-1">Quick:</span>
            {QUICK_FORMATS.map((q) => {
              const isActive = conversionType === q.id;
              return (
                <button
                  key={q.id}
                  onClick={() => setConversionType(q.id)}
                  className={`text-[11px] px-2 py-0.5 rounded-full font-medium transition-all ${
                    isActive
                      ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                      : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  {q.label}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* 2. Side-by-Side Clean Editor Panels */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Left: Input Panel */}
        <Card className="border shadow-sm flex flex-col justify-between">
          <CardContent className="p-3.5 space-y-2.5 flex-1 flex flex-col">
            {/* Input Header with Smart Detection Chip */}
            <div className="flex items-center justify-between pb-1.5 border-b">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs">
                  {isDecodeMode ? 'Encoded / Ciphertext Input' : 'Raw Text Input'}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  ({stats?.inputChars || 0} chars)
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6.5 text-[11px] px-2 gap-1 text-muted-foreground hover:text-foreground"
                  onClick={handlePaste}
                  title="Paste from clipboard"
                >
                  <Clipboard className="h-3 w-3" />
                  Paste
                </Button>

                <label className="cursor-pointer inline-flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground h-6.5 px-2 rounded hover:bg-muted transition-colors">
                  <Upload className="h-3 w-3" />
                  File
                  <input type="file" className="hidden" onChange={handleFileUpload} />
                </label>

                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6.5 text-[11px] px-2 text-muted-foreground hover:text-destructive"
                  onClick={() => setInputVal('')}
                  disabled={!inputVal}
                  title="Clear input"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Smart Auto-Detection Indicator (Subtle & Helpful) */}
            {topDetection && inputVal.trim().length > 0 && conversionType !== topDetection.methodId && (
              <div className="flex items-center justify-between p-2 rounded-md bg-primary/5 border border-primary/20 text-[11px]">
                <span className="flex items-center gap-1.5 text-foreground font-medium">
                  <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                  Looks like <strong className="text-primary">{topDetection.name}</strong> ({topDetection.confidence}%)
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 text-[10px] font-bold px-2 text-primary border-primary/30 hover:bg-primary/10"
                  onClick={() => handleApplyDetection(topDetection)}
                >
                  {topDetection.suggestedAction === 'decode' ? 'Decode with this' : 'Switch'}
                </Button>
              </div>
            )}

            {/* Input Textarea */}
            <Textarea
              id="main-input"
              placeholder={
                isDecodeMode
                  ? 'Paste code or ciphertext to decode...'
                  : 'Type or paste plain text to convert...'
              }
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              className="flex-1 min-h-[320px] text-xs font-mono bg-background/50 leading-relaxed scrollbar-thin resize-y"
            />
          </CardContent>
        </Card>

        {/* Right: Output Panel */}
        <Card className="border shadow-sm flex flex-col justify-between">
          <CardContent className="p-3.5 space-y-2.5 flex-1 flex flex-col">
            {/* Output Header */}
            <div className="flex items-center justify-between pb-1.5 border-b">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs text-primary">
                  {isDecodeMode ? 'Decoded Text Output' : 'Encoded / Encrypted Result'}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  ({stats?.outputChars || 0} chars)
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1">
                {conversionType === 'morse' && (
                  <Button
                    size="sm"
                    variant={isMorsePlaying ? 'destructive' : 'outline'}
                    onClick={playMorseAudio}
                    className="h-6.5 text-[11px] font-bold px-2 gap-1 text-primary"
                  >
                    {isMorsePlaying ? (
                      <>
                        <Square className="h-3 w-3 fill-current" />
                        Stop
                      </>
                    ) : (
                      <>
                        <Play className="h-3 w-3 fill-current" />
                        Play Sound
                      </>
                    )}
                  </Button>
                )}

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
                      className="h-6.5 w-6.5"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Swap Input and Output</TooltipContent>
                </Tooltip>

                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6.5 text-[11px] px-2 gap-1 text-muted-foreground hover:text-foreground"
                  onClick={handleDownload}
                  disabled={!outputVal}
                >
                  <Download className="h-3 w-3" />
                  Save
                </Button>

                <CopyButton
                  value={outputVal}
                  disabled={!outputVal}
                  toastMessage="Result copied!"
                  tooltip="Copy to clipboard"
                  iconClassName="h-3.5 w-3.5"
                />
              </div>
            </div>

            {/* Output Textarea */}
            <Textarea
              id="main-output"
              readOnly
              placeholder="Conversion result will appear here in real-time..."
              value={outputVal}
              className={`flex-1 min-h-[320px] text-xs font-mono leading-relaxed scrollbar-thin resize-y focus-visible:ring-0 ${
                conversionResult.error
                  ? 'bg-destructive/5 text-destructive border-destructive/30'
                  : 'bg-muted/30 text-foreground'
              }`}
            />
          </CardContent>
        </Card>
      </div>

      {/* 3. Live Multi-Algorithm Comparison Grid (Collapsible) */}
      {showCompareAll && (
        <div className="pt-2 animate-in fade-in-50">
          <MultiAlgorithmGrid
            inputText={inputVal}
            isDecode={isDecodeMode}
            options={options}
            onSelectMethod={(methodId) => {
              setConversionType(methodId);
              setShowCompareAll(false);
              toast.success(`Switched to ${methodId}`);
            }}
          />
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
