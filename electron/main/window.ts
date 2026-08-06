import { BrowserWindow, shell } from 'electron';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import log from './logger.ts';

const dirname = fileURLToPath(new URL('.', import.meta.url));
const externalProtocols = new Set(['http:', 'https:']);

function parseUrl(url: string): URL | null {
  try {
    return new URL(url);
  } catch {
    return null;
  }
}

function openExternalUrl(url: string): void {
  const target = parseUrl(url);

  if (target === null || !externalProtocols.has(target.protocol)) {
    log.warn(`electron/window: blocked external url ${url}`);
    return;
  }

  shell
    .openExternal(url)
    .catch((error: unknown) => log.error('electron/window: failed to open external url', error));
}

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
    openExternalUrl(details.url);
    return { action: 'deny' };
  });

  mainWindow.webContents.on('will-navigate', (event, url) => {
    const target = parseUrl(url);
    const current = parseUrl(mainWindow.webContents.getURL());

    if (target !== null && current !== null && target.origin === current.origin) return;

    event.preventDefault();
    openExternalUrl(url);
  });

  return mainWindow;
}
