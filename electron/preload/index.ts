import type { IpcRendererEvent } from 'electron';
import type { MessageBoxOptions, UpdaterStatus } from '../shared/schemas.ts';
import { electronAPI } from '@electron-toolkit/preload';
import { contextBridge, ipcRenderer } from 'electron';
import * as v from 'valibot';
import {
  APP_GET_VERSION_CHANNEL,
  APP_SHOW_MESSAGE_BOX_CHANNEL,
  UPDATER_STATUS_CHANNEL,
} from '../shared/ipc-channels.ts';

async function getAppVersion(): Promise<string> {
  const result: unknown = await ipcRenderer.invoke(APP_GET_VERSION_CHANNEL);
  return v.parse(v.string(), result);
}

async function showMessageBox(options: MessageBoxOptions): Promise<number> {
  const result: unknown = await ipcRenderer.invoke(APP_SHOW_MESSAGE_BOX_CHANNEL, options);
  return v.parse(v.number(), result);
}

function onUpdaterStatus(callback: (status: UpdaterStatus) => void): () => void {
  function listener(_event: IpcRendererEvent, status: UpdaterStatus): void {
    callback(status);
  }

  ipcRenderer.on(UPDATER_STATUS_CHANNEL, listener);

  return () => {
    ipcRenderer.removeListener(UPDATER_STATUS_CHANNEL, listener);
  };
}

const api = { getAppVersion, showMessageBox, onUpdaterStatus };

export type Api = typeof api;

try {
  contextBridge.exposeInMainWorld('electron', electronAPI);
  contextBridge.exposeInMainWorld('api', api);
} catch (error) {
  console.error(error);
}
