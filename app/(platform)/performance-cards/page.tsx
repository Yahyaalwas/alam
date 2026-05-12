'use client'

import * as React from 'react'
import {
  ClipboardList, Plus, Loader2, ChevronDown, X,
} from 'lucide-react'
import { TopBar } from '@/components/navigation/top-bar'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'
import type { CardStatus } from '@/types'

interface CardRow {
  id: string
  periodLabel: string
  status: CardStatus
  finalScore: number | null
  employee: { id: string; nameEn: string }
  manager: { nameEn: string }
  department: { nameEn: string; code: string }
}

interface Employee {
  id: string
  nameEn: string
  role: string
}

const STATUS_META: Record<CardStatus, { label: string; variant: 'default' | 'success' | 'warning' | 'secondary' | 'info' }> = {
  GOAL_SETTING: { label: 'Goal Setting', variant: 'secondary' },
  SELF_REVIEW: { label: 'Self Review', variant: 'default' },
  MANAGER_REVIEW: { label: 'Manager Review', variant: 'warning' },
  CALIBRATION_MEETING: { label: 'Calibration', variant: 'info' },
  FINALIZED: { label: 'Finalized', variant: 'success' },
}

function CreateCardModal({ onClose, onCreated, role }: {
  onClose: () => void
  onCreated: () => void
  role: string
}) {
  const currentYear = new Date().getFullYear()
  const quarters = ['Q1', 'Q2', 'Q3', 'Q4']
  const periods = quarters.map(q => `${q} ${currentYear}`)

  const [employees, setEmployees] = React.useState<Employee[]>([])
  const [employeeId, setEmployeeId] = React.useState('')
  const [period, setPeriod] = React.useState(periods[0])
  const [useCustom, setUseCustom] = React.useState(false)
  const [custom, setCustom] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')

  React.useEffect(() => {
    fetch('/api/users').then(r => r.ok ? r.json() : []).then((users: Employee[]) => {
      setEmployees(users.filter(u => u.role === 'EMPLOYEE'))
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!employeeId) { setError('Please select an employee.'); return }
    const periodLabel = useCustom ? custom.trim() : period
    if (!periodLabel) { setError('Period label is required.'); return }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/performance-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId, periodLabel }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to create card'); setLoading(false); return }
      onCreated()
      onClose()
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Create Performance Card</h2>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Employee</label>
            <div className="relative">
              <select
                value={employeeId}
                onChange={e => setEmployeeId(e.target.value)}
                className="w-full appearance-none rounded-md border border-slate-200 bg-white px-3 py-2 pr-8 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                required
              >
                <option value="">— Select employee —</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.nameEn}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Evaluation Period</label>
            <div className="grid grid-cols-2 gap-2">
              {periods.map(p => (
                <button key={p} type="button" onClick={() => { setPeriod(p); setUseCustom(false) }}
                  className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                    !useCustom && period === p
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >{p}</button>
              ))}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setUseCustom(true)}
                className={`shrink-0 rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                  useCustom ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >Custom</button>
              {useCustom && (
                <input autoFocus type="text" placeholder="e.g. H1 2025 or Annual 2025" value={custom} onChange={e => setCustom(e.target.value)}
                  className="flex-1 rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading} icon={<Plus className="h-4 w-4" />}>Create Card</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function PerformanceCardsPage() {
  const [cards, setCards] = React.useState<CardRow[]>([])
  const [role, setRole] = React.useState('')
  const [loading, setLoading] = React.useState(true)
  const [showModal, setShowModal] = React.useState(false)

  async function load() {
    setLoading(true)
    try {
      const [cardsRes, meRes] = await Promise.all([
        fetch('/api/performance-cards'),
        fetch('/api/auth/me'),
      ])
      if (cardsRes.ok) setCards(await cardsRes.json())
      if (meRes.ok) { const me = await meRes.json(); setRole(me.role) }
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => { load() }, [])

  const canCreate = role === 'SUPER_ADMIN' || role === 'ADMIN' || role === 'DEPARTMENT_MANAGER'

  return (
    <div className="flex flex-col min-h-full">
      <TopBar
        title="Performance Cards"
        subtitle={`${cards.length} evaluation${cards.length !== 1 ? 's' : ''}`}
        breadcrumbs={[{ label: 'Performance' }, { label: 'Cards' }]}
      />

      <div className="flex-1 p-6">
        {canCreate && (
          <div className="mb-5 flex items-center justify-end">
            <Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowModal(true)}>
              Create Card
            </Button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : cards.length === 0 ? (
          <Card>
            <CardContent className="py-16">
              <EmptyState
                icon={<ClipboardList className="h-8 w-8" />}
                title="No performance cards yet"
                description="Performance cards will appear here once they are created."
                action={canCreate ? <Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowModal(true)}>Create First Card</Button> : undefined}
              />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>All Performance Cards</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80">
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Employee</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Period</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Department</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Manager</th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cards.map((card) => {
                      const meta = STATUS_META[card.status]
                      return (
                        <tr key={card.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-3">
                              <Avatar name={card.employee.nameEn} size="sm" />
                              <p className="font-medium text-slate-900">{card.employee.nameEn}</p>
                            </div>
                          </td>
                          <td className="px-6 py-3.5 text-slate-600">{card.periodLabel}</td>
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-1">
                              <span className="text-slate-700">{card.department.nameEn}</span>
                              <span className="text-xs text-slate-400">({card.department.code})</span>
                            </div>
                          </td>
                          <td className="px-6 py-3.5 text-slate-600">{card.manager.nameEn}</td>
                          <td className="px-6 py-3.5">
                            <Badge variant={meta.variant}>{meta.label}</Badge>
                          </td>
                          <td className="px-6 py-3.5 text-right">
                            {card.finalScore !== null ? (
                              <span className="font-semibold text-slate-800">{card.finalScore.toFixed(1)}</span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {showModal && (
        <CreateCardModal role={role} onClose={() => setShowModal(false)} onCreated={load} />
      )}
    </div>
  )
}
