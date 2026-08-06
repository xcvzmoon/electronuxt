import type { ChildProcess } from 'node:child_process';
import { app } from 'electron';
import { fork } from 'node:child_process';
import { createServer } from 'node:net';
import { join } from 'node:path';
import log from './logger.ts';

export type NitroServer = {
  url: string;
  close: () => Promise<void>;
};

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

async function waitUntilReady(url: string, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  return new Promise((resolve, reject) => {
    function attempt(): void {
      fetch(url)
        .then(() => resolve())
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
  const port = await findFreePort();
  const entry = join(process.resourcesPath, 'server', 'index.mjs');
  const child = fork(entry, [], {
    env: { ...process.env, HOST: host, PORT: String(port) },
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
  await waitUntilReady(url, 10_000);

  app.once('before-quit', () => {
    closeChild(child).catch((error: unknown) =>
      log.error('electron/nitro-server: failed to close', error),
    );
  });

  return {
    url,
    close: async () => closeChild(child),
  };
}
