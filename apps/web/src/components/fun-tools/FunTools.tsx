'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Gamepad2, Coins, Disc, Users, RefreshCw, Trophy, Plus, Trash2, Sparkles, Info } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

function DieFace({ value }: { value: number }) {
  const pipsForValue: Record<number, number[]> = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8]
  };

  const activePips = pipsForValue[value] || [4];

  return (
    <div className="w-20 h-20 bg-gradient-to-br from-red-500 via-red-650 to-red-800 border-2 border-red-400/40 rounded-[20px] shadow-[inset_0_4px_8px_rgba(255,255,255,0.25),0_12px_24px_rgba(220,38,38,0.35)] grid grid-cols-3 p-4 gap-2.5 items-center justify-items-center relative overflow-hidden transition-all duration-150">
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent pointer-events-none" />
      {Array.from({ length: 9 }).map((_, idx) => {
        const hasPip = activePips.includes(idx);
        return (
          <div key={idx} className="h-4 w-4 flex items-center justify-center">
            <span
              className={cn(
                "h-3 w-3 rounded-full bg-white shadow-[0_1.5px_3px_rgba(0,0,0,0.45),inset_0_1px_1px_rgba(0,0,0,0.35)] transition-all duration-150 ease-out",
                hasPip ? "scale-100 opacity-100" : "scale-0 opacity-0"
              )}
            />
          </div>
        );
      })}
    </div>
  );
}

export function FunTools() {
  const [activeTab, setActiveTab] = useState('flip-coin');

  // --- 1. COIN FLIP STATES ---
  const [coinSide, setCoinSide] = useState<'heads' | 'tails'>('heads');
  const [isCoinFlipping, setIsCoinFlipping] = useState(false);
  const [flipTriggerCount, setFlipTriggerCount] = useState(0);
  const [flipHistory, setFlipHistory] = useState<string[]>([]);

  // --- 2. DICE ROLLER STATES ---
  const [diceCount, setDiceCount] = useState<1 | 2>(1);
  const [diceValues, setDiceValues] = useState<number[]>([1]);
  const [isDiceRolling, setIsDiceRolling] = useState(false);
  const [diceTriggerCount, setDiceTriggerCount] = useState(0);

  // --- 3. RANDOM PICKER STATES ---
  const [pickerInput, setPickerInput] = useState<string>('Option A\nOption B\nOption C\nOption D');
  const [pickerCount, setPickerCount] = useState<number>(1);
  const [pickerDuplicates, setPickerDuplicates] = useState<boolean>(false);
  const [pickerResult, setPickerResult] = useState<string[]>([]);
  const [isPicking, setIsPicking] = useState(false);
  const [pickerAnimText, setPickerAnimText] = useState<string>('');

  // --- 4. TEAM GENERATOR STATES ---
  const [teamNames, setTeamNames] = useState<string>('John\nJane\nBob\nAlice\nCharlie\nEmma\nDavid\nSophia');
  const [teamCount, setTeamCount] = useState<number>(2);
  const [generatedTeams, setGeneratedTeams] = useState<string[][]>([]);

  // --- 5. NAME WHEEL STATES ---
  const [wheelNames, setWheelNames] = useState<string>('Apple, Orange, Banana, Grapes, Mango');
  const [isWheelSpinning, setIsWheelSpinning] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  const wheelAngleRef = useRef(0);
  const wheelSpeedRef = useRef(0);
  const wheelColorsRef = useRef<string[]>([]);

  // --- COIN FLIP HANDLER ---
  const handleFlipCoin = () => {
    if (isCoinFlipping) return;
    
    // Choose result side immediately
    const nextSide = Math.random() > 0.5 ? 'heads' : 'tails';
    
    setCoinSide(nextSide);
    setIsCoinFlipping(true);
    setFlipTriggerCount((prev) => prev + 1);

    setTimeout(() => {
      setIsCoinFlipping(false);
      setFlipHistory((prev) => [nextSide === 'heads' ? 'Heads' : 'Tails', ...prev].slice(0, 10));
      toast.success(`It's ${nextSide === 'heads' ? 'Heads' : 'Tails'}!`);
    }, 1200); // match flip animation length
  };

  const handleDiceCountChange = (count: 1 | 2) => {
    setDiceCount(count);
    setDiceValues(Array.from({ length: count }).map(() => 1));
  };

  // --- DICE ROLLER HANDLER ---
  const handleRollDice = () => {
    if (isDiceRolling) return;
    setIsDiceRolling(true);
    setDiceTriggerCount((prev) => prev + 1);

    let count = 0;
    const interval = setInterval(() => {
      setDiceValues((prev) =>
        prev.map(() => Math.floor(Math.random() * 6) + 1)
      );
      count++;
      if (count >= 16) {
        clearInterval(interval);
        
        const finalValues = Array.from({ length: diceCount }).map(() =>
          Math.floor(Math.random() * 6) + 1
        );
        setDiceValues(finalValues);
        setIsDiceRolling(false);
        const total = finalValues.reduce((a, b) => a + b, 0);
        toast.success(`You rolled a total of ${total}! (${finalValues.join(', ')})`);
      }
    }, 75);
  };

  // --- RANDOM PICKER HANDLER ---
  const handlePickRandom = () => {
    if (isPicking) return;
    const list = pickerInput.split('\n').map(o => o.trim()).filter(o => o.length > 0);
    if (list.length === 0) {
      toast.error('Please input options to pick from');
      return;
    }

    setIsPicking(true);
    setPickerResult([]);
    
    let cycles = 0;
    const maxCycles = 15;
    const interval = setInterval(() => {
      const randomOption = list[Math.floor(Math.random() * list.length)];
      setPickerAnimText(randomOption);
      cycles++;
      
      if (cycles >= maxCycles) {
        clearInterval(interval);
        
        const count = Math.max(1, Math.min(list.length, pickerCount));
        const picked: string[] = [];
        const pool = [...list];

        for (let i = 0; i < count; i++) {
          if (pool.length === 0) break;
          const idx = Math.floor(Math.random() * pool.length);
          picked.push(pool[idx]);
          if (!pickerDuplicates) {
            pool.splice(idx, 1);
          }
        }
        
        setPickerResult(picked);
        setPickerAnimText('');
        setIsPicking(false);
        toast.success(`Picked ${picked.length} item(s)!`);
      }
    }, 90);
  };

  // --- TEAM GENERATOR HANDLER ---
  const handleGenerateTeams = () => {
    const list = teamNames.split('\n').map(n => n.trim()).filter(n => n.length > 0);
    if (list.length === 0) {
      toast.error('Please enter participant names');
      return;
    }
    if (teamCount < 1) {
      toast.error('Invalid number of teams');
      return;
    }

    // Shuffle list using Fisher-Yates
    const pool = [...list];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const temp = pool[i];
      pool[i] = pool[j];
      pool[j] = temp;
    }

    // Distribute into teams
    const teams: string[][] = Array.from({ length: teamCount }, () => []);
    pool.forEach((name, idx) => {
      teams[idx % teamCount].push(name);
    });

    setGeneratedTeams(teams.filter(t => t.length > 0));
    toast.success(`Divided into ${teamCount} teams!`);
  };

  // --- NAME WHEEL RENDERING & LOGIC ---
  const getNamesList = useCallback((): string[] => {
    return wheelNames.split(',').map(n => n.trim()).filter(n => n.length > 0);
  }, [wheelNames]);

  const drawWheel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const list = getNamesList();
    if (list.length === 0) return;

    const size = canvas.width;
    const center = size / 2;
    const radius = center - 12;

    ctx.clearRect(0, 0, size, size);

    // Premium slice colors
    if (wheelColorsRef.current.length !== list.length) {
      const colors = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#14b8a6', '#f97316', '#3b82f6'];
      wheelColorsRef.current = list.map((_, i) => colors[i % colors.length]);
    }

    const arcSize = (2 * Math.PI) / list.length;
    
    list.forEach((name, idx) => {
      const angle = wheelAngleRef.current + idx * arcSize;
      
      // Draw slice
      ctx.beginPath();
      ctx.fillStyle = wheelColorsRef.current[idx];
      ctx.moveTo(center, center);
      ctx.arc(center, center, radius, angle, angle + arcSize);
      ctx.lineTo(center, center);
      ctx.fill();
      
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Draw text label on slice
      ctx.save();
      ctx.translate(center, center);
      ctx.rotate(angle + arcSize / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10.5px "Outfit", sans-serif';
      ctx.fillText(name.substring(0, 11), radius - 18, 3.5);
      ctx.restore();
    });

    // Outer metallic rim
    ctx.beginPath();
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 4;
    ctx.arc(center, center, radius, 0, 2 * Math.PI);
    ctx.stroke();

    // Draw center pin knob with gloss reflection
    ctx.beginPath();
    ctx.fillStyle = '#1e293b';
    ctx.arc(center, center, 15, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.fillStyle = '#f1f5f9';
    ctx.arc(center - 3, center - 3, 3, 0, 2 * Math.PI);
    ctx.fill();
  }, [getNamesList]);

  useEffect(() => {
    if (activeTab === 'name-wheel') {
      drawWheel();
    }
  }, [activeTab, drawWheel]);

  const handleSpinWheel = () => {
    if (isWheelSpinning) return;
    const list = getNamesList();
    if (list.length === 0) {
      toast.error('Please add names to spin the wheel');
      return;
    }

    setIsWheelSpinning(true);
    // Random initial speed between 0.3 and 0.45 rad/frame
    wheelSpeedRef.current = Math.random() * 0.15 + 0.3;

    const animateSpin = () => {
      wheelAngleRef.current += wheelSpeedRef.current;
      // apply deceleration friction
      wheelSpeedRef.current *= 0.982;

      drawWheel();

      if (wheelSpeedRef.current < 0.002) {
        setIsWheelSpinning(false);
        wheelSpeedRef.current = 0;
        
        // Compute winning slice
        // The pointer is at 0 radians (right side). Winning slice matches the angle pointing right.
        const list = getNamesList();
        const arcSize = (2 * Math.PI) / list.length;
        
        // Normalize angle to 0 - 2PI range
        const normalizedAngle = (2 * Math.PI - (wheelAngleRef.current % (2 * Math.PI))) % (2 * Math.PI);
        const winIdx = Math.floor(normalizedAngle / arcSize);
        const winner = list[winIdx];
        
        toast.success(`Winner is: ${winner}!`, { duration: 5000 });
      } else {
        requestAnimationFrame(animateSpin);
      }
    };

    requestAnimationFrame(animateSpin);
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
      <div className="flex justify-center">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl h-auto p-1 gap-1">
          <TabsTrigger value="flip-coin" className="gap-2 py-2 text-xs">
            <Coins className="h-4 w-4" />
            Coin Flip
          </TabsTrigger>
          <TabsTrigger value="roll-dice" className="gap-2 py-2 text-xs">
            <Gamepad2 className="h-4 w-4" />
            Dice Roller
          </TabsTrigger>
          <TabsTrigger value="random-picker" className="gap-2 py-2 text-xs">
            <Trophy className="h-4 w-4" />
            Picker / Teams
          </TabsTrigger>
          <TabsTrigger value="name-wheel" className="gap-2 py-2 text-xs">
            <Disc className="h-4 w-4" />
            Name Wheel
          </TabsTrigger>
        </TabsList>
      </div>

      {/* --- 1. COIN FLIP --- */}
      <TabsContent value="flip-coin" className="m-0 space-y-6 animate-fade-in">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Action and controls */}
          <Card className="border bg-card/60 backdrop-blur-sm shadow-sm md:col-span-1 flex flex-col justify-between">
            <CardContent className="p-4 space-y-4">
              <div className="pb-2 border-b">
                <Label className="font-bold text-sm">Coin Flip</Label>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Flip a custom virtual coin with built-in 3D rotational perspectives. Results are computed locally and logged to history.
              </p>
              <Button onClick={handleFlipCoin} className="w-full font-bold gap-1 text-xs" disabled={isCoinFlipping}>
                <RefreshCw className={`h-4 w-4 ${isCoinFlipping ? 'animate-spin' : ''}`} />
                Flip Coin
              </Button>
            </CardContent>
          </Card>

          {/* 3D Coin Viewer Frame */}
          <Card className="border shadow-md md:col-span-2 flex flex-col justify-center items-center py-12 relative overflow-hidden">
            <CardContent className="flex flex-col items-center gap-8 w-full max-w-sm">
              
              {/* 3D Coin element using CSS transforms */}
              <div 
                key={flipTriggerCount}
                className="relative w-36 h-36 perspective-1000 flex items-center justify-center"
              >
                <div
                  className={cn(
                    "w-full h-full relative preserve-3d",
                    isCoinFlipping && coinSide === 'heads' && "animate-flip-heads",
                    isCoinFlipping && coinSide === 'tails' && "animate-flip-tails"
                  )}
                  style={{
                    transform: !isCoinFlipping && coinSide === 'tails' ? 'rotateX(180deg)' : 'rotateX(0deg)'
                  }}
                >
                  {/* 3D Edge layers to give the coin true physical thickness */}
                  <div className="absolute inset-0 rounded-full bg-amber-700/80 dark:bg-amber-800/80 preserve-3d" style={{ transform: 'translateZ(-2px)' }} />
                  <div className="absolute inset-0 rounded-full bg-amber-700/90 dark:bg-amber-850/90 preserve-3d" style={{ transform: 'translateZ(-1px)' }} />
                  <div className="absolute inset-0 rounded-full bg-amber-800 dark:bg-amber-900 preserve-3d" style={{ transform: 'translateZ(0px)' }} />
                  <div className="absolute inset-0 rounded-full bg-amber-850/90 dark:bg-amber-950/90 preserve-3d" style={{ transform: 'translateZ(1px)' }} />
                  <div className="absolute inset-0 rounded-full bg-amber-900/80 dark:bg-amber-950/80 preserve-3d" style={{ transform: 'translateZ(2px)' }} />

                  {/* Front Side (Heads) - Shiny Gold Medallion */}
                  <div className="absolute inset-0 rounded-full border-[6px] border-amber-600 bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 flex flex-col items-center justify-center font-black text-amber-950 text-xl shadow-[inset_0_4px_8px_rgba(255,255,255,0.6),0_12px_28px_rgba(245,158,11,0.35)] backface-hidden select-none coin-face-front">
                    <div className="absolute inset-2 rounded-full border-[2px] border-dashed border-amber-900/35" />
                    <Sparkles className="h-7 w-7 text-amber-900 mb-1 drop-shadow-[0_1.5px_1px_rgba(255,255,255,0.4)]" />
                    <span className="tracking-wider text-sm font-black drop-shadow-[0_1px_0_rgba(255,255,255,0.3)]">HEADS</span>
                  </div>
                  {/* Back Side (Tails) - Shiny Silver Medallion */}
                  <div className="absolute inset-0 rounded-full border-[6px] border-slate-400 bg-gradient-to-br from-slate-100 via-slate-300 to-slate-500 flex flex-col items-center justify-center font-black text-slate-900 text-xl shadow-[inset_0_4px_8px_rgba(255,255,255,0.6),0_12px_28px_rgba(100,116,139,0.3)] backface-hidden select-none coin-face-back">
                    <div className="absolute inset-2 rounded-full border-[2px] border-dashed border-slate-500/45" />
                    <Coins className="h-7 w-7 text-slate-800 mb-1 drop-shadow-[0_1.5px_1px_rgba(255,255,255,0.5)]" />
                    <span className="tracking-wider text-sm font-black drop-shadow-[0_1px_0_rgba(255,255,255,0.4)]">TAILS</span>
                  </div>
                </div>
              </div>

              {/* Dynamic shadow to anchor the 3D coin height */}
              <div 
                key={`shadow-${flipTriggerCount}`}
                className={cn(
                  "w-20 h-1.5 bg-black/45 rounded-full mt-2 transition-all duration-[1200ms]",
                  isCoinFlipping ? "animate-coin-shadow" : "opacity-60 blur-sm scale-100"
                )} 
              />

              {/* Display Result History */}
              <div className="space-y-1.5 text-center text-xs w-full pt-4 border-t border-dashed">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Flip History (Last 10)</span>
                <div className="flex gap-1.5 justify-center flex-wrap min-h-[22px] pt-1">
                  {flipHistory.length > 0 ? (
                    flipHistory.map((res, i) => (
                      <Badge key={i} variant={res === 'Heads' ? 'default' : 'secondary'} className="font-mono text-[9px] px-1.5">
                        {res}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground/40 italic">Awaiting first flip...</span>
                  )}
                </div>
              </div>

            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* --- 2. DICE ROLLER --- */}
      <TabsContent value="roll-dice" className="m-0 space-y-6 animate-fade-in">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Controls */}
          <Card className="border bg-card/60 backdrop-blur-sm shadow-sm md:col-span-1">
            <CardContent className="p-4 space-y-4">
              <div className="pb-2 border-b">
                <Label className="font-bold text-sm">Dice Settings</Label>
              </div>

              <div className="space-y-1.5">
                <Label>Number of Dice</Label>
                <Select value={String(diceCount)} onValueChange={(v: any) => handleDiceCountChange(Number(v) as any)}>
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Die</SelectItem>
                    <SelectItem value="2">2 Dice</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button onClick={handleRollDice} className="w-full font-bold gap-1 text-xs" disabled={isDiceRolling}>
                <RefreshCw className={`h-4 w-4 ${isDiceRolling ? 'animate-spin' : ''}`} />
                Roll Dice
              </Button>
            </CardContent>
          </Card>

          {/* 3D Dice Stage */}
          <Card className="border shadow-md md:col-span-2 flex flex-col justify-center items-center py-12 relative overflow-hidden bg-slate-950/5">
            <CardContent className="flex flex-col items-center gap-8 w-full max-w-md">
              
              <div className="flex gap-12 justify-center py-6 min-h-[140px] items-center relative z-10">
                {diceValues.map((val, idx) => (
                  <div 
                    key={idx} 
                    className={cn(
                      "transition-all duration-200",
                      isDiceRolling ? "animate-bounce scale-[0.98]" : "scale-100"
                    )}
                    style={{
                      animationDuration: '0.6s',
                      animationIterationCount: 'infinite',
                    }}
                  >
                    <DieFace value={val} />
                  </div>
                ))}
              </div>

              {/* Dynamic shadow anchor below rolling dice */}
              <div 
                className={cn(
                  "w-48 h-2 bg-black/40 blur-sm rounded-full transition-all duration-[1000ms] ease-out absolute bottom-[75px]",
                  isDiceRolling ? "scale-75 opacity-15" : "scale-100 opacity-55"
                )} 
              />

              {!isDiceRolling && (
                <div className="text-center space-y-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Total Rolled</span>
                  <p className="text-3xl font-extrabold text-primary font-mono leading-none">
                    {diceValues.reduce((a, b) => a + b, 0)}
                  </p>
                </div>
              )}

            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* --- 3. RANDOM PICKER & TEAM SPLITTER --- */}
      <TabsContent value="random-picker" className="m-0 space-y-6 animate-fade-in">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Picker Panel */}
          <Card className="border bg-card/60 backdrop-blur-sm shadow-sm flex flex-col justify-between">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b">
                <Label className="font-bold text-sm flex items-center gap-1">
                  <Trophy className="h-4 w-4 text-primary" /> Random Picker
                </Label>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="pick-opts">Options list (one per line)</Label>
                <Textarea
                  id="pick-opts"
                  value={pickerInput}
                  onChange={(e) => setPickerInput(e.target.value)}
                  className="h-28 text-xs font-mono"
                  placeholder="Option 1..."
                />
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-1.5">
                  <Label>Quantity to Pick</Label>
                  <Input
                    type="number"
                    min={1}
                    value={pickerCount}
                    onChange={(e) => setPickerCount(Math.max(1, parseInt(e.target.value) || 1))}
                    className="h-8.5 text-xs font-mono"
                  />
                </div>
                <div className="flex items-center justify-between text-xs self-end pb-2">
                  <Label htmlFor="pick-dup" className="cursor-pointer">Allow Duplicates</Label>
                  <Switch id="pick-dup" checked={pickerDuplicates} onCheckedChange={setPickerDuplicates} />
                </div>
              </div>

              <Button onClick={handlePickRandom} disabled={isPicking} className="w-full text-xs font-bold gap-1">
                {isPicking ? 'Drawing Winners...' : 'Pick Winners'}
              </Button>

              {isPicking && (
                <div className="py-6 text-center animate-pulse">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Lottery Drawing...</span>
                  <div className="inline-block px-4 py-2 bg-primary/10 text-primary font-black rounded-lg border border-primary/20 scale-105 transition-all text-sm font-mono">
                    {pickerAnimText}
                  </div>
                </div>
              )}

              {pickerResult.length > 0 && !isPicking && (
                <div className="space-y-2 pt-3 border-t">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Winner(s) Selected</span>
                  <div className="flex gap-2 flex-wrap">
                    {pickerResult.map((winner, idx) => (
                      <Badge 
                        key={idx} 
                        className="text-xs font-bold py-1 px-2.5 bg-emerald-500 text-white hover:bg-emerald-600 deal-card-animation"
                        style={{ animationDelay: `${idx * 120}ms` }}
                      >
                        {winner}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Team Generator Panel */}
          <Card className="border bg-card/60 backdrop-blur-sm shadow-sm flex flex-col justify-between">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b">
                <Label className="font-bold text-sm flex items-center gap-1.5">
                  <Users className="h-4.5 w-4.5 text-primary" />
                  Random Team Generator
                </Label>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="team-names-inp">Names list (one per line)</Label>
                <Textarea
                  id="team-names-inp"
                  value={teamNames}
                  onChange={(e) => setTeamNames(e.target.value)}
                  className="h-28 text-xs font-mono"
                  placeholder="Name 1..."
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="team-qty">Number of Teams</Label>
                <Input
                  id="team-qty"
                  type="number"
                  min={1}
                  value={teamCount}
                  onChange={(e) => setTeamCount(Math.max(1, parseInt(e.target.value) || 1))}
                  className="h-8.5 text-xs font-mono"
                />
              </div>

              <Button onClick={handleGenerateTeams} className="w-full text-xs font-bold gap-1">
                Generate Teams
              </Button>

              {generatedTeams.length > 0 && (
                <div className="space-y-3 pt-3 border-t max-h-48 overflow-y-auto pr-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Assigned Groups</span>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {generatedTeams.map((team, idx) => (
                      <div 
                        key={idx} 
                        className="border rounded-xl p-2.5 bg-muted/20 space-y-1.5 deal-card-animation"
                        style={{ animationDelay: `${idx * 150}ms` }}
                      >
                        <span className="font-bold text-[10px] uppercase text-primary tracking-wider">Team {idx + 1} ({team.length})</span>
                        <div className="flex flex-wrap gap-1">
                          {team.map((name, i) => (
                            <Badge 
                              key={i} 
                              variant="secondary" 
                              className="text-[10px] font-semibold py-0.5 px-1.5 deal-card-animation"
                              style={{ animationDelay: `${idx * 150 + i * 60}ms` }}
                            >
                              {name}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* --- 4. NAME WHEEL --- */}
      <TabsContent value="name-wheel" className="m-0 space-y-6 animate-fade-in">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Controls */}
          <Card className="border bg-card/60 backdrop-blur-sm shadow-sm md:col-span-1">
            <CardContent className="p-4 space-y-4">
              <div className="pb-2 border-b">
                <Label className="font-bold text-sm">Wheel Elements</Label>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="wheel-elements">Elements (Comma separated)</Label>
                <Textarea
                  id="wheel-elements"
                  value={wheelNames}
                  onChange={(e) => setWheelNames(e.target.value)}
                  className="h-32 text-xs font-mono"
                  placeholder="Slice 1, Slice 2..."
                />
              </div>

              <Button onClick={handleSpinWheel} className="w-full font-bold gap-1 text-xs" disabled={isWheelSpinning}>
                <RefreshCw className={`h-4 w-4 ${isWheelSpinning ? 'animate-spin' : ''}`} />
                Spin Wheel
              </Button>
            </CardContent>
          </Card>

          {/* Interactive Wheel Preview */}
          <Card className="border shadow-md md:col-span-2 flex flex-col justify-center items-center py-8">
            <CardContent className="flex flex-col items-center gap-6 w-full">
              
              {/* Canvas stage with absolute pointer pin */}
              <div className="relative w-[280px] h-[280px] flex items-center justify-center">
                <canvas
                  ref={canvasRef}
                  width={280}
                  height={280}
                  className="rounded-full shadow-lg border-4 border-slate-900 bg-white"
                />
                
                {/* Pointer pointer pin */}
                <div
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-0 h-0"
                  style={{
                    borderTop: '12px solid transparent',
                    borderBottom: '12px solid transparent',
                    borderRight: '22px solid #ef4444',
                    transform: 'translateX(8px)'
                  }}
                />
              </div>

            </CardContent>
          </Card>
        </div>
      </TabsContent>
      <style>{`
        @keyframes dealCard {
          from {
            opacity: 0;
            transform: translateY(12px) scale(0.96);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .deal-card-animation {
          animation: dealCard 0.38s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
        }
      `}</style>
    </Tabs>
  );
}
