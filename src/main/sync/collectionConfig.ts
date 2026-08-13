/**
 * Collections that participate in client-mode replication.
 *
 * `model` is the Mongoose model name registered in the local API.
 * `endpoint` is the public REST path under /api/v1/ used for both pulling
 * from the host and replaying queued mutations.
 * `syncAuthFields` marks collections whose credentials must survive the pull
 * (users need password/salt locally so login works offline).
 */
export interface SyncCollectionConfig {
  name: string;
  model: string;
  endpoint: string;
  syncAuthFields?: boolean;
  pullQuery?: Record<string, string | number>;
}

export const SYNC_COLLECTIONS: SyncCollectionConfig[] = [
  { name: 'roles', model: 'Role', endpoint: 'roles' },
  { name: 'users', model: 'User', endpoint: 'users-enhanced', syncAuthFields: true },
  { name: 'customers', model: 'Customer', endpoint: 'customers' },
  { name: 'categories', model: 'Category', endpoint: 'categories' },
  { name: 'warehouses', model: 'Warehouse', endpoint: 'warehouses' },
  { name: 'products', model: 'Product', endpoint: 'products' },
  { name: 'bills', model: 'Bill', endpoint: 'bills' },
  { name: 'transactions', model: 'Transaction', endpoint: 'transactions' },
  { name: 'payments', model: 'Payment', endpoint: 'payments' },
  { name: 'stockmovements', model: 'StockMovement', endpoint: 'stock-movements' },
  { name: 'warehousetransfers', model: 'WarehouseTransfer', endpoint: 'warehouse-transfers' },
  { name: 'deliveryreturns', model: 'DeliveryReturn', endpoint: 'delivery-returns' },
  { name: 'settings', model: 'Settings', endpoint: 'settings' },
  { name: 'auditlogs', model: 'AuditLog', endpoint: 'audit-logs' },
];

export function getSyncCollectionByEndpoint(endpoint: string): SyncCollectionConfig | undefined {
  return SYNC_COLLECTIONS.find((c) => c.endpoint === endpoint || c.name === endpoint);
}

export function getSyncCollectionByName(name: string): SyncCollectionConfig | undefined {
  return SYNC_COLLECTIONS.find((c) => c.name === name);
}
