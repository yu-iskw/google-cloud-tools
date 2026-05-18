# bq-inspect

**bq-inspect** is a read-only CLI for BigQuery: it fetches job metadata (`jobs.get` / `jobs.list`) and dataset or table metadata (`datasets.get`, `tables.list`, `tables.get`). It prints **one JSON document on stdout** on success. Errors are **JSON on stderr** with a non-zero exit code (except plain-text `--help`).

Operational commands take a single **`--params`** JSON object (or `@path` to a file). Field names match the command’s **`--input-schema`** output. For flags and options, **`bq-inspect --help`** and **`bq-inspect <command> --help`** are authoritative; this README may summarize and can lag behind the CLI.

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
bq-inspect jobs summary --help
bq-inspect jobs query --help
bq-inspect jobs performance --help
bq-inspect jobs get --help
bq-inspect jobs list --help
bq-inspect datasets get --help
bq-inspect tables list --help
bq-inspect tables get --help
bq-inspect schema --help
```

Use `-h` anywhere `--help` is accepted (see global usage in `bq-inspect --help`).

## Agent workflow

1. Discover the params shape: `bq-inspect <command> --input-schema` (stdout is JSON Schema).
2. Build a JSON object with the required fields (camelCase keys such as `projectId`, `jobId`, `datasetId`).
3. Run the command with inline JSON or a file.

**Which job command?**

| Goal                                       | Command            |
| ------------------------------------------ | ------------------ |
| Find job ids                               | `jobs list`        |
| Status, timing, bytes, slots               | `jobs summary`     |
| SQL and query configuration                | `jobs query`       |
| Query plan, timeline, script/session stats | `jobs performance` |
| Full BigQuery Job resource                 | `jobs get`         |

Example:

```bash
bq-inspect jobs summary --params '{"jobs":[{"projectId":"YOUR_PROJECT","jobId":"YOUR_JOB_ID"}]}'
```

Optional: `bq-inspect <command> --output-schema` for the response shape.

Invalid params fail with `BQINSPECT_INPUT_INVALID` and JSON Schema error paths on stderr; treat `--input-schema` as the contract for `--params`.

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

# SQL and JobConfigurationQuery
bq-inspect jobs query --params '{"jobs":[{"projectId":"YOUR_PROJECT","jobId":"YOUR_JOB_ID"}]}'

# Performance: queryPlan, timeline, etc.
bq-inspect jobs performance --params '{"jobs":[{"projectId":"YOUR_PROJECT","jobId":"YOUR_JOB_ID"}]}'

# Full Job JSON from the API
bq-inspect jobs get --params '{"jobs":[{"projectId":"YOUR_PROJECT","jobId":"YOUR_JOB_ID"}]}'
```

### List jobs (`jobs list`)

```bash
bq-inspect jobs list --params "$(cat <<'EOF'
{
  "projectId": "YOUR_PROJECT",
  "location": "US",
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

| Command            | BigQuery APIs (typical) | Suggested predefined role                                      |
| ------------------ | ----------------------- | -------------------------------------------------------------- |
| `jobs summary`     | `jobs.get`              | `roles/bigquery.resourceViewer`                                |
| `jobs query`       | `jobs.get`              | `roles/bigquery.resourceViewer`                                |
| `jobs performance` | `jobs.get`              | `roles/bigquery.resourceViewer`                                |
| `jobs get`         | `jobs.get`              | `roles/bigquery.resourceViewer`                                |
| `jobs list`        | `jobs.list`             | `roles/bigquery.resourceViewer`                                |
| `datasets get`     | `datasets.get`          | `roles/bigquery.metadataViewer` (often granted on the dataset) |
| `tables list`      | `tables.list`           | `roles/bigquery.metadataViewer`                                |
| `tables get`       | `tables.get`            | `roles/bigquery.metadataViewer`                                |

Project-wide `datasets list` is not supported (it would need `datasets.list`, which is outside the usual metadata-only posture).

## JSON Schema discovery

Each operational command can print JSON Schema on stdout and exit without calling BigQuery:

```bash
bq-inspect jobs summary --input-schema
bq-inspect jobs summary --output-schema
bq-inspect jobs get --input-schema
bq-inspect jobs list --input-schema
bq-inspect datasets get --output-schema
```

Use **either** `--input-schema` or `--output-schema`, not both.

## Legacy `schema` subcommand

Prefer per-command `--input-schema` / `--output-schema` above. The `schema` command remains for compatibility:

```bash
bq-inspect schema input --format json-schema
bq-inspect schema output --format json-schema
```

`schema output` is a `oneOf` union across command response shapes; use `--output-schema` on a specific command when you need that command’s response shape alone.

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
