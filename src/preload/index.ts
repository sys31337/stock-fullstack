import { contextBridge } from 'electron';
import { ElectronAPI, electronAPI } from '@electron-toolkit/preload';

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
    console.error(error);
  }
} else {
  (window as ElectronWindow).electron = electronAPI;
  (window as ElectronWindow).api = api;
}
