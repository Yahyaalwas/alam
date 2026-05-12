import { cookies } from 'next/headers'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { hasPermission } from '@/lib/permissions'
import type { Role, CardStatus, AnalyticsOverview } from '@/types'

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

    if (!hasPermission(session.role as Role, 'VIEW_ORG_ANALYTICS')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Efficient parallel queries — no N+1
    const [
      totalEmployees,
      totalDepartments,
      cardStatusCounts,
      finalizedCardsAggregate,
      departments,
      recentAuditLogs,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'EMPLOYEE' } }),
      prisma.department.count(),
      prisma.performanceCard.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
      prisma.performanceCard.aggregate({
        where: { status: 'FINALIZED', finalScore: { not: null } },
        _avg: { finalScore: true },
        _count: { _all: true },
      }),
      prisma.department.findMany({
        select: {
          id: true,
          nameEn: true,
          nameAr: true,
          _count: { select: { employees: true } },
          cards: {
            select: { status: true, finalScore: true },
          },
        },
      }),
      prisma.auditLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          user: { select: { nameEn: true, role: true } },
        },
      }),
    ])

    // Build status distribution with all statuses initialized to 0
    const statusDistribution = ALL_STATUSES.reduce<Record<CardStatus, number>>((acc, s) => {
      acc[s] = 0
      return acc
    }, {} as Record<CardStatus, number>)

    let totalCards = 0
    for (const row of cardStatusCounts) {
      statusDistribution[row.status as CardStatus] = row._count._all
      totalCards += row._count._all
    }

    const totalFinalizedCards = finalizedCardsAggregate._count._all
    const totalActiveCards = totalCards - totalFinalizedCards
    const orgAverageScore = finalizedCardsAggregate._avg.finalScore ?? 0
    const completionRate = totalCards > 0 ? totalFinalizedCards / totalCards : 0

    // Department stats computed from already-fetched data — zero extra queries
    const departmentStats = departments.map((dept) => {
      const cards = dept.cards
      const finalized = cards.filter((c) => c.status === 'FINALIZED')
      const scores = finalized
        .map((c) => c.finalScore)
        .filter((s): s is number => s !== null)

      const averageScore =
        scores.length > 0 ? scores.reduce((sum, s) => sum + s, 0) / scores.length : 0
      const deptCompletionRate = cards.length > 0 ? finalized.length / cards.length : 0
      const activeCards = cards.filter((c) => c.status !== 'FINALIZED').length

      return {
        id: dept.id,
        nameEn: dept.nameEn,
        nameAr: dept.nameAr,
        employeeCount: dept._count.employees,
        averageScore: Math.round(averageScore * 100) / 100,
        completionRate: Math.round(deptCompletionRate * 10000) / 10000,
        activeCards,
      }
    })

    const result: AnalyticsOverview = {
      totalEmployees,
      totalDepartments,
      totalActiveCards,
      totalFinalizedCards,
      orgAverageScore: Math.round(orgAverageScore * 100) / 100,
      completionRate: Math.round(completionRate * 10000) / 10000,
      statusDistribution,
      departmentStats,
      recentAuditLogs: recentAuditLogs.map((log) => ({
        id: log.id,
        action: log.action,
        user: { nameEn: log.user.nameEn, role: log.user.role as Role },
        createdAt: log.createdAt.toISOString(),
        metadata: log.metadata,
      })),
    }

    return Response.json(result)
  } catch (error) {
    console.error('[GET /api/analytics/overview]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
