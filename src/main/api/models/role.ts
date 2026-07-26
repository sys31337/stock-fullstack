import { model, Schema } from 'mongoose';
import { IRole } from '@api/types/IRole';

const roleSchema = new Schema<IRole>({
  name: { type: String, required: true, unique: true },
  description: String,
  permissions: [{ type: String }],
  isDefault: { type: Boolean, default: false },
}, { timestamps: true });

const Role = model<IRole>('Role', roleSchema);
export default Role;
