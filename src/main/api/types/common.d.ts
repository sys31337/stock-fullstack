import { Request } from 'express';

declare interface IUserIdRequest extends Request {
  userId?: string;
  email?: string;
  isMainAccount?: boolean;
  permissions?: string[];
}
