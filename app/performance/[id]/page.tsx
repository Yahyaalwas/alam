import { cookies } from 'next/headers'
import { redirect, notFound } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import type { CardWithRelations, UserRole } from '@/types'
import PerformanceCardClient from './PerformanceCardClient'

export default async function PerformancePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const cookieStore = await cookies()
  const session = getSession(cookieStore)

  if (!session) {
    redirect('/login')
  }

  const { id } = await params

  const card = await prisma.performanceCard.findUnique({
    where: { id },
    include: {
      employee: true,
      manager: true,
      goals: { orderBy: { createdAt: 'asc' } },
      competencies: { orderBy: { createdAt: 'asc' } },
    },
  })

  if (!card) {
    notFound()
  }

  const isEmployee = card.employeeId === session.userId
  const isManager = card.managerId === session.userId
  const isHR = session.role === 'HR'

  if (!isEmployee && !isManager && !isHR) {
    const dest = session.role === 'MANAGER' ? '/dashboard/manager' : '/dashboard/employee'
    redirect(dest)
  }

  const serializedCard: CardWithRelations = JSON.parse(JSON.stringify(card))

  return (
    <PerformanceCardClient
      card={serializedCard}
      role={session.role as UserRole}
      currentUserId={session.userId}
    />
  )
}
