import { model, Schema } from 'mongoose';
import { IAuditLog } from '@api/types/IAuditLog';

const auditLogSchema = new Schema<IAuditLog>({
  action: { type: String, required: true, index: true },
  resource: { type: String, required: true, index: true },
  resourceId: String,
  userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
  username: String,
  details: String,
  ip: String,
  userAgent: String,
  metadata: { type: Schema.Types.Mixed },
}, { timestamps: true });

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ resource: 1, action: 1 });

const AuditLog = model<IAuditLog>('AuditLog', auditLogSchema);
export default AuditLog;
