export const GLOBAL_USAGE = `
bq-inspect — read-only BigQuery job and metadata inspection (JSON on stdout).

Usage:
  bq-inspect <command> [options]

Commands (each supports --input-schema / --output-schema for JSON Schema on stdout):
  jobs get       Fetch job(s) with optional --select or --preset
  jobs list      List jobs (optional client-side filters)
  datasets get   Dataset metadata
  tables list    List tables in a dataset
  tables get     Table metadata

Legacy:
  schema         Same contracts as above (see: bq-inspect schema --help)

Global:
  bq-inspect --help | -h
  bq-inspect <command> --help

Errors are JSON on stderr; success is JSON on stdout (except plain-text --help).
`.trim();

export const JOBS_GET_USAGE = `
Usage:
  bq-inspect jobs get --project <id> --job-id <id> [--job-id <id> ...] [options]

Discovery:
  --input-schema     Print this command's input JSON Schema and exit
  --output-schema    Print this command's output JSON Schema and exit

Required:
  --project <string>
  --job-id <string>   (repeatable)

Optional:
  --location <string>
  --select <selector>   Mutually exclusive with --preset; see --input-schema for selector examples
  --preset <name>       (e.g. diagnostic; mutually exclusive with --select)
  --redact default|strict|none
  --fail-on-missing-field
  --format json
  --impersonate-service-account <email>
  --impersonate-delegate <email>   (repeatable chain)
`.trim();

export const JOBS_LIST_USAGE = `
Usage:
  bq-inspect jobs list --project <id> [options]

Discovery:
  --input-schema     Print this command's input JSON Schema and exit
  --output-schema    Print this command's output JSON Schema and exit

Required:
  --project <string>

Optional:
  --location <string>
  --min-creation-time <iso-8601>
  --max-creation-time <iso-8601>
  --page-token <string>
  --max-results <positive-int>
  --all-users
  --min-slot-ms <integer>
  --min-bytes-billed <integer>
  --state <string>
  --label KEY=VALUE   (repeatable)
  --parent-job-id <string>
  --format json
  --impersonate-service-account <email>
  --impersonate-delegate <email>   (repeatable chain)
`.trim();

export const DATASETS_GET_USAGE = `
Usage:
  bq-inspect datasets get --project <id> --dataset <id> [options]

Discovery:
  --input-schema     Print this command's input JSON Schema and exit
  --output-schema    Print this command's output JSON Schema and exit

Required:
  --project <string>
  --dataset <string>

Optional:
  --format json
  --impersonate-service-account <email>
  --impersonate-delegate <email>   (repeatable chain)
`.trim();

export const TABLES_LIST_USAGE = `
Usage:
  bq-inspect tables list --project <id> --dataset <id> [options]

Discovery:
  --input-schema     Print this command's input JSON Schema and exit
  --output-schema    Print this command's output JSON Schema and exit

Required:
  --project <string>
  --dataset <string>

Optional:
  --format json
  --impersonate-service-account <email>
  --impersonate-delegate <email>   (repeatable chain)
`.trim();

export const TABLES_GET_USAGE = `
Usage:
  bq-inspect tables get --project <id> --dataset <id> --table <id> [options]

Discovery:
  --input-schema     Print this command's input JSON Schema and exit
  --output-schema    Print this command's output JSON Schema and exit

Required:
  --project <string>
  --dataset <string>
  --table <string>

Optional:
  --format json
  --impersonate-service-account <email>
  --impersonate-delegate <email>   (repeatable chain)
`.trim();

export const SCHEMA_USAGE = `
Usage:
  bq-inspect schema <input|output|selector> --format json-schema [options]

Legacy JSON Schema (prefer per-command --input-schema / --output-schema on jobs get, etc.).

Subcommands:
  input     Jobs get input JSON Schema
  output    Response JSON Schema (oneOf across commands)
  selector  Job selector JSON Schema (--resource job required)

Examples:
  bq-inspect schema input --format json-schema
  bq-inspect schema output --format json-schema
  bq-inspect schema selector --format json-schema --resource job

Run bq-inspect schema <subcommand> --help for a short reminder.
`.trim();

export const SCHEMA_INPUT_USAGE = `
Usage:
  bq-inspect schema input --format json-schema
`.trim();

export const SCHEMA_OUTPUT_USAGE = `
Usage:
  bq-inspect schema output --format json-schema
`.trim();

export const SCHEMA_SELECTOR_USAGE = `
Usage:
  bq-inspect schema selector --format json-schema --resource job

Required:
  --format json-schema
  --resource job
`.trim();
