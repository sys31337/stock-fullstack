import { Request } from 'express';

declare interface IsAdminRequest extends Request {
  isAdmin?: boolean;
}

declare interface IUserIdRequest extends Request {
  userId?: string;
  email?: string;
  isAdmin?: boolean;
}
