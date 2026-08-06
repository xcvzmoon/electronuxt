import { electronApp, is, optimizer } from '@electron-toolkit/utils';
import { app, BrowserWindow } from 'electron';
import { registerAppIpcHandlers } from './ipc/app.ts';
import log from './logger.ts';
import { startNitroServer } from './server.ts';
import { setupAutoUpdater } from './updater.ts';
import { createMainWindow } from './window.ts';

async function bootstrap(): Promise<void> {
  const mainWindow = createMainWindow();
  const rendererDevUrl = process.env.ELECTRON_RENDERER_URL;

  if (is.dev && rendererDevUrl !== undefined) {
    await mainWindow.loadURL(rendererDevUrl);
    return;
  }

  const server = await startNitroServer();

  await mainWindow.loadURL(server.url);
  setupAutoUpdater(mainWindow);
}

app
  .whenReady()
  .then(async () => {
    electronApp.setAppUserModelId('com.xcvzmoon.electronuxt');

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
