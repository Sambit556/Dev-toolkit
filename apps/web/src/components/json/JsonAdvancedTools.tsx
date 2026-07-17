'use client';

import React, { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { downloadFile } from '@/lib/utils';
import { CopyButton } from '@/components/ui/copy-button';
import {
  generateTypeScript,
  jsonToCsv,
  sortKeysDeep,
  removeNullValues,
  escapeJsonString,
  unescapeJsonString,
  parseJsonSafe,
} from '@/lib/json-utils';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-medium">{title}</h4>
      {children}
    </div>
  );
}

interface AdvancedToolsProps {
  jsonInput: string;
  onJsonChange: (v: string) => void;
}

export function JsonAdvancedTools({ jsonInput, onJsonChange }: AdvancedToolsProps) {
  const [tsOutput, setTsOutput] = useState('');
  const [csvOutput, setCsvOutput] = useState('');
  const [interfaceName, setInterfaceName] = useState('Root');
  const [jsonPathInput, setJsonPathInput] = useState('');
  const [jsonPathResult, setJsonPathResult] = useState('');
  const [escapedOutput, setEscapedOutput] = useState('');

  const withValidJson = (fn: (parsed: unknown) => void) => {
    const { value, error } = parseJsonSafe(jsonInput);
    if (error) {
      toast.error('Invalid JSON: ' + error.message);
      return;
    }
    fn(value);
  };

  const handleToTypescript = () => {
    try {
      const ts = generateTypeScript(jsonInput, interfaceName);
      setTsOutput(ts);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Conversion failed');
    }
  };

  const handleToCsv = () => {
    try {
      const csv = jsonToCsv(jsonInput);
      setCsvOutput(csv);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'CSV conversion failed. JSON must be an array.');
    }
  };

  const handleSortKeys = () => {
    withValidJson((value) => {
      const sorted = sortKeysDeep(value);
      onJsonChange(JSON.stringify(sorted, null, 2));
      toast.success('Keys sorted alphabetically');
    });
  };

  const handleRemoveNulls = () => {
    withValidJson((value) => {
      const cleaned = removeNullValues(value);
      onJsonChange(JSON.stringify(cleaned, null, 2));
      toast.success('Null values removed');
    });
  };

  const handleEscape = () => {
    try {
      setEscapedOutput(escapeJsonString(jsonInput));
    } catch (e) {
      toast.error('Failed to escape');
    }
  };

  const handleUnescape = () => {
    try {
      const unescaped = unescapeJsonString(jsonInput);
      onJsonChange(unescaped);
      toast.success('JSON unescaped');
    } catch (e) {
      toast.error('Failed to unescape');
    }
  };

  const handleJsonPath = () => {
    withValidJson((value) => {
      try {
        // Simple JSONPath evaluator (subset)
        const path = jsonPathInput.trim();
        let current: unknown = value;

        // Strip leading $ or $.
        const parts = path.replace(/^\$\.?/, '').split(/[.\[]/g).filter(Boolean);

        for (const part of parts) {
          const key = part.replace(/\]$/, '');
          if (current === null || typeof current !== 'object') {
            setJsonPathResult('undefined');
            return;
          }
          current = (current as Record<string, unknown>)[key];
        }

        setJsonPathResult(JSON.stringify(current, null, 2));
      } catch {
        setJsonPathResult('Error evaluating path');
      }
    });
  };

  return (
    <Tabs defaultValue="typescript" className="h-full flex flex-col">
      <TabsList className="shrink-0 flex-wrap h-auto">
        <TabsTrigger value="typescript" className="text-xs">TypeScript</TabsTrigger>
        <TabsTrigger value="csv" className="text-xs">CSV</TabsTrigger>
        <TabsTrigger value="jsonpath" className="text-xs">JSONPath</TabsTrigger>
        <TabsTrigger value="transform" className="text-xs">Transform</TabsTrigger>
        <TabsTrigger value="escape" className="text-xs">Escape</TabsTrigger>
      </TabsList>

      <div className="flex-1 overflow-auto mt-3 space-y-4">
        <TabsContent value="typescript" className="space-y-3 mt-0">
          <Section title="JSON → TypeScript Interface">
            <div className="flex gap-2">
              <div className="flex-1">
                <Label className="text-xs">Interface Name</Label>
                <Input
                  value={interfaceName}
                  onChange={(e) => setInterfaceName(e.target.value)}
                  className="h-8 text-sm font-mono mt-1"
                />
              </div>
              <div className="flex items-end">
                <Button size="sm" onClick={handleToTypescript}>Generate</Button>
              </div>
            </div>
            {tsOutput && (
              <div className="relative">
                <pre className="rounded-md border bg-muted p-3 text-xs font-mono overflow-auto max-h-64 whitespace-pre-wrap">
                  {tsOutput}
                </pre>
                <CopyButton value={tsOutput} label="Copy" variant="outline" className="absolute top-2 right-2 h-6" />
              </div>
            )}
          </Section>
        </TabsContent>

        <TabsContent value="csv" className="space-y-3 mt-0">
          <Section title="JSON Array → CSV">
            <p className="text-xs text-muted-foreground">JSON must be an array of objects.</p>
            <Button size="sm" onClick={handleToCsv}>Convert to CSV</Button>
            {csvOutput && (
              <div className="relative space-y-2">
                <Textarea
                  value={csvOutput}
                  readOnly
                  className="font-mono text-xs h-48"
                />
                <div className="flex gap-2">
                  <CopyButton value={csvOutput} label="Copy CSV" variant="outline" />
                  <Button size="sm" variant="outline" onClick={() => downloadFile(csvOutput, 'data.csv', 'text/csv')}>
                    Download CSV
                  </Button>
                </div>
              </div>
            )}
          </Section>
        </TabsContent>

        <TabsContent value="jsonpath" className="space-y-3 mt-0">
          <Section title="JSONPath Tester">
            <p className="text-xs text-muted-foreground">Supports basic dot notation: <code className="font-mono">$.user.name</code> or <code className="font-mono">$.items[0]</code></p>
            <div className="flex gap-2">
              <Input
                value={jsonPathInput}
                onChange={(e) => setJsonPathInput(e.target.value)}
                placeholder="$.user.address.city"
                className="font-mono text-sm"
                onKeyDown={(e) => e.key === 'Enter' && handleJsonPath()}
              />
              <Button size="sm" onClick={handleJsonPath}>Evaluate</Button>
            </div>
            {jsonPathResult && (
              <pre className="rounded-md border bg-muted p-3 text-xs font-mono overflow-auto max-h-48 whitespace-pre-wrap">
                {jsonPathResult}
              </pre>
            )}
          </Section>
        </TabsContent>

        <TabsContent value="transform" className="space-y-4 mt-0">
          <Section title="Transform JSON">
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={handleSortKeys}>
                Sort Keys A→Z
              </Button>
              <Button size="sm" variant="outline" onClick={handleRemoveNulls}>
                Remove Null Values
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Transforms apply to the editor content.</p>
          </Section>
        </TabsContent>

        <TabsContent value="escape" className="space-y-3 mt-0">
          <Section title="Escape / Unescape JSON String">
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" onClick={handleEscape}>
                Escape JSON
              </Button>
              <Button size="sm" variant="outline" onClick={handleUnescape}>
                Unescape to Editor
              </Button>
            </div>
            {escapedOutput && (
              <div className="relative">
                <Textarea
                  value={escapedOutput}
                  readOnly
                  className="font-mono text-xs h-32"
                />
                <CopyButton value={escapedOutput} label="Copy" variant="outline" className="mt-1 h-7" />
              </div>
            )}
          </Section>
        </TabsContent>
      </div>
    </Tabs>
  );
}
