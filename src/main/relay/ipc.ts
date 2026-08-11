import { ipcMain, BrowserWindow } from 'electron';
import { getRelayManager, RelayStateSnapshot } from './manager';
import { RelayHostInfo } from './protocol';

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

  ipcMain.handle('relay:get-state', () => manager.getStateSnapshot());
  ipcMain.handle('relay:get-config', () => manager.getConfig());
  ipcMain.handle('relay:get-hosts', () => manager.getHosts());
  ipcMain.handle('relay:reconnect', (_event, cfg) => manager.reconnect(cfg));
  ipcMain.handle('relay:save-config', (_event, cfg) => manager.saveConfig(cfg));
  ipcMain.handle('relay:restart', () => manager.restartApp());
}
