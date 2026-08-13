import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';
import { ElectronAPI, electronAPI } from '@electron-toolkit/preload';
import type {
  RelayConfigDto,
  RelayHostInfo,
  RelayPreloadApi,
  RelayStateSnapshot,
} from './relay';

interface ElectronWindow extends Window {
  electron?: ElectronAPI;
  api?: {
    getBaseAppUrl: () => string;
    relay: RelayPreloadApi;
  }
}

const relayApiArg = process.argv.find((a) => a.startsWith('--relay-api='));
const baseAppUrl = relayApiArg ? relayApiArg.split('=')[1] : 'http://127.0.0.1:3500';

const api: ElectronWindow['api'] = {
  getBaseAppUrl: () => baseAppUrl,
  relay: {
    getState: () => ipcRenderer.invoke('relay:get-state'),
    getConfig: () => ipcRenderer.invoke('relay:get-config'),
    getHosts: () => ipcRenderer.invoke('relay:get-hosts'),
    reconnect: (cfg: Partial<RelayConfigDto>) => ipcRenderer.invoke('relay:reconnect', cfg),
    connectHost: (hostId: string, password?: string) => ipcRenderer.invoke('relay:connect-host', hostId, password),
    saveConfig: (cfg: Partial<RelayConfigDto>) => ipcRenderer.invoke('relay:save-config', cfg),
    restart: () => { ipcRenderer.invoke('relay:restart'); },
    onStateChange: (cb: (snapshot: RelayStateSnapshot) => void) => {
      const listener = (_e: IpcRendererEvent, snapshot: RelayStateSnapshot): void => cb(snapshot);
      ipcRenderer.on('relay:state-change', listener);
      return () => { ipcRenderer.removeListener('relay:state-change', listener); };
    },
    onHosts: (cb: (hosts: RelayHostInfo[]) => void) => {
      const listener = (_e: IpcRendererEvent, hosts: RelayHostInfo[]): void => cb(hosts);
      ipcRenderer.on('relay:hosts', listener);
      return () => { ipcRenderer.removeListener('relay:hosts', listener); };
    },
  },
};

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI);
    contextBridge.exposeInMainWorld('api', api);
  } catch (error) {
    console.error(error);
  }
} else {
  (window as ElectronWindow).electron = electronAPI;
  (window as ElectronWindow).api = api;
}
