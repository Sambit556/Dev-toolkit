'use client';

import React, { useState, useMemo } from 'react';
import { ArrowLeftRight, Download, RefreshCw, Braces, AlignLeft, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CodeEditor } from '@/components/ui/CodeEditor';
import jsyaml from 'js-yaml';
import { toast } from 'sonner';
import { CopyButton } from '@/components/ui/copy-button';

export function YamlJsonTool() {
  const [direction, setDirection] = useState<'json2yaml' | 'yaml2json'>('json2yaml');
  const [inputVal, setInputVal] = useState<string>(
    JSON.stringify(
      {
        name: 'DevToolkit',
        version: '1.0.0',
        active: true,
        features: ['JWT', 'UUID', 'Cron', 'YAML/JSON', 'Unit Converter'],
        author: {
          name: 'Antigravity',
          role: 'AI Companion',
        },
      },
      null,
      2
    )
  );
  // Configuration options
  const [indentSize, setIndentSize] = useState<string>('2');
  const [sortKeys, setSortKeys] = useState<boolean>(false);

  const { outputVal, errorVal } = useMemo(() => {
    if (!inputVal.trim()) {
      return { outputVal: '', errorVal: null as string | null };
    }

    try {
      if (direction === 'json2yaml') {
        const parsed = JSON.parse(inputVal);
        const yaml = jsyaml.dump(parsed, {
          indent: Number(indentSize),
          sortKeys,
          noRefs: true,
        });
        return { outputVal: yaml, errorVal: null as string | null };
      } else {
        const parsed = jsyaml.load(inputVal);
        if (typeof parsed !== 'object' && parsed !== null) {
          throw new Error('YAML did not parse into an object');
        }
        const json = JSON.stringify(parsed, null, Number(indentSize));
        return { outputVal: json, errorVal: null as string | null };
      }
    } catch (e: any) {
      return { outputVal: '', errorVal: (e.message || 'Error occurred during parsing') as string | null };
    }
  }, [inputVal, direction, indentSize, sortKeys]);

  const handleSwapDirection = () => {
    const tempOut = outputVal;
    const tempIn = inputVal;
    
    if (direction === 'json2yaml') {
      setDirection('yaml2json');
      setInputVal(tempOut || `---\nerror: "Paste valid YAML here"`);
    } else {
      setDirection('json2yaml');
      setInputVal(tempOut || `{\n  "error": "Paste valid JSON here"\n}`);
    }
  };

  const handleDownload = () => {
    const isYaml = direction === 'json2yaml';
    const blob = new Blob([outputVal], { type: isYaml ? 'text/yaml' : 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = isYaml ? 'converted.yaml' : 'converted.json';
    link.click();
    URL.revokeObjectURL(url);
    toast.success('File downloaded!');
  };

  return (
    <div className="space-y-4">
      {/* Configuration Toolbar */}
      <Card>
        <CardContent className="p-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleSwapDirection} className="h-8 text-xs gap-1.5">
              <ArrowLeftRight className="h-3.5 w-3.5" />
              {direction === 'json2yaml' ? 'JSON ➔ YAML' : 'YAML ➔ JSON'}
            </Button>

            <div className="flex items-center gap-1.5">
              <Label htmlFor="indent-size" className="text-xs">Tab size</Label>
              <Select value={indentSize} onValueChange={setIndentSize}>
                <SelectTrigger id="indent-size" className="w-16 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2</SelectItem>
                  <SelectItem value="4">4</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-1.5">
              <Label htmlFor="sort-keys" className="text-xs">Alphabetical Keys</Label>
              <Switch id="sort-keys" checked={sortKeys} onCheckedChange={setSortKeys} />
            </div>
          </div>

          {outputVal && (
            <div className="flex items-center gap-1.5">
              <CopyButton value={outputVal} label="Copy" toastMessage="Converted output copied!" variant="outline" className="h-8" />
              <Button variant="outline" size="sm" onClick={handleDownload} className="h-8 text-xs">
                <Download className="h-3 w-3 mr-1" />
                Download
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Editor panels */}
      <div className="grid gap-6 md:grid-cols-2 h-[450px]">
        {/* Input panel */}
        <div className="flex flex-col space-y-1.5 h-full">
          <Label className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            {direction === 'json2yaml' ? <Braces className="h-3.5 w-3.5 text-primary" /> : <AlignLeft className="h-3.5 w-3.5 text-primary" />}
            Input {direction === 'json2yaml' ? 'JSON' : 'YAML'}
          </Label>
          <CodeEditor
            language={direction === 'json2yaml' ? 'json' : 'yaml'}
            value={inputVal}
            onChange={setInputVal}
            height="100%"
          />
        </div>

        {/* Output panel */}
        <div className="flex flex-col space-y-1.5 h-full">
          <Label className="font-bold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1">
            {direction === 'json2yaml' ? <AlignLeft className="h-3.5 w-3.5 text-primary" /> : <Braces className="h-3.5 w-3.5 text-primary" />}
            Output {direction === 'json2yaml' ? 'YAML' : 'JSON'}
          </Label>
          <CodeEditor
            language={direction === 'json2yaml' ? 'yaml' : 'json'}
            value={outputVal}
            readOnly
            height="100%"
          />
        </div>
      </div>

      {/* Error notification if parsing fails */}
      {errorVal && (
        <Card className="border-destructive/30 bg-destructive/5 text-destructive p-3 text-xs leading-normal font-mono flex items-start gap-2">
          <Info className="h-4 w-4 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Syntax/Parse Error:</p>
            <p className="mt-0.5 whitespace-pre-wrap">{errorVal}</p>
          </div>
        </Card>
      )}
    </div>
  );
}
