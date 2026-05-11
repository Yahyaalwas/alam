import { cookies } from 'next/headers'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { calcFinalScore } from '@/lib/score'

interface FinalRatingItem {
  id: string
  finalRating: number | null
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

  const card = await prisma.performanceCard.findUnique({
    where: { id },
    include: { goals: true, competencies: true },
  })

  if (!card) {
    return Response.json({ error: 'Not found' }, { status: 404 })
  }

  if (card.managerId !== session.userId) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (card.status !== 'MANAGER_SUBMITTED') {
    return Response.json({ error: 'Card is not in MANAGER_SUBMITTED status' }, { status: 400 })
  }

  const body = await request.json()
  const { goals, competencies } = body as {
    goals: FinalRatingItem[]
    competencies: FinalRatingItem[]
  }

  await Promise.all([
    ...goals.map((g) =>
      prisma.goal.update({
        where: { id: g.id },
        data: { finalRating: g.finalRating ?? null },
      })
    ),
    ...competencies.map((c) =>
      prisma.competency.update({
        where: { id: c.id },
        data: { finalRating: c.finalRating ?? null },
      })
    ),
  ])

  const updatedGoals = card.goals.map((g) => {
    const update = goals.find((u) => u.id === g.id)
    return { weight: g.weight, finalRating: update ? (update.finalRating ?? null) : g.finalRating }
  })

  const updatedComps = card.competencies.map((c) => {
    const update = competencies.find((u) => u.id === c.id)
    return { weight: c.weight, finalRating: update ? (update.finalRating ?? null) : c.finalRating }
  })

  const finalScore = calcFinalScore(updatedGoals, updatedComps)

  await prisma.performanceCard.update({
    where: { id },
    data: {
      status: 'FINALIZED',
      finalizedAt: new Date(),
      finalScore,
    },
  })

  return Response.json({ ok: true, finalScore })
}
