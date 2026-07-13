'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Type, Copy, Download, RefreshCw, FileText } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

// Standard Lorem dictionary
const LOREM_WORDS = [
  'lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'sed', 'do',
  'eiusmod', 'tempor', 'incididunt', 'ut', 'labore', 'et', 'dolore', 'magna', 'aliqua', 'ut',
  'enim', 'ad', 'minim', 'veniam', 'quis', 'nostrud', 'exercitation', 'ullamco', 'laboris',
  'nisi', 'ut', 'aliquip', 'ex', 'ea', 'commodo', 'consequat', 'duis', 'aute', 'irure', 'dolor',
  'in', 'reprehenderit', 'in', 'voluptate', 'velit', 'esse', 'cillum', 'dolore', 'eu', 'fugiat',
  'nulla', 'pariatur', 'excepteur', 'sint', 'occaecat', 'cupidatat', 'non', 'proident', 'sunt',
  'in', 'culpa', 'qui', 'officia', 'deserunt', 'mollit', 'anim', 'id', 'est', 'laborum', 'sed',
  'ut', 'perspiciatis', 'unde', 'omnis', 'iste', 'natus', 'error', 'sit', 'voluptatem',
  'accusantium', 'doloremque', 'laudantium', 'totam', 'rem', 'aperiam', 'eaque', 'ipsa', 'quae',
  'ab', 'illo', 'inventore', 'veritatis', 'et', 'quasi', 'architecto', 'beatae', 'vitae',
  'dicta', 'sunt', 'explicabo', 'nemo', 'enim', 'ipsam', 'voluptatem', 'quia', 'voluptas', 'sit',
  'aspernatur', 'aut', 'odit', 'aut', 'fugit', 'sed', 'quia', 'consequuntur', 'magni', 'dolores',
  'eos', 'qui', 'ratione', 'voluptatem', 'sequi', 'nesciunt', 'neque', 'porro', 'quisquam',
  'est', 'qui', 'dolorem', 'ipsum', 'quia', 'dolor', 'sit', 'amet', 'consectetur', 'adipisci',
  'velit', 'sed', 'quia', 'non', 'numquam', 'eius', 'modi', 'tempora', 'incidunt', 'ut', 'labore',
  'et', 'dolore', 'magnam', 'aliquam', 'quaerat', 'voluptatem', 'ut', 'enim', 'ad', 'minima',
  'veniam', 'quis', 'nostrum', 'exercitationem', 'ullamco', 'laboriosam', 'nisi', 'ut', 'aliquid',
  'ex', 'ea', 'commodi', 'consequatur', 'quis', 'autem', 'vel', 'eum', 'iure', 'reprehenderit',
  'qui', 'in', 'ea', 'voluptate', 'velit', 'esse', 'quam', 'nihil', 'molestiae', 'consequatur',
  'vel', 'illum', 'qui', 'dolorem', 'eum', 'fugiat', 'quo', 'voluptas', 'nulla', 'pariatur'
];

// Helper to generate a random number in range
const randomRange = (min: number, max: number) => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

// Generates a sentence
const generateSentence = (startWithLorem = false): string => {
  const len = randomRange(6, 14);
  let words: string[] = [];
  
  if (startWithLorem) {
    words = ['Lorem', 'ipsum', 'dolor', 'sit', 'amet'];
    while (words.length < len) {
      words.push(LOREM_WORDS[randomRange(0, LOREM_WORDS.length - 1)]);
    }
  } else {
    for (let i = 0; i < len; i++) {
      const w = LOREM_WORDS[randomRange(0, LOREM_WORDS.length - 1)];
      words.push(i === 0 ? w.charAt(0).toUpperCase() + w.slice(1) : w);
    }
  }
  
  return words.join(' ') + '.';
};

// Generates a paragraph
const generateParagraph = (sentenceCount = 5, startWithLorem = false): string => {
  const sentences: string[] = [];
  for (let i = 0; i < sentenceCount; i++) {
    sentences.push(generateSentence(i === 0 && startWithLorem));
  }
  return sentences.join(' ');
};

export function LoremIpsumTool() {
  const [qty, setQty] = useState<number>(3);
  const [type, setType] = useState<string>('paragraphs');
  const [startWithLorem, setStartWithLorem] = useState<boolean>(true);
  const [wrapHtml, setWrapHtml] = useState<boolean>(false);
  const [output, setOutput] = useState('');

  // Math.random()-based generation must run client-only: this page is statically
  // prerendered, so a useMemo here would bake one random draw into the static HTML
  // and mismatch every visitor's client-side hydration.
  const generateOutput = useCallback(() => {
    let result = '';
    const safeQty = Math.max(1, Math.min(250, qty));

    if (type === 'paragraphs') {
      const paragraphs: string[] = [];
      for (let i = 0; i < safeQty; i++) {
        const pText = generateParagraph(randomRange(4, 7), i === 0 && startWithLorem);
        paragraphs.push(wrapHtml ? `<p>${pText}</p>` : pText);
      }
      result = paragraphs.join(wrapHtml ? '\n\n' : '\n\n');
    } else if (type === 'sentences') {
      const sentences: string[] = [];
      for (let i = 0; i < safeQty; i++) {
        sentences.push(generateSentence(i === 0 && startWithLorem));
      }
      result = sentences.join(' ');
    } else if (type === 'words') {
      let words: string[] = [];
      if (startWithLorem) {
        words = ['lorem', 'ipsum', 'dolor', 'sit', 'amet'];
      }
      while (words.length < safeQty) {
        words.push(LOREM_WORDS[randomRange(0, LOREM_WORDS.length - 1)]);
      }
      words = words.slice(0, safeQty);
      if (words.length > 0) {
        words[0] = words[0].charAt(0).toUpperCase() + words[0].slice(1);
      }
      result = words.join(' ') + '.';
    } else if (type === 'list') {
      const listItems: string[] = [];
      for (let i = 0; i < safeQty; i++) {
        const item = generateSentence(i === 0 && startWithLorem).slice(0, -1); // remove ending period
        listItems.push(wrapHtml ? `  <li>${item}</li>` : `- ${item}`);
      }
      result = wrapHtml
        ? `<ul>\n${listItems.join('\n')}\n</ul>`
        : listItems.join('\n');
    }

    setOutput(result);
  }, [qty, type, startWithLorem, wrapHtml]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    generateOutput();
  }, [generateOutput]);

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output);
    toast.success('Generated text copied to clipboard!');
  };

  const handleDownload = () => {
    if (!output) return;
    const blob = new Blob([output], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lorem_ipsum_${qty}_${type}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Lorem ipsum downloaded as text file!');
  };

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Controls Card */}
      <Card className="border bg-card/60 backdrop-blur-sm shadow-sm md:col-span-1 h-fit">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center pb-2 border-b">
            <Label className="font-bold text-sm">Generator Configuration</Label>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="lorem-qty">Quantity</Label>
            <Input
              id="lorem-qty"
              type="number"
              min={1}
              max={250}
              value={qty}
              onChange={(e) => setQty(Math.min(250, Math.max(1, parseInt(e.target.value) || 1)))}
              className="text-xs h-9"
            />
          </div>

          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="paragraphs">Paragraphs</SelectItem>
                <SelectItem value="sentences">Sentences</SelectItem>
                <SelectItem value="words">Words</SelectItem>
                <SelectItem value="list">List Items</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between pt-2 border-t text-xs">
            <Label htmlFor="start-lorem" className="cursor-pointer">Start with &quot;Lorem ipsum&quot;</Label>
            <Switch
              id="start-lorem"
              checked={startWithLorem}
              onCheckedChange={setStartWithLorem}
            />
          </div>

          <div className="flex items-center justify-between pt-1 text-xs">
            <Label htmlFor="wrap-html" className="cursor-pointer">Wrap in HTML Tags</Label>
            <Switch
              id="wrap-html"
              checked={wrapHtml}
              onCheckedChange={setWrapHtml}
            />
          </div>

          <Button onClick={generateOutput} className="w-full gap-1.5 text-xs font-bold pt-2">
            <RefreshCw className="h-3.5 w-3.5" />
            Regenerate
          </Button>
        </CardContent>
      </Card>

      {/* Output Display Card */}
      <Card className="border shadow-md md:col-span-2 relative">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b">
            <Label className="font-bold text-sm flex items-center gap-1.5">
              <FileText className="h-4 w-4 text-primary" />
              Generated Placeholder Text
            </Label>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopy} className="h-8 gap-1 text-xs">
                <Copy className="h-3.5 w-3.5" />
                Copy
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload} className="h-8 gap-1 text-xs text-primary">
                <Download className="h-3.5 w-3.5" />
                Download
              </Button>
            </div>
          </div>
          <Textarea
            value={output}
            readOnly
            className="min-h-[350px] text-xs leading-relaxed font-mono resize-y"
          />
        </CardContent>
      </Card>
    </div>
  );
}
