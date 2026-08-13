import { NextFunction, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '@api/models/user';
import type { IUserIdRequest } from '@api/types/common';
import config from '@api/config';

const { ACCESS_TOKEN_SECRET } = config;
const SYNC_TOKEN = process.env.SYNC_TOKEN || process.env.RELAY_TOKEN || 'change-me';

const isSuperAdmin = (user: any): boolean => {
  return !!(user.isMainAccount || user.permissions?.includes('*'));
};

async function populateRequestUser(req: IUserIdRequest, user: any): Promise<void> {
  req.isMainAccount = isSuperAdmin(user);
  req.permissions = user.permissions || [];
  req.userPermissions = user.userPermissions || [];
  req.role = (user.role as any)?._id;
  req.assignedWarehouses = user.assignedWarehouses?.map((w: any) => w._id.toString()) || [];
  req.warehouseAccessMode = user.warehouseAccessMode;
  req.defaultWarehouse = user.defaultWarehouse?.toString();
}

const auth = async (req: IUserIdRequest, res: Response, next: NextFunction): Promise<NextFunction | void> => {
  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.split(' ')[1] : null;
  if (token == null) {
    return res.sendStatus(401) as unknown as NextFunction;
  }

  // Sync requests use a shared sync token instead of a user JWT. They are
  // authorized as the main admin account on the host so business logic and
  // audit logs keep working without requiring matching JWT secrets.
  if (token === SYNC_TOKEN) {
    try {
      const user = await User.findOne({ isMainAccount: true })
        .populate('assignedWarehouses')
        .populate('role');
      if (!user) return res.sendStatus(401) as unknown as NextFunction;
      req.userId = user._id.toString();
      req.email = user.email;
      req.username = user.username;
      await populateRequestUser(req, user);
      return next();
    } catch {
      return res.sendStatus(401) as unknown as NextFunction;
    }
  }

  return jwt.verify(token, ACCESS_TOKEN_SECRET, async (err, decoded) => {
    if (err) return res.sendStatus(403);
    const decodedPayload = decoded as { [key: string]: any };
    req.email = decodedPayload.email;
    req.userId = decodedPayload.userId;
    req.username = decodedPayload.username;
    try {
      const user = await User.findById(req.userId)
        .populate('assignedWarehouses')
        .populate('role');
      if (!user) return res.sendStatus(401);
      await populateRequestUser(req, user);

      if (user.status !== 'active') {
        return res.status(403).send({ message: 'Account is not active' });
      }

      return next();
    } catch {
      return res.sendStatus(401);
    }
  }) as unknown as NextFunction;
};

const isAdmin = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req;
    const user = await User.findById(userId);
    if (!user) return res.status(404).send('USER_NOT_FOUND');
    if (isSuperAdmin(user)) return next();
    return res.status(401).send('NOT_ADMIN');
  } catch (error) {
    return next(error);
  }
};

export { auth, isAdmin };
