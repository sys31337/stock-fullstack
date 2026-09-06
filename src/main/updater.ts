import { app, BrowserWindow, ipcMain } from 'electron';
import { autoUpdater, type ProgressInfo, type UpdateInfo } from 'electron-updater';
import { is } from '@electron-toolkit/utils';

let checkInProgress = false;
let installTriggered = false;
let downloadedInfo: UpdateInfo | null = null;
let knownRemoteVersion: string | null = null;

function broadcast(channel: string, payload?: unknown): void {
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send(channel, payload);
  }
}

function log(message: string): void {
  // The codebase logs main-process diagnostics to stderr.
  console.error(`[updater] ${message}`);
}

function configureUpdater(): void {
  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.logger = {
    info: (m) => log(String(m)),
    warn: (m) => log(String(m)),
    error: (m) => log(String(m)),
    debug: (m) => log(String(m)),
  };

  if (is.dev) {
    // When running unpacked, electron-updater only checks the feed if we force
    // the dev config. This lets us exercise the OTA loop before shipping a build.
    autoUpdater.forceDevUpdateConfig = true;
  }
}

/**
 * Background check triggered shortly after app startup. Downloads start
 * automatically (autoDownload) and the renderer is only prompted once the
 * update is fully downloaded, so startup is never blocked.
 */
export async function runStartupUpdateCheck(): Promise<void> {
  if (checkInProgress) return;
  checkInProgress = true;
  try {
    log('checking for updates (startup)');
    await autoUpdater.checkForUpdates();
  } catch (err) {
    log(`startup check failed: ${err instanceof Error ? err.message : String(err)}`);
  } finally {
    checkInProgress = false;
  }
}

export function initUpdater(): void {
  configureUpdater();

  autoUpdater.on('checking-for-update', () => {
    broadcast('update:checking');
  });

  autoUpdater.on('update-available', (info: UpdateInfo) => {
    knownRemoteVersion = info.version;
    log(`update available: v${info.version}`);
    broadcast('update:available', { version: info.version });
  });

  autoUpdater.on('update-not-available', () => {
    log('no update available');
    broadcast('update:not-available');
  });

  autoUpdater.on('download-progress', (progress: ProgressInfo) => {
    broadcast('update:download-progress', {
      percent: progress.percent,
      transferred: progress.transferred,
      total: progress.total,
      bytesPerSecond: progress.bytesPerSecond,
    });
  });

  autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
    downloadedInfo = info;
    knownRemoteVersion = info.version;
    log(`update downloaded: v${info.version}`);
    broadcast('update:downloaded', { version: info.version });

    if (installTriggered) return;
    installTriggered = true;
    // Silent install by design: no prompt, the app just restarts with the new
    // version. The short delay lets the renderer paint the 'downloaded' state
    // before we quit and the NSIS installer runs.
    setTimeout(() => {
      log('installing update silently');
      autoUpdater.quitAndInstall(true, true);
    }, 3000);
  });

  autoUpdater.on('error', (err: Error) => {
    log(`error: ${err?.message ?? String(err)}`);
    broadcast('update:error', { message: err?.message ?? String(err) });
  });

  ipcMain.handle('update:check', async () => {
    if (checkInProgress) {
      return { status: 'checking' };
    }
    checkInProgress = true;
    try {
      const result = await autoUpdater.checkForUpdates();
      return {
        status: 'ok',
        currentVersion: app.getVersion(),
        remoteVersion: result?.updateInfo?.version ?? knownRemoteVersion ?? null,
        downloadedVersion: downloadedInfo?.version ?? null,
      };
    } catch (err) {
      return {
        status: 'error',
        error: err instanceof Error ? err.message : String(err),
      };
    } finally {
      checkInProgress = false;
    }
  });

  ipcMain.handle('update:get-status', () => ({
    currentVersion: app.getVersion(),
    remoteVersion: knownRemoteVersion,
    downloadedVersion: downloadedInfo?.version ?? null,
  }));
}
