import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import type { CardStatus } from '@/types'
import HRDashboardClient from './HRDashboardClient'

export default async function HRDashboard() {
  const cookieStore = await cookies()
  const session = getSession(cookieStore)

  if (!session || session.role !== 'HR') {
    redirect('/login')
  }

  const cards = await prisma.performanceCard.findMany({
    include: {
      employee: { select: { nameEn: true, email: true } },
      manager: { select: { nameEn: true } },
    },
    orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
  })

  const serialized = cards.map((c) => ({
    id: c.id,
    periodLabel: c.periodLabel,
    status: c.status as CardStatus,
    finalScore: c.finalScore,
    employee: c.employee,
    manager: c.manager,
  }))

  return <HRDashboardClient initialCards={serialized} />
}
