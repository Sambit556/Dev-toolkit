'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { ShieldAlert, ShieldCheck, Copy, RefreshCw, Key, Braces, Layers, HelpCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CodeEditor } from '@/components/ui/CodeEditor';
import { decodeJwt, verifySignature, signJwt } from '@/lib/jwt';
import { toast } from 'sonner';

const ALGORITHMS = ['HS256', 'HS384', 'HS512', 'RS256'];

const DEFAULT_HEADER = {
  alg: 'HS256',
  typ: 'JWT',
};

const DEFAULT_PAYLOAD = {
  sub: '1234567890',
  name: 'John Doe',
  admin: true,
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600,
};

const SAMPLE_PRIVATE_KEY = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC6+D5a9e3...
(RS256 is supported; please paste your real PEM key for signing)
-----END PRIVATE KEY-----`;

const SAMPLE_PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAuvg+WvXt7...
(RS256 is supported; please paste your real PEM key for verification)
-----END PUBLIC KEY-----`;

export function JwtTool() {
  const [tokenInput, setTokenInput] = useState('');
  const [secretKey, setSecretKey] = useState('your-256-bit-secret');
  const [algorithm, setAlgorithm] = useState('HS256');
  
  // Decoding states
  const [decoded, setDecoded] = useState<ReturnType<typeof decodeJwt>>(null);
  const [isVerified, setIsVerified] = useState<boolean | null>(null);
  const [verifying, setVerifying] = useState(false);

  // Encoding states
  const [encHeader, setEncHeader] = useState(JSON.stringify(DEFAULT_HEADER, null, 2));
  const [encPayload, setEncPayload] = useState(JSON.stringify(DEFAULT_PAYLOAD, null, 2));
  const [encSecret, setEncSecret] = useState('your-256-bit-secret');
  const [encodedToken, setEncodedToken] = useState('');

  // 1. Decode JWT input changes
  const handleDecode = useCallback(async () => {
    if (!tokenInput) {
      setDecoded(null);
      setIsVerified(null);
      return;
    }

    const res = decodeJwt(tokenInput);
    setDecoded(res);

    if (res) {
      const alg = res.header.alg || 'HS256';
      setAlgorithm(alg);
      setVerifying(true);
      try {
        const verified = await verifySignature(tokenInput, secretKey, alg);
        setIsVerified(verified);
      } catch (err) {
        setIsVerified(false);
      } finally {
        setVerifying(false);
      }
    } else {
      setIsVerified(null);
    }
  }, [tokenInput, secretKey]);

  useEffect(() => {
    handleDecode();
  }, [tokenInput, secretKey, handleDecode]);

  // 2. Encode JWT changes
  const handleEncode = useCallback(async () => {
    try {
      const headerObj = JSON.parse(encHeader);
      const payloadObj = JSON.parse(encPayload);
      const token = await signJwt(headerObj, payloadObj, encSecret);
      setEncodedToken(token);
    } catch (e: any) {
      setEncodedToken(`// Error: ${e.message || 'Invalid JSON format'}`);
    }
  }, [encHeader, encPayload, encSecret]);

  useEffect(() => {
    handleEncode();
  }, [encHeader, encPayload, encSecret, handleEncode]);

  const loadExample = () => {
    const payload = {
      ...DEFAULT_PAYLOAD,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600,
    };
    const header = { ...DEFAULT_HEADER };
    
    setEncHeader(JSON.stringify(header, null, 2));
    setEncPayload(JSON.stringify(payload, null, 2));
    setEncSecret('my-secret-key-123456');

    toast.success('Loaded HS256 Example!');
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const formatTimestamp = (ts: any) => {
    if (typeof ts !== 'number') return '';
    try {
      const d = new Date(ts * 1000);
      return `(${d.toLocaleString()})`;
    } catch {
      return '';
    }
  };

  // Styled representation of JWT in parts
  const getStyledJwt = () => {
    if (!tokenInput) return <span className="text-muted-foreground font-mono text-sm">Paste a JWT token here...</span>;
    const parts = tokenInput.split('.');
    return (
      <span className="font-mono text-sm break-all leading-normal">
        <span className="text-red-500 font-semibold">{parts[0]}</span>
        {parts[1] && <span className="text-muted-foreground">.</span>}
        {parts[1] && <span className="text-purple-500 font-semibold">{parts[1]}</span>}
        {parts[2] && <span className="text-muted-foreground">.</span>}
        {parts[2] && <span className="text-emerald-500 font-semibold">{parts[2]}</span>}
      </span>
    );
  };

  return (
    <Tabs defaultValue="decode" className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <TabsList>
          <TabsTrigger value="decode" className="gap-2">
            <Braces className="h-4 w-4" />
            Decode JWT
          </TabsTrigger>
          <TabsTrigger value="encode" className="gap-2">
            <Layers className="h-4 w-4" />
            Encode / Sign JWT
          </TabsTrigger>
        </TabsList>

        <Button variant="outline" size="sm" onClick={loadExample} className="text-xs">
          <RefreshCw className="h-3 w-3 mr-1" />
          Load Example
        </Button>
      </div>

      {/* --- DECODER TAB --- */}
      <TabsContent value="decode" className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Left Column: Token Input */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="jwt-input" className="font-bold text-sm">Paste JWT Token</Label>
                  {tokenInput && (
                    <Button variant="ghost" size="icon-sm" onClick={() => setTokenInput('')} className="h-6 w-6">
                      Clear
                    </Button>
                  )}
                </div>
                <Textarea
                  id="jwt-input"
                  className="font-mono h-40 text-xs resize-none"
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value.trim())}
                />
                
                {/* Styled visual breakdown */}
                {tokenInput && (
                  <div className="p-3 bg-muted/40 rounded-md border border-dashed">
                    <p className="text-[10px] text-muted-foreground mb-1 font-semibold uppercase">Token Breakdown Preview</p>
                    <div className="max-h-24 overflow-y-auto">{getStyledJwt()}</div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-primary" />
                  <Label htmlFor="jwt-verify-secret" className="font-bold text-sm">Signature Secret / Public Key</Label>
                </div>
                <div className="space-y-2">
                  {algorithm.startsWith('RS') ? (
                    <Textarea
                      id="jwt-verify-secret"
                      className="font-mono text-xs h-32"
                      placeholder="Paste RS256 PEM Public Key..."
                      value={secretKey.includes('your-256-bit') ? SAMPLE_PUBLIC_KEY : secretKey}
                      onChange={(e) => setSecretKey(e.target.value)}
                    />
                  ) : (
                    <Input
                      id="jwt-verify-secret"
                      type="text"
                      className="font-mono text-xs"
                      placeholder="Enter HMAC Secret..."
                      value={secretKey}
                      onChange={(e) => setSecretKey(e.target.value)}
                    />
                  )}
                  <p className="text-[11px] text-muted-foreground leading-normal">
                    HMAC secret for HS256/384/512 or RSA SPKI Public Key (PEM format) for RS256. 
                    Calculates signature verification fully in browser.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Parsed Outputs */}
          <div className="space-y-4">
            {/* Signature Status */}
            {tokenInput && (
              <Card className={`border-2 ${isVerified ? 'border-emerald-500/30 bg-emerald-50/5 dark:bg-emerald-950/5' : 'border-destructive/30 bg-destructive/5'}`}>
                <CardContent className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    {isVerified ? (
                      <ShieldCheck className="h-6 w-6 text-emerald-500 shrink-0" />
                    ) : (
                      <ShieldAlert className="h-6 w-6 text-destructive shrink-0" />
                    )}
                    <div>
                      <h4 className="font-bold text-sm">{isVerified ? 'Signature Verified' : 'Invalid Signature'}</h4>
                      <p className="text-xs text-muted-foreground">
                        {isVerified 
                          ? 'Token payload and header signature matched.' 
                          : 'Check if key or algorithm matches this token.'}
                      </p>
                    </div>
                  </div>
                  <Badge variant={isVerified ? 'success' : 'destructive'} className="text-[10px] font-mono">
                    {algorithm}
                  </Badge>
                </CardContent>
              </Card>
            )}

            {/* Header section */}
            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-red-500" />
                    <span className="text-xs font-bold text-red-500 uppercase tracking-wider">Header</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono">Algorithm & Token Type</span>
                </div>
                {decoded ? (
                  <CodeEditor
                    language="json"
                    value={JSON.stringify(decoded.header, null, 2)}
                    readOnly
                    height="120px"
                  />
                ) : (
                  <p className="text-xs text-muted-foreground italic py-6 text-center">Enter valid token to view Header</p>
                )}
              </CardContent>
            </Card>

            {/* Payload section */}
            <Card>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between border-b pb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-purple-500" />
                    <span className="text-xs font-bold text-purple-500 uppercase tracking-wider">Payload</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono">Claims & Custom Data</span>
                </div>
                {decoded ? (
                  <div className="space-y-4">
                    <CodeEditor
                      language="json"
                      value={JSON.stringify(decoded.payload, null, 2)}
                      readOnly
                      height="200px"
                    />

                    {/* Unix Timestamp interpretations */}
                    {(decoded.payload.exp || decoded.payload.iat || decoded.payload.nbf) && (
                      <div className="text-[11px] space-y-1 p-2.5 bg-muted/40 rounded-md border border-dashed font-mono">
                        <p className="text-[9px] font-bold text-muted-foreground uppercase mb-1">Time Claims Translation</p>
                        {decoded.payload.iat && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Issued At (iat):</span>
                            <span>{decoded.payload.iat} {formatTimestamp(decoded.payload.iat)}</span>
                          </div>
                        )}
                        {decoded.payload.exp && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Expiration (exp):</span>
                            <span>{decoded.payload.exp} {formatTimestamp(decoded.payload.exp)}</span>
                          </div>
                        )}
                        {decoded.payload.nbf && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Not Before (nbf):</span>
                            <span>{decoded.payload.nbf} {formatTimestamp(decoded.payload.nbf)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic py-10 text-center">Enter valid token to view Payload</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Claims Breakdown Guide */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <h4 className="text-sm font-semibold flex items-center gap-1">
              <HelpCircle className="h-4 w-4 text-primary" />
              Standard JWT Claims Reference
            </h4>
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 text-xs leading-normal">
              <div className="space-y-1 border-r pr-2 last:border-0">
                <code className="bg-muted px-1.5 py-0.5 rounded font-bold text-primary">iss</code>
                <p className="text-muted-foreground"><strong>Issuer:</strong> Identifies who issued the JWT token.</p>
              </div>
              <div className="space-y-1 border-r pr-2 last:border-0">
                <code className="bg-muted px-1.5 py-0.5 rounded font-bold text-primary">sub</code>
                <p className="text-muted-foreground"><strong>Subject:</strong> Identifies the principal/user of the token.</p>
              </div>
              <div className="space-y-1 border-r pr-2 last:border-0">
                <code className="bg-muted px-1.5 py-0.5 rounded font-bold text-primary">aud</code>
                <p className="text-muted-foreground"><strong>Audience:</strong> Identifies the recipients/services the JWT is intended for.</p>
              </div>
              <div className="space-y-1 border-r pr-2 last:border-0">
                <code className="bg-muted px-1.5 py-0.5 rounded font-bold text-primary">exp</code>
                <p className="text-muted-foreground"><strong>Expiration Time:</strong> Unix timestamp indicating when the token expires.</p>
              </div>
              <div className="space-y-1 border-r pr-2 last:border-0">
                <code className="bg-muted px-1.5 py-0.5 rounded font-bold text-primary">iat</code>
                <p className="text-muted-foreground"><strong>Issued At:</strong> Unix timestamp indicating when the token was created.</p>
              </div>
              <div className="space-y-1 last:border-0">
                <code className="bg-muted px-1.5 py-0.5 rounded font-bold text-primary">nbf</code>
                <p className="text-muted-foreground"><strong>Not Before:</strong> Unix timestamp indicating when the token becomes active.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      {/* --- ENCODER TAB --- */}
      <TabsContent value="encode" className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Controls & Inputs */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="alg-select">Algorithm</Label>
                    <Select
                      value={algorithm}
                      onValueChange={(val) => {
                        setAlgorithm(val);
                        const hdrObj = JSON.parse(encHeader);
                        hdrObj.alg = val;
                        setEncHeader(JSON.stringify(hdrObj, null, 2));
                      }}
                    >
                      <SelectTrigger id="alg-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {ALGORITHMS.map((alg) => (
                          <SelectItem key={alg} value={alg}>
                            {alg}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="token-typ">Token Type</Label>
                    <Input id="token-typ" value="JWT" disabled />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Header JSON</Label>
                  <CodeEditor
                    language="json"
                    value={encHeader}
                    onChange={(v) => setEncHeader(v)}
                    height="120px"
                  />
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label>Payload JSON</Label>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => {
                        const nextPayload = {
                          ...DEFAULT_PAYLOAD,
                          iat: Math.floor(Date.now() / 1000),
                          exp: Math.floor(Date.now() / 1000) + 3600,
                        };
                        setEncPayload(JSON.stringify(nextPayload, null, 2));
                      }}
                      className="h-6 text-[10px] text-primary"
                    >
                      Refresh Epochs
                    </Button>
                  </div>
                  <CodeEditor
                    language="json"
                    value={encPayload}
                    onChange={(v) => setEncPayload(v)}
                    height="200px"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-primary" />
                  <Label htmlFor="enc-secret" className="font-bold text-sm">Signing Key (Secret / Private PEM)</Label>
                </div>
                {algorithm.startsWith('RS') ? (
                  <Textarea
                    id="enc-secret"
                    className="font-mono text-xs h-32"
                    placeholder="Paste RS256 PKCS#8 Private Key PEM..."
                    value={encSecret.includes('your-256-bit') ? SAMPLE_PRIVATE_KEY : encSecret}
                    onChange={(e) => setEncSecret(e.target.value)}
                  />
                ) : (
                  <Input
                    id="enc-secret"
                    type="text"
                    className="font-mono text-xs"
                    value={encSecret}
                    onChange={(e) => setEncSecret(e.target.value)}
                  />
                )}
                <p className="text-[11px] text-muted-foreground leading-normal">
                  HMAC secret key or PKCS8 Private Key PEM for RSA signing. All signing occurs locally.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Outputs */}
          <Card className="flex flex-col h-full min-h-[350px]">
            <CardContent className="p-4 flex-1 flex flex-col space-y-4 justify-between">
              <div className="space-y-2 flex-1 flex flex-col">
                <div className="flex items-center justify-between pb-2 border-b">
                  <span className="text-sm font-bold">Generated Signed Token</span>
                  {!encodedToken.startsWith('//') && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(encodedToken, 'Signed token')}
                      className="h-7 text-xs"
                    >
                      <Copy className="h-3 w-3 mr-1" />
                      Copy Token
                    </Button>
                  )}
                </div>
                <div className="flex-1 rounded-md border bg-muted/40 p-3 select-all overflow-y-auto font-mono text-xs max-h-80 break-all leading-relaxed whitespace-pre-wrap select-all">
                  {encodedToken}
                </div>
              </div>

              {/* Decoded visual summary of encoded result */}
              {!encodedToken.startsWith('//') && (
                <div className="p-3 bg-muted/30 border border-dashed rounded-md space-y-2 text-xs">
                  <p className="text-[9px] uppercase font-bold text-muted-foreground">Real-time Signature Check</p>
                  <div className="flex items-center gap-1.5 font-semibold text-emerald-600">
                    <ShieldCheck className="h-4 w-4" />
                    Generated and signed successfully client-side!
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
}
