import queryClient from '@web/shared/services/queryClient';

interface SyncChangeInfo {
  collection: string;
  documentId?: string;
  operation?: 'create' | 'update' | 'delete';
}

/**
 * Maps a synced collection name to the React Query key prefixes that must be
 * invalidated when documents in that collection change. Query keys are
 * heterogeneous across the app (legacy string prefixes and object-style keys),
 * so each synced collection can affect several screens.
 */
const COLLECTION_QUERY_KEYS: Record<string, string[]> = {
  roles: ['roles'],
  users: ['users-enhanced', 'users', 'Get user Info', 'my-permissions', 'permissions'],
  customers: ['Get all customers', 'Get all clients', 'Get all suppliers', 'Get transactions by customer'],
  categories: ['Get all categories'],
  warehouses: ['warehouses'],
  products: ['Get all products'],
  bills: ['Get all bills', 'Get all bills of type', 'Get bill information'],
  transactions: ['Get all transactions', 'reports-ledger', 'reports-ledger-detail', 'reports-ledger-statement', 'reports-cash-statement'],
  payments: ['payments'],
  stockmovements: ['stock-movements'],
  warehousetransfers: ['warehouse-transfers'],
  deliveryreturns: ['delivery-returns'],
  settings: ['settings'],
  auditlogs: ['audit-logs'],
};

/** Stats always depend on many collections, so they refresh on every sync. */
const STATS_QUERY_KEYS = ['dashboard-stats', 'dashboard-analytics', 'reports-overview', 'reports-salespeople'];

/**
 * Invalidates the React Query keys affected by a set of synced collection
 * changes, always including dashboard/report stats. Uses refetchType 'all' so
 * cached-but-not-visible queries refresh too and are fresh when revisited.
 */
export function invalidateQueriesForSyncChanges(changes: SyncChangeInfo[] = []): void {
  const keysToInvalidate = new Set<string>(STATS_QUERY_KEYS);

  for (const change of changes) {
    const keys = COLLECTION_QUERY_KEYS[change.collection];
    if (!keys) continue;
    for (const key of keys) {
      keysToInvalidate.add(key);
    }
  }

  for (const key of keysToInvalidate) {
    queryClient.invalidateQueries({ queryKey: [key], refetchType: 'all' }).catch(() => {});
  }
}

/** Invalidates every cached query (safety net for heterogeneous keys). */
export function invalidateAllSyncQueries(): void {
  queryClient.invalidateQueries({ refetchType: 'active' }).catch(() => {});
}
