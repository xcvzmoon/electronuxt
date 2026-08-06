import { BrowserWindow, shell } from 'electron';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import log from './logger.ts';

const dirname = fileURLToPath(new URL('.', import.meta.url));

export function createMainWindow(): BrowserWindow {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 960,
    minHeight: 600,
    show: false,
    webPreferences: {
      preload: join(dirname, '../preload/index.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.once('ready-to-show', () => mainWindow.show());

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell
      .openExternal(details.url)
      .catch((error: unknown) => log.error('electron/window: failed to open external url', error));

    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    const target = new URL(url);
    const current = new URL(mainWindow.webContents.getURL());

    if (target.origin === current.origin) return;

    event.preventDefault();
    shell
      .openExternal(url)
      .catch((error: unknown) => log.error('electron/window: failed to open external url', error));
  });

  return mainWindow;
}
