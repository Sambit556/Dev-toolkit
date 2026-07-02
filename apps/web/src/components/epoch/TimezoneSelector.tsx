'use client';

import React, { useState, useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Globe } from 'lucide-react';

const ALL_TIMEZONES = Intl.supportedValuesOf('timeZone');

const POPULAR = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Los_Angeles',
  'America/Toronto',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Asia/Kolkata',
  'Asia/Singapore',
  'Australia/Sydney',
  'Pacific/Auckland',
];

interface TimezoneSelectorProps {
  value: string;
  onChange: (tz: string) => void;
}

export function TimezoneSelector({ value, onChange }: TimezoneSelectorProps) {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(false);

  const filtered = useMemo(() => {
    if (!search) return POPULAR;
    const q = search.toLowerCase();
    return ALL_TIMEZONES.filter((tz) => tz.toLowerCase().includes(q)).slice(0, 20);
  }, [search]);

  return (
    <div className="space-y-1.5">
      <Label className="flex items-center gap-1.5">
        <Globe className="h-3.5 w-3.5" />
        Timezone
      </Label>
      <div className="flex items-center gap-2">
        <Input
          value={search || value}
          onChange={(e) => {
            setSearch(e.target.value);
            setExpanded(true);
          }}
          onFocus={() => setExpanded(true)}
          onBlur={() => setTimeout(() => setExpanded(false), 200)}
          placeholder="Search timezone..."
          className="font-mono text-sm"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => { onChange('UTC'); setSearch(''); }}
          className="shrink-0"
        >
          UTC
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const local = Intl.DateTimeFormat().resolvedOptions().timeZone;
            onChange(local);
            setSearch('');
          }}
          className="shrink-0"
        >
          Local
        </Button>
      </div>

      {/* Current selected */}
      {!search && value && (
        <p className="text-xs text-muted-foreground">
          Selected: <span className="font-mono font-medium text-foreground">{value}</span>
          {' · '}
          <span>
            {new Intl.DateTimeFormat('en-US', {
              timeZone: value,
              timeZoneName: 'long',
            }).formatToParts(new Date()).find((p) => p.type === 'timeZoneName')?.value}
          </span>
        </p>
      )}

      {/* Dropdown */}
      {expanded && (
        <div className="border rounded-md bg-popover shadow-md max-h-48 overflow-y-auto z-10 relative">
          {!search && (
            <div className="px-2 py-1 text-xs text-muted-foreground font-medium border-b">
              Popular Timezones
            </div>
          )}
          {filtered.map((tz) => (
            <button
              key={tz}
              className="w-full text-left px-3 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground transition-colors font-mono"
              onMouseDown={() => {
                onChange(tz);
                setSearch('');
                setExpanded(false);
              }}
            >
              {tz}
              {tz === value && ' ✓'}
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="px-3 py-2 text-sm text-muted-foreground">No timezones found</div>
          )}
        </div>
      )}
    </div>
  );
}
