import { prisma } from './db'
import type { AuditAction } from '../types'

export async function createAuditLog(params: {
  action: AuditAction
  userId: string
  cardId?: string
  metadata?: Record<string, unknown>
  ipAddress?: string
}): Promise<void> {
  await prisma.auditLog.create({
    data: {
      action: params.action,
      userId: params.userId,
      cardId: params.cardId ?? null,
      // Prisma Json fields accept any JSON-serializable value
      metadata: (params.metadata ?? {}) as object,
      ipAddress: params.ipAddress ?? null,
    },
  })
}
