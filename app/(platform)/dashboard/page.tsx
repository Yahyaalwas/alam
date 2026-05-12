import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import type { Role } from '@/types'

export default async function DashboardPage() {
  const cookieStore = await cookies()
  const session = getSession(cookieStore)

  if (!session) {
    redirect('/login')
  }

  const role = session.role as Role

  if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
    redirect('/dashboard/admin')
  }

  if (role === 'DEPARTMENT_MANAGER') {
    redirect('/dashboard/manager')
  }

  redirect('/dashboard/employee')
}
