'use client';

import React, { useState } from 'react';
import { Check, Copy, ExternalLink, Wallet, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { copyToClipboard } from '@/lib/utils';

// Public-facing payment details, configured via env (see .env.local.example) so
// they're not hardcoded in source and can be swapped per-deployment. These are
// rendered client-side for visitors to click/copy, so they're inherently public —
// not secrets, just kept out of the component file.
const PAYPAL_LINK = process.env.NEXT_PUBLIC_PAYPAL_LINK || 'https://paypal.me/YOUR_PAYPAL_HANDLE';
const UPI_ID = process.env.NEXT_PUBLIC_UPI_ID || 'your-upi-id@bank';

function CopyField({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const handle = async () => {
    await copyToClipboard(value);
    toast.success(`Copied ${label}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2">
      <code className="font-mono text-sm flex-1 break-all">{value}</code>
      <Button variant="ghost" size="icon-sm" onClick={handle} className="h-7 w-7 shrink-0">
        {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
      </Button>
    </div>
  );
}

export function SupportOptions() {
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
          <Button asChild className="w-full gap-2">
            <a href={PAYPAL_LINK} target="_blank" rel="noopener noreferrer">
              Donate via PayPal
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Button>
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
