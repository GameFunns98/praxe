import { cn } from '@/lib/utils';
import { ButtonHTMLAttributes } from 'react';

export function Button({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button className={cn('rounded-md bg-primary px-4 py-2 text-white disabled:opacity-60', className)} {...props} />;
}
