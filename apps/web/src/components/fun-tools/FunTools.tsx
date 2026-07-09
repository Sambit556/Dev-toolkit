'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Gamepad2, Coins, Disc, Users, RefreshCw, Trophy, Plus, Trash2, Sparkles } from 'lucide-react';
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
  const [diceRotations, setDiceRotations] = useState<{ x: number; y: number }[]>([{ x: 0, y: 0 }]);

  // --- 3. RANDOM PICKER STATES ---
  const [pickerInput, setPickerInput] = useState<string>('Option A\nOption B\nOption C\nOption D');
  const [pickerCount, setPickerCount] = useState<number>(1);
  const [pickerDuplicates, setPickerDuplicates] = useState<boolean>(false);
  const [pickerResult, setPickerResult] = useState<string[]>([]);

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

  // --- DICE ROLLER HANDLER ---
  const handleRollDice = () => {
    if (isDiceRolling) return;
    setIsDiceRolling(true);
    setDiceTriggerCount((prev) => prev + 1);

    const values: number[] = [];
    const rotations: { x: number; y: number }[] = [];

    // Face rotation alignments: maps die value (1-6) to X/Y rotation degrees
    const diceAlignments = [
      { x: 0, y: 0 },       // 1
      { x: 0, y: 180 },     // 2 (opposite 1)
      { x: 0, y: 90 },      // 3
      { x: 0, y: -90 },     // 4
      { x: -90, y: 0 },     // 5
      { x: 90, y: 0 },      // 6
    ];

    for (let i = 0; i < diceCount; i++) {
      const val = Math.floor(Math.random() * 6) + 1;
      values.push(val);
      
      const align = diceAlignments[val - 1];
      // Add extra random full spins (e.g. 720 to 1440 deg)
      const xRot = align.x + (Math.floor(Math.random() * 2) + 2) * 360;
      const yRot = align.y + (Math.floor(Math.random() * 2) + 2) * 360;
      rotations.push({ x: xRot, y: yRot });
    }

    setDiceRotations(rotations);

    setTimeout(() => {
      setDiceValues(values);
      setIsDiceRolling(false);
      const total = values.reduce((a, b) => a + b, 0);
      toast.success(`You rolled a total of ${total}! (${values.join(', ')})`);
    }, 1000);
  };

  // --- RANDOM PICKER HANDLER ---
  const handlePickRandom = () => {
    const list = pickerInput.split('\n').map(o => o.trim()).filter(o => o.length > 0);
    if (list.length === 0) {
      toast.error('Please input options to pick from');
      return;
    }

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
    toast.success(`Picked ${picked.length} item(s)!`);
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
  const getNamesList = (): string[] => {
    return wheelNames.split(',').map(n => n.trim()).filter(n => n.length > 0);
  };

  const drawWheel = () => {
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
  };

  useEffect(() => {
    if (activeTab === 'name-wheel') {
      drawWheel();
    }
  }, [wheelNames, activeTab]);

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
                  {/* Front Side (Heads) - Shiny Gold Medallion */}
                  <div className="absolute inset-0 rounded-full border-4 border-yellow-600 bg-gradient-to-br from-yellow-300 via-amber-400 to-yellow-600 flex flex-col items-center justify-center font-black text-amber-950 text-xl shadow-[inset_0_3px_6px_rgba(255,255,255,0.45),0_10px_25px_rgba(245,158,11,0.35)] backface-hidden select-none coin-face-front">
                    <div className="absolute inset-2 rounded-full border border-dashed border-amber-800/40" />
                    <Sparkles className="h-6 w-6 text-amber-900 mb-0.5" />
                    <span className="tracking-wider text-sm">HEADS</span>
                  </div>
                  {/* Back Side (Tails) - Shiny Silver Medallion */}
                  <div className="absolute inset-0 rounded-full border-4 border-slate-400 bg-gradient-to-br from-slate-100 via-slate-300 to-slate-500 flex flex-col items-center justify-center font-black text-slate-900 text-xl shadow-[inset_0_3px_6px_rgba(255,255,255,0.5),0_10px_25px_rgba(100,116,139,0.3)] backface-hidden select-none coin-face-back">
                    <div className="absolute inset-2 rounded-full border border-dashed border-slate-500/40" />
                    <Coins className="h-6 w-6 text-slate-800 mb-0.5" />
                    <span className="tracking-wider text-sm">TAILS</span>
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
                <Select value={String(diceCount)} onValueChange={(v: any) => setDiceCount(Number(v) as any)}>
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
                {Array.from({ length: diceCount }).map((_, idx) => (
                  <div 
                    key={`${idx}-${diceTriggerCount}`} 
                    className={cn(
                      "w-20 h-20 relative perspective-800",
                      isDiceRolling ? "animate-dice-bounce" : ""
                    )}
                    style={{
                      animationDelay: `${idx * 150}ms`
                    }}
                  >
                    <div
                      className="w-full h-full relative transition-transform duration-[1000ms] ease-out preserve-3d"
                      style={{
                        transform: `rotateX(${diceRotations[idx]?.x || 0}deg) rotateY(${diceRotations[idx]?.y || 0}deg)`
                      }}
                    >
                      {/* Face 1 (Front) */}
                      <div className="absolute w-20 h-20 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 border border-primary/35 rounded-2xl flex items-center justify-center shadow-lg backdrop-blur-sm die-face-1 backface-hidden">
                        <span className="h-3.5 w-3.5 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.85)]" />
                      </div>
                      {/* Face 2 (Back) */}
                      <div className="absolute w-20 h-20 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 border border-primary/35 rounded-2xl grid grid-cols-2 p-4 gap-3 die-face-2 backface-hidden">
                        <span className="h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.85)] justify-self-start self-start" />
                        <span className="h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.85)] justify-self-end self-end col-start-2 row-start-2" />
                      </div>
                      {/* Face 3 (Left) */}
                      <div className="absolute w-20 h-20 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 border border-primary/35 rounded-2xl grid grid-cols-3 p-3 items-center die-face-3 backface-hidden">
                        <span className="h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.85)] justify-self-start" />
                        <span className="h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.85)] justify-self-center col-start-2" />
                        <span className="h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.85)] justify-self-end col-start-3" />
                      </div>
                      {/* Face 4 (Right) */}
                      <div className="absolute w-20 h-20 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 border border-primary/35 rounded-2xl grid grid-cols-2 p-4.5 gap-4 die-face-4 backface-hidden">
                        <span className="h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.85)]" />
                        <span className="h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.85)]" />
                        <span className="h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.85)]" />
                        <span className="h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.85)]" />
                      </div>
                      {/* Face 5 (Top) */}
                      <div className="absolute w-20 h-20 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 border border-primary/35 rounded-2xl grid grid-cols-3 p-3 gap-2.5 die-face-5 backface-hidden">
                        <span className="h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.85)] col-start-1" />
                        <span className="h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.85)] col-start-3" />
                        <span className="h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.85)] col-start-2 row-start-2" />
                        <span className="h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.85)] col-start-1 row-start-3" />
                        <span className="h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.85)] col-start-3 row-start-3" />
                      </div>
                      {/* Face 6 (Bottom) */}
                      <div className="absolute w-20 h-20 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-950 border border-primary/35 rounded-2xl grid grid-cols-2 p-4 gap-2.5 die-face-6 backface-hidden">
                        <span className="h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.85)]" />
                        <span className="h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.85)]" />
                        <span className="h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.85)]" />
                        <span className="h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.85)]" />
                        <span className="h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.85)]" />
                        <span className="h-3 w-3 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.85)]" />
                      </div>
                    </div>
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

              <Button onClick={handlePickRandom} className="w-full text-xs font-bold gap-1">
                Pick Winners
              </Button>

              {pickerResult.length > 0 && (
                <div className="space-y-2 pt-3 border-t">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Winner(s) Selected</span>
                  <div className="flex gap-2 flex-wrap">
                    {pickerResult.map((winner, idx) => (
                      <Badge key={idx} className="text-xs font-bold py-1 px-2.5 bg-emerald-500 text-white hover:bg-emerald-600">
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
                <div className="space-y-3 pt-3 border-t max-h-48 overflow-y-auto">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">Assigned Groups</span>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {generatedTeams.map((team, idx) => (
                      <div key={idx} className="border rounded-xl p-2.5 bg-muted/20 space-y-1.5">
                        <span className="font-bold text-[10px] uppercase text-primary tracking-wider">Team {idx + 1} ({team.length})</span>
                        <div className="flex flex-wrap gap-1">
                          {team.map((name, i) => (
                            <Badge key={i} variant="secondary" className="text-[10px] font-semibold py-0.5 px-1.5">{name}</Badge>
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
    </Tabs>
  );
}
