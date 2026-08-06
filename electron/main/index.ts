import type { NitroServer } from './server.ts';
import { electronApp, is, optimizer } from '@electron-toolkit/utils';
import { app, BrowserWindow, session } from 'electron';
import { registerAppIpcHandlers } from './ipc/app.ts';
import log from './logger.ts';
import { API_TOKEN_HEADER, startNitroServer } from './server.ts';
import { setupAutoUpdater } from './updater.ts';
import { createMainWindow } from './window.ts';

let nitroServer: NitroServer | null = null;

function attachApiTokenHeader(server: NitroServer): void {
  session.defaultSession.webRequest.onBeforeSendHeaders(
    { urls: [`${server.url}/*`] },
    (details, callback) => {
      callback({
        requestHeaders: { ...details.requestHeaders, [API_TOKEN_HEADER]: server.token },
      });
    },
  );
}

async function resolveRendererUrl(): Promise<string> {
  const rendererDevUrl = process.env.ELECTRON_RENDERER_URL;

  if (is.dev && rendererDevUrl !== undefined) return rendererDevUrl;

  if (nitroServer === null) {
    nitroServer = await startNitroServer();
    attachApiTokenHeader(nitroServer);
    setupAutoUpdater();
  }

  return nitroServer.url;
}

async function bootstrap(): Promise<void> {
  const url = await resolveRendererUrl();
  const mainWindow = createMainWindow();

  await mainWindow.loadURL(url);
}

function focusExistingWindow(): void {
  const [window] = BrowserWindow.getAllWindows();

  if (window === undefined) return;
  if (window.isMinimized()) window.restore();

  window.focus();
}

if (app.requestSingleInstanceLock()) {
  app.on('second-instance', () => focusExistingWindow());

  app
    .whenReady()
    .then(async () => {
      electronApp.setAppUserModelId('com.xcvzmoon.electronuxt');

      session.defaultSession.setPermissionRequestHandler((_webContents, _permission, callback) => {
        callback(false);
      });

      app.on('browser-window-created', (_event, window) => {
        optimizer.watchWindowShortcuts(window);
      });

      registerAppIpcHandlers();

      try {
        await bootstrap();
      } catch (error) {
        log.error('electron/main: failed to start', error);
        app.quit();
      }

      app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
          bootstrap().catch((error: unknown) =>
            log.error('electron/main: failed to reopen window', error),
          );
        }
      });
    })
    .catch((error: unknown) => log.error('electron/main: whenReady failed', error));

  app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });
} else {
  app.quit();
}
