import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { ClipboardList } from 'lucide-react'
import { TopBar } from '@/components/navigation/top-bar'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { EmptyState } from '@/components/ui/empty-state'
import type { Role, CardStatus } from '@/types'

export const dynamic = 'force-dynamic'

const STATUS_META: Record<CardStatus, { label: string; variant: 'default' | 'success' | 'warning' | 'secondary' | 'info' }> = {
  GOAL_SETTING: { label: 'Goal Setting', variant: 'secondary' },
  SELF_REVIEW: { label: 'Self Review', variant: 'default' },
  MANAGER_REVIEW: { label: 'Manager Review', variant: 'warning' },
  CALIBRATION_MEETING: { label: 'Calibration', variant: 'info' },
  FINALIZED: { label: 'Finalized', variant: 'success' },
}

export default async function PerformanceCardsPage() {
  const cookieStore = await cookies()
  const session = getSession(cookieStore)
  if (!session) redirect('/login')

  const role = session.role as Role

  let cards

  if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
    cards = await prisma.performanceCard.findMany({
      orderBy: { updatedAt: 'desc' },
      include: {
        employee: { select: { nameEn: true } },
        manager: { select: { nameEn: true } },
        department: { select: { nameEn: true, code: true } },
      },
    })
  } else if (role === 'DEPARTMENT_MANAGER') {
    cards = await prisma.performanceCard.findMany({
      where: { managerId: session.userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        employee: { select: { nameEn: true } },
        manager: { select: { nameEn: true } },
        department: { select: { nameEn: true, code: true } },
      },
    })
  } else {
    cards = await prisma.performanceCard.findMany({
      where: { employeeId: session.userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        employee: { select: { nameEn: true } },
        manager: { select: { nameEn: true } },
        department: { select: { nameEn: true, code: true } },
      },
    })
  }

  return (
    <div className="flex flex-col">
      <TopBar
        title="Performance Cards"
        subtitle={`${cards.length} evaluation${cards.length !== 1 ? 's' : ''}`}
        breadcrumbs={[{ label: 'Performance' }, { label: 'Cards' }]}
      />

      <div className="flex-1 p-6">
        {cards.length === 0 ? (
          <Card>
            <CardContent className="py-16">
              <EmptyState
                icon={<ClipboardList className="h-8 w-8" />}
                title="No performance cards yet"
                description="Performance cards will appear here once they are created by an administrator or manager."
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
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Employee
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Period
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Department
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Manager
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Score
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cards.map((card) => {
                      const meta = STATUS_META[card.status as CardStatus]
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
                              <span className="font-semibold text-slate-800">
                                {card.finalScore.toFixed(1)}
                              </span>
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
    </div>
  )
}
