import { cookies } from 'next/headers'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { hasPermission } from '@/lib/permissions'
import { createAuditLog } from '@/lib/audit'
import type { Role } from '@/types'

interface ManagerRatingItem {
  id: string
  managerRating: number | null
  managerComment?: string | null
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

    if (!hasPermission(session.role as Role, 'SUBMIT_MANAGER_REVIEW')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    const card = await prisma.performanceCard.findUnique({ where: { id } })

    if (!card) {
      return Response.json({ error: 'Card not found' }, { status: 404 })
    }

    // DEPARTMENT_MANAGER must own the card; ADMIN/SUPER_ADMIN can review any
    if (session.role === 'DEPARTMENT_MANAGER' && card.managerId !== session.userId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (card.status !== 'MANAGER_REVIEW') {
      return Response.json(
        { error: `Card is not in MANAGER_REVIEW stage (current: ${card.status})` },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { goals, competencies } = body as {
      goals: ManagerRatingItem[]
      competencies: ManagerRatingItem[]
    }

    if (!Array.isArray(goals) || !Array.isArray(competencies)) {
      return Response.json({ error: 'goals and competencies arrays are required' }, { status: 400 })
    }

    // Validate ratings in range 1-5 or null
    for (const item of [...goals, ...competencies]) {
      if (item.managerRating !== null && item.managerRating !== undefined) {
        if (item.managerRating < 1 || item.managerRating > 5) {
          return Response.json({ error: 'Ratings must be between 1 and 5' }, { status: 400 })
        }
      }
    }

    await prisma.$transaction([
      ...goals.map((g) =>
        prisma.goal.update({
          where: { id: g.id },
          data: {
            managerRating: g.managerRating ?? null,
            managerComment: g.managerComment ?? null,
          },
        })
      ),
      ...competencies.map((c) =>
        prisma.competency.update({
          where: { id: c.id },
          data: {
            managerRating: c.managerRating ?? null,
            managerComment: c.managerComment ?? null,
          },
        })
      ),
      prisma.performanceCard.update({
        where: { id },
        data: {
          status: 'CALIBRATION_MEETING',
          managerReviewLockedAt: new Date(),
        },
      }),
    ])

    await createAuditLog({
      action: 'MANAGER_REVIEW_SUBMITTED',
      userId: session.userId,
      cardId: id,
      metadata: { goalCount: goals.length, competencyCount: competencies.length },
    })

    return Response.json({ ok: true })
  } catch (error) {
    console.error('[POST /api/performance-cards/[id]/manager-review]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
