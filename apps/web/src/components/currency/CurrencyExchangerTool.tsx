'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { ArrowLeftRight, Copy, RefreshCw, Landmark, SlidersHorizontal, Info, TrendingUp, HelpCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { toast } from 'sonner';

function generateSparklinePoints(): string {
  const points = [];
  let startY = 40 + Math.random() * 20;
  points.push(`M 0,${startY}`);
  for (let i = 1; i <= 6; i++) {
    const x = i * 25;
    const y = Math.max(10, Math.min(80, startY + (Math.random() - 0.5) * 35));
    points.push(`L ${x},${y}`);
    startY = y;
  }
  return points.join(' ');
}

const CURRENCIES = [
  { value: 'USD', symbol: '$', label: 'USD - US Dollar' },
  { value: 'EUR', symbol: '€', label: 'EUR - Euro' },
  { value: 'GBP', symbol: '£', label: 'GBP - British Pound' },
  { value: 'INR', symbol: '₹', label: 'INR - Indian Rupee' },
  { value: 'JPY', symbol: '¥', label: 'JPY - Japanese Yen' },
  { value: 'CAD', symbol: 'C$', label: 'CAD - Canadian Dollar' },
  { value: 'AUD', symbol: 'A$', label: 'AUD - Australian Dollar' },
  { value: 'CHF', symbol: 'CHF', label: 'CHF - Swiss Franc' },
  { value: 'CNY', symbol: '¥', label: 'CNY - Chinese Yuan' },
  { value: 'SGD', symbol: 'S$', label: 'SGD - Singapore Dollar' },
  { value: 'AED', symbol: 'د.إ', label: 'AED - UAE Dirham' },
  { value: 'SAR', symbol: 'ر.स', label: 'SAR - Saudi Riyal' },
  { value: 'NZD', symbol: 'NZ$', label: 'NZD - New Zealand Dollar' },
  { value: 'HKD', symbol: 'HK$', label: 'HKD - Hong Kong Dollar' },
  { value: 'ZAR', symbol: 'R', label: 'ZAR - South African Rand' },
  { value: 'RUB', symbol: '₽', label: 'RUB - Russian Ruble' },
  { value: 'MXN', symbol: 'Mex$', label: 'MXN - Mexican Peso' },
  { value: 'BRL', symbol: 'R$', label: 'BRL - Brazilian Real' },
  { value: 'KRW', symbol: '₩', label: 'KRW - South Korean Won' },
  { value: 'TRY', symbol: '₺', label: 'TRY - Turkish Lira' },
  { value: 'SEK', symbol: 'kr', label: 'SEK - Swedish Krona' },
  { value: 'NOK', symbol: 'kr', label: 'NOK - Norwegian Krone' },
  { value: 'DKK', symbol: 'kr', label: 'DKK - Danish Krone' },
  { value: 'PLN', symbol: 'zł', label: 'PLN - Polish Zloty' },
  { value: 'THB', symbol: '฿', label: 'THB - Thai Baht' },
  { value: 'MYR', symbol: 'RM', label: 'MYR - Malaysia Ringgit' },
  { value: 'PHP', symbol: '₱', label: 'PHP - Philippine Peso' },
  { value: 'IDR', symbol: 'Rp', label: 'IDR - Indonesian Rupiah' },
  { value: 'PKR', symbol: '₨', label: 'PKR - Pakistan Rupee' },
  { value: 'NPR', symbol: '₨', label: 'NPR - Nepalese Rupee' },
  { value: 'BDT', symbol: '৳', label: 'BDT - Bangladeshi Taka' },
  { value: 'LKR', symbol: '₨', label: 'LKR - Sri Lankan Rupee' },
  { value: 'EGP', symbol: 'E£', label: 'EGP - Egyptian Pound' },
  { value: 'ILS', symbol: '₪', label: 'ILS - Israeli Shekel' },
];

const USD_RELATIVE_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.78,
  INR: 83.5,
  JPY: 161.2,
  CAD: 1.36,
  AUD: 1.49,
  CHF: 0.89,
  CNY: 7.27,
  SGD: 1.34,
  AED: 3.67,
  SAR: 3.75,
  NZD: 1.62,
  HKD: 7.8,
  ZAR: 18.0,
  RUB: 88.0,
  MXN: 18.0,
  BRL: 5.5,
  KRW: 1370,
  TRY: 32.5,
  SEK: 10.4,
  NOK: 10.6,
  DKK: 6.9,
  PLN: 3.9,
  THB: 36.3,
  MYR: 4.7,
  PHP: 58.5,
  IDR: 16200,
  PKR: 278,
  NPR: 133,
  BDT: 117,
  LKR: 300,
  EGP: 47.5,
  ILS: 3.65,
};

export function CurrencyExchangerTool() {
  const [amount, setAmount] = useState<number>(100);
  const [fromCurrency, setFromCurrency] = useState<string>('USD');
  const [toCurrency, setToCurrency] = useState<string>('EUR');
  
  const [rates, setRates] = useState<Record<string, number>>(USD_RELATIVE_RATES);
  const [loading, setLoading] = useState<boolean>(false);
  const [isCustomMode, setIsCustomMode] = useState<boolean>(false);
  const [customRates, setCustomRates] = useState<Record<string, number>>(USD_RELATIVE_RATES);
  const [lastUpdated, setLastUpdated] = useState<string>('Preloaded Local Rates');


  // Fetch rates
  const fetchRates = useCallback(async (base: string) => {
    if (isCustomMode) return;
    setLoading(true);
    try {
      const response = await fetch(`https://open.er-api.com/v6/latest/${base}`);
      if (!response.ok) throw new Error('API rates load failed');
      const data = await response.json();
      if (data.result === 'success') {
        setRates(data.rates);
        setLastUpdated(new Date(data.time_last_update_utc).toLocaleString());
      } else {
        throw new Error('API returned unsuccessful response');
      }
    } catch (err: any) {
      console.warn('Currency API error, using static fallback rates:', err.message);
      // Fallback relative to the selected base currency
      const baseRateInUsd = USD_RELATIVE_RATES[base] || 1.0;
      const calculatedRates: Record<string, number> = {};
      Object.entries(USD_RELATIVE_RATES).forEach(([cur, val]) => {
        calculatedRates[cur] = val / baseRateInUsd;
      });
      setRates(calculatedRates);
      setLastUpdated('Offline static fallback rates');
    } finally {
      setLoading(false);
    }
  }, [isCustomMode]);

  useEffect(() => {
    // fetchRates does a genuine async network call (or falls back to a static table).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchRates(fromCurrency);
  }, [fromCurrency, fetchRates]);

  const handleToggleCustomMode = () => {
    const next = !isCustomMode;
    setIsCustomMode(next);
    if (next) {
      setRates(customRates);
      setLastUpdated('Local User Edited Rates');
    }
  };

  // Handle manual rates input change
  const handleCustomRateChange = (cur: string, val: number) => {
    if (val < 0) return;
    const updated = { ...customRates, [cur]: val };
    setCustomRates(updated);
    if (isCustomMode) {
      setRates(updated);
      setLastUpdated('Local User Edited Rates');
    }
  };

  // Sparkline random simulator, recomputed whenever the pair changes. Math.random()-based
  // generation must run client-only: this page is statically prerendered, so computing it
  // during the initial render (SSR or client) would bake in one draw and mismatch hydration.
  const [sparklinePoints, setSparklinePoints] = useState('M 0,50 L 25,60 L 50,40 L 75,55 L 100,30 L 125,45 L 150,20');
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSparklinePoints(generateSparklinePoints());
  }, [fromCurrency, toCurrency]);

  const handleSwap = () => {
    setFromCurrency(toCurrency);
    setToCurrency(fromCurrency);
  };

  const getCurrencySymbol = (code: string) => {
    return CURRENCIES.find((c) => c.value === code)?.symbol || '$';
  };

  const currentRate = rates[toCurrency] || 1;
  const convertedAmount = amount * currentRate;

  const handleCopy = (val: string, label: string) => {
    navigator.clipboard.writeText(val);
    toast.success(`${label} copied!`);
  };

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {/* Exchanger main card */}
      <Card className="md:col-span-2">
        <CardContent className="p-5 space-y-5">
          <div className="flex items-center justify-between border-b pb-2.5">
            <h3 className="font-semibold text-sm flex items-center gap-1.5">
              <Landmark className="h-4 w-4 text-primary" />
              Currency Converter
            </h3>
            {loading ? (
              <RefreshCw className="h-4 w-4 text-muted-foreground animate-spin" />
            ) : (
              <Badge variant="outline" className="text-[9px] font-mono font-medium">
                Update: {lastUpdated}
              </Badge>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-3 items-end">
            {/* Amount input */}
            <div className="space-y-1.5">
              <Label htmlFor="conv-amt">Amount</Label>
              <div className="relative">
                <span className="absolute left-2.5 top-2 h-4 text-muted-foreground font-mono text-xs">
                  {getCurrencySymbol(fromCurrency)}
                </span>
                <Input
                  id="conv-amt"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(Math.max(0, Number(e.target.value)))}
                  className="pl-7 text-xs font-semibold"
                />
              </div>
            </div>

            {/* From currency select */}
            <div className="space-y-1.5">
              <Label htmlFor="from-curr">From</Label>
              <Select value={fromCurrency} onValueChange={setFromCurrency}>
                <SelectTrigger id="from-curr" className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Swap button and To currency select */}
            <div className="flex items-center gap-2">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={handleSwap}
                    className="h-9 w-9 border shrink-0 transition-transform active:rotate-180 duration-200"
                  >
                    <ArrowLeftRight className="h-3.5 w-3.5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Swap currencies</TooltipContent>
              </Tooltip>

              <div className="space-y-1.5 flex-1">
                <Label htmlFor="to-curr">To</Label>
                <Select value={toCurrency} onValueChange={setToCurrency}>
                  <SelectTrigger id="to-curr" className="text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Calculations split box */}
          <div className="p-4 bg-muted/30 border rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1.5">
              <span className="text-[10px] text-muted-foreground font-sans uppercase font-bold tracking-wider">
                Exchanged Output
              </span>
              <p className="text-2xl font-black text-primary leading-tight font-mono break-all">
                {amount.toLocaleString(undefined, { maximumFractionDigits: 2 })} {fromCurrency} ={' '}
                <span className="text-emerald-600 dark:text-emerald-400">
                  {convertedAmount.toLocaleString(undefined, { maximumFractionDigits: 4 })} {toCurrency}
                </span>
              </p>
              <p className="text-[10px] text-muted-foreground font-mono">
                1 {fromCurrency} = {currentRate.toFixed(6)} {toCurrency} | 1 {toCurrency} = {(1 / currentRate).toFixed(6)} {fromCurrency}
              </p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                handleCopy(
                  `${amount} ${fromCurrency} = ${convertedAmount.toFixed(4)} ${toCurrency}`,
                  'Exchanged result'
                )
              }
              className="text-xs shrink-0 self-start md:self-center h-8"
            >
              <Copy className="h-3.5 w-3.5 mr-1" />
              Copy Output
            </Button>
          </div>

          {/* SVG sparkline simulated trend */}
          <div className="border rounded-xl p-4 bg-card space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase">
                <TrendingUp className="h-3.5 w-3.5 text-primary" />
                Simulated {fromCurrency}/{toCurrency} Rates Trend (Last 7 Days)
              </div>
              <Badge variant="outline" className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 border-emerald-500/20 bg-emerald-500/5">
                Live Sparkline
              </Badge>
            </div>
            
            <div className="h-20 w-full relative">
              <svg className="h-full w-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 150 100">
                {/* Horizontal grid lines */}
                <line x1="0" y1="20" x2="150" y2="20" stroke="currentColor" className="text-muted/10" strokeWidth="0.5" strokeDasharray="2" />
                <line x1="0" y1="50" x2="150" y2="50" stroke="currentColor" className="text-muted/10" strokeWidth="0.5" strokeDasharray="2" />
                <line x1="0" y1="80" x2="150" y2="80" stroke="currentColor" className="text-muted/10" strokeWidth="0.5" strokeDasharray="2" />
                
                {/* Sparkline Path */}
                <path
                  d={sparklinePoints}
                  fill="none"
                  stroke="#3B82F6"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <div className="flex justify-between text-[9px] text-muted-foreground font-mono font-bold uppercase tracking-wider">
              <span>7 Days Ago</span>
              <span>3 Days Ago</span>
              <span>Today</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Side panel rates matrix or custom mode inputs */}
      <div className="space-y-4">
        {/* Toggle Mode Card */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Offline Editor</h4>
                <p className="text-[10px] text-muted-foreground leading-normal mt-0.5">Toggle custom local rates mapping</p>
              </div>
              <Button
                variant={isCustomMode ? 'default' : 'outline'}
                size="sm"
                onClick={handleToggleCustomMode}
                className="h-7 text-[10px] gap-1 px-2 shrink-0"
              >
                <SlidersHorizontal className="h-3 w-3" />
                {isCustomMode ? 'Editing custom' : 'Use custom'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {isCustomMode ? (
          /* Custom rates lists editing */
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="border-b pb-2 flex items-center justify-between">
                <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                  Edit Custom Rates
                </h3>
                <span className="text-[10px] font-bold text-primary">Base: {fromCurrency}</span>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {CURRENCIES.map((c) => {
                  if (c.value === fromCurrency) return null;
                  return (
                    <div key={c.value} className="flex items-center justify-between gap-3 text-xs">
                      <span className="font-bold w-12">{c.value}</span>
                      <Input
                        type="number"
                        step="0.0001"
                        value={rates[c.value] || 0}
                        onChange={(e) => handleCustomRateChange(c.value, Number(e.target.value))}
                        className="h-7 text-xs font-mono w-28 text-right"
                      />
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Standard rates conversion list matrix */
          <Card>
            <CardContent className="p-4 space-y-3">
              <h3 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider border-b pb-2">
                Base Conversions Matrix
              </h3>
              <p className="text-[10px] text-muted-foreground leading-normal">
                Relative comparison of <span className="font-bold text-primary">1 {fromCurrency}</span> to major global currencies:
              </p>

              <div className="space-y-2 max-h-[340px] overflow-y-auto pr-1">
                {CURRENCIES.map((c) => {
                  if (c.value === fromCurrency) return null;
                  const rate = rates[c.value] || 0;
                  return (
                    <div
                      key={c.value}
                      className="flex items-center justify-between p-2 rounded-lg border bg-muted/15 font-mono text-xs hover:bg-muted/30 transition-colors"
                    >
                      <div className="min-w-0">
                        <p className="text-[9px] font-sans font-bold text-muted-foreground">{c.label}</p>
                        <p className="font-bold text-sm truncate mt-0.5">
                          {c.symbol} {rate.toLocaleString(undefined, { maximumFractionDigits: 5 })}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleCopy(rate.toString(), c.value)}
                        className="h-6 w-6 text-muted-foreground"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
