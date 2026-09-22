'use client';

import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/copy-button';
import {
  ConversionMethodId,
  ConversionOptions,
  METHOD_DEFINITIONS,
  MULTI_COMPARE_METHODS,
  executeConversion,
} from '@/lib/encoder-decoder';
import { ArrowRight, Lock, Key, Shield, Sparkles } from 'lucide-react';

interface MultiAlgorithmGridProps {
  inputText: string;
  isDecode: boolean;
  options: ConversionOptions;
  onSelectMethod: (methodId: ConversionMethodId) => void;
}

export function MultiAlgorithmGrid({
  inputText,
  isDecode,
  options,
  onSelectMethod,
}: MultiAlgorithmGridProps) {
  const methodMap = useMemo(() => {
    return new Map(METHOD_DEFINITIONS.map((m) => [m.id, m]));
  }, []);

  const comparisonResults = useMemo(() => {
    if (!inputText) return [];

    return MULTI_COMPARE_METHODS.map((methodId) => {
      const def = methodMap.get(methodId);
      const res = executeConversion(inputText, methodId, isDecode, options);
      return {
        methodId,
        name: def?.name || methodId,
        category: def?.category || 'encoding',
        description: def?.description || '',
        requiresPassphrase: def?.requiresPassphrase,
        output: res.output,
        error: res.error,
        isOneWay: def?.isOneWay,
      };
    });
  }, [inputText, isDecode, options, methodMap]);

  if (!inputText) {
    return (
      <div className="text-center py-12 border rounded-xl border-dashed bg-muted/20">
        <Sparkles className="h-8 w-8 text-muted-foreground/60 mx-auto mb-2" />
        <p className="text-sm font-medium text-muted-foreground">
          Enter text above to see live multi-algorithm comparison across all encodings & ciphers.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Multi-Algorithm Live Comparison ({comparisonResults.length} Algorithms)
        </span>
        <Badge variant="outline" className="text-[10px]">
          Mode: {isDecode ? 'Decoding' : 'Encoding'}
        </Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {comparisonResults.map((item) => (
          <Card
            key={item.methodId}
            className="border transition-all hover:border-primary/50 hover:shadow-sm flex flex-col justify-between overflow-hidden bg-card/80"
          >
            <CardContent className="p-3.5 space-y-2 flex-1 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-1">
                  <span className="font-bold text-xs flex items-center gap-1.5 truncate">
                    {item.requiresPassphrase && <Lock className="h-3 w-3 text-amber-500 shrink-0" />}
                    {item.name}
                  </span>
                  <Badge variant="secondary" className="text-[9px] uppercase px-1.5 py-0 h-4">
                    {item.category}
                  </Badge>
                </div>
                <p className="text-[10px] text-muted-foreground line-clamp-1">
                  {item.description}
                </p>
              </div>

              <div className="mt-2 space-y-2">
                <div className="relative">
                  <div
                    className={`font-mono text-xs p-2 rounded-md border break-all max-h-24 overflow-y-auto scrollbar-thin ${
                      item.error
                        ? 'bg-destructive/10 text-destructive border-destructive/30'
                        : 'bg-muted/40 text-foreground'
                    }`}
                  >
                    {item.output || '<empty>'}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-border/50">
                  <CopyButton
                    value={item.output}
                    disabled={!item.output || !!item.error}
                    toastMessage={`${item.name} copied!`}
                    iconClassName="h-3.5 w-3.5"
                    tooltip="Copy result"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 px-2 text-[11px] font-medium gap-1 text-primary hover:text-primary hover:bg-primary/10"
                    onClick={() => onSelectMethod(item.methodId)}
                  >
                    Use this
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
