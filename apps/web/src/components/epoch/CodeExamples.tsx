'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CODE_EXAMPLES, type CodeLanguage } from '@/lib/epoch';
import { CopyButton } from '@/components/ui/copy-button';

const LANGUAGES: { value: CodeLanguage; label: string }[] = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'go', label: 'Go' },
  { value: 'postgresql', label: 'PostgreSQL' },
  { value: 'mysql', label: 'MySQL' },
  { value: 'linux', label: 'Linux/Shell' },
];

function CodeBlock({ code, language }: { code: string; language: string }) {
  return (
    <div className="relative rounded-lg border bg-muted/50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
        <span className="text-xs font-medium text-muted-foreground">{language}</span>
        <CopyButton value={code} toastMessage={`${language} code copied`} className="h-6 w-6" />
      </div>
      <pre className="p-4 overflow-x-auto text-sm">
        <code className="font-mono text-foreground/90 whitespace-pre">{code}</code>
      </pre>
    </div>
  );
}

interface CodeExamplesProps {
  timestamp?: number;
}

export function CodeExamples({ timestamp }: CodeExamplesProps) {
  const [fallbackTs] = useState(() => Math.floor(Date.now() / 1000));
  const ts = timestamp ?? fallbackTs;

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Code snippets for timestamp{' '}
        <code className="font-mono text-foreground font-medium">{ts}</code>
      </p>

      <Tabs defaultValue="javascript">
        <TabsList className="flex-wrap h-auto gap-1">
          {LANGUAGES.map(({ value, label }) => (
            <TabsTrigger key={value} value={value} className="text-xs">
              {label}
            </TabsTrigger>
          ))}
        </TabsList>

        {LANGUAGES.map(({ value, label }) => (
          <TabsContent key={value} value={value}>
            <CodeBlock
              code={CODE_EXAMPLES[value](ts)}
              language={label}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
