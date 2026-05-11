import { cookies } from 'next/headers'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'

interface RatingItem {
  id: string
  managerRating?: number | null
  managerComment?: string | null
}

export async function POST(
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

  if (card.managerId !== session.userId) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (card.status !== 'SELF_SUBMITTED') {
    return Response.json({ error: 'Card is not in SELF_SUBMITTED status' }, { status: 400 })
  }

  const body = await request.json()
  const { goals, competencies } = body as { goals: RatingItem[]; competencies: RatingItem[] }

  await Promise.all([
    ...goals.map((g) =>
      prisma.goal.update({
        where: { id: g.id },
        data: { managerRating: g.managerRating ?? null, managerComment: g.managerComment ?? null },
      })
    ),
    ...competencies.map((c) =>
      prisma.competency.update({
        where: { id: c.id },
        data: { managerRating: c.managerRating ?? null, managerComment: c.managerComment ?? null },
      })
    ),
  ])

  await prisma.performanceCard.update({
    where: { id },
    data: {
      status: 'MANAGER_SUBMITTED',
      managerReviewLockedAt: new Date(),
    },
  })

  return Response.json({ ok: true })
}
