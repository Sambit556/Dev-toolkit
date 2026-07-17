'use client';

import React, { useState, useMemo } from 'react';
import { Ruler, Scale, Box, Thermometer, Zap, Layers, RefreshCw, ArrowLeftRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { UNIT_CATEGORIES, convertUnit } from '@/lib/unit';
import { CopyButton } from '@/components/ui/copy-button';

// Helper to map category icons
const CATEGORY_ICONS: Record<string, any> = {
  length: Ruler,
  mass: Scale,
  area: Layers,
  volume: Box,
  temperature: Thermometer,
  speed: Zap,
  time: RefreshCw,
  storage: Layers,
  energy: Zap,
  pressure: Layers,
};

export function UnitTool() {
  const [activeCategory, setActiveCategory] = useState(UNIT_CATEGORIES[0]);
  const [inputValue, setInputValue] = useState<string>('1');
  const [fromUnit, setFromUnit] = useState<string>(UNIT_CATEGORIES[0].units[0]?.value ?? '');
  const [toUnit, setToUnit] = useState<string>(UNIT_CATEGORIES[0].units[1]?.value ?? '');

  // Switching category resets the from/to units to that category's defaults.
  const handleCategoryChange = (cat: (typeof UNIT_CATEGORIES)[number]) => {
    setActiveCategory(cat);
    if (cat.units.length >= 2) {
      setFromUnit(cat.units[0].value);
      setToUnit(cat.units[1].value);
    }
  };

  const result = useMemo(() => {
    const val = parseFloat(inputValue);
    if (!isNaN(val) && fromUnit && toUnit) {
      return convertUnit(val, fromUnit, toUnit, activeCategory.id);
    }
    return 0;
  }, [inputValue, fromUnit, toUnit, activeCategory]);

  const handleSwap = () => {
    const temp = fromUnit;
    setFromUnit(toUnit);
    setToUnit(temp);
  };


  const formatNumber = (num: number): string => {
    if (num === 0) return '0';
    const abs = Math.abs(num);
    if (abs < 0.000001 || abs > 1000000000) {
      return num.toExponential(6);
    }
    // Limit decimal points
    return Number(num.toFixed(6)).toString();
  };

  return (
    <div className="space-y-6">
      {/* Category selector grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        {UNIT_CATEGORIES.map((cat) => {
          const Icon = CATEGORY_ICONS[cat.id] || Ruler;
          const isActive = cat.id === activeCategory.id;
          return (
            <Button
              key={cat.id}
              variant={isActive ? 'default' : 'outline'}
              className="h-10 text-xs gap-1.5 justify-start sm:justify-center px-3"
              onClick={() => handleCategoryChange(cat)}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{cat.name}</span>
            </Button>
          );
        })}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Conversion Form */}
        <Card className="md:col-span-2">
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-semibold text-sm">Convert {activeCategory.name}</h3>
              <Button variant="ghost" size="icon-sm" onClick={handleSwap} className="h-7 w-7 text-primary hover:text-primary-foreground">
                <ArrowLeftRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 items-end">
              {/* Value Input */}
              <div className="space-y-1.5">
                <Label htmlFor="unit-val-input">Value</Label>
                <Input
                  id="unit-val-input"
                  type="number"
                  placeholder="Enter value"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                />
              </div>

              {/* From Unit */}
              <div className="space-y-1.5">
                <Label htmlFor="from-unit-select">From Unit</Label>
                {fromUnit && (
                  <Select value={fromUnit} onValueChange={setFromUnit}>
                    <SelectTrigger id="from-unit-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {activeCategory.units.map((unit) => (
                        <SelectItem key={unit.value} value={unit.value}>
                          {unit.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              {/* To Unit */}
              <div className="space-y-1.5">
                <Label htmlFor="to-unit-select">To Unit</Label>
                {toUnit && (
                  <Select value={toUnit} onValueChange={setToUnit}>
                    <SelectTrigger id="to-unit-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {activeCategory.units.map((unit) => (
                        <SelectItem key={unit.value} value={unit.value}>
                          {unit.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            </div>

            {/* Display conversion results */}
            <div className="mt-4 p-4 bg-muted/40 rounded-xl border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Converted Result</span>
                <p className="text-2xl font-black text-primary break-all leading-none font-mono">
                  {formatNumber(result)}
                  <span className="text-sm font-normal text-muted-foreground ml-1.5">
                    {activeCategory.units.find((u) => u.value === toUnit)?.label || ''}
                  </span>
                </p>
              </div>
              <CopyButton
                value={formatNumber(result)}
                label="Copy Result"
                toastMessage="Result copied to clipboard!"
                variant="outline"
                className="h-8 shrink-0"
              />
            </div>
          </CardContent>
        </Card>

        {/* Translation matrix / all conversions */}
        <Card className="h-full">
          <CardContent className="p-4 space-y-3">
            <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider border-b pb-2">
              All Units Comparison
            </h3>
            <p className="text-[11px] text-muted-foreground leading-normal">
              Showing conversions of <span className="font-semibold text-primary">{inputValue || '0'} {fromUnit}</span> to other units:
            </p>

            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {activeCategory.units.map((unit) => {
                const isCurrent = unit.value === fromUnit;
                const converted = isCurrent
                  ? parseFloat(inputValue) || 0
                  : convertUnit(parseFloat(inputValue) || 0, fromUnit, unit.value, activeCategory.id);

                return (
                  <div
                    key={unit.value}
                    className={`flex items-center justify-between p-2 rounded-lg border text-xs group transition-colors ${
                      isCurrent
                        ? 'bg-primary/5 border-primary/30 text-primary'
                        : 'bg-card hover:bg-muted/40'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-[10px] text-muted-foreground">{unit.label}</p>
                      <p className="font-mono font-bold truncate leading-normal">
                        {formatNumber(converted)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <CopyButton
                        value={formatNumber(converted)}
                        toastMessage={`${unit.label} copied to clipboard!`}
                        className="h-5 w-5"
                      />
                      {!isCurrent && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => setToUnit(unit.value)}
                              className="h-5 w-5 font-mono text-[9px] font-black"
                            >
                              TO
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Set as Target</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
