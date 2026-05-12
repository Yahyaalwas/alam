'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff, Lock, Mail, AlertCircle, ShieldCheck } from 'lucide-react'
import type { Role } from '@/types'

function dashboardHref(role: Role): string {
  switch (role) {
    case 'SUPER_ADMIN':
    case 'ADMIN':
      return '/dashboard/admin'
    case 'DEPARTMENT_MANAGER':
      return '/dashboard/manager'
    case 'EMPLOYEE':
    default:
      return '/dashboard/employee'
  }
}

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [showPassword, setShowPassword] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    if (!email.trim() || !password) {
      setError('Please enter your email address and password.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError(body?.error ?? 'Invalid email or password. Please try again.')
        return
      }

      const data = await res.json()
      const role: Role = data?.role ?? 'EMPLOYEE'
      router.push(dashboardHref(role))
    } catch {
      setError('Unable to connect to the server. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* ── Left panel — branding ── */}
      <div
        className="hidden lg:flex lg:w-[480px] lg:shrink-0 flex-col justify-between p-10"
        style={{ backgroundColor: '#0f172a' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-base font-bold text-white shadow-lg">
            A
          </div>
          <div>
            <div className="text-base font-bold tracking-wide text-white">ALAMAH</div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              Performance Management
            </div>
          </div>
        </div>

        {/* Hero text */}
        <div className="space-y-6">
          <div className="space-y-3">
            <h2 className="text-3xl font-bold leading-tight text-white">
              Enterprise Performance Management
            </h2>
            <p className="text-base leading-relaxed text-slate-400">
              A unified platform for goal-setting, evaluations, and calibration across your entire organisation.
            </p>
          </div>

          {/* Feature bullets */}
          <ul className="space-y-3">
            {[
              'Structured goal-setting and KPI tracking',
              '360-degree performance evaluations',
              'Calibration meeting workflows',
              'Real-time analytics and reporting',
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" aria-hidden="true" />
                <span className="text-sm text-slate-300">{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <p className="text-xs text-slate-600">
          &copy; {new Date().getFullYear()} ALAMAH. All rights reserved.
        </p>
      </div>

      {/* ── Right panel — form ── */}
      <div className="flex flex-1 flex-col items-center justify-center bg-slate-50 px-6 py-12">
        {/* Mobile logo */}
        <div className="mb-8 flex items-center gap-2.5 lg:hidden">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
            A
          </div>
          <span className="text-base font-bold text-slate-900">ALAMAH PMS</span>
        </div>

        <div className="w-full max-w-[400px] space-y-8">
          {/* Heading */}
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Sign in to your account</h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Enter your work credentials to access the platform.
            </p>
          </div>

          {/* Error banner */}
          {error && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                Work email
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Mail className="h-4 w-4" aria-hidden="true" />
                </span>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  className="h-10 w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors hover:border-slate-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock className="h-4 w-4" aria-hidden="true" />
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="h-10 w-full rounded-md border border-slate-200 bg-white pl-9 pr-10 text-sm text-slate-900 placeholder:text-slate-400 transition-colors hover:border-slate-300 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-0"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus-visible:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="relative flex h-10 w-full items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Help text */}
          <p className="text-center text-xs text-slate-400">
            Contact your system administrator if you have trouble signing in.
          </p>
        </div>
      </div>
    </div>
  )
}
