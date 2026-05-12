'use client'

import * as React from 'react'
import {
  Users, UserPlus, ClipboardList, Target, TrendingUp,
  Search, Plus, Loader2, Clock, CheckCircle2, AlertCircle,
  Copy, Check, Eye, EyeOff, X, ChevronRight, BarChart3,
} from 'lucide-react'
import { TopBar } from '@/components/navigation/top-bar'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { EmptyState } from '@/components/ui/empty-state'
import { StatCard } from '@/components/ui/stat-card'
import type { CardStatus } from '@/types'

interface TeamMember {
  id: string
  nameEn: string
  nameAr: string
  email: string
  role: string
  departmentId: string | null
  managerId: string | null
  department: { id: string; nameEn: string; code: string } | null
  manager: { id: string; nameEn: string } | null
}

interface PerfCard {
  id: string
  employeeId: string
  periodLabel: string
  status: CardStatus
  finalScore: number | null
  _count?: { goals: number; competencies: number }
}

const STATUS_META: Record<CardStatus, { label: string; variant: 'default' | 'success' | 'warning' | 'secondary' | 'info'; icon: React.ReactNode }> = {
  GOAL_SETTING: { label: 'Goal Setting', variant: 'secondary', icon: <Target className="h-3 w-3" /> },
  SELF_REVIEW: { label: 'Self Review', variant: 'default', icon: <ClipboardList className="h-3 w-3" /> },
  MANAGER_REVIEW: { label: 'Manager Review', variant: 'warning', icon: <Clock className="h-3 w-3" /> },
  CALIBRATION_MEETING: { label: 'Calibration', variant: 'info', icon: <BarChart3 className="h-3 w-3" /> },
  FINALIZED: { label: 'Finalized', variant: 'success', icon: <CheckCircle2 className="h-3 w-3" /> },
}

function generatePassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$'
  let pw = ''
  for (let i = 0; i < 12; i++) pw += chars[Math.floor(Math.random() * chars.length)]
  return pw
}

function AddMemberModal({
  onClose,
  onCreated,
  managerDeptId,
  managerId,
}: {
  onClose: () => void
  onCreated: () => void
  managerDeptId: string | null
  managerId: string
}) {
  const [nameEn, setNameEn] = React.useState('')
  const [nameAr, setNameAr] = React.useState('')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState(() => generatePassword())
  const [showPw, setShowPw] = React.useState(false)
  const [copied, setCopied] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')
  const [success, setSuccess] = React.useState<{ nameEn: string; email: string; password: string } | null>(null)

  function copyPassword() {
    navigator.clipboard.writeText(password)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nameEn: nameEn.trim(),
          nameAr: nameAr.trim(),
          email: email.trim().toLowerCase(),
          role: 'EMPLOYEE',
          departmentId: managerDeptId,
          managerId,
          password,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? 'Failed to create team member'); setLoading(false); return }
      setSuccess({ nameEn, email, password })
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
        <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
          <div className="px-6 py-5 border-b border-slate-100">
            <h2 className="text-base font-semibold text-slate-900">Team Member Added</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="rounded-lg bg-green-50 border border-green-200 p-4">
              <p className="text-sm font-medium text-green-800">{success.nameEn} has been added to your team.</p>
            </div>
            <p className="text-sm text-slate-500">Share these one-time credentials. The password won't be shown again.</p>
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Email</p>
              <p className="rounded-md bg-slate-50 border border-slate-200 px-3 py-2 text-sm font-mono text-slate-800">{success.email}</p>
            </div>
            <div className="space-y-1.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Temporary Password</p>
              <div className="flex items-center gap-2">
                <p className="flex-1 rounded-md bg-amber-50 border border-amber-200 px-3 py-2 text-sm font-mono">
                  {showPw ? success.password : '••••••••••••'}
                </p>
                <button type="button" onClick={() => setShowPw(s => !s)} className="p-2 text-slate-400 hover:text-slate-600">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => { navigator.clipboard.writeText(success.password); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                  className="p-2 text-slate-400 hover:text-slate-600"
                >
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                </button>
              </div>
            </div>
          </div>
          <div className="px-6 py-4 border-t border-slate-100">
            <Button className="w-full" onClick={() => { onCreated(); onClose() }}>Done</Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
      <div className="w-full max-w-md rounded-xl bg-white shadow-2xl">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">Add Team Member</h2>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Input label="Full Name (English)" placeholder="Ahmed Al-Rashidi" value={nameEn} onChange={e => setNameEn(e.target.value)} required />
            <Input label="Full Name (Arabic)" placeholder="أحمد الراشدي" value={nameAr} onChange={e => setNameAr(e.target.value)} required dir="rtl" />
          </div>
          <Input label="Work Email" type="email" placeholder="employee@company.com" value={email} onChange={e => setEmail(e.target.value)} required />
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-slate-700">Temporary Password</label>
            <div className="flex items-center gap-2">
              <div className="flex flex-1 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                <span className="flex-1 text-sm font-mono text-slate-800">{showPw ? password : '••••••••••••'}</span>
                <button type="button" onClick={() => setShowPw(s => !s)} className="text-slate-400 hover:text-slate-600">
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <button type="button" onClick={copyPassword} className="flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50">
                {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button type="button" onClick={() => setPassword(generatePassword())} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50">Regen</button>
            </div>
            <p className="text-xs text-slate-400">Auto-generated — share with the employee, they should change it on first login.</p>
          </div>
          <div className="flex items-center justify-end gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" loading={loading} icon={<UserPlus className="h-4 w-4" />}>Add Member</Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function CreateCardModal({
  member,
  onClose,
  onCreated,
}: {
  member: TeamMember
  onClose: () => void
  onCreated: () => void
}) {
  const currentYear = new Date().getFullYear()
  const quarters = ['Q1', 'Q2', 'Q3', 'Q4']
  const periods = quarters.map(q => `${q} ${currentYear}`)
  const [period, setPeriod] = React.useState(periods[0])
  const [custom, setCustom] = React.useState('')
  const [useCustom, setUseCustom] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const periodLabel = useCustom ? custom.trim() : period
      if (!periodLabel) { setError('Please enter a period label.'); setLoading(false); return }
      const res = await fetch('/api/performance-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: member.id, periodLabel }),
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
      <div className="w-full max-w-sm rounded-xl bg-white shadow-2xl">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Create Performance Card</h2>
            <p className="text-xs text-slate-400 mt-0.5">For {member.nameEn}</p>
          </div>
          <button onClick={onClose} className="rounded p-1 text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Evaluation Period</label>
            <div className="grid grid-cols-2 gap-2">
              {periods.map(p => (
                <button
                  key={p}
                  type="button"
                  onClick={() => { setPeriod(p); setUseCustom(false) }}
                  className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                    !useCustom && period === p
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setUseCustom(true)}
                className={`flex-shrink-0 rounded-md border px-3 py-2 text-xs font-medium transition-colors ${
                  useCustom ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-500 hover:bg-slate-50'
                }`}
              >
                Custom
              </button>
              {useCustom && (
                <input
                  autoFocus
                  type="text"
                  placeholder="e.g. H1 2025 or Annual 2025"
                  value={custom}
                  onChange={e => setCustom(e.target.value)}
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

function MemberCard({
  member,
  cards,
  onAction,
}: {
  member: TeamMember
  cards: PerfCard[]
  onAction: (action: 'card', member: TeamMember) => void
}) {
  const latestCard = cards[0]
  const meta = latestCard ? STATUS_META[latestCard.status] : null
  const hasActiveCard = latestCard && latestCard.status !== 'FINALIZED'
  const allScores = cards.filter(c => c.finalScore !== null).map(c => c.finalScore!)
  const avgScore = allScores.length > 0 ? allScores.reduce((a, b) => a + b, 0) / allScores.length : null

  return (
    <Card className="group hover:shadow-md transition-all duration-200">
      <div className="p-5">
        <div className="flex items-start gap-3">
          <Avatar name={member.nameEn} size="md" />
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 truncate">{member.nameEn}</p>
                <p className="text-xs text-slate-400 truncate">{member.email}</p>
              </div>
              {avgScore !== null && (
                <div className="shrink-0 flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1">
                  <TrendingUp className="h-3 w-3 text-blue-500" />
                  <span className="text-xs font-bold text-blue-700">{avgScore.toFixed(1)}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-2.5">
          {latestCard ? (
            <div className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2.5">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-3.5 w-3.5 text-slate-400" />
                <span className="text-xs text-slate-600 font-medium">{latestCard.periodLabel}</span>
              </div>
              {meta && (
                <Badge variant={meta.variant}>
                  <span className="flex items-center gap-1">{meta.icon}{meta.label}</span>
                </Badge>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2 rounded-lg border border-dashed border-slate-200 px-3 py-2.5">
              <AlertCircle className="h-3.5 w-3.5 text-amber-400" />
              <span className="text-xs text-slate-400">No evaluation card yet</span>
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-slate-400">
            <ClipboardList className="h-3.5 w-3.5" />
            <span>{cards.length} evaluation{cards.length !== 1 ? 's' : ''} total</span>
            {cards.filter(c => c.finalScore !== null).length > 0 && (
              <>
                <span className="text-slate-200">·</span>
                <span>{cards.filter(c => c.finalScore !== null).length} finalized</span>
              </>
            )}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
          {!hasActiveCard ? (
            <Button
              size="sm"
              icon={<Plus className="h-3.5 w-3.5" />}
              onClick={() => onAction('card', member)}
              className="flex-1"
            >
              Create Card
            </Button>
          ) : (
            <a
              href={`/performance-cards`}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 transition-colors"
            >
              <ClipboardList className="h-3.5 w-3.5" />
              View Card
              <ChevronRight className="h-3 w-3 ml-auto" />
            </a>
          )}
        </div>
      </div>
    </Card>
  )
}

export default function TeamsPage() {
  const [members, setMembers] = React.useState<TeamMember[]>([])
  const [cards, setCards] = React.useState<PerfCard[]>([])
  const [me, setMe] = React.useState<{ id: string; role: string; departmentId: string | null } | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState('')
  const [showAddModal, setShowAddModal] = React.useState(false)
  const [cardModal, setCardModal] = React.useState<TeamMember | null>(null)

  async function load() {
    setLoading(true)
    try {
      const [usersRes, cardsRes, meRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/performance-cards'),
        fetch('/api/auth/me'),
      ])
      if (usersRes.ok) setMembers(await usersRes.json())
      if (cardsRes.ok) setCards(await cardsRes.json())
      if (meRes.ok) {
        const data = await meRes.json()
        setMe({ id: data.id, role: data.role, departmentId: data.departmentId })
      }
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => { load() }, [])

  const employees = members.filter(m => m.role === 'EMPLOYEE')
  const filtered = search.trim()
    ? employees.filter(m =>
        m.nameEn.toLowerCase().includes(search.toLowerCase()) ||
        m.email.toLowerCase().includes(search.toLowerCase())
      )
    : employees

  const cardsForMember = (memberId: string) =>
    cards.filter(c => c.employeeId === memberId).sort((a, b) => 0)

  const activeCards = cards.filter(c => c.status !== 'FINALIZED').length
  const pendingReview = cards.filter(c => c.status === 'MANAGER_REVIEW').length
  const avgScore = (() => {
    const finalized = cards.filter(c => c.finalScore !== null)
    if (!finalized.length) return null
    return finalized.reduce((s, c) => s + c.finalScore!, 0) / finalized.length
  })()

  const managerDeptId = me?.departmentId ?? null

  function handleAction(action: 'card', member: TeamMember) {
    if (action === 'card') setCardModal(member)
  }

  return (
    <div className="flex flex-col min-h-full">
      <TopBar
        title="My Team"
        subtitle={`${employees.length} member${employees.length !== 1 ? 's' : ''}`}
        breadcrumbs={[{ label: 'Team' }, { label: 'My Team' }]}
      />

      <div className="flex-1 p-6 space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            title="Team Members"
            value={employees.length}
            icon={<Users className="h-5 w-5" />}
            color="blue"
          />
          <StatCard
            title="Active Cards"
            value={activeCards}
            icon={<ClipboardList className="h-5 w-5" />}
            color="purple"
          />
          <StatCard
            title="Pending My Review"
            value={pendingReview}
            icon={<Clock className="h-5 w-5" />}
            color={pendingReview > 0 ? 'amber' : 'green'}
          />
          <StatCard
            title="Avg Team Score"
            value={avgScore !== null ? avgScore.toFixed(1) : '—'}
            icon={<TrendingUp className="h-5 w-5" />}
            color="green"
          />
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search team members…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full rounded-md border border-slate-200 bg-white pl-9 pr-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div className="ml-auto">
            <Button
              icon={<UserPlus className="h-4 w-4" />}
              onClick={() => setShowAddModal(true)}
            >
              Add Team Member
            </Button>
          </div>
        </div>

        {/* Members Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Users className="h-8 w-8" />}
            title={search ? 'No members match your search' : 'No team members yet'}
            description={search ? 'Try a different name or email.' : 'Add your first team member to get started.'}
            action={!search ? <Button icon={<UserPlus className="h-4 w-4" />} onClick={() => setShowAddModal(true)}>Add Team Member</Button> : undefined}
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map(member => (
              <MemberCard
                key={member.id}
                member={member}
                cards={cardsForMember(member.id)}
                onAction={handleAction}
              />
            ))}
          </div>
        )}
      </div>

      {showAddModal && me && (
        <AddMemberModal
          onClose={() => setShowAddModal(false)}
          onCreated={load}
          managerDeptId={managerDeptId}
          managerId={me.id}
        />
      )}

      {cardModal && (
        <CreateCardModal
          member={cardModal}
          onClose={() => setCardModal(null)}
          onCreated={load}
        />
      )}
    </div>
  )
}
