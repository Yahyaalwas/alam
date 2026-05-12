import { cookies } from 'next/headers'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies()
  const session = getSession(cookieStore)

  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const card = await prisma.performanceCard.findUnique({
    where: { id },
    include: {
      employee: true,
      manager: true,
      goals: true,
      competencies: true,
    },
  })

  if (!card) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  const isEmployee = card.employeeId === session.userId
  const isManager = card.managerId === session.userId
  const isHR = session.role === 'HR'

  if (!isEmployee && !isManager && !isHR) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  return Response.json(card)
}
