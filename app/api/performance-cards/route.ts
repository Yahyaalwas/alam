import { cookies } from 'next/headers'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { hasPermission } from '@/lib/permissions'
import { createAuditLog } from '@/lib/audit'
import type { Role } from '@/types'

const FALLBACK_COMPETENCIES = [
  { titleEn: 'Communication', titleAr: 'التواصل', weight: 35 },
  { titleEn: 'Teamwork', titleAr: 'العمل الجماعي', weight: 35 },
  { titleEn: 'Problem Solving', titleAr: 'حل المشكلات', weight: 30 },
]

export async function GET() {
  try {
    const cookieStore = await cookies()
    const session = getSession(cookieStore)

    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = session.role as Role

    if (hasPermission(role, 'VIEW_ALL_CARDS')) {
      const cards = await prisma.performanceCard.findMany({
        include: {
          employee: {
            select: { id: true, nameEn: true, nameAr: true, email: true, role: true },
          },
          manager: {
            select: { id: true, nameEn: true, nameAr: true, email: true, role: true },
          },
          department: { select: { id: true, nameEn: true, nameAr: true, code: true } },
          _count: { select: { goals: true, competencies: true } },
        },
        orderBy: { createdAt: 'desc' },
      })
      return Response.json(cards)
    }

    if (role === 'DEPARTMENT_MANAGER') {
      const cards = await prisma.performanceCard.findMany({
        where: { managerId: session.userId },
        include: {
          employee: {
            select: { id: true, nameEn: true, nameAr: true, email: true, role: true },
          },
          department: { select: { id: true, nameEn: true, nameAr: true, code: true } },
          _count: { select: { goals: true, competencies: true } },
        },
        orderBy: { createdAt: 'desc' },
      })
      return Response.json(cards)
    }

    // EMPLOYEE
    const cards = await prisma.performanceCard.findMany({
      where: { employeeId: session.userId },
      include: {
        employee: {
          select: { id: true, nameEn: true, nameAr: true, email: true, role: true },
        },
        manager: {
          select: { id: true, nameEn: true, nameAr: true, email: true, role: true },
        },
        department: { select: { id: true, nameEn: true, nameAr: true, code: true } },
        goals: true,
        competencies: true,
      },
      orderBy: { createdAt: 'desc' },
    })
    return Response.json(cards)
  } catch (error) {
    console.error('[GET /api/performance-cards]', error)
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

    if (!hasPermission(session.role as Role, 'CREATE_CARD')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { employeeId, periodLabel } = body as {
      employeeId: string
      periodLabel: string
    }

    if (!employeeId || !periodLabel) {
      return Response.json(
        { error: 'employeeId and periodLabel are required' },
        { status: 400 }
      )
    }

    // Fetch the employee with their department
    const employee = await prisma.user.findUnique({
      where: { id: employeeId },
      include: { department: true },
    })

    if (!employee) {
      return Response.json({ error: 'Employee not found' }, { status: 404 })
    }

    if (!employee.departmentId) {
      return Response.json(
        { error: 'Employee must belong to a department before creating a card' },
        { status: 400 }
      )
    }

    // Determine manager: for DEPARTMENT_MANAGER callers, they are the manager
    // For ADMIN/SUPER_ADMIN, derive from employee's department manager
    let managerId: string = session.userId

    if (session.role === 'ADMIN' || session.role === 'SUPER_ADMIN') {
      const dept = await prisma.department.findUnique({
        where: { id: employee.departmentId },
        select: { managerId: true },
      })
      if (!dept?.managerId) {
        return Response.json(
          { error: 'Employee department has no assigned manager' },
          { status: 400 }
        )
      }
      managerId = dept.managerId
    }

    // Prevent duplicate active card for same period
    const existingCard = await prisma.performanceCard.findFirst({
      where: {
        employeeId,
        periodLabel,
        status: { not: 'FINALIZED' },
      },
    })
    if (existingCard) {
      return Response.json(
        { error: 'An active card already exists for this employee and period' },
        { status: 400 }
      )
    }

    const coreObjectives = await prisma.coreObjective.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    })
    const competenciesData = coreObjectives.length > 0
      ? coreObjectives.map((o) => ({ titleEn: o.titleEn, titleAr: o.titleAr, weight: o.weight }))
      : FALLBACK_COMPETENCIES

    const card = await prisma.$transaction(async (tx) => {
      const newCard = await tx.performanceCard.create({
        data: {
          employeeId,
          managerId,
          departmentId: employee.departmentId!,
          periodLabel,
          status: 'GOAL_SETTING',
        },
      })

      await tx.competency.createMany({
        data: competenciesData.map((c) => ({
          cardId: newCard.id,
          ...c,
        })),
      })

      return newCard
    })

    await createAuditLog({
      action: 'CARD_CREATED',
      userId: session.userId,
      cardId: card.id,
      metadata: { employeeId, periodLabel, managerId },
    })

    const fullCard = await prisma.performanceCard.findUnique({
      where: { id: card.id },
      include: {
        employee: {
          select: { id: true, nameEn: true, nameAr: true, email: true },
        },
        manager: {
          select: { id: true, nameEn: true, nameAr: true, email: true },
        },
        department: { select: { id: true, nameEn: true, nameAr: true } },
        competencies: true,
        goals: true,
      },
    })

    return Response.json(fullCard, { status: 201 })
  } catch (error) {
    console.error('[POST /api/performance-cards]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
