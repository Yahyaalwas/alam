import { cookies } from 'next/headers'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { hasPermission } from '@/lib/permissions'
import { createAuditLog } from '@/lib/audit'
import type { Role, GoalType } from '@/types'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const session = getSession(cookieStore)

    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = session.role as Role

    const goalInclude = {
      card: {
        select: {
          id: true,
          periodLabel: true,
          status: true,
          employee: { select: { id: true, nameEn: true, nameAr: true } },
        },
      },
      createdBy: { select: { id: true, nameEn: true, nameAr: true, role: true } },
      assignedTo: { select: { id: true, nameEn: true, nameAr: true } },
      department: { select: { id: true, nameEn: true, nameAr: true } },
    }

    if (role === 'EMPLOYEE') {
      const goals = await prisma.goal.findMany({
        where: {
          card: { employeeId: session.userId },
        },
        include: goalInclude,
        orderBy: { createdAt: 'desc' },
      })
      return Response.json(goals)
    }

    if (role === 'DEPARTMENT_MANAGER') {
      const goals = await prisma.goal.findMany({
        where: {
          card: { managerId: session.userId },
        },
        include: goalInclude,
        orderBy: { createdAt: 'desc' },
      })
      return Response.json(goals)
    }

    // ADMIN / SUPER_ADMIN — return all goals
    const goals = await prisma.goal.findMany({
      include: goalInclude,
      orderBy: { createdAt: 'desc' },
    })
    return Response.json(goals)
  } catch (error) {
    console.error('[GET /api/goals]', error)
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

    const role = session.role as Role

    const body = await request.json()
    const { cardId, type, titleEn, titleAr, weight, descriptionEn, descriptionAr } = body as {
      cardId: string
      type: GoalType
      titleEn: string
      titleAr: string
      weight: number
      descriptionEn?: string
      descriptionAr?: string
    }

    if (!cardId || !type || !titleEn || !titleAr || weight === undefined) {
      return Response.json(
        { error: 'cardId, type, titleEn, titleAr, and weight are required' },
        { status: 400 }
      )
    }

    if (weight <= 0 || weight > 100) {
      return Response.json({ error: 'weight must be between 1 and 100' }, { status: 400 })
    }

    // Validate type against role permissions
    if (type === 'DEPARTMENT' && !hasPermission(role, 'CREATE_DEPARTMENT_GOAL')) {
      return Response.json(
        { error: 'Forbidden: only managers and admins can create department goals' },
        { status: 403 }
      )
    }

    if (type === 'PERSONAL' && !hasPermission(role, 'CREATE_PERSONAL_GOAL')) {
      // Admins/managers can create personal goals on behalf of employees
      if (!hasPermission(role, 'CREATE_DEPARTMENT_GOAL')) {
        return Response.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    // Fetch the card
    const card = await prisma.performanceCard.findUnique({
      where: { id: cardId },
      include: { department: true },
    })

    if (!card) {
      return Response.json({ error: 'Card not found' }, { status: 404 })
    }

    // EMPLOYEE can only add goals to their own card
    if (role === 'EMPLOYEE' && card.employeeId !== session.userId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    // DEPARTMENT_MANAGER can only add goals to cards they manage
    if (role === 'DEPARTMENT_MANAGER' && card.managerId !== session.userId) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Card must be in GOAL_SETTING stage
    if (card.status !== 'GOAL_SETTING') {
      return Response.json(
        { error: 'Goals can only be added during GOAL_SETTING stage' },
        { status: 400 }
      )
    }

    // Determine goal status and assignedToId
    let goalStatus: 'PENDING_APPROVAL' | 'APPROVED' = 'APPROVED'
    let assignedToId: string | null = null

    if (type === 'PERSONAL' && role === 'EMPLOYEE') {
      goalStatus = 'PENDING_APPROVAL'
      assignedToId = session.userId
    }

    const goal = await prisma.goal.create({
      data: {
        cardId,
        type,
        titleEn,
        titleAr,
        descriptionEn: descriptionEn ?? null,
        descriptionAr: descriptionAr ?? null,
        weight,
        departmentId: type === 'DEPARTMENT' ? card.departmentId : null,
        createdById: session.userId,
        assignedToId,
        goalStatus,
        approvedByManager: goalStatus === 'APPROVED',
        approvalDate: goalStatus === 'APPROVED' ? new Date() : null,
      },
      include: {
        createdBy: { select: { id: true, nameEn: true, nameAr: true, role: true } },
        department: { select: { id: true, nameEn: true, nameAr: true } },
      },
    })

    await createAuditLog({
      action: 'GOAL_CREATED',
      userId: session.userId,
      cardId,
      metadata: { goalId: goal.id, type, titleEn, weight, goalStatus },
    })

    return Response.json(goal, { status: 201 })
  } catch (error) {
    console.error('[POST /api/goals]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
