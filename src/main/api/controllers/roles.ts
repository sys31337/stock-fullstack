import { Response, NextFunction } from 'express';
import Role from '@api/models/role';
import User from '@api/models/user';
import { IUserIdRequest } from '@api/types/common';
import { createAuditLog } from '@api/utils/auditLog';
import { ALL_PERMISSIONS, MODULES } from '@api/constants/permissions';

const getAll = async (_req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const roles = await Role.find().sort('-createdAt');
    return res.status(200).send(roles);
  } catch (error) {
    return next(error);
  }
};

const getById = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const role = await Role.findById(req.params.id);
    if (!role) return res.status(404).send({ message: 'Role not found' });
    return res.status(200).send(role);
  } catch (error) {
    return next(error);
  }
};

const create = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const role = await new Role(req.body).save();
    await createAuditLog(req, {
      action: 'create',
      resource: 'role',
      resourceId: role._id.toString(),
      details: `Created role: ${role.name}`,
    });
    return res.status(201).send(role);
  } catch (error) {
    return next(error);
  }
};

const update = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const role = await Role.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!role) return res.status(404).send({ message: 'Role not found' });
    await createAuditLog(req, {
      action: 'edit',
      resource: 'role',
      resourceId: role._id.toString(),
      details: `Updated role: ${role.name}`,
    });
    return res.status(200).send(role);
  } catch (error) {
    return next(error);
  }
};

const remove = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const usersWithRole = await User.countDocuments({ role: req.params.id });
    if (usersWithRole > 0) {
      return res.status(400).send({ message: `Cannot delete role: ${usersWithRole} user(s) are assigned to it` });
    }
    const role = await Role.findByIdAndDelete(req.params.id);
    if (!role) return res.status(404).send({ message: 'Role not found' });
    await createAuditLog(req, {
      action: 'delete',
      resource: 'role',
      resourceId: req.params.id,
      details: `Deleted role: ${role.name}`,
    });
    return res.status(200).send({ success: true });
  } catch (error) {
    return next(error);
  }
};

const PREDEFINED_ROLES = [
  {
    name: 'Super Administrator',
    description: 'Full access to all system features',
    permissions: ['*'],
    isDefault: true,
  },
  {
    name: 'Administrator',
    description: 'Full access except critical system settings',
    permissions: ALL_PERMISSIONS.filter((p) => p !== 'settings.edit' && !p.startsWith('roles.')),
  },
  {
    name: 'Warehouse Manager',
    description: 'Manages stock, purchases, transfers, inventory counts',
    permissions: [
      'dashboard.view',
      'products.view', 'products.create', 'products.edit',
      'categories.view', 'categories.create', 'categories.edit',
      'purchases.view', 'purchases.create', 'purchases.edit', 'purchases.approve', 'purchases.print', 'purchases.export',
      'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.export',
      'warehouses.view',
      'transfers.view', 'transfers.create', 'transfers.edit', 'transfers.approve',
      'orders.view', 'orders.create', 'orders.edit', 'orders.print',
      'deliveries.view', 'deliveries.create', 'deliveries.edit', 'deliveries.print',
      'reports.view', 'reports.export',
      'suppliers.view', 'suppliers.create', 'suppliers.edit',
    ],
  },
  {
    name: 'Store Manager',
    description: 'Manages one or more assigned stores, sales, purchases, reports',
    permissions: [
      'dashboard.view',
      'products.view', 'products.edit',
      'customers.view', 'customers.create', 'customers.edit',
      'sales.view', 'sales.create', 'sales.edit', 'sales.approve', 'sales.cancel', 'sales.print', 'sales.export',
      'purchases.view', 'purchases.create', 'purchases.print',
      'inventory.view',
      'reports.view', 'reports.export', 'reports.print',
      'orders.view', 'orders.create', 'orders.print',
      'deliveries.view', 'deliveries.create', 'deliveries.print',
      'categories.view',
    ],
  },
  {
    name: 'Inventory Clerk',
    description: 'Receives goods, adjusts stock, performs inventory counts',
    permissions: [
      'products.view',
      'categories.view',
      'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.export', 'inventory.print',
      'purchases.view', 'purchases.create', 'purchases.print',
      'warehouses.view',
      'orders.view',
      'deliveries.view',
    ],
  },
  {
    name: 'Purchasing Officer',
    description: 'Suppliers, purchase orders, bon de réception',
    permissions: [
      'dashboard.view',
      'suppliers.view', 'suppliers.create', 'suppliers.edit',
      'categories.view',
      'purchases.view', 'purchases.create', 'purchases.edit', 'purchases.approve', 'purchases.cancel', 'purchases.print',
      'orders.view', 'orders.create', 'orders.print',
      'products.view',
      'reports.view',
    ],
  },
  {
    name: 'Sales Manager',
    description: 'Sales, customers, pricing, sales reports',
    permissions: [
      'dashboard.view',
      'sales.view', 'sales.create', 'sales.edit', 'sales.approve', 'sales.cancel', 'sales.print', 'sales.export',
      'customers.view', 'customers.create', 'customers.edit',
      'products.view', 'products.edit',
      'categories.view',
      'reports.view', 'reports.export', 'reports.print',
      'deliveries.view', 'deliveries.create', 'deliveries.print',
      'orders.view',
    ],
  },
  {
    name: 'Cashier / Salesperson',
    description: 'Create sales only, no price or stock edits',
    permissions: [
      'sales.view', 'sales.create', 'sales.print',
      'customers.view', 'customers.create',
      'products.view',
      'dashboard.view',
    ],
  },
  {
    name: 'Accountant',
    description: 'Payments, expenses, financial reports',
    permissions: [
      'dashboard.view',
      'purchases.view', 'purchases.print', 'purchases.export',
      'sales.view', 'sales.print', 'sales.export',
      'reports.view', 'reports.export', 'reports.print',
      'products.view',
          'customers.view',
      'suppliers.view',
    ],
  },
  {
    name: 'Auditor',
    description: 'Read-only access to everything, including logs and reports',
    permissions: MODULES.flatMap((m) => [`${m}.view`, `${m}.export`, `${m}.print`]).filter((p) => {
      const mod = p.split('.')[0];
      return !['settings', 'roles'].includes(mod) || p === 'roles.view';
    }),
  },
];

const seedRoles = async (_req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const results: { name: string; status: string }[] = [];
    for (const roleData of PREDEFINED_ROLES) {
      const existing = await Role.findOne({ name: roleData.name });
      if (existing) {
        existing.permissions = roleData.permissions;
        existing.description = roleData.description;
        existing.isDefault = roleData.isDefault ?? false;
        await existing.save();
        results.push({ name: roleData.name, status: 'updated' });
      } else {
        await new Role(roleData).save();
        results.push({ name: roleData.name, status: 'created' });
      }
    }
    return res.status(200).send({ message: 'Roles seeded successfully', results });
  } catch (error) {
    return next(error);
  }
};

export { getAll, getById, create, update, remove, seedRoles };
