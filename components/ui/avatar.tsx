import * as React from 'react'
import { cn } from '@/lib/utils'

export interface AvatarProps {
  name: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

// Deterministic colour derived from the name string so the same name always
// produces the same colour across server and client renders.
const PALETTE = [
  ['bg-blue-100 text-blue-700', 'ring-blue-200'],
  ['bg-violet-100 text-violet-700', 'ring-violet-200'],
  ['bg-emerald-100 text-emerald-700', 'ring-emerald-200'],
  ['bg-amber-100 text-amber-700', 'ring-amber-200'],
  ['bg-rose-100 text-rose-700', 'ring-rose-200'],
  ['bg-sky-100 text-sky-700', 'ring-sky-200'],
  ['bg-teal-100 text-teal-700', 'ring-teal-200'],
  ['bg-orange-100 text-orange-700', 'ring-orange-200'],
]

function colourIndex(name: string): number {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash)
  }
  return Math.abs(hash) % PALETTE.length
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase()
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase()
}

const sizeClasses: Record<NonNullable<AvatarProps['size']>, string> = {
  sm: 'h-7 w-7 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-11 w-11 text-base',
}

export function Avatar({ name, size = 'md', className }: AvatarProps) {
  const idx = colourIndex(name)
  const [colourClasses] = PALETTE[idx]

  return (
    <span
      className={cn(
        'inline-flex shrink-0 select-none items-center justify-center rounded-full font-semibold',
        colourClasses,
        sizeClasses[size],
        className,
      )}
      aria-label={name}
      title={name}
    >
      {initials(name)}
    </span>
  )
}
