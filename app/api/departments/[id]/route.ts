import { cookies } from 'next/headers'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { hasPermission } from '@/lib/permissions'
import { createAuditLog } from '@/lib/audit'
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

    const department = await prisma.department.findUnique({
      where: { id },
      include: {
        manager: {
          select: {
            id: true,
            nameEn: true,
            nameAr: true,
            email: true,
            role: true,
            departmentId: true,
          },
        },
        employees: {
          select: {
            id: true,
            nameEn: true,
            nameAr: true,
            email: true,
            role: true,
            managerId: true,
            createdAt: true,
          },
          orderBy: { nameEn: 'asc' },
        },
        cards: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: {
            employee: {
              select: { id: true, nameEn: true, nameAr: true },
            },
          },
        },
      },
    })

    if (!department) {
      return Response.json({ error: 'Department not found' }, { status: 404 })
    }

    // Access control: only admin/super-admin or the dept manager can view
    const role = session.role as Role
    const isDeptManager = department.managerId === session.userId
    if (!hasPermission(role, 'VIEW_ALL_DEPARTMENTS') && !isDeptManager) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    return Response.json(department)
  } catch (error) {
    console.error('[GET /api/departments/[id]]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const session = getSession(cookieStore)

    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!hasPermission(session.role as Role, 'MANAGE_DEPARTMENT')) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    const existing = await prisma.department.findUnique({ where: { id } })
    if (!existing) {
      return Response.json({ error: 'Department not found' }, { status: 404 })
    }

    const body = await request.json()
    const { nameEn, nameAr, code, managerId } = body as {
      nameEn?: string
      nameAr?: string
      code?: string
      managerId?: string | null
    }

    // Check code uniqueness if changing
    if (code && code !== existing.code) {
      const codeConflict = await prisma.department.findUnique({ where: { code } })
      if (codeConflict) {
        return Response.json({ error: 'Department code already exists' }, { status: 400 })
      }
    }

    // Validate new manager if provided
    if (managerId) {
      const manager = await prisma.user.findUnique({ where: { id: managerId } })
      if (!manager) {
        return Response.json({ error: 'Manager not found' }, { status: 400 })
      }
    }

    const updated = await prisma.department.update({
      where: { id },
      data: {
        ...(nameEn !== undefined && { nameEn }),
        ...(nameAr !== undefined && { nameAr }),
        ...(code !== undefined && { code }),
        ...(managerId !== undefined && { managerId }),
      },
      include: {
        manager: {
          select: { id: true, nameEn: true, nameAr: true, email: true, role: true },
        },
      },
    })

    return Response.json(updated)
  } catch (error) {
    console.error('[PATCH /api/departments/[id]]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const cookieStore = await cookies()
    const session = getSession(cookieStore)

    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!hasPermission(session.role as Role, 'CREATE_DEPARTMENT') || session.role !== 'SUPER_ADMIN') {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    const department = await prisma.department.findUnique({
      where: { id },
      include: { _count: { select: { employees: true } } },
    })

    if (!department) {
      return Response.json({ error: 'Department not found' }, { status: 404 })
    }

    if (department._count.employees > 0) {
      return Response.json(
        { error: 'Cannot delete department with employees. Reassign employees first.' },
        { status: 400 }
      )
    }

    await prisma.department.delete({ where: { id } })

    await createAuditLog({
      action: 'DEPARTMENT_CREATED', // closest available action for audit trail
      userId: session.userId,
      metadata: { departmentId: id, action: 'DELETED', nameEn: department.nameEn },
    })

    return Response.json({ ok: true })
  } catch (error) {
    console.error('[DELETE /api/departments/[id]]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
