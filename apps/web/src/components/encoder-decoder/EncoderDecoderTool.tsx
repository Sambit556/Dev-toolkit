'use client';

import React, { useState, useMemo } from 'react';
import { RefreshCw, Copy, ArrowLeftRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
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
  const [isDecodeMode, setIsDecodeMode] = useState<boolean>(false);
  const [caesarShift, setCaesarShift] = useState<number>(3);

  // 1. Convert Text (Encode/Decode)
  const outputVal = useMemo(() => {
    if (!inputVal) {
      return '';
    }

    try {
      if (conversionType === 'base64') {
        if (isDecodeMode) {
          return decodeURIComponent(escape(atob(inputVal)));
        } else {
          return btoa(unescape(encodeURIComponent(inputVal)));
        }
      } else if (conversionType === 'url') {
        if (isDecodeMode) {
          return decodeURIComponent(inputVal);
        } else {
          return encodeURIComponent(inputVal);
        }
      } else if (conversionType === 'html') {
        if (isDecodeMode) {
          const doc = new DOMParser().parseFromString(inputVal, 'text/html');
          return doc.documentElement.textContent || '';
        } else {
          const div = document.createElement('div');
          div.textContent = inputVal;
          return div.innerHTML;
        }
      } else if (conversionType === 'hex') {
        if (isDecodeMode) {
          const hex = inputVal.replace(/[^0-9A-Fa-f]/g, '');
          let decoded = '';
          for (let i = 0; i < hex.length; i += 2) {
            decoded += String.fromCharCode(parseInt(hex.substring(i, i + 2), 16));
          }
          return decoded;
        } else {
          const hexArr = Array.from(inputVal).map((c) =>
            c.charCodeAt(0).toString(16).padStart(2, '0').toUpperCase()
          );
          return hexArr.join(' ');
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
          return decoded;
        } else {
          const binArr = Array.from(inputVal).map((c) =>
            c.charCodeAt(0).toString(2).padStart(8, '0')
          );
          return binArr.join(' ');
        }
      } else if (conversionType === 'octal') {
        if (isDecodeMode) {
          const octals = inputVal.trim().split(/\s+/);
          return octals
            .map((o) => String.fromCharCode(parseInt(o, 8)))
            .join('');
        } else {
          const octArr = Array.from(inputVal).map((c) =>
            c.charCodeAt(0).toString(8).padStart(3, '0')
          );
          return octArr.join(' ');
        }
      } else if (conversionType === 'rot13') {
        return inputVal.replace(/[a-zA-Z]/g, (c) =>
          String.fromCharCode(
            c.charCodeAt(0) + (c.toLowerCase() < 'n' ? 13 : -13)
          )
        );
      } else if (conversionType === 'caesar') {
        const shift = isDecodeMode ? (26 - caesarShift) % 26 : caesarShift;
        return inputVal.replace(/[a-zA-Z]/g, (c) => {
          const code = c.charCodeAt(0);
          const base = code >= 97 ? 97 : 65; // 'a' vs 'A'
          return String.fromCharCode(((code - base + shift) % 26) + base);
        });
      } else if (conversionType === 'morse') {
        if (isDecodeMode) {
          const words = inputVal.trim().split(' / ');
          return words
            .map((word) =>
              word
                .split(' ')
                .map((char) => REVERSE_MORSE[char] || '?')
                .join('')
            )
            .join(' ');
        } else {
          return inputVal
            .toLowerCase()
            .split('')
            .map((c) => MORSE_MAP[c] || '')
            .filter((x) => x !== '')
            .join(' ');
        }
      }
      return '';
    } catch (e: any) {
      return `// Conversion error: ${e.message}`;
    }
  }, [inputVal, conversionType, isDecodeMode, caesarShift]);

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
          if (conversionType === 'base64') {
            const rawB64 = reader.result.split(',')[1] || reader.result;
            setInputVal(rawB64);
            setIsDecodeMode(true);
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
    <div className="space-y-6">
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
                    <SelectItem value="base64">Base64 Encode/Decode</SelectItem>
                    <SelectItem value="url">URL Query Enc/Dec</SelectItem>
                    <SelectItem value="html">HTML Entities Enc/Dec</SelectItem>
                    <SelectItem value="hex">Hexadecimal Code</SelectItem>
                    <SelectItem value="binary">Binary Bits Represent</SelectItem>
                    <SelectItem value="octal">Octal Numbers Format</SelectItem>
                    <SelectItem value="rot13">ROT13 Cipher</SelectItem>
                    <SelectItem value="caesar">Caesar Substitution</SelectItem>
                    <SelectItem value="morse">Morse Code Audio Dots</SelectItem>
                  </SelectContent>
                </Select>

                {conversionType === 'caesar' && (
                  <div className="flex items-center gap-1.5 ml-2">
                    <Label htmlFor="caesar-shift" className="text-[10px] uppercase font-bold text-muted-foreground shrink-0">Shift:</Label>
                    <Input
                      id="caesar-shift"
                      type="number"
                      min="1"
                      max="25"
                      value={caesarShift}
                      onChange={(e) => setCaesarShift(Number(e.target.value))}
                      className="w-14 h-7 text-xs font-mono font-bold"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant={!isDecodeMode ? 'default' : 'outline'}
                  onClick={() => setIsDecodeMode(false)}
                  className="h-7.5 text-[11px] font-bold"
                >
                  Encode
                </Button>
                <Button
                  size="sm"
                  variant={isDecodeMode ? 'default' : 'outline'}
                  onClick={() => setIsDecodeMode(true)}
                  className="h-7.5 text-[11px] font-bold"
                >
                  Decode
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="raw-input" className="font-bold text-xs">
                  {isDecodeMode ? 'Encoded Input String' : 'Raw Text String'}
                </Label>
                <span className="text-[10px] text-muted-foreground/80">Drag and drop file here</span>
              </div>
              <Textarea
                id="raw-input"
                placeholder={isDecodeMode ? 'Paste code to decode...' : 'Type plain text to encode...'}
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleFileDrop}
                className="h-72 text-xs font-mono bg-background/50 leading-relaxed scrollbar-thin"
              />
              <div className="flex justify-between items-center text-[10px] text-muted-foreground px-0.5">
                <span>Lines: {inputVal.split('\n').length}</span>
                <span>Length: {inputVal.length} chars</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Output Panel */}
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between border-b pb-2 h-8">
              <span className="font-bold text-xs flex items-center gap-1 text-primary">
                <ArrowLeftRight className="h-3.5 w-3.5" />
                Processed Result Output
              </span>

              <div className="flex items-center gap-1.5">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => handleCopyText(outputVal, 'Result')}
                      disabled={!outputVal}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy result string</TooltipContent>
                </Tooltip>
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
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Swap Input and Output</TooltipContent>
                </Tooltip>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="conv-output" className="font-bold text-xs">
                {isDecodeMode ? 'Decoded Text Output' : 'Encoded Format Output'}
              </Label>
              <Textarea
                id="conv-output"
                readOnly
                placeholder="Result output will render here..."
                value={outputVal}
                className="h-72 text-xs font-mono bg-muted/30 leading-relaxed scrollbar-thin focus-visible:ring-0"
              />
              <div className="flex justify-between items-center text-[10px] text-muted-foreground px-0.5">
                <span>Lines: {outputVal.split('\n').length}</span>
                <span>Length: {outputVal.length} chars</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
