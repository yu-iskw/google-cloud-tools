# Contributing to bq-inspect

This document is for **developers** working on `bq-inspect` in this monorepo’s `packages/bq-inspect` workspace. End-user documentation lives in [README.md](README.md).

## Prerequisites

- **Node.js** — version in the repo root [`.node-version`](../../.node-version) (currently 24.x).
- **pnpm** — v11+ per root [AGENTS.md](../../AGENTS.md) and the root [package.json](../../package.json) `packageManager` field.

## Clone and install

From the repository root:

```bash
pnpm install
```

## Build, test, and lint this package

All commands assume the **repository root** as the current directory.

```bash
pnpm --filter bq-inspect build
pnpm test -- packages/bq-inspect
pnpm format:eslint -- packages/bq-inspect/src
pnpm lint:eslint -- packages/bq-inspect/src
```

Before a change that might affect workspace-wide tooling or unused exports:

```bash
pnpm knip
pnpm lint
```

(`pnpm lint` runs Trunk and Knip per root scripts.)

### Run the CLI from the workspace

Build first, then run the compiled entrypoint (the published `bin` name is `bq-inspect`; from the repo use `node` until the package is linked globally):

```bash
# from repository root, after: pnpm --filter bq-inspect build
node packages/bq-inspect/dist/cli.js --help
node packages/bq-inspect/dist/cli.js jobs get --help
```

Or from `packages/bq-inspect/`:

```bash
pnpm build
node dist/cli.js --help
```

## CLI help text (source of truth)

Published usage strings live in:

- [`src/cli-usage.ts`](src/cli-usage.ts) — all `*_USAGE` constants (global and per-command).
- [`src/cli-help.ts`](src/cli-help.ts) — maps `argv` keys to those strings for `bq-inspect … --help`.

**Rule:** Any new or changed CLI flag must:

1. Update `parseArgs` (and validation) in the relevant command under [`src/commands/`](src/commands/).
2. Update the matching block in `cli-usage.ts`.
3. Update [README.md](README.md) if the flag is user-facing in examples or narrative.

Keep [README.md](README.md) examples aligned with `cli-usage.ts`; end users treat **`--help`** as authoritative.

## Architecture (minimal hexagonal)

- **`commands/`** — Thin CLI adapters: parse flags, build the BigQuery client, call application functions.
- **`core/`** — Use cases (`inspect`, `list`, `catalog`) plus pure helpers (selector, projection, redaction, filters, presets).
- **`bigquery/`** — Outbound port types (`BigQueryInspectionClient`, `BigQueryJobClient`) and the Google SDK adapter (`SdkBigQueryClient`).
- **`schemas/`** — JSON Schema contracts for agents; [`command-schemas.ts`](src/schemas/command-schemas.ts) resolves per-command schemas for `--input-schema` / `--output-schema`.
- **`selector/`** — Selector parsing for `jobs get`.

## Package layout (`src/`)

- `bigquery/` — GCP client adapters and port interfaces
- `commands/` — CLI subcommands
- `core/inspect` — Job fetch orchestration (`inspectJobs`)
- `core/list` — `jobs list` filtering and envelope
- `core/catalog` — Dataset/table metadata reads
- `core/presets` — Selector presets (e.g. `diagnostic`)
- `core/projection` / `core/redaction` — Selector output shaping
- `core/shared` — Types, errors, envelopes, IAM hints
- `selector/`, `schemas/` — Agent contracts and schema exports

## Library and tests

- **Imports:** Consumers import from the package entry (see [`src/index.ts`](src/index.ts)) after `pnpm build` or from published npm types.
- **Core job inspection:** `inspectJobs` with a `BigQueryJobClient` (job-only port).
- **List jobs / catalog:** `BigQueryInspectionClient` with `SdkBigQueryClient`.
- **CLI parity in tests:** Call `runJobsGet`, `runJobsList`, `runDatasetsGet`, `runTablesList`, or `runTablesGet` without passing `client` so the command builds `SdkBigQueryClient` with ADC (and optional impersonation flags), or inject fakes.
- **Fakes:** [`src/test-support/fixture-job-client.ts`](src/test-support/fixture-job-client.ts) (`FixtureJobClient` — jobs only) and fixture bigquery client for full port tests.

Prefer state-based tests on observable JSON output; avoid new mocks unless necessary.

## Pull request checklist

- [ ] `pnpm --filter bq-inspect build`
- [ ] `pnpm test -- packages/bq-inspect`
- [ ] `pnpm lint:eslint -- packages/bq-inspect/src`
- [ ] `pnpm knip` (if dependencies, exports, or workspace layout changed)
- [ ] `pnpm lint` (Trunk + Knip) before merge when touching shared config or docs CI cares about
- [ ] CLI or flag changes: `cli-usage.ts` (+ README if user-visible)

## License

Apache 2.0 — see [LICENSE](../../LICENSE) in the repository root.
