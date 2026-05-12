import { cookies } from 'next/headers'
import { getSession } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { hasPermission } from '@/lib/permissions'
import type { Role } from '@/types'

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
    const role = session.role as Role

    const goal = await prisma.goal.findUnique({
      where: { id },
      include: { card: true },
    })

    if (!goal) {
      return Response.json({ error: 'Goal not found' }, { status: 404 })
    }

    const card = goal.card
    const isEmployee = card.employeeId === session.userId
    const isManager = card.managerId === session.userId
    const isAdmin = hasPermission(role, 'VIEW_ALL_CARDS')

    if (!isEmployee && !isManager && !isAdmin) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const {
      selfRating,
      selfComment,
      managerRating,
      managerComment,
      finalRating,
      titleEn,
      titleAr,
      descriptionEn,
      descriptionAr,
      weight,
    } = body as {
      selfRating?: number | null
      selfComment?: string | null
      managerRating?: number | null
      managerComment?: string | null
      finalRating?: number | null
      titleEn?: string
      titleAr?: string
      descriptionEn?: string | null
      descriptionAr?: string | null
      weight?: number
    }

    const updateData: Record<string, unknown> = {}

    // Self ratings: only employee in SELF_REVIEW or GOAL_SETTING
    if (selfRating !== undefined || selfComment !== undefined) {
      if (!isEmployee && !isAdmin) {
        return Response.json(
          { error: 'Forbidden: only employees can update self ratings' },
          { status: 403 }
        )
      }
      if (card.status !== 'SELF_REVIEW' && card.status !== 'GOAL_SETTING') {
        return Response.json(
          { error: 'Self ratings can only be updated in GOAL_SETTING or SELF_REVIEW stages' },
          { status: 400 }
        )
      }
      if (selfRating !== undefined) {
        if (selfRating !== null && (selfRating < 1 || selfRating > 5)) {
          return Response.json({ error: 'selfRating must be between 1 and 5' }, { status: 400 })
        }
        updateData.selfRating = selfRating
      }
      if (selfComment !== undefined) updateData.selfComment = selfComment
    }

    // Manager ratings: only manager/admin in MANAGER_REVIEW or CALIBRATION_MEETING
    if (managerRating !== undefined || managerComment !== undefined) {
      if (!isManager && !isAdmin) {
        return Response.json(
          { error: 'Forbidden: only managers can update manager ratings' },
          { status: 403 }
        )
      }
      if (card.status !== 'MANAGER_REVIEW' && card.status !== 'CALIBRATION_MEETING') {
        return Response.json(
          { error: 'Manager ratings can only be updated in MANAGER_REVIEW or CALIBRATION_MEETING stages' },
          { status: 400 }
        )
      }
      if (managerRating !== undefined) {
        if (managerRating !== null && (managerRating < 1 || managerRating > 5)) {
          return Response.json({ error: 'managerRating must be between 1 and 5' }, { status: 400 })
        }
        updateData.managerRating = managerRating
      }
      if (managerComment !== undefined) updateData.managerComment = managerComment
    }

    // Final ratings: only manager/admin in CALIBRATION_MEETING
    if (finalRating !== undefined) {
      if (!isManager && !isAdmin) {
        return Response.json(
          { error: 'Forbidden: only managers can update final ratings' },
          { status: 403 }
        )
      }
      if (card.status !== 'CALIBRATION_MEETING') {
        return Response.json(
          { error: 'Final ratings can only be updated in CALIBRATION_MEETING stage' },
          { status: 400 }
        )
      }
      if (finalRating !== null && (finalRating < 1 || finalRating > 5)) {
        return Response.json({ error: 'finalRating must be between 1 and 5' }, { status: 400 })
      }
      updateData.finalRating = finalRating
    }

    // Metadata updates (title, description, weight): manager/admin only in GOAL_SETTING
    if (
      titleEn !== undefined ||
      titleAr !== undefined ||
      descriptionEn !== undefined ||
      descriptionAr !== undefined ||
      weight !== undefined
    ) {
      if (!isManager && !isAdmin) {
        return Response.json(
          { error: 'Forbidden: only managers can update goal metadata' },
          { status: 403 }
        )
      }
      if (card.status !== 'GOAL_SETTING') {
        return Response.json(
          { error: 'Goal metadata can only be updated in GOAL_SETTING stage' },
          { status: 400 }
        )
      }
      if (titleEn !== undefined) updateData.titleEn = titleEn
      if (titleAr !== undefined) updateData.titleAr = titleAr
      if (descriptionEn !== undefined) updateData.descriptionEn = descriptionEn
      if (descriptionAr !== undefined) updateData.descriptionAr = descriptionAr
      if (weight !== undefined) {
        if (weight <= 0 || weight > 100) {
          return Response.json({ error: 'weight must be between 1 and 100' }, { status: 400 })
        }
        updateData.weight = weight
      }
    }

    if (Object.keys(updateData).length === 0) {
      return Response.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const updated = await prisma.goal.update({
      where: { id },
      data: updateData,
    })

    return Response.json(updated)
  } catch (error) {
    console.error('[PATCH /api/goals/[id]]', error)
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

    const { id } = await params

    const goal = await prisma.goal.findUnique({
      where: { id },
      include: { card: true },
    })

    if (!goal) {
      return Response.json({ error: 'Goal not found' }, { status: 404 })
    }

    // Only the creator can delete, and only if PENDING_APPROVAL
    if (goal.createdById !== session.userId) {
      return Response.json({ error: 'Forbidden: only the creator can delete a goal' }, { status: 403 })
    }

    if (goal.goalStatus !== 'PENDING_APPROVAL') {
      return Response.json(
        { error: 'Only goals with PENDING_APPROVAL status can be deleted' },
        { status: 400 }
      )
    }

    await prisma.goal.delete({ where: { id } })

    return Response.json({ ok: true })
  } catch (error) {
    console.error('[DELETE /api/goals/[id]]', error)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
