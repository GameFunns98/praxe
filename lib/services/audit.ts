import { prisma } from '@/lib/prisma';

export async function logAudit(actorUserId: string | null, entityType: string, entityId: string, action: string, beforeJson?: unknown, afterJson?: unknown) {
  await prisma.auditLog.create({
    data: {
      actorUserId,
      entityType,
      entityId,
      action,
      beforeJson: beforeJson as object | undefined,
      afterJson: afterJson as object | undefined
    }
  });
}
