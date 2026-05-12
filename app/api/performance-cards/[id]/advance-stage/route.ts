import { cookies } from 'next/headers'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { hasPermission } from '@/lib/permissions'
import { createAuditLog } from '@/lib/audit'
import { calcFinalScore } from '@/lib/score'
import type { Role, CardStatus } from '@/types'

const STAGE_SEQUENCE: CardStatus[] = [
  'GOAL_SETTING',
  'SELF_REVIEW',
  'MANAGER_REVIEW',
  'CALIBRATION_MEETING',
  'FINALIZED',
]

function nextStage(current: CardStatus): CardStatus | null {
  const idx = STAGE_SEQUENCE.indexOf(current)
  if (idx === -1 || idx === STAGE_SEQUENCE.length - 1) return null
  return STAGE_SEQUENCE[idx + 1]
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

    if (!hasPermission(session.role as Role, 'ADVANCE_STAGE')) {
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

    // DEPARTMENT_MANAGER can only advance their own managed cards
    if (
      session.role === 'DEPARTMENT_MANAGER' &&
      card.managerId !== session.userId
    ) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (card.status === 'FINALIZED') {
      return Response.json({ error: 'Card is already finalized' }, { status: 400 })
    }

    const currentStatus = card.status as CardStatus
    const next = nextStage(currentStatus)

    if (!next) {
      return Response.json({ error: 'Cannot advance from current stage' }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const { notes } = body as { notes?: string }

    const now = new Date()
    const updateData: Record<string, unknown> = { status: next }

    if (currentStatus === 'GOAL_SETTING') {
      updateData.goalSettingLockedAt = now
    } else if (currentStatus === 'MANAGER_REVIEW') {
      updateData.managerReviewLockedAt = now
    } else if (currentStatus === 'CALIBRATION_MEETING') {
      // Calculate final score from current finalRating values
      const finalScore = calcFinalScore(card.goals, card.competencies)
      updateData.calibrationCompletedAt = now
      updateData.finalizedAt = now
      updateData.finalScore = finalScore
      if (notes) updateData.calibrationNotes = notes
    }

    const updated = await prisma.performanceCard.update({
      where: { id },
      data: updateData,
    })

    await createAuditLog({
      action: 'STAGE_ADVANCED',
      userId: session.userId,
      cardId: id,
      metadata: {
        from: currentStatus,
        to: next,
        notes: notes ?? null,
      },
    })

    return Response.json({ ok: true, status: updated.status, finalScore: updated.finalScore })
  } catch (error) {
    console.error('[POST /api/performance-cards/[id]/advance-stage]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
