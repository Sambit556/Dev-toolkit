'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, Copy, ArrowLeftRight, Link, Braces, Code, Info, Play, Trash2, Plus } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

// Morse Code mappings
const MORSE_MAP: Record<string, string> = {
  a: '.-', b: '-...', c: '-.-.', d: '-..', e: '.', f: '..-.', g: '--.', h: '....',
  i: '..', j: '.---', k: '-.-', l: '.-..', m: '--', n: '-.', o: '---', p: '.--.',
  q: '--.-', r: '.-.', s: '...', t: '-', u: '..-', v: '...-', w: '.--', x: '-..-',
  y: '-.--', z: '--..', '1': '.----', '2': '..---', '3': '...--', '4': '....-',
  '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.', '0': '-----',
  ' ': '/', '.': '.-.-.-', ',': '--..--', '?': '..--..', '\'': '.----.', '!': '-.-.--',
  '/': '-..-.', '(': '-.--.', ')': '-.--.-', '&': '.-...', ':': '---...', ';': '-.-.-.',
  '=': '-...-', '+': '.-.-.', '-': '-....-', '_': '..--.-', '"': '.-..-.', '$': '...-..-',
  '@': '.--.-.',
};
const REVERSE_MORSE: Record<string, string> = Object.fromEntries(
  Object.entries(MORSE_MAP).map(([k, v]) => [v, k])
);

export function EncoderDecoderTool() {
  const [conversionType, setConversionType] = useState<string>('base64');
  const [inputVal, setInputVal] = useState<string>('Hello, World!');
  const [outputVal, setOutputVal] = useState<string>('');
  const [isDecodeMode, setIsDecodeMode] = useState<boolean>(false);
  const [caesarShift, setCaesarShift] = useState<number>(3);

  // URL Parser States
  const [urlInput, setUrlInput] = useState<string>('https://example.com:8080/path/to/page?search=devchrono&category=developer#section-1');
  const [urlProtocol, setUrlProtocol] = useState<string>('');
  const [urlHost, setUrlHost] = useState<string>('');
  const [urlPort, setUrlPort] = useState<string>('');
  const [urlPath, setUrlPath] = useState<string>('');
  const [urlHash, setUrlHash] = useState<string>('');
  const [urlParams, setUrlParams] = useState<{ id: string; key: string; value: string }[]>([]);

  // 1. Convert Text (Encode/Decode)
  const processConversion = () => {
    if (!inputVal) {
      setOutputVal('');
      return;
    }

    try {
      if (conversionType === 'base64') {
        if (isDecodeMode) {
          setOutputVal(decodeURIComponent(escape(atob(inputVal))));
        } else {
          setOutputVal(btoa(unescape(encodeURIComponent(inputVal))));
        }
      } else if (conversionType === 'url') {
        if (isDecodeMode) {
          setOutputVal(decodeURIComponent(inputVal));
        } else {
          setOutputVal(encodeURIComponent(inputVal));
        }
      } else if (conversionType === 'html') {
        if (isDecodeMode) {
          const doc = new DOMParser().parseFromString(inputVal, 'text/html');
          setOutputVal(doc.documentElement.textContent || '');
        } else {
          const div = document.createElement('div');
          div.textContent = inputVal;
          setOutputVal(div.innerHTML);
        }
      } else if (conversionType === 'hex') {
        if (isDecodeMode) {
          const hex = inputVal.replace(/[^0-9A-Fa-f]/g, '');
          let decoded = '';
          for (let i = 0; i < hex.length; i += 2) {
            decoded += String.fromCharCode(parseInt(hex.substring(i, i + 2), 16));
          }
          setOutputVal(decoded);
        } else {
          const hexArr = Array.from(inputVal).map((c) =>
            c.charCodeAt(0).toString(16).padStart(2, '0').toUpperCase()
          );
          setOutputVal(hexArr.join(' '));
        }
      } else if (conversionType === 'binary') {
        if (isDecodeMode) {
          const bin = inputVal.replace(/[^01]/g, '');
          let decoded = '';
          for (let i = 0; i < bin.length; i += 8) {
            const byte = bin.substring(i, i + 8);
            if (byte.length === 8) {
              decoded += String.fromCharCode(parseInt(byte, 2));
            }
          }
          setOutputVal(decoded);
        } else {
          const binArr = Array.from(inputVal).map((c) =>
            c.charCodeAt(0).toString(2).padStart(8, '0')
          );
          setOutputVal(binArr.join(' '));
        }
      } else if (conversionType === 'octal') {
        if (isDecodeMode) {
          const octals = inputVal.trim().split(/\s+/);
          const decoded = octals
            .map((o) => String.fromCharCode(parseInt(o, 8)))
            .join('');
          setOutputVal(decoded);
        } else {
          const octArr = Array.from(inputVal).map((c) =>
            c.charCodeAt(0).toString(8).padStart(3, '0')
          );
          setOutputVal(octArr.join(' '));
        }
      } else if (conversionType === 'rot13') {
        setOutputVal(
          inputVal.replace(/[a-zA-Z]/g, (c) =>
            String.fromCharCode(
              c.charCodeAt(0) + (c.toLowerCase() < 'n' ? 13 : -13)
            )
          )
        );
      } else if (conversionType === 'caesar') {
        const shift = isDecodeMode ? (26 - caesarShift) % 26 : caesarShift;
        const res = inputVal.replace(/[a-zA-Z]/g, (c) => {
          const code = c.charCodeAt(0);
          const base = code >= 97 ? 97 : 65; // 'a' vs 'A'
          return String.fromCharCode(((code - base + shift) % 26) + base);
        });
        setOutputVal(res);
      } else if (conversionType === 'morse') {
        if (isDecodeMode) {
          const words = inputVal.trim().split(' / ');
          const decoded = words
            .map((word) =>
              word
                .split(' ')
                .map((char) => REVERSE_MORSE[char] || '?')
                .join('')
            )
            .join(' ');
          setOutputVal(decoded);
        } else {
          const encoded = inputVal
            .toLowerCase()
            .split('')
            .map((c) => MORSE_MAP[c] || '')
            .filter((x) => x !== '')
            .join(' ');
          setOutputVal(encoded);
        }
      }
    } catch (e: any) {
      setOutputVal(`// Conversion error: ${e.message}`);
    }
  };

  useEffect(() => {
    processConversion();
  }, [inputVal, conversionType, isDecodeMode, caesarShift]);

  // 2. Parse URL
  const parseUrlString = (urlStr: string) => {
    try {
      const parsed = new URL(urlStr);
      setUrlProtocol(parsed.protocol);
      setUrlHost(parsed.hostname);
      setUrlPort(parsed.port || (parsed.protocol === 'https:' ? '443' : '80'));
      setUrlPath(parsed.pathname);
      setUrlHash(parsed.hash);

      const paramsList: { id: string; key: string; value: string }[] = [];
      parsed.searchParams.forEach((value, key) => {
        paramsList.push({
          id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
          key,
          value,
        });
      });
      setUrlParams(paramsList);
    } catch {
      // Ignore parsing errors for partial URL typing
    }
  };

  useEffect(() => {
    parseUrlString(urlInput);
  }, [urlInput]);

  // Regenerate URL string from components
  const rebuildUrl = (params: typeof urlParams) => {
    try {
      const url = new URL(urlInput);
      url.protocol = urlProtocol;
      url.hostname = urlHost;
      if (urlPort && urlPort !== '80' && urlPort !== '443') {
        url.port = urlPort;
      } else {
        url.port = '';
      }
      url.pathname = urlPath;
      url.hash = urlHash;

      // Clear searchParams and reload
      const searchParams = new URLSearchParams();
      params.forEach((p) => {
        if (p.key) searchParams.append(p.key, p.value);
      });
      url.search = searchParams.toString();

      setUrlInput(url.toString());
    } catch (e) {
      // Ignore
    }
  };

  const handleParamChange = (id: string, field: 'key' | 'value', value: string) => {
    const updated = urlParams.map((p) => (p.id === id ? { ...p, [field]: value } : p));
    setUrlParams(updated);
    rebuildUrl(updated);
  };

  const handleAddParam = () => {
    const updated = [
      ...urlParams,
      {
        id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
        key: 'new_param',
        value: 'value',
      },
    ];
    setUrlParams(updated);
    rebuildUrl(updated);
  };

  const handleDeleteParam = (id: string) => {
    const updated = urlParams.filter((p) => p.id !== id);
    setUrlParams(updated);
    rebuildUrl(updated);
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  const handleFileDrop = (e: React.DragEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // If Base64 or standard hex representation is needed
          if (conversionType === 'base64') {
            const rawB64 = reader.result.split(',')[1] || reader.result;
            setInputVal(rawB64);
            setIsDecodeMode(true); // Switch to decode/display
            toast.success(`Loaded file: ${file.name} to Base64`);
          } else {
            setInputVal(reader.result);
          }
        }
      };
      if (conversionType === 'base64') {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    }
  };

  return (
    <Tabs defaultValue="encoders" className="space-y-6">
      <TabsList>
        <TabsTrigger value="encoders" className="gap-2">
          <Code className="h-4 w-4" />
          Encoder / Decoder
        </TabsTrigger>
        <TabsTrigger value="url-parser" className="gap-2">
          <Link className="h-4 w-4" />
          URL Parser & Param Editor
        </TabsTrigger>
      </TabsList>

      {/* --- ENCODER/DECODER TAB --- */}
      <TabsContent value="encoders" className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Input Panel */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-2">
                <div className="flex items-center gap-2">
                  <Select value={conversionType} onValueChange={(v) => setConversionType(v)}>
                    <SelectTrigger className="w-44 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="base64">Base64</SelectItem>
                      <SelectItem value="url">URL Encoding</SelectItem>
                      <SelectItem value="html">HTML Entities</SelectItem>
                      <SelectItem value="hex">Hexadecimal</SelectItem>
                      <SelectItem value="binary">Binary</SelectItem>
                      <SelectItem value="octal">Octal</SelectItem>
                      <SelectItem value="rot13">ROT13</SelectItem>
                      <SelectItem value="caesar">Caesar Cipher</SelectItem>
                      <SelectItem value="morse">Morse Code</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  {conversionType !== 'rot13' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsDecodeMode(!isDecodeMode)}
                      className="h-8 text-xs gap-1"
                    >
                      <ArrowLeftRight className="h-3 w-3" />
                      {isDecodeMode ? 'Decode' : 'Encode'}
                    </Button>
                  )}
                </div>

                {conversionType === 'caesar' && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <Label htmlFor="caesar-shift">Shift</Label>
                    <Input
                      id="caesar-shift"
                      type="number"
                      min={1}
                      max={25}
                      className="w-12 h-7 p-1 text-center"
                      value={caesarShift}
                      onChange={(e) => setCaesarShift(Number(e.target.value))}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="conv-input">Input String</Label>
                <Textarea
                  id="conv-input"
                  placeholder={
                    conversionType === 'base64' && !isDecodeMode
                      ? 'Type string to encode, or drag & drop files here to Base64 encode...'
                      : 'Type string to convert...'
                  }
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleFileDrop}
                  className="font-mono text-xs h-60 resize-y"
                />
              </div>
            </CardContent>
          </Card>

          {/* Output Panel */}
          <Card className="h-full flex flex-col justify-between">
            <CardContent className="p-4 flex-1 flex flex-col space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="text-sm font-bold">Converted Output</span>
                <Button variant="outline" size="sm" onClick={() => handleCopyText(outputVal, 'Output')} className="h-7 text-xs">
                  <Copy className="h-3 w-3 mr-1" />
                  Copy Output
                </Button>
              </div>

              <Textarea
                value={outputVal}
                readOnly
                className="font-mono text-xs flex-1 h-60 resize-y select-all"
              />
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* --- URL PARSER TAB --- */}
      <TabsContent value="url-parser" className="space-y-6">
        <div className="space-y-4">
          {/* Main URL input bar */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="url-bar" className="font-bold text-sm">Target URL</Label>
                  <Button variant="ghost" size="icon-sm" onClick={() => handleCopyText(urlInput, 'URL')} className="h-6 w-6 text-muted-foreground">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <Input
                  id="url-bar"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-6 md:grid-cols-3">
            {/* Component breakdown */}
            <Card className="md:col-span-1">
              <CardContent className="p-4 space-y-4 text-xs font-mono">
                <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground uppercase border-b pb-2">
                  <Info className="h-3.5 w-3.5" />
                  Structure Breakdown
                </div>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <span className="text-muted-foreground text-[10px]">Protocol / Scheme:</span>
                    <Input value={urlProtocol} onChange={(e) => { setUrlProtocol(e.target.value); rebuildUrl(urlParams); }} className="h-8 text-xs font-mono text-primary font-bold" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground text-[10px]">Host / Domain:</span>
                    <Input value={urlHost} onChange={(e) => { setUrlHost(e.target.value); rebuildUrl(urlParams); }} className="h-8 text-xs font-mono" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground text-[10px]">Port:</span>
                    <Input value={urlPort} onChange={(e) => { setUrlPort(e.target.value); rebuildUrl(urlParams); }} className="h-8 text-xs font-mono" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground text-[10px]">Path:</span>
                    <Input value={urlPath} onChange={(e) => { setUrlPath(e.target.value); rebuildUrl(urlParams); }} className="h-8 text-xs font-mono" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-muted-foreground text-[10px]">Hash / Anchor:</span>
                    <Input value={urlHash} onChange={(e) => { setUrlHash(e.target.value); rebuildUrl(urlParams); }} className="h-8 text-xs font-mono text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Query parameters table editor */}
            <Card className="md:col-span-2">
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between border-b pb-2">
                  <h3 className="font-semibold text-sm flex items-center gap-1.5">
                    <Braces className="h-4 w-4 text-primary" />
                    Query Parameters ({urlParams.length})
                  </h3>
                  <Button variant="outline" size="sm" onClick={handleAddParam} className="h-7 text-xs">
                    <Plus className="h-3 w-3 mr-1" />
                    Add Parameter
                  </Button>
                </div>

                {urlParams.length > 0 ? (
                  <div className="rounded-md border overflow-hidden">
                    <table className="w-full text-xs font-mono border-collapse text-left">
                      <thead className="bg-muted/40 border-b">
                        <tr>
                          <th className="p-2 border-r w-1/3 font-semibold text-muted-foreground">Parameter Key</th>
                          <th className="p-2 border-r font-semibold text-muted-foreground">Value</th>
                          <th className="p-2 w-16"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {urlParams.map((p) => (
                          <tr key={p.id} className="border-b hover:bg-muted/10 last:border-0">
                            <td className="p-2 border-r">
                              <Input
                                value={p.key}
                                onChange={(e) => handleParamChange(p.id, 'key', e.target.value)}
                                className="h-7 text-xs font-mono"
                              />
                            </td>
                            <td className="p-2 border-r">
                              <Input
                                value={p.value}
                                onChange={(e) => handleParamChange(p.id, 'value', e.target.value)}
                                className="h-7 text-xs font-mono"
                              />
                            </td>
                            <td className="p-2 text-center">
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                onClick={() => handleDeleteParam(p.id)}
                                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-12 text-xs text-muted-foreground italic">
                    No query parameters found in this URL. Click 'Add Parameter' above to add one.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}
