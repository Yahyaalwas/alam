import * as React from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  trend?: { value: number; label: string }
  icon?: React.ReactNode
  color?: 'blue' | 'green' | 'amber' | 'purple'
  className?: string
}

const iconBgClasses: Record<NonNullable<StatCardProps['color']>, string> = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-green-50 text-green-600',
  amber: 'bg-amber-50 text-amber-600',
  purple: 'bg-violet-50 text-violet-600',
}

export function StatCard({
  title,
  value,
  subtitle,
  trend,
  icon,
  color = 'blue',
  className,
}: StatCardProps) {
  const isPositive = trend && trend.value >= 0

  return (
    <div
      className={cn(
        'rounded-lg border border-slate-200 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]',
        className,
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-500 truncate">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
          {subtitle && (
            <p className="mt-1 text-sm text-slate-500 truncate">{subtitle}</p>
          )}
          {trend && (
            <div className="mt-3 flex items-center gap-1">
              {isPositive ? (
                <TrendingUp className="h-4 w-4 text-green-600" aria-hidden="true" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" aria-hidden="true" />
              )}
              <span
                className={cn(
                  'text-xs font-semibold',
                  isPositive ? 'text-green-600' : 'text-red-500',
                )}
              >
                {isPositive ? '+' : ''}
                {trend.value}%
              </span>
              <span className="text-xs text-slate-400">{trend.label}</span>
            </div>
          )}
        </div>
        {icon && (
          <div
            className={cn(
              'ml-4 shrink-0 rounded-lg p-3',
              iconBgClasses[color],
            )}
            aria-hidden="true"
          >
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
