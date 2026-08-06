# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

`electronuxt` is a Nuxt 4 application using Vue 3, shadcn-vue (`reka-lyra` style) for UI components, Tailwind CSS v4, and Valibot for validation. Package management is pnpm (Node version pinned in `.nvmrc`). It also ships as a desktop app: Electron wraps the same Nuxt app, running its full SSR/Nitro server locally rather than a static build — see the Electron subsection under Architecture.

## Commands

- `pnpm install` — install dependencies (also runs `nuxt prepare` via `postinstall`)
- `pnpm dev` — start the dev server
- `pnpm build` — production build (`nuxt build`)
- `pnpm generate` — static site generation
- `pnpm preview` — preview a production build
- `pnpm typecheck` — type-check via `nuxt typecheck` (vue-tsc); this is what `pre-push` runs
- `pnpm lint` — run oxlint
- `pnpm fmt` — run oxfmt and then check formatting
- `pnpm release <patch|minor|major>` — bump version via `changelogen`, commit, tag, and push (`scripts/release.ts`)
- `pnpm dev:electron` — run the Electron app in dev (`scripts/electron-dev.ts` starts `nuxt dev` and `electron-vite dev` pointed at it)
- `pnpm build:electron` — build the Electron main/preload bundles only (`electron-vite build`)
- `pnpm package` — full production build (`nuxt build` + `build:electron`) and package the desktop app locally via `electron-builder`

There is no test suite/command in this project currently.

Pre-commit (husky + lint-staged) runs `oxfmt` and `oxlint` on staged files; `oxlint` skips `app/components/ui/**` (shadcn-generated components) and `.d.ts` files — see `lint-staged.config.ts` and the matching `ignorePatterns` in `oxlint.config.ts`. Pre-push runs `pnpm run typecheck` (this also type-checks `electron/` via `tsc -p electron/tsconfig.json`).

CI (`.github/workflows/ci.yaml`) runs `lint`, `format`, `typecheck`, `build`, and `build-electron` as separate jobs on push/PR to `main` — these five must all pass; the `ci` job aggregates results. The `format` job runs `pnpm exec oxfmt --check` directly (equivalent to the check half of `pnpm fmt`). `.github/workflows/release.yaml` triggers on `v*` tag pushes (i.e. after `pnpm release`) and packages + publishes the desktop app to a GitHub Release for mac/Windows/Linux via `electron-builder --publish always`; it isn't gated by `ci.yaml`.

## Architecture

- Nuxt 4 directory structure: application code lives under `app/` (`app/app.vue` is the root component). Nuxt's auto-imports apply to composables/components under `app/`.
- `app/components/ui/` holds shadcn-vue generated components (e.g. `Button.vue`) — these are treated as vendored code: excluded from oxlint and not hand-edited for style. Add/update them via the shadcn-vue CLI rather than editing generated output by hand, per `components.json`.
- `app/lib/utils.ts` provides the shadcn-style `cn()` helper (clsx + tailwind-merge) used for conditional class composition.
- Styling: Tailwind CSS v4 via the `@tailwindcss/vite` plugin, entry stylesheet at `app/assets/css/tailwind.css`, no separate Tailwind config file (`components.json` → `tailwind.config: ""`).
- Dark mode: `@nuxtjs/color-mode` module (`classSuffix: ''`), toggled via `useColorMode()` (see `app/components/ThemeToggler.vue`).
- Icons: `@iconify/vue` with the `lucide` icon set (`@iconify-json/lucide`, `@iconify-json/lucide-lab`), plus `@lucide/vue` for direct icon components.
- Path aliases (`components.json`): `@/components`, `@/components/ui`, `@/lib`, `@/composables` — keep new code consistent with these when adding directories.
- `.agents/skills/` contains bundled reference skills (Nuxt, Vue, Pinia, shadcn-vue, VueUse, Electron, design guidelines) and `.claude/skills/` holds additional skills — consult these for framework-specific idioms before reaching for outside documentation.
- `.mcp.json` exposes the `shadcn` MCP server (for component management); it is repo-local OpenCode config.

### Electron desktop shell

- `electron/main/` — main process: `index.ts` (app lifecycle with single-instance lock, deny-all `setPermissionRequestHandler`, IPC registration; the Nitro server and auto-updater are started once and reused across macOS window reopens), `window.ts` (`BrowserWindow` creation with `contextIsolation`/`sandbox` on; external links restricted to `http:`/`https:`), `server.ts` (production only: forks the built `.output/server/index.mjs` Nitro server on a `127.0.0.1` port and waits for it to respond; the port is persisted in `userData/nitro-port` and reused while free because the renderer origin includes the port — a fresh port would wipe localStorage/IndexedDB/cookies), `updater.ts` (`electron-updater` wired to GitHub Releases), `logger.ts` (`electron-log`), `ipc/` (`ipcMain.handle` handlers, Valibot-validated at the boundary).
- Local API auth: because the Nitro server listens on `127.0.0.1` where any local process can reach it, `server.ts` generates a per-launch token, passes it to the child via `NUXT_ELECTRON_API_TOKEN` (runtime config `electronApiToken`), and `index.ts` stamps it onto all renderer requests to the server origin via `session.defaultSession.webRequest.onBeforeSendHeaders` (`x-electron-api-token`). `server/middleware/electron-api-token.ts` rejects requests without it; with an empty token (plain `nuxt dev`/`nuxt preview`, Electron dev against the Nuxt dev server) the check is disabled.
- `electron/preload/index.ts` — `contextBridge`-exposed `window.api`/`window.electron`; its `Api` type is the source of truth for the renderer (Nuxt app) side.
- `electron/shared/` — IPC channel name constants and Valibot schemas shared between main and preload.
- Dev vs. production load different renderers: in dev, the window loads Nuxt's own dev server URL (`ELECTRON_RENDERER_URL`, set by `scripts/electron-dev.ts`) for full HMR; in production it loads `http://127.0.0.1:<port>` from the forked Nitro server — the app keeps full SSR/`server/api` semantics rather than becoming a static SPA.
- `electron.vite.config.ts` builds `electron/main` and `electron/preload` only (no `renderer` key) to `.electron/dist/main`/`.electron/dist/preload`, with dependencies bundled in (not externalized) so the packaged app needs no runtime `node_modules`. Main builds ESM (`format: 'es'`, `.js`/`.mjs`-safe since `package.json` is `"type": "module"`); preload is forced to `format: 'cjs'` (emits `index.cjs`) because Electron's sandboxed preload loader (`sandbox: true` in `window.ts`) executes preload scripts as CommonJS and cannot run `import` statements, regardless of file extension. `build.externalizeDeps: false` is required on both — electron-vite defaults this to `true` and silently re-externalizes anything in package.json `dependencies` (e.g. `valibot`) even without the `externalizeDepsPlugin`, which crashes the sandboxed preload (`require()` can't resolve arbitrary npm packages there).
- `electron-builder.yaml` packages `.electron/dist/**` plus `package.json` (matching `package.json`'s `main: ./.electron/dist/main/index.js`) to output dir `.electron/release`, explicitly excludes `node_modules`, and ships `.output/server` and `.output/public` as `extraResources` (`resources/server`, `resources/public`) — `server.ts` expects both present as siblings, matching Nitro's own `.output` layout. `.output/server/node_modules` (Nitro's own externalized SSR deps, e.g. `vue`, `unhead`) needs its own separate `extraResources` entry (`from: .output/server/node_modules, to: server/node_modules`) — electron-builder hardcodes an unconditional exclusion of any directory named exactly `node_modules` at the root of a copy source, so it silently drops that folder if copied as part of the parent `server` entry. The mac target is `[dmg, zip]` — `electron-updater` downloads the zip on macOS, so a dmg-only target silently breaks auto-update (which also requires the app to be code-signed on macOS).
- `electron/tsconfig.json` is a separate Node-targeted TS project (not part of the Nuxt/vue-tsc project references); `pnpm typecheck` runs both.

## Code conventions

- `verbatimModuleSyntax` is on — use `import type` for type-only imports.
- Use explicit `.ts` extensions in import paths.
- Single quotes, no semicolons.
- `no-console` only allows `console.error`.
- No `!` non-null assertions and no `as` type assertions (`no-non-null-assertion`, `no-unsafe-type-assertion` are errors) — narrow `unknown` explicitly instead, but don't create an `isRecord` helper for it.
- `filename-case` is enforced — use kebab-case for files.
- No barrel/re-export index files (`no-barrel-file`).
- No `Array.forEach`/`Array.reduce` — prefer `for...of` (`no-array-for-each`, `no-array-reduce`).
- Prefer `type` over `interface`; prefer string literal unions for small state enums (e.g. `'ok' | 'error'`).
- Add explicit return types to exported functions and non-trivial helpers.
- Prefer `function name()` for named functions/helpers over `const fn = () => {}`; the exception is callbacks, which stay as arrows (e.g. `items.map((item) => item.id)`).
- Prefer functions over classes; existing correct classes can stay as-is.
- Destructure when only one or two properties are needed from an iterated item and it won't conflict with other variables. Don't abbreviate iterable item names (`item`, `entry`, `record`, `status`, not one-letter names, except conventional indexes).
- Use Valibot (`v.pipe()` with built-in actions) for environment parsing, form validation, and request validation — validate once at the boundary, not in inner layers. Never throw raw strings; include stable error codes in config/app-level failures; clean up temporary resources in `finally` blocks.

## Working in this repo

- Make the smallest correct change; don't polish unrelated code or expand into a repo-wide refactor unless necessary.
- Do not preserve backward compatibility — remove obsolete code instead of adding compatibility shims, fallbacks, or migrations.
- Choose the simplest implementation that meets the current requirement; avoid speculative abstraction/config.
- Grow the system in layers: keep it working end to end, and build new capability on top of that rather than landing unfinished complexity.
- Prefer established, already-installed dependencies over reimplementing functionality or adding new packages — check the library's docs/types before assuming it can't do something.
- Match the surrounding file's formatting instead of hand-styling custom layouts.
- Disable co-author attribution; do not commit or push (the user handles releases via `pnpm release`).

## Reference docs

- Nitro v3: https://nitro.build/llms.txt
- shadcn-vue: https://www.shadcn-vue.com/llms.txt
- electron-vite: https://electron-vite.org
- electron-builder: https://www.electron.build
