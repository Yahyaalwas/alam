import { cookies } from 'next/headers'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import type { Role } from '@/types'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies()
    const session = getSession(cookieStore)
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const role = session.role as Role
    if (role !== 'SUPER_ADMIN' && role !== 'ADMIN') {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { titleEn, titleAr, weight, order, isActive } = body as {
      titleEn?: string
      titleAr?: string
      weight?: number
      order?: number
      isActive?: boolean
    }

    const objective = await prisma.coreObjective.findUnique({ where: { id } })
    if (!objective) return Response.json({ error: 'Not found' }, { status: 404 })

    const updated = await prisma.coreObjective.update({
      where: { id },
      data: {
        ...(titleEn !== undefined && { titleEn }),
        ...(titleAr !== undefined && { titleAr }),
        ...(weight !== undefined && { weight }),
        ...(order !== undefined && { order }),
        ...(isActive !== undefined && { isActive }),
      },
    })
    return Response.json(updated)
  } catch (error) {
    console.error('[PATCH /api/core-objectives/[id]]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const cookieStore = await cookies()
    const session = getSession(cookieStore)
    if (!session) return Response.json({ error: 'Unauthorized' }, { status: 401 })

    const role = session.role as Role
    if (role !== 'SUPER_ADMIN') {
      return Response.json({ error: 'Only SUPER_ADMIN can delete core objectives' }, { status: 403 })
    }

    const { id } = await params
    await prisma.coreObjective.delete({ where: { id } })
    return new Response(null, { status: 204 })
  } catch (error) {
    console.error('[DELETE /api/core-objectives/[id]]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
