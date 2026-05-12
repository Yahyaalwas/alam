'use client'

import * as React from 'react'
import { Bell, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface TopBarProps {
  title: string
  subtitle?: string
  breadcrumbs?: { label: string; href?: string }[]
  className?: string
}

export function TopBar({ title, subtitle, breadcrumbs, className }: TopBarProps) {
  return (
    <header
      className={cn(
        'flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6',
        className,
      )}
    >
      {/* Left: breadcrumb + title */}
      <div className="flex flex-col justify-center gap-0.5 min-w-0">
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center gap-1 text-xs text-slate-400">
              {breadcrumbs.map((crumb, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <ChevronRight className="h-3 w-3 shrink-0" aria-hidden="true" />}
                  <li>
                    {crumb.href ? (
                      <a
                        href={crumb.href}
                        className="hover:text-slate-600 transition-colors"
                      >
                        {crumb.label}
                      </a>
                    ) : (
                      <span className="text-slate-500">{crumb.label}</span>
                    )}
                  </li>
                </React.Fragment>
              ))}
            </ol>
          </nav>
        )}
        <div className="flex items-baseline gap-2 min-w-0">
          <h1 className="truncate text-base font-semibold text-slate-900">{title}</h1>
          {subtitle && (
            <span className="truncate text-sm text-slate-400">{subtitle}</span>
          )}
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex shrink-0 items-center gap-2 ml-4">
        <button
          className="relative rounded-md p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          {/* Notification dot */}
          <span
            className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-blue-600 ring-2 ring-white"
            aria-hidden="true"
          />
        </button>
      </div>
    </header>
  )
}
