import type { ElectronAPI } from '@electron-toolkit/preload';
import type { Api } from '../../electron/preload/index.ts';

declare global {
  interface Window {
    electron: ElectronAPI;
    api: Api;
  }
}

export {};
