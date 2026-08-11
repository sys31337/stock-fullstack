import os from 'node:os';

export type RelayMode = 'host' | 'client';

export interface RelayConfig {
  /** 'host': expose this machine's backend; 'client': connect to a remote host. */
  mode: RelayMode;
  /** Relay service URL, e.g. http://127.0.0.1:4050 or https://relay.example.com */
  url: string;
  /** Shared secret the relay requires. */
  token: string;
  /** Stable host identifier registered with the relay (host mode). */
  hostId: string;
  /** Human-friendly host name shown to clients. */
  hostName: string;
  /** Access password clients must present to link to this host (host mode). */
  hostPassword: string;
  /** Identifier used by this app when acting as a client. */
  clientId: string;
  /** Host this app should talk to when in client mode. */
  targetHostId: string;
  /** Local port for the client-mode HTTP proxy the renderer talks to. */
  clientPort: number;
  /** Local API base URL the host bridge forwards relayed requests to. */
  localApiUrl: string;
}

export const DEFAULT_RELAY_URL = 'http://127.0.0.1:4050';
export const DEFAULT_RELAY_TOKEN = 'change-me';
export const DEFAULT_CLIENT_PORT = 4032;
export const LOCAL_API_URL = 'http://127.0.0.1:4031';

function hostIdFromEnv(): string {
  return process.env.RELAY_HOST_ID || os.hostname() || 'solustock-host';
}

/**
 * Config source of truth: environment variables, then the persisted
 * relay.config.json in the Electron userData folder, then defaults.
 */
export function loadRelayConfig(override?: Partial<RelayConfig>): RelayConfig {
  const hostId = override?.hostId || process.env.RELAY_HOST_ID || hostIdFromEnv();
  const defaults: RelayConfig = {
    mode: 'host',
    url: DEFAULT_RELAY_URL,
    token: DEFAULT_RELAY_TOKEN,
    hostId,
    hostName: 'SoluStock Host',
    hostPassword: '',
    clientId: `electron-${hostId}`,
    targetHostId: '',
    clientPort: DEFAULT_CLIENT_PORT,
    localApiUrl: LOCAL_API_URL,
  };

  return {
    ...defaults,
    mode: process.env.RELAY_MODE === 'client' ? 'client' : defaults.mode,
    url: process.env.RELAY_URL || defaults.url,
    token: process.env.RELAY_TOKEN || defaults.token,
    hostName: process.env.RELAY_HOST_NAME || defaults.hostName,
    hostPassword: process.env.RELAY_HOST_PASSWORD || defaults.hostPassword,
    clientId: process.env.RELAY_CLIENT_ID || defaults.clientId,
    targetHostId: process.env.RELAY_TARGET_HOST || defaults.targetHostId,
    clientPort: parseInt(process.env.RELAY_CLIENT_PORT || String(defaults.clientPort), 10),
    localApiUrl: process.env.RELAY_LOCAL_API || defaults.localApiUrl,
    ...override,
  };
}
