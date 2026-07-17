'use client';

import React, { useState, useMemo } from 'react';
import { Database, Download, Wand2, Minimize2, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, type SqlLanguage } from 'sql-formatter';
import { toast } from 'sonner';
import { CopyButton } from '@/components/ui/copy-button';

const DIALECTS: { value: SqlLanguage; label: string }[] = [
  { value: 'sql', label: 'Standard SQL' },
  { value: 'mysql', label: 'MySQL' },
  { value: 'mariadb', label: 'MariaDB' },
  { value: 'postgresql', label: 'PostgreSQL' },
  { value: 'sqlite', label: 'SQLite' },
  { value: 'tsql', label: 'SQL Server (T-SQL)' },
  { value: 'plsql', label: 'Oracle (PL/SQL)' },
  { value: 'bigquery', label: 'BigQuery' },
  { value: 'redshift', label: 'Redshift' },
  { value: 'spark', label: 'Spark SQL' },
];

const SAMPLE_SQL = `select u.id, u.name, o.total from users u join orders o on o.user_id = u.id where o.total > 100 order by o.total desc limit 10;`;

export function SqlFormatterTool() {
  const [input, setInput] = useState(SAMPLE_SQL);
  const [dialect, setDialect] = useState<SqlLanguage>('sql');
  const [indentSize, setIndentSize] = useState('2');
  const [keywordCase, setKeywordCase] = useState<'preserve' | 'upper' | 'lower'>('upper');
  const [minify, setMinify] = useState(false);

  const { output, error } = useMemo(() => {
    if (!input.trim()) {
      return { output: '', error: null as string | null };
    }
    try {
      const result = format(input, {
        language: dialect,
        tabWidth: Number(indentSize),
        keywordCase,
        linesBetweenQueries: minify ? 0 : 1,
      });
      return { output: minify ? result.replace(/\s+/g, ' ').trim() : result, error: null as string | null };
    } catch (e) {
      return { output: '', error: (e as Error).message || 'Failed to format SQL' };
    }
  }, [input, dialect, indentSize, keywordCase, minify]);

  const handleDownload = () => {
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'query.sql';
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Downloaded query.sql');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4 flex flex-wrap gap-4 items-center">
          <div className="flex items-center gap-2">
            <Label>Dialect</Label>
            <Select value={dialect} onValueChange={(v) => setDialect(v as SqlLanguage)}>
              <SelectTrigger className="h-8 w-44 bg-background text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DIALECTS.map((d) => (
                  <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Label>Indent</Label>
            <Select value={indentSize} onValueChange={setIndentSize}>
              <SelectTrigger className="h-8 w-28 bg-background text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 spaces</SelectItem>
                <SelectItem value="4">4 spaces</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <Label>Keywords</Label>
            <Select value={keywordCase} onValueChange={(v) => setKeywordCase(v as typeof keywordCase)}>
              <SelectTrigger className="h-8 w-32 bg-background text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="upper">UPPER</SelectItem>
                <SelectItem value="lower">lower</SelectItem>
                <SelectItem value="preserve">Preserve</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setMinify(false)} className="h-8 gap-1.5 text-xs">
              <Wand2 className="h-3.5 w-3.5" />
              Beautify
            </Button>
            <Button variant="outline" size="sm" onClick={() => setMinify(true)} className="h-8 gap-1.5 text-xs">
              <Minimize2 className="h-3.5 w-3.5" />
              Minify
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="p-4 space-y-3">
            <Label htmlFor="sql-in">SQL Query</Label>
            <Textarea
              id="sql-in"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="font-mono text-xs h-80 resize-y"
              placeholder="SELECT * FROM table_name WHERE ..."
            />
          </CardContent>
        </Card>

        <Card className="flex flex-col h-full min-h-[350px]">
          <CardContent className="p-4 flex-1 flex flex-col space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-sm font-bold flex items-center gap-1.5">
                <Database className="h-4 w-4 text-primary" />
                Formatted Output
              </span>
              <div className="flex gap-1.5">
                <CopyButton value={output} label="Copy" disabled={!output} toastMessage="Formatted SQL copied!" variant="outline" className="h-7" />
                <Button variant="outline" size="sm" onClick={handleDownload} disabled={!output} className="h-7 text-xs">
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </Button>
              </div>
            </div>

            {error ? (
              <div className="flex items-center gap-2 p-3 bg-red-50/15 border border-red-500/30 text-red-500 rounded-lg text-xs font-mono">
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                {error}
              </div>
            ) : (
              <pre className="flex-1 font-mono text-xs whitespace-pre-wrap break-words leading-relaxed p-3 bg-muted/20 rounded-md border max-h-96 overflow-y-auto">
                {output}
              </pre>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
