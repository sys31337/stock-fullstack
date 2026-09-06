import { ElectronAPI } from '@electron-toolkit/preload';
import { RelayPreloadApi } from './relay';
import { UpdatePreloadApi } from './updates';

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      getBaseAppUrl: () => string
      relay: RelayPreloadApi
      updates: UpdatePreloadApi
      [key: string]: unknown
    }
  }
}
