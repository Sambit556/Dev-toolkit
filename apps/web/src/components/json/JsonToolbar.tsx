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
  variant = 'ghost',
  disabled,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  variant?: 'ghost' | 'outline' | 'default';
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
          className="h-8 gap-1.5 text-xs"
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
        {/* Format / Validate / Minify */}
        <ToolBtn icon={Code2} label="Format" onClick={onFormat} />
        <ToolBtn icon={CheckCircle} label="Validate & Fix" onClick={onValidate} />
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
        <ToolBtn icon={Upload} label="Load File" onClick={() => fileRef.current?.click()} />
        <ToolBtn icon={History} label="History" onClick={onOpenHistory} />

        <Separator orientation="vertical" className="h-6 mx-0.5" />

        {/* Expand / Collapse */}
        <ToolBtn icon={ChevronDown} label="Expand All" onClick={onExpandAll} />
        <ToolBtn icon={ChevronUp} label="Collapse All" onClick={onCollapseAll} />

        <Separator orientation="vertical" className="h-6 mx-0.5" />

        {/* Search */}
        <div className="flex items-center gap-1.5 flex-1 min-w-[160px] max-w-[240px] h-7 px-2 rounded-md border border-input bg-background ring-2 ring-ring ring-offset-1">
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
              className={`text-xs font-medium ${isValid ? 'text-green-600 dark:text-green-400' : 'text-destructive'}`}
            >
              {isValid ? '✓ Valid JSON' : '✗ Invalid JSON'}
            </span>
          )}
        </div>

        {/* Clear */}
        <Button variant="ghost" size="sm" onClick={onClear} className="h-8 text-xs text-muted-foreground hover:text-destructive">
          <Trash2 className="h-3.5 w-3.5" />
          <span className="hidden sm:inline ml-1">Clear</span>
        </Button>
      </div>
    </TooltipProvider>
  );
}
