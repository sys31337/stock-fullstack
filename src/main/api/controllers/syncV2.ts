import type { Response, NextFunction } from 'express';
import type { IUserIdRequest } from '@api/types/common';
import mongoose from 'mongoose';
import { pushOperations, pullCollectionChanges, getSyncHealth, normalizeDoc } from '@api/services/syncService';
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

export const snapshotV2 = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const { collection } = req.params;
    const cfg = SYNC_COLLECTIONS.find((c) => c.name === collection);
    if (!cfg) {
      return res.status(404).send({ message: 'Unknown collection' });
    }
    const Model = mongoose.connection.models[cfg.model];
    if (!Model) {
      return res.status(404).send({ message: 'Model not registered' });
    }

    const rawOffset = typeof req.query.offset === 'string' ? parseInt(req.query.offset, 10) : 0;
    const rawLimit = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : 200;
    const offset = Number.isNaN(rawOffset) || rawOffset < 0 ? 0 : rawOffset;
    const limit = Number.isNaN(rawLimit) || rawLimit <= 0 ? 200 : Math.min(rawLimit, 500);
    const full = req.query.full === '1' || req.query.full === 'true';
    const maxSequence = await getGlobalMaxSequence();

    if (full) {
      const docs = await Model.find({}).skip(offset).limit(limit + 1).lean();
      const hasMore = docs.length > limit;
      if (hasMore) docs.pop();
      return res.status(200).send({
        collection,
        docs: docs.map((d: any) => normalizeDoc(d)),
        offset,
        limit,
        hasMore,
        nextOffset: hasMore ? offset + docs.length : undefined,
        maxSequence,
        generatedAt: new Date().toISOString(),
      });
    }

    const ids = (await Model.find({}, '_id').lean()).map((d: any) => String(d._id));
    return res.status(200).send({ collection, ids, maxSequence, generatedAt: new Date().toISOString() });
  } catch (error) {
    return next(error);
  }
};

export const diagnosticsV2 = async (req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const counts: Record<string, number> = {};
    const ids: Record<string, string[]> = {};
    const detail = req.query.detail === '1' || req.query.detail === 'true';
    for (const cfg of SYNC_COLLECTIONS) {
      const Model = mongoose.connection.models[cfg.model];
      counts[cfg.name] = Model ? await Model.estimatedDocumentCount() : -1;
      if (detail && Model) {
        const projection = cfg.name === 'products' ? 'barCode productName' : '_id';
        ids[cfg.name] = (await Model.find({}, projection).lean()).map((d: any) =>
          cfg.name === 'products' ? `${d.barCode || d._id} - ${d.productName || ''}` : String(d._id),
        );
      }
    }
    const maxSequence = await getGlobalMaxSequence();
    return res.status(200).send({ maxSequence, counts, ids, generatedAt: new Date().toISOString() });
  } catch (error) {
    return next(error);
  }
};

export const healthV2 = async (_req: IUserIdRequest, res: Response, next: NextFunction) => {
  try {
    const health = await getSyncHealth();
    return res.status(200).send(health);
  } catch (error) {
    return next(error);
  }
};
