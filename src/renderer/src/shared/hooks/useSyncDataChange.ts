import { useEffect } from 'react';
import { invalidateAllSyncQueries, invalidateQueriesForSyncChanges } from '@web/shared/services/syncQueryInvalidation';

const DEBOUNCE_MS = 500;

interface SyncBroadcastMessageLike {
  changes?: Array<{ collection: string; documentId?: string; operation?: 'create' | 'update' | 'delete' }>;
}

interface SyncStatusSnapshotLike {
  status: 'idle' | 'pulling' | 'pushing' | 'error';
  lastPullAt?: string | number | Date;
  lastPushAt?: string | number | Date;
}

/**
 * Listens for sync data-change events from the main process and invalidates the
 * React Query cache so the renderer refreshes with the latest synced data.
 *
 * - Data-change notifications carry the affected collections, so the lists and
 *   stats that depend on them are invalidated precisely.
 * - Local pull/push events may arrive with an empty change list, so a global
 *   invalidation is debounced as a safety net.
 * - A sync status returning to idle is a second trigger in case a data-change
 *   event is missed while the app is busy.
 */
export function useSyncDataChange(): void {
  useEffect(() => {
    const relay = (window as any).api?.relay;
    if (!relay || typeof relay.onSyncDataChange !== 'function') return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    let lastSyncMarker = '';

    const scheduleInvalidate = (changes?: Array<{ collection: string; documentId?: string; operation?: 'create' | 'update' | 'delete' }>) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        if (changes && changes.length > 0) {
          invalidateQueriesForSyncChanges(changes);
        }
        invalidateAllSyncQueries();
      }, DEBOUNCE_MS);
    };

    const unsubscribeDataChange = relay.onSyncDataChange((message: SyncBroadcastMessageLike) => {
      scheduleInvalidate(message?.changes);
    });

    const unsubscribeStatusChange = typeof relay.onSyncStatusChange === 'function'
      ? relay.onSyncStatusChange((snapshot: SyncStatusSnapshotLike) => {
        const marker = `${snapshot.lastPullAt || ''}|${snapshot.lastPushAt || ''}`;
        if (snapshot.status === 'idle' && marker !== lastSyncMarker) {
          lastSyncMarker = marker;
          scheduleInvalidate();
        }
      })
      : undefined;

    return () => {
      unsubscribeDataChange();
      unsubscribeStatusChange?.();
      if (timer) clearTimeout(timer);
    };
  }, []);
}

export default useSyncDataChange;
