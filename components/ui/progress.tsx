import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ProgressProps {
  value: number
  size?: 'sm' | 'md'
  color?: 'blue' | 'green' | 'amber' | 'red'
  showLabel?: boolean
  className?: string
}

const trackSizes: Record<NonNullable<ProgressProps['size']>, string> = {
  sm: 'h-1.5',
  md: 'h-2.5',
}

const fillColors: Record<NonNullable<ProgressProps['color']>, string> = {
  blue: 'bg-blue-600',
  green: 'bg-green-600',
  amber: 'bg-amber-500',
  red: 'bg-red-600',
}

export function Progress({
  value,
  size = 'md',
  color = 'blue',
  showLabel = false,
  className,
}: ProgressProps) {
  const clamped = Math.min(100, Math.max(0, value))

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div
        className={cn('flex-1 overflow-hidden rounded-full bg-slate-100', trackSizes[size])}
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className={cn('h-full rounded-full transition-all duration-500', fillColors[color])}
          style={{ width: `${clamped}%` }}
        />
      </div>
      {showLabel && (
        <span className="w-10 shrink-0 text-right text-xs font-medium text-slate-500">
          {clamped}%
        </span>
      )}
    </div>
  )
}
