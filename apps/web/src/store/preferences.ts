'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { EpochPreferences } from '@devchrono/shared';
import { DEFAULT_PREFERENCES } from '@/lib/epoch';

interface PreferencesState extends EpochPreferences {
  setDefaultUnit: (unit: EpochPreferences['defaultUnit']) => void;
  setUse24Hour: (use24h: boolean) => void;
  setDefaultTimezone: (tz: string) => void;
  setDefaultDateFormat: (format: EpochPreferences['defaultDateFormat']) => void;
  reset: () => void;
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      ...DEFAULT_PREFERENCES,
      setDefaultUnit: (defaultUnit) => set({ defaultUnit }),
      setUse24Hour: (use24Hour) => set({ use24Hour }),
      setDefaultTimezone: (defaultTimezone) => set({ defaultTimezone }),
      setDefaultDateFormat: (defaultDateFormat) => set({ defaultDateFormat }),
      reset: () => set(DEFAULT_PREFERENCES),
    }),
    {
      name: 'devchrono-preferences',
    },
  ),
);
