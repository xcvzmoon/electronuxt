/// <reference types="node" />

import type { ChildProcess } from 'node:child_process';
import { spawn } from 'node:child_process';

const isWindows = process.platform === 'win32';
const localUrlPattern = /Local:\s+(http:\/\/\S+)/;

function stripAnsi(text: string): string {
  // oxlint-disable-next-line no-control-regex
  return text.replaceAll(/\u001B\[[0-9;]*m/g, '');
}

function killTree(child: ChildProcess): void {
  if (child.exitCode !== null || child.killed) return;

  if (child.pid === undefined) {
    child.kill();
    return;
  }

  if (isWindows) {
    spawn('taskkill', ['/pid', String(child.pid), '/t', '/f']);
    return;
  }

  try {
    process.kill(-child.pid, 'SIGTERM');
  } catch {
    child.kill();
  }
}

async function waitForNuxtUrl(nuxt: ChildProcess): Promise<string> {
  const { stdout } = nuxt;

  if (stdout === null) {
    const message = 'electron-dev: nuxt process has no stdout to read';
    throw new Error(message);
  }

  return new Promise((resolve, reject) => {
    let resolved = false;
    let buffered = '';

    function onData(chunk: Buffer): void {
      process.stdout.write(chunk);

      if (resolved) return;

      buffered += stripAnsi(chunk.toString());

      const match = localUrlPattern.exec(buffered);

      if (match) {
        const [, url] = match;
        resolved = true;
        resolve(url);
      }
    }

    function onExit(code: number | null): void {
      if (resolved) return;
      reject(
        new Error(
          `electron-dev: nuxt dev exited before printing its URL (code ${code ?? 'unknown'})`,
        ),
      );
    }

    stdout.on('data', onData);
    nuxt.once('exit', onExit);
  });
}

async function waitForResponse(url: string, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;

  async function attempt(): Promise<void> {
    try {
      await fetch(url);
    } catch (error) {
      if (Date.now() > deadline) {
        const message = `electron-dev: timed out waiting for ${url}`;
        throw error instanceof Error ? new Error(message, { cause: error }) : new Error(message);
      }

      await new Promise((resolve) => {
        setTimeout(resolve, 250);
      });

      await attempt();
    }
  }

  await attempt();
}

(async function main(): Promise<void> {
  const children: ChildProcess[] = [];

  function cleanup(): void {
    for (const child of children) killTree(child);
  }

  process.once('SIGINT', () => {
    cleanup();
    process.exitCode = 0;
  });

  process.once('SIGTERM', () => {
    cleanup();
    process.exitCode = 0;
  });

  const nuxt = spawn('pnpm', ['exec', 'nuxt', 'dev', '--port', '3000'], {
    stdio: ['inherit', 'pipe', 'inherit'],
    shell: isWindows,
    detached: !isWindows,
  });

  children.push(nuxt);

  const nuxtURL = await waitForNuxtUrl(nuxt);

  await waitForResponse(nuxtURL, 60_000);

  const electron = spawn('pnpm', ['exec', 'electron-vite', 'dev'], {
    stdio: 'inherit',
    shell: isWindows,
    detached: !isWindows,
    env: { ...process.env, ELECTRON_RENDERER_URL: nuxtURL },
  });

  children.push(electron);

  electron.on('exit', (code) => {
    cleanup();
    process.exitCode = code ?? 0;
  });
})().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
