'use client';

import React, { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CopyButton } from '@/components/ui/copy-button';
import { getAllCaesarShifts } from '@/lib/encoder-decoder';
import { Check, Sparkles } from 'lucide-react';

interface CaesarMatrixModalProps {
  isOpen: boolean;
  onClose: () => void;
  inputText: string;
  onSelectShift: (shift: number) => void;
}

export function CaesarMatrixModal({
  isOpen,
  onClose,
  inputText,
  onSelectShift,
}: CaesarMatrixModalProps) {
  const shifts = useMemo(() => {
    if (!inputText) return [];
    return getAllCaesarShifts(inputText);
  }, [inputText]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col">
        <DialogHeader className="pb-2 border-b">
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <Sparkles className="h-4 w-4 text-primary" />
            Caesar Cipher 25-Shift Brute Force Matrix
          </DialogTitle>
          <DialogDescription className="text-xs">
            All 25 possible Caesar shifts ranked automatically by English letter frequency analysis.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1 py-3 scrollbar-thin">
          {shifts.map((item, idx) => {
            const isTopMatch = idx === 0 && item.score > 500;
            return (
              <div
                key={item.shift}
                className={`p-3 rounded-lg border text-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isTopMatch
                    ? 'bg-primary/10 border-primary/40 shadow-sm'
                    : 'bg-muted/20 border-border hover:bg-muted/40'
                }`}
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <Badge variant={isTopMatch ? 'default' : 'outline'} className="text-[10px] h-5 font-mono">
                      Shift {item.shift}
                    </Badge>
                    {isTopMatch && (
                      <span className="text-[11px] font-semibold text-primary flex items-center gap-1">
                        <Sparkles className="h-3 w-3" />
                        Most Likely Match (Score: {Math.round(item.score)})
                      </span>
                    )}
                  </div>
                  <p className="font-mono text-xs break-all bg-background/60 p-1.5 rounded border">
                    {item.text.length > 200 ? item.text.slice(0, 200) + '...' : item.text}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                  <CopyButton
                    value={item.text}
                    toastMessage={`Shift ${item.shift} text copied!`}
                    iconClassName="h-3.5 w-3.5"
                    tooltip="Copy text"
                  />
                  <Button
                    size="sm"
                    variant={isTopMatch ? 'default' : 'outline'}
                    className="h-7 text-xs gap-1"
                    onClick={() => {
                      onSelectShift(item.shift);
                      onClose();
                    }}
                  >
                    <Check className="h-3.5 w-3.5" />
                    Use Shift {item.shift}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
