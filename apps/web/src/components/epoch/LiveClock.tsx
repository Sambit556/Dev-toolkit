'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { RefreshCw, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { CopyButton } from '@/components/ui/copy-button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
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
  const [rows, setRows] = useState<ClockRow[]>([]);
  const [timezone, setTimezone] = useState(prefs.defaultTimezone || 'Asia/Kolkata');
  const [localTime, setLocalTime] = useState('');
  const [isRunning, setIsRunning] = useState(true);
  const [tick, setTick] = useState(false);

  useEffect(() => {
    const effectiveTz = timezone || prefs.defaultTimezone || 'Asia/Kolkata';
    const update = () => {
      setRows(getClockValues());
      setLocalTime(formatDateForDisplay(new Date(), effectiveTz, prefs.use24Hour));
    };
    update();
    if (!isRunning) return;
    const id = setInterval(() => {
      update();
      setTick((t) => !t);
    }, 1000);
    return () => clearInterval(id);
  }, [isRunning, timezone, prefs.defaultTimezone, prefs.use24Hour]);

  const handleCopy = useCallback(async (value: string, label: string) => {
    try {
      await copyToClipboard(value);
      toast.success(`Copied ${label} timestamp`);
    } catch {
      toast.error('Failed to copy');
    }
  }, []);

  return (
    <div className="rounded-xl border bg-card shadow-sm p-3 sm:p-4 space-y-2.5">
      {/* Top compact control strip */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        {/* Left: Live status and 3 inline values */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 pr-2.5 border-r border-border/60">
            <span className="relative flex h-2.5 w-2.5">
              {isRunning && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              )}
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isRunning ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
            </span>
            <span className="text-xs sm:text-sm font-bold tracking-tight whitespace-nowrap">Live Epoch:</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {rows.map(({ label, value, unit }) => {
              const isMs = unit === 'ms';
              return (
                <div
                  key={unit}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-xs font-mono transition-all ${
                    isMs
                      ? 'bg-primary/10 border-primary/40 text-primary font-bold shadow-sm'
                      : 'bg-muted/40 border-border/70 hover:bg-muted/60 text-foreground'
                  }`}
                >
                  <span className="text-[10px] font-semibold text-muted-foreground uppercase">{unit}:</span>
                  <span className="tabular-nums tracking-tight select-all">{value || '—'}</span>
                  <CopyButton
                    action={() => handleCopy(value, label)}
                    toastMessage={false}
                    className="h-5 w-5 ml-0.5 text-muted-foreground hover:text-foreground"
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Timezone selector + Pause/Resume button */}
        <div className="flex items-center gap-2 w-full lg:w-auto">
          <div className="w-full sm:w-64">
            <TimezoneSelector
              value={timezone}
              onChange={setTimezone}
              compact
              hideLabel
              hideQuickButtons
            />
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={() => setIsRunning((r) => !r)}
                aria-label={isRunning ? 'Pause clock' : 'Resume clock'}
                className="shrink-0 h-8 w-8"
              >
                <RefreshCw className={`h-3.5 w-3.5 text-muted-foreground ${isRunning ? 'animate-spin' : ''}`} style={{ animationDuration: '4s' }} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{isRunning ? 'Pause live updates' : 'Resume live updates'}</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Local Time subtitle */}
      {localTime && (
        <div className="flex items-center justify-between pt-2 border-t border-border/40 text-[11px] text-muted-foreground font-mono">
          <div className="flex items-center gap-1.5 truncate">
            <Clock className="h-3.5 w-3.5 shrink-0 text-primary/70" />
            <span className="font-semibold text-foreground">Local:</span>
            <span className="text-foreground/90 truncate">{localTime}</span>
          </div>
          <span className="text-muted-foreground/70 hidden sm:inline shrink-0">{timezone}</span>
        </div>
      )}
    </div>
  );
}
