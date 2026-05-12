import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Building2, Users, ClipboardList, TrendingUp } from 'lucide-react'
import { TopBar } from '@/components/navigation/top-bar'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { EmptyState } from '@/components/ui/empty-state'
import type { Role } from '@/types'

export const dynamic = 'force-dynamic'

export default async function DepartmentsPage() {
  const cookieStore = await cookies()
  const session = getSession(cookieStore)
  if (!session) redirect('/login')

  const role = session.role as Role
  if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') redirect('/dashboard')

  const departments = await prisma.department.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      manager: { select: { id: true, nameEn: true, nameAr: true, email: true } },
      _count: { select: { employees: true, cards: true } },
    },
  })

  // Fetch average scores per department from finalized cards
  const finalizedCards = await prisma.performanceCard.findMany({
    where: { status: 'FINALIZED', finalScore: { not: null } },
    select: { departmentId: true, finalScore: true },
  })

  const scoresByDept: Record<string, number[]> = {}
  for (const card of finalizedCards) {
    if (!scoresByDept[card.departmentId]) scoresByDept[card.departmentId] = []
    if (card.finalScore !== null) scoresByDept[card.departmentId].push(card.finalScore)
  }

  const deptStats = departments.map((dept) => {
    const scores = scoresByDept[dept.id] ?? []
    const avgScore =
      scores.length > 0 ? scores.reduce((s, v) => s + v, 0) / scores.length : null
    return { ...dept, avgScore }
  })

  return (
    <div className="flex flex-col">
      <TopBar
        title="Departments"
        subtitle={`${departments.length} department${departments.length !== 1 ? 's' : ''}`}
        breadcrumbs={[{ label: 'Organisation' }, { label: 'Departments' }]}
      />

      <div className="flex-1 p-6">
        {deptStats.length === 0 ? (
          <Card>
            <CardContent className="py-16">
              <EmptyState
                icon={<Building2 className="h-8 w-8" />}
                title="No departments yet"
                description="Departments will appear here once they are created."
              />
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {deptStats.map((dept) => (
              <Card key={dept.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                        <Building2 className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-sm">{dept.nameEn}</CardTitle>
                        <p className="text-xs text-slate-400 mt-0.5">{dept.nameAr}</p>
                      </div>
                    </div>
                    <Badge variant="secondary">{dept.code}</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Manager */}
                  <div>
                    <p className="text-xs font-medium text-slate-500 mb-1.5">Manager</p>
                    {dept.manager ? (
                      <div className="flex items-center gap-2">
                        <Avatar name={dept.manager.nameEn} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-slate-800">{dept.manager.nameEn}</p>
                          <p className="text-xs text-slate-400">{dept.manager.email}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-slate-400 italic">No manager assigned</p>
                    )}
                  </div>

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-3 border-t border-slate-100 pt-4">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
                        <Users className="h-3.5 w-3.5" />
                      </div>
                      <p className="text-lg font-bold text-slate-800">{dept._count.employees}</p>
                      <p className="text-[10px] text-slate-400">Employees</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
                        <ClipboardList className="h-3.5 w-3.5" />
                      </div>
                      <p className="text-lg font-bold text-slate-800">{dept._count.cards}</p>
                      <p className="text-[10px] text-slate-400">Cards</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
                        <TrendingUp className="h-3.5 w-3.5" />
                      </div>
                      <p className="text-lg font-bold text-slate-800">
                        {dept.avgScore !== null ? dept.avgScore.toFixed(1) : '—'}
                      </p>
                      <p className="text-[10px] text-slate-400">Avg Score</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
