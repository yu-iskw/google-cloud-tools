# bq-inspect

**bq-inspect** is a read-only CLI for BigQuery: it fetches job metadata (`jobs.get` / `jobs.list`) and dataset or table metadata (`datasets.get`, `tables.list`, `tables.get`). It prints **one JSON document on stdout** on success. Errors are **JSON on stderr** with a non-zero exit code (except plain-text `--help`).

Operational commands take a single **`--params`** JSON object (or `@path` to a file). Field names match the command’s **`--input-schema`** output. For flags and options, **`bq-inspect --help`** and **`bq-inspect <command> --help`** are authoritative; this README may summarize and can lag behind the CLI.

## Usage

```bash
bq-inspect <command> --params '<json>' | --params @file.json [options]
```

Every operational command also supports `--input-schema` and `--output-schema` (JSON Schema on stdout, no BigQuery call).

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
bq-inspect <command> --help
```

Use `-h` anywhere `--help` is accepted.

Unknown commands print global usage plus `Unknown command: <argv>`.

## Agent workflow

1. Discover the params shape: `bq-inspect <command> --input-schema` (stdout is JSON Schema).
2. Build a JSON object with the required fields (camelCase keys such as `projectId`, `jobId`, `datasetId`).
3. Run the command with inline JSON or a file.

**Pipeline:** `jobs list` → `jobs summary` | `jobs query` | `jobs performance` | `jobs lineage` | `jobs impact` | `jobs get`

**Which job command?**

| Goal                                             | Command            |
| ------------------------------------------------ | ------------------ |
| Find job ids (optional client-side filters)      | `jobs list`        |
| Status, timing, bytes/slots (default inspection) | `jobs summary`     |
| SQL, configuration, and light lineage stats      | `jobs query`       |
| Query plan, timeline, performanceInsights        | `jobs performance` |
| Tables, routines, datasets touched               | `jobs lineage`     |
| DML/load/ML/search/export side-effect stats      | `jobs impact`      |
| Full BigQuery Job resource                       | `jobs get`         |

Each view command calls `jobs.get` once per job and projects the response in memory. **`jobs get` returns the full [Job](https://cloud.google.com/bigquery/docs/reference/rest/v2/Job) resource** from the API; other commands slice it for smaller, task-focused JSON. Field names match [Job statistics](https://cloud.google.com/bigquery/docs/reference/rest/v2/Job#JobStatistics); many nested blocks (for example `statistics.mlStatistics`) appear only for matching job kinds.

**Shared / sandbox projects:** `jobs list` is scoped by `location` and only returns your own jobs unless you set `allUsers: true`. In busy sandboxes, list with `allUsers: true`, then pass each job’s `jobReference.location` into job view commands. Omitting `location` on `jobs.get` often returns `BQINSPECT_PERMISSION_DENIED` (403), not a clear location error—the CLI hint will suggest adding `location` when that happens.

Example:

```bash
bq-inspect jobs summary --params '{"jobs":[{"projectId":"YOUR_PROJECT","jobId":"YOUR_JOB_ID"}]}'
```

Optional: `bq-inspect <command> --output-schema` for the response shape.

Invalid params fail with `BQINSPECT_INPUT_INVALID` and JSON Schema error paths on stderr; treat `--input-schema` as the contract for `--params`. See [Error codes](#error-codes) for other codes.

## Quickstart

### Inspect jobs

```bash
# Summary (default inspection — no SQL, no query plan)
bq-inspect jobs summary --params "$(cat <<'EOF'
{
  "jobs": [{ "projectId": "YOUR_PROJECT", "jobId": "YOUR_JOB_ID" }]
}
EOF
)"

# Set location from jobs.list jobReference (required for non-default regions)
bq-inspect jobs summary --params '{"jobs":[{"projectId":"YOUR_PROJECT","jobId":"YOUR_JOB_ID","location":"asia-northeast1"}]}'

# SQL and JobConfigurationQuery
bq-inspect jobs query --params '{"jobs":[{"projectId":"YOUR_PROJECT","jobId":"YOUR_JOB_ID"}]}'

# Performance: queryPlan, timeline, performanceInsights, etc.
bq-inspect jobs performance --params '{"jobs":[{"projectId":"YOUR_PROJECT","jobId":"YOUR_JOB_ID"}]}'

# Lineage: referencedTables, routines, destinations
bq-inspect jobs lineage --params '{"jobs":[{"projectId":"YOUR_PROJECT","jobId":"YOUR_JOB_ID"}]}'

# Impact: dmlStats, load/export/ML/search stats
bq-inspect jobs impact --params '{"jobs":[{"projectId":"YOUR_PROJECT","jobId":"YOUR_JOB_ID"}]}'

# Full Job JSON from the API
bq-inspect jobs get --params '{"jobs":[{"projectId":"YOUR_PROJECT","jobId":"YOUR_JOB_ID"}]}'
```

### List jobs (`jobs list`)

Field list: [Params reference](#params-reference) (`jobs list`). Full schema: `bq-inspect jobs list --input-schema`.

Use the same `location` you will use for `jobs.get`. In shared projects, set `"allUsers": true` or the list may be empty even when jobs exist.

```bash
bq-inspect jobs list --params "$(cat <<'EOF'
{
  "projectId": "YOUR_PROJECT",
  "location": "US",
  "allUsers": true,
  "minCreationTime": "2026-05-17T00:00:00Z",
  "maxCreationTime": "2026-05-18T00:00:00Z",
  "minSlotMs": "60000",
  "labels": { "dbt_invocation_id": "abc123" },
  "maxResults": 50
}
EOF
)"
```

### Dataset and table metadata

```bash
bq-inspect datasets get --params '{"projectId":"YOUR_PROJECT","datasetId":"YOUR_DATASET"}'
bq-inspect tables list --params '{"projectId":"YOUR_PROJECT","datasetId":"YOUR_DATASET"}'
bq-inspect tables get --params '{"projectId":"YOUR_PROJECT","datasetId":"YOUR_DATASET","tableId":"YOUR_TABLE"}'
```

## Commands overview

| Command            | What it returns (from help)                          | BigQuery APIs (typical) | Suggested predefined role                                      |
| ------------------ | ---------------------------------------------------- | ----------------------- | -------------------------------------------------------------- |
| `jobs summary`     | Job status, timing, bytes/slots (default inspection) | `jobs.get`              | `roles/bigquery.resourceViewer`                                |
| `jobs query`       | SQL, configuration, light lineage stats              | `jobs.get`              | `roles/bigquery.resourceViewer`                                |
| `jobs performance` | Query plan, timeline, performanceInsights            | `jobs.get`              | `roles/bigquery.resourceViewer`                                |
| `jobs lineage`     | Referenced tables, routines, datasets, destinations  | `jobs.get`              | `roles/bigquery.resourceViewer`                                |
| `jobs impact`      | DML/load/ML/search/export/spark side-effect stats    | `jobs.get`              | `roles/bigquery.resourceViewer`                                |
| `jobs get`         | Full BigQuery Job JSON                               | `jobs.get`              | `roles/bigquery.resourceViewer`                                |
| `jobs list`        | List jobs (optional client-side filters in params)   | `jobs.list`             | `roles/bigquery.resourceViewer`                                |
| `datasets get`     | Dataset metadata                                     | `datasets.get`          | `roles/bigquery.metadataViewer` (often granted on the dataset) |
| `tables list`      | List tables in a dataset                             | `tables.list`           | `roles/bigquery.metadataViewer`                                |
| `tables get`       | Table metadata                                       | `tables.get`            | `roles/bigquery.metadataViewer`                                |

Project-wide `datasets list` is not supported (it would need `datasets.list`, which is outside the usual metadata-only posture).

## Params reference

Summaries from per-command `--help`; full types and constraints: `bq-inspect <command> --input-schema`.

**All commands:** optional `impersonateServiceAccount`, `impersonateDelegates`.

**Job view commands** (`jobs summary`, `jobs query`, `jobs performance`, `jobs lineage`, `jobs impact`, `jobs get`):

- `jobs`: non-empty array of `{ projectId, jobId, location? }` — include `location` from `jobs.list` output when jobs are not in the default region

**`jobs list`:**

- `projectId` (required)
- `location`, `minCreationTime`, `maxCreationTime`, `pageToken`, `maxResults`, `allUsers` — passed to `jobs.list` (`allUsers: true` is often needed in shared sandboxes)
- `minSlotMs`, `minBytesBilled`, `state`, `labels`, `parentJobId` — applied in the CLI after listing

**Catalog** (`datasets get`, `tables list`, `tables get`):

- `projectId`, `datasetId` (`tableId` required for `tables get`)

## JSON Schema discovery

- **Discovery:** `--input-schema` or `--output-schema` (use one at a time; prints JSON Schema on stdout and exits without calling BigQuery).
- **Required for runs:** `--params` as JSON or `@path` to a JSON file.

Examples:

```bash
bq-inspect jobs summary --input-schema
bq-inspect jobs summary --output-schema
bq-inspect jobs get --input-schema
bq-inspect jobs list --input-schema
bq-inspect datasets get --output-schema
```

## Legacy `schema` subcommand

Prefer per-command `--input-schema` / `--output-schema` above. The `schema` command remains for compatibility:

```bash
bq-inspect schema input --format json-schema
bq-inspect schema output --format json-schema
```

`schema input` matches job view commands’ input shape. `schema output` is a `oneOf` union across command response shapes; use `--output-schema` on a specific command when you need that command’s response shape alone.

## Error codes

Errors are JSON on stderr with a `code` field. Schema validation failures include `schemaErrors` with JSON Pointer paths.

| Code                          | Typical cause                                                         |
| ----------------------------- | --------------------------------------------------------------------- |
| `BQINSPECT_INPUT_INVALID`     | Bad `--params` or flags; schema validation                            |
| `BQINSPECT_PERMISSION_DENIED` | IAM or ADC; on `jobs.get`, may mean missing `location` on the job ref |
| `BQINSPECT_JOB_NOT_FOUND`     | Missing job or catalog resource                                       |
| `BQINSPECT_LOCATION_REQUIRED` | Reserved; prefer `location` on job refs (see hints on 403)            |
| `BQINSPECT_API_RATE_LIMITED`  | HTTP 429; retryable                                                   |
| `BQINSPECT_API_UNAVAILABLE`   | Transient API / 5xx                                                   |
| `BQINSPECT_INTERNAL`          | Unexpected CLI failure                                                |

## Authentication

The CLI uses the official **BigQuery** client with **Application Default Credentials** from `google-auth-library`.

- **Default:** credentials are scoped to `https://www.googleapis.com/auth/bigquery.readonly`.
- **Impersonation:** set `impersonateServiceAccount` (and optional `impersonateDelegates`) in `--params`. The source principal must have **Service Account Token Creator** on the target (and on each delegate). While impersonating, access is still requested with `bigquery.readonly` on the **target** identity. The source ADC client uses `https://www.googleapis.com/auth/cloud-platform` only for the token exchange path.

Example params fragment:

```json
{
  "impersonateServiceAccount": "TARGET@PROJECT_ID.iam.gserviceaccount.com",
  "impersonateDelegates": ["FIRST_DELEGATE@PROJECT_ID.iam.gserviceaccount.com"]
}
```

Service account **JSON key files** are not a dedicated CLI option; ADC may still resolve a key via environment if your platform configures it that way.

## IAM guidance

Prefer narrow read access:

- **Job commands / `jobs list`:** `roles/bigquery.resourceViewer` (or a custom role with `bigquery.jobs.get` / `bigquery.jobs.list`) on the **identity that calls BigQuery** (the impersonated service account when using impersonation).
- **`datasets get` / `tables list` / `tables get`:** `roles/bigquery.metadataViewer` on the dataset or project (or a custom metadata-only role with `datasets.get`, `tables.list`, `tables.get`).
- Grant the calling principal `roles/iam.serviceAccountTokenCreator` on the target service account (and delegates, if any) when using impersonation.
- Avoid `roles/bigquery.dataViewer` and `roles/bigquery.jobUser` for inspection-only workflows.

## Library (TypeScript)

This package also exports TypeScript APIs (inspect/list/catalog helpers, types, JSON Schema constants). See published `types` and `exports` on npm, or the source entry [`src/index.ts`](src/index.ts). For development in this monorepo, see [repository CONTRIBUTING](../../CONTRIBUTING.md) and [bq-inspect CONTRIBUTING](CONTRIBUTING.md).

## Security notes

**Read-only metadata:** job resources and dataset/table metadata only. No table row reads and no arbitrary query execution. Job output may include SQL, user emails, and other fields from the BigQuery API; the caller is responsible for where JSON is stored or logged.
