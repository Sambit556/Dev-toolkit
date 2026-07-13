const USD_RELATIVE_RATES: Record<string, number> = {
  USD: 1.0, EUR: 0.92, GBP: 0.78, INR: 83.5, JPY: 161.2, CAD: 1.36, AUD: 1.49, CHF: 0.89,
  CNY: 7.27, SGD: 1.34, AED: 3.67, SAR: 3.75, NZD: 1.62, HKD: 7.8, ZAR: 18.0, RUB: 88.0,
  MXN: 18.0, BRL: 5.5, KRW: 1370, TRY: 32.5, SEK: 10.4, NOK: 10.6, DKK: 6.9, PLN: 3.9,
  THB: 36.3, MYR: 4.7, PHP: 58.5, IDR: 16200, PKR: 278, NPR: 133, BDT: 117, LKR: 300,
  EGP: 47.5, ILS: 3.65,
};

export async function getExchangeRates(baseCurrency: string): Promise<{ rates: Record<string, number>; source: string }> {
  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${encodeURIComponent(baseCurrency)}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) throw new Error('rate API request failed');
    const data = await res.json();
    if (data.result !== 'success') throw new Error('rate API returned an unsuccessful response');
    return { rates: data.rates, source: 'live (open.er-api.com)' };
  } catch {
    const baseRateInUsd = USD_RELATIVE_RATES[baseCurrency.toUpperCase()] || 1.0;
    const rates: Record<string, number> = {};
    for (const [cur, val] of Object.entries(USD_RELATIVE_RATES)) rates[cur] = val / baseRateInUsd;
    return { rates, source: 'offline static fallback' };
  }
}

export async function convertCurrency(amount: number, fromCurrency: string, toCurrency: string) {
  const { rates, source } = await getExchangeRates(fromCurrency.toUpperCase());
  const rate = rates[toCurrency.toUpperCase()];
  if (rate === undefined) throw new Error(`No exchange rate found for ${toCurrency}`);
  return { amount, fromCurrency, toCurrency, rate, convertedAmount: amount * rate, source };
}
