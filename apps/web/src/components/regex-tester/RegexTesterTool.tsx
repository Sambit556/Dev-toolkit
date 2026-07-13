'use client';

import React, { useMemo, useState } from 'react';
import { Regex, Copy, AlertTriangle, CheckCircle2, ArrowLeftRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { toast } from 'sonner';

interface FlagDef {
  key: 'g' | 'i' | 'm' | 's' | 'u' | 'y';
  label: string;
  hint: string;
}

const FLAGS: FlagDef[] = [
  { key: 'g', label: 'g', hint: 'Global — find all matches' },
  { key: 'i', label: 'i', hint: 'Case insensitive' },
  { key: 'm', label: 'm', hint: 'Multiline — ^ and $ match line boundaries' },
  { key: 's', label: 's', hint: 'Dotall — . matches newlines' },
  { key: 'u', label: 'u', hint: 'Unicode' },
  { key: 'y', label: 'y', hint: 'Sticky — match from lastIndex only' },
];

const COMMON_PATTERNS: { label: string; pattern: string; flags: string }[] = [
  { label: 'Email address', pattern: '[\\w.+-]+@[\\w-]+\\.[a-zA-Z]{2,}', flags: 'g' },
  { label: 'URL', pattern: 'https?:\\/\\/[^\\s]+', flags: 'g' },
  { label: 'IPv4 address', pattern: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b', flags: 'g' },
  { label: 'Hex color', pattern: '#[0-9a-fA-F]{3,6}\\b', flags: 'g' },
  { label: 'Date (YYYY-MM-DD)', pattern: '\\d{4}-\\d{2}-\\d{2}', flags: 'g' },
  { label: 'Whitespace runs', pattern: '\\s+', flags: 'g' },
  { label: 'Digits only', pattern: '\\d+', flags: 'g' },
  { label: 'Phone (US-ish)', pattern: '\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}', flags: 'g' },
];

interface MatchSegment {
  text: string;
  isMatch: boolean;
}

export function RegexTesterTool() {
  const [pattern, setPattern] = useState('[\\w.+-]+@[\\w-]+\\.[a-zA-Z]{2,}');
  const [activeFlags, setActiveFlags] = useState<Set<string>>(new Set(['g', 'i']));
  const [testString, setTestString] = useState(
    'Contact us at hello@example.com or support@devtools.io for help.\nBackup: admin@example.org'
  );
  const [mode, setMode] = useState<'test' | 'replace'>('test');
  const [replacement, setReplacement] = useState('[EMAIL]');

  const toggleFlag = (key: string) => {
    setActiveFlags((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const flagsString = useMemo(
    () => FLAGS.filter((f) => activeFlags.has(f.key)).map((f) => f.key).join(''),
    [activeFlags]
  );

  const { regex, error } = useMemo(() => {
    if (!pattern) return { regex: null, error: null };
    try {
      return { regex: new RegExp(pattern, flagsString), error: null };
    } catch (e) {
      return { regex: null, error: (e as Error).message };
    }
  }, [pattern, flagsString]);

  const matches = useMemo(() => {
    if (!regex || !testString) return [];
    const results: RegExpExecArray[] = [];
    if (regex.global || regex.sticky) {
      const re = new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : regex.flags + 'g');
      let m: RegExpExecArray | null;
      let guard = 0;
      while ((m = re.exec(testString)) !== null && guard < 5000) {
        results.push(m);
        if (m[0].length === 0) re.lastIndex++;
        guard++;
      }
    } else {
      const m = regex.exec(testString);
      if (m) results.push(m);
    }
    return results;
  }, [regex, testString]);

  const segments = useMemo<MatchSegment[]>(() => {
    if (matches.length === 0) return [{ text: testString, isMatch: false }];
    const segs: MatchSegment[] = [];
    let cursor = 0;
    for (const m of matches) {
      const start = m.index;
      const end = start + m[0].length;
      if (start > cursor) segs.push({ text: testString.slice(cursor, start), isMatch: false });
      segs.push({ text: m[0] || '(empty match)', isMatch: true });
      cursor = Math.max(end, cursor);
    }
    if (cursor < testString.length) segs.push({ text: testString.slice(cursor), isMatch: false });
    return segs;
  }, [matches, testString]);

  const replacedOutput = useMemo(() => {
    if (!regex || mode !== 'replace') return '';
    try {
      return testString.replace(regex, replacement);
    } catch (e) {
      return `Error: ${(e as Error).message}`;
    }
  }, [regex, testString, replacement, mode]);

  const applyPreset = (preset: (typeof COMMON_PATTERNS)[number]) => {
    setPattern(preset.pattern);
    setActiveFlags(new Set(preset.flags.split('')));
    toast.success(`Loaded "${preset.label}" pattern`);
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  return (
    <div className="space-y-6">
      {/* Pattern + flags */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <Label htmlFor="regex-pattern">Regular Expression</Label>
          <div className="flex items-center gap-2">
            <span className="font-mono text-muted-foreground text-lg select-none">/</span>
            <Input
              id="regex-pattern"
              value={pattern}
              onChange={(e) => setPattern(e.target.value)}
              placeholder="Enter a pattern, e.g. \\d+"
              className="font-mono text-sm"
            />
            <span className="font-mono text-muted-foreground text-lg select-none">/{flagsString}</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            {FLAGS.map((f) => (
              <Tooltip key={f.key}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => toggleFlag(f.key)}
                    className={`h-7 w-7 rounded-md border text-xs font-mono font-bold transition-colors ${
                      activeFlags.has(f.key)
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-background text-muted-foreground hover:bg-muted/50'
                    }`}
                  >
                    {f.label}
                  </button>
                </TooltipTrigger>
                <TooltipContent>{f.hint}</TooltipContent>
              </Tooltip>
            ))}
            <span className="text-[10px] text-muted-foreground ml-1">Toggle flags</span>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-2.5 bg-red-50/15 border border-red-500/30 text-red-500 rounded-lg text-xs font-mono">
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              {error}
            </div>
          )}
          {!error && regex && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
              Valid pattern — {matches.length} match{matches.length === 1 ? '' : 'es'} found
            </div>
          )}

          <div className="flex flex-wrap gap-1.5 pt-2 border-t">
            {COMMON_PATTERNS.map((p) => (
              <Badge
                key={p.label}
                variant="outline"
                className="cursor-pointer hover:bg-muted/60 text-[10px] font-normal"
                onClick={() => applyPreset(p)}
              >
                {p.label}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Mode toggle */}
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setMode(mode === 'test' ? 'replace' : 'test')}
          className="h-8 gap-1.5 text-xs"
        >
          <ArrowLeftRight className="h-3.5 w-3.5" />
          {mode === 'test' ? 'Switch to Replace Mode' : 'Switch to Test Mode'}
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Test string input */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <Label htmlFor="regex-test-string">Test String</Label>
            <Textarea
              id="regex-test-string"
              value={testString}
              onChange={(e) => setTestString(e.target.value)}
              className="font-mono text-xs h-64 resize-y"
              placeholder="Paste text to test your pattern against..."
            />
            {mode === 'replace' && (
              <div className="space-y-1.5 pt-2 border-t">
                <Label htmlFor="regex-replacement">Replacement (supports $1, $2, $&lt;name&gt;)</Label>
                <Input
                  id="regex-replacement"
                  value={replacement}
                  onChange={(e) => setReplacement(e.target.value)}
                  className="font-mono text-xs"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Live highlight / replace output */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-sm font-bold flex items-center gap-1.5">
                <Regex className="h-4 w-4 text-primary" />
                {mode === 'test' ? 'Live Match Highlighting' : 'Replacement Result'}
              </span>
              {mode === 'replace' && (
                <Button variant="outline" size="sm" onClick={() => handleCopy(replacedOutput, 'Result')} className="h-7 text-xs">
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </Button>
              )}
            </div>

            {mode === 'test' ? (
              <div className="font-mono text-xs whitespace-pre-wrap break-words leading-relaxed max-h-64 overflow-y-auto p-3 bg-muted/20 rounded-md border">
                {segments.map((seg, i) =>
                  seg.isMatch ? (
                    <mark key={i} className="bg-primary/30 text-foreground rounded px-0.5">
                      {seg.text}
                    </mark>
                  ) : (
                    <span key={i}>{seg.text}</span>
                  )
                )}
              </div>
            ) : (
              <div className="font-mono text-xs whitespace-pre-wrap break-words leading-relaxed max-h-64 overflow-y-auto p-3 bg-muted/20 rounded-md border">
                {replacedOutput}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Match details */}
      {mode === 'test' && matches.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <h4 className="font-bold text-xs uppercase tracking-wider text-muted-foreground">
              Match Details ({matches.length})
            </h4>
            <div className="max-h-72 overflow-y-auto border rounded-md divide-y">
              {matches.slice(0, 200).map((m, i) => (
                <div key={i} className="p-2.5 text-xs font-mono flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-[10px]">#{i + 1}</Badge>
                    <span className="text-muted-foreground">at index {m.index}</span>
                    <span className="font-bold">{m[0] || '(empty)'}</span>
                  </div>
                  {m.length > 1 && (
                    <div className="pl-1 text-muted-foreground">
                      Groups: {m.slice(1).map((g, gi) => `$${gi + 1}=${g ?? 'undefined'}`).join('  ')}
                    </div>
                  )}
                  {m.groups && Object.keys(m.groups).length > 0 && (
                    <div className="pl-1 text-muted-foreground">
                      Named: {Object.entries(m.groups).map(([k, v]) => `${k}=${v ?? 'undefined'}`).join('  ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
