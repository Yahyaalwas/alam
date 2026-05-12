import { cookies } from 'next/headers'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { hasPermission } from '@/lib/permissions'
import { createAuditLog } from '@/lib/audit'
import type { Role } from '@/types'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const session = getSession(cookieStore)

    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!hasPermission(session.role as Role, 'VIEW_ALL_DEPARTMENTS')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const departments = await prisma.department.findMany({
      include: {
        manager: {
          select: { id: true, nameEn: true, nameAr: true, email: true, role: true },
        },
        _count: {
          select: { employees: true, cards: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Compute average final score per department from finalized cards
    const deptIds = departments.map((d) => d.id)
    const finalizedCards = await prisma.performanceCard.findMany({
      where: {
        departmentId: { in: deptIds },
        status: 'FINALIZED',
        finalScore: { not: null },
      },
      select: { departmentId: true, finalScore: true },
    })

    const scoresByDept = finalizedCards.reduce<Record<string, number[]>>((acc, card) => {
      if (card.finalScore !== null) {
        if (!acc[card.departmentId]) acc[card.departmentId] = []
        acc[card.departmentId].push(card.finalScore)
      }
      return acc
    }, {})

    const result = departments.map((dept) => {
      const scores = scoresByDept[dept.id] ?? []
      const averageScore =
        scores.length > 0 ? scores.reduce((sum, s) => sum + s, 0) / scores.length : 0

      return {
        id: dept.id,
        nameEn: dept.nameEn,
        nameAr: dept.nameAr,
        code: dept.code,
        managerId: dept.managerId,
        manager: dept.manager,
        employeeCount: dept._count.employees,
        totalCards: dept._count.cards,
        averageScore: Math.round(averageScore * 100) / 100,
        createdAt: dept.createdAt,
        updatedAt: dept.updatedAt,
      }
    })

    return Response.json(result)
  } catch (error) {
    console.error('[GET /api/departments]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const session = getSession(cookieStore)

    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!hasPermission(session.role as Role, 'CREATE_DEPARTMENT')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { nameEn, nameAr, code, managerId } = body as {
      nameEn: string
      nameAr: string
      code: string
      managerId?: string
    }

    if (!nameEn || !nameAr || !code) {
      return Response.json(
        { error: 'nameEn, nameAr, and code are required' },
        { status: 400 }
      )
    }

    // Check code uniqueness
    const existing = await prisma.department.findUnique({ where: { code } })
    if (existing) {
      return Response.json({ error: 'Department code already exists' }, { status: 400 })
    }

    // Validate managerId if provided
    if (managerId) {
      const manager = await prisma.user.findUnique({ where: { id: managerId } })
      if (!manager) {
        return Response.json({ error: 'Manager not found' }, { status: 400 })
      }
      if (manager.role !== 'DEPARTMENT_MANAGER' && manager.role !== 'ADMIN' && manager.role !== 'SUPER_ADMIN') {
        return Response.json(
          { error: 'User does not have a manager-level role' },
          { status: 400 }
        )
      }
    }

    const department = await prisma.department.create({
      data: {
        nameEn,
        nameAr,
        code,
        managerId: managerId ?? null,
      },
      include: {
        manager: {
          select: { id: true, nameEn: true, nameAr: true, email: true, role: true },
        },
      },
    })

    await createAuditLog({
      action: 'DEPARTMENT_CREATED',
      userId: session.userId,
      metadata: { departmentId: department.id, nameEn, code },
    })

    return Response.json(department, { status: 201 })
  } catch (error) {
    console.error('[POST /api/departments]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
