import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import {
  Users,
  Building2,
  ClipboardList,
  TrendingUp,
  CheckCircle2,
  Clock,
  AlertTriangle,
} from 'lucide-react'
import { TopBar } from '@/components/navigation/top-bar'
import { StatCard } from '@/components/ui/stat-card'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import type { Role } from '@/types'

export const dynamic = 'force-dynamic'

function statusBadge(status: string) {
  const map: Record<string, { label: string; variant: 'default' | 'success' | 'warning' | 'danger' | 'secondary' }> = {
    GOAL_SETTING: { label: 'Goal Setting', variant: 'secondary' },
    SELF_REVIEW: { label: 'Self Review', variant: 'default' },
    MANAGER_REVIEW: { label: 'Manager Review', variant: 'warning' },
    CALIBRATION_MEETING: { label: 'Calibration', variant: 'info' as 'default' },
    FINALIZED: { label: 'Finalized', variant: 'success' },
  }
  const info = map[status] ?? { label: status, variant: 'secondary' as const }
  return <Badge variant={info.variant}>{info.label}</Badge>
}

export default async function AdminDashboardPage() {
  const cookieStore = await cookies()
  const session = getSession(cookieStore)
  if (!session) redirect('/login')

  const role = session.role as Role
  if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') redirect('/dashboard')

  const [totalUsers, totalDepts, cards, recentCards] = await Promise.all([
    prisma.user.count(),
    prisma.department.count(),
    prisma.performanceCard.groupBy({ by: ['status'], _count: { _all: true } }),
    prisma.performanceCard.findMany({
      take: 8,
      orderBy: { updatedAt: 'desc' },
      include: {
        employee: { select: { nameEn: true } },
        department: { select: { nameEn: true } },
      },
    }),
  ])

  const statusCounts = Object.fromEntries(cards.map((c) => [c.status, c._count._all]))
  const totalCards = cards.reduce((sum, c) => sum + c._count._all, 0)
  const finalizedCount = statusCounts['FINALIZED'] ?? 0
  const completionRate = totalCards > 0 ? Math.round((finalizedCount / totalCards) * 100) : 0

  return (
    <div className="flex flex-col">
      <TopBar title="Admin Dashboard" subtitle="Organisation Overview" />

      <div className="flex-1 space-y-6 p-6">
        {/* KPI row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total Employees"
            value={totalUsers}
            icon={<Users className="h-5 w-5" />}
            color="blue"
          />
          <StatCard
            title="Departments"
            value={totalDepts}
            icon={<Building2 className="h-5 w-5" />}
            color="purple"
          />
          <StatCard
            title="Performance Cards"
            value={totalCards}
            subtitle={`${finalizedCount} finalized`}
            icon={<ClipboardList className="h-5 w-5" />}
            color="green"
          />
          <StatCard
            title="Completion Rate"
            value={`${completionRate}%`}
            subtitle="Cards finalized"
            icon={<TrendingUp className="h-5 w-5" />}
            color="amber"
          />
        </div>

        {/* Two-column section */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Card status breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Evaluation Pipeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { key: 'GOAL_SETTING', label: 'Goal Setting', icon: <Clock className="h-4 w-4 text-slate-400" />, color: 'amber' as const },
                { key: 'SELF_REVIEW', label: 'Self Review', icon: <ClipboardList className="h-4 w-4 text-blue-500" />, color: 'blue' as const },
                { key: 'MANAGER_REVIEW', label: 'Manager Review', icon: <Users className="h-4 w-4 text-violet-500" />, color: 'blue' as const },
                { key: 'CALIBRATION_MEETING', label: 'Calibration', icon: <AlertTriangle className="h-4 w-4 text-amber-500" />, color: 'amber' as const },
                { key: 'FINALIZED', label: 'Finalized', icon: <CheckCircle2 className="h-4 w-4 text-green-500" />, color: 'green' as const },
              ].map(({ key, label, icon, color }) => {
                const count = statusCounts[key] ?? 0
                const pct = totalCards > 0 ? Math.round((count / totalCards) * 100) : 0
                return (
                  <div key={key} className="flex items-center gap-3">
                    <span className="shrink-0">{icon}</span>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-sm text-slate-700">{label}</span>
                        <span className="text-sm font-semibold text-slate-900">{count}</span>
                      </div>
                      <Progress value={pct} size="sm" color={color} />
                    </div>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Recent activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Evaluations</CardTitle>
            </CardHeader>
            <CardContent>
              {recentCards.length === 0 ? (
                <p className="text-sm text-slate-400">No evaluations yet.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {recentCards.map((card) => (
                    <li key={card.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                      <Avatar name={card.employee.nameEn} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-800">
                          {card.employee.nameEn}
                        </p>
                        <p className="truncate text-xs text-slate-400">
                          {card.department.nameEn} · {card.periodLabel}
                        </p>
                      </div>
                      {statusBadge(card.status)}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
