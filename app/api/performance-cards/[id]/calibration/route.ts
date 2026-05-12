import { cookies } from 'next/headers'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { hasPermission } from '@/lib/permissions'
import { createAuditLog } from '@/lib/audit'
import { calcFinalScore } from '@/lib/score'
import type { Role } from '@/types'

interface FinalRatingItem {
  id: string
  finalRating: number | null
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

    if (!hasPermission(session.role as Role, 'FINALIZE_CARD')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    const card = await prisma.performanceCard.findUnique({
      where: { id },
      include: { goals: true, competencies: true },
    })

    if (!card) {
      return Response.json({ error: 'Card not found' }, { status: 404 })
    }

    if (session.role === 'DEPARTMENT_MANAGER' && card.managerId !== session.userId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (card.status !== 'CALIBRATION_MEETING') {
      return Response.json(
        { error: `Card is not in CALIBRATION_MEETING stage (current: ${card.status})` },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { goals, competencies, notes } = body as {
      goals: FinalRatingItem[]
      competencies: FinalRatingItem[]
      notes: string
    }

    if (!Array.isArray(goals) || !Array.isArray(competencies)) {
      return Response.json({ error: 'goals and competencies arrays are required' }, { status: 400 })
    }

    // Validate ratings in range 1-5 or null
    for (const item of [...goals, ...competencies]) {
      if (item.finalRating !== null && item.finalRating !== undefined) {
        if (item.finalRating < 1 || item.finalRating > 5) {
          return Response.json({ error: 'Ratings must be between 1 and 5' }, { status: 400 })
        }
      }
    }

    // Merge incoming ratings with card data to calculate score
    const mergedGoals = card.goals.map((g) => {
      const update = goals.find((u) => u.id === g.id)
      return {
        weight: g.weight,
        finalRating: update !== undefined ? update.finalRating : g.finalRating,
      }
    })

    const mergedComps = card.competencies.map((c) => {
      const update = competencies.find((u) => u.id === c.id)
      return {
        weight: c.weight,
        finalRating: update !== undefined ? update.finalRating : c.finalRating,
      }
    })

    const finalScore = calcFinalScore(mergedGoals, mergedComps)
    const now = new Date()

    await prisma.$transaction([
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
      prisma.performanceCard.update({
        where: { id },
        data: {
          status: 'FINALIZED',
          calibrationNotes: notes ?? null,
          calibrationCompletedAt: now,
          finalizedAt: now,
          finalScore,
        },
      }),
    ])

    await createAuditLog({
      action: 'CALIBRATION_COMPLETED',
      userId: session.userId,
      cardId: id,
      metadata: { finalScore, notes: notes ?? null },
    })

    await createAuditLog({
      action: 'CARD_FINALIZED',
      userId: session.userId,
      cardId: id,
      metadata: { finalScore },
    })

    return Response.json({ ok: true, finalScore })
  } catch (error) {
    console.error('[POST /api/performance-cards/[id]/calibration]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
