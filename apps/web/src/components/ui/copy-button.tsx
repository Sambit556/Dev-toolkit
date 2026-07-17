'use client';

import * as React from 'react';
import { Check, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Button, type ButtonProps } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn, copyToClipboard } from '@/lib/utils';

export interface CopyButtonProps extends Omit<ButtonProps, 'onClick' | 'children'> {
  /** Text to copy. Ignored if `action` is provided. */
  value?: string;
  /** Custom copy action (e.g. when the parent owns the clipboard write). Overrides `value`. */
  action?: () => void | Promise<void>;
  /** Optional label shown next to the icon (button becomes icon+text instead of icon-only). */
  label?: string;
  /** Label shown in place of `label` while in the "copied" state. */
  copiedLabel?: string;
  /** Tooltip text. Omit to render without a tooltip wrapper. */
  tooltip?: string;
  /** Set to `false` to suppress the success toast. */
  toastMessage?: string | false;
  /** Extra classes for the icon itself. */
  iconClassName?: string;
  /** How long the "copied" state stays visible, in ms. */
  successDuration?: number;
}

const CopyButton = React.forwardRef<HTMLButtonElement, CopyButtonProps>(
  (
    {
      value,
      action,
      label,
      copiedLabel = 'Copied!',
      tooltip,
      toastMessage = 'Copied to clipboard!',
      iconClassName,
      successDuration = 1800,
      className,
      variant = 'ghost',
      size,
      disabled,
      ...props
    },
    ref,
  ) => {
    const [copied, setCopied] = React.useState(false);
    const timeoutRef = React.useRef<ReturnType<typeof setTimeout>>();

    React.useEffect(() => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    }, []);

    const handleClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
      // Copy buttons are frequently nested inside a larger clickable row/card;
      // a copy click should never also trigger that ancestor's onClick.
      e.stopPropagation();
      try {
        if (action) {
          await action();
        } else if (value) {
          await copyToClipboard(value);
        } else {
          return;
        }
      } catch {
        toast.error('Failed to copy');
        return;
      }

      if (toastMessage) toast.success(toastMessage);
      setCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), successDuration);
    };

    const resolvedSize = size ?? (label ? 'sm' : 'icon-sm');

    const button = (
      <Button
        ref={ref}
        type="button"
        variant={variant}
        size={resolvedSize}
        onClick={handleClick}
        disabled={disabled}
        aria-label={tooltip ?? label ?? 'Copy'}
        className={cn(
          'gap-1.5 transition-colors duration-300',
          label && 'text-xs font-medium',
          copied &&
            'border-emerald-500/60 text-emerald-600 hover:text-emerald-600 dark:text-emerald-400 dark:hover:text-emerald-400',
          className,
        )}
        {...props}
      >
        <span className="relative inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center">
          <Copy
            className={cn(
              'absolute h-3.5 w-3.5 transition-all duration-200 ease-out',
              copied ? 'scale-50 opacity-0' : 'scale-100 opacity-100',
              iconClassName,
            )}
          />
          <Check
            className={cn(
              'absolute h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400',
              copied ? 'animate-check-pop opacity-100' : 'scale-50 opacity-0',
              iconClassName,
            )}
          />
        </span>
        {label && <span>{copied ? copiedLabel : label}</span>}
      </Button>
    );

    if (!tooltip) return button;

    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="bottom">{copied ? copiedLabel : tooltip}</TooltipContent>
      </Tooltip>
    );
  },
);
CopyButton.displayName = 'CopyButton';

export { CopyButton };
