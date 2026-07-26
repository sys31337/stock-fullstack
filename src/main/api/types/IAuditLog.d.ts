import { ObjectId } from "mongoose";

export interface IAuditLog {
  action: string;
  resource: string;
  resourceId?: string;
  userId?: ObjectId;
  username?: string;
  details?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}
