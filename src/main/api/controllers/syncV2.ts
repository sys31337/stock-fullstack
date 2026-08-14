import type { Response, NextFunction } from 'express';
import type { IUserIdRequest } from '@api/types/common';
import mongoose from 'mongoose';
import { pushOperations, pullCollectionChanges } from '@api/services/syncService';
import { getGlobalMaxSequence } from '@api/services/syncChangeLogService';
import { SYNC_COLLECTIONS } from '../../../main/sync/collectionConfig';
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

export const diagnosticsV2 = async (_req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const counts: Record<string, number> = {};
    for (const cfg of SYNC_COLLECTIONS) {
      const Model = mongoose.connection.models[cfg.model];
      counts[cfg.name] = Model ? await Model.estimatedDocumentCount() : -1;
    }
    const maxSequence = await getGlobalMaxSequence();
    return res.status(200).send({ maxSequence, counts, generatedAt: new Date().toISOString() });
  } catch (error) {
    return next(error);
  }
};
