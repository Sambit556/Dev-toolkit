'use client';

import React from 'react';
import { usePreferencesStore } from '@/store/preferences';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { TimezoneSelector } from './TimezoneSelector';
import { toast } from 'sonner';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import type { TimestampUnit, DateFormat } from '@devchrono/shared';

const UNITS: { value: TimestampUnit; label: string }[] = [
  { value: 'seconds', label: 'Seconds' },
  { value: 'milliseconds', label: 'Milliseconds' },
  { value: 'nanoseconds', label: 'Nanoseconds' },
];

const DATE_FORMATS: { value: DateFormat; label: string }[] = [
  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
  { value: 'YYYY-MM-DD HH:mm:ss', label: 'YYYY-MM-DD HH:mm:ss' },
  { value: 'ISO8601', label: 'ISO 8601' },
  { value: 'RFC2822', label: 'RFC 2822' },
  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
  { value: 'DD-MM-YYYY', label: 'DD-MM-YYYY' },
];

export function EpochPreferences() {
  const prefs = usePreferencesStore();

  const handleReset = () => {
    prefs.reset();
    toast.success('Preferences reset to defaults');
  };

  return (
    <div className="space-y-6 max-w-md">
      <div className="space-y-1.5">
        <Label>Default Timestamp Unit</Label>
        <Select value={prefs.defaultUnit} onValueChange={(v) => prefs.setDefaultUnit(v as TimestampUnit)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {UNITS.map((u) => (
              <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label>Default Date Format</Label>
        <Select value={prefs.defaultDateFormat} onValueChange={(v) => prefs.setDefaultDateFormat(v as DateFormat)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DATE_FORMATS.map((f) => (
              <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <TimezoneSelector value={prefs.defaultTimezone} onChange={prefs.setDefaultTimezone} />
      </div>

      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>24-Hour Format</Label>
          <p className="text-xs text-muted-foreground">
            {prefs.use24Hour ? '13:00:00' : '1:00:00 PM'}
          </p>
        </div>
        <Switch
          checked={prefs.use24Hour}
          onCheckedChange={prefs.setUse24Hour}
        />
      </div>

      <Button variant="outline" onClick={handleReset} size="sm">
        Reset to Defaults
      </Button>
    </div>
  );
}
