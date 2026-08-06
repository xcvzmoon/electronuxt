import type { BrowserWindow } from 'electron';
import type { UpdaterStatus } from '../shared/schemas.ts';
import { autoUpdater } from 'electron-updater';
import { UPDATER_STATUS_CHANNEL } from '../shared/ipc-channels.ts';
import log from './logger.ts';

autoUpdater.logger = log;

function send(window: BrowserWindow, status: UpdaterStatus): void {
  if (window.isDestroyed()) return;
  window.webContents.send(UPDATER_STATUS_CHANNEL, status);
}

export function setupAutoUpdater(window: BrowserWindow): void {
  autoUpdater.on('checking-for-update', () => send(window, { state: 'checking-for-update' }));

  autoUpdater.on('update-available', (info) =>
    send(window, { state: 'update-available', version: info.version }),
  );

  autoUpdater.on('update-not-available', () => send(window, { state: 'update-not-available' }));

  autoUpdater.on('download-progress', (progress) =>
    send(window, { state: 'downloading', percent: progress.percent }),
  );

  autoUpdater.on('update-downloaded', (info) =>
    send(window, { state: 'update-downloaded', version: info.version }),
  );

  autoUpdater.on('error', (error: Error) =>
    send(window, { state: 'error', message: error.message }),
  );

  autoUpdater
    .checkForUpdatesAndNotify()
    .catch((error: unknown) => log.error('electron/updater: check failed', error));
}
