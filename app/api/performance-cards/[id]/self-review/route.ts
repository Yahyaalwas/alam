import { cookies } from 'next/headers'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { createAuditLog } from '@/lib/audit'

interface SelfRatingItem {
  id: string
  selfRating: number | null
  selfComment?: string | null
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const session = getSession(cookieStore)

    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (session.role !== 'EMPLOYEE') {
      return Response.json({ error: 'Forbidden: only employees can submit self-review' }, { status: 403 })
    }

    const { id } = await params

    const card = await prisma.performanceCard.findUnique({ where: { id } })

    if (!card) {
      return Response.json({ error: 'Card not found' }, { status: 404 })
    }

    if (card.employeeId !== session.userId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (card.status !== 'SELF_REVIEW') {
      return Response.json(
        { error: `Card is not in SELF_REVIEW stage (current: ${card.status})` },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { goals, competencies } = body as {
      goals: SelfRatingItem[]
      competencies: SelfRatingItem[]
    }

    if (!Array.isArray(goals) || !Array.isArray(competencies)) {
      return Response.json({ error: 'goals and competencies arrays are required' }, { status: 400 })
    }

    // Validate ratings are in range 1-5 or null
    for (const item of [...goals, ...competencies]) {
      if (item.selfRating !== null && item.selfRating !== undefined) {
        if (item.selfRating < 1 || item.selfRating > 5) {
          return Response.json({ error: 'Ratings must be between 1 and 5' }, { status: 400 })
        }
      }
    }

    await prisma.$transaction([
      ...goals.map((g) =>
        prisma.goal.update({
          where: { id: g.id },
          data: {
            selfRating: g.selfRating ?? null,
            selfComment: g.selfComment ?? null,
          },
        })
      ),
      ...competencies.map((c) =>
        prisma.competency.update({
          where: { id: c.id },
          data: {
            selfRating: c.selfRating ?? null,
            selfComment: c.selfComment ?? null,
          },
        })
      ),
      prisma.performanceCard.update({
        where: { id },
        data: {
          status: 'MANAGER_REVIEW',
          selfReviewLockedAt: new Date(),
        },
      }),
    ])

    await createAuditLog({
      action: 'SELF_REVIEW_SUBMITTED',
      userId: session.userId,
      cardId: id,
      metadata: { goalCount: goals.length, competencyCount: competencies.length },
    })

    return Response.json({ ok: true })
  } catch (error) {
    console.error('[POST /api/performance-cards/[id]/self-review]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
