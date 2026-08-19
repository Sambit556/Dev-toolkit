'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Globe, Check, Clock, Compass } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  compact?: boolean;
  hideLabel?: boolean;
  hideQuickButtons?: boolean;
  className?: string;
}

export function TimezoneSelector({
  value,
  onChange,
  compact = false,
  hideLabel = false,
  hideQuickButtons = false,
  className,
}: TimezoneSelectorProps) {
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const localTz = useMemo(() => {
    try {
      return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata';
    } catch {
      return 'UTC';
    }
  }, []);

  const filtered = useMemo(() => {
    if (!search) return POPULAR;
    const q = search.toLowerCase();
    return ALL_TIMEZONES.filter((tz) => tz.toLowerCase().includes(q)).slice(0, 25);
  }, [search]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setExpanded(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {!hideLabel && !compact && (
        <Label className="flex items-center gap-1.5 mb-1.5 text-xs">
          <Globe className="h-3.5 w-3.5 text-muted-foreground" />
          Timezone
        </Label>
      )}

      <div className="flex items-center gap-1.5">
        <div className="relative flex-1">
          <Input
            value={expanded ? search : value}
            onChange={(e) => {
              setSearch(e.target.value);
              setExpanded(true);
            }}
            onFocus={() => {
              setSearch('');
              setExpanded(true);
            }}
            placeholder="Search timezone..."
            className={cn(
              'font-mono pr-8 transition-colors',
              compact ? 'h-8 text-xs' : 'text-sm',
              expanded && 'ring-2 ring-primary/20 border-primary'
            )}
          />
          <Globe className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        </div>

        {!hideQuickButtons && (
          <>
            <Button
              type="button"
              variant="outline"
              size={compact ? 'icon-sm' : 'sm'}
              onClick={() => {
                onChange('UTC');
                setSearch('');
                setExpanded(false);
              }}
              className={cn(compact ? 'h-8 px-2 text-[11px]' : 'shrink-0', 'text-xs font-medium')}
              title="Switch to UTC"
            >
              UTC
            </Button>
            <Button
              type="button"
              variant="outline"
              size={compact ? 'icon-sm' : 'sm'}
              onClick={() => {
                onChange(localTz);
                setSearch('');
                setExpanded(false);
              }}
              className={cn(compact ? 'h-8 px-2 text-[11px]' : 'shrink-0', 'text-xs font-medium')}
              title={`Switch to Local (${localTz})`}
            >
              Local
            </Button>
          </>
        )}
      </div>

      {/* Floating absolute dropdown */}
      {expanded && (
        <div className="absolute left-0 right-0 top-full mt-1.5 max-h-60 overflow-y-auto rounded-lg border bg-popover/95 backdrop-blur-md p-1 shadow-xl z-50 animate-fade-in text-popover-foreground">
          {!search && (
            <div className="p-1 space-y-1 border-b mb-1">
              <div className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                Quick Presets
              </div>
              <div className="grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => {
                    onChange(localTz);
                    setSearch('');
                    setExpanded(false);
                  }}
                  className={cn(
                    'flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors text-left border',
                    value === localTz
                      ? 'bg-primary/10 text-primary border-primary/30 font-bold'
                      : 'bg-muted/40 hover:bg-accent border-transparent text-foreground'
                  )}
                >
                  <Compass className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="truncate">Local ({localTz.split('/')[1] || localTz})</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onChange('UTC');
                    setSearch('');
                    setExpanded(false);
                  }}
                  className={cn(
                    'flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-colors text-left border',
                    value === 'UTC'
                      ? 'bg-primary/10 text-primary border-primary/30 font-bold'
                      : 'bg-muted/40 hover:bg-accent border-transparent text-foreground'
                  )}
                >
                  <Clock className="h-3.5 w-3.5 text-primary shrink-0" />
                  <span className="truncate">UTC (+00:00)</span>
                </button>
              </div>
            </div>
          )}

          {!search && (
            <div className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Popular Timezones
            </div>
          )}

          <div className="space-y-0.5">
            {filtered.map((tz) => {
              const isSelected = tz === value;
              return (
                <button
                  key={tz}
                  type="button"
                  onClick={() => {
                    onChange(tz);
                    setSearch('');
                    setExpanded(false);
                  }}
                  className={cn(
                    'w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-mono transition-colors text-left',
                    isSelected
                      ? 'bg-primary/10 text-primary font-bold'
                      : 'hover:bg-accent hover:text-accent-foreground text-foreground'
                  )}
                >
                  <span className="truncate">{tz}</span>
                  {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>

          {filtered.length === 0 && (
            <div className="px-3 py-3 text-xs text-muted-foreground text-center">
              No timezones matching &ldquo;{search}&rdquo;
            </div>
          )}
        </div>
      )}
    </div>
  );
}
