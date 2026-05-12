import * as React from 'react'
import { cn } from '@/lib/utils'

export interface SeparatorProps {
  orientation?: 'horizontal' | 'vertical'
  className?: string
}

export function Separator({ orientation = 'horizontal', className }: SeparatorProps) {
  if (orientation === 'vertical') {
    return (
      <div
        role="separator"
        aria-orientation="vertical"
        className={cn('w-px self-stretch bg-slate-200', className)}
      />
    )
  }
  return (
    <div
      role="separator"
      aria-orientation="horizontal"
      className={cn('h-px w-full bg-slate-200', className)}
    />
  )
}
