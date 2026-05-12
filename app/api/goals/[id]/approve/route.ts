import { cookies } from 'next/headers'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { hasPermission } from '@/lib/permissions'
import { createAuditLog } from '@/lib/audit'
import type { Role } from '@/types'

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

    if (!hasPermission(session.role as Role, 'APPROVE_GOAL')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    const goal = await prisma.goal.findUnique({
      where: { id },
      include: {
        card: { select: { id: true, managerId: true, status: true } },
      },
    })

    if (!goal) {
      return Response.json({ error: 'Goal not found' }, { status: 404 })
    }

    // DEPARTMENT_MANAGER can only approve goals in cards they manage
    if (session.role === 'DEPARTMENT_MANAGER' && goal.card.managerId !== session.userId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (goal.goalStatus !== 'PENDING_APPROVAL') {
      return Response.json(
        { error: `Goal is not pending approval (current: ${goal.goalStatus})` },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { approved, reason } = body as { approved: boolean; reason?: string }

    if (approved === undefined || approved === null) {
      return Response.json({ error: 'approved (boolean) is required' }, { status: 400 })
    }

    const newStatus = approved ? 'APPROVED' : 'REJECTED'

    const updated = await prisma.goal.update({
      where: { id },
      data: {
        goalStatus: newStatus,
        approvedByManager: approved,
        approvalDate: new Date(),
      },
    })

    await createAuditLog({
      action: approved ? 'GOAL_APPROVED' : 'GOAL_REJECTED',
      userId: session.userId,
      cardId: goal.card.id,
      metadata: {
        goalId: id,
        approved,
        reason: reason ?? null,
      },
    })

    return Response.json({ ok: true, goalStatus: updated.goalStatus })
  } catch (error) {
    console.error('[POST /api/goals/[id]/approve]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
