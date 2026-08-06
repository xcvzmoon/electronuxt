import type { UpdaterStatus } from '../shared/schemas.ts';
import { BrowserWindow } from 'electron';
import { autoUpdater } from 'electron-updater';
import { UPDATER_STATUS_CHANNEL } from '../shared/ipc-channels.ts';
import log from './logger.ts';

autoUpdater.logger = log;

function send(status: UpdaterStatus): void {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send(UPDATER_STATUS_CHANNEL, status);
  }
}

export function setupAutoUpdater(): void {
  autoUpdater.on('checking-for-update', () => send({ state: 'checking-for-update' }));

  autoUpdater.on('update-available', (info) =>
    send({ state: 'update-available', version: info.version }),
  );

  autoUpdater.on('update-not-available', () => send({ state: 'update-not-available' }));

  autoUpdater.on('download-progress', (progress) =>
    send({ state: 'downloading', percent: progress.percent }),
  );

  autoUpdater.on('update-downloaded', (info) =>
    send({ state: 'update-downloaded', version: info.version }),
  );

  autoUpdater.on('error', (error: Error) => send({ state: 'error', message: error.message }));

  autoUpdater
    .checkForUpdatesAndNotify()
    .catch((error: unknown) => log.error('electron/updater: check failed', error));
}
