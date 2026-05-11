import { cookies } from 'next/headers'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET() {
  const cookieStore = await cookies()
  const session = getSession(cookieStore)

  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const include = {
    employee: true,
    manager: true,
    goals: true,
    competencies: true,
  }

  if (session.role === 'EMPLOYEE') {
    const cards = await prisma.performanceCard.findMany({
      where: { employeeId: session.userId },
      include,
      orderBy: { createdAt: 'desc' },
    })
    return Response.json(cards)
  }

  if (session.role === 'MANAGER') {
    const cards = await prisma.performanceCard.findMany({
      where: { managerId: session.userId },
      include,
      orderBy: { createdAt: 'desc' },
    })
    return Response.json(cards)
  }

  return Response.json({ error: 'Forbidden' }, { status: 403 })
}
