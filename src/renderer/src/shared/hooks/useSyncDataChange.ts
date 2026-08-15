import { useEffect } from 'react';
import queryClient from '@web/shared/services/queryClient';

const DEBOUNCE_MS = 500;

/**
 * Listens for sync data-change events from the main process and invalidates
 * the React Query cache so the renderer refreshes with the latest synced data.
 * This makes the app feel real-time across linked host/client devices.
 */
export function useSyncDataChange(): void {
  useEffect(() => {
    const relay = (window as any).api?.relay;
    if (typeof relay?.onSyncDataChange !== 'function') return;

    let timer: ReturnType<typeof setTimeout> | null = null;

    const unsubscribe = relay.onSyncDataChange(() => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        // Invalidate every cached query so any screen currently open reflects
        // the latest local data (which was just updated by the sync engine).
        queryClient.invalidateQueries().catch(() => {});
      }, DEBOUNCE_MS);
    });

    return () => {
      unsubscribe();
      if (timer) clearTimeout(timer);
    };
  }, []);
}

export default useSyncDataChange;
