---
name: lint-and-fix
description: Run ESLint (type-aware fixes and checks) then Trunk for formatting and remaining linters. Use when code quality checks fail, before submitting PRs, or to repair broken linting states.
---

# Lint and Fix Loop: ESLint + Trunk

## Purpose

An autonomous loop for the agent to identify, fix, and verify linting and formatting violations. Run **ESLint first** (scoped when possible), then **Trunk** (`pnpm format` / `pnpm lint`). This matches the layered harness in root `AGENTS.md`.

## Tool split

| Tool                                          | Role                                                                                                                                                                |
| --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **`pnpm format:eslint` / `pnpm lint:eslint`** | TypeScript-aware rules, import order, complexity, security plugin rules; `--fix` via `format:eslint`. Prefer a path after `--` for fast feedback (see scope below). |
| **`pnpm format` / `pnpm lint`**               | Trunk: Prettier, ESLint again, Trivy, OSV-scanner, and other enabled linters. Do not add ESLint stylistic rules that duplicate Prettier.                            |
| **`pnpm knip`**                               | Unused deps, exports, entrypoints — run when workspace-wide dependency or export surface may have changed.                                                          |

Trunk in CI also runs ESLint; direct `lint:eslint` gives **faster scoped feedback** and **`--fix`** before Trunk.

## Scope convention

When the parent task names a package or directory, pass it after `--`:

- Example: `pnpm lint:eslint -- packages/bq-inspect/src`
- Omit the path only for changes that touch multiple packages or repo-wide config.

See [packages/bq-inspect/CONTRIBUTING.md](../../../packages/bq-inspect/CONTRIBUTING.md) for package-local examples.

## Loop logic

1. **Auto-fix (ESLint):** `pnpm format:eslint -- <path>` (omit `<path>` only for full-repo changes).
2. **Check (ESLint):** `pnpm lint:eslint -- <path>`.
3. **Fix:** Apply minimum source edits for remaining ESLint errors.
4. Repeat steps 2–3 until ESLint is clean (max 5 iterations).
5. **Format (Trunk):** `pnpm format`.
6. **Check (Trunk):** `pnpm lint`.
7. Repeat steps 5–6 if needed.
8. **Knip (optional):** `pnpm knip` when dependencies, exports, or entrypoints may have changed.

## Termination criteria

- No errors from `pnpm lint:eslint` (for the chosen scope) and no errors from `pnpm lint`.
- Reached max iteration limit (default: 5) for the ESLint sub-loop or the Trunk sub-loop.

## Examples

### Scenario: Scoped package work (bq-inspect)

1. `pnpm format:eslint -- packages/bq-inspect/src`
2. `pnpm lint:eslint -- packages/bq-inspect/src` — fix any remaining issues manually or re-run format:eslint if applicable.
3. `pnpm format` then `pnpm lint` for full Trunk + Knip alignment when needed.

### Scenario: Format-only drift after ESLint is clean

1. `pnpm lint` reports Prettier or other Trunk issues.
2. Run `pnpm format`.
3. Re-run `pnpm lint`.

## Resources

- [Trunk Documentation](https://docs.trunk.io/): Trunk CLI.
- Root [AGENTS.md](../../../AGENTS.md): layered quality harness and suggested pre-commit gate.
