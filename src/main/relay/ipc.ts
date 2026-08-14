import { ipcMain, BrowserWindow } from 'electron';
import { getRelayManager, RelayStateSnapshot } from './manager';
import { RelayHostInfo } from './protocol';
import syncBroadcaster from '../sync/syncBroadcaster';

function broadcast(channel: string, payload: unknown): void {
  for (const win of BrowserWindow.getAllWindows()) {
    win.webContents.send(channel, payload);
  }
}

export function registerRelayIpc(): void {
  const manager = getRelayManager();

  manager.onStateChange = (snapshot: RelayStateSnapshot) => {
    broadcast('relay:state-change', snapshot);
  };
  manager.onHosts = (hosts: RelayHostInfo[]) => {
    broadcast('relay:hosts', hosts);
  };
  manager.onSyncStatusChange = (snapshot) => {
    broadcast('sync:status-change', snapshot);
  };
  syncBroadcaster.onChange((message) => {
    broadcast('sync:data-change', message);
  });

  ipcMain.handle('relay:get-state', () => manager.getStateSnapshot());
  ipcMain.handle('relay:get-config', () => manager.getConfig());
  ipcMain.handle('relay:get-hosts', () => manager.getHosts());
  ipcMain.handle('relay:reconnect', (_event, cfg) => manager.reconnect(cfg));
  ipcMain.handle('relay:connect-host', (_event, hostId: string, password?: string) => manager.connectToHost(hostId, password));
  ipcMain.handle('relay:save-config', (_event, cfg) => manager.saveConfig(cfg));
  ipcMain.handle('relay:restart', () => manager.restartApp());

  ipcMain.handle('sync:get-status', () => manager.getSyncStatus());
  ipcMain.handle('sync:trigger', () => manager.triggerSync());
  ipcMain.handle('sync:get-conflicts', () => manager.getSyncConflicts());
  ipcMain.handle('sync:resolve-conflict', (_event, conflictId: string, resolution: 'local' | 'remote' | 'merged', mergedDoc?: any) =>
    manager.resolveSyncConflict(conflictId, resolution, mergedDoc));
  ipcMain.handle('sync:reset-and-full-sync', () => manager.resetAndFullSync());
  ipcMain.handle('sync:reconcile', () => manager.reconcileWithHost());
}
