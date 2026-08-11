export interface RelayStateSnapshot {
  mode: 'host' | 'client';
  url: string;
  state: string;
  connected: boolean;
  registeredClientId: string;
  hostId: string;
  targetHostId: string;
  clientPort: number;
  lastError: string;
}

export interface RelayConfigDto {
  mode: 'host' | 'client';
  url: string;
  token: string;
  hostId: string;
  hostName: string;
  hostPassword: string;
  clientId: string;
  targetHostId: string;
  clientPort: number;
  localApiUrl: string;
}

export interface RelayHostInfo {
  clientId: string;
  name?: string;
  meta?: Record<string, unknown>;
  locked: boolean;
  clients: string[];
}

export interface RelayPreloadApi {
  getState: () => Promise<RelayStateSnapshot>;
  getConfig: () => Promise<RelayConfigDto>;
  getHosts: () => Promise<RelayHostInfo[]>;
  reconnect: (cfg: Partial<RelayConfigDto>) => Promise<{ ok: boolean; error?: string }>;
  saveConfig: (cfg: Partial<RelayConfigDto>) => Promise<{ ok: boolean; error?: string }>;
  restart: () => void;
  onStateChange: (cb: (snapshot: RelayStateSnapshot) => void) => () => void;
  onHosts: (cb: (hosts: RelayHostInfo[]) => void) => () => void;
}
