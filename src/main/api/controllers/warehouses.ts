import { Response, NextFunction } from 'express';
import Warehouse from '@api/models/warehouse';
import { IUserIdRequest } from '@api/types/common';
import { createAuditLog } from '@api/utils/auditLog';

const DEFAULT_WAREHOUSE_ID = '0a0aaa0a0aa00000aaaaaa0b';

const getAll = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const filter: any = {};
    if (!req.isMainAccount && req.assignedWarehouses?.length) {
      filter._id = { $in: req.assignedWarehouses };
    }
    const warehouses = await Warehouse.find(filter).populate('manager', 'fullname username email');
    return res.status(200).send(warehouses);
  } catch (error) {
    return next(error);
  }
};

const getById = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const warehouse = await Warehouse.findById(req.params.id).populate('manager', 'fullname username email');
    if (!warehouse) return res.status(404).send({ message: 'Warehouse not found' });
    return res.status(200).send(warehouse);
  } catch (error) {
    return next(error);
  }
};

const create = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const warehouse = await new Warehouse(req.body).save();
    await createAuditLog(req, {
      action: 'create',
      resource: 'warehouse',
      resourceId: warehouse._id.toString(),
      details: `Created warehouse: ${warehouse.name}`,
    });
    return res.status(201).send(warehouse);
  } catch (error) {
    return next(error);
  }
};

const update = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    if (req.params.id === DEFAULT_WAREHOUSE_ID) {
      return res.status(403).send({ message: 'Cannot edit the default warehouse' });
    }
    const warehouse = await Warehouse.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!warehouse) return res.status(404).send({ message: 'Warehouse not found' });
    await createAuditLog(req, {
      action: 'edit',
      resource: 'warehouse',
      resourceId: warehouse._id.toString(),
      details: `Updated warehouse: ${warehouse.name}`,
    });
    return res.status(200).send(warehouse);
  } catch (error) {
    return next(error);
  }
};

const remove = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    if (req.params.id === DEFAULT_WAREHOUSE_ID) {
      return res.status(403).send({ message: 'Cannot delete the default warehouse' });
    }
    const warehouse = await Warehouse.findByIdAndDelete(req.params.id);
    if (!warehouse) return res.status(404).send({ message: 'Warehouse not found' });
    await createAuditLog(req, {
      action: 'delete',
      resource: 'warehouse',
      resourceId: req.params.id,
      details: `Deleted warehouse: ${warehouse.name}`,
    });
    return res.status(200).send({ success: true });
  } catch (error) {
    return next(error);
  }
};

export { getAll, getById, create, update, remove };
