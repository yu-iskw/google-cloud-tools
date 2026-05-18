export type {
  BqInspectError,
  BqInspectErrorCode,
  BqInspectSchemaVersion,
  BqInspectWarning,
  CatalogResourceResponse,
  InspectedJob,
  InspectJobRequest,
  InspectJobResponse,
  JobListFiltersEcho,
  JobRef,
  ListJobsResponse,
  RedactionMode,
  TablesListResponse,
} from './core/shared/types';

export { BqInspectFailure, createBqInspectError, getExitCode } from './core/shared/errors';
export { normalizeJobRef } from './core/shared/job-ref';
export { buildToolEnvelope } from './core/shared/envelope';
export { iamHintForApi } from './core/shared/iam-hints';
export { inspectJobs } from './core/inspect/inspect-jobs';
export type { InspectJobOptions } from './core/inspect/inspect-jobs';
export { applyProjection, type ProjectionResult } from './core/projection/project';
export { redactValue } from './core/redaction/redact';
export { listJobs } from './core/list/list-jobs';
export { filterJobSummaries, type JobFilters } from './core/list/filter-jobs';
export { getDatasetMetadata, getTableMetadata, listTablesMetadata } from './core/catalog/catalog';
export {
  jobPresetSelectors,
  resolveJobPreset,
  type JobPresetName,
} from './core/presets/job-presets';

export type {
  BigQueryInspectionClient,
  BigQueryJobClient,
  DatasetRef,
  ListJobsPage,
  ListJobsRequest,
  TableRef,
} from './bigquery/bigquery-job-client';
export {
  createAuthClient,
  normalizeDelegateList,
  normalizeOptionalTrimmed,
} from './bigquery/create-auth-client';
export type { AuthClientOptions } from './bigquery/create-auth-client';
export {
  SdkBigQueryClient,
  extractGoogleErrorMessage,
  mapGoogleErrorToBqInspectFailure,
  mapHttpStatusToErrorCode,
  resolveHttpStatus,
} from './bigquery/sdk-job-client';

/** @deprecated Use {@link SdkBigQueryClient} */
export { SdkBigQueryClient as SdkBigQueryJobClient } from './bigquery/sdk-job-client';

export { FixtureBigQueryClient, FixtureJobClient } from './test-support/fixture-job-client';
export type { FixtureBigQueryInput } from './test-support/fixture-job-client';

export { parseSelector } from './selector/parse-selector';
export type { SelectorAst, SelectorField } from './selector/types';

/** Library alias for the jobs-get input JSON Schema (same object as {@link jobsGetInputSchema}). */
export { jobsGetInputSchema as inputSchema } from './schemas/input-schema';
export { outputSchema } from './schemas/output-schema';
export { selectorSchemaJob } from './schemas/selector-schema';

export { runJobsGet } from './commands/jobs/get';
export type { JobsGetCommandOptions } from './commands/jobs/get';
export { runJobsList } from './commands/jobs/list';
export type { JobsListCommandOptions } from './commands/jobs/list';
export { runDatasetsGet } from './commands/datasets/get';
export type { DatasetsGetCommandOptions } from './commands/datasets/get';
export { runTablesList } from './commands/tables/list';
export type { TablesListCommandOptions } from './commands/tables/list';
export { runTablesGet } from './commands/tables/get';
export type { TablesGetCommandOptions } from './commands/tables/get';
export { runSchemaCommand } from './commands/schema';
