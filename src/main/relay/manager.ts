import fs from 'node:fs';
import path from 'node:path';
import { RelayClient, RelayState } from './relayClient';
import { RelayHostInfo } from './protocol';
import { loadRelayConfig, RelayConfig } from './config';
import { HostBridge } from './hostBridge';
import { ClientProxy } from './clientProxy';

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
 *   - client mode: registers as a client of a remote host and exposes a local
 *     HTTP proxy (ClientProxy) that the renderer talks to transparently.
 */
class RelayManager {
  config: RelayConfig;

  private client: RelayClient | null = null;

  private clientProxy: ClientProxy | null = null;

  private snapshot: RelayStateSnapshot = { ...DEFAULT_RELAY_STATE };

  onStateChange: (snapshot: RelayStateSnapshot) => void = () => {};

  onHosts: (hosts: RelayHostInfo[]) => void = () => {};

  constructor() {
    this.config = loadRelayConfig();
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
    this.clientProxy?.setTargetHostId(hostId);
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
      onPeerStatus: () => {},
    });

    this.client = client;

    if (mode === 'host') {
      new HostBridge(client, this.config.localApiUrl);
    } else {
      if (!this.config.targetHostId) {
        console.warn('[relay] client mode without RELAY_TARGET_HOST — waiting for host selection');
      }
      this.clientProxy = new ClientProxy(client, this.config.clientPort, this.config.targetHostId);
      this.clientProxy.start();
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
    this.client?.disconnect();
    this.client = null;
    this.buildSnapshot();
  }

  private handleStateChange(): void {
    this.buildSnapshot();
    this.onStateChange(this.snapshot);
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
    // Merge a persisted relay.config.json (from a previous session) on top of env.
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { app } = require('electron');
      if (app?.getPath) {
        const file = path.join(app.getPath('userData'), 'relay.config.json');
        if (fs.existsSync(file)) {
          const persisted = JSON.parse(fs.readFileSync(file, 'utf8'));
          instance.config = loadRelayConfig(persisted);
        }
      }
    } catch {
      // not running inside Electron
    }
  }
  return instance;
}

export default getRelayManager;
