import { contextBridge } from 'electron';
import { ElectronAPI, electronAPI } from '@electron-toolkit/preload';
import electronReloader from 'electron-reloader';
import { logError } from '../main/api/utils';

interface ElectronWindow extends Window {
  electron?: ElectronAPI;
  api?: { [key: string]: string }
}

const api = {};

if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI);
    contextBridge.exposeInMainWorld('api', api);
  } catch (error) {
    logError(error);
  }
} else {
  (window as ElectronWindow).electron = electronAPI;
  (window as ElectronWindow).api = api;
}

electronReloader(module, { 
  watchRenderer: false // Disable reloader for renderer process, as Vite handles it
});
