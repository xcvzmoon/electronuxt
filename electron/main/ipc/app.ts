import { app, BrowserWindow, dialog, ipcMain } from 'electron';
import * as v from 'valibot';
import {
  APP_GET_VERSION_CHANNEL,
  APP_SHOW_MESSAGE_BOX_CHANNEL,
} from '../../shared/ipc-channels.ts';
import { messageBoxOptionsSchema } from '../../shared/schemas.ts';

export function registerAppIpcHandlers(): void {
  ipcMain.handle(APP_GET_VERSION_CHANNEL, (): string => app.getVersion());
  ipcMain.handle(APP_SHOW_MESSAGE_BOX_CHANNEL, async (event, options: unknown): Promise<number> => {
    const parsed = v.parse(messageBoxOptionsSchema, options);
    const window = BrowserWindow.fromWebContents(event.sender);

    if (window === null) {
      const message = 'electron/ipc: no window associated with the requesting webContents';
      throw new Error(message);
    }

    const result = await dialog.showMessageBox(window, parsed);
    return result.response;
  });
}
