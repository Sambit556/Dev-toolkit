function factorial(n: number): number {
  if (n < 0) return NaN;
  if (n === 0 || n === 1) return 1;
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}

/** Evaluates a basic/scientific math expression (e.g. "2*(3+4)", "sin(π/2)", "fact(5)"). */
export function evaluateMathExpression(expression: string): number {
  const sanitized = expression
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/π/g, 'Math.PI')
    .replace(/√\(/g, 'Math.sqrt(')
    .replace(/sinh\(/g, 'Math.sinh(')
    .replace(/cosh\(/g, 'Math.cosh(')
    .replace(/tanh\(/g, 'Math.tanh(')
    .replace(/sin\(/g, 'Math.sin(')
    .replace(/cos\(/g, 'Math.cos(')
    .replace(/tan\(/g, 'Math.tan(')
    .replace(/ln\(/g, 'Math.log(')
    .replace(/log\(/g, 'Math.log10(')
    .replace(/abs\(/g, 'Math.abs(')
    .replace(/fact\(/g, 'factorial(')
    .replace(/\^/g, '**')
    .replace(/²/g, '**2');

  const matchRegex = /^[0-9+\-*/%().Math.sinostanPIsqrtpoweabsfactorial\s]+$/;
  if (!matchRegex.test(sanitized)) throw new Error('Expression contains disallowed characters');

  const evalFn = new Function('factorial', `return (${sanitized})`);
  const val = evalFn(factorial);
  if (val === undefined || Number.isNaN(val)) throw new Error('Expression did not evaluate to a number');
  if (!Number.isFinite(val)) throw new Error('Result is not finite (e.g. division by zero)');
  return Number(val.toFixed(8));
}

export interface EmiResult {
  monthlyEmi: number;
  totalInterest: number;
  totalPayment: number;
  amortization: { month: number; payment: number; interest: number; principalPaid: number; balance: number }[];
}

export function calculateEmi(principal: number, annualRatePct: number, tenure: number, tenureUnit: 'years' | 'months'): EmiResult {
  const R = annualRatePct / 12 / 100;
  const N = tenureUnit === 'years' ? tenure * 12 : tenure;
  if (principal <= 0 || R <= 0 || N <= 0) return { monthlyEmi: 0, totalInterest: 0, totalPayment: 0, amortization: [] };

  const emi = (principal * R * Math.pow(1 + R, N)) / (Math.pow(1 + R, N) - 1);
  const totalPayment = emi * N;
  const totalInterest = totalPayment - principal;

  const schedule = [];
  let balance = principal;
  for (let i = 1; i <= N; i++) {
    const interest = balance * R;
    const principalPaid = emi - interest;
    balance -= principalPaid;
    schedule.push({ month: i, payment: emi, interest, principalPaid, balance: Math.max(0, balance) });
  }
  return { monthlyEmi: emi, totalInterest, totalPayment, amortization: schedule };
}

export function convertSalaryFrequency(baseSalary: number, freq: string, hoursPerWeek: number, taxRatePct: number) {
  let annualGross = baseSalary;
  if (freq === 'monthly') annualGross = baseSalary * 12;
  else if (freq === 'weekly') annualGross = baseSalary * 52;
  else if (freq === 'hourly') annualGross = baseSalary * hoursPerWeek * 52;

  const taxMultiplier = 1 - taxRatePct / 100;
  const frequencies = [
    { name: 'Annual', div: 1 },
    { name: 'Monthly', div: 12 },
    { name: 'Semi-Monthly (24x/yr)', div: 24 },
    { name: 'Bi-Weekly (26x/yr)', div: 26 },
    { name: 'Weekly', div: 52 },
    { name: 'Daily (5 days/wk)', div: 5 * 52 },
    { name: 'Hourly', div: hoursPerWeek * 52 },
  ];
  return frequencies.map((f) => ({ frequency: f.name, gross: annualGross / f.div, net: (annualGross / f.div) * taxMultiplier }));
}

export function calculateDateInterval(startDate: string, endDate: string) {
  const sDate = new Date(startDate);
  const eDate = new Date(endDate);
  if (Number.isNaN(sDate.getTime()) || Number.isNaN(eDate.getTime())) throw new Error('Invalid start or end date');
  const diffMs = eDate.getTime() - sDate.getTime();
  if (diffMs < 0) throw new Error('End date must be after start date');

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

  return {
    years, months, days,
    totalDays: Math.floor(diffMs / 86400000),
    totalWeeks: Math.floor(diffMs / 86400000 / 7),
    totalHours: Math.floor(diffMs / 3600000),
    totalMinutes: Math.floor(diffMs / 60000),
    totalSeconds: Math.floor(diffMs / 1000),
    totalMillis: diffMs,
  };
}

export function addSubtractDate(startDate: string, offset: number, unit: 'days' | 'weeks' | 'months' | 'years', op: 'add' | 'sub'): string {
  const date = new Date(startDate);
  if (Number.isNaN(date.getTime())) throw new Error('Invalid start date');
  const signedOffset = op === 'add' ? offset : -offset;
  if (unit === 'days') date.setDate(date.getDate() + signedOffset);
  else if (unit === 'weeks') date.setDate(date.getDate() + signedOffset * 7);
  else if (unit === 'months') date.setMonth(date.getMonth() + signedOffset);
  else if (unit === 'years') date.setFullYear(date.getFullYear() + signedOffset);
  return date.toISOString();
}

export function calculateGst(amount: number, ratePct: number, type: 'add' | 'remove') {
  if (type === 'add') {
    const tax = (amount * ratePct) / 100;
    return { net: amount, tax, gross: amount + tax };
  }
  const net = amount / (1 + ratePct / 100);
  return { net, tax: amount - net, gross: amount };
}

export function calculateSip(monthly: number, annualRatePct: number, years: number) {
  if (monthly <= 0 || annualRatePct <= 0 || years <= 0) return { invested: 0, returns: 0, total: 0 };
  const i = annualRatePct / 12 / 100;
  const n = years * 12;
  const total = monthly * ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
  const invested = monthly * n;
  return { invested: Math.round(invested), returns: Math.round(total - invested), total: Math.round(total) };
}

export function calculateBmi(system: 'metric' | 'imperial', weight: number, height: number) {
  if (weight <= 0 || height <= 0) throw new Error('Weight and height must be positive');
  const score = system === 'metric' ? weight / ((height / 100) ** 2) : (weight * 703) / (height * height);
  const rounded = Number(score.toFixed(1));
  let category = 'Normal weight';
  if (rounded < 18.5) category = 'Underweight';
  else if (rounded >= 30) category = 'Obese';
  else if (rounded >= 25) category = 'Overweight';
  return { score: rounded, category };
}
