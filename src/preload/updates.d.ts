export interface UpdateStatusDto {
  currentVersion: string;
  remoteVersion: string | null;
  downloadedVersion: string | null;
}

export interface UpdateCheckResultDto {
  status: 'ok' | 'checking' | 'error';
  currentVersion?: string;
  remoteVersion?: string | null;
  downloadedVersion?: string | null;
  error?: string;
}

export interface UpdateAvailableDto {
  version: string;
}

export interface UpdateDownloadedDto {
  version: string;
}

export interface UpdateProgressDto {
  percent: number;
  transferred: number;
  total: number;
  bytesPerSecond: number;
}

export interface UpdateErrorDto {
  message: string;
}

export interface UpdatePreloadApi {
  check: () => Promise<UpdateCheckResultDto>;
  install: () => Promise<boolean>;
  getStatus: () => Promise<UpdateStatusDto>;
  onChecking: (cb: () => void) => () => void;
  onAvailable: (cb: (payload: UpdateAvailableDto) => void) => () => void;
  onNotAvailable: (cb: () => void) => () => void;
  onProgress: (cb: (payload: UpdateProgressDto) => void) => () => void;
  onDownloaded: (cb: (payload: UpdateDownloadedDto) => void) => () => void;
  onError: (cb: (payload: UpdateErrorDto) => void) => () => void;
}
