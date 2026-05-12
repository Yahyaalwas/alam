import * as React from 'react'
import { cn } from '@/lib/utils'

export interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'outline' | 'secondary'
  children: React.ReactNode
  className?: string
}

const variantClasses: Record<NonNullable<BadgeProps['variant']>, string> = {
  default:
    'bg-blue-100 text-blue-700 border-blue-200',
  secondary:
    'bg-slate-100 text-slate-600 border-slate-200',
  success:
    'bg-green-50 text-green-700 border-green-200',
  warning:
    'bg-amber-50 text-amber-700 border-amber-200',
  danger:
    'bg-red-50 text-red-700 border-red-200',
  info:
    'bg-sky-50 text-sky-700 border-sky-200',
  outline:
    'bg-transparent text-slate-600 border-slate-300',
}

export function Badge({ variant = 'default', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
        variantClasses[variant],
        className,
      )}
    >
      {children}
    </span>
  )
}
