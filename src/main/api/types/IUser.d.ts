import { ObjectId } from "mongoose";

export interface IUser {
  username: string;
  email: string;
  fullname?: string;
  phone?: string;
  password: string;
  salt: string;
  profilePicture: string;
  isMainAccount: boolean;
  type: 'USER' | 'VENDOR' | 'POS';
  status: 'active' | 'suspended' | 'disabled';
  role?: ObjectId;
  permissions: string[];
  userPermissions: string[];
  assignedWarehouses: ObjectId[];
  warehouseAccessMode: 'all' | 'assigned';
  defaultWarehouse?: ObjectId;
  preferredLanguage: string;
  notes?: string;
  refreshToken: string;
  lastLogin?: Date;
  loginAttempts: number;
  lockedUntil?: Date;
  twoFactorEnabled: boolean;
  twoFactorSecret?: string;
}
