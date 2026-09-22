'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Volume2, VolumeX, Play, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';

interface MorseAudioPlayerProps {
  morseText: string;
}

export function MorseAudioPlayer({ morseText }: MorseAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [wpm, setWpm] = useState<number>(20);
  const [frequency, setFrequency] = useState<number>(650);
  const [currentIndex, setCurrentIndex] = useState<number>(-1);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const isPlayingRef = useRef<boolean>(false);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  const stopPlayback = useCallback(() => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    setCurrentIndex(-1);
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopPlayback();
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, [stopPlayback]);

  const playBeep = (durationMs: number, freq: number): Promise<void> => {
    return new Promise((resolve) => {
      if (!isPlayingRef.current) {
        resolve();
        return;
      }

      if (!audioCtxRef.current) {
        const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
        audioCtxRef.current = new AudioCtx();
      }

      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }

      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime);

      // Smooth attack and release to prevent audio clicking
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.005);
      gain.gain.setValueAtTime(0.2, ctx.currentTime + durationMs / 1000 - 0.005);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + durationMs / 1000);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + durationMs / 1000);

      osc.onended = () => {
        resolve();
      };
    });
  };

  const delay = (ms: number): Promise<void> => {
    return new Promise((resolve) => {
      if (!isPlayingRef.current) {
        resolve();
        return;
      }
      timeoutIdRef.current = setTimeout(resolve, ms);
    });
  };

  const handleTogglePlay = async () => {
    if (isPlaying) {
      stopPlayback();
      return;
    }

    if (!morseText || !/^[.\-/_| ]+$/.test(morseText)) {
      return;
    }

    isPlayingRef.current = true;
    setIsPlaying(true);

    // Standard Morse timing: dot = 1200 / WPM ms
    const dotDuration = 1200 / wpm;
    const dashDuration = dotDuration * 3;
    const symbolSpace = dotDuration;
    const letterSpace = dotDuration * 3;
    const wordSpace = dotDuration * 7;

    const chars = Array.from(morseText);

    for (let i = 0; i < chars.length; i++) {
      if (!isPlayingRef.current) break;

      setCurrentIndex(i);
      const symbol = chars[i];

      if (symbol === '.') {
        await playBeep(dotDuration, frequency);
        await delay(symbolSpace);
      } else if (symbol === '-') {
        await playBeep(dashDuration, frequency);
        await delay(symbolSpace);
      } else if (symbol === ' ') {
        await delay(letterSpace);
      } else if (symbol === '/' || symbol === '|') {
        await delay(wordSpace);
      }
    }

    stopPlayback();
  };

  const isMorseValid = morseText && /^[.\-/_| ]+$/.test(morseText.trim());

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-lg bg-muted/40 border text-xs">
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant={isPlaying ? 'destructive' : 'default'}
          disabled={!isMorseValid}
          onClick={handleTogglePlay}
          className="h-7 text-xs font-bold gap-1.5"
        >
          {isPlaying ? (
            <>
              <Square className="h-3.5 w-3.5 fill-current" />
              Stop Audio
            </>
          ) : (
            <>
              <Play className="h-3.5 w-3.5 fill-current" />
              Play Audio Beep
            </>
          )}
        </Button>
        <span className="text-[11px] text-muted-foreground">
          {isPlaying ? 'Playing Morse sequence...' : 'Listen to Morse sound'}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Label className="text-[10px] uppercase font-bold text-muted-foreground shrink-0">
            Speed: {wpm} WPM
          </Label>
          <Slider
            value={[wpm]}
            min={5}
            max={40}
            step={1}
            onValueChange={(val: number[]) => setWpm(val[0])}
            className="w-20"
          />
        </div>

        <div className="flex items-center gap-2">
          <Label className="text-[10px] uppercase font-bold text-muted-foreground shrink-0">
            Tone: {frequency}Hz
          </Label>
          <Slider
            value={[frequency]}
            min={400}
            max={1000}
            step={50}
            onValueChange={(val: number[]) => setFrequency(val[0])}
            className="w-16"
          />
        </div>
      </div>
    </div>
  );
}
