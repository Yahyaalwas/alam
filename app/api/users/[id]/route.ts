import { cookies } from 'next/headers'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { hasPermission } from '@/lib/permissions'
import { createAuditLog } from '@/lib/audit'
import type { Role } from '@/types'

const userSelect = {
  id: true,
  email: true,
  nameEn: true,
  nameAr: true,
  role: true,
  departmentId: true,
  managerId: true,
  createdAt: true,
  updatedAt: true,
  department: {
    select: { id: true, nameEn: true, nameAr: true, code: true },
  },
  manager: {
    select: { id: true, nameEn: true, nameAr: true, role: true },
  },
  directReports: {
    select: { id: true, nameEn: true, nameAr: true, role: true },
  },
  managedDept: {
    select: { id: true, nameEn: true, nameAr: true, code: true },
  },
}

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

    // Only admin/super-admin can view any user; managers can view their dept employees;
    // employees can only view themselves
    if (
      !hasPermission(role, 'VIEW_ALL_USERS') &&
      session.userId !== id
    ) {
      if (role === 'DEPARTMENT_MANAGER') {
        // Allow manager to view their department employees
        const targetUser = await prisma.user.findUnique({
          where: { id },
          select: { departmentId: true },
        })
        const managerUser = await prisma.user.findUnique({
          where: { id: session.userId },
          select: { managedDept: { select: { id: true } } },
        })
        if (!targetUser || targetUser.departmentId !== managerUser?.managedDept?.id) {
          return Response.json({ error: 'Forbidden' }, { status: 403 })
        }
      } else {
        return Response.json({ error: 'Forbidden' }, { status: 403 })
      }
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: userSelect,
    })

    if (!user) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    return Response.json(user)
  } catch (error) {
    console.error('[GET /api/users/[id]]', error)
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

    const { id } = await params
    const callerRole = session.role as Role

    // Determine if caller can update this user
    const isAdmin = hasPermission(callerRole, 'VIEW_ALL_USERS')
    let canUpdate = isAdmin || session.userId === id

    if (!canUpdate && callerRole === 'DEPARTMENT_MANAGER') {
      // Manager can update employees in their department
      const targetUser = await prisma.user.findUnique({
        where: { id },
        select: { departmentId: true, role: true },
      })
      const managerUser = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { managedDept: { select: { id: true } } },
      })
      if (
        targetUser &&
        targetUser.role === 'EMPLOYEE' &&
        targetUser.departmentId === managerUser?.managedDept?.id
      ) {
        canUpdate = true
      }
    }

    if (!canUpdate) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const existingUser = await prisma.user.findUnique({ where: { id } })
    if (!existingUser) {
      return Response.json({ error: 'User not found' }, { status: 404 })
    }

    const body = await request.json()
    const { nameEn, nameAr, email, departmentId, managerId, role: newRole } = body as {
      nameEn?: string
      nameAr?: string
      email?: string
      departmentId?: string | null
      managerId?: string | null
      role?: Role
    }

    // Only admins can change roles
    if (newRole !== undefined && !isAdmin) {
      return Response.json({ error: 'Forbidden: only admins can change roles' }, { status: 403 })
    }

    // Check email uniqueness if changing
    if (email && email !== existingUser.email) {
      const conflict = await prisma.user.findUnique({ where: { email } })
      if (conflict) {
        return Response.json({ error: 'Email already in use' }, { status: 400 })
      }
    }

    const updated = await prisma.user.update({
      where: { id },
      data: {
        ...(nameEn !== undefined && { nameEn }),
        ...(nameAr !== undefined && { nameAr }),
        ...(email !== undefined && { email }),
        ...(departmentId !== undefined && { departmentId }),
        ...(managerId !== undefined && { managerId }),
        ...(newRole !== undefined && isAdmin && { role: newRole }),
      },
      select: userSelect,
    })

    await createAuditLog({
      action: 'USER_UPDATED',
      userId: session.userId,
      metadata: { updatedUserId: id, changes: body },
    })

    return Response.json(updated)
  } catch (error) {
    console.error('[PATCH /api/users/[id]]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
