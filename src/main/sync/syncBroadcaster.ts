import { EventEmitter } from 'node:events';

export interface SyncBroadcastMessage {
  topic: 'sync:change';
  /** Highest global sequence number at the time of the change. */
  maxSequence: number;
  /** Originating client id, if the change came from a client. */
  sourceClientId?: string;
}

class SyncBroadcaster extends EventEmitter {
  private hostBridge: { broadcast: (topic: string, payload?: unknown, excludeClientId?: string) => Promise<void> } | null = null;

  setHostBridge(bridge: { broadcast: (topic: string, payload?: unknown, excludeClientId?: string) => Promise<void> }): void {
    this.hostBridge = bridge;
  }

  /**
   * Emitted by the host whenever a change is recorded in the change log.
   * Notifies the local renderer and all linked clients to pull changes.
   */
  async emitChange(maxSequence: number, sourceClientId?: string): Promise<void> {
    const message: SyncBroadcastMessage = { topic: 'sync:change', maxSequence, sourceClientId };
    console.log(`[sync:broadcaster] emitChange seq=${maxSequence} source=${sourceClientId || '(host)'} bridge=${this.hostBridge ? 'yes' : 'no'}`);
    this.emit('change', message);
    if (this.hostBridge) {
      await this.hostBridge.broadcast('sync:change', message, sourceClientId).catch((err) => {
        console.error('[sync:broadcaster] broadcast failed:', err instanceof Error ? err.message : err);
      });
    }
  }

  onChange(callback: (message: SyncBroadcastMessage) => void): () => void {
    this.on('change', callback);
    return () => this.off('change', callback);
  }
}

export const syncBroadcaster = new SyncBroadcaster();
export default syncBroadcaster;

