import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes } from 'react';

type Variant = 'default' | 'outline' | 'ghost';

export function Button({ className, variant = 'default', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      className={cn(
        'rounded-md px-4 py-2 text-sm font-medium transition disabled:opacity-60',
        variant === 'default' && 'bg-primary text-white hover:opacity-90',
        variant === 'outline' && 'border border-slate-300 bg-white text-slate-700 hover:bg-slate-50',
        variant === 'ghost' && 'bg-transparent text-slate-700 hover:bg-slate-100',
        className
      )}
      {...props}
    />
  );
}
