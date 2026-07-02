'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Copy, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { copyToClipboard } from '@/lib/utils';
import { formatDateForDisplay } from '@/lib/epoch';
import { usePreferencesStore } from '@/store/preferences';
import { TimezoneSelector } from './TimezoneSelector';

interface ClockRow {
  label: string;
  value: string;
  unit: string;
  badge?: string;
}

function getClockValues(): ClockRow[] {
  const now = Date.now();
  const sec = Math.floor(now / 1000);
  const nano = BigInt(now) * BigInt(1_000_000);

  return [
    { label: 'Seconds', value: sec.toString(), unit: 's', badge: '10 digits' },
    { label: 'Milliseconds', value: now.toString(), unit: 'ms', badge: '13 digits' },
    { label: 'Nanoseconds', value: nano.toString(), unit: 'ns', badge: '19 digits' },
  ];
}

export function LiveClock() {
  const prefs = usePreferencesStore();
  // Start empty so server and client render the same markup on hydration;
  // Date.now() is filled in on mount (client-only) instead of during render.
  const [rows, setRows] = useState<ClockRow[]>([]);
  const [timezone, setTimezone] = useState('Asia/Kolkata');
  const [localTime, setLocalTime] = useState('');
  const [isRunning, setIsRunning] = useState(true);
  const [tick, setTick] = useState(false);

  useEffect(() => {
    const update = () => {
      setRows(getClockValues());
      setLocalTime(formatDateForDisplay(new Date(), timezone, prefs.use24Hour));
    };
    update();
    if (!isRunning) return;
    const id = setInterval(() => {
      update();
      setTick((t) => !t);
    }, 1000);
    return () => clearInterval(id);
  }, [isRunning, timezone, prefs.use24Hour]);

  const handleCopy = useCallback(async (value: string, label: string) => {
    try {
      await copyToClipboard(value);
      toast.success(`Copied ${label} timestamp`);
    } catch {
      toast.error('Failed to copy');
    }
  }, []);

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <div className={`h-2 w-2 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground'}`} />
          <span className="text-sm font-medium">Live Unix Timestamp</span>
        </div>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setIsRunning((r) => !r)}
          title={isRunning ? 'Pause' : 'Resume'}
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRunning ? 'animate-spin' : ''}`} style={{ animationDuration: '3s' }} />
        </Button>
      </div>

      <div className="px-4 py-3 border-b bg-muted/10">
        <TimezoneSelector value={timezone} onChange={setTimezone} />
        {localTime && (
          <p className="mt-2 text-sm">
            <span className="font-mono font-medium tabular-nums">{localTime}</span>
          </p>
        )}
      </div>

      <div className="divide-y">
        {rows.map(({ label, value, unit, badge }) => (
          <div
            key={label}
            className="flex items-center justify-between px-4 py-3 group hover:bg-muted/20 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground w-24 shrink-0">{label}</span>
                {badge && (
                  <Badge variant="outline" className="text-[10px] py-0 hidden sm:inline-flex">
                    {badge}
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <code className="font-mono text-sm font-medium tabular-nums tracking-tight">
                {value}
              </code>
              <span className="text-xs text-muted-foreground w-6 text-right">{unit}</span>
              <Button
                variant="ghost"
                size="icon-sm"
                className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6"
                onClick={() => handleCopy(value, label)}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
