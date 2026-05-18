# bq-inspect

**bq-inspect** is a read-only CLI for BigQuery: it fetches job metadata (`jobs.get` / `jobs.list`) and dataset or table metadata (`datasets.get`, `tables.list`, `tables.get`). It prints **one JSON document on stdout** on success. Errors are **JSON on stderr** with a non-zero exit code (except plain-text `--help`).

For flags and options, **`bq-inspect --help`** and **`bq-inspect <command> --help`** are authoritative; this README may summarize and can lag behind the CLI.

## Install

From the public npm registry:

```bash
npm install -g bq-inspect
```

Or run without a global install:

```bash
npx bq-inspect --help
```

Requires [Application Default Credentials](https://cloud.google.com/docs/authentication/application-default-credentials) (ADC) unless you only use schema discovery flags (see below).

## Help

```bash
bq-inspect --help
bq-inspect jobs get --help
bq-inspect jobs list --help
bq-inspect datasets get --help
bq-inspect tables list --help
bq-inspect tables get --help
bq-inspect schema --help
```

Use `-h` anywhere `--help` is accepted (see global usage in `bq-inspect --help`).

## Quickstart

### Fetch one or more jobs (`jobs get`)

Requires `--project` and at least one `--job-id`. Optional `--location`, `--select` or `--preset` (mutually exclusive), `--redact`, and impersonation flags.

```bash
bq-inspect jobs get \
  --project YOUR_PROJECT \
  --job-id YOUR_JOB_ID \
  --select 'id,status{state,errorResult},statistics{query{totalBytesBilled,totalBytesProcessed}}'
```

### List jobs (`jobs list`)

Requires `--project`. Optional time window, pagination, filters, and impersonation flags (see `bq-inspect jobs list --help`).

```bash
bq-inspect jobs list \
  --project YOUR_PROJECT \
  --location US \
  --min-creation-time 2026-05-17T00:00:00Z \
  --max-creation-time 2026-05-18T00:00:00Z \
  --min-slot-ms 60000 \
  --label dbt_invocation_id=abc123 \
  --max-results 50
```

### Preset instead of `--select` (`jobs get`)

`--preset` (e.g. `diagnostic`) is mutually exclusive with `--select`. Do not pass both.

```bash
bq-inspect jobs get --project YOUR_PROJECT --job-id YOUR_JOB_ID --preset diagnostic
```

### Dataset and table metadata

```bash
bq-inspect datasets get --project YOUR_PROJECT --dataset YOUR_DATASET

bq-inspect tables list --project YOUR_PROJECT --dataset YOUR_DATASET

bq-inspect tables get --project YOUR_PROJECT --dataset YOUR_DATASET --table YOUR_TABLE
```

## Commands overview

| Command        | BigQuery APIs (typical) | Suggested predefined role                                      |
| -------------- | ----------------------- | -------------------------------------------------------------- |
| `jobs get`     | `jobs.get`              | `roles/bigquery.resourceViewer`                                |
| `jobs list`    | `jobs.list`             | `roles/bigquery.resourceViewer`                                |
| `datasets get` | `datasets.get`          | `roles/bigquery.metadataViewer` (often granted on the dataset) |
| `tables list`  | `tables.list`           | `roles/bigquery.metadataViewer`                                |
| `tables get`   | `tables.get`            | `roles/bigquery.metadataViewer`                                |

Project-wide `datasets list` is not supported (it would need `datasets.list`, which is outside the usual metadata-only posture).

## JSON Schema discovery

Each operational command can print JSON Schema on stdout and exit without calling BigQuery:

```bash
bq-inspect jobs get --input-schema
bq-inspect jobs get --output-schema
bq-inspect jobs list --input-schema
bq-inspect datasets get --output-schema
bq-inspect tables list --input-schema
bq-inspect tables get --output-schema
```

Use **either** `--input-schema` or `--output-schema`, not both. Selector grammar and examples for `jobs get` live in that command’s input schema (`jobs get --input-schema`).

## Legacy `schema` subcommand

Prefer per-command `--input-schema` / `--output-schema` above. The `schema` command remains for compatibility:

```bash
bq-inspect schema input --format json-schema
bq-inspect schema output --format json-schema
bq-inspect schema selector --format json-schema --resource job
```

`schema output` is a `oneOf` union across command response shapes; use `--output-schema` on a specific command when you need that command’s response shape alone.

## Authentication

The CLI uses the official **BigQuery** client with **Application Default Credentials** from `google-auth-library`.

- **Default:** credentials are scoped to `https://www.googleapis.com/auth/bigquery.readonly`.
- **Impersonation:** pass `--impersonate-service-account TARGET@PROJECT_ID.iam.gserviceaccount.com`. The source principal must have **Service Account Token Creator** on the target (and on each delegate). While impersonating, access is still requested with `bigquery.readonly` on the **target** identity. The source ADC client uses `https://www.googleapis.com/auth/cloud-platform` only for the token exchange path.

Optional delegate chain (in order), each flag once per principal:

```bash
--impersonate-delegate FIRST_DELEGATE@PROJECT_ID.iam.gserviceaccount.com \
--impersonate-delegate SECOND_DELEGATE@PROJECT_ID.iam.gserviceaccount.com
```

Service account **JSON key files** are not a dedicated CLI option; ADC may still resolve a key via environment if your platform configures it that way.

## IAM guidance

Prefer narrow read access:

- **`jobs get` / `jobs list`:** `roles/bigquery.resourceViewer` (or a custom role with `bigquery.jobs.get` / `bigquery.jobs.list`) on the **identity that calls BigQuery** (the impersonated service account when using impersonation).
- **`datasets get` / `tables list` / `tables get`:** `roles/bigquery.metadataViewer` on the dataset or project (or a custom metadata-only role with `datasets.get`, `tables.list`, `tables.get`).
- Grant the calling principal `roles/iam.serviceAccountTokenCreator` on the target service account (and delegates, if any) when using impersonation.
- Avoid `roles/bigquery.dataViewer` and `roles/bigquery.jobUser` for inspection-only workflows.

## Selector examples

These selectors are intentionally conservative; add fields only as needed.

- Cost and reservation signals: `statistics{totalBytesProcessed,totalBytesBilled,reservation_id}`
- Status and failure details: `status{state,errorResult},errorResult`
- Slots and timing: `statistics{query{totalSlotMs,totalProcessingTimeMs}}`
- Query plan shape: `statistics{query{queryPlan}}`
- Governance-ish labels: `configuration{labels}` (avoid query text unless you also understand redaction limits)

## Library (TypeScript)

This package also exports TypeScript APIs (inspect/list/catalog helpers, types, JSON Schema constants). See published `types` and `exports` on npm, or the source entry [`src/index.ts`](src/index.ts). For development in this monorepo, see [repository CONTRIBUTING](../../CONTRIBUTING.md) and [bq-inspect CONTRIBUTING](CONTRIBUTING.md).

## Security notes

**Read-only metadata:** job resources and dataset/table metadata only. No table row reads and no arbitrary query execution. Default redaction masks obvious SQL string literals but is not a complete privacy guarantee; use `--redact strict` when query text must not appear in output.
