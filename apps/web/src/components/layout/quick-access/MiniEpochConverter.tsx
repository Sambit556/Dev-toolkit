'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { CopyButton } from '@/components/ui/copy-button';

/* Small copy-to-clipboard icon button used throughout the mini panels, with a styled tooltip instead of a native title attribute */
function CopyIconButton({ onCopy, label, className }: { onCopy: () => void; label: string; className?: string }) {
  return (
    <CopyButton
      action={onCopy}
      tooltip={label}
      toastMessage={false}
      iconClassName="h-3.5 w-3.5"
      className={cn('p-1 h-auto w-auto ml-2 shrink-0', className)}
    />
  );
}

export function MiniEpochConverter() {
  const [liveEpoch, setLiveEpoch] = useState<number>(0);
  const [inputTs, setInputTs] = useState('');
  const [dateOutputLocal, setDateOutputLocal] = useState('');
  const [dateOutputUtc, setDateOutputUtc] = useState('');
  const [inputDate, setInputDate] = useState('');
  const [tsOutputSec, setTsOutputSec] = useState('');
  const [tsOutputMs, setTsOutputMs] = useState('');

  // Live timer clock: a genuine setInterval subscription to the passage of time.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLiveEpoch(Math.floor(Date.now() / 1000));
    const interval = setInterval(() => {
      setLiveEpoch(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const convertTs = () => {
    const clean = inputTs.trim();
    if (!clean) {
      setDateOutputLocal('');
      setDateOutputUtc('');
      return;
    }
    const val = Number(clean);
    if (isNaN(val) || val < 0) {
      setDateOutputLocal('Invalid Timestamp');
      setDateOutputUtc('Invalid Timestamp');
      return;
    }
    // Auto-detect seconds vs milliseconds
    const date = new Date(val > 99999999999 ? val : val * 1000);
    setDateOutputLocal(date.toLocaleString());
    setDateOutputUtc(date.toUTCString());
  };

  const convertDate = () => {
    if (!inputDate.trim()) {
      setTsOutputSec('');
      setTsOutputMs('');
      return;
    }
    const d = new Date(inputDate);
    if (isNaN(d.getTime())) {
      setTsOutputSec('Invalid Date');
      setTsOutputMs('Invalid Date');
      return;
    }
    setTsOutputSec(Math.floor(d.getTime() / 1000).toString());
    setTsOutputMs(d.getTime().toString());
  };

  return (
    <div className="p-3 bg-card space-y-3 font-medium text-xs leading-normal select-none" onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
      <div className="bg-muted/40 p-2.5 rounded-lg border flex flex-col gap-1">
        <span className="text-[10px] text-muted-foreground">Live Unix Epoch Time</span>
        <div className="flex items-center justify-between">
          <span className="font-mono text-base font-extrabold text-primary select-text">{liveEpoch}</span>
          <CopyIconButton
            onCopy={() => {
              navigator.clipboard.writeText(liveEpoch.toString());
              toast.success('Copied live timestamp!');
            }}
            label="Copy Live Timestamp"
          />
        </div>
      </div>

      {/* Timestamp -> Date */}
      <div className="space-y-1">
        <span className="text-[10px] text-muted-foreground uppercase font-black tracking-wider">Timestamp → Date</span>
        <div className="flex gap-1.5">
          <input
            type="text"
            value={inputTs}
            onChange={(e) => setInputTs(e.target.value)}
            placeholder="e.g. 1719918233"
            className="flex-1 px-2.5 py-1.5 bg-muted/40 border rounded-lg text-xs outline-none text-foreground font-mono"
          />
          <button onClick={convertTs} className="px-2.5 bg-primary text-primary-foreground hover:opacity-90 rounded-lg text-xs font-bold shrink-0">
            Go
          </button>
        </div>
        {dateOutputLocal && (
          <div className="space-y-1 animate-fade-in">
            <div className="flex items-center justify-between bg-muted/30 p-2 rounded-lg border">
              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                <span className="text-[8px] text-muted-foreground uppercase font-bold">Local Time</span>
                <span className="text-[10px] font-semibold text-foreground font-mono select-text truncate">
                  {dateOutputLocal}
                </span>
              </div>
              {dateOutputLocal !== 'Invalid Timestamp' && (
                <CopyIconButton
                  onCopy={() => {
                    navigator.clipboard.writeText(dateOutputLocal);
                    toast.success('Copied local date!');
                  }}
                  label="Copy local date"
                />
              )}
            </div>
            {dateOutputUtc && dateOutputUtc !== 'Invalid Timestamp' && (
              <div className="flex items-center justify-between bg-muted/30 p-2 rounded-lg border">
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <span className="text-[8px] text-muted-foreground uppercase font-bold">UTC Time</span>
                  <span className="text-[10px] font-semibold text-foreground font-mono select-text truncate">
                    {dateOutputUtc}
                  </span>
                </div>
                <CopyIconButton
                  onCopy={() => {
                    navigator.clipboard.writeText(dateOutputUtc);
                    toast.success('Copied UTC date!');
                  }}
                  label="Copy UTC date"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Date -> Timestamp */}
      <div className="space-y-1 pt-1.5 border-t">
        <span className="text-[10px] text-muted-foreground uppercase font-black tracking-wider">Date → Timestamp</span>
        <div className="flex gap-1.5">
          <input
            type="datetime-local"
            value={inputDate}
            onChange={(e) => setInputDate(e.target.value)}
            step="1"
            className="flex-1 px-2.5 py-1.5 bg-muted/40 border rounded-lg text-xs outline-none text-foreground"
          />
          <button onClick={convertDate} className="px-2.5 bg-primary text-primary-foreground hover:opacity-90 rounded-lg text-xs font-bold shrink-0">
            Go
          </button>
        </div>
        {tsOutputSec && (
          <div className="space-y-1 animate-fade-in">
            <div className="flex items-center justify-between bg-muted/30 p-2 rounded-lg border">
              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                <span className="text-[8px] text-muted-foreground uppercase font-bold">Seconds (s)</span>
                <span className="text-[10px] font-bold text-foreground font-mono select-text truncate">
                  {tsOutputSec}
                </span>
              </div>
              {tsOutputSec !== 'Invalid Date' && (
                <CopyIconButton
                  onCopy={() => {
                    navigator.clipboard.writeText(tsOutputSec);
                    toast.success('Copied seconds timestamp!');
                  }}
                  label="Copy seconds"
                />
              )}
            </div>
            {tsOutputMs && tsOutputMs !== 'Invalid Date' && (
              <div className="flex items-center justify-between bg-muted/30 p-2 rounded-lg border">
                <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                  <span className="text-[8px] text-muted-foreground uppercase font-bold">Milliseconds (ms)</span>
                  <span className="text-[10px] font-bold text-foreground font-mono select-text truncate">
                    {tsOutputMs}
                  </span>
                </div>
                <CopyIconButton
                  onCopy={() => {
                    navigator.clipboard.writeText(tsOutputMs);
                    toast.success('Copied milliseconds timestamp!');
                  }}
                  label="Copy milliseconds"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
