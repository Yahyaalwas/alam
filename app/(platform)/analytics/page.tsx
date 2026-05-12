'use client'

import * as React from 'react'
import { Users, Building2, ClipboardList, TrendingUp, Clock, Loader2, Star } from 'lucide-react'
import { TopBar } from '@/components/navigation/top-bar'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { StatCard } from '@/components/ui/stat-card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import type { AnalyticsOverview, ManagerAnalytics, CardStatus } from '@/types'

const STATUS_LABELS: Record<CardStatus, string> = {
  GOAL_SETTING: 'Goal Setting',
  SELF_REVIEW: 'Self Review',
  MANAGER_REVIEW: 'Manager Review',
  CALIBRATION_MEETING: 'Calibration',
  FINALIZED: 'Finalized',
}

const STATUSES: CardStatus[] = ['GOAL_SETTING', 'SELF_REVIEW', 'MANAGER_REVIEW', 'CALIBRATION_MEETING', 'FINALIZED']

function AdminAnalytics({ data }: { data: AnalyticsOverview }) {
  const total = Object.values(data.statusDistribution).reduce((s, v) => s + v, 0)
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Employees" value={data.totalEmployees} icon={<Users className="h-5 w-5" />} color="blue" />
        <StatCard title="Departments" value={data.totalDepartments} icon={<Building2 className="h-5 w-5" />} color="purple" />
        <StatCard title="Active Evaluations" value={data.totalActiveCards} icon={<ClipboardList className="h-5 w-5" />} color="amber" />
        <StatCard title="Completion Rate" value={`${Math.round(data.completionRate * 100)}%`} subtitle={`${data.totalFinalizedCards} finalized`} icon={<TrendingUp className="h-5 w-5" />} color="green" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Evaluation Pipeline</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {STATUSES.map(s => {
              const count = data.statusDistribution[s] ?? 0
              const pct = total > 0 ? Math.round((count / total) * 100) : 0
              return (
                <div key={s} className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 w-28 shrink-0">{STATUS_LABELS[s]}</span>
                  <div className="flex-1"><Progress value={pct} size="sm" color={s === 'FINALIZED' ? 'green' : s === 'MANAGER_REVIEW' ? 'amber' : 'blue'} /></div>
                  <span className="text-sm font-semibold text-slate-700 w-6 text-right">{count}</span>
                </div>
              )
            })}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Department Performance</CardTitle></CardHeader>
          <CardContent>
            {data.departmentStats.length === 0 ? <p className="text-sm text-slate-400">No department data yet.</p> : (
              <ul className="divide-y divide-slate-100">
                {[...data.departmentStats].sort((a, b) => b.averageScore - a.averageScore).map((dept, i) => (
                  <li key={dept.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <span className="text-xs font-bold text-slate-400 w-4">#{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{dept.nameEn}</p>
                      <p className="text-xs text-slate-400">{dept.employeeCount} employees · {dept.activeCards} active</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-slate-800">{dept.averageScore > 0 ? dept.averageScore.toFixed(1) : '—'}</p>
                      <p className="text-xs text-slate-400">avg score</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
        <CardContent>
          {data.recentAuditLogs.length === 0 ? <p className="text-sm text-slate-400">No activity yet.</p> : (
            <ul className="divide-y divide-slate-100">
              {data.recentAuditLogs.map(log => (
                <li key={log.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <Avatar name={log.user.nameEn} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700"><span className="font-medium">{log.user.nameEn}</span>{' '}<span className="text-slate-400">{log.action.toLowerCase().replace(/_/g, ' ')}</span></p>
                    <p className="text-xs text-slate-400">{new Date(log.createdAt).toLocaleString()}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function ManagerAnalyticsView({ data }: { data: ManagerAnalytics }) {
  const total = Object.values(data.statusDistribution).reduce((s, v) => s + v, 0)
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Team Members" value={data.teamSize} icon={<Users className="h-5 w-5" />} color="blue" />
        <StatCard title="Total Evaluations" value={data.teamCards.length} icon={<ClipboardList className="h-5 w-5" />} color="purple" />
        <StatCard title="Pending My Review" value={data.pendingManagerReviews} subtitle="Awaiting manager review" icon={<Clock className="h-5 w-5" />} color="amber" />
        <StatCard title="Team Avg Score" value={data.teamAverageScore > 0 ? data.teamAverageScore.toFixed(1) : '—'} subtitle="Across finalized cards" icon={<Star className="h-5 w-5" />} color="green" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Team Evaluation Pipeline</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {STATUSES.map(s => {
              const count = data.statusDistribution[s] ?? 0
              const pct = total > 0 ? Math.round((count / total) * 100) : 0
              return (
                <div key={s} className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 w-28 shrink-0">{STATUS_LABELS[s]}</span>
                  <div className="flex-1"><Progress value={pct} size="sm" color={s === 'FINALIZED' ? 'green' : s === 'MANAGER_REVIEW' ? 'amber' : 'blue'} /></div>
                  <span className="text-sm font-semibold text-slate-700 w-6 text-right">{count}</span>
                </div>
              )
            })}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Top Performers</CardTitle></CardHeader>
          <CardContent>
            {data.topPerformers.length === 0 ? <p className="text-sm text-slate-400">No finalized cards yet — scores will appear here.</p> : (
              <ul className="divide-y divide-slate-100">
                {data.topPerformers.map((p, i) => (
                  <li key={p.nameEn} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <span className="text-xs font-bold text-slate-400 w-4">#{i + 1}</span>
                    <Avatar name={p.nameEn} size="sm" />
                    <span className="flex-1 text-sm font-medium text-slate-800">{p.nameEn}</span>
                    <span className="text-sm font-bold text-green-600">{p.score.toFixed(1)}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader><CardTitle>Team Evaluations</CardTitle></CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/80">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Employee</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Period</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.teamCards.map(card => (
                  <tr key={card.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-3.5"><div className="flex items-center gap-2"><Avatar name={card.employee.nameEn} size="sm" /><span className="font-medium text-slate-800">{card.employee.nameEn}</span></div></td>
                    <td className="px-6 py-3.5 text-slate-600">{card.periodLabel}</td>
                    <td className="px-6 py-3.5"><Badge variant={card.status === 'FINALIZED' ? 'success' : card.status === 'MANAGER_REVIEW' ? 'warning' : 'secondary'}>{STATUS_LABELS[card.status]}</Badge></td>
                    <td className="px-6 py-3.5 text-right font-semibold text-slate-700">{card.finalScore !== null ? card.finalScore.toFixed(1) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AnalyticsPage() {
  const [role, setRole] = React.useState<string>('')
  const [adminData, setAdminData] = React.useState<AnalyticsOverview | null>(null)
  const [managerData, setManagerData] = React.useState<ManagerAnalytics | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    async function load() {
      const meRes = await fetch('/api/auth/me')
      if (!meRes.ok) return
      const me = await meRes.json()
      setRole(me.role)
      if (me.role === 'SUPER_ADMIN' || me.role === 'ADMIN') {
        const res = await fetch('/api/analytics/overview')
        if (res.ok) setAdminData(await res.json())
      } else {
        const res = await fetch('/api/analytics/manager')
        if (res.ok) setManagerData(await res.json())
      }
      setLoading(false)
    }
    load()
  }, [])

  const isAdmin = role === 'SUPER_ADMIN' || role === 'ADMIN'

  return (
    <div className="flex flex-col min-h-full">
      <TopBar title="Analytics" subtitle={isAdmin ? 'Organisation Overview' : 'Team Performance'} breadcrumbs={[{ label: 'Analytics' }]} />
      <div className="flex-1 p-6">
        {loading ? (
          <div className="flex items-center justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-slate-400" /></div>
        ) : isAdmin && adminData ? (
          <AdminAnalytics data={adminData} />
        ) : managerData ? (
          <ManagerAnalyticsView data={managerData} />
        ) : (
          <p className="text-sm text-slate-400">No analytics data available.</p>
        )}
      </div>
    </div>
  )
}
