import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, className, id: propId, children, ...props }, ref) => {
    const generatedId = React.useId()
    const id = propId ?? generatedId

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={id} className="text-sm font-medium text-slate-700">
            {label}
          </label>
        )}
        <div className="relative">
          <select
            ref={ref}
            id={id}
            {...props}
            className={cn(
              'h-9 w-full appearance-none rounded-md border bg-white px-3 py-2 pr-8 text-sm text-slate-900',
              'transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0 focus:border-blue-500',
              'disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50',
              error
                ? 'border-red-400 focus:ring-red-400'
                : 'border-slate-200 hover:border-slate-300',
              className,
            )}
          >
            {children}
          </select>
          <ChevronDown
            className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
        </div>
        {error && (
          <p className="text-xs text-red-600" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="text-xs text-slate-500">{hint}</p>
        )}
      </div>
    )
  },
)

Select.displayName = 'Select'
