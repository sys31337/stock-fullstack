import { Response, NextFunction } from 'express';
import Settings from '@api/models/settings';
import { IUserIdRequest } from '@api/types/common';
import { createAuditLog } from '@api/utils/auditLog';

export const getSettings = async (_req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    return res.status(200).send(settings);
  } catch (error) {
    return next(error);
  }
};

export const updateSettings = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const { body } = req;

    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create(body);
    } else {
      Object.assign(settings, body);
      await settings.save();
    }

    await createAuditLog(req, {
      action: 'edit',
      resource: 'settings',
      resourceId: settings._id.toString(),
      details: 'Updated system settings',
    });

    return res.status(200).send(settings);
  } catch (error) {
    return next(error);
  }
};
