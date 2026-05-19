# Contributing to google-cloud-tools

This repository is a **pnpm workspace umbrella**: shared tooling at the root, **independent npm packages** under `packages/`. This document covers clone, install, and workspace-wide checks. Package-specific development guides are linked below.

## Prerequisites

- **Node.js** — see [`.node-version`](.node-version) (currently 24.x).
- **pnpm** — v11+ per [AGENTS.md](AGENTS.md) and root `package.json` `packageManager`.

## Clone and install

From the repository root:

```bash
pnpm install
```

Optional: prefetch Trunk tools — `pnpm exec trunk install` (see root [README.md](README.md)).

## Workspace commands

Run from the **repository root**:

```bash
pnpm build          # all packages
pnpm test           # Vitest workspace (with coverage thresholds)
pnpm lint           # Trunk + Knip
pnpm format         # Trunk formatters
pnpm knip           # unused deps/exports (run when layout or deps change)
```

Scoped ESLint (example for one package):

```bash
pnpm format:eslint -- packages/bq-inspect/src
pnpm lint:eslint -- packages/bq-inspect/src
```

For agent-oriented lint order and repo conventions, see [AGENTS.md](AGENTS.md).

## Packages

| Package                            | npm name     | User docs                               | Developer guide                                     |
| ---------------------------------- | ------------ | --------------------------------------- | --------------------------------------------------- |
| [bq-inspect](packages/bq-inspect/) | `bq-inspect` | [README](packages/bq-inspect/README.md) | [CONTRIBUTING](packages/bq-inspect/CONTRIBUTING.md) |

When adding a new package, add a row here and a `packages/<name>/CONTRIBUTING.md` if the package needs more than shared workspace steps.

## Pull request checklist (repository)

- [ ] `pnpm build`
- [ ] `pnpm test`
- [ ] `pnpm lint:eslint -- <paths-you-touched>` (if you changed TypeScript)
- [ ] `pnpm knip` (if dependencies, exports, or workspace layout changed)
- [ ] `pnpm lint` before merge when touching shared config or CI

Package-specific checklists live in each package's CONTRIBUTING file.

## License

Apache 2.0 — see [LICENSE](LICENSE).
