# AGENTS.md

Repository guidance for coding agents working in `kickstart-nuxt`.

## Project Snapshot

- Stack: Nuxt 4, Vue 3, TypeScript, `@nuxt/ui`, VueUse, Vitest, Playwright.
- Package manager: `pnpm` (`packageManager` is `pnpm@10.32.1`).
- Module system: ESM (`"type": "module"`).
- Main app code lives in `app/`.
- Unit tests live in `test/unit/`.
- Nuxt runtime/component tests live in `test/nuxt/`.
- End-to-end tests live in `tests/`.
- Generated output dirs such as `.nuxt/`, `.output/`, `.data/`, `.cache/`, `coverage/`, `playwright-report/`, and `test-results/` are ignored artifacts.

## Rule Sources Checked

- Existing `AGENTS.md`: not present before this file was created.
- Cursor rules in `.cursor/rules/`: not present.
- `.cursorrules`: not present.
- Copilot instructions in `.github/copilot-instructions.md`: not present.
- Result: there are no repository-specific Cursor or Copilot rule files to merge; follow this document plus the codebase itself.

## Install And Setup

- Primary package manager is `pnpm`; prefer it for any agent-driven work in this repo.
- Install dependencies with `pnpm install`.
- Bun, npm, and Yarn may work for local development, but support is best-effort because the repository metadata and docs are `pnpm`-first.
- `postinstall` runs `nuxt prepare` automatically and `pnpm prepare` installs Husky.
- Current `.husky/pre-commit` only contains a commented line (`# pnpm test`), so lint/test checks are not currently enforced by Git hooks.
- `lint-staged` runs `oxfmt` and `oxlint` on staged JS/TS-related files.
- If you must translate commands: use `bun run`, `npm run`, or `yarn` for scripts; use `bunx`, `npx`, or `yarn dlx` / `yarn exec` for `pnpm exec` equivalents.
- If the repo is intentionally switched away from `pnpm`, update `package.json` so the Vite override moves from `pnpm.overrides` to top-level `overrides` with `"vite": "npm:rolldown-vite@latest"`.

## Build, Dev, Lint, And Typecheck Commands

- Use the `pnpm` forms below by default; they are the canonical commands for this repo.
- Start local dev server: `pnpm dev`
- Production build: `pnpm build`
- Generate static output: `pnpm generate`
- Preview built app: `pnpm preview`
- Format code: `pnpm format`
- Lint code: `pnpm lint`
- Typecheck app: `pnpm typecheck`

## Test Commands

- Run all Vitest tests: `pnpm test`
- Watch Vitest tests: `pnpm test:watch`
- Run Vitest with coverage: `pnpm test:coverage`
- Run only unit tests: `pnpm test:unit`
- Run only Nuxt tests: `pnpm test:nuxt`
- Run Playwright e2e tests: `pnpm test:e2e`
- Open Playwright UI: `pnpm test:e2e:ui`

## Single-Test Recipes

- Prefer the `pnpm` invocations below even if other package managers are installed locally.
- Run one Vitest file: `pnpm test -- --run test/unit/example.test.ts`
- Run one Vitest project + file: `pnpm test -- --project unit --run test/unit/example.test.ts`
- Run one Nuxt test file: `pnpm test -- --project nuxt --run test/nuxt/component.test.ts`
- Run tests matching a name: `pnpm test -- --run -t "should pass"`
- Run one unit test directly with the project script: `pnpm test:unit -- test/unit/example.test.ts`
- Run one e2e file: `pnpm test:e2e -- tests/example.spec.ts`
- Run one Playwright test by name: `pnpm test:e2e -- -g "example e2e test"`
- Run one Playwright test at a line: `pnpm exec playwright test tests/example.spec.ts:3`

## Recommended Agent Workflow

- After code changes, prefer this validation sequence when relevant: `pnpm format`, `pnpm lint`, `pnpm typecheck`, then the smallest relevant test command.
- For narrow edits, run the smallest targeted test instead of the full suite first.
- If you change shared runtime behavior, run both `pnpm test:unit` and `pnpm test:nuxt`.
- If you change navigation, hydration, or page behavior, run at least one Playwright spec or `pnpm test:e2e`.
- When contributing changes back to the repo, avoid switching lockfiles or package-manager-specific workflows away from `pnpm` unless the task explicitly requires it.
- Do not edit generated output in `.nuxt/`, `.output/`, `coverage/`, or `playwright-report/`.

## Repository Layout Conventions

- Keep application UI code in `app/`.
- Use `app/pages/` for route-driven views.
- Use `app/layouts/` for layout shells.
- Use `app/components/` for reusable components; existing component naming uses PascalCase files such as `ScrollArea.vue`.
- Keep app-level UI configuration in `app/app.config.ts`.
- Keep Nuxt config in `nuxt.config.ts` and test runner config in `vitest.config.ts` / `playwright.config.ts`.

## Formatting Conventions

- Follow `oxfmt`; do not hand-format against it.
- Use 2-space indentation.
- Use semicolons consistently.
- Keep trailing commas where the formatter leaves them in multiline objects, arrays, and calls.
- Accept formatter-driven line wrapping instead of manually compressing code.
- Prefer single quotes in TS and Vue script blocks unless the surrounding file already uses something else.
- Keep one logical statement per line.
- Avoid extra vertical whitespace; current files occasionally contain extra blank lines, but new code should stay tighter and cleaner.

## Import Conventions

- Put imports at the top of the script block or file.
- Use `import type` for type-only imports.
- Separate type-only imports from value imports with a blank line when it improves readability; existing code does this.
- Prefer Node built-ins via the `node:` prefix, e.g. `node:url`.
- Prefer relative or Nuxt aliases already used by the repo; do not introduce new alias schemes without a strong reason.
- In Nuxt SFCs, rely on Nuxt/Vue auto-imports for framework composables when that matches existing code.

## TypeScript And Types

- Default to TypeScript everywhere possible (`<script setup lang="ts">`, `.ts` config/tests).
- Prefer explicit prop typing with `defineProps<Props>()`.
- Prefer `type` aliases for composed shapes and intersections, especially for props.
- Keep prop and local types close to their usage unless shared across multiple files.
- Narrow unions explicitly when the domain is small, e.g. `'vertical' | 'horizontal' | 'both'`.
- Avoid `any`; if unavoidable, contain it and document why.
- Let Nuxt infer framework types where possible instead of duplicating generated types.

## Vue And Nuxt Patterns

- Prefer `<script setup lang="ts">` in Vue SFCs.
- Keep component logic above the template.
- Use computed state for derived values instead of recalculating inside templates.
- Keep templates declarative; move non-trivial logic into script setup.
- Use Nuxt composables such as `useHead` and `useSeoMeta` at the app/page layer for metadata.
- Follow existing `defineNuxtConfig` style: small focused sections, trailing commas, and one concern per block.
- Respect the current module set in `nuxt.config.ts`: `@nuxt/ui`, `@vueuse/nuxt`, `@nuxt/hints`, and `@nuxt/test-utils`.

## Naming Conventions

- Vue component filenames: PascalCase when the file is a reusable component.
- Test filenames: `*.test.ts` or `*.spec.ts` matching the directory conventions already in use.
- Variables and functions: `camelCase`.
- Type aliases and component names: `PascalCase`.
- Constants that are file-local and not true global constants can still use `camelCase`; current code uses `const title` and `const description` rather than all-caps.
- Use descriptive names for computed values, e.g. `delegatedProps`, `isVertical`, `thumbClass`.

## Error Handling Guidance

- There is very little explicit error-handling code in the current starter, so keep error handling simple and idiomatic.
- In app/runtime code, prefer Nuxt-native patterns (`createError`, error pages, or composable-driven state) over ad-hoc console logging.
- Throw plain `Error` only for simple synchronous failures in isolated utilities or tests.
- Add context to errors when rethrowing so failures are actionable.
- Do not swallow errors silently.
- In tests, assert on failure behavior directly instead of wrapping everything in broad `try/catch` blocks.

## Testing Conventions

- Use Vitest for unit and Nuxt runtime/component coverage.
- Use `@nuxt/test-utils/runtime` helpers such as `mountSuspended` for Nuxt-aware component tests.
- Use Playwright for browser/e2e checks.
- Keep tests small and intention-revealing; existing examples use one `describe` with focused `it` cases.
- Name tests by behavior, not implementation details.
- Prefer one assertion group per behavior.
- Put unit tests in `test/unit/`, Nuxt tests in `test/nuxt/`, and Playwright specs in `tests/`.

## UI And Styling Notes

- The starter already uses `@nuxt/ui`; prefer extending that system over introducing parallel component primitives without need.
- Existing UI config uses `primary: 'purple'` and `neutral: 'zinc'` in `app/app.config.ts`; preserve or update intentionally rather than incidentally.
- Existing components use utility-class-heavy templates; follow that local pattern in UI files.
- Keep accessibility in mind for interactive elements and icon-only buttons.

## What To Avoid

- Do not add a new formatter or linter unless the task explicitly requires it.
- Do not move tests into new directories without updating the test config includes.
- Do not commit generated Nuxt or coverage artifacts.
- Do not bypass `pnpm`; repository scripts and dependency metadata assume it.
- Do not introduce inconsistent naming or switch between type styles arbitrarily inside the same file.
