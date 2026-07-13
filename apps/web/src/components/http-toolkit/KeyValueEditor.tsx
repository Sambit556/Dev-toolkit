'use client';

import React from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export interface KeyValuePair {
  key: string;
  value: string;
}

interface KeyValueEditorProps {
  pairs: KeyValuePair[];
  onChange: (pairs: KeyValuePair[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
  addLabel?: string;
}

export function KeyValueEditor({
  pairs,
  onChange,
  keyPlaceholder = 'Header name',
  valuePlaceholder = 'Value',
  addLabel = 'Add header',
}: KeyValueEditorProps) {
  const update = (index: number, field: 'key' | 'value', value: string) => {
    const next = pairs.slice();
    next[index] = { ...next[index], [field]: value };
    onChange(next);
  };

  const remove = (index: number) => {
    onChange(pairs.filter((_, i) => i !== index));
  };

  const add = () => {
    onChange([...pairs, { key: '', value: '' }]);
  };

  return (
    <div className="space-y-2">
      {pairs.map((pair, i) => (
        <div key={i} className="flex gap-2">
          <Input
            value={pair.key}
            onChange={(e) => update(i, 'key', e.target.value)}
            placeholder={keyPlaceholder}
            className="font-mono text-xs h-8"
          />
          <Input
            value={pair.value}
            onChange={(e) => update(i, 'value', e.target.value)}
            placeholder={valuePlaceholder}
            className="font-mono text-xs h-8"
          />
          <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={() => remove(i)}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={add} className="gap-1.5 text-xs h-7">
        <Plus className="h-3.5 w-3.5" />
        {addLabel}
      </Button>
    </div>
  );
}
