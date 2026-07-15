'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface HistoryEntry {
  id: string;
  tool: 'epoch' | 'json' | 'diff' | 'calculator';
  input: string;
  output: string;
  timestamp: number;
  label?: string;
}

interface HistoryState {
  entries: HistoryEntry[];
  addEntry: (entry: Omit<HistoryEntry, 'id' | 'timestamp'>) => void;
  removeEntry: (id: string) => void;
  clearAll: () => void;
  clearByTool: (tool: HistoryEntry['tool']) => void;
}

const MAX_ENTRIES = 20;

export const useHistoryStore = create<HistoryState>()(
  persist(
    (set) => ({
      entries: [],
      addEntry: (entry) =>
        set((state) => {
          const newEntry: HistoryEntry = {
            ...entry,
            id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
            timestamp: Date.now(),
          };
          const entries = [newEntry, ...state.entries].slice(0, MAX_ENTRIES);
          return { entries };
        }),
      removeEntry: (id) =>
        set((state) => ({
          entries: state.entries.filter((e) => e.id !== id),
        })),
      clearAll: () => set({ entries: [] }),
      clearByTool: (tool) =>
        set((state) => ({
          entries: state.entries.filter((e) => e.tool !== tool),
        })),
    }),
    {
      name: 'devchrono-history',
    },
  ),
);
