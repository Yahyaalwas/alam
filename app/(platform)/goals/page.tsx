'use client'

import * as React from 'react'
import {
  Target, Check, X, Loader2, Clock, CheckCircle2, XCircle,
  Plus, ChevronDown,
} from 'lucide-react'
import { TopBar } from '@/components/navigation/top-bar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'
import type { GoalStatus, GoalType } from '@/types'

interface GoalRow {
  id: string
  cardId: string
  type: GoalType
  titleEn: string
  titleAr: string
  weight: number
  goalStatus: GoalStatus
  selfRating: number | null
  managerRating: number | null
  finalRating: number | null
  approvedByManager: boolean
  card: { id: string; periodLabel: string; status: string; employee?: { id: string; nameEn: string } }
  createdBy: { nameEn: string }
  assignedTo: { nameEn: string } | null
  department: { nameEn: string } | null
}

interface TeamMember {
  id: string
  nameEn: string
  role: string
}

interface PerfCard {
  id: string
  employeeId: string
  periodLabel: string
  status: string
  employee: { id: string; nameEn: string }
}

const STATUS_MAP: Record<GoalStatus, { label: string; variant: 'warning' | 'success' | 'danger'; icon: React.ReactNode }> = {
  PENDING_APPROVAL: { label: 'Pending Approval', variant: 'warning', icon: <Clock className="h-3.5 w-3.5" /> },
  APPROVED: { label: 'Approved', variant: 'success', icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  REJECTED: { label: 'Rejected', variant: 'danger', icon: <XCircle className="h-3.5 w-3.5" /> },
}

const TYPE_MAP: Record<GoalType, { label: string; variant: 'default' | 'secondary' }> = {
  DEPARTMENT: { label: 'Department KPI', variant: 'default' },
  PERSONAL: { label: 'Personal', variant: 'secondary' },
}

function CreateGoalModal({
  onClose,
  onCreated,
  role,
}: {
  onClose: () => void
  onCreated: () => void
  role: string
}) {
  const [employees, setEmployees] = React.useState<TeamMember[]>([])
  const [cards, setCards] = React.useState<PerfCard[]>([])
  const [employeeId, setEmployeeId] = React.useState('')
  const [cardId, setCardId] = React.useState('')
  const [titleEn, setTitleEn] = React.useState('')
  const [titleAr, setTitleAr] = React.useState('')
  const [descriptionEn, setDescriptionEn] = React.useState('')
  const [type, setType] = React.useState<GoalType>('DEPARTMENT')
  const [weight, setWeight] = React.useState('')
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')

  React.useEffect(() => {
    Promise.all([
      fetch('/api/users').then(r => r.ok ? r.json() : []),
      fetch('/api/performance-cards').then(r => r.ok ? r.json() : []),
    ]).then(([users, c]) => {
      setEmployees((users as TeamMember[]).filter(u => u.role === 'EMPLOYEE'))
      setCards(c)
    })
  }, [])

  const employeeCards = cards.filter(c => c.employeeId === employeeId && c.status === 'GOAL_SETTING')

  React.useEffect(() => {
    if (employeeCards.length === 1) setCardId(employeeCards[0].id)
    else setCardId('')
  }, [employeeId]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const w = parseFloat(weight)
    if (!cardId) { setError('Please select an employee with an active Goal Setting card.'); return }
    if (!titleEn.trim() || !titleAr.trim()) { setError('Title in both languages is required.'); return }
    if (isNaN(w) || w <= 0 || w > 100) { setError('Weight must be between 1 and 100.'); return }
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/goals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardId,
          type,
          titleEn: titleEn.trim(),
          titleAr: titleAr.trim(),
          descriptionEn: descriptionEn.trim() || undefined,
          weight: w,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to create goal'); setLoading(false); return }
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
      <div className="w-full max-w-lg rounded-xl bg-white shadow-2xl max-h-[92vh] flex flex-col">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <h2 className="text-base font-semibold text-slate-900">Create Goal / KPI</h2>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
            )}

            {/* Employee selector */}
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

            {/* Card selector */}
            {employeeId && (
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700">Performance Card</label>
                {employeeCards.length === 0 ? (
                  <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                    No active Goal Setting card found for this employee.
                  </p>
                ) : (
                  <div className="relative">
                    <select
                      value={cardId}
                      onChange={e => setCardId(e.target.value)}
                      className="w-full appearance-none rounded-md border border-slate-200 bg-white px-3 py-2 pr-8 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      {employeeCards.map(c => (
                        <option key={c.id} value={c.id}>{c.periodLabel}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  </div>
                )}
              </div>
            )}

            {/* Goal type */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-slate-700">Goal Type</label>
              <div className="flex gap-2">
                {(['DEPARTMENT', 'PERSONAL'] as GoalType[]).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`flex-1 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                      type === t
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {t === 'DEPARTMENT' ? 'Department KPI' : 'Personal Goal'}
                  </button>
                ))}
              </div>
            </div>

            {/* Titles */}
            <div className="grid grid-cols-2 gap-3">
              <Input label="Title (English)" placeholder="Improve Customer NPS" value={titleEn} onChange={e => setTitleEn(e.target.value)} required />
              <Input label="Title (Arabic)" placeholder="تحسين رضا العملاء" value={titleAr} onChange={e => setTitleAr(e.target.value)} required dir="rtl" />
            </div>

            <Input
              label="Description (English)"
              placeholder="Optional context or success criteria…"
              value={descriptionEn}
              onChange={e => setDescriptionEn(e.target.value)}
            />

            <div className="w-40">
              <Input
                label="Weight (%)"
                type="number"
                min="1"
                max="100"
                step="0.5"
                placeholder="e.g. 25"
                value={weight}
                onChange={e => setWeight(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="shrink-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading} icon={<Plus className="h-4 w-4" />}>Create Goal</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function GoalCard({ goal, onApprove, onReject, canApprove }: {
  goal: GoalRow
  onApprove?: (id: string) => Promise<void>
  onReject?: (id: string) => Promise<void>
  canApprove: boolean
}) {
  const [loading, setLoading] = React.useState<'approve' | 'reject' | null>(null)
  const status = STATUS_MAP[goal.goalStatus]
  const type = TYPE_MAP[goal.type]

  async function handle(action: 'approve' | 'reject') {
    setLoading(action)
    try {
      if (action === 'approve') await onApprove?.(goal.id)
      else await onReject?.(goal.id)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 leading-snug">{goal.titleEn}</p>
          <p className="text-xs text-slate-400 mt-0.5" dir="rtl">{goal.titleAr}</p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
          <Badge variant={type.variant}>{type.label}</Badge>
          <Badge variant={status.variant}>
            <span className="flex items-center gap-1">{status.icon}{status.label}</span>
          </Badge>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
        <span>Weight: <span className="font-medium text-slate-700">{goal.weight}%</span></span>
        {goal.card?.employee && <span>Employee: <span className="font-medium text-slate-700">{goal.card.employee.nameEn}</span></span>}
        <span>Period: <span className="font-medium text-slate-700">{goal.card.periodLabel}</span></span>
        {goal.department && <span>Dept: <span className="font-medium text-slate-700">{goal.department.nameEn}</span></span>}
      </div>
      {(goal.selfRating !== null || goal.managerRating !== null) && (
        <div className="flex items-center gap-4 text-xs border-t border-slate-100 pt-3">
          {goal.selfRating !== null && <span>Self: <span className="font-semibold text-blue-600">{goal.selfRating}/5</span></span>}
          {goal.managerRating !== null && <span>Manager: <span className="font-semibold text-violet-600">{goal.managerRating}/5</span></span>}
          {goal.finalRating !== null && <span>Final: <span className="font-semibold text-green-600">{goal.finalRating}/5</span></span>}
        </div>
      )}
      {canApprove && goal.goalStatus === 'PENDING_APPROVAL' && (
        <div className="flex items-center gap-2 border-t border-slate-100 pt-3">
          <Button size="sm" variant="outline" icon={loading === 'approve' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} loading={loading === 'approve'} onClick={() => handle('approve')} className="text-green-700 border-green-200 hover:bg-green-50">Approve</Button>
          <Button size="sm" variant="outline" icon={loading === 'reject' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <X className="h-3.5 w-3.5" />} loading={loading === 'reject'} onClick={() => handle('reject')} className="text-red-700 border-red-200 hover:bg-red-50">Reject</Button>
        </div>
      )}
    </div>
  )
}

export default function GoalsPage() {
  const [goals, setGoals] = React.useState<GoalRow[]>([])
  const [loading, setLoading] = React.useState(true)
  const [role, setRole] = React.useState<string>('')
  const [filter, setFilter] = React.useState<GoalStatus | 'ALL'>('ALL')
  const [showCreateModal, setShowCreateModal] = React.useState(false)

  async function load() {
    setLoading(true)
    try {
      const [goalsRes, meRes] = await Promise.all([fetch('/api/goals'), fetch('/api/auth/me')])
      if (goalsRes.ok) setGoals(await goalsRes.json())
      if (meRes.ok) { const me = await meRes.json(); setRole(me.role) }
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => { load() }, [])

  async function handleApprove(id: string) {
    await fetch(`/api/goals/${id}/approve`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'approve' }) })
    await load()
  }

  async function handleReject(id: string) {
    await fetch(`/api/goals/${id}/approve`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'reject' }) })
    await load()
  }

  const isManager = role === 'DEPARTMENT_MANAGER' || role === 'SUPER_ADMIN' || role === 'ADMIN'
  const pendingCount = goals.filter(g => g.goalStatus === 'PENDING_APPROVAL').length
  const filtered = filter === 'ALL' ? goals : goals.filter(g => g.goalStatus === filter)

  return (
    <div className="flex flex-col min-h-full">
      <TopBar
        title="Goals & KPIs"
        subtitle={`${goals.length} goal${goals.length !== 1 ? 's' : ''}${pendingCount > 0 ? ` · ${pendingCount} pending approval` : ''}`}
        breadcrumbs={[{ label: 'Performance' }, { label: 'Goals & KPIs' }]}
      />
      <div className="flex-1 p-6">
        <div className="flex flex-wrap items-center gap-2 mb-5">
          <div className="flex items-center gap-1.5">
            {(['ALL', 'PENDING_APPROVAL', 'APPROVED', 'REJECTED'] as const).map(s => (
              <button key={s} onClick={() => setFilter(s)} className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                filter === s ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}>
                {s === 'ALL' ? 'All' : s === 'PENDING_APPROVAL' ? 'Pending' : s === 'APPROVED' ? 'Approved' : 'Rejected'}
                {s === 'PENDING_APPROVAL' && pendingCount > 0 && (
                  <span className="ml-1.5 rounded-full bg-amber-500 text-white px-1.5 text-[10px]">{pendingCount}</span>
                )}
              </button>
            ))}
          </div>
          {isManager && (
            <div className="ml-auto">
              <Button
                icon={<Plus className="h-4 w-4" />}
                onClick={() => setShowCreateModal(true)}
              >
                Create Goal
              </Button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Target className="h-8 w-8" />}
            title="No goals found"
            description={filter === 'ALL' ? 'Goals will appear here once performance cards are created.' : `No goals with status "${filter.toLowerCase().replace('_', ' ')}".`}
            action={isManager && filter === 'ALL' ? (
              <Button icon={<Plus className="h-4 w-4" />} onClick={() => setShowCreateModal(true)}>Create First Goal</Button>
            ) : undefined}
          />
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {filtered.map(goal => (
              <GoalCard key={goal.id} goal={goal} canApprove={isManager} onApprove={handleApprove} onReject={handleReject} />
            ))}
          </div>
        )}
      </div>

      {showCreateModal && (
        <CreateGoalModal
          role={role}
          onClose={() => setShowCreateModal(false)}
          onCreated={load}
        />
      )}
    </div>
  )
}
