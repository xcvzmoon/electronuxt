# Electronuxt

[![CI](https://github.com/xcvzmoon/electronuxt/actions/workflows/ci.yml/badge.svg)](https://github.com/xcvzmoon/electronuxt/actions/workflows/ci.yml)

This is my personal starter template for quickly bootstrapping new Electron with Nuxt projects.

## Features

- Nuxt 4 + Vue 3 + TypeScript
- UI with `@nuxt/ui`
- Formatter with `oxfmt`
- Linter with `oxlint` and `oxlint-tsgolint`
- Typechecking with `nuxt typecheck`
- Testing with Vitest unit tests, Nuxt runtime/component tests, Playwright e2e tests, and Playwright UI mode
- Rolldown-powered Vite setup via the `vite` override in `pnpm`

## Scaffold A Project

Recommended with pnpm:

```bash
pnpx giget@latest gh:xcvzmoon/electronuxt my-app --install
```

If you prefer to install dependencies yourself after scaffolding:

```bash
pnpx giget@latest gh:xcvzmoon/electronuxt my-app
cd my-app
pnpm install
```

## Package Manager Support

This template is configured for `pnpm` first.

- `packageManager` in `package.json` is pinned to `pnpm@10.32.1`.
- Day-to-day commands in the repo use `pnpm`.
- Husky, `lint-staged`, lockfile behavior, and agent docs are all written with `pnpm` in mind.
- This repo was initially set up with `pnpm`, and some checked-in files contain `pnpm`-specific configuration.
- Notable `pnpm`-specific files include `.github/workflows/ci.yml`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, and `renovate.json`.
- Those files contain commands or settings that only work as-is with `pnpm`, such as CI install/cache steps, `pnpm` lockfile maintenance, `pnpmDedupe`, workspace settings, and the `pnpm`-scoped Vite override.
- Some package-manager-specific behavior may differ if you use Bun, npm, or Yarn.

Other package managers can still work for local development, but treat them as best-effort rather than the primary supported path.

## Install Dependencies

### pnpm

```bash
pnpm install
```

### Bun

```bash
bun install
```

### npm

```bash
npm install
```

### Yarn

```bash
yarn install
```

## Common Commands

```bash
pnpm dev
pnpm build
pnpm preview
pnpm lint
pnpm typecheck
pnpm test
pnpm test:unit
pnpm test:nuxt
pnpm test:e2e
pnpm test:e2e:ui
```

## Important Notes For Non-pnpm Users

- Prefer `pnpm` if you want the most predictable setup for this repository.
- If a command in the docs uses `pnpm exec`, translate it to the equivalent runner for your package manager:
  - Bun: `bunx`
  - npm: `npx`
  - Yarn: `yarn dlx` or `yarn exec`, depending on the command
- If you want full non-`pnpm` support, you will likely need to update `.github/workflows/ci.yml`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, and `renovate.json` to match your chosen package manager.
- If you move away from `pnpm`, also update `package.json` so the Vite override is top-level instead of nested under `pnpm`:

```json
{
  "overrides": {
    "vite": "npm:rolldown-vite@latest"
  }
}
```

- If you contribute back to this template, use `pnpm` so changes stay aligned with the checked-in package manager metadata.
- If you hit dependency resolution or lockfile issues with Bun, npm, or Yarn, switch back to `pnpm` before debugging further.
