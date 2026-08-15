import { EventEmitter } from 'node:events';
import type { SyncBatchNotification, SyncChangeNotification } from './syncProtocol';

export interface SyncBroadcastMessage {
  topic: 'sync:change';
  /** Highest global sequence number at the time of the change. */
  maxSequence: number;
  /** Changed collections with their newest sequence. */
  changes: SyncChangeNotification[];
  /** Originating client id, if the change came from a client. */
  sourceClientId?: string;
}

interface PendingBroadcast {
  maxSequence: number;
  changes: Map<string, SyncChangeNotification>;
  sourceClientId?: string;
}

class SyncBroadcaster extends EventEmitter {
  private hostBridge: { broadcast: (topic: string, payload?: unknown, excludeClientId?: string) => Promise<void> } | null = null;

  private pending: PendingBroadcast | null = null;

  private broadcastTimer: NodeJS.Timeout | null = null;

  private readonly batchWindowMs = 150;

  setHostBridge(bridge: { broadcast: (topic: string, payload?: unknown, excludeClientId?: string) => Promise<void> }): void {
    this.hostBridge = bridge;
  }

  /**
   * Emitted whenever a change is recorded in the change log.
   * Notifies the local renderer immediately and batches a remote broadcast
   * so a burst of changes does not flood every linked client.
   */
  async emitChange(
    collection: string,
    documentId: string,
    operation: 'create' | 'update' | 'delete',
    sequence: number,
    sourceClientId?: string,
  ): Promise<void> {
    const message: SyncBroadcastMessage = {
      topic: 'sync:change',
      maxSequence: sequence,
      changes: [{ collection, documentId, operation, sequence }],
      sourceClientId,
    };
    console.log(`[sync:broadcaster] emitChange ${collection}/${documentId} seq=${sequence} source=${sourceClientId || '(host)'}`);
    this.emit('change', message);

    if (!this.hostBridge) {
      return;
    }

    if (!this.pending) {
      this.pending = { maxSequence: sequence, changes: new Map(), sourceClientId };
    }
    this.pending.maxSequence = Math.max(this.pending.maxSequence, sequence);

    const existing = this.pending.changes.get(collection);
    if (!existing || sequence > existing.sequence) {
      this.pending.changes.set(collection, { collection, documentId, operation, sequence });
    }

    // Preserve the source client so we can exclude it from the remote broadcast.
    if (sourceClientId) {
      this.pending.sourceClientId = sourceClientId;
    }

    if (!this.broadcastTimer) {
      this.broadcastTimer = setTimeout(() => {
        this.flushBroadcast().catch(() => {});
      }, this.batchWindowMs);
    }
  }

  private async flushBroadcast(): Promise<void> {
    const batch = this.pending;
    this.pending = null;
    this.broadcastTimer = null;
    if (!batch || batch.changes.size === 0 || !this.hostBridge) return;

    const changes = [...batch.changes.values()].sort((a, b) => a.collection.localeCompare(b.collection));
    const payload: SyncBatchNotification = {
      topic: 'sync:change',
      maxSequence: batch.maxSequence,
      changes,
      sourceClientId: batch.sourceClientId,
    };
    console.log(`[sync:broadcaster] flushing batch seq=${batch.maxSequence} collections=${changes.map((c) => c.collection).join(',')}`);
    await this.hostBridge.broadcast('sync:change', payload, batch.sourceClientId).catch((err) => {
      console.error('[sync:broadcaster] broadcast failed:', err instanceof Error ? err.message : err);
    });
  }

  /**
   * Emits a local data-change event without attempting a remote broadcast.
   * Used by the client sync engine to refresh its own renderer after applying
   * pulled changes.
   */
  emitLocalChange(maxSequence: number): void {
    this.emit('change', {
      topic: 'sync:change',
      maxSequence,
      changes: [],
      sourceClientId: undefined,
    });
  }

  onChange(callback: (message: SyncBroadcastMessage) => void): () => void {
    this.on('change', callback);
    return () => this.off('change', callback);
  }
}

export const syncBroadcaster = new SyncBroadcaster();
export default syncBroadcaster;
