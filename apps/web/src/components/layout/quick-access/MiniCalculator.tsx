'use client';

import { useState } from 'react';

// Evaluates a "num op num op num ..." chain (the only shape MiniCalculator
// ever produces) with standard * / before + - precedence. Tokenizes by
// scanning for digit runs and operator characters directly, rather than
// splitting on whitespace, so it works whether the user typed "5+3" or
// clicked buttons that insert " + " with spaces.
function evaluateArithmetic(expression: string): number {
  const tokens = expression.match(/\d+\.?\d*|[+\-*/]/g);
  if (!tokens || tokens.length === 0 || tokens.length % 2 === 0 || /^[+\-*/]$/.test(tokens[0])) {
    throw new Error('Invalid expression');
  }

  const stack: (number | string)[] = [Number(tokens[0])];
  for (let i = 1; i < tokens.length; i += 2) {
    const op = tokens[i];
    const num = Number(tokens[i + 1]);
    if (op === '*' || op === '/') {
      const prev = stack.pop() as number;
      stack.push(op === '*' ? prev * num : prev / num);
    } else {
      stack.push(op, num);
    }
  }

  let result = stack[0] as number;
  for (let i = 1; i < stack.length; i += 2) {
    const op = stack[i] as string;
    const num = stack[i + 1] as number;
    result = op === '+' ? result + num : result - num;
  }
  return result;
}

export function MiniCalculator() {
  // A single freely-editable expression string, so the field behaves like a
  // normal text input: type digits/operators directly, click anywhere to
  // change a number, select-and-retype, etc. Starts empty (with a "0"
  // placeholder) rather than pre-filled with "0" — a pre-filled value means
  // typed digits land next to the leftover zero instead of replacing it
  // (e.g. typing "12+30" into a field that already contains "0" becomes
  // "12+300"), silently producing the wrong result.
  // `justCalculated` only affects button clicks (a digit button after "="
  // starts a fresh expression, matching standard calculator UX) — direct
  // typing always edits in place.
  const [expression, setExpression] = useState('');
  const [justCalculated, setJustCalculated] = useState(false);
  // The equation that produced the current result, shown small above the
  // input (e.g. "9 * 9 =") once you hit "=" — it's the only trace of what
  // you actually typed once the input itself gets replaced by the answer.
  const [lastEquation, setLastEquation] = useState('');

  const sanitize = (v: string) => v.replace(/[^0-9.+\-*/\s]/g, '');

  const handleNum = (num: string) => {
    setExpression((prev) => (justCalculated || !prev ? num : prev + num));
    setJustCalculated(false);
  };

  const handleOp = (op: string) => {
    // Ignore operator presses with nothing to operate on yet, rather than
    // producing a leading-operator expression like " + " that can't evaluate.
    setExpression((prev) => (prev.trim() ? `${prev.trim()} ${op} ` : prev));
    setJustCalculated(false);
  };

  const handleClear = () => {
    setExpression('');
    setJustCalculated(false);
    setLastEquation('');
  };

  const handleBackspace = () => {
    setExpression((prev) => prev.slice(0, -1));
    setJustCalculated(false);
  };

  const handleCalc = () => {
    const trimmed = expression.trim();
    if (!trimmed) return;
    try {
      const result = evaluateArithmetic(trimmed);
      setLastEquation(trimmed);
      setExpression(Number(result.toFixed(6)).toString());
    } catch {
      setLastEquation('');
      setExpression('Error');
    }
    setJustCalculated(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setExpression(sanitize(e.target.value));
    setJustCalculated(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCalc();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleClear();
    }
  };

  return (
    <div className="p-3 bg-card space-y-2 select-none" onMouseDown={(e) => e.stopPropagation()} onTouchStart={(e) => e.stopPropagation()}>
      <div className="bg-muted/50 rounded-lg p-2 border text-right">
        <div className="text-[10px] text-muted-foreground font-mono truncate h-4 leading-4">
          {lastEquation && `${lastEquation} =`}
        </div>
        <input
          type="text"
          inputMode="decimal"
          value={expression}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          placeholder="0"
          className="w-full bg-transparent text-right text-xl font-bold font-mono text-foreground outline-none truncate placeholder:text-foreground"
        />
      </div>
      <div className="grid grid-cols-4 gap-1.5">
        <button onClick={handleClear} className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 rounded-lg font-bold text-xs">C</button>
        <button onClick={() => handleOp('/')} className="p-2 bg-muted/80 hover:bg-muted text-foreground rounded-lg font-bold text-xs">/</button>
        <button onClick={() => handleOp('*')} className="p-2 bg-muted/80 hover:bg-muted text-foreground rounded-lg font-bold text-xs">*</button>
        <button onClick={() => handleOp('-')} className="p-2 bg-muted/80 hover:bg-muted text-foreground rounded-lg font-bold text-xs">-</button>

        <button onClick={() => handleNum('7')} className="p-2 bg-muted/20 hover:bg-muted/30 text-foreground rounded-lg font-bold text-xs">7</button>
        <button onClick={() => handleNum('8')} className="p-2 bg-muted/20 hover:bg-muted/30 text-foreground rounded-lg font-bold text-xs">8</button>
        <button onClick={() => handleNum('9')} className="p-2 bg-muted/20 hover:bg-muted/30 text-foreground rounded-lg font-bold text-xs">9</button>
        <button onClick={() => handleOp('+')} className="p-2 bg-muted/80 hover:bg-muted text-foreground rounded-lg font-bold text-xs">+</button>

        <button onClick={() => handleNum('4')} className="p-2 bg-muted/20 hover:bg-muted/30 text-foreground rounded-lg font-bold text-xs">4</button>
        <button onClick={() => handleNum('5')} className="p-2 bg-muted/20 hover:bg-muted/30 text-foreground rounded-lg font-bold text-xs">5</button>
        <button onClick={() => handleNum('6')} className="p-2 bg-muted/20 hover:bg-muted/30 text-foreground rounded-lg font-bold text-xs">6</button>
        <button onClick={handleCalc} className="row-span-2 p-2 bg-primary text-primary-foreground rounded-lg font-bold text-xs flex items-center justify-center">=</button>

        <button onClick={() => handleNum('1')} className="p-2 bg-muted/20 hover:bg-muted/30 text-foreground rounded-lg font-bold text-xs">1</button>
        <button onClick={() => handleNum('2')} className="p-2 bg-muted/20 hover:bg-muted/30 text-foreground rounded-lg font-bold text-xs">2</button>
        <button onClick={() => handleNum('3')} className="p-2 bg-muted/20 hover:bg-muted/30 text-foreground rounded-lg font-bold text-xs">3</button>

        <button onClick={() => handleNum('0')} className="col-span-2 p-2 bg-muted/20 hover:bg-muted/30 text-foreground rounded-lg font-bold text-xs">0</button>
        <button onClick={() => handleNum('.')} className="p-2 bg-muted/20 hover:bg-muted/30 text-foreground rounded-lg font-bold text-xs">.</button>
        <button onClick={handleBackspace} aria-label="Backspace" className="p-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 rounded-lg font-bold text-xs flex items-center justify-center">⌫</button>
      </div>
    </div>
  );
}
