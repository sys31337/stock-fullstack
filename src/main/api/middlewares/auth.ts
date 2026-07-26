import { NextFunction, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '@api/models/user';
import type { IUserIdRequest } from '@api/types/common';
import config from '@api/config';

const { ACCESS_TOKEN_SECRET } = config;

const isSuperAdmin = (user: any): boolean => {
  return !!(user.isMainAccount || user.permissions?.includes('*'));
};

const auth = (req: IUserIdRequest, res: Response, next: NextFunction): NextFunction => {
  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.split(' ')[1] : null;
  if (token == null) {
    return res.sendStatus(401) as unknown as NextFunction;
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
      req.isMainAccount = isSuperAdmin(user);
      req.permissions = user.permissions || [];
      req.userPermissions = user.userPermissions || [];
      req.role = (user.role as any)?._id;
      req.assignedWarehouses = user.assignedWarehouses?.map((w: any) => w._id.toString()) || [];
      req.warehouseAccessMode = user.warehouseAccessMode;
      req.defaultWarehouse = user.defaultWarehouse?.toString();

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
