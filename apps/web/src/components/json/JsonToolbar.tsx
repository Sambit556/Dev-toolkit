'use client';

import React, { useRef } from 'react';
import {
  Code2, Minimize2, CheckCircle, Trash2, Copy, Download,
  Upload, ChevronDown, ChevronUp, Search, X, History,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Tooltip, TooltipContent, TooltipTrigger, TooltipProvider,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const TONE_STYLES = {
  blue: 'border border-blue-600/90 bg-blue-600 text-white shadow-sm hover:bg-blue-700 hover:border-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 dark:border-blue-500',
  emerald: 'border border-emerald-600/90 bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 hover:border-emerald-700 dark:bg-emerald-600 dark:hover:bg-emerald-500 dark:border-emerald-500',
  amber: 'border border-amber-600/90 bg-amber-600 text-white shadow-sm hover:bg-amber-700 hover:border-amber-700 dark:bg-amber-600 dark:hover:bg-amber-500 dark:border-amber-500',
} as const;

interface JsonToolbarProps {
  onFormat: () => void;
  onMinify: () => void;
  onValidate: () => void;
  onClear: () => void;
  onCopy: () => void;
  onDownload: () => void;
  onUpload: (content: string) => void;
  onExpandAll: () => void;
  onCollapseAll: () => void;
  onOpenHistory: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  isValid: boolean | null;
  inputSize: number;
}

function ToolBtn({
  icon: Icon,
  label,
  onClick,
  variant = 'outline',
  tone,
  disabled,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  variant?: 'ghost' | 'outline' | 'default';
  tone?: keyof typeof TONE_STYLES;
  disabled?: boolean;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={variant}
          size="sm"
          onClick={onClick}
          disabled={disabled}
          className={cn('h-8 gap-1.5 text-xs font-medium', tone && TONE_STYLES[tone])}
        >
          <Icon className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{label}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{label}</TooltipContent>
    </Tooltip>
  );
}

export function JsonToolbar({
  onFormat,
  onMinify,
  onValidate,
  onClear,
  onCopy,
  onDownload,
  onUpload,
  onExpandAll,
  onCollapseAll,
  onOpenHistory,
  searchQuery,
  onSearchChange,
  isValid,
  inputSize,
}: JsonToolbarProps) {
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_BYTES = 200 * 1024 * 1024; // 200 MB
    if (file.size > MAX_BYTES) {
      alert(`File too large (${(file.size / 1024 / 1024).toFixed(0)} MB). Maximum supported size is 200 MB.`);
      return;
    }

    // Use streaming chunks for large files to avoid UI freeze
    const CHUNK = 8 * 1024 * 1024; // 8 MB per chunk
    let offset = 0;
    const chunks: string[] = [];

    const readNextChunk = () => {
      const blob = file.slice(offset, offset + CHUNK);
      const reader = new FileReader();
      reader.onload = (ev) => {
        chunks.push(ev.target?.result as string);
        offset += CHUNK;
        if (offset < file.size) {
          readNextChunk();
        } else {
          onUpload(chunks.join(''));
        }
      };
      reader.onerror = () => alert('Failed to read file.');
      reader.readAsText(blob);
    };

    readNextChunk();
    e.target.value = '';
  };

  const sizeLabel =
    inputSize > 1024 * 1024
      ? `${(inputSize / 1024 / 1024).toFixed(1)} MB`
      : inputSize > 1024
        ? `${(inputSize / 1024).toFixed(1)} KB`
        : `${inputSize} B`;

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex flex-wrap items-center gap-1.5 px-3 py-2 border-b bg-muted/20">
        {/* Primary actions */}
        <ToolBtn icon={Code2} label="Format" onClick={onFormat} tone="blue" />
        <ToolBtn icon={CheckCircle} label="Validate & Fix" onClick={onValidate} tone="emerald" />
        <ToolBtn icon={Minimize2} label="Minify" onClick={onMinify} />

        <Separator orientation="vertical" className="h-6 mx-0.5" />

        {/* Copy / Download / Upload */}
        <ToolBtn icon={Copy} label="Copy" onClick={onCopy} />
        <ToolBtn icon={Download} label="Download" onClick={onDownload} />

        <input
          ref={fileRef}
          type="file"
          accept=".json,application/json,text/plain"
          className="hidden"
          onChange={handleFileChange}
        />
        <ToolBtn icon={Upload} label="Load File" onClick={() => fileRef.current?.click()} tone="amber" />
        <ToolBtn icon={History} label="History" onClick={onOpenHistory} />

        <Separator orientation="vertical" className="h-6 mx-0.5" />

        {/* Expand / Collapse */}
        <ToolBtn icon={ChevronDown} label="Expand All" onClick={onExpandAll} />
        <ToolBtn icon={ChevronUp} label="Collapse All" onClick={onCollapseAll} />

        <Separator orientation="vertical" className="h-6 mx-0.5" />

        {/* Search */}
        <div className="flex items-center gap-1.5 flex-1 min-w-[160px] max-w-[240px] h-7 px-2 rounded-md border border-input bg-background transition-shadow focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1">
          <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <Input
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search key/value..."
            className="h-full text-xs border-0 bg-transparent shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
          />
          {searchQuery && (
            <Button variant="ghost" size="icon-sm" className="h-5 w-5 shrink-0" onClick={() => onSearchChange('')}>
              <X className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="ml-auto flex items-center gap-2">
          {inputSize > 0 && (
            <span className="text-xs text-muted-foreground tabular-nums">{sizeLabel}</span>
          )}
          {isValid !== null && (
            <span
              className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium',
                isValid
                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400'
                  : 'bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-400',
              )}
            >
              {isValid ? '✓ Valid JSON' : '✗ Invalid JSON'}
            </span>
          )}
        </div>

        {/* Clear */}
        <Button variant="ghost" size="sm" onClick={onClear} className="h-8 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10">
          <Trash2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline ml-1">Clear</span>
        </Button>
      </div>
    </TooltipProvider>
  );
}
