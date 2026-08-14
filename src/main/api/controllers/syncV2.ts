import type { Response, NextFunction } from 'express';
import type { IUserIdRequest } from '@api/types/common';
import { pushOperations, pullCollectionChanges } from '@api/services/syncService';
import type { SyncPushRequest } from '../../../main/sync/syncProtocol';

export const pushV2 = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const { operations } = req.body as SyncPushRequest;
    if (!Array.isArray(operations)) {
      return res.status(400).send({ message: 'operations array required' });
    }
    const sourceClientId = typeof req.headers['x-relay-origin'] === 'string'
      ? req.headers['x-relay-origin']
      : undefined;
    const result = await pushOperations(req, operations, sourceClientId);
    return res.status(200).send(result);
  } catch (error) {
    return next(error);
  }
};

export const pullV2 = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const { collection } = req.params;
    const result = await pullCollectionChanges(req, collection);
    return res.status(200).send(result);
  } catch (error) {
    return next(error);
  }
};
