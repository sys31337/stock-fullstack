import { Request } from 'express';
import { ObjectId } from 'mongoose';

declare interface IUserIdRequest extends Request {
  userId?: string;
  email?: string;
  username?: string;
  isMainAccount?: boolean;
  permissions?: string[];
  userPermissions?: string[];
  role?: ObjectId;
  assignedWarehouses?: string[];
  warehouseAccessMode?: 'all' | 'assigned';
  defaultWarehouse?: string;
}
