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

/**
 * @deprecated Use POST /api/performance-cards/[id]/calibration instead.
 * Kept for backward compatibility.
 */
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

    // Accept both CALIBRATION_MEETING (new flow) and MANAGER_REVIEW (legacy) stages
    if (card.status !== 'CALIBRATION_MEETING' && card.status !== 'MANAGER_REVIEW') {
      return Response.json(
        {
          error: `Card must be in CALIBRATION_MEETING or MANAGER_REVIEW stage (current: ${card.status})`,
        },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { goals, competencies } = body as {
      goals: FinalRatingItem[]
      competencies: FinalRatingItem[]
    }

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
          finalizedAt: now,
          calibrationCompletedAt: now,
          finalScore,
        },
      }),
    ])

    await createAuditLog({
      action: 'CARD_FINALIZED',
      userId: session.userId,
      cardId: id,
      metadata: { finalScore },
    })

    return Response.json({ ok: true, finalScore })
  } catch (error) {
    console.error('[POST /api/performance-cards/[id]/finalize]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
