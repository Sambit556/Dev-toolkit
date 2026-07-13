'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Key, Eye, EyeOff, Copy, RefreshCw, Hash, CheckCircle, XCircle, Sliders } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import bcrypt from 'bcryptjs';
import { toast } from 'sonner';
import { generateV4, generateV1, generateUlid, generateNanoId, generateV5, decodeUuidV1 } from '@/lib/uuid';
import { Download, Sparkles, Settings2, HelpCircle, Search } from 'lucide-react';

const NAMESPACES = {
  DNS: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  URL: '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
  OID: '6ba7b812-9dad-11d1-80b4-00c04fd430c8',
  X500: '6ba7b814-9dad-11d1-80b4-00c04fd430c8',
};

// Helper to generate secure random bytes using window.crypto
const getRandomBytes = (size: number): Uint8Array => {
  const bytes = new Uint8Array(size);
  window.crypto.getRandomValues(bytes);
  return bytes;
};

// HMAC hash calculations using native Web Crypto API
async function calculateHmac(message: string, key: string, algo: string): Promise<{ hex: string; base64: string }> {
  try {
    const encoder = new TextEncoder();
    const messageData = encoder.encode(message);
    const keyData = encoder.encode(key);

    const hashName = algo.toUpperCase(); // e.g. SHA-256
    
    // Import raw key
    const cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: { name: hashName } },
      false,
      ['sign']
    );

    // Sign the message
    const signatureBuffer = await window.crypto.subtle.sign('HMAC', cryptoKey, messageData);
    
    // Convert signature buffer to hex and base64
    const signatureArray = Array.from(new Uint8Array(signatureBuffer));
    const hex = signatureArray.map(b => b.toString(16).padStart(2, '0')).join('');
    const base64 = btoa(String.fromCharCode.apply(null, signatureArray as any));
    
    return { hex, base64 };
  } catch (err) {
    console.error('HMAC calculation failed:', err);
    throw new Error('HMAC generation failed. Unsupported algorithm or invalid key.');
  }
}

export function SecurityTools() {
  const [activeTab, setActiveTab] = useState('password-gen');

  // --- PASSWORD GENERATOR STATES ---
  const [passLength, setPassLength] = useState<number>(16);
  const [includeUpper, setIncludeUpper] = useState<boolean>(true);
  const [includeLower, setIncludeLower] = useState<boolean>(true);
  const [includeNumbers, setIncludeNumbers] = useState<boolean>(true);
  const [includeSymbols, setIncludeSymbols] = useState<boolean>(true);
  const [excludeSimilar, setExcludeSimilar] = useState<boolean>(false);
  const [generatedPass, setGeneratedPass] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(true);

  // --- SECURE TOKEN STATES ---
  const [tokenType, setTokenType] = useState<string>('hex');
  const [tokenLength, setTokenLength] = useState<number>(32);
  const [bulkCount, setBulkCount] = useState<number>(1);
  const [generatedTokens, setGeneratedTokens] = useState<string>('');

  // --- HMAC STATES ---
  const [hmacMsg, setHmacMsg] = useState<string>('Developer utilities are awesome!');
  const [hmacKey, setHmacKey] = useState<string>('secret-dev-key');
  const [hmacAlgo, setHmacAlgo] = useState<string>('SHA-256');
  const [hmacHexResult, setHmacHexResult] = useState<string>('');
  const [hmacB64Result, setHmacB64Result] = useState<string>('');

  // --- BCRYPT STATES ---
  const [bcryptPass, setBcryptPass] = useState<string>('SuperSecretDevP@ss123');
  const [bcryptRounds, setBcryptRounds] = useState<number>(10);
  const [bcryptHashResult, setBcryptHashResult] = useState<string>('');
  const [bcryptLoading, setBcryptLoading] = useState<boolean>(false);

  // BCrypt Verification states
  const [verifyPass, setVerifyPass] = useState<string>('');
  const [verifyHash, setVerifyHash] = useState<string>('');
  const [verifyStatus, setVerifyStatus] = useState<'idle' | 'match' | 'no-match'>('idle');

  // --- UUID / ULID GENERATOR STATES ---
  const [uuidVersion, setUuidVersion] = useState<string>('v4');
  const [uuidQuantity, setUuidQuantity] = useState<number>(10);
  const [uuidUppercase, setUuidUppercase] = useState<boolean>(false);
  const [uuidBraces, setUuidBraces] = useState<boolean>(false);
  const [uuidNoHyphens, setUuidNoHyphens] = useState<boolean>(false);
  const [uuidNanoSize, setUuidNanoSize] = useState<number>(21);
  const [uuidNanoAlphabet, setUuidNanoAlphabet] = useState<string>('ModuleSymbhasOwnPr-0123456789ABCDEFGHNRVfgctiUOpqradsjhUXVWhwzI');
  const [uuidV5Namespace, setUuidV5Namespace] = useState<string>('6ba7b810-9dad-11d1-80b4-00c04fd430c8');
  const [uuidV5CustomNamespace, setUuidV5CustomNamespace] = useState<string>('');
  const [uuidV5Name, setUuidV5Name] = useState<string>('example.com');
  const [uuidGeneratedList, setUuidGeneratedList] = useState<string[]>([]);
  const [uuidDecoderInput, setUuidDecoderInput] = useState<string>('');
  const [uuidDecodedDetails, setUuidDecodedDetails] = useState<ReturnType<typeof decodeUuidV1>>(null);

  const handleUuidGenerate = async () => {
    try {
      const results: string[] = [];
      const qty = Math.max(1, Math.min(1000, uuidQuantity));

      for (let i = 0; i < qty; i++) {
        let rawId = '';
        if (uuidVersion === 'v4') {
          rawId = generateV4();
        } else if (uuidVersion === 'v1') {
          rawId = generateV1();
        } else if (uuidVersion === 'ulid') {
          rawId = generateUlid();
        } else if (uuidVersion === 'nanoid') {
          rawId = generateNanoId(uuidNanoSize, uuidNanoAlphabet);
        } else if (uuidVersion === 'v5') {
          const ns = uuidV5Namespace === 'custom' ? uuidV5CustomNamespace : uuidV5Namespace;
          rawId = await generateV5(ns, uuidV5Name + (qty > 1 ? `-${i}` : ''));
        }

        let formattedId = rawId;
        if (uuidVersion === 'v4' || uuidVersion === 'v1' || uuidVersion === 'v5') {
          if (uuidNoHyphens) {
            formattedId = formattedId.replace(/-/g, '');
          }
          if (uuidUppercase) {
            formattedId = formattedId.toUpperCase();
          }
          if (uuidBraces) {
            formattedId = `{${formattedId}}`;
          }
        } else {
          if (uuidUppercase) {
            formattedId = formattedId.toUpperCase();
          }
        }
        results.push(formattedId);
      }
      setUuidGeneratedList(results);
    } catch (e: any) {
      toast.error(e.message || 'Generation failed');
    }
  };

  const handleUuidCopyAll = () => {
    const text = uuidGeneratedList.join('\n');
    navigator.clipboard.writeText(text);
    toast.success('All IDs copied!');
  };

  const handleUuidDownload = (format: 'txt' | 'json') => {
    let content = '';
    let mimeType = 'text/plain';
    let filename = `generated-ids.${format}`;

    if (format === 'json') {
      content = JSON.stringify(uuidGeneratedList, null, 2);
      mimeType = 'application/json';
    } else {
      content = uuidGeneratedList.join('\n');
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    toast.success(`Downloaded as ${format.toUpperCase()}!`);
  };

  const handleUuidDecodeInput = (val: string) => {
    setUuidDecoderInput(val);
    const details = decodeUuidV1(val);
    setUuidDecodedDetails(details);
  };

  useEffect(() => {
    handleUuidGenerate();
  }, [uuidVersion, uuidQuantity, uuidUppercase, uuidBraces, uuidNoHyphens, uuidNanoSize, uuidV5Namespace, uuidV5Name]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam && ['password-gen', 'uuid-gen', 'hmac-gen', 'bcrypt-gen'].includes(tabParam)) {
        setActiveTab(tabParam);
      }
    }
  }, []);

  // --- PASSWORD STRENGTH CALCULATION ---
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { entropy: 0, rating: 'Empty', color: 'bg-muted' };

    let pool = 0;
    if (/[a-z]/.test(pass)) pool += 26;
    if (/[A-Z]/.test(pass)) pool += 26;
    if (/[0-9]/.test(pass)) pool += 10;
    if (/[^a-zA-Z0-9]/.test(pass)) pool += 32;

    const entropy = Math.round(pass.length * Math.log2(pool || 1));
    let rating = 'Weak';
    let color = 'bg-red-500';

    if (entropy >= 80) {
      rating = 'Very Strong';
      color = 'bg-emerald-500';
    } else if (entropy >= 60) {
      rating = 'Strong';
      color = 'bg-green-500';
    } else if (entropy >= 40) {
      rating = 'Fair';
      color = 'bg-amber-500';
    }

    return { entropy, rating, color };
  };

  const generatePasswd = () => {
    let charset = '';
    if (includeLower) charset += 'abcdefghijklmnopqrstuvwxyz';
    if (includeUpper) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (includeNumbers) charset += '0123456789';
    if (includeSymbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

    if (excludeSimilar) {
      charset = charset.replace(/[il1Lo0O!|;:,.]/g, '');
    }

    if (!charset) {
      toast.error('Please select at least one character set!');
      return;
    }

    let password = '';
    const bytes = getRandomBytes(passLength);
    for (let i = 0; i < passLength; i++) {
      password += charset[bytes[i] % charset.length];
    }
    setGeneratedPass(password);
  };

  useEffect(() => {
    generatePasswd();
  }, [passLength, includeUpper, includeLower, includeNumbers, includeSymbols, excludeSimilar]);

  // --- TOKEN GENERATION ---
  const generateTokensHandler = () => {
    let tokens: string[] = [];
    const len = Math.max(4, Math.min(1024, tokenLength));
    const count = Math.max(1, Math.min(500, bulkCount));

    for (let c = 0; c < count; c++) {
      if (tokenType === 'hex') {
        const bytes = getRandomBytes(Math.ceil(len / 2));
        tokens.push(Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('').substring(0, len));
      } else if (tokenType === 'base64' || tokenType === 'base64url') {
        const bytes = getRandomBytes(len);
        let b64 = btoa(String.fromCharCode.apply(null, bytes as any));
        if (tokenType === 'base64url') {
          b64 = b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
        }
        tokens.push(b64.substring(0, len));
      } else if (tokenType === 'uuid') {
        tokens.push(crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (ch) => {
          const r = getRandomBytes(1)[0] % 16;
          return (ch === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        }));
      } else {
        // Alphanumeric/Alphabetic
        let chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        if (tokenType === 'alpha') chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        let tok = '';
        const bytes = getRandomBytes(len);
        for (let i = 0; i < len; i++) {
          tok += chars[bytes[i] % chars.length];
        }
        tokens.push(tok);
      }
    }

    setGeneratedTokens(tokens.join('\n'));
  };

  useEffect(() => {
    generateTokensHandler();
  }, [tokenType, tokenLength, bulkCount]);

  // --- HMAC GENERATION ---
  useEffect(() => {
    const handleHmacGen = async () => {
      if (!hmacMsg) {
        setHmacHexResult('');
        setHmacB64Result('');
        return;
      }
      try {
        const res = await calculateHmac(hmacMsg, hmacKey, hmacAlgo);
        setHmacHexResult(res.hex);
        setHmacB64Result(res.base64);
      } catch (err) {
        setHmacHexResult('Error generating HMAC');
        setHmacB64Result('');
      }
    };
    handleHmacGen();
  }, [hmacMsg, hmacKey, hmacAlgo]);

  // --- BCRYPT GENERATION & VERIFICATION ---
  const handleBcryptHash = () => {
    if (!bcryptPass) {
      toast.error('Password string cannot be empty');
      return;
    }
    setBcryptLoading(true);
    // Use setTimeout to allow UI loader spinner to show on CPU-bound operations
    setTimeout(() => {
      try {
        const salt = bcrypt.genSaltSync(bcryptRounds);
        const hash = bcrypt.hashSync(bcryptPass, salt);
        setBcryptHashResult(hash);
        setBcryptLoading(false);
        toast.success('BCrypt hash computed successfully!');
      } catch (err) {
        toast.error('Error generating BCrypt hash');
        setBcryptLoading(false);
      }
    }, 50);
  };

  const handleBcryptVerify = () => {
    if (!verifyPass || !verifyHash) {
      toast.error('Please fill in both the password and the hash to verify');
      return;
    }
    try {
      const match = bcrypt.compareSync(verifyPass, verifyHash);
      setVerifyStatus(match ? 'match' : 'no-match');
      if (match) {
        toast.success('Passwords match!');
      } else {
        toast.error('Passwords do not match');
      }
    } catch (err) {
      setVerifyStatus('no-match');
      toast.error('Invalid BCrypt hash structure');
    }
  };

  const handleCopy = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const strength = getPasswordStrength(generatedPass);

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <div className="flex justify-center">
        <TabsList className="grid grid-cols-4 w-full max-w-3xl h-auto p-1 gap-1">
          <TabsTrigger value="password-gen" className="gap-2 py-2 text-xs">
            <Key className="h-4 w-4" />
            Password & Tokens
          </TabsTrigger>
          <TabsTrigger value="uuid-gen" className="gap-2 py-2 text-xs">
            <Sparkles className="h-4 w-4" />
            UUID & ULID
          </TabsTrigger>
          <TabsTrigger value="hmac-gen" className="gap-2 py-2 text-xs">
            <Hash className="h-4 w-4" />
            HMAC Signatures
          </TabsTrigger>
          <TabsTrigger value="bcrypt-gen" className="gap-2 py-2 text-xs">
            <Shield className="h-4 w-4" />
            BCrypt Hashing
          </TabsTrigger>
        </TabsList>
      </div>

      {/* --- TAB 1: PASSWORD & SECURE TOKEN GENERATOR --- */}
      <TabsContent value="password-gen" className="m-0 space-y-6 animate-fade-in">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Password Generator Panel */}
          <Card className="border bg-card/60 backdrop-blur-sm shadow-md">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b">
                <span className="font-bold text-sm flex items-center gap-1.5">
                  <Key className="h-4 w-4 text-primary" />
                  Password Generator
                </span>
                <Badge variant="secondary">Crypto Random</Badge>
              </div>

              {/* Password Result Box */}
              <div className="flex items-center gap-2 border bg-black/5 dark:bg-black/20 p-2.5 rounded-xl border-border/80">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={generatedPass}
                  readOnly
                  className="font-mono text-sm h-8 border-none bg-transparent shadow-none focus-visible:ring-0 px-0 flex-1"
                />
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={() => setShowPassword(!showPassword)}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={generatePasswd}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Regenerate</TooltipContent>
                </Tooltip>
                <Button size="icon" className="h-8 w-8" onClick={() => handleCopy(generatedPass, 'Password')}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>

              {/* Strength Rating */}
              <div className="space-y-1 text-xs">
                <div className="flex justify-between font-bold">
                  <span className="text-muted-foreground">Entropy Level:</span>
                  <span className="font-mono">{strength.entropy} bits ({strength.rating})</span>
                </div>
                <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                  <div className={`h-full ${strength.color}`} style={{ width: `${Math.min(100, (strength.entropy / 120) * 100)}%` }} />
                </div>
              </div>

              {/* Configuration Inputs */}
              <div className="space-y-3 pt-2 text-xs border-t">
                <div className="flex justify-between items-center">
                  <Label>Password Length: <span className="font-mono font-bold text-primary">{passLength}</span></Label>
                  <input
                    type="range"
                    min={4}
                    max={64}
                    value={passLength}
                    onChange={(e) => setPassLength(Number(e.target.value))}
                    className="w-1/2 accent-primary h-1 bg-muted rounded-full cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="pass-upper" className="cursor-pointer">Uppercase (A-Z)</Label>
                    <Switch id="pass-upper" checked={includeUpper} onCheckedChange={setIncludeUpper} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="pass-lower" className="cursor-pointer">Lowercase (a-z)</Label>
                    <Switch id="pass-lower" checked={includeLower} onCheckedChange={setIncludeLower} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="pass-nums" className="cursor-pointer">Numbers (0-9)</Label>
                    <Switch id="pass-nums" checked={includeNumbers} onCheckedChange={setIncludeNumbers} />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="pass-syms" className="cursor-pointer">Symbols (!@#)</Label>
                    <Switch id="pass-syms" checked={includeSymbols} onCheckedChange={setIncludeSymbols} />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t">
                  <Label htmlFor="pass-similar" className="cursor-pointer">Exclude similar (i, l, o, 1, 0, O)</Label>
                  <Switch id="pass-similar" checked={excludeSimilar} onCheckedChange={setExcludeSimilar} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Secure Token Generator */}
          <Card className="border bg-card/60 backdrop-blur-sm shadow-md flex flex-col justify-between">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b">
                <span className="font-bold text-sm flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-primary" />
                  Token & Bulk Generator
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="icon" className="h-7 w-7" onClick={() => handleCopy(generatedTokens, 'Tokens')}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy All</TooltipContent>
                </Tooltip>
              </div>

              {/* Display Result */}
              <Textarea
                value={generatedTokens}
                readOnly
                className="font-mono text-xs h-[105px] leading-relaxed resize-none bg-black/5 dark:bg-black/20"
                placeholder="Secure tokens will generate here..."
              />

              {/* Configuration Inputs */}
              <div className="grid grid-cols-2 gap-3 text-xs pt-1 border-t">
                <div className="space-y-1.5">
                  <Label>Token Type</Label>
                  <Select value={tokenType} onValueChange={setTokenType}>
                    <SelectTrigger className="h-8.5 bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hex">HEX (Hexadecimal)</SelectItem>
                      <SelectItem value="base64">Base64 String</SelectItem>
                      <SelectItem value="base64url">Base64URL Safe</SelectItem>
                      <SelectItem value="uuid">UUID v4 format</SelectItem>
                      <SelectItem value="alphanumeric">Alphanumeric</SelectItem>
                      <SelectItem value="alpha">Alphabetic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Token Length (Bytes)</Label>
                  <Input
                    type="number"
                    min={4}
                    max={512}
                    value={tokenLength}
                    onChange={(e) => setTokenLength(Math.max(4, Math.min(512, parseInt(e.target.value) || 4)))}
                    className="h-8.5 text-xs"
                    disabled={tokenType === 'uuid'}
                  />
                </div>
              </div>

              <div className="space-y-1.5 text-xs pt-1">
                <Label>Bulk Generation Count: <span className="font-bold font-mono text-primary">{bulkCount}</span></Label>
                <Input
                  type="number"
                  min={1}
                  max={250}
                  value={bulkCount}
                  onChange={(e) => setBulkCount(Math.max(1, Math.min(250, parseInt(e.target.value) || 1)))}
                  className="h-8.5 text-xs"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* --- TAB 2: HMAC GENERATOR --- */}
      <TabsContent value="hmac-gen" className="m-0 space-y-6 animate-fade-in">
        <div className="grid gap-6 md:grid-cols-3">
          {/* HMAC Configuration Panel */}
          <Card className="border bg-card/60 backdrop-blur-sm shadow-sm md:col-span-1 h-fit">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center pb-2 border-b">
                <Label className="font-bold text-sm">HMAC Options</Label>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="hmac-key-input">Secret Key</Label>
                <Input
                  id="hmac-key-input"
                  type="text"
                  value={hmacKey}
                  onChange={(e) => setHmacKey(e.target.value)}
                  placeholder="Enter secret key..."
                  className="text-xs h-9 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Algorithm</Label>
                <Select value={hmacAlgo} onValueChange={setHmacAlgo}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SHA-1">SHA-1 (Legacy)</SelectItem>
                    <SelectItem value="SHA-256">SHA-256 (Recommended)</SelectItem>
                    <SelectItem value="SHA-512">SHA-512 (Strongest)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Messages & Result Panel */}
          <Card className="border shadow-md md:col-span-2 relative">
            <CardContent className="p-4 space-y-4">
              <div className="space-y-2">
                <Label className="font-bold text-xs uppercase text-muted-foreground tracking-wider">Input Message Text</Label>
                <Textarea
                  value={hmacMsg}
                  onChange={(e) => setHmacMsg(e.target.value)}
                  placeholder="Type message to sign..."
                  className="min-h-[100px] text-xs font-mono"
                />
              </div>

              <div className="space-y-3 pt-3 border-t">
                {/* HEX Result */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase">
                    <span>HMAC HEX Signature</span>
                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleCopy(hmacHexResult, 'Hex HMAC')}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <Textarea
                    value={hmacHexResult}
                    readOnly
                    className="font-mono text-xs h-[65px] bg-black/5 dark:bg-black/20 leading-normal resize-none"
                  />
                </div>

                {/* Base64 Result */}
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase">
                    <span>HMAC BASE64 Signature</span>
                    <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleCopy(hmacB64Result, 'Base64 HMAC')}>
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <Input
                    value={hmacB64Result}
                    readOnly
                    className="font-mono text-xs h-9 bg-black/5 dark:bg-black/20"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* --- TAB 3: BCRYPT GENERATOR & VERIFIER --- */}
      <TabsContent value="bcrypt-gen" className="m-0 space-y-6 animate-fade-in">
        <div className="grid gap-6 md:grid-cols-2">
          {/* BCrypt Hash Generator */}
          <Card className="border bg-card/60 backdrop-blur-sm shadow-md">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center pb-2 border-b">
                <span className="font-bold text-sm flex items-center gap-1.5">
                  <Sliders className="h-4 w-4 text-primary" />
                  BCrypt Salt & Hash Generator
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <Label htmlFor="bcrypt-pass">Plain Text to Hash</Label>
                <Input
                  id="bcrypt-pass"
                  type="text"
                  value={bcryptPass}
                  onChange={(e) => setBcryptPass(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>

              <div className="flex justify-between items-center text-xs">
                <Label>Rounds (Cost Factor): <span className="font-bold font-mono text-primary">{bcryptRounds}</span></Label>
                <input
                  type="range"
                  min={4}
                  max={15}
                  value={bcryptRounds}
                  onChange={(e) => setBcryptRounds(Number(e.target.value))}
                  className="w-1/2 accent-primary h-1 bg-muted rounded-full cursor-pointer"
                />
              </div>

              <Button onClick={handleBcryptHash} className="w-full text-xs font-bold gap-1" disabled={bcryptLoading}>
                {bcryptLoading ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Shield className="h-3.5 w-3.5" />}
                {bcryptLoading ? 'Hashing...' : 'Generate BCrypt Hash'}
              </Button>

              <div className="space-y-1.5 text-xs pt-2 border-t">
                <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase">
                  <span>BCrypt Hash Output</span>
                  <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => handleCopy(bcryptHashResult, 'BCrypt Hash')}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <Textarea
                  value={bcryptHashResult}
                  readOnly
                  className="font-mono text-xs h-[65px] bg-black/5 dark:bg-black/20 leading-normal resize-none"
                  placeholder="BCrypt hash output..."
                />
              </div>
            </CardContent>
          </Card>

          {/* BCrypt Match Verifier */}
          <Card className="border bg-card/60 backdrop-blur-sm shadow-md">
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center pb-2 border-b">
                <span className="font-bold text-sm flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-primary" />
                  BCrypt Match Verifier
                </span>
              </div>

              <div className="space-y-1.5 text-xs">
                <Label htmlFor="verify-pass">Plain Text Password</Label>
                <Input
                  id="verify-pass"
                  type="password"
                  value={verifyPass}
                  onChange={(e) => setVerifyPass(e.target.value)}
                  placeholder="Enter raw password to test..."
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5 text-xs">
                <Label htmlFor="verify-hash">BCrypt Hash String</Label>
                <Textarea
                  id="verify-hash"
                  value={verifyHash}
                  onChange={(e) => setVerifyHash(e.target.value)}
                  placeholder="Paste $2a$ or $2b$ BCrypt hash here..."
                  className="text-xs font-mono h-[65px] resize-none"
                />
              </div>

              <div className="flex items-center justify-between gap-4 pt-1.5">
                <Button onClick={handleBcryptVerify} variant="secondary" className="flex-1 text-xs font-bold">
                  Verify Match
                </Button>
                
                {/* Visual Status Indicator */}
                <div className="w-1/3 flex items-center justify-end font-bold text-xs gap-1.5">
                  {verifyStatus === 'match' && (
                    <span className="text-emerald-500 flex items-center gap-1">
                      <CheckCircle className="h-4 w-4" /> Match
                    </span>
                  )}
                  {verifyStatus === 'no-match' && (
                    <span className="text-red-500 flex items-center gap-1">
                      <XCircle className="h-4 w-4" /> No Match
                    </span>
                  )}
                  {verifyStatus === 'idle' && (
                    <span className="text-muted-foreground/60 italic font-normal">Not tested</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* --- TAB 4: UUID & ULID GENERATOR --- */}
      <TabsContent value="uuid-gen" className="m-0 space-y-6 animate-fade-in">
        <Tabs defaultValue="generator" className="space-y-6">
          <TabsList className="bg-background/40 backdrop-blur border border-primary/10 rounded-lg p-0.5 h-auto">
            <TabsTrigger value="generator" className="gap-2 text-xs py-1.5 px-3">
              <Sparkles className="h-3.5 w-3.5" />
              UUID/ULID Generator
            </TabsTrigger>
            <TabsTrigger value="decoder" className="gap-2 text-xs py-1.5 px-3">
              <Search className="h-3.5 w-3.5" />
              UUID v1 Decoder
            </TabsTrigger>
          </TabsList>

          {/* --- GENERATOR PANEL --- */}
          <TabsContent value="generator" className="m-0 space-y-6">
            <div className="grid gap-6 md:grid-cols-3">
              {/* Controls Side */}
              <div className="md:col-span-1 space-y-4">
                <Card className="border bg-card/60 backdrop-blur-sm shadow-md">
                  <CardContent className="p-4 space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b">
                      <Settings2 className="h-4 w-4 text-primary" />
                      <h3 className="font-semibold text-sm">Generator Settings</h3>
                    </div>

                    {/* ID Type */}
                    <div className="space-y-1.5 text-xs">
                      <Label htmlFor="id-version">Identifier Type</Label>
                      <Select value={uuidVersion} onValueChange={(v) => setUuidVersion(v)}>
                        <SelectTrigger id="id-version" className="h-8.5 bg-background">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="v4">UUID v4 (Random)</SelectItem>
                          <SelectItem value="v1">UUID v1 (Time-based)</SelectItem>
                          <SelectItem value="ulid">ULID (Sortable)</SelectItem>
                          <SelectItem value="nanoid">NanoID (URL-friendly)</SelectItem>
                          <SelectItem value="v5">UUID v5 (SHA-1 Namespace)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Quantity */}
                    <div className="space-y-1.5 text-xs">
                      <Label htmlFor="quantity">Quantity (Max 1000)</Label>
                      <Input
                        id="quantity"
                        type="number"
                        min={1}
                        max={1000}
                        value={uuidQuantity}
                        onChange={(e) => setUuidQuantity(Math.max(1, Math.min(1000, parseInt(e.target.value) || 1)))}
                        className="h-8.5 text-xs"
                      />
                    </div>

                    {/* --- NanoID Custom Options --- */}
                    {uuidVersion === 'nanoid' && (
                      <div className="space-y-3 p-3 bg-muted/40 rounded-md border border-dashed text-xs">
                        <div className="space-y-1.5">
                          <Label htmlFor="nano-size">NanoID Size</Label>
                          <Input
                            id="nano-size"
                            type="number"
                            min={1}
                            max={128}
                            value={uuidNanoSize}
                            onChange={(e) => setUuidNanoSize(Math.max(1, Math.min(128, parseInt(e.target.value) || 1)))}
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="nano-alphabet">Alphabet</Label>
                          <Input
                            id="nano-alphabet"
                            value={uuidNanoAlphabet}
                            onChange={(e) => setUuidNanoAlphabet(e.target.value)}
                            className="font-mono text-[10px] h-8"
                          />
                        </div>
                      </div>
                    )}

                    {/* --- UUID v5 Custom Options --- */}
                    {uuidVersion === 'v5' && (
                      <div className="space-y-3 p-3 bg-muted/40 rounded-md border border-dashed text-xs">
                        <div className="space-y-1.5">
                          <Label htmlFor="v5-namespace">Namespace</Label>
                          <Select value={uuidV5Namespace} onValueChange={(v) => setUuidV5Namespace(v)}>
                            <SelectTrigger id="v5-namespace" className="h-8 bg-background">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value={NAMESPACES.DNS}>DNS (Domain)</SelectItem>
                              <SelectItem value={NAMESPACES.URL}>URL</SelectItem>
                              <SelectItem value={NAMESPACES.OID}>OID</SelectItem>
                              <SelectItem value={NAMESPACES.X500}>X.500</SelectItem>
                              <SelectItem value="custom">Custom Namespace...</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {uuidV5Namespace === 'custom' && (
                          <div className="space-y-1.5">
                            <Label htmlFor="v5-custom-ns">Namespace UUID</Label>
                            <Input
                              id="v5-custom-ns"
                              placeholder="e.g. 6ba7b810-9dad-11d1-80b4-00c04fd430c8"
                              value={uuidV5CustomNamespace}
                              onChange={(e) => setUuidV5CustomNamespace(e.target.value)}
                              className="font-mono text-xs h-8"
                            />
                          </div>
                        )}

                        <div className="space-y-1.5">
                          <Label htmlFor="v5-name">Input Name</Label>
                          <Input
                            id="v5-name"
                            value={uuidV5Name}
                            onChange={(e) => setUuidV5Name(e.target.value)}
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                    )}

                    {/* Formatting Toggles */}
                    <div className="space-y-3 pt-2 text-xs border-t border-border/40">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="uppercase-toggle" className="cursor-pointer">Force UPPERCASE</Label>
                        <Switch
                          id="uppercase-toggle"
                          checked={uuidUppercase}
                          onCheckedChange={(checked) => setUuidUppercase(checked)}
                        />
                      </div>

                      {(uuidVersion === 'v4' || uuidVersion === 'v1' || uuidVersion === 'v5') && (
                        <>
                          <div className="flex items-center justify-between">
                            <Label htmlFor="braces-toggle" className="cursor-pointer">Wrap with Braces `{"{...}"}`</Label>
                            <Switch
                              id="braces-toggle"
                              checked={uuidBraces}
                              onCheckedChange={(checked) => setUuidBraces(checked)}
                            />
                          </div>

                          <div className="flex items-center justify-between">
                            <Label htmlFor="hyphen-toggle" className="cursor-pointer">Remove Hyphens</Label>
                            <Switch
                              id="hyphen-toggle"
                              checked={uuidNoHyphens}
                              onCheckedChange={(checked) => setUuidNoHyphens(checked)}
                            />
                          </div>
                        </>
                      )}
                    </div>

                    <Button onClick={handleUuidGenerate} className="w-full text-xs font-bold gap-1.5">
                      <RefreshCw className="h-3.5 w-3.5" />
                      Regenerate
                    </Button>
                  </CardContent>
                </Card>
              </div>

              {/* Results Side */}
              <div className="md:col-span-2 space-y-4">
                <Card className="border bg-card/60 backdrop-blur-sm shadow-md h-full flex flex-col justify-between">
                  <CardContent className="p-4 flex-1 flex flex-col space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                      <span className="text-sm font-bold flex items-center gap-2">
                        Generated Output
                        <Badge variant="secondary" className="text-[10px] font-mono">
                          Qty: {uuidGeneratedList.length}
                        </Badge>
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Button variant="outline" size="sm" onClick={handleUuidCopyAll} className="h-7 text-xs font-bold">
                          <Copy className="h-3.5 w-3.5 mr-1" />
                          Copy All
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleUuidDownload('txt')} className="h-7 text-xs font-bold">
                          <Download className="h-3.5 w-3.5 mr-1" />
                          TXT
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleUuidDownload('json')} className="h-7 text-xs font-bold">
                          <Download className="h-3.5 w-3.5 mr-1" />
                          JSON
                        </Button>
                      </div>
                    </div>

                    {/* Bulk Output Textarea */}
                    <Textarea
                      value={uuidGeneratedList.join('\n')}
                      readOnly
                      className="font-mono text-xs flex-1 min-h-[250px] resize-y select-all bg-black/5 dark:bg-black/20"
                    />

                    {/* Meta details if UUID v1 */}
                    {uuidVersion === 'v1' && uuidGeneratedList.length > 0 && (
                      <div className="p-3 bg-blue-50/10 border border-blue-500/20 rounded-md text-xs space-y-1">
                        <p className="font-semibold text-primary uppercase text-[9px] tracking-wider mb-1">UUID v1 Header Info</p>
                        <p className="text-muted-foreground leading-normal">
                          Since UUID v1 is timestamp-derived, these generated tokens encapsulate the exact timestamp they were compiled. 
                          You can use the <strong>UUID v1 Decoder</strong> tab to extract the creation time.
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* --- DECODER PANEL --- */}
          <TabsContent value="decoder" className="m-0 space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Input Side */}
              <Card className="border bg-card/60 backdrop-blur-sm shadow-md">
                <CardContent className="p-4 space-y-4">
                  <div className="space-y-1.5 text-xs">
                    <Label htmlFor="decoder-input" className="font-bold text-sm">Enter UUID v1 Token</Label>
                    <Input
                      id="decoder-input"
                      placeholder="e.g. d68a3f80-0a8b-11ed-b57d-0800200c9a66"
                      value={uuidDecoderInput}
                      onChange={(e) => handleUuidDecodeInput(e.target.value)}
                      className="font-mono text-xs"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground leading-normal">
                    UUID v1 (version 1) is time-based. Paste one here to decode the precise millisecond/microsecond timestamp 
                    and MAC address/node from which it was constructed.
                  </p>
                </CardContent>
              </Card>

              {/* Details Output Side */}
              <Card className="border bg-card/60 backdrop-blur-sm shadow-md">
                <CardContent className="p-4 space-y-4">
                  <h3 className="font-bold text-sm border-b pb-2">Decoded Metadata</h3>
                  {uuidDecodedDetails ? (
                    <div className="space-y-3 font-mono text-xs">
                      <div className="flex justify-between py-1 border-b">
                        <span className="text-muted-foreground">Creation Date (UTC):</span>
                        <span className="font-bold text-primary">{uuidDecodedDetails.timestamp}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b">
                        <span className="text-muted-foreground">Local Date/Time:</span>
                        <span className="font-bold">{new Date(uuidDecodedDetails.timestamp).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between py-1 border-b">
                        <span className="text-muted-foreground">Node Identifier (MAC):</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{uuidDecodedDetails.node}</span>
                      </div>
                      <div className="flex justify-between py-1">
                        <span className="text-muted-foreground">Clock Sequence:</span>
                        <span>{uuidDecodedDetails.clockSequence}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-10">
                      <HelpCircle className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                      <p className="text-xs text-muted-foreground">
                        {uuidDecoderInput 
                          ? 'This does not appear to be a valid UUID v1 token.' 
                          : 'Paste a valid UUID v1 token to inspect.'}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </TabsContent>
    </Tabs>
  );
}
