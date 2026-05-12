'use client'

import * as React from 'react'
import { Target, Check, X, Loader2, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { TopBar } from '@/components/navigation/top-bar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
  card: { periodLabel: string; employee?: { nameEn: string } }
  createdBy: { nameEn: string }
  assignedTo: { nameEn: string } | null
  department: { nameEn: string } | null
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
    <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 leading-snug">{goal.titleEn}</p>
          <p className="text-xs text-slate-400 mt-0.5">{goal.titleAr}</p>
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
          {goal.selfRating !== null && <span>Self Rating: <span className="font-semibold text-blue-600">{goal.selfRating}/5</span></span>}
          {goal.managerRating !== null && <span>Manager Rating: <span className="font-semibold text-violet-600">{goal.managerRating}/5</span></span>}
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
        <div className="flex items-center gap-2 mb-5">
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
        {loading ? (
          <div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Target className="h-8 w-8" />} title="No goals found" description={filter === 'ALL' ? 'Goals will appear here once performance cards are created.' : `No goals with status "${filter.toLowerCase().replace('_', ' ')}".`} />
        ) : (
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {filtered.map(goal => (
              <GoalCard key={goal.id} goal={goal} canApprove={isManager} onApprove={handleApprove} onReject={handleReject} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
