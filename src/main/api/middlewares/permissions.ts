import { Response, NextFunction } from 'express';
import { IUserIdRequest } from '@api/types/common';
import User from '@api/models/user';
import Role from '@api/models/role';

const hasPermission = (userPermissions: string[], permission: string): boolean => {
  if (userPermissions.includes('*')) return true;
  return userPermissions.includes(permission);
};

export const requirePermission = (...permissions: string[]) => {
  return async (req: IUserIdRequest, res: Response, next: NextFunction) => {
    try {
      if (req.isMainAccount) return next();

      const user = await User.findById(req.userId);
      if (!user) return res.status(404).send({ message: 'User not found' });

      let effectivePermissions = [...(user.permissions || [])];

      if (user.role) {
        const role = await Role.findById(user.role);
        if (role) {
          effectivePermissions = [...new Set([...effectivePermissions, ...role.permissions])];
        }
      }

      const hasAll = permissions.every((p) => hasPermission(effectivePermissions, p));
      if (!hasAll) {
        return res.status(403).send({ message: 'Insufficient permissions' });
      }

      req.permissions = effectivePermissions;
      return next();
    } catch (error) {
      return next(error);
    }
  };
};

export const requirePOSAccess = () => {
  return async (req: IUserIdRequest, res: Response, next: NextFunction) => {
    try {
      if (req.isMainAccount) return next();

      const user = await User.findById(req.userId);
      if (!user) return res.status(404).send({ message: 'User not found' });

      if (user.type === 'POS') return next();

      let effectivePermissions = [...(user.permissions || [])];
      if (user.role) {
        const role = await Role.findById(user.role);
        if (role) {
          effectivePermissions = [...new Set([...effectivePermissions, ...role.permissions])];
        }
      }

      if (!hasPermission(effectivePermissions, 'pos.access')) {
        return res.status(403).send({ message: 'Insufficient permissions for POS access' });
      }

      req.permissions = effectivePermissions;
      return next();
    } catch (error) {
      return next(error);
    }
  };
};

export const hasModuleAccess = (moduleName: string, action: string) => {
  return async (req: IUserIdRequest, res: Response, next: NextFunction) => {
    try {
      if (req.isMainAccount) return next();

      const user = await User.findById(req.userId);
      if (!user) return res.status(404).send({ message: 'User not found' });

      let effectivePermissions = [...(user.permissions || [])];

      if (user.role) {
        const role = await Role.findById(user.role);
        if (role) {
          effectivePermissions = [...new Set([...effectivePermissions, ...role.permissions])];
        }
      }

      const permission = `${moduleName}.${action}`;
      if (!hasPermission(effectivePermissions, permission)) {
        return res.status(403).send({ message: `Insufficient permissions for ${permission}` });
      }

      req.permissions = effectivePermissions;
      return next();
    } catch (error) {
      return next(error);
    }
  };
};
