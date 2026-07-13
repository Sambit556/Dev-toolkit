import React from 'react';
import { CurrencyExchangerTool } from './Lazy';

export const metadata = {
  title: 'Currency Exchanger - DevSuite',
  description: 'Convert global currencies with live public API conversion rates and offline static fallback adjustments.',
};

export default function CurrencyPage() {
  return (
    <div className="container max-w-6xl py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-primary leading-tight">
          Currency Exchanger
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Perform live exchange rate conversions, analyze 7-day simulated trend graphs, or edit custom offline rate metrics.
        </p>
      </div>
      <CurrencyExchangerTool />
    </div>
  );
}
