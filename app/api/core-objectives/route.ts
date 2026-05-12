import { cookies } from 'next/headers'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import type { Role } from '@/types'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const session = getSession(cookieStore)
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const objectives = await prisma.coreObjective.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    })
    return Response.json(objectives)
  } catch (error) {
    console.error('[GET /api/core-objectives]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const session = getSession(cookieStore)
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const role = session.role as Role
    if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { titleEn, titleAr, weight, order } = body as {
      titleEn: string
      titleAr: string
      weight: number
      order?: number
    }

    if (!titleEn || !titleAr || weight === undefined) {
      return Response.json({ error: 'titleEn, titleAr, and weight are required' }, { status: 400 })
    }
    if (weight <= 0 || weight > 100) {
      return Response.json({ error: 'weight must be between 1 and 100' }, { status: 400 })
    }

    const count = await prisma.coreObjective.count({ where: { isActive: true } })
    if (count >= 10) {
      return Response.json({ error: 'Maximum 10 active core objectives allowed' }, { status: 400 })
    }

    const nextOrder = order ?? count
    const objective = await prisma.coreObjective.create({
      data: { titleEn, titleAr, weight, order: nextOrder, isActive: true },
    })
    return Response.json(objective, { status: 201 })
  } catch (error) {
    console.error('[POST /api/core-objectives]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
