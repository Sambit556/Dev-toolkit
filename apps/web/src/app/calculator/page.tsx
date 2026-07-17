import { BackToHomeLink } from '@/components/layout/BackToHomeLink';
import type { Metadata } from 'next';
import { Calculator } from 'lucide-react';
import { CalculatorTool } from '@/components/calculator/CalculatorTool';
import { Separator } from '@/components/ui/separator';

export const metadata: Metadata = {
  title: 'Calculators — Loan EMI, Salary, Age & Date',
  description:
    'Calculate Loan EMI payments, analyze gross and net take-home salary conversions, compute age and date intervals, or add/subtract offsets from dates client-side.',
  alternates: { canonical: '/calculator' },
};

export default function CalculatorPage() {
  return (
    <div className="container py-6 md:py-8 max-w-5xl">
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <BackToHomeLink />
          <Calculator className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Calculators</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          A suite of calculators to compute Loan EMI amortization schedules, Gross/Net Salary conversions, 
          and precise calendar dates or age offsets.
        </p>
      </div>

      <Separator className="mb-6" />

      {/* Main tool container */}
      <CalculatorTool />
    </div>
  );
}
