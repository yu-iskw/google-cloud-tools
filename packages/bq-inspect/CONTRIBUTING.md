# Contributing to bq-inspect

This document is for **developers** working on `bq-inspect` in this monorepo's `packages/bq-inspect` workspace. End-user documentation lives in [README.md](README.md).

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
pnpm test:fast -- packages/bq-inspect   # quick pass; pnpm test includes coverage
pnpm format:eslint -- packages/bq-inspect/src
pnpm lint:eslint -- packages/bq-inspect/src
```

### Test coverage

Shared defaults (provider, reporters, 85%/80% threshold block, `perFile`) live in [`vitest.shared.ts`](../../vitest.shared.ts). Workspace-specific excludes and threshold globs are in [`vitest.config.ts`](vitest.config.ts) (paths relative to `src/`).

| Glob                                                       | Lines / functions / statements | Branches |
| ---------------------------------------------------------- | ------------------------------ | -------- |
| `src/core/**`                                              | 85%                            | 80%      |
| `src/cli/input/**`, `src/cli/params/**`, `src/bigquery/**` | 85%                            | 80%      |

**Workspace-only coverage excludes:** see `bqInspectCoverageExclude` in [`vitest.config.ts`](vitest.config.ts) (paths relative to `src/`).

CI runs `pnpm test` (see [`.github/workflows/test.yml`](../../.github/workflows/test.yml)).

Before a change that might affect workspace-wide tooling or unused exports:

```bash
pnpm knip
pnpm lint
```

(`pnpm lint` runs Trunk and Knip per root scripts.)

Production builds use [`tsconfig.build.json`](tsconfig.build.json), which excludes `*.test.ts` from `dist/`. Before a release, from this package directory run `npm pack --dry-run` and confirm the tarball lists `dist/`, `README.md`, and `LICENSE`, and does not list `src/` or `**/*.test.js`.

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

### Manual smoke (optional)

After a CLI or BigQuery client change, you can re-run a short live check against a project you control (ADC via `gcloud auth application-default login`, or CI credentials). Do not commit project IDs, service account emails, or params files with secrets.

1. `pnpm --filter bq-inspect build`
2. `node packages/bq-inspect/dist/cli.js jobs list --params '{"projectId":"YOUR_PROJECT","allUsers":true,"maxResults":10}'` (add `impersonateServiceAccount` in JSON when testing impersonation)
3. Copy `jobReference.location` from list output into a job view, e.g. `jobs summary`
4. Spot-check `datasets get` and `tables list` on a dataset you can read

See [README.md — Troubleshooting](README.md#troubleshooting) for empty lists, 403 vs not-found on `jobs.get`, and post-filter behavior.

## CLI and agent workflow

Operational commands accept only:

- **`--params`** — JSON object or `@path` to a JSON file (required to run).
- **`--input-schema`** / **`--output-schema`** — print JSON Schema and exit (no BigQuery call).

Parsing layers:

- [`src/cli/argv/operational-argv.ts`](src/cli/argv/operational-argv.ts) — argv → schema discovery or `--params` string.
- [`src/cli/params/parse-params.ts`](src/cli/params/parse-params.ts) — resolve inline JSON or `@file`.
- [`src/schemas/validate-input.ts`](src/schemas/validate-input.ts) — AJV validation against the same JSON Schema as `--input-schema`.
- [`src/cli/input/map-input.ts`](src/cli/input/map-input.ts) — domain mapping (epoch ms, list filters split, impersonation trim).
- [`src/cli/input/input-parsers.ts`](src/cli/input/input-parsers.ts) — `validateInput` + `map*` per command.
- [`src/commands/<resource>/`](src/commands/) — wire parsers to core use cases.

**Agent workflow:** `bq-inspect <command> --input-schema` → build params JSON → `bq-inspect <command> --params @file.json` (or inline JSON). Tests should pass `--params` with `JSON.stringify` rather than legacy kebab-case flags.

## CLI help text (source of truth)

Published usage strings live in:

- [`src/cli/usage.ts`](src/cli/usage.ts) — all `*_USAGE` constants (global and per-command).
- [`src/cli/help.ts`](src/cli/help.ts) — maps `argv` keys to those strings for `bq-inspect … --help`.

**Rule:** Any new or changed params field must:

1. Update JSON Schema in [`src/schemas/input-schema.ts`](src/schemas/input-schema.ts) (runtime validation follows automatically).
2. Update [`src/cli/input/map-input.ts`](src/cli/input/map-input.ts) only if the field needs domain mapping beyond schema shape.
3. Update the matching block in [`cli/usage.ts`](src/cli/usage.ts).
4. Update [README.md](README.md) if the field is user-facing in examples or narrative.

Keep [README.md](README.md) examples aligned with `cli/usage.ts`; end users treat **`--help`** as authoritative.

## Architecture (minimal hexagonal)

- **`cli/`** — CLI-facing mechanics: parse pipeline (`argv/`, `params/`, `input/`) plus help (`usage.ts`, `help.ts`); not split by BigQuery resource. [`cli.ts`](src/cli.ts) at `src/` root is the thin bin dispatcher only.
- **`commands/`** — Thin CLI adapters grouped by resource (`jobs/`, `datasets/`, `tables/`), plus shared `command-shared.ts` and meta `schema.ts`: parse operational argv, build the BigQuery client, call application functions.
- **`core/`** — Use cases grouped by resource (`jobs`, `datasets`, `tables`) plus pure helpers (`project-job`, `shared`).
- **`bigquery/`** — Transport layer (`auth/`, `types/`, `port/`, `errors/`, `adapters/google-cloud/`); not split by REST resource.
- **`schemas/`** — JSON Schema contracts for agents; [`command-schemas.ts`](src/schemas/command-schemas.ts) resolves per-command schemas for `--input-schema` / `--output-schema`.

## Package layout (`src/`)

- `bigquery/auth` — ADC + impersonation (`createAuthClient`)
- `bigquery/types` — transport DTOs (`DatasetRef`, `ListJobsRequest`, …)
- `bigquery/port` — `BigQueryInspectionClient` port
- `bigquery/errors` — Google API error → `BqInspectFailure` mapping
- `bigquery/adapters/google-cloud` — `SdkBigQueryClient`
- `cli/usage` — `*_USAGE` strings for `--help`
- `cli/help` — argv → usage mapping for `--help`
- `cli/argv` — operational flags (`--params`, schemas)
- `cli/params` — JSON / `@file` resolution
- `cli/input` — validate + map + parsed types
- `commands/` — CLI subcommands (`jobs/`, `datasets/`, `tables/`, plus shared `command-shared.ts`, `schema.ts`)
- `core/jobs` — `inspectJobs` with job views (`summary`, `query`, `performance`, `lineage`, `impact`, `full`) and `jobs list` (+ client-side filters)
- `core/datasets` — `datasets get`
- `core/tables` — `tables list` and `tables get`
- `core/jobs/project-job` — in-process projection of `jobs.get` payloads per view
- `core/shared` — Types, errors, envelopes, IAM hints, catalog error helper
- `schemas/` — Agent contracts and schema exports

## Library and tests

- **Imports:** Consumers import from the package entry (see [`src/index.ts`](src/index.ts)) after `pnpm build` or from published npm types.
- **Core job inspection:** `inspectJobs` with a `BigQueryJobClient` (job-only port).
- **List jobs / catalog:** `BigQueryInspectionClient` with `SdkBigQueryClient`.
- **CLI parity in tests:** Call `runJobsGet`, `runJobsList`, `runDatasetsGet`, `runTablesList`, or `runTablesGet` with `['--params', JSON.stringify({...})]` (and inject `client` when avoiding ADC), or use `--input-schema` / `--output-schema` for schema-only paths.
- **Fakes:** [`src/test-support/fixture-job-client.ts`](src/test-support/fixture-job-client.ts) (`FixtureJobClient` — jobs only) and fixture bigquery client for full port tests.

Prefer state-based tests on observable JSON output; avoid new mocks unless necessary.

### Release steps

1. Bump `version` in [`package.json`](package.json) and merge to `main`.
2. Build and verify locally: `pnpm --filter bq-inspect build`, `pnpm test -- packages/bq-inspect`, and `npm pack --dry-run` in this directory.
3. Create a GitHub Release with tag **`bq-inspect-v{version}`** (e.g. `bq-inspect-v0.2.1` for version `0.2.1`). Tags must match the `bq-inspect-v*` prefix and equal `bq-inspect-v` plus the `version` field in [`package.json`](package.json).
4. Publishing runs via [`.github/workflows/publish-bq-inspect.yml`](../../.github/workflows/publish-bq-inspect.yml) on **`release: published` only** (no manual workflow dispatch).
5. The reusable workflow builds and tests in a **verify** job, then runs **publish** only after the **`release`** environment is satisfied (approval if required reviewers are configured).

Provenance attestations are generated automatically for public packages published via OIDC from this public repository (no `--provenance` flag needed).

### Publish infrastructure (one-time setup)

Maintainers must configure GitHub and npm once (or after changing the publish workflow path):

**GitHub** (repository **Settings → Environments → `release`**):

- Create environment **`release`** if it does not exist.
- Optionally restrict **Deployment branches** to `main`.
- Optionally add **Required reviewers** so `pnpm publish` waits for approval after verify succeeds.

| Field             | Value                                                                                             |
| ----------------- | ------------------------------------------------------------------------------------------------- |
| Provider          | GitHub Actions                                                                                    |
| Repository        | `yu-iskw/google-cloud-tools`                                                                      |
| Workflow filename | `publish-bq-inspect.yml` (filename only; npm validates the entry workflow, not the reusable file) |
| Environment       | `release`                                                                                         |

Because publish uses `workflow_call`, npm OIDC checks the **entry** workflow ([`publish-bq-inspect.yml`](../../.github/workflows/publish-bq-inspect.yml)), not [`_reusable-publish-package.yml`](../../.github/workflows/_reusable-publish-package.yml). See [npm trusted publishers — Troubleshooting](https://docs.npmjs.com/trusted-publishers#troubleshooting).

Shared build/test/publish steps live in [`.github/workflows/_reusable-publish-package.yml`](../../.github/workflows/_reusable-publish-package.yml).

## Pull request checklist

- [ ] `pnpm --filter bq-inspect build`
- [ ] `pnpm test` from repo root (or `pnpm test:fast` while iterating)
- [ ] `pnpm lint:eslint -- packages/bq-inspect/src`
- [ ] `pnpm knip` (if dependencies, exports, or workspace layout changed)
- [ ] `pnpm lint` (Trunk + Knip) before merge when touching shared config or docs CI cares about
- [ ] CLI or flag changes: `cli/usage.ts` (+ README if user-visible)

## License

Apache 2.0 — [LICENSE](LICENSE) in this package (same text as [repository root](../../LICENSE)).
