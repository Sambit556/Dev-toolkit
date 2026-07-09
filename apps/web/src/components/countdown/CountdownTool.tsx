'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Timer, Play, Pause, RotateCcw, Volume2, VolumeX, ListRestart, Flag, Trash2, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

// Helper to format time: seconds -> HH:MM:SS
const formatTime = (seconds: number): string => {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

// Play a simple beep sound using browser Web Audio API
const playBeep = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    const tones = [523.25, 659.25, 783.99]; // C5, E5, G5
    const duration = 0.15;
    
    tones.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.18);
      
      gainNode.gain.setValueAtTime(0.3, ctx.currentTime + idx * 0.18);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.18 + duration);
      
      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      
      osc.start(ctx.currentTime + idx * 0.18);
      osc.stop(ctx.currentTime + idx * 0.18 + duration);
    });
  } catch (err) {
    console.error('AudioContext error:', err);
  }
};

export function CountdownTool() {
  const [activeTab, setActiveTab] = useState('timer');

  // --- TIMER STATES ---
  const [timerHrs, setTimerHrs] = useState<number>(0);
  const [timerMins, setTimerMins] = useState<number>(5);
  const [timerSecs, setTimerSecs] = useState<number>(0);
  
  const [totalSeconds, setTotalSeconds] = useState<number>(300); // 5 mins
  const [secondsLeft, setSecondsLeft] = useState<number>(300);
  const [isTimerRunning, setIsTimerRunning] = useState<boolean>(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState<boolean>(true);
  
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // --- STOPWATCH STATES ---
  const [swTime, setSwTime] = useState<number>(0); // milliseconds
  const [isSwRunning, setIsSwRunning] = useState<boolean>(false);
  const [laps, setLaps] = useState<{ id: number; split: number; lapTime: number }[]>([]);
  
  const swIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateRef = useRef<number>(0);

  // --- TIMER EFFECTS & CONTROLS ---
  useEffect(() => {
    if (isTimerRunning) {
      const formatted = formatTime(secondsLeft);
      document.title = `(${formatted}) Countdown`;

      timerIntervalRef.current = setInterval(() => {
        setSecondsLeft((prev) => {
          if (prev <= 1) {
            setIsTimerRunning(false);
            if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
            document.title = 'Time\'s Up! - DevToolkit';
            toast.success('Timer Completed!');
            if (isSoundEnabled) playBeep();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      document.title = 'Countdown & Stopwatch — DevToolkit';
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }

    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isTimerRunning, secondsLeft, isSoundEnabled]);

  const handleStartTimer = () => {
    const total = timerHrs * 3600 + timerMins * 60 + timerSecs;
    if (total <= 0) {
      toast.error('Please configure a valid duration');
      return;
    }
    setTotalSeconds(total);
    setSecondsLeft(total);
    setIsTimerRunning(true);
  };

  const handlePauseTimer = () => {
    setIsTimerRunning(false);
  };

  const handleResumeTimer = () => {
    setIsTimerRunning(true);
  };

  const handleResetTimer = () => {
    setIsTimerRunning(false);
    const total = timerHrs * 3600 + timerMins * 60 + timerSecs;
    setSecondsLeft(total > 0 ? total : 300);
    setTotalSeconds(total > 0 ? total : 300);
    toast.success('Timer reset');
  };

  const handlePreset = (mins: number) => {
    setIsTimerRunning(false);
    setTimerHrs(0);
    setTimerMins(mins);
    setTimerSecs(0);
    setTotalSeconds(mins * 60);
    setSecondsLeft(mins * 60);
    toast.success(`Preset loaded: ${mins} minutes`);
  };

  // SVG circular progress computation
  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const progressPct = totalSeconds > 0 ? secondsLeft / totalSeconds : 1;
  const strokeOffset = circumference - progressPct * circumference;

  // --- STOPWATCH EFFECTS & CONTROLS ---
  useEffect(() => {
    if (isSwRunning) {
      lastUpdateRef.current = performance.now();
      swIntervalRef.current = setInterval(() => {
        const now = performance.now();
        const delta = now - lastUpdateRef.current;
        lastUpdateRef.current = now;
        setSwTime((prev) => prev + delta);
      }, 10);
    } else {
      if (swIntervalRef.current) clearInterval(swIntervalRef.current);
    }

    return () => {
      if (swIntervalRef.current) clearInterval(swIntervalRef.current);
    };
  }, [isSwRunning]);

  const formatSwTime = (ms: number): string => {
    const hrs = Math.floor(ms / 3600000);
    const mins = Math.floor((ms % 3600000) / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    const cents = Math.floor((ms % 1000) / 10);
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${cents.toString().padStart(2, '0')}`;
  };

  const handleStartSw = () => {
    setIsSwRunning(true);
  };

  const handlePauseSw = () => {
    setIsSwRunning(false);
  };

  const handleResetSw = () => {
    setIsSwRunning(false);
    setSwTime(0);
    setLaps([]);
    toast.success('Stopwatch reset');
  };

  const handleLapSw = () => {
    const split = swTime;
    const lastLapSplit = laps.length > 0 ? laps[0].split : 0;
    const lapTime = split - lastLapSplit;
    const newLap = {
      id: laps.length > 0 ? Math.max(...laps.map(l => l.id)) + 1 : 1,
      split,
      lapTime,
    };
    setLaps([newLap, ...laps]);
  };

  const handleDeleteLap = (id: number) => {
    setLaps(laps.filter((l) => l.id !== id));
    toast.success('Lap deleted');
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <div className="flex justify-center">
        <TabsList className="grid grid-cols-2 w-full max-w-md h-auto p-1 gap-1 bg-background/50 backdrop-blur border border-primary/10 rounded-xl">
          <TabsTrigger value="timer" className="gap-2 py-2 text-xs font-bold transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">
            <Timer className="h-4 w-4" />
            Countdown Timer
          </TabsTrigger>
          <TabsTrigger value="stopwatch" className="gap-2 py-2 text-xs font-bold transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">
            <Clock className="h-4 w-4" />
            Stopwatch
          </TabsTrigger>
        </TabsList>
      </div>

      {/* --- COUNTDOWN TIMER CONTENT --- */}
      <TabsContent value="timer" className="m-0 space-y-6 animate-fade-in">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Controls / Inputs */}
          <Card className="border border-border/80 bg-card/40 backdrop-blur shadow-[0_10px_30px_rgba(0,0,0,0.05)] dark:shadow-[0_10px_30px_rgba(0,0,0,0.3)] md:col-span-1 h-fit">
            <CardContent className="p-5 space-y-5">
              <div className="flex items-center justify-between pb-2 border-b border-border/40">
                <span className="font-bold text-sm text-foreground flex items-center gap-1.5">
                  <Timer className="h-4 w-4 text-primary" />
                  Timer Settings
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg hover:bg-primary/15 hover:text-primary transition-all text-muted-foreground"
                  onClick={() => setIsSoundEnabled(!isSoundEnabled)}
                  title={isSoundEnabled ? 'Disable Alarm Sound' : 'Enable Alarm Sound'}
                >
                  {isSoundEnabled ? <Volume2 className="h-4.5 w-4.5 text-primary" /> : <VolumeX className="h-4.5 w-4.5 text-muted-foreground/50" />}
                </Button>
              </div>

              {/* Time Configuration Inputs */}
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="timer-hrs" className="text-[9px] font-black text-muted-foreground/80 uppercase tracking-widest block text-center">Hours</Label>
                  <Input
                    id="timer-hrs"
                    type="number"
                    min={0}
                    max={23}
                    value={timerHrs}
                    onChange={(e) => setTimerHrs(Math.min(23, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="h-10 text-center font-mono font-bold text-base bg-background/50"
                    disabled={isTimerRunning}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="timer-mins" className="text-[9px] font-black text-muted-foreground/80 uppercase tracking-widest block text-center">Minutes</Label>
                  <Input
                    id="timer-mins"
                    type="number"
                    min={0}
                    max={59}
                    value={timerMins}
                    onChange={(e) => setTimerMins(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="h-10 text-center font-mono font-bold text-base bg-background/50"
                    disabled={isTimerRunning}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="timer-secs" className="text-[9px] font-black text-muted-foreground/80 uppercase tracking-widest block text-center">Seconds</Label>
                  <Input
                    id="timer-secs"
                    type="number"
                    min={0}
                    max={59}
                    value={timerSecs}
                    onChange={(e) => setTimerSecs(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                    className="h-10 text-center font-mono font-bold text-base bg-background/50"
                    disabled={isTimerRunning}
                  />
                </div>
              </div>

              {/* Presets List */}
              <div className="space-y-2 pt-3 border-t border-border/40">
                <span className="text-[9px] font-black text-muted-foreground/80 uppercase tracking-widest block">Quick Presets</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {[1, 5, 10, 15, 30, 60].map((mins) => (
                    <Button
                      key={mins}
                      variant="outline"
                      size="sm"
                      onClick={() => handlePreset(mins)}
                      className="h-8 text-xs font-mono font-semibold bg-background/30 hover:bg-primary/10 hover:text-primary transition-all duration-200"
                      disabled={isTimerRunning}
                    >
                      {mins >= 60 ? `${mins / 60}h` : `${mins}m`}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Visual Display Card */}
          <Card className="border border-primary/20 bg-card/60 backdrop-blur-md shadow-[0_15px_40px_rgba(59,130,246,0.08)] dark:shadow-[0_15px_40px_rgba(59,130,246,0.18)] md:col-span-2 flex flex-col justify-center items-center py-10 relative overflow-hidden">
            {/* Glow effect backdrops */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/10 dark:bg-primary/5 rounded-full blur-[60px] pointer-events-none" />

            <CardContent className="flex flex-col items-center gap-8 w-full max-w-sm relative z-10">
              
              {/* Circular SVG Progress Display */}
              <div className="relative w-56 h-56 flex items-center justify-center filter drop-shadow-[0_0_12px_rgba(59,130,246,0.2)]">
                <svg className="w-full h-full -rotate-90">
                  <defs>
                    <linearGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#3b82f6" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                  {/* Background Track */}
                  <circle
                    cx="112"
                    cy="112"
                    r={radius}
                    className="stroke-muted/40 dark:stroke-muted/15 fill-none"
                    strokeWidth="6"
                  />
                  {/* Foreground progress path */}
                  <circle
                    cx="112"
                    cy="112"
                    r={radius}
                    className="fill-none transition-all duration-300 ease-linear"
                    stroke="url(#timerGrad)"
                    strokeWidth="6.5"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeOffset}
                    strokeLinecap="round"
                  />
                </svg>
                
                {/* Time string in center */}
                <div className="absolute flex flex-col items-center justify-center">
                  <span className="text-4xl font-black font-mono tracking-tight text-foreground select-none">
                    {formatTime(secondsLeft)}
                  </span>
                  <span className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1 select-none">
                    {secondsLeft === 0 ? 'Completed' : 'remaining'}
                  </span>
                </div>
              </div>

              {/* Action Control Buttons */}
              <div className="flex gap-3 justify-center w-full">
                {secondsLeft === totalSeconds && !isTimerRunning ? (
                  <Button onClick={handleStartTimer} className="w-36 gap-2 text-xs font-bold h-10 shadow-lg shadow-primary/25 hover:shadow-primary/35 transition-all duration-200">
                    <Play className="h-4 w-4 fill-current" /> Start Timer
                  </Button>
                ) : (
                  <>
                    {isTimerRunning ? (
                      <Button onClick={handlePauseTimer} variant="secondary" className="w-32 gap-2 text-xs h-10 font-bold">
                        <Pause className="h-4 w-4" /> Pause
                      </Button>
                    ) : (
                      <Button onClick={handleResumeTimer} className="w-32 gap-2 text-xs h-10 font-bold" disabled={secondsLeft === 0}>
                        <Play className="h-4 w-4 fill-current" /> Resume
                      </Button>
                    )}
                    <Button onClick={handleResetTimer} variant="outline" className="w-32 gap-2 text-xs h-10 text-red-500 hover:bg-red-500/10 font-bold border-red-500/20 hover:border-red-500/40 transition-all duration-200">
                      <RotateCcw className="h-4 w-4" /> Reset
                    </Button>
                  </>
                )}
              </div>

            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* --- STOPWATCH CONTENT --- */}
      <TabsContent value="stopwatch" className="m-0 space-y-6 animate-fade-in">
        <div className="grid gap-6 md:grid-cols-3">
          
          {/* Visual Digital Display */}
          <Card className="border border-primary/20 bg-card/60 backdrop-blur-md shadow-[0_15px_40px_rgba(99,102,241,0.08)] dark:shadow-[0_15px_40px_rgba(99,102,241,0.18)] md:col-span-2 flex flex-col justify-center items-center py-12 relative overflow-hidden">
            {/* Glow backdrops */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-[70px] pointer-events-none" />

            <CardContent className="flex flex-col items-center gap-8 w-full relative z-10">
              <div className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-foreground bg-black/5 dark:bg-black/30 py-5 px-8 rounded-2xl border border-border/60 shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] select-none text-center">
                {formatSwTime(swTime)}
              </div>

              {/* Control Action Buttons */}
              <div className="flex gap-3 justify-center">
                {isSwRunning ? (
                  <>
                    <Button onClick={handlePauseSw} variant="secondary" className="w-32 gap-2 text-xs h-10 font-bold">
                      <Pause className="h-4 w-4" /> Pause
                    </Button>
                    <Button onClick={handleLapSw} variant="outline" className="w-32 gap-2 text-xs h-10 font-bold border-indigo-500/20 text-indigo-500 hover:bg-indigo-500/10 hover:border-indigo-500/40">
                      <Flag className="h-4 w-4" /> Lap
                    </Button>
                  </>
                ) : (
                  <>
                    <Button onClick={handleStartSw} className="w-32 gap-2 text-xs h-10 font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20">
                      <Play className="h-4 w-4 fill-current" /> Start
                    </Button>
                    <Button onClick={handleResetSw} variant="outline" className="w-32 gap-2 text-xs h-10 text-red-500 hover:bg-red-500/10 font-bold border-red-500/20 hover:border-red-500/40" disabled={swTime === 0}>
                      <RotateCcw className="h-4 w-4" /> Reset
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Laps Record Table */}
          <Card className="border border-border/80 bg-card/45 backdrop-blur shadow-sm md:col-span-1 h-[360px] overflow-hidden flex flex-col">
            <div className="p-3 border-b border-border/40 bg-muted/40 font-mono text-[9px] font-black text-muted-foreground uppercase tracking-widest flex justify-between items-center shrink-0">
              <span className="flex items-center gap-1.5">
                <ListRestart className="h-3.5 w-3.5 text-primary" /> Laps Logged ({laps.length})
              </span>
              {laps.length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setLaps([])} className="h-5 text-red-500 hover:text-red-600 px-1 text-[9px] font-bold">
                  Clear All
                </Button>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto p-2 scrollbar-thin">
              {laps.length > 0 ? (
                <table className="w-full text-[11px] font-mono text-left border-collapse">
                  <thead>
                    <tr className="border-b border-border/30 text-muted-foreground text-[9px] font-black uppercase">
                      <th className="py-2 px-2">Lap</th>
                      <th className="py-2 px-2">Lap Time</th>
                      <th className="py-2 px-2 text-right">Delete</th>
                    </tr>
                  </thead>
                  <tbody>
                    {laps.map((lap) => (
                      <tr key={lap.id} className="border-b border-border/20 hover:bg-muted/40 group transition-colors">
                        <td className="py-2.5 px-2 font-bold text-muted-foreground">#{lap.id}</td>
                        <td className="py-2.5 px-2 text-foreground font-semibold">
                          +{formatSwTime(lap.lapTime)}
                          <p className="text-[9px] text-muted-foreground font-normal">Split: {formatSwTime(lap.split)}</p>
                        </td>
                        <td className="py-2.5 px-2 text-right">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteLap(lap.id)}
                            className="h-6 w-6 rounded text-red-500/60 hover:text-red-600 hover:bg-red-500/10 opacity-70 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-xs text-muted-foreground/40 italic p-4 text-center">
                  <Flag className="h-6 w-6 text-muted-foreground/20 mb-1.5" />
                  Press Lap when running to record splits
                </div>
              )}
            </div>
          </Card>

        </div>
      </TabsContent>
    </Tabs>
  );
}
