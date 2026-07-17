'use client';

import React, { useState } from 'react';
import { ExternalLink, Wallet, Smartphone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CopyButton } from '@/components/ui/copy-button';

// Public-facing payment details, configured via env (see .env.local.example) so
// they're not hardcoded in source and can be swapped per-deployment. These are
// rendered client-side for visitors to click/copy, so they're inherently public —
// not secrets, just kept out of the component file.
const PAYPAL_LINK = process.env.NEXT_PUBLIC_PAYPAL_LINK || 'https://paypal.me/YOUR_PAYPAL_HANDLE';
const UPI_ID = process.env.NEXT_PUBLIC_UPI_ID || 'your-upi-id@bank';

function CopyField({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2">
      <code className="font-mono text-sm flex-1 break-all">{value}</code>
      <CopyButton value={value} toastMessage={`Copied ${label}`} className="h-7 w-7 shrink-0" />
    </div>
  );
}

export function SupportOptions() {
  const [showPaypalInput, setShowPaypalInput] = useState(false);
  const [amount, setAmount] = useState<string>('10');

  const cleanPaypalLink = PAYPAL_LINK.endsWith('/') ? PAYPAL_LINK.slice(0, -1) : PAYPAL_LINK;
  const numericAmount = Number(amount);
  const isValidAmount = amount !== '' && !isNaN(numericAmount) && numericAmount > 0;
  const paypalUrl = `${cleanPaypalLink}/${isValidAmount ? amount : '10'}`;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 mb-1">
            <Wallet className="h-4.5 w-4.5" />
          </div>
          <CardTitle className="text-base">PayPal</CardTitle>
          <CardDescription>One-off or recurring, worldwide.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {!showPaypalInput ? (
            <Button onClick={() => setShowPaypalInput(true)} className="w-full gap-2">
              Donate via PayPal
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          ) : (
            <div className="space-y-3 animate-in fade-in duration-200">
              <div className="space-y-1.5">
                <label htmlFor="paypal-amount" className="text-xs font-semibold text-muted-foreground">
                  Amount (USD)
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground select-none">
                      $
                    </span>
                    <Input
                      id="paypal-amount"
                      type="number"
                      min="1"
                      step="any"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="pl-7 h-9 text-sm"
                      placeholder="10"
                    />
                  </div>
                  <Button
                    onClick={() => {
                      if (isValidAmount) {
                        window.open(paypalUrl, '_blank', 'noopener,noreferrer');
                      }
                    }}
                    disabled={!isValidAmount}
                    className="gap-1.5 h-9 shrink-0"
                  >
                    Pay
                    <ExternalLink className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <button
                  onClick={() => setShowPaypalInput(false)}
                  className="text-xs text-muted-foreground hover:text-foreground hover:underline transition-colors"
                >
                  Cancel
                </button>
                {!isValidAmount && amount !== '' && (
                  <span className="text-[10px] text-destructive font-medium">
                    Please enter a valid amount
                  </span>
                )}
              </div>
            </div>
          )}
          <p className="text-[11px] text-muted-foreground">
            Placeholder link — swap in the real PayPal.me handle before going live.
          </p>
        </CardContent>
      </Card>

      <Card className="shadow-sm hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400 mb-1">
            <Smartphone className="h-4.5 w-4.5" />
          </div>
          <CardTitle className="text-base">UPI</CardTitle>
          <CardDescription>For India — pay via any UPI app.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <CopyField value={UPI_ID} label="UPI ID" />
          <p className="text-[11px] text-muted-foreground">
            Placeholder UPI ID — swap in the real one before going live.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
