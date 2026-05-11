import { cookies } from 'next/headers'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

interface RatingItem {
  id: string
  selfRating?: number | null
  selfComment?: string | null
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const cookieStore = await cookies()
  const session = getSession(cookieStore)

  if (!session) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  const card = await prisma.performanceCard.findUnique({ where: { id } })
  if (!card) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  if (card.employeeId !== session.userId) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (card.status !== 'DRAFT') {
    return Response.json({ error: 'Card is not in DRAFT status' }, { status: 400 })
  }

  const body = await request.json()
  const { goals, competencies } = body as { goals: RatingItem[]; competencies: RatingItem[] }

  await Promise.all([
    ...goals.map((g) =>
      prisma.goal.update({
        where: { id: g.id },
        data: { selfRating: g.selfRating ?? null, selfComment: g.selfComment ?? null },
      })
    ),
    ...competencies.map((c) =>
      prisma.competency.update({
        where: { id: c.id },
        data: { selfRating: c.selfRating ?? null, selfComment: c.selfComment ?? null },
      })
    ),
  ])

  return Response.json({ ok: true })
}
