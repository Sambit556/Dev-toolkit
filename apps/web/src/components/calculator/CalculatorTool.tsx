'use client';

import React, { useState, useEffect } from 'react';
import { Calculator, Landmark, Coins, Calendar, ArrowRight, Download, HelpCircle, Table, Clock, Timer, Hourglass } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

// Factorial helper
const factorial = (n: number): number => {
  if (n < 0) return NaN;
  if (n === 0 || n === 1) return 1;
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
};

const CURRENCIES = [
  { value: 'USD', symbol: '$', label: 'USD ($)' },
  { value: 'EUR', symbol: '€', label: 'EUR (€)' },
  { value: 'GBP', symbol: '£', label: 'GBP (£)' },
  { value: 'INR', symbol: '₹', label: 'INR (₹)' },
  { value: 'JPY', symbol: '¥', label: 'JPY (¥)' },
  { value: 'CAD', symbol: 'C$', label: 'CAD (C$)' },
  { value: 'AUD', symbol: 'A$', label: 'AUD (A$)' },
];

export function CalculatorTool() {
  const [currency, setCurrency] = useState<string>('USD');
  const currencySymbol = CURRENCIES.find((c) => c.value === currency)?.symbol || '$';

  // --- EMI CALCULATOR STATES ---
  const [loanAmount, setLoanAmount] = useState<number>(100000);
  const [interestRate, setInterestRate] = useState<number>(8.5);
  const [tenure, setTenure] = useState<number>(5);
  const [tenureUnit, setTenureUnit] = useState<'years' | 'months'>('years');
  const [emiResult, setEmiResult] = useState({
    monthlyEmi: 0,
    totalInterest: 0,
    totalPayment: 0,
    amortization: [] as any[],
  });

  // --- SALARY CALCULATOR STATES ---
  const [baseSalary, setBaseSalary] = useState<number>(60000);
  const [salaryFreq, setSalaryFreq] = useState<string>('annual');
  const [hoursPerWeek, setHoursPerWeek] = useState<number>(40);
  const [taxRate, setTaxRate] = useState<number>(20);
  const [salaryBreakdown, setSalaryBreakdown] = useState<any[]>([]);

  // --- AGE & DATE CALCULATOR STATES ---
  const [startDate, setStartDate] = useState<string>('1995-01-01');
  const [endDate, setEndDate] = useState<string>(new Date().toISOString().substring(0, 10));
  const [ageResult, setAgeResult] = useState<any>(null);

  const [dateMathStart, setDateMathStart] = useState<string>(new Date().toISOString().substring(0, 10));
  const [dateMathOffset, setDateMathOffset] = useState<number>(30);
  const [dateMathUnit, setDateMathUnit] = useState<string>('days');
  const [dateMathOp, setDateMathOp] = useState<string>('add');
  const [dateMathResult, setDateMathResult] = useState<string>('');

  // --- STANDARD/SCIENTIFIC CALCULATOR STATES ---
  const [expression, setExpression] = useState<string>('');
  const [result, setResult] = useState<string>('');
  const [calcHistory, setCalcHistory] = useState<string[]>([]);
  const [isScientific, setIsScientific] = useState<boolean>(false);

  // --- GST CALCULATOR STATES ---
  const [gstAmount, setGstAmount] = useState<number>(1000);
  const [gstRate, setGstRate] = useState<number>(18);
  const [gstType, setGstType] = useState<'add' | 'remove'>('add');
  const [gstResult, setGstResult] = useState({ net: 0, tax: 0, gross: 0 });

  // --- SIP CALCULATOR STATES ---
  const [sipMonthly, setSipMonthly] = useState<number>(5000);
  const [sipReturn, setSipReturn] = useState<number>(12);
  const [sipYears, setSipYears] = useState<number>(10);
  const [sipResult, setSipResult] = useState({ invested: 0, returns: 0, total: 0 });

  // --- BMI CALCULATOR STATES ---
  const [bmiSystem, setBmiSystem] = useState<'metric' | 'imperial'>('metric');
  const [bmiWeight, setBmiWeight] = useState<number>(70);
  const [bmiHeight, setBmiHeight] = useState<number>(175);
  const [bmiScore, setBmiScore] = useState<number>(0);
  const [bmiCategory, setBmiCategory] = useState<string>('');
  const [bmiColor, setBmiColor] = useState<string>('');

  const handleInput = (val: string) => {
    setExpression((prev) => prev + val);
  };

  const clearCalc = () => {
    setExpression('');
    setResult('');
  };

  const backspace = () => {
    setExpression((prev) => prev.slice(0, -1));
  };

  const calculateResult = () => {
    if (!expression) return;
    try {
      let sanitized = expression
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/π/g, 'Math.PI')
        .replace(/e/g, 'Math.E')
        .replace(/√\(/g, 'Math.sqrt(')
        .replace(/sin\(/g, 'Math.sin(')
        .replace(/cos\(/g, 'Math.cos(')
        .replace(/tan\(/g, 'Math.tan(')
        .replace(/sinh\(/g, 'Math.sinh(')
        .replace(/cosh\(/g, 'Math.cosh(')
        .replace(/tanh\(/g, 'Math.tanh(')
        .replace(/ln\(/g, 'Math.log(')
        .replace(/log\(/g, 'Math.log10(')
        .replace(/abs\(/g, 'Math.abs(')
        .replace(/fact\(/g, 'factorial(')
        .replace(/\^/g, '**')
        .replace(/²/g, '**2');

      const matchRegex = /^[0-9+\-*\/%().Math.sinostanPIsqrtpoweabsfactorial\s]+$/;
      if (!matchRegex.test(sanitized)) {
        throw new Error('Invalid tokens');
      }

      const evalFn = new Function('factorial', `return (${sanitized})`);
      const val = evalFn(factorial);

      if (val === undefined || isNaN(val)) {
        setResult('Error');
      } else if (!isFinite(val)) {
        setResult('Cannot divide by zero');
      } else {
        const finalResult = Number(val.toFixed(8)).toString();
        setResult(finalResult);
        setCalcHistory((prev) => [expression + ' = ' + finalResult, ...prev].slice(0, 3));
      }
    } catch (e) {
      setResult('Invalid expression');
    }
  };

  // --- GST CALCULATION ---
  useEffect(() => {
    const amt = gstAmount;
    const rate = gstRate;
    if (amt <= 0) return;
    
    let net = 0;
    let tax = 0;
    let gross = 0;
    
    if (gstType === 'add') {
      net = amt;
      tax = (amt * rate) / 100;
      gross = amt + tax;
    } else {
      gross = amt;
      net = amt / (1 + rate / 100);
      tax = gross - net;
    }
    
    setGstResult({ net, tax, gross });
  }, [gstAmount, gstRate, gstType]);

  // --- SIP CALCULATION ---
  useEffect(() => {
    const P = sipMonthly;
    const annualRate = sipReturn;
    const years = sipYears;
    
    if (P <= 0 || annualRate <= 0 || years <= 0) {
      setSipResult({ invested: 0, returns: 0, total: 0 });
      return;
    }
    
    const i = annualRate / 12 / 100;
    const n = years * 12;
    
    const total = P * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
    const invested = P * n;
    const returns = total - invested;
    
    setSipResult({
      invested: Math.round(invested),
      returns: Math.round(returns),
      total: Math.round(total)
    });
  }, [sipMonthly, sipReturn, sipYears]);

  // --- BMI CALCULATION ---
  useEffect(() => {
    const w = bmiWeight;
    const h = bmiHeight;
    if (w <= 0 || h <= 0) {
      setBmiScore(0);
      setBmiCategory('');
      setBmiColor('');
      return;
    }
    
    let score = 0;
    if (bmiSystem === 'metric') {
      const heightInMeters = h / 100;
      score = w / (heightInMeters * heightInMeters);
    } else {
      score = (w * 703) / (h * h);
    }
    
    score = Number(score.toFixed(1));
    setBmiScore(score);
    
    let cat = 'Normal weight';
    let color = 'text-emerald-500 border-emerald-500/30 bg-emerald-500/10';
    if (score < 18.5) {
      cat = 'Underweight';
      color = 'text-blue-500 border-blue-500/30 bg-blue-500/10';
    } else if (score >= 30) {
      cat = 'Obese';
      color = 'text-red-500 border-red-500/30 bg-red-500/10';
    } else if (score >= 25) {
      cat = 'Overweight';
      color = 'text-orange-500 border-orange-500/30 bg-orange-500/10';
    }
    setBmiCategory(cat);
    setBmiColor(color);
  }, [bmiWeight, bmiHeight, bmiSystem]);

  // 1. Calculate EMI
  useEffect(() => {
    const P = loanAmount;
    const R = interestRate / 12 / 100; // monthly rate
    const N = tenureUnit === 'years' ? tenure * 12 : tenure; // total months

    if (P > 0 && R > 0 && N > 0) {
      const emi = (P * R * Math.pow(1 + R, N)) / (Math.pow(1 + R, N) - 1);
      const totalPayment = emi * N;
      const totalInterest = totalPayment - P;

      // Amortization Schedule
      const schedule = [];
      let balance = P;
      for (let i = 1; i <= N; i++) {
        const interest = balance * R;
        const principalPaid = emi - interest;
        balance -= principalPaid;

        schedule.push({
          month: i,
          payment: emi,
          interest,
          principalPaid,
          balance: Math.max(0, balance),
        });
      }

      setEmiResult({
        monthlyEmi: emi,
        totalInterest,
        totalPayment,
        amortization: schedule,
      });
    } else {
      setEmiResult({ monthlyEmi: 0, totalInterest: 0, totalPayment: 0, amortization: [] });
    }
  }, [loanAmount, interestRate, tenure, tenureUnit]);

  // 2. Calculate Salary Conversions
  useEffect(() => {
    const grossVal = baseSalary;
    if (grossVal <= 0) {
      setSalaryBreakdown([]);
      return;
    }

    let annualGross = grossVal;
    if (salaryFreq === 'monthly') annualGross = grossVal * 12;
    else if (salaryFreq === 'weekly') annualGross = grossVal * 52;
    else if (salaryFreq === 'hourly') annualGross = grossVal * hoursPerWeek * 52;

    const taxMultiplier = 1 - taxRate / 100;

    const frequencies = [
      { name: 'Annual', div: 1 },
      { name: 'Monthly', div: 12 },
      { name: 'Semi-Monthly (24x/yr)', div: 24 },
      { name: 'Bi-Weekly (26x/yr)', div: 26 },
      { name: 'Weekly', div: 52 },
      { name: 'Daily (5 days/wk)', div: 5 * 52 },
      { name: 'Hourly', div: hoursPerWeek * 52 },
    ];

    const breakdown = frequencies.map((freq) => {
      const gross = annualGross / freq.div;
      const net = gross * taxMultiplier;
      return {
        frequency: freq.name,
        gross,
        net,
      };
    });

    setSalaryBreakdown(breakdown);
  }, [baseSalary, salaryFreq, hoursPerWeek, taxRate]);

  // 3. Calculate Age difference
  useEffect(() => {
    const sDate = new Date(startDate);
    const eDate = new Date(endDate);

    if (isNaN(sDate.getTime()) || isNaN(eDate.getTime())) {
      setAgeResult(null);
      return;
    }

    const diffMs = eDate.getTime() - sDate.getTime();
    if (diffMs < 0) {
      setAgeResult(null);
      return;
    }

    // Advanced age breakdown
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.floor(diffDays / 7);
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    // Calculate Years, Months, Days accurately
    let years = eDate.getFullYear() - sDate.getFullYear();
    let months = eDate.getMonth() - sDate.getMonth();
    let days = eDate.getDate() - sDate.getDate();

    if (days < 0) {
      months -= 1;
      const prevMonth = new Date(eDate.getFullYear(), eDate.getMonth(), 0);
      days += prevMonth.getDate();
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }

    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const totalSeconds = Math.floor(diffMs / 1000);

    setAgeResult({
      years,
      months,
      days,
      totalDays: diffDays,
      totalWeeks: diffWeeks,
      totalHours: diffHours,
      totalMinutes,
      totalSeconds,
      totalMillis: diffMs,
    });
  }, [startDate, endDate]);

  const setStartPreset = (yearsAgo: number) => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - yearsAgo);
    setStartDate(d.toISOString().substring(0, 10));
  };

  // 4. Calculate Date Math (Add/Sub)
  useEffect(() => {
    const date = new Date(dateMathStart);
    if (isNaN(date.getTime())) {
      setDateMathResult('');
      return;
    }

    const offset = dateMathOp === 'add' ? dateMathOffset : -dateMathOffset;

    if (dateMathUnit === 'days') {
      date.setDate(date.getDate() + offset);
    } else if (dateMathUnit === 'weeks') {
      date.setDate(date.getDate() + offset * 7);
    } else if (dateMathUnit === 'months') {
      date.setMonth(date.getMonth() + offset);
    } else if (dateMathUnit === 'years') {
      date.setFullYear(date.getFullYear() + offset);
    }

    setDateMathResult(date.toDateString());
  }, [dateMathStart, dateMathOffset, dateMathUnit, dateMathOp]);

  const handleDownloadAmortization = () => {
    if (emiResult.amortization.length === 0) return;

    let csvContent = 'Month,EMI,Principal Paid,Interest Paid,Ending Balance\n';
    emiResult.amortization.forEach((row) => {
      csvContent += `${row.month},${row.payment.toFixed(2)},${row.principalPaid.toFixed(2)},${row.interest.toFixed(2)},${row.balance.toFixed(2)}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'loan_amortization_schedule.csv';
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Amortization schedule downloaded!');
  };

  // SVG Donut Chart variables
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const total = emiResult.totalPayment || 1;
  const principalPct = loanAmount / total;
  const interestPct = emiResult.totalInterest / total;
  const pStroke = circumference * principalPct;
  const iStroke = circumference * interestPct;

  return (
    <Tabs defaultValue="standard-calc" className="space-y-6">
      <div className="flex justify-center">
        <TabsList className="grid grid-cols-3 md:grid-cols-7 w-full max-w-5xl h-auto p-1 gap-1">
          <TabsTrigger value="standard-calc" className="gap-2 py-2 text-xs">
            <Calculator className="h-4 w-4" />
            Standard
          </TabsTrigger>
          <TabsTrigger value="loan-emi" className="gap-2 py-2 text-xs">
            <Landmark className="h-4 w-4" />
            EMI
          </TabsTrigger>
          <TabsTrigger value="salary" className="gap-2 py-2 text-xs">
            <Coins className="h-4 w-4" />
            Salary
          </TabsTrigger>
          <TabsTrigger value="date-math" className="gap-2 py-2 text-xs">
            <Calendar className="h-4 w-4" />
            Age/Date
          </TabsTrigger>
          <TabsTrigger value="gst-calc" className="gap-2 py-2 text-xs">
            <Coins className="h-4 w-4" />
            GST
          </TabsTrigger>
          <TabsTrigger value="sip-calc" className="gap-2 py-2 text-xs">
            <Landmark className="h-4 w-4" />
            SIP
          </TabsTrigger>
          <TabsTrigger value="bmi-calc" className="gap-2 py-2 text-xs">
            <Calculator className="h-4 w-4" />
            BMI
          </TabsTrigger>
        </TabsList>
      </div>

      {/* --- STANDARD/SCIENTIFIC CALCULATOR --- */}
      <TabsContent value="standard-calc" className="space-y-6 animate-fade-in">
        <div className="max-w-md mx-auto space-y-4">
          <Card className="border bg-card/65 backdrop-blur-sm shadow-xl p-5 border-primary/20 shadow-[0_0_30px_rgba(59,130,246,0.05)]">
            <CardContent className="p-0 space-y-4">
              {/* Scientific Toggle header */}
              <div className="flex justify-between items-center pb-2 border-b border-border/60">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Keypad Layout</span>
                <div className="flex items-center gap-1.5 text-xs">
                  <Label htmlFor="sci-toggle" className="cursor-pointer text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Scientific Keys</Label>
                  <Switch id="sci-toggle" checked={isScientific} onCheckedChange={setIsScientific} className="h-4.5 scale-75" />
                </div>
              </div>

              {/* Screen Display */}
              <div className="bg-black/25 dark:bg-black/45 rounded-xl p-4 font-mono text-right border border-border/80 shadow-inner space-y-1.5">
                {/* Past Calculation logs */}
                <div className="text-[10px] text-muted-foreground/60 min-h-[30px] flex flex-col justify-end items-end select-none border-b border-border/40 pb-1.5 space-y-0.5">
                  {calcHistory.length > 0 ? (
                    calcHistory.map((hist, i) => (
                      <div key={i} className="line-clamp-1">{hist}</div>
                    ))
                  ) : (
                    <div className="italic text-[9px] opacity-40">No history</div>
                  )}
                </div>
                <div className="text-xs text-muted-foreground min-h-[16px] overflow-x-auto whitespace-nowrap pt-1">
                  {expression || '0'}
                </div>
                <div className="text-2xl font-black text-primary overflow-x-auto whitespace-nowrap tracking-tight">
                  {result || '0'}
                </div>
              </div>

              {/* Extra Scientific Row if toggled */}
              {isScientific && (
                <div className="grid grid-cols-5 gap-1.5 font-mono text-[10px] border-b pb-2">
                  <Button variant="outline" className="h-8 px-0 font-semibold" onClick={() => handleInput('ln(')}>ln</Button>
                  <Button variant="outline" className="h-8 px-0 font-semibold" onClick={() => handleInput('log(')}>log</Button>
                  <Button variant="outline" className="h-8 px-0 font-semibold" onClick={() => handleInput('abs(')}>abs</Button>
                  <Button variant="outline" className="h-8 px-0 font-semibold" onClick={() => handleInput('fact(')}>n!</Button>
                  <Button variant="outline" className="h-8 px-0 font-semibold" onClick={() => handleInput('e')}>e</Button>
                  <Button variant="outline" className="h-8 px-0 font-semibold" onClick={() => handleInput('sinh(')}>sinh</Button>
                  <Button variant="outline" className="h-8 px-0 font-semibold" onClick={() => handleInput('cosh(')}>cosh</Button>
                  <Button variant="outline" className="h-8 px-0 font-semibold" onClick={() => handleInput('tanh(')}>tanh</Button>
                  <Button variant="outline" className="h-8 px-0 font-semibold" onClick={() => handleInput('(')}>(</Button>
                  <Button variant="outline" className="h-8 px-0 font-semibold" onClick={() => handleInput(')')}>)</Button>
                </div>
              )}

              {/* Grid of keys */}
              <div className="grid grid-cols-5 gap-2 font-mono text-xs">
                {/* Row 1 */}
                <Button variant="outline" className="h-11 text-red-500 border-red-500/30 hover:bg-red-500/10 font-bold" onClick={() => clearCalc()}>C</Button>
                <Button variant="outline" className="h-11 bg-muted/40 hover:bg-muted text-muted-foreground" onClick={() => handleInput('(')}>(</Button>
                <Button variant="outline" className="h-11 bg-muted/40 hover:bg-muted text-muted-foreground" onClick={() => handleInput(')')}>)</Button>
                <Button variant="outline" className="h-11 bg-muted/40 hover:bg-muted text-muted-foreground" onClick={() => handleInput('%')}>%</Button>
                <Button variant="outline" className="h-11 text-red-500 border-red-500/30 hover:bg-red-500/10 font-bold" onClick={() => backspace()}>⌫</Button>

                {/* Row 2 */}
                <Button variant="outline" className="h-11 bg-muted/40 hover:bg-muted text-muted-foreground font-semibold" onClick={() => handleInput('sin(')}>sin</Button>
                <Button variant="outline" className="h-11 bg-muted/40 hover:bg-muted text-muted-foreground font-semibold" onClick={() => handleInput('cos(')}>cos</Button>
                <Button variant="outline" className="h-11 bg-muted/40 hover:bg-muted text-muted-foreground font-semibold" onClick={() => handleInput('tan(')}>tan</Button>
                <Button variant="outline" className="h-11 bg-muted/40 hover:bg-muted text-muted-foreground font-semibold" onClick={() => handleInput('^')}>x^y</Button>
                <Button variant="outline" className="h-11 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 font-bold text-base" onClick={() => handleInput('/')}>÷</Button>

                {/* Row 3 */}
                <Button variant="outline" className="h-11 bg-muted/40 hover:bg-muted text-muted-foreground font-semibold" onClick={() => handleInput('√(')}>√</Button>
                <Button variant="outline" className="h-11 font-bold bg-card" onClick={() => handleInput('7')}>7</Button>
                <Button variant="outline" className="h-11 font-bold bg-card" onClick={() => handleInput('8')}>8</Button>
                <Button variant="outline" className="h-11 font-bold bg-card" onClick={() => handleInput('9')}>9</Button>
                <Button variant="outline" className="h-11 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 font-bold text-base" onClick={() => handleInput('*')}>×</Button>

                {/* Row 4 */}
                <Button variant="outline" className="h-11 bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/20 font-semibold" onClick={() => handleInput('π')}>π</Button>
                <Button variant="outline" className="h-11 font-bold bg-card" onClick={() => handleInput('4')}>4</Button>
                <Button variant="outline" className="h-11 font-bold bg-card" onClick={() => handleInput('5')}>5</Button>
                <Button variant="outline" className="h-11 font-bold bg-card" onClick={() => handleInput('6')}>6</Button>
                <Button variant="outline" className="h-11 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 font-bold text-base" onClick={() => handleInput('-')}>-</Button>

                {/* Row 5 */}
                <Button variant="outline" className="h-11 bg-muted/40 hover:bg-muted text-muted-foreground font-semibold" onClick={() => handleInput('²')}>x²</Button>
                <Button variant="outline" className="h-11 font-bold bg-card" onClick={() => handleInput('1')}>1</Button>
                <Button variant="outline" className="h-11 font-bold bg-card" onClick={() => handleInput('2')}>2</Button>
                <Button variant="outline" className="h-11 font-bold bg-card" onClick={() => handleInput('3')}>3</Button>
                <Button variant="outline" className="h-11 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20 font-bold text-base" onClick={() => handleInput('+')}>+</Button>

                {/* Row 6 */}
                <Button variant="outline" className="h-11 font-bold bg-card col-span-2" onClick={() => handleInput('0')}>0</Button>
                <Button variant="outline" className="h-11 font-bold bg-card" onClick={() => handleInput('.')}>.</Button>
                <Button variant="default" className="h-11 font-black col-span-2 text-base shadow-[0_0_15px_rgba(59,130,246,0.35)] transition-all hover:scale-[1.02]" onClick={() => calculateResult()}>=</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* --- LOAN EMI CALCULATOR --- */}
      <TabsContent value="loan-emi" className="space-y-6">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Controls */}
          <Card className="md:col-span-1">
            <CardContent className="p-4 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="loan-currency">Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger id="loan-currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="loan-amt">Loan Amount</Label>
                <Input
                  id="loan-amt"
                  type="number"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(Number(e.target.value))}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="loan-interest">Interest Rate (%)</Label>
                <Input
                  id="loan-interest"
                  type="number"
                  step="0.1"
                  value={interestRate}
                  onChange={(e) => setInterestRate(Number(e.target.value))}
                />
              </div>

              <div className="grid gap-4 grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="loan-tenure">Tenure</Label>
                  <Input
                    id="loan-tenure"
                    type="number"
                    value={tenure}
                    onChange={(e) => setTenure(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="tenure-unit">Unit</Label>
                  <Select value={tenureUnit} onValueChange={(v) => setTenureUnit(v as any)}>
                    <SelectTrigger id="tenure-unit">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="years">Years</SelectItem>
                      <SelectItem value="months">Months</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results split */}
          <Card className="md:col-span-2">
            <CardContent className="p-4 grid gap-6 sm:grid-cols-2 items-center">
              {/* Calculations Box */}
              <div className="space-y-4 font-mono text-xs">
                <div className="border-b pb-2">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Monthly Payment (EMI)</span>
                  <p className="text-3xl font-black text-primary leading-none mt-1">
                    {currencySymbol}{emiResult.monthlyEmi.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="flex justify-between border-b py-2">
                  <span className="text-muted-foreground">Principal Amount:</span>
                  <span className="font-bold">{currencySymbol}{loanAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-b py-2 text-red-500">
                  <span className="text-red-500">Interest Payable:</span>
                  <span className="font-bold">{currencySymbol}{emiResult.totalInterest.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Total Payments:</span>
                  <span className="font-bold">{currencySymbol}{emiResult.totalPayment.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
                </div>
              </div>

              {/* Native Donut Chart SVG */}
              <div className="flex flex-col items-center text-center">
                <svg width="150" height="150" viewBox="0 0 100 100" className="transform -rotate-90 select-none">
                  {/* Background Track */}
                  <circle cx="50" cy="50" r={radius} fill="transparent" stroke="currentColor" className="text-muted/20" strokeWidth="12" />
                  {/* Principal Circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="transparent"
                    stroke="#3B82F6"
                    strokeWidth="12"
                    strokeDasharray={`${pStroke} ${circumference}`}
                  />
                  {/* Interest Circle */}
                  <circle
                    cx="50"
                    cy="50"
                    r={radius}
                    fill="transparent"
                    stroke="#EF4444"
                    strokeWidth="12"
                    strokeDasharray={`${iStroke} ${circumference}`}
                    strokeDashoffset={-pStroke}
                  />
                </svg>
                
                <div className="mt-4 flex gap-4 text-xs font-semibold">
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-blue-500" /> Principal ({Math.round(principalPct * 100)}%)</span>
                  <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-500" /> Interest ({Math.round(interestPct * 100)}%)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Amortization Table */}
        {emiResult.amortization.length > 0 && (
          <Card>
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-semibold text-sm flex items-center gap-1.5">
                  <Table className="h-4 w-4 text-primary" />
                  Amortization Breakdown
                </h3>
                <Button variant="outline" size="sm" onClick={handleDownloadAmortization} className="h-7 text-xs">
                  <Download className="h-3 w-3 mr-1" />
                  Download CSV
                </Button>
              </div>

              <div className="max-h-72 overflow-y-auto border rounded-md">
                <table className="w-full text-xs font-mono border-collapse text-left">
                  <thead>
                    <tr className="bg-muted/40 border-b">
                      <th className="p-2 border-r">Month</th>
                      <th className="p-2 border-r">EMI</th>
                      <th className="p-2 border-r">Principal</th>
                      <th className="p-2 border-r">Interest</th>
                      <th className="p-2">Ending Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {emiResult.amortization.map((row) => (
                      <tr key={row.month} className="border-b hover:bg-muted/10 last:border-0">
                        <td className="p-2 border-r">{row.month}</td>
                        <td className="p-2 border-r">{currencySymbol}{row.payment.toFixed(2)}</td>
                        <td className="p-2 border-r">{currencySymbol}{row.principalPaid.toFixed(2)}</td>
                        <td className="p-2 border-r">{currencySymbol}{row.interest.toFixed(2)}</td>
                        <td className="p-2">{currencySymbol}{row.balance.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      {/* --- SALARY CONVERTER --- */}
      <TabsContent value="salary" className="space-y-6">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Form */}
          <Card className="md:col-span-1">
            <CardContent className="p-4 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="salary-currency">Currency</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger id="salary-currency">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CURRENCIES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="base-sal">Base Salary Amount</Label>
                <Input
                  id="base-sal"
                  type="number"
                  value={baseSalary}
                  onChange={(e) => setBaseSalary(Number(e.target.value))}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="base-freq">Frequency</Label>
                <Select value={salaryFreq} onValueChange={setSalaryFreq}>
                  <SelectTrigger id="base-freq">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="annual">Annual</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="hourly">Hourly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {salaryFreq !== 'hourly' && (
                <div className="space-y-1.5">
                  <Label htmlFor="hours-wk">Hours Per Week</Label>
                  <Input
                    id="hours-wk"
                    type="number"
                    value={hoursPerWeek}
                    onChange={(e) => setHoursPerWeek(Number(e.target.value))}
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <Label htmlFor="tax-rate">Estimated Tax Deduction (%)</Label>
                <Input
                  id="tax-rate"
                  type="number"
                  min={0}
                  max={100}
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Breakdown table */}
          <Card className="md:col-span-2">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="font-semibold text-sm">Converted Frequency Breakdown</h3>
                <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Gross vs Net</span>
              </div>

              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-xs font-mono border-collapse text-left">
                  <thead>
                    <tr className="bg-muted/40 border-b">
                      <th className="p-2 border-r">Frequencies</th>
                      <th className="p-2 border-r">Gross Pay</th>
                      <th className="p-2">Net Pay (Take-Home)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {salaryBreakdown.map((row) => (
                      <tr key={row.frequency} className="border-b hover:bg-muted/10 last:border-0">
                        <td className="p-2 border-r font-bold">{row.frequency}</td>
                        <td className="p-2 border-r">{currencySymbol}{row.gross.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                        <td className="p-2 text-emerald-600 dark:text-emerald-400 font-bold">
                          {currencySymbol}{row.net.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* --- AGE & DATE CALCULATOR --- */}
      <TabsContent value="date-math" className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Age Calculator Card */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold text-sm border-b pb-2 flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-primary" />
                Age & Interval Calculator
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="dob-input">Start Date / Date of Birth</Label>
                  <Input id="dob-input" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full text-xs" />
                  
                  {/* Start Presets */}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {[10, 20, 30, 50].map((yr) => (
                      <Button
                        key={yr}
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setStartPreset(yr)}
                        className="text-[9px] px-1.5 h-5 w-auto text-muted-foreground hover:text-primary border"
                      >
                        -{yr}y
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="end-date-input">End Date</Label>
                  <Input id="end-date-input" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full text-xs" />

                  {/* End Presets */}
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setEndDate(new Date().toISOString().substring(0, 10))}
                      className="text-[9px] px-1.5 h-5 w-auto text-muted-foreground hover:text-primary border"
                    >
                      Today
                    </Button>
                  </div>
                </div>
              </div>

              {ageResult ? (
                <div className="space-y-3 pt-2">
                  <div className="bg-primary/5 border border-primary/20 p-4 rounded-xl text-center space-y-1">
                    <span className="text-[10px] text-muted-foreground uppercase font-black tracking-wider">Age Duration</span>
                    <p className="text-xl md:text-2xl font-black text-primary leading-tight">
                      {ageResult.years} Years, {ageResult.months} Months, {ageResult.days} Days
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-card border p-2.5 rounded-lg space-y-0.5">
                      <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Total Weeks</span>
                      <p className="font-bold text-sm font-mono">{ageResult.totalWeeks.toLocaleString()} w</p>
                    </div>
                    <div className="bg-card border p-2.5 rounded-lg space-y-0.5">
                      <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Total Days</span>
                      <p className="font-bold text-sm font-mono">{ageResult.totalDays.toLocaleString()} d</p>
                    </div>
                    <div className="bg-card border p-2.5 rounded-lg space-y-0.5">
                      <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Total Hours</span>
                      <p className="font-bold text-sm font-mono">{ageResult.totalHours.toLocaleString()} h</p>
                    </div>
                    <div className="bg-card border p-2.5 rounded-lg space-y-0.5">
                      <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Total Minutes</span>
                      <p className="font-bold text-sm font-mono">{ageResult.totalMinutes.toLocaleString()} m</p>
                    </div>
                    <div className="bg-card border p-2.5 rounded-lg space-y-0.5">
                      <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Total Seconds</span>
                      <p className="font-bold text-sm font-mono">{ageResult.totalSeconds.toLocaleString()} s</p>
                    </div>
                    <div className="bg-card border p-2.5 rounded-lg space-y-0.5">
                      <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Total Milliseconds</span>
                      <p className="font-bold text-[11px] font-mono break-all">{ageResult.totalMillis.toLocaleString()} ms</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 border border-dashed rounded-lg bg-muted/20">
                  <Clock className="h-6 w-6 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground italic">Provide correct start/end date intervals.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Date Math Card */}
          <Card>
            <CardContent className="p-4 space-y-4">
              <h3 className="font-semibold text-sm border-b pb-2 flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-primary" />
                Add or Subtract Time
              </h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="math-start">Base Date</Label>
                  <Input id="math-start" type="date" value={dateMathStart} onChange={(e) => setDateMathStart(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="math-op">Operation</Label>
                  <Select value={dateMathOp} onValueChange={setDateMathOp}>
                    <SelectTrigger id="math-op">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="add">Add (+)</SelectItem>
                      <SelectItem value="sub">Subtract (-)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="math-offset">Offset Value</Label>
                  <Input
                    id="math-offset"
                    type="number"
                    value={dateMathOffset}
                    onChange={(e) => setDateMathOffset(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="math-unit">Offset Unit</Label>
                  <Select value={dateMathUnit} onValueChange={setDateMathUnit}>
                    <SelectTrigger id="math-unit">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="days">Days</SelectItem>
                      <SelectItem value="weeks">Weeks</SelectItem>
                      <SelectItem value="months">Months</SelectItem>
                      <SelectItem value="years">Years</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="p-4 bg-muted/40 rounded-xl border flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Calculated Date</span>
                  <p className="text-lg font-black text-primary font-mono mt-0.5">{dateMathResult || 'Invalid input'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* --- GST CALCULATOR --- */}
      <TabsContent value="gst-calc" className="space-y-6 animate-fade-in">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Controls */}
          <Card className="md:col-span-1">
            <CardContent className="p-4 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="gst-amount">Initial Amount</Label>
                <Input
                  id="gst-amount"
                  type="number"
                  value={gstAmount}
                  onChange={(e) => setGstAmount(Math.max(0, Number(e.target.value)))}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="gst-rate">Tax Rate (%)</Label>
                <Select value={String(gstRate)} onValueChange={(v) => setGstRate(Number(v))}>
                  <SelectTrigger id="gst-rate">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5% (Utility/Grains)</SelectItem>
                    <SelectItem value="12">12% (Standard)</SelectItem>
                    <SelectItem value="18">18% (Services/IT)</SelectItem>
                    <SelectItem value="28">28% (Luxury)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label>Tax Calculation Type</Label>
                <Select value={gstType} onValueChange={(v: any) => setGstType(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="add">Add GST (+)</SelectItem>
                    <SelectItem value="remove">Remove GST (-)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Results Summary */}
          <Card className="md:col-span-2">
            <CardContent className="p-6 space-y-6">
              <div className="flex justify-between items-center pb-2 border-b">
                <h3 className="font-bold text-sm">Tax Summary (GST)</h3>
                <Badge variant="secondary">Calculated</Badge>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div className="bg-muted/30 p-3 rounded-lg border text-center space-y-0.5">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Net Amount</span>
                  <p className="text-base font-black text-foreground">{currencySymbol}{gstResult.net.toFixed(2)}</p>
                </div>
                <div className="bg-muted/30 p-3 rounded-lg border text-center space-y-0.5">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Tax (CGST + SGST)</span>
                  <p className="text-base font-black text-primary">{currencySymbol}{gstResult.tax.toFixed(2)}</p>
                </div>
                <div className="bg-primary/5 p-3 rounded-lg border border-primary/20 text-center space-y-0.5">
                  <span className="text-[10px] text-primary uppercase font-bold tracking-wider">Gross Total</span>
                  <p className="text-base font-black text-primary">{currencySymbol}{gstResult.gross.toFixed(2)}</p>
                </div>
              </div>

              <div className="bg-muted/20 p-4 rounded-xl border space-y-2 text-xs">
                <h4 className="font-bold uppercase tracking-wider text-muted-foreground text-[10px]">CGST / SGST Tax Split (50% each)</h4>
                <div className="flex justify-between border-b pb-1.5 border-dashed">
                  <span className="text-muted-foreground">Central GST (CGST):</span>
                  <span className="font-bold font-mono">{currencySymbol}{(gstResult.tax / 2).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">State GST (SGST):</span>
                  <span className="font-bold font-mono">{currencySymbol}{(gstResult.tax / 2).toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* --- SIP CALCULATOR --- */}
      <TabsContent value="sip-calc" className="space-y-6 animate-fade-in">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Controls */}
          <Card className="md:col-span-1">
            <CardContent className="p-4 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="sip-monthly">Monthly Investment</Label>
                <Input
                  id="sip-monthly"
                  type="number"
                  step="500"
                  value={sipMonthly}
                  onChange={(e) => setSipMonthly(Math.max(0, Number(e.target.value)))}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sip-return">Expected Return Rate (%)</Label>
                <Input
                  id="sip-return"
                  type="number"
                  step="0.5"
                  value={sipReturn}
                  onChange={(e) => setSipReturn(Math.max(0, Number(e.target.value)))}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sip-years">Time Period (Years)</Label>
                <Input
                  id="sip-years"
                  type="number"
                  value={sipYears}
                  onChange={(e) => setSipYears(Math.max(0, Number(e.target.value)))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Results Summary */}
          <Card className="md:col-span-2">
            <CardContent className="p-6 grid md:grid-cols-5 gap-6">
              <div className="md:col-span-3 space-y-4">
                <h3 className="font-bold text-sm border-b pb-2">SIP Wealth Estimate</h3>
                
                <div className="space-y-3.5 text-xs">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Invested Amount:</span>
                    <span className="font-bold font-mono">{currencySymbol}{sipResult.invested.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-muted-foreground">Est. Return Wealth Gained:</span>
                    <span className="font-bold font-mono text-emerald-500">+{currencySymbol}{sipResult.returns.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black pt-1">
                    <span className="text-foreground">Total Future Value:</span>
                    <span className="font-mono text-primary">{currencySymbol}{sipResult.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Donut Chart Display */}
              <div className="md:col-span-2 flex flex-col justify-center items-center text-center">
                <div className="relative w-36 h-36">
                  <svg className="w-full h-full -rotate-90">
                    <circle cx="72" cy="72" r="35" className="stroke-slate-100 dark:stroke-slate-800 fill-none" strokeWidth="12" />
                    {sipResult.total > 0 && (
                      <>
                        {/* Invested progress */}
                        <circle
                          cx="72"
                          cy="72"
                          r="35"
                          className="stroke-blue-500 fill-none"
                          strokeWidth="12"
                          strokeDasharray={2 * Math.PI * 35}
                          strokeDashoffset={2 * Math.PI * 35 - (sipResult.invested / sipResult.total) * (2 * Math.PI * 35)}
                        />
                        {/* Returns progress */}
                        <circle
                          cx="72"
                          cy="72"
                          r="35"
                          className="stroke-emerald-500 fill-none"
                          strokeWidth="12"
                          strokeDasharray={2 * Math.PI * 35}
                          strokeDashoffset={2 * Math.PI * 35 - (sipResult.returns / sipResult.total) * (2 * Math.PI * 35)}
                          style={{
                            transform: `rotate(${(sipResult.invested / sipResult.total) * 360}deg)`,
                            transformOrigin: '72px 72px'
                          }}
                        />
                      </>
                    )}
                  </svg>
                  <div className="absolute inset-0 flex flex-col justify-center items-center">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">Returns</span>
                    <span className="text-xs font-black text-emerald-500">
                      {sipResult.total > 0 ? Math.round((sipResult.returns / sipResult.total) * 100) : 0}%
                    </span>
                  </div>
                </div>

                <div className="flex gap-4 text-[10px] font-bold mt-4">
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded bg-blue-500" />Invested</span>
                  <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded bg-emerald-500" />Gains</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* --- BMI CALCULATOR --- */}
      <TabsContent value="bmi-calc" className="space-y-6 animate-fade-in">
        <div className="grid gap-6 md:grid-cols-3">
          {/* Controls */}
          <Card className="md:col-span-1">
            <CardContent className="p-4 space-y-4">
              <div className="space-y-1.5">
                <Label>Measurement System</Label>
                <Select value={bmiSystem} onValueChange={(v: any) => setBmiSystem(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="metric">Metric (kg / cm)</SelectItem>
                    <SelectItem value="imperial">Imperial (lbs / inches)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bmi-weight">Weight ({bmiSystem === 'metric' ? 'kg' : 'lbs'})</Label>
                <Input
                  id="bmi-weight"
                  type="number"
                  value={bmiWeight}
                  onChange={(e) => setBmiWeight(Math.max(0, Number(e.target.value)))}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="bmi-height">Height ({bmiSystem === 'metric' ? 'cm' : 'inches'})</Label>
                <Input
                  id="bmi-height"
                  type="number"
                  value={bmiHeight}
                  onChange={(e) => setBmiHeight(Math.max(0, Number(e.target.value)))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Results Summary */}
          <Card className="md:col-span-2 flex flex-col justify-center">
            <CardContent className="p-6 space-y-6">
              <div className="flex justify-between items-center pb-2 border-b">
                <h3 className="font-bold text-sm">Body Mass Index (BMI) Report</h3>
                <Badge variant="secondary">Calculated</Badge>
              </div>

              {bmiScore > 0 ? (
                <div className="space-y-6">
                  <div className="flex items-center justify-between gap-6">
                    <div className="space-y-0.5">
                      <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">BMI Score</span>
                      <p className="text-3xl font-black text-foreground font-mono">{bmiScore}</p>
                    </div>
                    <div className={`px-4 py-2 border rounded-xl font-bold text-xs uppercase tracking-wider ${bmiColor}`}>
                      {bmiCategory}
                    </div>
                  </div>

                  {/* Horizontal gauge bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                      <span>15 (Under)</span>
                      <span>18.5</span>
                      <span>25</span>
                      <span>30</span>
                      <span>35 (Obese)</span>
                    </div>
                    <div className="relative w-full h-3 bg-gradient-to-r from-blue-400 via-emerald-400 via-orange-400 to-red-400 rounded-full">
                      {/* Needle indicator pin */}
                      <div
                        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-5 w-5 rounded-full border-2 border-white bg-slate-950 shadow-md transition-all duration-300"
                        style={{
                          left: `${Math.min(100, Math.max(0, ((bmiScore - 15) / (35 - 15)) * 100))}%`
                        }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 border border-dashed rounded-lg bg-muted/20">
                  <Calculator className="h-6 w-6 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground italic">Provide correct weight/height metrics.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </TabsContent>
    </Tabs>
  );
}
