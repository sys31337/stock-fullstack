/**
 * Standalone verification script for the SoluStock synchronization system.
 *
 * It starts a local MongoDB instance, exercises the sync service, and asserts
 * correctness of:
 *   - idempotent operations
 *   - immutable document ids
 *   - sequence-based change log
 *   - conflict detection
 *   - cursor-based pull
 *
 * Run with: npx ts-node -P tsconfig.node.json -r tsconfig-paths/register scripts/verify-sync.ts
 */

import mongoose from 'mongoose';
import crypto from 'node:crypto';
import { startMongoDB, stopMongoDB } from '../src/main/api/config/mongodb';
import '../src/main/api/models/bills';
import '../src/main/api/models/products';
import '../src/main/api/models/customers';
import '../src/main/api/models/syncOperation';
import '../src/main/api/models/syncConflict';
import '../src/main/api/models/syncState';
import '../src/main/api/models/syncChangeLog';
import '../src/main/api/models/syncAppliedOperation';
import { setHostChangeTracking, registerHostChangeTracking } from '../src/main/api/plugins/syncChangeTracking';
import { getGlobalMaxSequence } from '../src/main/api/services/syncChangeLogService';
import { pushOperations, pullCollectionChanges } from '../src/main/api/services/syncService';
import { createApiServer } from '../src/main/api/main';
import SyncChangeLog from '../src/main/api/models/syncChangeLog';
import SyncAppliedOperation from '../src/main/api/models/syncAppliedOperation';
import SyncConflict from '../src/main/api/models/syncConflict';
import SyncState from '../src/main/api/models/syncState';
import Bill from '../src/main/api/models/bills';

let failures = 0;

function assert(condition: boolean, message: string): void {
  if (!condition) {
    failures += 1;
    console.error(`❌ ASSERTION FAILED: ${message}`);
  } else {
    console.log(`✅ ${message}`);
  }
}

function objectId(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 24);
}

async function run(): Promise<void> {
  console.log('\n=== SoluStock Sync Verification ===\n');

  await startMongoDB('stock-sync-verify');
  mongoose.set('strictQuery', true);

  // Start a local API server so the sync service can replay mutations.
  const server = createApiServer({ clientMode: false, dbName: 'stock-sync-verify' });
  await new Promise<void>((resolve, reject) => {
    server.listen(3500, () => {
      console.log('[verify] API server listening on port 3500');
      resolve();
    });
    server.on('error', reject);
  });

  setHostChangeTracking(true);
  registerHostChangeTracking();

  // Clean slate for the test database.
  await Promise.all([
    SyncChangeLog.deleteMany({}),
    SyncAppliedOperation.deleteMany({}),
    SyncConflict.deleteMany({}),
    SyncState.deleteMany({}),
    Bill.deleteMany({}),
  ]);

  // The API server seeds the change log from existing reference data on
  // startup. Give it a moment to finish before running assertions.
  await new Promise((resolve) => setTimeout(resolve, 500));

  const stableBillId = objectId();
  const orderId = String(Date.now());

  // 1. Idempotent bill creation with a stable id.
  const createOp = {
    operationId: crypto.randomUUID(),
    documentId: stableBillId,
    collection: 'bills',
    method: 'POST' as const,
    path: '/api/v1/bills',
    body: {
      _id: stableBillId,
      billDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      type: 'SALE',
      orderId,
      orderTotalHT: 100,
      orderTotalTTC: 119,
      orderPaid: 119,
      orderDebts: 0,
      pricingCategory: 1,
      products: [{
        id: objectId(),
        barCode: 'TEST-001',
        productName: 'Test Product',
        quantity: 1,
        stack: 1,
        buyPrice: 100,
        sellPrice_1: 119,
        sellPrice_2: 119,
        sellPrice_3: 119,
        tva: 19,
      }],
    },
  };

  const req = { headers: { 'x-relay-origin': 'client-a' }, query: {} };

  const push1 = await pushOperations(req, [createOp]);
  assert(push1.results.length === 1, 'Push returns one result');
  assert(push1.results[0].status === 'applied', 'First push applies the bill');
  assert(push1.results[0].sequence !== undefined, 'Applied change gets a sequence number');
  assert(push1.results[0].doc?._id === stableBillId, 'Applied bill preserves the client-supplied _id');
  assert(push1.results[0].doc?.createdAt === createOp.body.billDate, 'Applied bill preserves the client-created createdAt');

  // Retry the exact same operation.
  const push2 = await pushOperations(req, [createOp]);
  assert(push2.results[0].status === 'duplicate', 'Retrying the same operation id is idempotent');
  assert(push2.results[0].doc?._id === stableBillId, 'Duplicate result keeps the same _id');

  const billCount = await Bill.countDocuments({ _id: stableBillId });
  assert(billCount === 1, 'Only one bill exists after retry');

  // 2. Change log and cursor-based pull.
  const maxSeq = await getGlobalMaxSequence();
  assert(maxSeq > 0, 'Global max sequence is greater than zero after changes');

  const pull = await pullCollectionChanges(
    { headers: { 'x-relay-origin': 'client-b' }, query: { cursor: '0', limit: '100' } },
    'bills',
  );
  assert(pull.docs.length === 1, 'Pull returns one bill from cursor 0');
  assert(String(pull.docs[0]._id) === stableBillId, 'Pulled bill has the same stable _id');
  assert(pull.nextCursor === pull.maxSequence, 'Next cursor equals max sequence on last page');

  // 3. Conflict detection: modify the server bill, then push an older update.
  await Bill.findByIdAndUpdate(stableBillId, { orderTotalTTC: 200 });
  const updateOp = {
    operationId: crypto.randomUUID(),
    documentId: stableBillId,
    collection: 'bills',
    method: 'PUT' as const,
    path: `/api/v1/bills/info/${stableBillId}`,
    baseUpdatedAt: createOp.body.billDate,
    body: {
      orderTotalTTC: 150,
      products: createOp.body.products,
    },
  };

  const push3 = await pushOperations(req, [updateOp]);
  assert(push3.results[0].status === 'conflict', 'Updating a newer server document is detected as a conflict');
  assert(push3.results[0].conflict?.remoteDoc?.orderTotalTTC === 200, 'Conflict snapshot reflects current server value');

  const conflictCount = await SyncConflict.countDocuments({ status: 'pending' });
  assert(conflictCount === 1, 'One pending conflict is recorded');

  // 4. A fresh cursor consumer receives all existing data.
  const freshPull = await pullCollectionChanges(
    { headers: { 'x-relay-origin': 'client-c' }, query: { cursor: '0', limit: '100' } },
    'bills',
  );
  assert(freshPull.docs.length >= 1, 'Fresh consumer can pull existing bills');
  assert(freshPull.docs.some((d: any) => String(d._id) === stableBillId), 'Fresh consumer receives the stable-id bill');

  // 5. Multiple devices creating different bills simultaneously (same batch).
  const deviceABillId = objectId();
  const deviceBBillId = objectId();
  const now = Date.now();
  const multiCreateOps = [
    {
      operationId: crypto.randomUUID(),
      documentId: deviceABillId,
      collection: 'bills',
      method: 'POST' as const,
      path: '/api/v1/bills',
      body: {
        _id: deviceABillId,
        billDate: new Date().toISOString(),
        type: 'SALE',
        orderId: String(now + 1),
        orderTotalHT: 50,
        orderTotalTTC: 59.5,
        orderPaid: 59.5,
        orderDebts: 0,
        pricingCategory: 1,
        products: [createOp.body.products[0]],
      },
    },
    {
      operationId: crypto.randomUUID(),
      documentId: deviceBBillId,
      collection: 'bills',
      method: 'POST' as const,
      path: '/api/v1/bills',
      body: {
        _id: deviceBBillId,
        billDate: new Date().toISOString(),
        type: 'SALE',
        orderId: String(now + 2),
        orderTotalHT: 75,
        orderTotalTTC: 89.25,
        orderPaid: 89.25,
        orderDebts: 0,
        pricingCategory: 1,
        products: [createOp.body.products[0]],
      },
    },
  ];

  const multiPush = await pushOperations(req, multiCreateOps);
  assert(multiPush.results.every((r) => r.status === 'applied'), 'Multiple simultaneous bill creations apply successfully');
  const multiBillCount = await Bill.countDocuments({ _id: { $in: [deviceABillId, deviceBBillId] } });
  assert(multiBillCount === 2, 'Both simultaneously created bills exist with distinct ids');

  // 6. Concurrent edits to the same bill: the second edit detects a conflict.
  const editBase = await Bill.findById(stableBillId).lean();
  const baseUpdatedAt = (editBase as any)?.updatedAt?.toISOString();
  const concurrentEditA = {
    operationId: crypto.randomUUID(),
    documentId: stableBillId,
    collection: 'bills',
    method: 'PUT' as const,
    path: `/api/v1/bills/info/${stableBillId}`,
    baseUpdatedAt,
    body: { orderTotalTTC: 300, products: createOp.body.products },
  };
  const concurrentEditB = {
    operationId: crypto.randomUUID(),
    documentId: stableBillId,
    collection: 'bills',
    method: 'PUT' as const,
    path: `/api/v1/bills/info/${stableBillId}`,
    baseUpdatedAt,
    body: { orderTotalTTC: 400, products: createOp.body.products },
  };

  const firstEdit = await pushOperations(req, [concurrentEditA]);
  assert(firstEdit.results[0].status === 'applied', 'First concurrent edit applies');

  const secondEdit = await pushOperations(req, [concurrentEditB]);
  assert(secondEdit.results[0].status === 'conflict', 'Second concurrent edit is detected as a conflict');

  await new Promise<void>((resolve) => server.close(() => resolve()));
  await mongoose.disconnect();
  stopMongoDB();

  console.log('\n=== Verification Complete ===');
  if (failures > 0) {
    console.error(`\n${failures} assertion(s) failed.`);
    process.exit(1);
  } else {
    console.log('\nAll assertions passed.');
  }
}

run().catch((err) => {
  console.error('Verification crashed:', err);
  stopMongoDB();
  process.exit(1);
});
