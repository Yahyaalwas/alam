import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Users, ClipboardList, Target, CheckCircle2 } from 'lucide-react'
import { TopBar } from '@/components/navigation/top-bar'
import { StatCard } from '@/components/ui/stat-card'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import type { Role } from '@/types'

export const dynamic = 'force-dynamic'

function statusVariant(status: string): 'default' | 'success' | 'warning' | 'secondary' {
  const map: Record<string, 'default' | 'success' | 'warning' | 'secondary'> = {
    GOAL_SETTING: 'secondary',
    SELF_REVIEW: 'default',
    MANAGER_REVIEW: 'warning',
    CALIBRATION_MEETING: 'warning',
    FINALIZED: 'success',
  }
  return map[status] ?? 'secondary'
}

function statusLabel(status: string): string {
  const map: Record<string, string> = {
    GOAL_SETTING: 'Goal Setting',
    SELF_REVIEW: 'Self Review',
    MANAGER_REVIEW: 'Manager Review',
    CALIBRATION_MEETING: 'Calibration',
    FINALIZED: 'Finalized',
  }
  return map[status] ?? status
}

export default async function ManagerDashboardPage() {
  const cookieStore = await cookies()
  const session = getSession(cookieStore)
  if (!session) redirect('/login')

  const role = session.role as Role
  if (role !== 'DEPARTMENT_MANAGER') redirect('/dashboard')

  const [directReports, managedCards, pendingGoals] = await Promise.all([
    prisma.user.findMany({
      where: { managerId: session.userId },
      select: { id: true, nameEn: true, email: true },
    }),
    prisma.performanceCard.findMany({
      where: { managerId: session.userId },
      orderBy: { updatedAt: 'desc' },
      include: { employee: { select: { nameEn: true } } },
    }),
    prisma.goal.count({
      where: {
        card: { managerId: session.userId },
        goalStatus: 'PENDING_APPROVAL',
      },
    }),
  ])

  const totalCards = managedCards.length
  const finalizedCards = managedCards.filter((c) => c.status === 'FINALIZED').length
  const pendingReview = managedCards.filter((c) => c.status === 'MANAGER_REVIEW').length

  return (
    <div className="flex flex-col">
      <TopBar title="Manager Dashboard" subtitle="Team Overview" />

      <div className="flex-1 space-y-6 p-6">
        {/* KPI row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Team Members"
            value={directReports.length}
            icon={<Users className="h-5 w-5" />}
            color="blue"
          />
          <StatCard
            title="Total Evaluations"
            value={totalCards}
            icon={<ClipboardList className="h-5 w-5" />}
            color="purple"
          />
          <StatCard
            title="Pending My Review"
            value={pendingReview}
            subtitle="Awaiting manager review"
            icon={<ClipboardList className="h-5 w-5" />}
            color="amber"
          />
          <StatCard
            title="Pending Goal Approvals"
            value={pendingGoals}
            icon={<Target className="h-5 w-5" />}
            color="green"
          />
        </div>

        {/* Two-column */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Team members */}
          <Card>
            <CardHeader>
              <CardTitle>My Team</CardTitle>
            </CardHeader>
            <CardContent>
              {directReports.length === 0 ? (
                <p className="text-sm text-slate-400">No direct reports assigned yet.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {directReports.map((member) => (
                    <li key={member.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                      <Avatar name={member.nameEn} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-800">{member.nameEn}</p>
                        <p className="truncate text-xs text-slate-400">{member.email}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Team evaluations */}
          <Card>
            <CardHeader>
              <CardTitle>Team Evaluations</CardTitle>
            </CardHeader>
            <CardContent>
              {managedCards.length === 0 ? (
                <p className="text-sm text-slate-400">No evaluations created yet.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {managedCards.slice(0, 8).map((card) => (
                    <li key={card.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                      <Avatar name={card.employee.nameEn} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-slate-800">
                          {card.employee.nameEn}
                        </p>
                        <p className="truncate text-xs text-slate-400">{card.periodLabel}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Badge variant={statusVariant(card.status)}>
                          {statusLabel(card.status)}
                        </Badge>
                        {card.status === 'FINALIZED' && card.finalScore !== null && (
                          <span className="text-sm font-semibold text-slate-700">
                            {card.finalScore.toFixed(1)}
                          </span>
                        )}
                      </div>
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
