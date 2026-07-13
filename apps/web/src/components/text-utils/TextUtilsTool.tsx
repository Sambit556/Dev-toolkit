'use client';

import React, { useState, useEffect } from 'react';
import { Type, Copy, Trash2, AlignLeft, BarChart3, Clock, Play } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { toast } from 'sonner';

// Text conversion helper functions
const toCamelCase = (str: string) => {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
      index === 0 ? word.toLowerCase() : word.toUpperCase()
    )
    .replace(/\s+/g, '')
    .replace(/[^a-zA-Z0-9]/g, '');
};

const toPascalCase = (str: string) => {
  return str
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word) => word.toUpperCase())
    .replace(/\s+/g, '')
    .replace(/[^a-zA-Z0-9]/g, '');
};

const toSnakeCase = (str: string) => {
  return str
    .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
    ?.map((x) => x.toLowerCase())
    .join('_') || str.toLowerCase().replace(/\s+/g, '_');
};

const toKebabCase = (str: string) => {
  return str
    .match(/[A-Z]{2,}(?=[A-Z][a-z]+[0-9]*|\b)|[A-Z]?[a-z]+[0-9]*|[A-Z]|[0-9]+/g)
    ?.map((x) => x.toLowerCase())
    .join('-') || str.toLowerCase().replace(/\s+/g, '-');
};

const toConstantCase = (str: string) => {
  return toSnakeCase(str).toUpperCase();
};

const toTitleCase = (str: string) => {
  return str.replace(
    /\w\S*/g,
    (txt) => txt.charAt(0).toUpperCase() + txt.substring(1).toLowerCase()
  );
};

const toSentenceCase = (str: string) => {
  return str
    .toLowerCase()
    .replace(/(^\s*|[.!?]\s+)([a-z])/g, (m, g1, g2) => g1 + g2.toUpperCase());
};

const toAlternatingCase = (str: string) => {
  return str
    .split('')
    .map((c, i) => (i % 2 === 0 ? c.toLowerCase() : c.toUpperCase()))
    .join('');
};

export function TextUtilsTool() {
  const [activeTab, setActiveTab] = useState('case-converter');
  const [inputText, setInputText] = useState('The quick brown fox jumps over the lazy dog.');

  // Word Counter Stats State
  const [stats, setStats] = useState({
    chars: 0,
    charsNoSpaces: 0,
    words: 0,
    sentences: 0,
    lines: 0,
    paragraphs: 0,
    readingTime: 0,
    speakingTime: 0,
  });

  const [wordFreq, setWordFreq] = useState<{ word: string; count: number }[]>([]);
  const [charFreq, setCharFreq] = useState<{ char: string; count: number }[]>([]);

  // Dynamic Case Outputs
  const [caseOutputs, setCaseOutputs] = useState({
    camel: '',
    pascal: '',
    snake: '',
    kebab: '',
    constant: '',
    upper: '',
    lower: '',
    title: '',
    sentence: '',
    alternating: '',
  });

  useEffect(() => {
    if (!inputText) {
      setCaseOutputs({
        camel: '', pascal: '', snake: '', kebab: '', constant: '',
        upper: '', lower: '', title: '', sentence: '', alternating: '',
      });
      setStats({
        chars: 0, charsNoSpaces: 0, words: 0, sentences: 0, lines: 0, paragraphs: 0,
        readingTime: 0, speakingTime: 0,
      });
      setWordFreq([]);
      setCharFreq([]);
      return;
    }

    // Convert cases
    setCaseOutputs({
      camel: toCamelCase(inputText),
      pascal: toPascalCase(inputText),
      snake: toSnakeCase(inputText),
      kebab: toKebabCase(inputText),
      constant: toConstantCase(inputText),
      upper: inputText.toUpperCase(),
      lower: inputText.toLowerCase(),
      title: toTitleCase(inputText),
      sentence: toSentenceCase(inputText),
      alternating: toAlternatingCase(inputText),
    });

    // Calculate metrics
    const chars = inputText.length;
    const charsNoSpaces = inputText.replace(/\s/g, '').length;
    const wordsArr = inputText.trim().split(/\s+/).filter((w) => w.length > 0);
    const words = wordsArr.length;
    const sentences = inputText.split(/[.!?]+/).filter((s) => s.trim().length > 0).length;
    const lines = inputText.split('\n').length;
    const paragraphs = inputText.split(/\n\s*\n/).filter((p) => p.trim().length > 0).length;

    const readingTime = Math.ceil(words / 200); // 200 words per minute average
    const speakingTime = Math.ceil(words / 130); // 130 words per minute average

    setStats({
      chars,
      charsNoSpaces,
      words,
      sentences,
      lines,
      paragraphs,
      readingTime,
      speakingTime,
    });

    // Word frequency (top 5)
    const freqMap: Record<string, number> = {};
    wordsArr.forEach((w) => {
      const clean = w.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
      if (clean) freqMap[clean] = (freqMap[clean] || 0) + 1;
    });
    const sortedWords = Object.entries(freqMap)
      .map(([word, count]) => ({ word, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    setWordFreq(sortedWords);

    // Char frequency (top 5)
    const charMap: Record<string, number> = {};
    Array.from(inputText.toLowerCase()).forEach((c) => {
      if (c !== ' ' && c !== '\n') {
        charMap[c] = (charMap[c] || 0) + 1;
      }
    });
    const sortedChars = Object.entries(charMap)
      .map(([char, count]) => ({ char, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    setCharFreq(sortedChars);
  }, [inputText]);

  const handleCopy = (text: string, label: string) => {
    if (!text) {
      toast.error('Nothing to copy!');
      return;
    }
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };

  const handleClear = () => {
    setInputText('');
    toast.success('Text cleared');
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <div className="flex justify-center">
        <TabsList className="grid grid-cols-2 w-full max-w-md h-auto p-1 gap-1">
          <TabsTrigger value="case-converter" className="gap-2 py-2 text-xs">
            <Type className="h-4 w-4" />
            Case Converter
          </TabsTrigger>
          <TabsTrigger value="word-counter" className="gap-2 py-2 text-xs">
            <AlignLeft className="h-4 w-4" />
            Word & Text Counter
          </TabsTrigger>
        </TabsList>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Editor Input Panel */}
        <Card className="md:col-span-1 border bg-card/60 backdrop-blur-sm shadow-sm h-fit">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b">
              <Label className="font-bold text-sm">Input Text</Label>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-red-500"
                    onClick={handleClear}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Clear Text</TooltipContent>
              </Tooltip>
            </div>
            <Textarea
              className="min-h-[280px] text-xs leading-relaxed font-mono"
              placeholder="Type or paste your text here..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
          </CardContent>
        </Card>

        {/* Dynamic Display Panel */}
        <div className="md:col-span-2 space-y-6">
          {/* TAB 1: CASE CONVERTER */}
          <TabsContent value="case-converter" className="m-0 space-y-4 animate-fade-in">
            <Card className="border shadow-md">
              <CardContent className="p-6 space-y-5">
                <div className="flex items-center justify-between pb-2 border-b">
                  <h2 className="text-base font-bold flex items-center gap-2">
                    <Type className="h-4 w-4 text-primary" />
                    Case Formats Preview
                  </h2>
                  <Badge variant="secondary">Instant Real-time</Badge>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {[
                    { label: 'camelCase', key: 'camel', value: caseOutputs.camel },
                    { label: 'PascalCase', key: 'pascal', value: caseOutputs.pascal },
                    { label: 'snake_case', key: 'snake', value: caseOutputs.snake },
                    { label: 'kebab-case', key: 'kebab', value: caseOutputs.kebab },
                    { label: 'CONSTANT_CASE', key: 'constant', value: caseOutputs.constant },
                    { label: 'UPPERCASE', key: 'upper', value: caseOutputs.upper },
                    { label: 'lowercase', key: 'lower', value: caseOutputs.lower },
                    { label: 'Title Case', key: 'title', value: caseOutputs.title },
                    { label: 'Sentence case', key: 'sentence', value: caseOutputs.sentence },
                    { label: 'Alternating cAsE', key: 'alternating', value: caseOutputs.alternating },
                  ].map((item) => (
                    <div key={item.key} className="space-y-1.5 border rounded-lg p-2.5 bg-muted/20 relative group">
                      <div className="flex items-center justify-between text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        <span>{item.label}</span>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-2"
                              onClick={() => handleCopy(item.value, item.label)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{`Copy ${item.label}`}</TooltipContent>
                        </Tooltip>
                      </div>
                      <div className="font-mono text-xs text-foreground truncate pr-6 select-all min-h-[16px] break-all pt-1">
                        {item.value || <span className="text-muted-foreground/30 italic">No input</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TAB 2: WORD COUNTER */}
          <TabsContent value="word-counter" className="m-0 space-y-4 animate-fade-in">
            <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
              {[
                { label: 'Words', val: stats.words },
                { label: 'Characters', val: stats.chars },
                { label: 'Chars (No Spaces)', val: stats.charsNoSpaces },
                { label: 'Sentences', val: stats.sentences },
                { label: 'Paragraphs', val: stats.paragraphs },
                { label: 'Lines', val: stats.lines },
                { label: 'Reading Time', val: `${stats.readingTime} min`, icon: Clock },
                { label: 'Speaking Time', val: `${stats.speakingTime} min`, icon: Play },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <Card key={idx} className="border shadow-sm p-3 text-center bg-card">
                    <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1 flex items-center justify-center gap-1">
                      {Icon && <Icon className="h-3 w-3 text-primary" />}
                      {item.label}
                    </div>
                    <div className="text-lg font-extrabold tracking-tight text-foreground font-mono">{item.val}</div>
                  </Card>
                );
              })}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Word Density */}
              <Card className="border shadow-sm">
                <CardContent className="p-4 space-y-3">
                  <h3 className="text-xs font-bold flex items-center gap-1.5 border-b pb-2 text-muted-foreground uppercase tracking-wider">
                    <BarChart3 className="h-3.5 w-3.5 text-primary" />
                    Top Word Density
                  </h3>
                  <div className="space-y-2">
                    {wordFreq.length > 0 ? (
                      wordFreq.map((item, idx) => {
                        const pct = stats.words > 0 ? Math.round((item.count / stats.words) * 100) : 0;
                        return (
                          <div key={idx} className="text-xs space-y-1">
                            <div className="flex justify-between font-mono">
                              <span className="font-semibold text-foreground">"{item.word}"</span>
                              <span className="text-muted-foreground">{item.count} times ({pct}%)</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                              <div className="bg-primary h-full" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-xs text-muted-foreground/50 italic text-center py-4">No data</div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Character Density */}
              <Card className="border shadow-sm">
                <CardContent className="p-4 space-y-3">
                  <h3 className="text-xs font-bold flex items-center gap-1.5 border-b pb-2 text-muted-foreground uppercase tracking-wider">
                    <BarChart3 className="h-3.5 w-3.5 text-primary" />
                    Top Character Density
                  </h3>
                  <div className="space-y-2">
                    {charFreq.length > 0 ? (
                      charFreq.map((item, idx) => {
                        const totalCleanChars = stats.chars - (inputText.match(/\s/g) || []).length;
                        const pct = totalCleanChars > 0 ? Math.round((item.count / totalCleanChars) * 100) : 0;
                        return (
                          <div key={idx} className="text-xs space-y-1">
                            <div className="flex justify-between font-mono">
                              <span className="font-semibold text-foreground">'{item.char}'</span>
                              <span className="text-muted-foreground">{item.count} times ({pct}%)</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                              <div className="bg-primary h-full" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-xs text-muted-foreground/50 italic text-center py-4">No data</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </div>
      </div>
    </Tabs>
  );
}
