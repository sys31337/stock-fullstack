import { ElectronAPI } from '@electron-toolkit/preload';
import { RelayPreloadApi } from './relay';

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      getBaseAppUrl: () => string
      relay: RelayPreloadApi
      [key: string]: unknown
    }
  }
}
