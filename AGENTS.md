## Project overview

`electronuxt` is a Nuxt 4 application using Vue 3, shadcn-vue (`reka-lyra` style) for UI components, Tailwind CSS v4, and Valibot for validation. Package management is pnpm (Node version pinned in `.nvmrc`).

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

There is no test suite/command in this project currently.

Pre-commit (husky + lint-staged) runs `oxfmt` and `oxlint` on staged files; `oxlint` skips `app/components/ui/**` (shadcn-generated components) and `.d.ts` files — see `lint-staged.config.ts` and the matching `ignorePatterns` in `oxlint.config.ts`. Pre-push runs `pnpm run typecheck`.

CI (`.github/workflows/ci.yaml`) runs `lint`, `format`, `typecheck`, and `build` as separate jobs on push/PR to `main` — these four must all pass; the `ci` job aggregates results. The `format` job runs `pnpm exec oxfmt --check` directly (equivalent to the check half of `pnpm fmt`).

## Architecture

- Nuxt 4 directory structure: application code lives under `app/` (`app/app.vue` is the root component). Nuxt's auto-imports apply to composables/components under `app/`.
- `app/components/ui/` holds shadcn-vue generated components (e.g. `Button.vue`) — these are treated as vendored code: excluded from oxlint and not hand-edited for style. Add/update them via the shadcn-vue CLI rather than editing generated output by hand, per `components.json`.
- `app/lib/utils.ts` provides the shadcn-style `cn()` helper (clsx + tailwind-merge) used for conditional class composition.
- Styling: Tailwind CSS v4 via the `@tailwindcss/vite` plugin, entry stylesheet at `app/assets/css/tailwind.css`, no separate Tailwind config file (`components.json` → `tailwind.config: ""`).
- Dark mode: `@nuxtjs/color-mode` module (`classSuffix: ''`), toggled via `useColorMode()` (see `app/components/ThemeToggler.vue`).
- Icons: `@iconify/vue` with the `lucide` icon set (`@iconify-json/lucide`, `@iconify-json/lucide-lab`), plus `@lucide/vue` for direct icon components.
- Path aliases (`components.json`): `@/components`, `@/components/ui`, `@/lib`, `@/composables` — keep new code consistent with these when adding directories.
- `.agents/skills/` contains bundled reference skills (Nuxt, Vue, Pinia, shadcn-vue, VueUse, design guidelines) and `.claude/skills/` holds additional skills — consult these for framework-specific idioms before reaching for outside documentation.
- `.mcp.json` exposes the `shadcn` MCP server (for component management); it is repo-local OpenCode config.

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
