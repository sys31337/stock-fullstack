import type { NextFunction, Request, Response } from 'express';
import IdempotencyRecord from '@api/models/idempotencyRecord';

const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const MAX_KEY_LENGTH = 160;

function normalizePath(path: string): string {
  return path.split('?')[0];
}

function toStorable(body: any): any {
  if (body === undefined || body === null) return body;
  if (typeof body !== 'object') return body;
  try {
    // Convert Mongoose documents / rich objects to plain JSON so the record can
    // be safely stored in Mixed and replayed later.
    return JSON.parse(JSON.stringify(body));
  } catch {
    return body;
  }
}

/**
 * Idempotent write middleware for the mobile app's offline flush.
 *
 * The mobile queues writes while offline and flushes them with an
 * `x-idempotency-key` header. If a flush is retried (e.g. the relay ack was
 * lost after the host already committed), we replay the stored response instead
 * of running the mutation again — this prevents duplicate bills, double stock
 * decrements and double customer-credit adjustments.
 */
export function idempotency(req: Request, res: Response, next: NextFunction): void {
  const rawKey = req.headers['x-idempotency-key'];
  if (typeof rawKey !== 'string' || !rawKey.trim()) {
    next();
    return;
  }
  const key = rawKey.trim().slice(0, MAX_KEY_LENGTH);
  if (!key || !WRITE_METHODS.has(req.method)) {
    next();
    return;
  }

  const method = req.method;
  const path = normalizePath(req.originalUrl || req.url);

  IdempotencyRecord.findOne({ key })
    .then((existing) => {
      if (existing) {
        res.status(existing.status || 200).send(existing.responseBody);
        return;
      }

      // Capture the successful response so a retry can be replayed without
      // re-running the mutation.
      let responseBody: any;
      const originalSend = res.send.bind(res);
      res.send = function send(body: any) {
        responseBody = body;
        return originalSend(body);
      };

      const originalEnd = res.end.bind(res);
      res.end = function end(chunk: any, encoding?: any, cb?: any) {
        res.end = originalEnd;
        if (!res.writableEnded) {
          originalEnd(chunk, encoding, cb);
        }
        if (res.statusCode >= 200 && res.statusCode < 300) {
          IdempotencyRecord.create({
            key,
            method,
            path,
            status: res.statusCode,
            responseBody: toStorable(responseBody),
          }).catch((err) => {
            console.error('[idempotency] failed to record', err);
          });
        }
        return res;
      };

      next();
    })
    .catch((err) => {
      // Fail open: never block a write because the dedupe lookup failed.
      console.error('[idempotency] lookup failed', err);
      next();
    });
}
