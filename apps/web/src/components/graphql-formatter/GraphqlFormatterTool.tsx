'use client';

import React, { useState, useEffect } from 'react';
import { Share2, Copy, Download, Wand2, Minimize2, AlertTriangle, CheckCircle2, ShieldCheck } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { parse, print, buildSchema, validate, stripIgnoredCharacters, GraphQLError } from 'graphql';
import { toast } from 'sonner';

const SAMPLE_QUERY = `query GetUser($id: ID!) {
  user(id: $id) {
    id
    name
    friends { id name }
  }
}`;

export function GraphqlFormatterTool() {
  const [input, setInput] = useState(SAMPLE_QUERY);
  const [output, setOutput] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const [useSchema, setUseSchema] = useState(false);
  const [schemaSdl, setSchemaSdl] = useState(
    'type User {\n  id: ID!\n  name: String!\n  friends: [User!]!\n}\n\ntype Query {\n  user(id: ID!): User\n}'
  );

  const runFormat = () => {
    if (!input.trim()) {
      setOutput('');
      setErrors([]);
      return;
    }
    try {
      const doc = parse(input);
      setOutput(print(doc));

      if (useSchema && schemaSdl.trim()) {
        try {
          const schema = buildSchema(schemaSdl);
          const validationErrors = validate(schema, doc);
          setErrors(validationErrors.map((e) => formatGraphqlError(e)));
        } catch (schemaErr) {
          setErrors([`Schema error: ${(schemaErr as Error).message}`]);
        }
      } else {
        setErrors([]);
      }
    } catch (e) {
      setErrors([formatGraphqlError(e as GraphQLError)]);
      setOutput('');
    }
  };

  const formatGraphqlError = (e: GraphQLError | Error): string => {
    if ('locations' in e && e.locations && e.locations.length > 0) {
      const loc = e.locations[0];
      return `Line ${loc.line}, Column ${loc.column}: ${e.message}`;
    }
    return e.message;
  };

  useEffect(() => {
    runFormat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, useSchema, schemaSdl]);

  const handleMinify = () => {
    try {
      setOutput(stripIgnoredCharacters(input));
      setErrors([]);
      toast.success('Minified');
    } catch (e) {
      setErrors([formatGraphqlError(e as GraphQLError)]);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    toast.success('Copied!');
  };

  const handleDownload = () => {
    const blob = new Blob([output], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'query.graphql';
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Downloaded query.graphql');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-1.5">
            <Label htmlFor="use-schema" className="cursor-pointer text-xs">Validate against schema</Label>
            <Switch id="use-schema" checked={useSchema} onCheckedChange={setUseSchema} />
          </div>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={runFormat} className="h-8 gap-1.5 text-xs">
              <Wand2 className="h-3.5 w-3.5" />
              Format
            </Button>
            <Button variant="outline" size="sm" onClick={handleMinify} className="h-8 gap-1.5 text-xs">
              <Minimize2 className="h-3.5 w-3.5" />
              Minify
            </Button>
          </div>
        </CardContent>
      </Card>

      {useSchema && (
        <Card>
          <CardContent className="p-4 space-y-2">
            <Label htmlFor="gql-schema" className="flex items-center gap-1.5 text-xs">
              <ShieldCheck className="h-3.5 w-3.5" />
              Schema (SDL) to validate against
            </Label>
            <Textarea
              id="gql-schema"
              value={schemaSdl}
              onChange={(e) => setSchemaSdl(e.target.value)}
              className="font-mono text-xs h-32 resize-y"
              placeholder="type Query { ... }"
            />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardContent className="p-4 space-y-3">
            <Label htmlFor="gql-in">GraphQL Query / Mutation / SDL</Label>
            <Textarea
              id="gql-in"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="font-mono text-xs h-80 resize-y"
              placeholder="query { field }"
            />
          </CardContent>
        </Card>

        <Card className="flex flex-col h-full min-h-[350px]">
          <CardContent className="p-4 flex-1 flex flex-col space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-sm font-bold flex items-center gap-1.5">
                <Share2 className="h-4 w-4 text-primary" />
                Formatted Output
              </span>
              <div className="flex gap-1.5">
                <Button variant="outline" size="sm" onClick={handleCopy} disabled={!output} className="h-7 text-xs">
                  <Copy className="h-3 w-3 mr-1" />
                  Copy
                </Button>
                <Button variant="outline" size="sm" onClick={handleDownload} disabled={!output} className="h-7 text-xs">
                  <Download className="h-3 w-3 mr-1" />
                  Download
                </Button>
              </div>
            </div>

            {errors.length > 0 ? (
              <div className="space-y-1.5">
                {errors.map((err, i) => (
                  <div key={i} className="flex items-center gap-2 p-2.5 bg-red-50/15 border border-red-500/30 text-red-500 rounded-lg text-xs font-mono">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                    {err}
                  </div>
                ))}
              </div>
            ) : output ? (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                Valid GraphQL document
              </div>
            ) : null}

            <pre className="flex-1 font-mono text-xs whitespace-pre-wrap break-words leading-relaxed p-3 bg-muted/20 rounded-md border max-h-96 overflow-y-auto">
              {output}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
