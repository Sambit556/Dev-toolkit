'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import {
  Lock,
  Unlock,
  Key,
  Eye,
  EyeOff,
  Download,
  Upload,
  Layers,
  Copy,
  Check,
  Play,
  Square,
  Sparkles,
  Trash2,
  Clipboard,
  ShieldCheck,
  KeyRound,
  FileKey,
  Loader2,
  ArrowRightLeft,
  Zap,
  AlertCircle,
  Dices,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { CopyButton } from '@/components/ui/copy-button';
import {
  ConversionMethodId,
  ConversionOptions,
  METHOD_DEFINITIONS,
  executeConversion,
  detectFormat,
  generateRsaKeyPair,
  getPublicKeyFromPrivateKey,
  parseRsaPublicKey,
  parseRsaPrivateKey,
} from '@/lib/encoder-decoder';
import { CaesarMatrixModal } from './CaesarMatrixModal';
import { MultiAlgorithmGrid } from './MultiAlgorithmGrid';

// Default RSA 2048-bit Demo Keypair
const DEFAULT_RSA_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAsH3qeMDUIwSi1RUAdYvj
gxHdeanScv+xcxK/f4t06kgZO1q9ACcp/z8REv3Q1ZoqW2CN+gqVgjZaq3kLpM/C
MJLADN8UZj5wZSWmuqC9ISb7MLoqATCzq91ZHnDi+tEmAEPoE4u0RyW0z6mx63M7
njWF5mSqjevkPapePQtrRQl3qsE9g9BZkVFD+FHtMrgxsh0iwGxCMlUkxef9qjyk
dWXiVTIrqHVm8iBnb2TV6k+rPLsHRDIqOTOY63U3CEjUT2kNtbwOR3C154mISdG2
B1z7gnVOUNW7PIGtYnMIM2XTzgf2iIP61YLkmLpC/eSzDrAODLD+JkoRI4waEPRf
XwIDAQAB
-----END PUBLIC KEY-----`;

const DEFAULT_RSA_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQCwfep4wNQjBKLV
FQB1i+ODEd15qdJy/7FzEr9/i3TqSBk7Wr0AJyn/PxES/dDVmipbYI36CpWCNlqr
eQukz8IwksAM3xRmPnBlJaa6oL0hJvswuioBMLOr3VkecOL60SYAQ+gTi7RHJbTP
qbHrczueNYXmZKqN6+Q9ql49C2tFCXeqwT2D0FmRUUP4Ue0yuDGyHSLAbEIyVSTF
5/2qPKR1ZeJVMiuodWbyIGdvZNXqT6s8uwdEMio5M5jrdTcISNRPaQ21vA5HcLXn
iYhJ0bYHXPuCdU5Q1bs8ga1icwgzZdPOB/aIg/rVguSYukL95LMOsA4MsP4mShEj
jBoQ9F9fAgMBAAECggEBAKa3WsyUQg+OKo6j1xoyeUhvkMmDXJNa63GrDQ/bWSaR
0pvZu90wIaDGH0fUUPflOAu3KoY+hzpIQ9/kaNZXlrUxeo7uDyQB6UPyjAuRGPb/
DprZ0CHtslsvrSZvNkn9VSs8+jW0aygl+yWKw9GIuZFaN9EJ2H5VjPWfQIPjjIHZ
u8XDVTrNgWKn7HZIq2K8bpCiionKw+8DO82N7M8zVSsCrpEM/cCkeWbwhrSC65Q8
QKKWHQa0QFg3rAgR7S7FZu49/IqtVYz6zrhnxKh1u8NQlHL4imamskQPGYN8DwP0
ZI81Cu6QevisfEtLYYGuXB7a6JP1bGl+UYDry57exRkCgYEA5guvkOQa+YGpxyTv
tfNYZ3fUqq+f4noWJl2XFuVlhvzBoHTLaItlUCKs5n3Q0NI+bzYJyzeYgvJUY83h
GelLUAS+o4sCTqSAAqx8pZKlnAy+ixv+ZmjQ1m2e8m6bDt7XS45RWwM6JGmZgkqd
bpBsYCOnmSs7/hnZM9GN0yHo5vMCgYEAxGd1PQej9PQpdBMfpe35C26JFNKeo6u6
X5g7a+kaAVJAL7c5fYxIf2axjepuD+xty0JKVcEtL54kT3Q0Ikdo6PlEn2azDG4+
UuhijQY0CTw299saW5fGRBfe/VqMUVg2+pkaKaeJ88KoonbWdyg53smTIUAQHH/V
8jw9nk3tGOUCgYEA3lZbCDG+9Hliiwvi9rtMLSx/Cb0WTYDr2YbJGaL6/n1Z8ugP
FGrtr4bkDx147erV1wymaJfCOoVWFOQN9MorNRpw2oXm4/VPl8X37tsOXwVeP/r9
ZSNW/HgUkIFgMf4knWzeqpUy47CAYpIVGKBTbpPnTz2fDRcUe2XEqlPy0wsCgYEA
jjNB5RAVG5N0OABol6C3Ahnj0lm0VlhNtkzoKPc6xt4gbuvACjB5hRR7VX74dTr/
O30hiPk2mBVtwMEnxfHh+VwQ3UBkPonLQgfS4rwtDMq2GbpfWRWIjWCjKNhYY8T0
+XfEQ4h0DzNPGWHlYZyUWcOkbRyPDbNY2evXyTguhCkCgYBLYpmaEbyRgr+hDhm7
H2bIsWHWys0X/xQk/4Md7FEg6o2noyhxfXDjfdElfHfKd1/vtVW7OyxF1nPEzTlo
NP6LzyDSWiQBXk1+rNyluUWCPsy6S3pRVb8nXnf5no9HkaMdqer4TVKfZ1zIjnte
PHUn2et0liFEW54Y6HNSY/TalA==
-----END PRIVATE KEY-----`;

// Quick Access Formats
const QUICK_FORMATS: { id: ConversionMethodId; label: string }[] = [
  { id: 'auto', label: '⚡ Auto-Detect' },
  { id: 'base64', label: 'Base64' },
  { id: 'rsa', label: '🔐 RSA Public-Key' },
  { id: 'aes-256', label: '🔑 AES-256' },
  { id: 'url', label: 'URL' },
  { id: 'hex', label: 'Hex' },
  { id: 'binary', label: 'Binary' },
  { id: 'caesar', label: 'Caesar' },
  { id: 'morse', label: 'Morse' },
  { id: 'sha256', label: 'SHA-256' },
  { id: 'md5', label: 'MD5' },
];

// Interactive sample presets with descriptions
const SAMPLE_PRESETS = [
  {
    name: 'Plaintext Greeting',
    desc: 'Encode plain text to Base64 / Hex',
    value: 'Hello, World! Welcome to DevKits.',
    method: 'base64' as ConversionMethodId,
    isDecode: false,
  },
  {
    name: 'RSA 2048-bit Public Key Encryption',
    desc: 'Encrypt with Public Key using RSA-OAEP',
    value: 'Confidential message protected with 2048-bit RSA-OAEP asymmetric encryption.',
    method: 'rsa' as ConversionMethodId,
    isDecode: false,
    rsaPublicKey: DEFAULT_RSA_PUBLIC_KEY,
    rsaPrivateKey: DEFAULT_RSA_PRIVATE_KEY,
  },
  {
    name: 'OpenSSL AES-256 Ciphertext',
    desc: 'Decrypt AES ciphertext with passphrase "secret"',
    value: 'U2FsdGVkX1+vupppZksvRf5pq5g5XwbOSinKKjhoc3D+jKlhfXb1yJqQW/iTf+v4',
    method: 'aes-256' as ConversionMethodId,
    isDecode: true,
    passphrase: 'secret',
  },
  {
    name: 'Base64 Encoded Text',
    desc: 'Decode Base64 string to plaintext',
    value: 'RGV2S2l0cyBTYW5kYm94IC0gU2VjdXJlIEVuY29kZXIgJiBDcnlwdG8gU3VpdGUh',
    method: 'base64' as ConversionMethodId,
    isDecode: true,
  },
  {
    name: 'Morse Code Message',
    desc: 'Decode Morse code to text with audio playback',
    value: '.... . .-.. .-.. --- / .-- --- .-. .-.. -..',
    method: 'morse' as ConversionMethodId,
    isDecode: true,
  },
  {
    name: 'Hexadecimal Bytes',
    desc: 'Decode hex byte sequence to string',
    value: '44 65 76 6B 69 74 73 2E 73 70 61 63 65',
    method: 'hex' as ConversionMethodId,
    isDecode: true,
  },
  {
    name: 'Caesar Cipher (Shift 7)',
    desc: 'Decode shifted Caesar ciphertext',
    value: 'Olssv, Dvysk! Aopz pz jhlzhy jpwoly.',
    method: 'caesar' as ConversionMethodId,
    isDecode: true,
    shift: 7,
  },
  {
    name: 'URL Encoded Query',
    desc: 'Decode percent-encoded URL',
    value: 'https%3A%2F%2Fdevkits.space%2Fencoder-decoder%3Fquery%3Dcrypto',
    method: 'url' as ConversionMethodId,
    isDecode: true,
  },
];

export function EncoderDecoderTool() {
  // Main Configuration State (Clean empty input by default)
  const [conversionType, setConversionType] = useState<ConversionMethodId>('base64');
  const [inputVal, setInputVal] = useState<string>('');
  const [isDecodeMode, setIsDecodeMode] = useState<boolean>(false);
  const [autoConvert, setAutoConvert] = useState<boolean>(true);
  const [showCompareAll, setShowCompareAll] = useState<boolean>(false);
  const [manualExecutionTrigger, setManualExecutionTrigger] = useState<number>(0);
  const [isConverting, setIsConverting] = useState<boolean>(false);

  // Dynamic Parameters
  const [passphrase, setPassphrase] = useState<string>('secret');
  const [showPassphrase, setShowPassphrase] = useState<boolean>(false);
  const [caesarShift, setCaesarShift] = useState<number>(3);
  const [affineA, setAffineA] = useState<number>(5);
  const [affineB, setAffineB] = useState<number>(8);
  const [railCount, setRailCount] = useState<number>(3);
  const [cipherKey, setCipherKey] = useState<string>('SECRET');
  const [aesMode, setAesMode] = useState<'CBC' | 'CTR' | 'ECB' | 'CFB' | 'OFB'>('CBC');

  // RSA Parameters
  const [rsaPublicKey, setRsaPublicKey] = useState<string>(DEFAULT_RSA_PUBLIC_KEY);
  const [rsaPrivateKey, setRsaPrivateKey] = useState<string>(DEFAULT_RSA_PRIVATE_KEY);
  const [rsaPadding, setRsaPadding] = useState<'OAEP-SHA256' | 'OAEP-SHA1' | 'PKCS1-v1_5' | 'RAW'>('OAEP-SHA256');
  const [rsaKeySize, setRsaKeySize] = useState<1024 | 2048 | 4096>(2048);
  const [rsaOutputFormat, setRsaOutputFormat] = useState<'base64' | 'hex'>('base64');
  const [isGeneratingRsa, setIsGeneratingRsa] = useState<boolean>(false);
  const [showAllRsaKeys, setShowAllRsaKeys] = useState<boolean>(false);

  // Caesar Matrix Modal State
  const [isCaesarModalOpen, setIsCaesarModalOpen] = useState<boolean>(false);

  // Audio Playback State for Morse
  const [isMorsePlaying, setIsMorsePlaying] = useState<boolean>(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const morseStopRef = useRef<boolean>(false);

  // Bundle options
  const options: ConversionOptions = useMemo(
    () => ({
      passphrase,
      caesarShift,
      affineA,
      affineB,
      railCount,
      cipherKey,
      aesMode,
      rsaPublicKey,
      rsaPrivateKey,
      rsaPadding,
      rsaKeySize,
      rsaOutputFormat,
    }),
    [
      passphrase,
      caesarShift,
      affineA,
      affineB,
      railCount,
      cipherKey,
      aesMode,
      rsaPublicKey,
      rsaPrivateKey,
      rsaPadding,
      rsaKeySize,
      rsaOutputFormat,
    ]
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

  // Conversion Execution Result
  const conversionResult = useMemo(() => {
    if (!inputVal) {
      return {
        output: '',
        stats: {
          inputChars: 0,
          inputBytes: 0,
          inputLines: 0,
          outputChars: 0,
          outputBytes: 0,
          outputLines: 0,
          entropy: 0,
        },
      };
    }
    // If autoConvert is false and manual button has not been clicked yet for this input
    if (!autoConvert && manualExecutionTrigger === 0) {
      return {
        output: '',
        stats: {
          inputChars: inputVal.length,
          inputBytes: 0,
          inputLines: 0,
          outputChars: 0,
          outputBytes: 0,
          outputLines: 0,
          entropy: 0,
        },
      };
    }
    return executeConversion(inputVal, conversionType, isDecodeMode, options);
  }, [inputVal, conversionType, isDecodeMode, options, autoConvert, manualExecutionTrigger]);

  const outputVal = conversionResult.output;
  const stats = conversionResult.stats;
  const isError = Boolean(conversionResult.error);

  // Manual Convert Action Button Handler
  const handleRunConversion = useCallback(() => {
    if (!inputVal) {
      toast.error('Please enter text to convert.');
      return;
    }
    setIsConverting(true);
    setTimeout(() => {
      setManualExecutionTrigger((prev) => prev + 1);
      setIsConverting(false);
      const res = executeConversion(inputVal, conversionType, isDecodeMode, options);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(`Converted with ${currentMethodDef.name}!`);
      }
    }, 40);
  }, [inputVal, conversionType, isDecodeMode, options, currentMethodDef.name]);

  // Keyboard shortcut: Ctrl+Enter / Cmd+Enter to convert
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleRunConversion();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleRunConversion]);

  // Generate strong random passphrase
  const handleGeneratePassphrase = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=';
    let pass = '';
    for (let i = 0; i < 20; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassphrase(pass);
    setCipherKey(pass);
    toast.success('Generated new secure 20-character passphrase!');
  };

  // Generate RSA Keypair
  const handleGenerateRsa = () => {
    setIsGeneratingRsa(true);
    setTimeout(() => {
      try {
        const pair = generateRsaKeyPair(rsaKeySize);
        setRsaPublicKey(pair.publicKey);
        setRsaPrivateKey(pair.privateKey);
        toast.success(`Generated new ${rsaKeySize}-bit RSA Keypair!`);
      } catch (err: any) {
        toast.error(`Keypair generation failed: ${err.message}`);
      } finally {
        setIsGeneratingRsa(false);
      }
    }, 40);
  };

  // Derive Public Key from Private Key
  const handleDerivePublicFromPrivate = () => {
    try {
      const pub = getPublicKeyFromPrivateKey(rsaPrivateKey);
      setRsaPublicKey(pub);
      toast.success('Derived RSA Public Key from Private Key!');
    } catch (err: any) {
      toast.error(`Could not derive public key: ${err.message}`);
    }
  };

  // Load demo keys
  const handleLoadDemoRsaKeys = () => {
    setRsaPublicKey(DEFAULT_RSA_PUBLIC_KEY);
    setRsaPrivateKey(DEFAULT_RSA_PRIVATE_KEY);
    toast.success('Loaded working 2048-bit demo RSA keypair!');
  };

  // Key validation status for RSA
  const rsaKeyValidation = useMemo(() => {
    if (conversionType !== 'rsa') return null;
    try {
      if (isDecodeMode) {
        const priv = parseRsaPrivateKey(rsaPrivateKey);
        return { valid: true, bits: priv.bitLength, type: 'Private Key' };
      } else {
        const pub = parseRsaPublicKey(rsaPublicKey);
        return { valid: true, bits: pub.bitLength, type: 'Public Key' };
      }
    } catch (err: any) {
      return { valid: false, error: err.message };
    }
  }, [conversionType, isDecodeMode, rsaPublicKey, rsaPrivateKey]);

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

      const dotDuration = 60;
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
    if (det.detectedParams?.rsaPublicKey) {
      setRsaPublicKey(det.detectedParams.rsaPublicKey);
    }
    if (det.detectedParams?.rsaPrivateKey) {
      setRsaPrivateKey(det.detectedParams.rsaPrivateKey);
    }
    toast.success(`Switched to ${det.name}`);
  };

  // Load preset sample
  const handleLoadPreset = (preset: (typeof SAMPLE_PRESETS)[0]) => {
    setInputVal(preset.value);
    setConversionType(preset.method);
    setIsDecodeMode(preset.isDecode);
    if (preset.passphrase) {
      setPassphrase(preset.passphrase);
      setCipherKey(preset.passphrase);
    }
    if ((preset as any).shift) setCaesarShift((preset as any).shift);
    if ((preset as any).rsaPublicKey) setRsaPublicKey((preset as any).rsaPublicKey);
    if ((preset as any).rsaPrivateKey) setRsaPrivateKey((preset as any).rsaPrivateKey);
    toast.info(`Loaded sample: ${preset.name}`);
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
    a.download = `${conversionType}-${isDecodeMode ? 'decoded' : 'encoded'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Downloaded output file');
  };

  // Swap input & output
  const handleSwap = () => {
    if (!outputVal || isError) return;
    setInputVal(outputVal);
    if (!currentMethodDef.isOneWay) {
      setIsDecodeMode(!isDecodeMode);
    }
    toast.success('Swapped Input ⇄ Output');
  };

  const requiresKey =
    (currentMethodDef.requiresPassphrase && conversionType !== 'rsa') ||
    conversionType.startsWith('aes-') ||
    conversionType === 'vigenere' ||
    conversionType === 'xor';

  return (
    <div className="space-y-4 max-w-5xl mx-auto">
      {/* 1. Main Unified Control Toolbar */}
      <Card className="border shadow-sm bg-card/95">
        <CardContent className="p-3.5 sm:p-4 space-y-3.5">
          {/* Main Controls Row: Algorithm Select + Mode (Encode/Decode) + Sample Presets */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Left: Algorithm Select & Encode/Decode segmented switch */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-2">
                <Label className="text-xs font-bold text-muted-foreground shrink-0">Algorithm:</Label>
                <Select
                  value={conversionType}
                  onValueChange={(val) => setConversionType(val as ConversionMethodId)}
                >
                  <SelectTrigger className="w-64 h-9 text-xs font-semibold bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-80">
                    <SelectItem value="auto" className="font-bold text-primary">
                      ⚡ Auto-Detect Format
                    </SelectItem>

                    <SelectGroup>
                      <SelectLabel className="text-[10px] uppercase tracking-wider font-bold text-primary">
                        🔐 Asymmetric Public-Key Cryptography
                      </SelectLabel>
                      <SelectItem value="rsa" className="font-semibold text-primary">
                        RSA (Public-Key / PEM / Keypair)
                      </SelectItem>
                    </SelectGroup>

                    <SelectGroup>
                      <SelectLabel className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
                        🔤 Data Encodings
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
                        🔑 Symmetric Encryption (Key/Passphrase)
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
                        🏛️ Classical Ciphers
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
                        ⚡ Hashes & Digests (One-Way)
                      </SelectLabel>
                      <SelectItem value="sha256">SHA-256</SelectItem>
                      <SelectItem value="md5">MD5</SelectItem>
                      <SelectItem value="sha1">SHA-1</SelectItem>
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
              </div>

              {/* Big, Clear Encode vs Decode Mode Toggle */}
              {!currentMethodDef.isOneWay && conversionType !== 'auto' && (
                <div className="inline-flex rounded-lg border p-0.5 bg-muted/40 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setIsDecodeMode(false)}
                    className={`h-8 px-3.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      !isDecodeMode
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Lock className="h-3.5 w-3.5" />
                    Encode / Encrypt
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsDecodeMode(true)}
                    className={`h-8 px-3.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      isDecodeMode
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Unlock className="h-3.5 w-3.5" />
                    Decode / Decrypt
                  </button>
                </div>
              )}

              {currentMethodDef.isOneWay && (
                <Badge variant="secondary" className="h-8 text-xs font-semibold px-2.5 gap-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <Zap className="h-3.5 w-3.5" />
                  One-Way Digest
                </Badge>
              )}
            </div>

            {/* Right: Presets & Compare All */}
            <div className="flex items-center gap-2">
              <Select
                onValueChange={(val) => {
                  const preset = SAMPLE_PRESETS.find((p) => p.name === val);
                  if (preset) handleLoadPreset(preset);
                }}
              >
                <SelectTrigger className="h-8.5 text-xs w-36 bg-background font-medium">
                  <SelectValue placeholder="Load Sample..." />
                </SelectTrigger>
                <SelectContent>
                  {SAMPLE_PRESETS.map((p) => (
                    <SelectItem key={p.name} value={p.name} className="text-xs">
                      <div className="font-semibold">{p.name}</div>
                      <div className="text-[10px] text-muted-foreground">{p.desc}</div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Button
                size="sm"
                variant={showCompareAll ? 'default' : 'outline'}
                onClick={() => setShowCompareAll(!showCompareAll)}
                className="h-8.5 text-xs font-semibold gap-1"
              >
                <Layers className="h-3.5 w-3.5" />
                {showCompareAll ? 'Hide Comparison' : 'Compare All'}
              </Button>
            </div>
          </div>

          {/* Quick-Access Pills Row */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] uppercase font-bold text-muted-foreground mr-1">Quick:</span>
            {QUICK_FORMATS.map((q) => {
              const isActive = conversionType === q.id;
              return (
                <button
                  key={q.id}
                  onClick={() => setConversionType(q.id)}
                  className={`text-[11px] px-2.5 py-0.5 rounded-full font-medium transition-all cursor-pointer ${
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

      {/* 2. Contextual Parameters (Only shown when required) */}
      {/* RSA Public-Key Key & Options Panel */}
      {conversionType === 'rsa' && (
        <Card className="border border-primary/30 shadow-xs bg-card">
          <CardContent className="p-3.5 space-y-3 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2.5 bg-muted/30 p-2.5 rounded-lg border">
              <div className="flex flex-wrap items-center gap-3">
                {/* Padding Scheme */}
                <div className="flex items-center gap-1.5">
                  <Label className="text-[11px] font-bold text-muted-foreground shrink-0">Padding:</Label>
                  <Select
                    value={rsaPadding}
                    onValueChange={(v) => setRsaPadding(v as any)}
                  >
                    <SelectTrigger className="h-7 text-xs font-semibold w-48 bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="OAEP-SHA256">RSA-OAEP (SHA-256) ★</SelectItem>
                      <SelectItem value="OAEP-SHA1">RSA-OAEP (SHA-1)</SelectItem>
                      <SelectItem value="PKCS1-v1_5">PKCS#1 v1.5 (Classic)</SelectItem>
                      <SelectItem value="RAW">Raw / No Padding</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Output Encoding for Encryption */}
                {!isDecodeMode && (
                  <div className="flex items-center gap-1.5">
                    <Label className="text-[11px] font-bold text-muted-foreground shrink-0">Format:</Label>
                    <Select
                      value={rsaOutputFormat}
                      onValueChange={(v) => setRsaOutputFormat(v as any)}
                    >
                      <SelectTrigger className="h-7 text-xs font-semibold w-24 bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="base64">Base64</SelectItem>
                        <SelectItem value="hex">Hex</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Key Validation Status Badge */}
                {rsaKeyValidation && (
                  <Badge
                    variant={rsaKeyValidation.valid ? 'default' : 'destructive'}
                    className="h-6 text-[10px] font-bold px-2 gap-1"
                  >
                    {rsaKeyValidation.valid ? (
                      <>
                        <ShieldCheck className="h-3 w-3 text-emerald-400" />
                        {rsaKeyValidation.bits}-bit {rsaKeyValidation.type} Ready
                      </>
                    ) : (
                      <>⚠ Invalid RSA Key</>
                    )}
                  </Badge>
                )}
              </div>

              {/* Keypair Generator & Utilities */}
              <div className="flex items-center gap-2">
                <Select
                  value={rsaKeySize.toString()}
                  onValueChange={(v) => setRsaKeySize(Number(v) as any)}
                >
                  <SelectTrigger className="h-7 text-xs w-24 bg-background font-mono">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1024">1024-bit</SelectItem>
                    <SelectItem value="2048">2048-bit</SelectItem>
                    <SelectItem value="4096">4096-bit</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleGenerateRsa}
                  disabled={isGeneratingRsa}
                  className="h-7 text-[11px] font-bold px-2.5 gap-1.5 text-primary border-primary/30 hover:bg-primary/10 cursor-pointer"
                >
                  {isGeneratingRsa ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3.5 w-3.5" />
                      Generate Keypair
                    </>
                  )}
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  onClick={handleLoadDemoRsaKeys}
                  className="h-7 text-[11px] font-medium px-2 text-muted-foreground hover:text-foreground"
                >
                  Load Demo Keys
                </Button>

                <Button
                  size="sm"
                  variant={showAllRsaKeys ? 'secondary' : 'ghost'}
                  onClick={() => setShowAllRsaKeys(!showAllRsaKeys)}
                  className="h-7 text-[11px] font-bold px-2 text-muted-foreground hover:text-foreground"
                >
                  <KeyRound className="h-3.5 w-3.5 mr-1" />
                  {showAllRsaKeys ? 'Hide Dual View' : 'View Both Keys'}
                </Button>
              </div>
            </div>

            {/* Beginner-friendly explanation of active mode key */}
            <div className="p-2 rounded bg-primary/5 border border-primary/10 text-[11px] text-foreground flex items-center justify-between">
              <span>
                {isDecodeMode ? (
                  <>🔑 <strong>Decryption Mode:</strong> Uses the <strong>RSA Private Key</strong> (PEM) to unlock and decrypt your message.</>
                ) : (
                  <>📋 <strong>Encryption Mode:</strong> Uses the <strong>RSA Public Key</strong> (PEM) to lock and encrypt your message.</>
                )}
              </span>
            </div>

            {/* Key Editor(s) */}
            {showAllRsaKeys ? (
              <div className="grid gap-3 md:grid-cols-2 p-3 bg-muted/20 rounded-lg border">
                {/* Public Key Card */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-[11px] font-bold text-primary flex items-center gap-1">
                      <FileKey className="h-3.5 w-3.5" />
                      Public Key (PEM) - Used for Encryption
                    </Label>
                    <div className="flex items-center gap-1">
                      <label className="cursor-pointer inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground h-5 px-1.5 rounded hover:bg-muted transition-colors">
                        <Upload className="h-2.5 w-2.5" />
                        Import
                        <input
                          type="file"
                          className="hidden"
                          accept=".pem,.pub,.key,.txt"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) {
                              const r = new FileReader();
                              r.onload = () => {
                                if (typeof r.result === 'string') setRsaPublicKey(r.result);
                              };
                              r.readAsText(f);
                            }
                          }}
                        />
                      </label>
                      <CopyButton value={rsaPublicKey} toastMessage="Public key copied!" />
                    </div>
                  </div>
                  <Textarea
                    value={rsaPublicKey}
                    onChange={(e) => setRsaPublicKey(e.target.value)}
                    placeholder="-----BEGIN PUBLIC KEY-----"
                    className="h-28 text-[10px] font-mono leading-tight resize-y bg-background"
                  />
                </div>

                {/* Private Key Card */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-[11px] font-bold text-primary flex items-center gap-1">
                      <Key className="h-3.5 w-3.5" />
                      Private Key (PEM) - Used for Decryption
                    </Label>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleDerivePublicFromPrivate}
                        className="h-5 text-[10px] px-1.5 text-muted-foreground hover:text-foreground"
                      >
                        Derive Public Key
                      </Button>
                      <label className="cursor-pointer inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground h-5 px-1.5 rounded hover:bg-muted transition-colors">
                        <Upload className="h-2.5 w-2.5" />
                        Import
                        <input
                          type="file"
                          className="hidden"
                          accept=".pem,.key,.txt"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) {
                              const r = new FileReader();
                              r.onload = () => {
                                if (typeof r.result === 'string') setRsaPrivateKey(r.result);
                              };
                              r.readAsText(f);
                            }
                          }}
                        />
                      </label>
                      <CopyButton value={rsaPrivateKey} toastMessage="Private key copied!" />
                    </div>
                  </div>
                  <Textarea
                    value={rsaPrivateKey}
                    onChange={(e) => setRsaPrivateKey(e.target.value)}
                    placeholder="-----BEGIN PRIVATE KEY-----"
                    className="h-28 text-[10px] font-mono leading-tight resize-y bg-background"
                  />
                </div>
              </div>
            ) : (
              /* Single Active Key Input */
              <div className="p-2.5 bg-muted/20 rounded-lg border space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label className="text-[11px] font-bold text-primary flex items-center gap-1.5">
                    {isDecodeMode ? <Key className="h-3.5 w-3.5" /> : <FileKey className="h-3.5 w-3.5" />}
                    {isDecodeMode ? 'RSA Private Key (PEM) to Decrypt:' : 'RSA Public Key (PEM) to Encrypt:'}
                  </Label>
                  <div className="flex items-center gap-1">
                    {isDecodeMode && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={handleDerivePublicFromPrivate}
                        className="h-5 text-[10px] px-1.5 text-muted-foreground hover:text-foreground"
                      >
                        Derive Public Key
                      </Button>
                    )}
                    <label className="cursor-pointer inline-flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground h-5 px-1.5 rounded hover:bg-muted transition-colors">
                      <Upload className="h-2.5 w-2.5" />
                      Import PEM
                      <input
                        type="file"
                        className="hidden"
                        accept=".pem,.pub,.key,.txt"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) {
                            const r = new FileReader();
                            r.onload = () => {
                              if (typeof r.result === 'string') {
                                if (isDecodeMode) setRsaPrivateKey(r.result);
                                else setRsaPublicKey(r.result);
                              }
                            };
                            r.readAsText(f);
                          }
                        }}
                      />
                    </label>
                    <CopyButton
                      value={isDecodeMode ? rsaPrivateKey : rsaPublicKey}
                      toastMessage="Key copied!"
                    />
                  </div>
                </div>
                <Textarea
                  value={isDecodeMode ? rsaPrivateKey : rsaPublicKey}
                  onChange={(e) => {
                    if (isDecodeMode) setRsaPrivateKey(e.target.value);
                    else setRsaPublicKey(e.target.value);
                  }}
                  placeholder={
                    isDecodeMode
                      ? 'Paste RSA Private Key (-----BEGIN PRIVATE KEY----- ...)'
                      : 'Paste RSA Public Key (-----BEGIN PUBLIC KEY----- ...)'
                  }
                  className="h-20 text-[10px] font-mono leading-tight resize-y bg-background"
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Symmetric Passphrase Parameters (AES, DES, 3DES, Blowfish, XOR) */}
      {requiresKey && (
        <Card className="border shadow-xs bg-card">
          <CardContent className="p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <Label htmlFor="pass-input" className="text-[11px] font-bold text-primary flex items-center gap-1 shrink-0">
                  <Key className="h-3.5 w-3.5" />
                  Passphrase / Secret Key:
                </Label>
                <div className="relative flex items-center">
                  <Input
                    id="pass-input"
                    type={showPassphrase ? 'text' : 'password'}
                    placeholder="Enter secret passphrase..."
                    value={passphrase}
                    onChange={(e) => {
                      setPassphrase(e.target.value);
                      setCipherKey(e.target.value);
                    }}
                    className="w-56 h-7.5 text-xs font-mono pr-7 bg-background"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassphrase(!showPassphrase)}
                    className="absolute right-2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassphrase ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                  </button>
                </div>
              </div>

              <Button
                size="sm"
                variant="outline"
                onClick={handleGeneratePassphrase}
                className="h-7 text-[11px] font-medium gap-1 text-muted-foreground hover:text-foreground"
              >
                <Dices className="h-3.5 w-3.5" />
                Random Key
              </Button>
            </div>

            {/* AES Mode */}
            {conversionType.startsWith('aes-') && (
              <div className="flex items-center gap-2">
                <Label className="text-[11px] font-bold text-muted-foreground">Mode:</Label>
                <Select value={aesMode} onValueChange={(v) => setAesMode(v as any)}>
                  <SelectTrigger className="w-24 h-7 text-xs font-mono bg-background">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CBC">CBC (Default)</SelectItem>
                    <SelectItem value="CTR">CTR</SelectItem>
                    <SelectItem value="ECB">ECB</SelectItem>
                    <SelectItem value="CFB">CFB</SelectItem>
                    <SelectItem value="OFB">OFB</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Classical Cipher Parameters (Caesar, Affine, Rail Fence) */}
      {(conversionType === 'caesar' || conversionType === 'affine' || conversionType === 'railfence') && (
        <Card className="border shadow-xs bg-card">
          <CardContent className="p-3 flex flex-wrap items-center gap-4 text-xs">
            {conversionType === 'caesar' && (
              <div className="flex items-center gap-3">
                <Label className="text-[11px] font-bold text-primary shrink-0">
                  Shift: <strong className="font-mono">{caesarShift}</strong>
                </Label>
                <input
                  type="range"
                  min={1}
                  max={25}
                  value={caesarShift}
                  onChange={(e) => setCaesarShift(Number(e.target.value))}
                  className="w-32 h-2 accent-primary cursor-pointer"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsCaesarModalOpen(true)}
                  className="h-7 text-[11px] font-bold px-2.5 text-primary border-primary/30 hover:bg-primary/10"
                >
                  <Sparkles className="h-3.5 w-3.5 mr-1" />
                  Crack (View 25 Shifts)
                </Button>
              </div>
            )}

            {conversionType === 'affine' && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <Label className="text-[11px] font-bold text-muted-foreground">Key a:</Label>
                  <Select value={affineA.toString()} onValueChange={(v) => setAffineA(Number(v))}>
                    <SelectTrigger className="w-16 h-7 text-xs font-mono">
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
                </div>

                <div className="flex items-center gap-1.5">
                  <Label className="text-[11px] font-bold text-muted-foreground">Key b:</Label>
                  <Input
                    type="number"
                    min="0"
                    max="25"
                    value={affineB}
                    onChange={(e) => setAffineB(Number(e.target.value))}
                    className="w-16 h-7 text-xs font-mono bg-background"
                  />
                </div>
              </div>
            )}

            {conversionType === 'railfence' && (
              <div className="flex items-center gap-3">
                <Label className="text-[11px] font-bold text-primary shrink-0">
                  Rails: <strong className="font-mono">{railCount}</strong>
                </Label>
                <input
                  type="range"
                  min={2}
                  max={20}
                  value={railCount}
                  onChange={(e) => setRailCount(Number(e.target.value))}
                  className="w-32 h-2 accent-primary cursor-pointer"
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 3. Central Action Bar with Prominent Convert / Submit Button */}
      <div className="flex items-center justify-between gap-3 bg-muted/40 p-2.5 rounded-xl border">
        {/* Left: Status and Auto-run live toggle */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5">
            <Label htmlFor="live-toggle-bar" className="text-[11px] font-medium cursor-pointer text-muted-foreground">
              Live Auto-Convert:
            </Label>
            <Switch
              id="live-toggle-bar"
              checked={autoConvert}
              onCheckedChange={setAutoConvert}
              className="scale-80"
            />
          </div>
          <span className="text-[11px] text-muted-foreground hidden sm:inline">
            {autoConvert ? '• Live real-time updates enabled' : '• Manual click mode'}
          </span>
        </div>

        {/* Primary Convert / Submit Button */}
        <div className="flex items-center gap-2">
          <Button
            size="default"
            variant="default"
            onClick={handleRunConversion}
            disabled={isConverting}
            className="h-9 px-5 font-bold text-xs gap-2 shadow-sm bg-primary text-primary-foreground hover:bg-primary/90 transition-all cursor-pointer"
          >
            {isConverting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                {isDecodeMode ? <Unlock className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                {isDecodeMode ? '🔓 Decrypt / Decode Now' : '🔒 Encrypt / Encode Now'}
                <span className="text-[10px] opacity-75 font-mono ml-1 hidden md:inline">(Ctrl+Enter)</span>
              </>
            )}
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleSwap}
            disabled={!outputVal || isError}
            className="h-9 text-xs font-semibold gap-1.5 cursor-pointer"
            title="Swap input with output result"
          >
            <ArrowRightLeft className="h-3.5 w-3.5 text-primary" />
            <span className="hidden sm:inline">Swap</span>
          </Button>
        </div>
      </div>

      {/* 4. Side-by-Side Clean Editor Panels */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Left: Input Panel */}
        <Card className="border shadow-sm flex flex-col justify-between">
          <CardContent className="p-3.5 space-y-2.5 flex-1 flex flex-col">
            {/* Input Header */}
            <div className="flex items-center justify-between pb-1.5 border-b">
              <div className="flex items-center gap-2">
                <span className="font-bold text-xs">
                  {isDecodeMode ? '📥 Input (Encoded / Ciphertext)' : '📥 Input (Plaintext)'}
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
                  className="h-6.5 text-[11px] px-2 gap-1 text-muted-foreground hover:text-foreground cursor-pointer"
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
                  className="h-6.5 text-[11px] px-2 text-muted-foreground hover:text-destructive cursor-pointer"
                  onClick={() => setInputVal('')}
                  disabled={!inputVal}
                  title="Clear input"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {/* Smart Auto-Detection Indicator */}
            {topDetection && inputVal.trim().length > 0 && conversionType !== topDetection.methodId && (
              <div className="flex items-center justify-between p-2 rounded-md bg-primary/5 border border-primary/20 text-[11px]">
                <span className="flex items-center gap-1.5 text-foreground font-medium">
                  <Sparkles className="h-3.5 w-3.5 text-primary shrink-0" />
                  Looks like <strong className="text-primary">{topDetection.name}</strong> ({topDetection.confidence}%)
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 text-[10px] font-bold px-2 text-primary border-primary/30 hover:bg-primary/10 cursor-pointer"
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
                  ? 'Paste code or ciphertext here to decode/decrypt...'
                  : 'Type or paste plain text here to encode/encrypt...'
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
                  {isDecodeMode ? '📤 Output (Decoded Plaintext)' : '📤 Output (Encoded / Ciphertext)'}
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
                    className="h-6.5 text-[11px] font-bold px-2 gap-1 text-primary cursor-pointer"
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

                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6.5 text-[11px] px-2 gap-1 text-muted-foreground hover:text-foreground cursor-pointer"
                  onClick={handleDownload}
                  disabled={!outputVal || isError}
                >
                  <Download className="h-3 w-3" />
                  Save
                </Button>

                <CopyButton
                  value={outputVal}
                  disabled={!outputVal || isError}
                  toastMessage="Result copied!"
                  tooltip="Copy output"
                  iconClassName="h-3.5 w-3.5"
                />
              </div>
            </div>

            {/* Friendly Error Banner */}
            {isError && inputVal.trim().length > 0 && (
              <div className="p-2.5 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-xs space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {conversionResult.error}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  Tip: Verify your key matches the ciphertext, ensure you selected the correct mode (Encode vs Decode), or load a sample above to test.
                </div>
              </div>
            )}

            {/* Output Textarea */}
            <Textarea
              id="main-output"
              readOnly
              placeholder={
                autoConvert
                  ? 'Conversion result will appear here...'
                  : 'Click "Convert Now" to generate output...'
              }
              value={outputVal}
              className={`flex-1 min-h-[320px] text-xs font-mono leading-relaxed scrollbar-thin resize-y focus-visible:ring-0 ${
                isError && inputVal.trim().length > 0
                  ? 'bg-destructive/5 text-destructive border-destructive/30'
                  : 'bg-muted/30 text-foreground'
              }`}
            />
          </CardContent>
        </Card>
      </div>

      {/* 5. Live Multi-Algorithm Comparison Grid (Collapsible) */}
      {showCompareAll && (
        <div className="pt-2 animate-in fade-in-50">
          <MultiAlgorithmGrid
            inputText={inputVal || 'Sample Text'}
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
        inputText={inputVal || 'Sample'}
        onSelectShift={(shift) => {
          setCaesarShift(shift);
          setConversionType('caesar');
          setIsDecodeMode(true);
        }}
      />
    </div>
  );
}
