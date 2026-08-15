import fs from 'node:fs';
import path from 'node:path';
import { RelayClient, RelayState } from './relayClient';
import { ReceivePayload, RelayHostInfo } from './protocol';
import { loadRelayConfig, RelayConfig } from './config';
import { HostBridge } from './hostBridge';
import { ClientProxy } from './clientProxy';
import SyncEngineV2, { SyncStatusSnapshot } from '../sync/syncEngineV2';
import { setOnOperationRecorded } from '../api/middlewares/syncRecorder';
import syncBroadcaster from '../sync/syncBroadcaster';

export interface RelayStateSnapshot {
  mode: 'host' | 'client';
  url: string;
  state: RelayState;
  connected: boolean;
  registeredClientId: string;
  hostId: string;
  targetHostId: string;
  clientPort: number;
  lastError: string;
}

const DEFAULT_RELAY_STATE: RelayStateSnapshot = {
  mode: 'host',
  url: 'http://127.0.0.1:4050',
  state: 'idle',
  connected: false,
  registeredClientId: '',
  hostId: '',
  targetHostId: '',
  clientPort: 4032,
  lastError: '',
};

/**
 * Owns the relay lifecycle for the Electron app:
 *   - host mode: registers as a host and bridges relayed requests to the
 *     local Express backend (HostBridge);
 *   - client mode: starts a local backend, registers as a client of a remote
 *     host, and syncs data between the local DB and the host via SyncEngineV2.
 */
class RelayManager {
  config: RelayConfig;

  private client: RelayClient | null = null;

  private clientProxy: ClientProxy | null = null;

  private hostBridge: HostBridge | null = null;

  private snapshot: RelayStateSnapshot = { ...DEFAULT_RELAY_STATE };

  onStateChange: (snapshot: RelayStateSnapshot) => void = () => {};

  onHosts: (hosts: RelayHostInfo[]) => void = () => {};

  onSyncStatusChange: (snapshot: SyncStatusSnapshot) => void = () => {};

  private syncEngine: SyncEngineV2 | null = null;

  constructor() {
    this.config = loadRelayConfig();
    this.loadPersistedConfig();
    this.syncEngine = new SyncEngineV2(this.config.mode === 'client');
    this.syncEngine.onStatusChange = (snapshot) => this.onSyncStatusChange(snapshot);
    setOnOperationRecorded(() => {
      this.syncEngine?.notifyOperationRecorded();
    });
  }

  start(): void {
    if (this.client) return;
    this.buildSnapshot();
    this.startClient();
  }

  isHost(): boolean {
    return this.config.mode === 'host';
  }

  getClientPort(): number {
    return this.config.clientPort;
  }

  getConfig(): RelayConfig {
    return this.config;
  }

  getHosts(): Promise<RelayHostInfo[]> {
    return this.client?.listHosts() ?? Promise.resolve([]);
  }

  getStateSnapshot(): RelayStateSnapshot {
    return this.snapshot;
  }

  /**
   * Apply new relay settings and reconnect in place. Changing the mode still
   * requires a restart (start/stop of the local backend is not hot-swappable).
   */
  async reconnect(partial: Partial<RelayConfig>): Promise<{ ok: boolean; error?: string }> {
    if (partial.mode && partial.mode !== this.config.mode) {
      return { ok: false, error: 'MODE_CHANGE_REQUIRES_RESTART' };
    }
    this.config = { ...this.config, ...partial };
    this.persistConfig().catch(() => {});
    this.stopClient();
    this.startClient();
    return { ok: true };
  }

  /**
   * Client mode: link to a specific host (and optionally supply its access
   * password). Re-registers with the relay and re-points the local proxy.
   */
  async connectToHost(hostId: string, accessPassword?: string): Promise<{ ok: boolean; error?: string }> {
    if (this.config.mode !== 'client') {
      return { ok: false, error: 'NOT_CLIENT_MODE' };
    }
    if (!this.client) {
      return { ok: false, error: 'RELAY_NOT_CONNECTED' };
    }
    this.config = { ...this.config, targetHostId: hostId, hostPassword: accessPassword ?? '' };
    this.persistConfig().catch(() => {});
    this.syncEngine?.setRelayClient(this.client, hostId);
    try {
      await this.client.setPayload({
        role: 'client',
        clientId: this.config.clientId,
        hostId,
        accessPassword: accessPassword || undefined,
        meta: { name: this.config.hostName || 'SoluStock Client' },
      });
      this.buildSnapshot();
      return { ok: true };
    } catch (error) {
      this.buildSnapshot();
      return { ok: false, error: error instanceof Error ? error.message : 'CONNECT_HOST_FAILED' };
    }
  }

  async saveConfig(partial: Partial<RelayConfig>): Promise<{ ok: boolean; error?: string }> {
    this.config = { ...this.config, ...partial };
    try {
      await this.persistConfig();
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'SAVE_FAILED' };
    }
  }

  restartApp(): void {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { app } = require('electron');
    app.relaunch();
    app.exit(0);
  }

  async triggerSync(): Promise<{ ok: boolean; error?: string }> {
    if (this.config.mode !== 'client') {
      return { ok: false, error: 'NOT_CLIENT_MODE' };
    }
    try {
      await this.syncEngine?.triggerSync();
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'SYNC_FAILED' };
    }
  }

  async getSyncStatus(): Promise<SyncStatusSnapshot | null> {
    return this.syncEngine?.getStatusSnapshot() ?? null;
  }

  async getSyncHealth(): Promise<ReturnType<SyncEngineV2['getHealth']> | null> {
    return this.syncEngine?.getHealth() ?? null;
  }

  async getSyncConflicts(): Promise<any[]> {
    return this.syncEngine?.getConflicts() ?? [];
  }

  async resolveSyncConflict(
    conflictId: string,
    resolution: 'local' | 'remote' | 'merged',
    mergedDoc?: any,
  ): Promise<{ ok: boolean; error?: string }> {
    return this.syncEngine?.resolveConflict(conflictId, resolution, mergedDoc) ?? { ok: false, error: 'SYNC_ENGINE_UNAVAILABLE' };
  }

  async resetAndFullSync(): Promise<{ ok: boolean; error?: string }> {
    if (this.config.mode !== 'client') {
      return { ok: false, error: 'NOT_CLIENT_MODE' };
    }
    return this.syncEngine?.resetAndFullSync() ?? { ok: false, error: 'SYNC_ENGINE_UNAVAILABLE' };
  }

  async reconcileWithHost(): Promise<{ ok: boolean; error?: string }> {
    if (this.config.mode !== 'client') {
      return { ok: false, error: 'NOT_CLIENT_MODE' };
    }
    try {
      await this.syncEngine?.reconcileAllCollections();
      return { ok: true };
    } catch (error) {
      return { ok: false, error: error instanceof Error ? error.message : 'RECONCILE_FAILED' };
    }
  }

  async compareWithHost(): Promise<{
    ok: boolean;
    hostCounts?: Record<string, number>;
    localCounts?: Record<string, number>;
    mismatches?: Array<{ collection: string; host: number; local: number }>;
    error?: string;
  }> {
    if (this.config.mode !== 'client') {
      return { ok: false, error: 'NOT_CLIENT_MODE' };
    }
    return this.syncEngine?.compareWithHost() ?? { ok: false, error: 'SYNC_ENGINE_UNAVAILABLE' };
  }

  shutdown(): void {
    this.stopClient();
  }

  private startClient(): void {
    const { mode } = this.config;
    const payload =
      mode === 'host'
        ? { role: 'host' as const, clientId: this.config.hostId, accessPassword: this.config.hostPassword || undefined, meta: { name: this.config.hostName } }
        : {
          role: 'client' as const,
          clientId: this.config.clientId,
          hostId: this.config.targetHostId || undefined,
          accessPassword: this.config.targetHostId ? this.config.hostPassword || undefined : undefined,
          meta: { name: this.config.hostName || 'SoluStock Client' },
        };

    const client = new RelayClient({
      url: this.config.url,
      token: this.config.token,
      payload,
      onStateChange: () => this.handleStateChange(),
      onHostsChange: (hosts) => this.onHosts(hosts),
      onReceive: (receivePayload) => this.handleReceive(receivePayload),
      onPeerStatus: () => {},
    });

    this.client = client;

    if (mode === 'host') {
      this.hostBridge = new HostBridge(client, this.config.localApiUrl);
      syncBroadcaster.setHostBridge(this.hostBridge);
    } else {
      if (!this.config.targetHostId) {
        console.warn('[relay] client mode without RELAY_TARGET_HOST — waiting for host selection');
      }
      // The renderer now talks directly to the local API (port 3500), so the
      // legacy HTTP proxy is no longer needed. The sync engine handles remote
      // communication over the relay.
      this.syncEngine?.setRelayClient(client, this.config.targetHostId);
      this.syncEngine?.start();
    }

    this.buildSnapshot();
    client.connect();
    console.log(
      `[relay] starting mode=${mode} url=${this.config.url} ` +
      `clientId=${mode === 'host' ? this.config.hostId : this.config.clientId} ` +
      (mode === 'client' ? `targetHost=${this.config.targetHostId || '(unset)'}` : ''),
    );
  }

  private stopClient(): void {
    this.clientProxy?.stop();
    this.clientProxy = null;
    this.syncEngine?.stop();
    this.client?.disconnect();
    this.client = null;
    this.buildSnapshot();
  }

  private handleStateChange(): void {
    this.buildSnapshot();
    this.onStateChange(this.snapshot);

    const state = this.client?.getState() ?? 'idle';
    const registered = state === 'registered';
    this.syncEngine?.setOnline(registered && this.config.mode === 'client' && !!this.config.targetHostId);
  }

  private handleReceive(receivePayload: ReceivePayload): void {
    const { envelope, from } = receivePayload;
    // Hosts broadcast sync change notifications as request envelopes to a
    // virtual endpoint so they are forwarded reliably by the relay server.
    if (
      envelope?.kind === 'request' &&
      envelope.path === '/__sync__/notify' &&
      envelope.headers?.['x-sync-topic'] === 'sync:change'
    ) {
      const body = (envelope.body || {}) as {
        maxSequence?: number;
        changes?: Array<{ collection?: string; sequence?: number }>;
      };
      const changes = body.changes
        ?.filter((c): c is { collection: string; sequence: number } =>
          typeof c.collection === 'string' && typeof c.sequence === 'number',
        ) ?? [];
      console.log(`[relay:manager] received sync:change notification from ${from} collections=${changes.map((c) => c.collection).join(',')}`);
      if (changes.length > 0) {
        // Pull only the collections that are behind.
        this.syncEngine?.triggerPull(changes).catch(() => {});
      } else {
        // Legacy / fallback notification without collection details.
        this.syncEngine?.triggerSync().catch(() => {});
      }
    }
  }

  private loadPersistedConfig(): void {
    const file = this.configPath();
    if (!file || !fs.existsSync(file)) return;
    try {
      const persisted = JSON.parse(fs.readFileSync(file, 'utf8'));
      this.config = loadRelayConfig(persisted);
    } catch {
      // ignore malformed persisted config
    }
  }

  private buildSnapshot(): void {
    const state = this.client?.getState() ?? 'idle';
    this.snapshot = {
      mode: this.config.mode,
      url: this.config.url,
      state,
      connected: state === 'connected' || state === 'registered',
      registeredClientId: this.client?.isRegistered()
        ? (this.config.mode === 'host' ? this.config.hostId : this.config.clientId)
        : '',
      hostId: this.config.hostId,
      targetHostId: this.config.targetHostId,
      clientPort: this.config.clientPort,
      lastError: this.client?.getLastRegisterError() ?? '',
    };
  }

  private configPath(): string | null {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { app } = require('electron');
      if (app?.getPath) {
        return path.join(app.getPath('userData'), 'relay.config.json');
      }
    } catch {
      // not running inside Electron (e.g. nodemon/dev.ts) — env only
    }
    return null;
  }

  private async persistConfig(): Promise<void> {
    const file = this.configPath();
    if (!file) return;
    const toPersist = {
      mode: this.config.mode,
      url: this.config.url,
      token: this.config.token,
      hostId: this.config.hostId,
      hostName: this.config.hostName,
      hostPassword: this.config.hostPassword,
      clientId: this.config.clientId,
      targetHostId: this.config.targetHostId,
      clientPort: this.config.clientPort,
    };
    await fs.promises.mkdir(path.dirname(file), { recursive: true });
    await fs.promises.writeFile(file, JSON.stringify(toPersist, null, 2), 'utf8');
  }
}

let instance: RelayManager | null = null;

export function getRelayManager(): RelayManager {
  if (!instance) {
    instance = new RelayManager();
  }
  return instance;
}

export default getRelayManager;
