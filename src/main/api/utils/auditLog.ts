import AuditLog from '@api/models/auditLog';

interface AuditLogInput {
  action: string;
  resource: string;
  resourceId?: string;
  details?: string;
  metadata?: Record<string, unknown>;
}

export const createAuditLog = async (
  req: any,
  input: AuditLogInput,
): Promise<void> => {
  try {
    const ip = req?.headers?.['x-forwarded-for'] as string || req?.socket?.remoteAddress || undefined;
    const userAgent = req?.headers?.['user-agent'] as string || undefined;
    const username = req?.username || undefined;

    await AuditLog.create({
      ...input,
      userId: req?.userId || undefined,
      username,
      ip,
      userAgent,
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
  }
};
