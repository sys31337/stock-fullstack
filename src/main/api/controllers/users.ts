import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '@api/models/user';
import Role from '@api/models/role';
import { parseJwt } from '@api/utils';
import { IUserIdRequest } from '@api/types/common';
import { USERLOGGEDOUT, USERNOTALLOWED } from '@api/constants/users';
import config from '@api/config';
import { createAuditLog } from '@api/utils/auditLog';

const { REFRESH_TOKEN_SECRET, ACCESS_TOKEN_SECRET } = config;

const refreshUserToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.sendStatus(401);
    }
    const user = await User.findOne({ refreshToken });
    if (!user) return res.status(403).send(USERNOTALLOWED);
    return jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, async (err: jwt.VerifyErrors | null, _decoded: string | jwt.JwtPayload | undefined) => {
      if (err) {
        return res.sendStatus(403);
      }
      const {
        _id: userId, fullname, profilePicture, email, username, permissions,
      } = user;
      const accessToken = jwt.sign({
        userId, fullname, profilePicture, email, username, permissions,
      }, ACCESS_TOKEN_SECRET, {
        expiresIn: '1d',
      });
      const newRefreshToken = jwt.sign({
        userId, fullname, profilePicture, email, username, permissions,
      }, REFRESH_TOKEN_SECRET, {
        expiresIn: '90d',
      });
      await User.findByIdAndUpdate(userId, { refreshToken: newRefreshToken });
      return res.status(200).send({ refreshToken: newRefreshToken, accessToken });
    });
  } catch (error) {
    return next(error);
  }
};

const createAccount = async (req: Request, res: Response, next: NextFunction) => {
  const {
    username, phone, email, fullname, password,
  } = req.body;

  const salt = await bcrypt.genSalt();
  const hashPassword = await bcrypt.hash(password, salt);

  const userPayload: any = {
    username,
    ...(email ? { email } : {}),
    fullname,
    phone,
    password: hashPassword,
    salt,
  };

  try {
    const user = await new User(userPayload).save();
    return res.status(200).send(user);
  } catch (error) {
    return next(error);
  }
};

const getCurrentUser = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const { userId } = req;
    const user = await User.findById(userId)
      .select('-refreshToken -password -salt -twoFactorSecret')
      .populate('role', 'name permissions')
      .populate('assignedWarehouses', 'name code')
      .populate('defaultWarehouse', 'name code');
    return res.status(200).send(user);
  } catch (error) {
    return next(error);
  }
};

const updateUser = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const {
      body: {
        profile_picture, fullname, password,
      },
      userId,
    } = req;

    const body: any = {
      profile_picture, fullname,
    };

    let payload: { [key: string]: any };

    if (password) {
      const salt = await bcrypt.genSalt();
      const hashPassword = await bcrypt.hash(password, salt);

      payload = {
        salt,
        password: hashPassword,
      };
    } else {
      payload = body;
    }

    const update = await User.findByIdAndUpdate(userId, payload);
    if (!update) return res.sendStatus(404);

    const {
      email, profilePicture, refreshToken: currentRefreshToken,
    } = update;

    const accessToken = jwt.sign({
      userId, fullname, profilePicture, email,
    }, ACCESS_TOKEN_SECRET, {
      expiresIn: '1d',
    });

    let refreshToken;
    if (currentRefreshToken) {
      const { exp } = parseJwt(currentRefreshToken);
      const curTime = Math.ceil(Date.now() / 1000);
      if (curTime > exp) {
        refreshToken = jwt.sign({
          userId, fullname, profilePicture, email,
        }, REFRESH_TOKEN_SECRET, {
          expiresIn: '90d',
        });
      } else {
        refreshToken = currentRefreshToken;
      }
    } else {
      refreshToken = jwt.sign({
        userId, fullname, profilePicture, email,
      }, REFRESH_TOKEN_SECRET, {
        expiresIn: '90d',
      });
    }

    await User.findByIdAndUpdate(userId, { refreshToken });
    return res.status(200).send({ refreshToken, accessToken });
  } catch (error) {
    return next(error);
  }
};

const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
      await createAuditLog(req as any, {
        action: 'login_failed',
        resource: 'user',
        details: `Failed login attempt for user: ${username}`,
      });
      return res.sendStatus(404);
    }

    if (user.status !== 'active') {
      await createAuditLog(req as any, {
        action: 'login_blocked',
        resource: 'user',
        resourceId: user._id.toString(),
        details: `Blocked login attempt for ${username}: account ${user.status}`,
      });
      return res.status(403).send({ message: `Account is ${user.status}` });
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      return res.status(423).send({ message: 'Account is temporarily locked' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      user.loginAttempts = (user.loginAttempts || 0) + 1;
      if (user.loginAttempts >= 5) {
        user.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
      }
      await user.save();

      await createAuditLog(req as any, {
        action: 'login_failed',
        resource: 'user',
        resourceId: user._id.toString(),
        details: `Wrong password for ${username} (attempt ${user.loginAttempts})`,
      });
      return res.status(400).send({ message: 'Wrong Password' });
    }

    const {
      _id: userId, fullname, profilePicture, refreshToken: currentRefreshToken,
      permissions, email, role, assignedWarehouses, warehouseAccessMode, defaultWarehouse,
    } = user;

    let effectivePermissions = [...(permissions || [])];
    if (role) {
      const roleDoc = await Role.findById(role);
      if (roleDoc) {
        effectivePermissions = [...new Set([...effectivePermissions, ...roleDoc.permissions])];
      }
    }

    const accessToken = jwt.sign({
      userId, fullname, profilePicture, username, permissions: effectivePermissions,
    }, ACCESS_TOKEN_SECRET, {
      expiresIn: '1d',
    });

    let refreshToken;
    if (currentRefreshToken) {
      const { exp } = parseJwt(currentRefreshToken);
      const curTime = Math.ceil(Date.now() / 1000);
      if (curTime > exp) {
        refreshToken = jwt.sign({
          userId, fullname, profilePicture, username, permissions: effectivePermissions,
        }, REFRESH_TOKEN_SECRET, {
          expiresIn: '90d',
        });
      } else {
        refreshToken = currentRefreshToken;
      }
    } else {
      refreshToken = jwt.sign({
        userId, fullname, profilePicture, username, permissions: effectivePermissions,
      }, REFRESH_TOKEN_SECRET, {
        expiresIn: '90d',
      });
    }

    user.loginAttempts = 0;
    user.lockedUntil = undefined;
    user.lastLogin = new Date();
    await User.findByIdAndUpdate(userId, { refreshToken, loginAttempts: 0, lockedUntil: undefined, lastLogin: new Date() });

    await createAuditLog(req as any, {
      action: 'login',
      resource: 'user',
      resourceId: userId?.toString(),
      details: `User logged in: ${username}`,
    });

    return res.status(200).send({
      refreshToken,
      accessToken,
      user: {
        userId, fullname, profilePicture, username, email,
        permissions: effectivePermissions,
        assignedWarehouses, warehouseAccessMode, defaultWarehouse,
        role,
      },
    });
  } catch (error) {
    return next(error);
  }
};

const logout = async (req: Request, res: Response) => {
  const { token: refreshToken } = req.headers;
  if (!refreshToken) {
    return res.status(204).send({ message: USERLOGGEDOUT });
  }
  const user = await User.find({ refreshToken });
  if (!user) return res.status(204).send({ message: USERLOGGEDOUT });
  const userId = user[0].id;
  await User.findByIdAndUpdate(userId, { refresh_token: null });
  res.clearCookie('refreshToken');

  await createAuditLog(req as any, {
    action: 'logout',
    resource: 'user',
    resourceId: userId?.toString(),
    details: 'User logged out',
  });

  return res.sendStatus(200);
};

const getAllUsers = async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await User.find().select('username fullname profilePicture');
    return res.status(200).send(users);
  } catch (error) {
    return next(error);
  }
};

export {
  refreshUserToken, createAccount, login, logout, getCurrentUser, updateUser, getAllUsers,
};
