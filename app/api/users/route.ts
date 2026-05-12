import { cookies } from 'next/headers'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { hasPermission } from '@/lib/permissions'
import { createAuditLog } from '@/lib/audit'
import bcrypt from 'bcryptjs'
import type { Role } from '@/types'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const session = getSession(cookieStore)

    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const role = session.role as Role

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
        select: { id: true, nameEn: true, nameAr: true },
      },
    }

    if (hasPermission(role, 'VIEW_ALL_USERS')) {
      const users = await prisma.user.findMany({
        select: userSelect,
        orderBy: { createdAt: 'desc' },
      })
      return Response.json(users)
    }

    if (role === 'DEPARTMENT_MANAGER') {
      // Return employees in the manager's department
      const manager = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { managedDept: { select: { id: true } }, departmentId: true },
      })

      // managedDept is the dept where they are the manager
      const deptId = manager?.managedDept?.id ?? manager?.departmentId

      if (!deptId) {
        return Response.json([])
      }

      const users = await prisma.user.findMany({
        where: { departmentId: deptId, role: 'EMPLOYEE' },
        select: userSelect,
        orderBy: { nameEn: 'asc' },
      })
      return Response.json(users)
    }

    // EMPLOYEE: return just their own profile
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: userSelect,
    })
    return Response.json(user ? [user] : [])
  } catch (error) {
    console.error('[GET /api/users]', error)
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

    const body = await request.json()
    const { email, nameEn, nameAr, role: targetRole, departmentId, managerId, password } = body as {
      email: string
      nameEn: string
      nameAr: string
      role: Role
      departmentId?: string
      managerId?: string
      password: string
    }

    if (!email || !nameEn || !nameAr || !targetRole || !password) {
      return Response.json(
        { error: 'email, nameEn, nameAr, role, and password are required' },
        { status: 400 }
      )
    }

    // Permission check based on role being created
    const callerRole = session.role as Role

    if (targetRole === 'SUPER_ADMIN') {
      return Response.json({ error: 'Cannot create SUPER_ADMIN via API' }, { status: 403 })
    }

    if (targetRole === 'ADMIN' && !hasPermission(callerRole, 'CREATE_ADMIN')) {
      return Response.json({ error: 'Forbidden: insufficient role to create ADMIN' }, { status: 403 })
    }

    if (
      targetRole === 'DEPARTMENT_MANAGER' &&
      !hasPermission(callerRole, 'CREATE_DEPARTMENT_MANAGER')
    ) {
      return Response.json(
        { error: 'Forbidden: insufficient role to create DEPARTMENT_MANAGER' },
        { status: 403 }
      )
    }

    if (targetRole === 'EMPLOYEE' && !hasPermission(callerRole, 'CREATE_EMPLOYEE')) {
      return Response.json(
        { error: 'Forbidden: insufficient role to create EMPLOYEE' },
        { status: 403 }
      )
    }

    // Check email uniqueness
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return Response.json({ error: 'Email already in use' }, { status: 400 })
    }

    // Validate departmentId if provided
    if (departmentId) {
      const dept = await prisma.department.findUnique({ where: { id: departmentId } })
      if (!dept) {
        return Response.json({ error: 'Department not found' }, { status: 400 })
      }
    }

    // Validate managerId if provided
    if (managerId) {
      const mgr = await prisma.user.findUnique({ where: { id: managerId } })
      if (!mgr) {
        return Response.json({ error: 'Manager not found' }, { status: 400 })
      }
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const user = await prisma.user.create({
      data: {
        email,
        nameEn,
        nameAr,
        role: targetRole,
        password: hashedPassword,
        departmentId: departmentId ?? null,
        managerId: managerId ?? null,
      },
      select: {
        id: true,
        email: true,
        nameEn: true,
        nameAr: true,
        role: true,
        departmentId: true,
        managerId: true,
        createdAt: true,
        updatedAt: true,
        department: { select: { id: true, nameEn: true, nameAr: true } },
        manager: { select: { id: true, nameEn: true, nameAr: true } },
      },
    })

    await createAuditLog({
      action: 'USER_CREATED',
      userId: session.userId,
      metadata: { createdUserId: user.id, email, role: targetRole },
    })

    return Response.json(user, { status: 201 })
  } catch (error) {
    console.error('[POST /api/users]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
