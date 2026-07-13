'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Copy, Download, RefreshCw, Eye, EyeOff, Search, Settings2, Sparkles, HelpCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { generateV4, generateV1, generateUlid, generateNanoId, generateV5, decodeUuidV1 } from '@/lib/uuid';
import { toast } from 'sonner';

const NAMESPACES = {
  DNS: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
  URL: '6ba7b811-9dad-11d1-80b4-00c04fd430c8',
  OID: '6ba7b812-9dad-11d1-80b4-00c04fd430c8',
  X500: '6ba7b814-9dad-11d1-80b4-00c04fd430c8',
};

export function UuidTool() {
  const [version, setVersion] = useState<string>('v4');
  const [quantity, setQuantity] = useState<number>(10);
  
  // Format options
  const [uppercase, setUppercase] = useState<boolean>(false);
  const [braces, setBraces] = useState<boolean>(false);
  const [noHyphens, setNoHyphens] = useState<boolean>(false);

  // NanoID Custom Options
  const [nanoSize, setNanoSize] = useState<number>(21);
  const [nanoAlphabet, setNanoAlphabet] = useState<string>('ModuleSymbhasOwnPr-0123456789ABCDEFGHNRVfgctiUOpqradsjhUXVWhwzI');

  // UUID v5 Options
  const [v5Namespace, setV5Namespace] = useState<string>(NAMESPACES.DNS);
  const [v5CustomNamespace, setV5CustomNamespace] = useState<string>('');
  const [v5Name, setV5Name] = useState<string>('example.com');

  // Outputs
  const [generatedList, setGeneratedList] = useState<string[]>([]);

  // Decoder State
  const [decoderInput, setDecoderInput] = useState<string>('');
  const [decodedDetails, setDecodedDetails] = useState<ReturnType<typeof decodeUuidV1>>(null);

  const handleGenerate = useCallback(async () => {
    try {
      const results: string[] = [];
      const qty = Math.max(1, Math.min(1000, quantity));

      for (let i = 0; i < qty; i++) {
        let rawId = '';
        if (version === 'v4') {
          rawId = generateV4();
        } else if (version === 'v1') {
          rawId = generateV1();
        } else if (version === 'ulid') {
          rawId = generateUlid();
        } else if (version === 'nanoid') {
          rawId = generateNanoId(nanoSize, nanoAlphabet);
        } else if (version === 'v5') {
          const ns = v5Namespace === 'custom' ? v5CustomNamespace : v5Namespace;
          rawId = await generateV5(ns, v5Name + (qty > 1 ? `-${i}` : ''));
        }

        // Apply formatting (only applicable to standard UUID formats, not NanoID or ULID which shouldn't have hyphens added or uppercase forced unless specified)
        let formattedId = rawId;
        if (version === 'v4' || version === 'v1' || version === 'v5') {
          if (noHyphens) {
            formattedId = formattedId.replace(/-/g, '');
          }
          if (uppercase) {
            formattedId = formattedId.toUpperCase();
          }
          if (braces) {
            formattedId = `{${formattedId}}`;
          }
        } else {
          // General formatting for ULID/NanoID
          if (uppercase) {
            formattedId = formattedId.toUpperCase();
          }
        }

        results.push(formattedId);
      }

      setGeneratedList(results);
    } catch (e: any) {
      toast.error(e.message || 'Generation failed');
    }
  }, [version, quantity, uppercase, braces, noHyphens, nanoSize, nanoAlphabet, v5Namespace, v5CustomNamespace, v5Name]);

  useEffect(() => {
    // handleGenerate does genuine async work for v5 (SHA-1 hashing) and random generation
    // for v4/v1/ULID/NanoID; it can't be a pure useMemo.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    handleGenerate();
  }, [handleGenerate]);

  const handleCopyAll = () => {
    const text = generatedList.join('\n');
    navigator.clipboard.writeText(text);
    toast.success('All IDs copied!');
  };

  const handleDownload = (format: 'txt' | 'json') => {
    let content = '';
    let mimeType = 'text/plain';
    let filename = `generated-ids.${format}`;

    if (format === 'json') {
      content = JSON.stringify(generatedList, null, 2);
      mimeType = 'application/json';
    } else {
      content = generatedList.join('\n');
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

  // Decode UUID v1 input changes
  const handleDecodeInput = (val: string) => {
    setDecoderInput(val);
    const details = decodeUuidV1(val);
    setDecodedDetails(details);
  };

  return (
    <Tabs defaultValue="generator" className="space-y-6">
      <TabsList>
        <TabsTrigger value="generator" className="gap-2">
          <Sparkles className="h-4 w-4" />
          UUID/ULID Generator
        </TabsTrigger>
        <TabsTrigger value="decoder" className="gap-2">
          <Search className="h-4 w-4" />
          UUID v1 Decoder
        </TabsTrigger>
      </TabsList>

      {/* --- GENERATOR TAB --- */}
      <TabsContent value="generator" className="space-y-6">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Controls Side */}
          <div className="md:col-span-1 space-y-4">
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b">
                  <Settings2 className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-sm">Generator Settings</h3>
                </div>

                {/* ID Type */}
                <div className="space-y-1.5">
                  <Label htmlFor="id-version">Identifier Type</Label>
                  <Select value={version} onValueChange={(v) => setVersion(v)}>
                    <SelectTrigger id="id-version">
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
                <div className="space-y-1.5">
                  <Label htmlFor="quantity">Quantity (Max 1000)</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min={1}
                    max={1000}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                  />
                </div>

                {/* --- NanoID Custom Options --- */}
                {version === 'nanoid' && (
                  <div className="space-y-3 p-3 bg-muted/40 rounded-md border border-dashed text-xs">
                    <div className="space-y-1.5">
                      <Label htmlFor="nano-size">NanoID Size</Label>
                      <Input
                        id="nano-size"
                        type="number"
                        min={1}
                        max={128}
                        value={nanoSize}
                        onChange={(e) => setNanoSize(Number(e.target.value))}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="nano-alphabet">Alphabet</Label>
                      <Input
                        id="nano-alphabet"
                        value={nanoAlphabet}
                        onChange={(e) => setNanoAlphabet(e.target.value)}
                        className="font-mono text-[10px]"
                      />
                    </div>
                  </div>
                )}

                {/* --- UUID v5 Custom Options --- */}
                {version === 'v5' && (
                  <div className="space-y-3 p-3 bg-muted/40 rounded-md border border-dashed text-xs">
                    <div className="space-y-1.5">
                      <Label htmlFor="v5-namespace">Namespace</Label>
                      <Select value={v5Namespace} onValueChange={(v) => setV5Namespace(v)}>
                        <SelectTrigger id="v5-namespace">
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

                    {v5Namespace === 'custom' && (
                      <div className="space-y-1.5">
                        <Label htmlFor="v5-custom-ns">Namespace UUID</Label>
                        <Input
                          id="v5-custom-ns"
                          placeholder="e.g. 6ba7b810-9dad-11d1-80b4-00c04fd430c8"
                          value={v5CustomNamespace}
                          onChange={(e) => setV5CustomNamespace(e.target.value)}
                          className="font-mono text-xs"
                        />
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <Label htmlFor="v5-name">Input Name</Label>
                      <Input
                        id="v5-name"
                        value={v5Name}
                        onChange={(e) => setV5Name(e.target.value)}
                      />
                    </div>
                  </div>
                )}

                {/* Formatting Toggles (Only standard UUID fields) */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="uppercase-toggle" className="text-xs">Force UPPERCASE</Label>
                    <Switch
                      id="uppercase-toggle"
                      checked={uppercase}
                      onCheckedChange={(checked) => setUppercase(checked)}
                    />
                  </div>

                  {(version === 'v4' || version === 'v1' || version === 'v5') && (
                    <>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="braces-toggle" className="text-xs">Wrap with Braces `{"{...}"}`</Label>
                        <Switch
                          id="braces-toggle"
                          checked={braces}
                          onCheckedChange={(checked) => setBraces(checked)}
                        />
                      </div>

                      <div className="flex items-center justify-between">
                        <Label htmlFor="hyphen-toggle" className="text-xs">Remove Hyphens</Label>
                        <Switch
                          id="hyphen-toggle"
                          checked={noHyphens}
                          onCheckedChange={(checked) => setNoHyphens(checked)}
                        />
                      </div>
                    </>
                  )}
                </div>

                <Button onClick={handleGenerate} className="w-full text-xs">
                  <RefreshCw className="h-3 w-3 mr-1" />
                  Regenerate
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Results Side */}
          <div className="md:col-span-2 space-y-4">
            <Card className="h-full flex flex-col justify-between">
              <CardContent className="p-4 flex-1 flex flex-col space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                  <span className="text-sm font-bold flex items-center gap-2">
                    Generated Output
                    <Badge variant="secondary" className="text-[10px] font-mono">
                      Qty: {generatedList.length}
                    </Badge>
                  </span>
                  <div className="flex items-center gap-1.5">
                    <Button variant="outline" size="sm" onClick={handleCopyAll} className="h-7 text-xs">
                      <Copy className="h-3 w-3 mr-1" />
                      Copy All
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDownload('txt')} className="h-7 text-xs">
                      <Download className="h-3 w-3 mr-1" />
                      TXT
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDownload('json')} className="h-7 text-xs">
                      <Download className="h-3 w-3 mr-1" />
                      JSON
                    </Button>
                  </div>
                </div>

                {/* Bulk Output Textarea */}
                <Textarea
                  value={generatedList.join('\n')}
                  readOnly
                  className="font-mono text-xs flex-1 h-80 min-h-[250px] resize-y select-all"
                />

                {/* Meta details if UUID v1 */}
                {version === 'v1' && generatedList.length > 0 && (
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

      {/* --- DECODER TAB --- */}
      <TabsContent value="decoder" className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Input Side */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="decoder-input" className="font-bold text-sm">Enter UUID v1 Token</Label>
                <Input
                  id="decoder-input"
                  placeholder="e.g. d68a3f80-0a8b-11ed-b57d-0800200c9a66"
                  value={decoderInput}
                  onChange={(e) => handleDecodeInput(e.target.value)}
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
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-bold text-sm border-b pb-2">Decoded Metadata</h3>
              {decodedDetails ? (
                <div className="space-y-3 font-mono text-xs">
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">Creation Date (UTC):</span>
                    <span className="font-bold text-primary">{decodedDetails.timestamp}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">Local Date/Time:</span>
                    <span className="font-bold">{new Date(decodedDetails.timestamp).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b">
                    <span className="text-muted-foreground">Node Identifier (MAC):</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{decodedDetails.node}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-muted-foreground">Clock Sequence:</span>
                    <span>{decodedDetails.clockSequence}</span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-10">
                  <HelpCircle className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">
                    {decoderInput 
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
  );
}
