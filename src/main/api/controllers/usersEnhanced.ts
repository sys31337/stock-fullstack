import { Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import User from '@api/models/user';
import Role from '@api/models/role';
import { IUserIdRequest } from '@api/types/common';
import { createAuditLog } from '@api/utils/auditLog';

const getAllEnhanced = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const { page = '1', limit = '50', search, status, role } = req.query;
    const pageNum = parseInt(page as string, 10);
    const limitNum = parseInt(limit as string, 10);
    const skip = (pageNum - 1) * limitNum;

    const filter: any = {};
    if (search) {
      filter.$or = [
        { fullname: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }
    if (status) filter.status = status;
    if (role) filter.role = role;

    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password -salt -refreshToken -twoFactorSecret')
        .populate('role', 'name permissions')
        .populate('assignedWarehouses', 'name code')
        .populate('defaultWarehouse', 'name code')
        .skip(skip)
        .limit(limitNum)
        .sort('-createdAt'),
      User.countDocuments(filter),
    ]);

    return res.status(200).send({ users, total, page: pageNum, limit: limitNum });
  } catch (error) {
    return next(error);
  }
};

const getByIdEnhanced = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -salt -refreshToken -twoFactorSecret')
      .populate('role', 'name permissions')
      .populate('assignedWarehouses', 'name code')
      .populate('defaultWarehouse', 'name code');
    if (!user) return res.status(404).send({ message: 'User not found' });
    return res.status(200).send(user);
  } catch (error) {
    return next(error);
  }
};

const createEnhanced = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const {
      username, email, fullname, phone, password, role,
      assignedWarehouses, warehouseAccessMode, defaultWarehouse,
      preferredLanguage, status, notes, profilePicture, userPermissions,
    } = req.body;

    const salt = await bcrypt.genSalt();
    const hashPassword = await bcrypt.hash(password, salt);

    let effectivePermissions: string[] = [];
    if (role) {
      const roleDoc = await Role.findById(role);
      if (roleDoc) {
        effectivePermissions = [...roleDoc.permissions];
      }
    }

    const userPayload: any = {
      username,
      ...(email ? { email } : {}),
      fullname,
      phone,
      password: hashPassword,
      salt,
      status: status || 'active',
      profilePicture: profilePicture || 'default.png',
      preferredLanguage: preferredLanguage || 'fr',
      permissions: effectivePermissions,
      userPermissions: userPermissions || [],
      assignedWarehouses: assignedWarehouses || [],
      warehouseAccessMode: warehouseAccessMode || 'assigned',
      defaultWarehouse,
      notes,
    };

    if (role) userPayload.role = role;

    const user = await new User(userPayload).save();

    await createAuditLog(req, {
      action: 'create',
      resource: 'user',
      resourceId: user._id.toString(),
      details: `Created user: ${user.fullname || user.username}`,
    });

    const userResponse = await User.findById(user._id)
      .select('-password -salt -refreshToken -twoFactorSecret')
      .populate('role', 'name permissions')
      .populate('assignedWarehouses', 'name code');

    return res.status(201).send(userResponse);
  } catch (error) {
    return next(error);
  }
};

const updateEnhanced = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const {
      fullname, email, phone, password, role,
      assignedWarehouses, warehouseAccessMode, defaultWarehouse,
      preferredLanguage, status, notes, profilePicture, userPermissions,
    } = req.body;

    const payload: any = {};
    if (fullname !== undefined) payload.fullname = fullname;
    if (email !== undefined) payload.email = email;
    if (phone !== undefined) payload.phone = phone;
    if (status !== undefined) payload.status = status;
    if (profilePicture !== undefined) payload.profilePicture = profilePicture;
    if (preferredLanguage !== undefined) payload.preferredLanguage = preferredLanguage;
    if (notes !== undefined) payload.notes = notes;
    if (warehouseAccessMode !== undefined) payload.warehouseAccessMode = warehouseAccessMode;
    if (defaultWarehouse !== undefined) payload.defaultWarehouse = defaultWarehouse;
    if (assignedWarehouses !== undefined) payload.assignedWarehouses = assignedWarehouses;

    if (userPermissions !== undefined) {
      payload.userPermissions = userPermissions;
    }

    if (password) {
      const salt = await bcrypt.genSalt();
      payload.password = await bcrypt.hash(password, salt);
      payload.salt = salt;
    }

    if (role !== undefined) {
      payload.role = role;
      if (role) {
        const roleDoc = await Role.findById(role);
        payload.permissions = roleDoc ? [...roleDoc.permissions] : [];
      } else {
        payload.permissions = [];
      }
    }

    const user = await User.findByIdAndUpdate(id, payload, { new: true })
      .select('-password -salt -refreshToken -twoFactorSecret')
      .populate('role', 'name permissions')
      .populate('assignedWarehouses', 'name code')
      .populate('defaultWarehouse', 'name code');

    if (!user) return res.status(404).send({ message: 'User not found' });

    await createAuditLog(req, {
      action: 'edit',
      resource: 'user',
      resourceId: user._id.toString(),
      details: `Updated user: ${user.fullname || user.username}`,
    });

    return res.status(200).send(user);
  } catch (error) {
    return next(error);
  }
};

const removeEnhanced = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).send({ message: 'User not found' });
    if (user.isMainAccount) {
      return res.status(400).send({ message: 'Cannot delete main account' });
    }

    await User.findByIdAndDelete(req.params.id);

    await createAuditLog(req, {
      action: 'delete',
      resource: 'user',
      resourceId: req.params.id,
      details: `Deleted user: ${user.fullname || user.username}`,
    });

    return res.status(200).send({ success: true });
  } catch (error) {
    return next(error);
  }
};

const forceLogout = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, { refreshToken: null });
    if (!user) return res.status(404).send({ message: 'User not found' });

    await createAuditLog(req, {
      action: 'force_logout',
      resource: 'user',
      resourceId: req.params.id,
      details: `Forced logout for user: ${user.fullname || user.username}`,
    });

    return res.status(200).send({ success: true });
  } catch (error) {
    return next(error);
  }
};

const switchWarehouse = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const { warehouseId } = req.body;
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).send({ message: 'User not found' });

    if (user.warehouseAccessMode !== 'all') {
      const hasAccess = user.assignedWarehouses.some((w) => w.toString() === warehouseId);
      if (!hasAccess) {
        return res.status(403).send({ message: 'Access denied to this warehouse' });
      }
    }

    user.defaultWarehouse = warehouseId;
    await user.save();

    return res.status(200).send({ defaultWarehouse: warehouseId });
  } catch (error) {
    return next(error);
  }
};

const getMyPermissions = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const user = await User.findById(req.userId).populate('role');
    if (!user) return res.status(404).send({ message: 'User not found' });

    const rolePermissions = (user.role as any)?.permissions || [];
    const allPermissions = [...new Set([...rolePermissions, ...(user.userPermissions || [])])];

    const isMain = user.isMainAccount;
    return res.status(200).send({
      role: user.role,
      rolePermissions,
      userPermissions: user.userPermissions,
      effectivePermissions: allPermissions,
      isMainAccount: isMain,
      assignedWarehouses: user.assignedWarehouses,
      warehouseAccessMode: isMain ? 'all' : (user.warehouseAccessMode || 'assigned'),
      defaultWarehouse: user.defaultWarehouse,
    });
  } catch (error) {
    return next(error);
  }
};

export {
  getAllEnhanced,
  getByIdEnhanced,
  createEnhanced,
  updateEnhanced,
  removeEnhanced,
  forceLogout,
  switchWarehouse,
  getMyPermissions,
};
