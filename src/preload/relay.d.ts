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

export interface SyncStatusSnapshot {
  status: 'idle' | 'pulling' | 'pushing' | 'error';
  lastPullAt?: string;
  lastPushAt?: string;
  lastError?: string;
  pendingCount: number;
  conflictCount: number;
  isOnline: boolean;
}

export interface SyncConflictSnapshot {
  _id: string;
  collection: string;
  documentId: string;
  localDoc: any;
  remoteDoc: any;
  status: string;
  createdAt: string;
}

export interface SyncBroadcastMessage {
  topic: 'sync:change';
  maxSequence: number;
  sourceClientId?: string;
}

export interface RelayPreloadApi {
  getState: () => Promise<RelayStateSnapshot>;
  getConfig: () => Promise<RelayConfigDto>;
  getHosts: () => Promise<RelayHostInfo[]>;
  reconnect: (cfg: Partial<RelayConfigDto>) => Promise<{ ok: boolean; error?: string }>;
  connectHost: (hostId: string, password?: string) => Promise<{ ok: boolean; error?: string }>;
  saveConfig: (cfg: Partial<RelayConfigDto>) => Promise<{ ok: boolean; error?: string }>;
  restart: () => void;
  onStateChange: (cb: (snapshot: RelayStateSnapshot) => void) => () => void;
  onHosts: (cb: (hosts: RelayHostInfo[]) => void) => () => void;
  getSyncStatus: () => Promise<SyncStatusSnapshot | null>;
  triggerSync: () => Promise<{ ok: boolean; error?: string }>;
  getSyncConflicts: () => Promise<SyncConflictSnapshot[]>;
  resolveSyncConflict: (conflictId: string, resolution: 'local' | 'remote' | 'merged', mergedDoc?: any) => Promise<{ ok: boolean; error?: string }>;
  onSyncStatusChange: (cb: (snapshot: SyncStatusSnapshot) => void) => () => void;
  onSyncDataChange: (cb: (message: SyncBroadcastMessage) => void) => () => void;
}
