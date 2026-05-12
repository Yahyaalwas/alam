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

  if (session.role === 'HR') {
    const cards = await prisma.performanceCard.findMany({
      include,
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
    })
    return Response.json(cards)
  }

  return Response.json({ error: 'Forbidden' }, { status: 403 })
}

export async function POST(request: Request) {
  const cookieStore = await cookies()
  const session = getSession(cookieStore)

  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (session.role !== 'HR') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const { employeeId, managerId, periodLabel } = body as {
    employeeId: string
    managerId: string
    periodLabel: string
  }

  if (!employeeId || !managerId || !periodLabel) {
    return Response.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const [employee, manager] = await Promise.all([
    prisma.user.findUnique({ where: { id: employeeId } }),
    prisma.user.findUnique({ where: { id: managerId } }),
  ])

  if (!employee || employee.role !== 'EMPLOYEE') {
    return Response.json({ error: 'Invalid employee' }, { status: 400 })
  }
  if (!manager || manager.role !== 'MANAGER') {
    return Response.json({ error: 'Invalid manager' }, { status: 400 })
  }

  const card = await prisma.performanceCard.create({
    data: { employeeId, managerId, periodLabel, status: 'DRAFT' },
    include: { employee: true, manager: true, goals: true, competencies: true },
  })

  return Response.json(card, { status: 201 })
}
