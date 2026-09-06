import { useEffect, useRef, useState } from 'react';

export type UpdatePhase = 'idle' | 'checking' | 'available' | 'downloading' | 'downloaded' | 'error';

export interface UpdateProgressInfo {
  percent: number;
  transferred: number;
  total: number;
  bytesPerSecond: number;
}

export interface UseUpdaterReturn {
  phase: UpdatePhase;
  currentVersion: string;
  remoteVersion: string | null;
  downloadedVersion: string | null;
  progress: UpdateProgressInfo | null;
  error: string | null;
  hasChecked: boolean;
  busy: boolean;
  check: () => Promise<void>;
}

/**
 * Centralised view of the auto-updater state. Subscribes to the events the
 * main process pushes and exposes `check`/`install` actions. Any component can
 * mount this hook; the underlying IPC subscriptions are cleaned up on unmount.
 */
export function useUpdater(): UseUpdaterReturn {
  const [phase, setPhase] = useState<UpdatePhase>('idle');
  const [currentVersion, setCurrentVersion] = useState('');
  const [remoteVersion, setRemoteVersion] = useState<string | null>(null);
  const [downloadedVersion, setDownloadedVersion] = useState<string | null>(null);
  const [progress, setProgress] = useState<UpdateProgressInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasChecked, setHasChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);

  useEffect(() => {
    const api = window.api.updates;
    let mounted = true;

    api.getStatus().then((status) => {
      if (!mounted) return;
      setCurrentVersion(status.currentVersion);
      setRemoteVersion(status.remoteVersion);
      setDownloadedVersion(status.downloadedVersion);
      if (status.downloadedVersion) setPhase('downloaded');
    }).catch(() => {});

    const offChecking = api.onChecking(() => {
      if (!mounted) return;
      setPhase('checking');
      setHasChecked(true);
      setError(null);
    });
    const offAvailable = api.onAvailable(({ version }) => {
      if (!mounted) return;
      setPhase('available');
      setRemoteVersion(version);
      setError(null);
    });
    const offNotAvailable = api.onNotAvailable(() => {
      if (!mounted) return;
      setHasChecked(true);
      setPhase('idle');
    });
    const offProgress = api.onProgress((p) => {
      if (!mounted) return;
      setPhase('downloading');
      setProgress(p);
    });
    const offDownloaded = api.onDownloaded(({ version }) => {
      if (!mounted) return;
      setPhase('downloaded');
      setDownloadedVersion(version);
      setRemoteVersion(version);
    });
    const offError = api.onError(({ message }) => {
      if (!mounted) return;
      setPhase('error');
      setError(message);
    });

    return () => {
      mounted = false;
      offChecking();
      offAvailable();
      offNotAvailable();
      offProgress();
      offDownloaded();
      offError();
    };
  }, []);

  const check = async (): Promise<void> => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError(null);
    try {
      await window.api.updates.check();
      // Refresh authoritative state in case events raced with the response.
      const status = await window.api.updates.getStatus();
      setCurrentVersion(status.currentVersion);
      setRemoteVersion(status.remoteVersion);
      setDownloadedVersion(status.downloadedVersion);
      if (status.downloadedVersion) setPhase('downloaded');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setPhase('error');
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  return {
    phase,
    currentVersion,
    remoteVersion,
    downloadedVersion,
    progress,
    error,
    hasChecked,
    busy,
    check,
  };
}
