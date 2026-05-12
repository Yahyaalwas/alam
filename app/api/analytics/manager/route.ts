import { cookies } from 'next/headers'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { hasPermission } from '@/lib/permissions'
import type { Role, CardStatus, ManagerAnalytics } from '@/types'

const ALL_STATUSES: CardStatus[] = [
  'GOAL_SETTING',
  'SELF_REVIEW',
  'MANAGER_REVIEW',
  'CALIBRATION_MEETING',
  'FINALIZED',
]

export async function GET() {
  try {
    const cookieStore = await cookies()
    const session = getSession(cookieStore)

    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!hasPermission(session.role as Role, 'VIEW_DEPARTMENT_ANALYTICS')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const [teamCards, pendingGoals] = await Promise.all([
      prisma.performanceCard.findMany({
        where: { managerId: session.userId },
        select: {
          id: true,
          periodLabel: true,
          status: true,
          finalScore: true,
          employee: { select: { id: true, nameEn: true, nameAr: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.goal.count({
        where: {
          card: { managerId: session.userId },
          goalStatus: 'PENDING_APPROVAL',
        },
      }),
    ])

    // Derive unique employee IDs from team cards
    const employeeIds = [...new Set(teamCards.map((c) => c.employee.id))]
    const teamSize = employeeIds.length

    const pendingManagerReviews = teamCards.filter((c) => c.status === 'MANAGER_REVIEW').length

    // Build status distribution with all statuses initialized to 0
    const statusDistribution = ALL_STATUSES.reduce<Record<CardStatus, number>>((acc, s) => {
      acc[s] = 0
      return acc
    }, {} as Record<CardStatus, number>)

    for (const card of teamCards) {
      statusDistribution[card.status as CardStatus] =
        (statusDistribution[card.status as CardStatus] ?? 0) + 1
    }

    const finalizedCards = teamCards.filter((c) => c.status === 'FINALIZED' && c.finalScore !== null)
    const teamAverageScore =
      finalizedCards.length > 0
        ? finalizedCards.reduce((sum, c) => sum + (c.finalScore ?? 0), 0) / finalizedCards.length
        : 0

    const topPerformers = finalizedCards
      .map((c) => ({ nameEn: c.employee.nameEn, score: c.finalScore ?? 0 }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)

    const result: ManagerAnalytics = {
      teamSize,
      pendingGoalApprovals: pendingGoals,
      pendingManagerReviews,
      teamCards: teamCards.map((c) => ({
        id: c.id,
        periodLabel: c.periodLabel,
        status: c.status as CardStatus,
        finalScore: c.finalScore,
        employee: c.employee,
      })),
      teamAverageScore: Math.round(teamAverageScore * 100) / 100,
      statusDistribution,
      topPerformers,
    }

    return Response.json(result)
  } catch (error) {
    console.error('[GET /api/analytics/manager]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
