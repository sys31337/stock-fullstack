import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/user';

import type { IUserIdRequest } from '../types/common';

const auth = (req: IUserIdRequest, res: Response, next: NextFunction): NextFunction => {
  const authHeader = req.headers.authorization;
  const token = authHeader ? authHeader.split(' ')[1] : null;
  if (token == null) {
    return res.sendStatus(401) as unknown as NextFunction;
  }
  return jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, async (err, decoded) => {
    if (err) return res.sendStatus(403);
    req.email = (decoded as { [key: string]: string }).email;
    req.userId = (decoded as { [key: string]: string }).userId;
    const user = await User.findById((decoded as { [key: string]: string }).userId);
    req.isMainAccount = user.isMainAccount || false;
    req.permissions = user.permissions;
    return next();
  }) as unknown as NextFunction;
};

export { auth };
