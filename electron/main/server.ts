import type { ChildProcess } from 'node:child_process';
import { app } from 'electron';
import { fork } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:net';
import { join } from 'node:path';
import log from './logger.ts';

export const API_TOKEN_HEADER = 'x-electron-api-token';

export type NitroServer = {
  url: string;
  token: string;
  close: () => Promise<void>;
};

function portFilePath(): string {
  return join(app.getPath('userData'), 'nitro-port');
}

async function readPersistedPort(): Promise<number | null> {
  try {
    const contents = await readFile(portFilePath(), 'utf8');
    const port = Number(contents.trim());

    if (!Number.isInteger(port) || port < 1024 || port > 65_535) return null;

    return port;
  } catch {
    return null;
  }
}

async function persistPort(port: number): Promise<void> {
  try {
    await writeFile(portFilePath(), String(port), 'utf8');
  } catch (error) {
    log.warn('electron/nitro-server: failed to persist port', error);
  }
}

async function isPortFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const probe = createServer();

    probe.once('error', () => resolve(false));
    probe.listen(port, '127.0.0.1', () => {
      probe.close(() => resolve(true));
    });
  });
}

async function findFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const probe = createServer();

    probe.once('error', reject);
    probe.listen(0, '127.0.0.1', () => {
      const address = probe.address();

      if (address === null || typeof address === 'string') {
        probe.close();
        reject(new Error('electron/nitro-server: failed to allocate a free port'));
        return;
      }

      const { port } = address;
      probe.close(() => resolve(port));
    });
  });
}

// The renderer's web origin includes the port, so reuse the previous port whenever
// it is still free — a new origin every launch would wipe localStorage, IndexedDB,
// and cookies persisted by the renderer.
async function allocatePort(): Promise<number> {
  const persisted = await readPersistedPort();

  if (persisted !== null && (await isPortFree(persisted))) return persisted;

  const port = await findFreePort();
  await persistPort(port);
  return port;
}

async function waitUntilReady(url: string, token: string, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    function attempt(): void {
      fetch(url, { headers: { [API_TOKEN_HEADER]: token } })
        .then((response) => {
          if (!response.ok) {
            throw new Error(`electron/nitro-server: readiness probe got HTTP ${response.status}`);
          }

          resolve();
        })
        .catch((error: unknown) => {
          if (Date.now() > deadline) {
            reject(
              error instanceof Error
                ? error
                : new Error('electron/nitro-server: timed out waiting for server'),
            );
            return;
          }

          setTimeout(attempt, 100);
        });
    }

    attempt();
  });
}

async function closeChild(child: ChildProcess): Promise<void> {
  if (child.exitCode !== null || child.killed) return;
  return new Promise((resolve) => {
    child.once('exit', () => resolve());
    child.kill();
  });
}

export async function startNitroServer(): Promise<NitroServer> {
  const host = '127.0.0.1';
  const port = await allocatePort();
  const token = randomBytes(32).toString('hex');
  const entry = join(process.resourcesPath, 'server', 'index.mjs');
  const child = fork(entry, [], {
    env: { ...process.env, HOST: host, PORT: String(port), NUXT_ELECTRON_API_TOKEN: token },
    stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
  });

  child.stdout?.on('data', (chunk: Buffer) => log.info('[nitro]', chunk.toString().trim()));
  child.stderr?.on('data', (chunk: Buffer) => log.error('[nitro]', chunk.toString().trim()));

  child.on('exit', (code) => {
    if (code !== null && code !== 0) {
      log.error(`electron/nitro-server: exited unexpectedly with code ${code}`);
    }
  });

  const url = `http://${host}:${port}`;

  try {
    await waitUntilReady(url, token, 10_000);
  } catch (error) {
    await closeChild(child);
    throw error;
  }

  app.once('before-quit', () => {
    closeChild(child).catch((error: unknown) =>
      log.error('electron/nitro-server: failed to close', error),
    );
  });

  return {
    url,
    token,
    close: async () => closeChild(child),
  };
}
