import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { ClipboardList, Target, CheckCircle2, Clock } from 'lucide-react'
import { TopBar } from '@/components/navigation/top-bar'
import { StatCard } from '@/components/ui/stat-card'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { EmptyState } from '@/components/ui/empty-state'

export const dynamic = 'force-dynamic'

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

export default async function EmployeeDashboardPage() {
  const cookieStore = await cookies()
  const session = getSession(cookieStore)
  if (!session) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { nameEn: true, role: true },
  })
  if (!user) redirect('/login')
  if (user.role !== 'EMPLOYEE') redirect('/dashboard')

  const myCards = await prisma.performanceCard.findMany({
    where: { employeeId: session.userId },
    orderBy: { updatedAt: 'desc' },
    include: {
      goals: { select: { id: true, selfRating: true, finalRating: true } },
    },
  })

  const latestCard = myCards[0] ?? null
  const totalGoals = latestCard?.goals.length ?? 0
  const ratedGoals = latestCard?.goals.filter((g) => g.selfRating !== null).length ?? 0
  const goalProgress = totalGoals > 0 ? Math.round((ratedGoals / totalGoals) * 100) : 0

  const finalizedCards = myCards.filter((c) => c.status === 'FINALIZED')
  const avgScore =
    finalizedCards.length > 0
      ? (
          finalizedCards.reduce((s, c) => s + (c.finalScore ?? 0), 0) / finalizedCards.length
        ).toFixed(1)
      : null

  return (
    <div className="flex flex-col">
      <TopBar
        title={`Welcome back, ${user.nameEn.split(' ')[0]}`}
        subtitle="Your performance overview"
      />

      <div className="flex-1 space-y-6 p-6">
        {/* KPI row */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard
            title="Performance Cards"
            value={myCards.length}
            icon={<ClipboardList className="h-5 w-5" />}
            color="blue"
          />
          <StatCard
            title="Goals Rated"
            value={`${ratedGoals} / ${totalGoals}`}
            subtitle="Current cycle self-ratings"
            icon={<Target className="h-5 w-5" />}
            color="green"
          />
          <StatCard
            title="Average Final Score"
            value={avgScore ?? '—'}
            subtitle={avgScore ? 'Across finalized cycles' : 'No finalized cycles yet'}
            icon={<CheckCircle2 className="h-5 w-5" />}
            color="purple"
          />
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Current card */}
          <Card>
            <CardHeader>
              <CardTitle>Current Evaluation</CardTitle>
            </CardHeader>
            <CardContent>
              {!latestCard ? (
                <EmptyState
                  icon={<ClipboardList className="h-6 w-6" />}
                  title="No evaluation card yet"
                  description="Your manager will create an evaluation card for you when the cycle begins."
                />
              ) : (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{latestCard.periodLabel}</p>
                    </div>
                    <Badge variant={statusVariant(latestCard.status)}>
                      {statusLabel(latestCard.status)}
                    </Badge>
                  </div>

                  {latestCard.status === 'SELF_REVIEW' && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Self-review progress</span>
                        <span className="font-medium text-slate-800">{goalProgress}%</span>
                      </div>
                      <Progress value={goalProgress} color="blue" />
                      <p className="text-xs text-slate-400">
                        {ratedGoals} of {totalGoals} goals rated
                      </p>
                    </div>
                  )}

                  {latestCard.status === 'FINALIZED' && latestCard.finalScore !== null && (
                    <div className="rounded-lg bg-green-50 border border-green-100 p-4 text-center">
                      <p className="text-xs text-green-600 font-medium uppercase tracking-wide mb-1">Final Score</p>
                      <p className="text-4xl font-bold text-green-700">{latestCard.finalScore.toFixed(1)}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* All cards history */}
          <Card>
            <CardHeader>
              <CardTitle>Evaluation History</CardTitle>
            </CardHeader>
            <CardContent>
              {myCards.length === 0 ? (
                <EmptyState
                  icon={<Clock className="h-6 w-6" />}
                  title="No history yet"
                  description="Past evaluation cycles will appear here."
                />
              ) : (
                <ul className="divide-y divide-slate-100">
                  {myCards.map((card) => (
                    <li key={card.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{card.periodLabel}</p>
                        <p className="text-xs text-slate-400">{statusLabel(card.status)}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {card.finalScore !== null && (
                          <span className="text-sm font-bold text-slate-700">
                            {card.finalScore.toFixed(1)}
                          </span>
                        )}
                        <Badge variant={statusVariant(card.status)}>
                          {statusLabel(card.status)}
                        </Badge>
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
