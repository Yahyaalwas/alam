import { cookies } from 'next/headers'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { hasPermission } from '@/lib/permissions'
import type { Role } from '@/types'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const session = getSession(cookieStore)

    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const role = session.role as Role

    const card = await prisma.performanceCard.findUnique({
      where: { id },
      include: {
        employee: {
          select: {
            id: true,
            nameEn: true,
            nameAr: true,
            email: true,
            role: true,
            departmentId: true,
          },
        },
        manager: {
          select: {
            id: true,
            nameEn: true,
            nameAr: true,
            email: true,
            role: true,
          },
        },
        department: {
          select: { id: true, nameEn: true, nameAr: true, code: true },
        },
        goals: {
          orderBy: { createdAt: 'asc' },
          include: {
            createdBy: { select: { id: true, nameEn: true, nameAr: true, role: true } },
            assignedTo: { select: { id: true, nameEn: true, nameAr: true } },
          },
        },
        competencies: {
          orderBy: { createdAt: 'asc' },
        },
        auditLogs: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            user: { select: { id: true, nameEn: true, nameAr: true, role: true } },
          },
        },
      },
    })

    if (!card) {
      return Response.json({ error: 'Card not found' }, { status: 404 })
    }

    // Access control
    const isEmployee = card.employeeId === session.userId
    const isManager = card.managerId === session.userId
    const isAdmin = hasPermission(role, 'VIEW_ALL_CARDS')

    if (!isEmployee && !isManager && !isAdmin) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    return Response.json(card)
  } catch (error) {
    console.error('[GET /api/performance-cards/[id]]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
