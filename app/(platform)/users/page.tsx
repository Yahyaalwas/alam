import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Users, ShieldCheck, Building2 } from 'lucide-react'
import { TopBar } from '@/components/navigation/top-bar'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Avatar } from '@/components/ui/avatar'
import { EmptyState } from '@/components/ui/empty-state'
import type { Role } from '@/types'

export const dynamic = 'force-dynamic'

const ROLE_BADGE: Record<Role, { label: string; variant: 'default' | 'success' | 'warning' | 'secondary' | 'info' | 'danger' }> = {
  SUPER_ADMIN: { label: 'Super Admin', variant: 'danger' },
  ADMIN: { label: 'Admin', variant: 'warning' },
  DEPARTMENT_MANAGER: { label: 'Manager', variant: 'default' },
  EMPLOYEE: { label: 'Employee', variant: 'secondary' },
}

export default async function UsersPage() {
  const cookieStore = await cookies()
  const session = getSession(cookieStore)
  if (!session) redirect('/login')

  const role = session.role as Role
  if (role !== 'SUPER_ADMIN' && role !== 'ADMIN' && role !== 'DEPARTMENT_MANAGER') {
    redirect('/dashboard')
  }

  type UserRow = {
    id: string
    nameEn: string
    nameAr: string
    email: string
    role: Role
    createdAt: Date
    department: { nameEn: string; code: string } | null
    manager: { nameEn: string } | null
    _count: { cards: number }
  }

  let users: UserRow[]

  if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
    users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        nameEn: true,
        nameAr: true,
        email: true,
        role: true,
        createdAt: true,
        department: { select: { nameEn: true, code: true } },
        manager: { select: { nameEn: true } },
        _count: { select: { cards: true } },
      },
    })
  } else {
    // DEPARTMENT_MANAGER: only see their team
    const mgr = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { managedDept: { select: { id: true } }, departmentId: true },
    })
    const deptId = mgr?.managedDept?.id ?? mgr?.departmentId
    if (!deptId) {
      users = []
    } else {
      users = await prisma.user.findMany({
        where: { departmentId: deptId },
        orderBy: { nameEn: 'asc' },
        select: {
          id: true,
          nameEn: true,
          nameAr: true,
          email: true,
          role: true,
          createdAt: true,
          department: { select: { nameEn: true, code: true } },
          manager: { select: { nameEn: true } },
          _count: { select: { cards: true } },
        },
      })
    }
  }

  const pageTitle = role === 'DEPARTMENT_MANAGER' ? 'My Team' : 'Users'

  return (
    <div className="flex flex-col">
      <TopBar
        title={pageTitle}
        subtitle={`${users.length} user${users.length !== 1 ? 's' : ''}`}
        breadcrumbs={[{ label: 'Organisation' }, { label: pageTitle }]}
      />

      <div className="flex-1 p-6">
        {users.length === 0 ? (
          <Card>
            <CardContent className="py-16">
              <EmptyState
                icon={<Users className="h-8 w-8" />}
                title="No users found"
                description="Users will appear here once they are created."
              />
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>All Users</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80">
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Department
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Manager
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                        Cards
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {users.map((user) => {
                      const roleInfo = ROLE_BADGE[user.role as Role] ?? { label: user.role, variant: 'secondary' as const }
                      return (
                        <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-3">
                              <Avatar name={user.nameEn} size="sm" />
                              <div className="min-w-0">
                                <p className="font-medium text-slate-900 truncate">{user.nameEn}</p>
                                <p className="text-xs text-slate-400 truncate">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-3.5">
                            <Badge variant={roleInfo.variant}>{roleInfo.label}</Badge>
                          </td>
                          <td className="px-6 py-3.5">
                            {user.department ? (
                              <div className="flex items-center gap-1.5">
                                <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                <span className="text-slate-700">{user.department.nameEn}</span>
                                <span className="text-xs text-slate-400">({user.department.code})</span>
                              </div>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-6 py-3.5">
                            {user.manager ? (
                              <div className="flex items-center gap-1.5">
                                <ShieldCheck className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                <span className="text-slate-700">{user.manager.nameEn}</span>
                              </div>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                          <td className="px-6 py-3.5 text-right">
                            <span className="font-medium text-slate-800">{user._count.cards}</span>
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
