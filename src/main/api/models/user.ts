import { model, Schema } from 'mongoose';
import { IUser } from '@api/types/IUser';

const usersSchema = new Schema<IUser>({
  username: { type: String, unique: true, required: true },
  email: { type: String, unique: true, sparse: true },
  fullname: String,
  phone: String,
  password: { type: String, required: true },
  salt: { type: String, required: true },
  profilePicture: { type: String, default: 'default.png' },
  isMainAccount: { type: Boolean, default: false },
  type: { type: String, enum: ['USER', 'VENDOR', 'POS'], default: 'USER' },
  status: { type: String, enum: ['active', 'suspended', 'disabled'], default: 'active' },
  role: { type: Schema.Types.ObjectId, ref: 'Role' },
  permissions: [String],
  userPermissions: [String],
  assignedWarehouses: [{ type: Schema.Types.ObjectId, ref: 'Warehouse' }],
  warehouseAccessMode: { type: String, enum: ['all', 'assigned'], default: 'assigned' },
  defaultWarehouse: { type: Schema.Types.ObjectId, ref: 'Warehouse' },
  preferredLanguage: { type: String, default: 'fr' },
  notes: String,
  refreshToken: String,
  lastLogin: Date,
  loginAttempts: { type: Number, default: 0 },
  lockedUntil: Date,
  twoFactorEnabled: { type: Boolean, default: false },
  twoFactorSecret: String,
}, { timestamps: true });

const User = model<IUser>('User', usersSchema);
export default User;
