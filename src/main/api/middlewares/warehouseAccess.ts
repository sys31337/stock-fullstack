import { Response, NextFunction } from 'express';
import { IUserIdRequest } from '@api/types/common';
import User from '@api/models/user';

export const filterByWarehouse = (paramName = 'warehouse') => {
  return async (req: IUserIdRequest, _res: Response, next: NextFunction) => {
    try {
      if (req.isMainAccount) return next();

      const user = await User.findById(req.userId).populate('assignedWarehouses');
      if (!user) return next();

      if (user.warehouseAccessMode === 'all') return next();

      const warehouseIds = user.assignedWarehouses.map((w: any) => w._id.toString());
      if (!warehouseIds.length) return next();

      if (req.query[paramName]) {
        const requestedWarehouse = req.query[paramName] as string;
        if (!warehouseIds.includes(requestedWarehouse)) {
          req.query[paramName] = warehouseIds.join(',');
        }
      } else {
        (req.query as any)[paramName] = warehouseIds.join(',');
      }

      return next();
    } catch (error) {
      return next(error);
    }
  };
};

export const checkWarehouseAccess = (warehouseId: string | undefined, userId: string): Promise<boolean> => {
  return new Promise(async (resolve) => {
    try {
      if (!warehouseId) return resolve(false);
      const user = await User.findById(userId);
      if (!user) return resolve(false);
      if (user.isMainAccount) return resolve(true);
      if (user.warehouseAccessMode === 'all') return resolve(true);
      const warehouseIds = user.assignedWarehouses.map((w: any) => w.toString());
      return resolve(warehouseIds.includes(warehouseId));
    } catch {
      return resolve(false);
    }
  });
};
