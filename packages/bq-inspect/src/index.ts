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
  JobView,
  ListJobsResponse,
  TablesListResponse,
} from './core/shared/types';

export { BqInspectFailure, createBqInspectError, getExitCode } from './core/shared/errors';
export { normalizeJobRef } from './core/shared/job-ref';
export { buildToolEnvelope } from './core/shared/envelope';
export { iamHintForApi } from './core/shared/iam-hints';
export { inspectJobs } from './core/jobs/get';
export type { InspectJobOptions } from './core/jobs/get';
export { projectJob } from './core/jobs/project-job';
export type {
  BigQueryJob,
  JobImpactProjection,
  JobLineageProjection,
  JobPerformanceProjection,
  JobProjection,
  JobQueryProjection,
  JobStatistics,
  JobStatisticsQuery,
  JobSummaryProjection,
  TableReference,
} from './core/jobs/bigquery-job-types';
export { isBigQueryJob } from './core/jobs/bigquery-job-types';
export { listJobs } from './core/jobs/list';
export { filterJobSummaries, type JobFilters } from './core/jobs/filter';
export { getDatasetMetadata } from './core/datasets/get';
export { getTableMetadata } from './core/tables/get';
export { listTablesMetadata } from './core/tables/list';

export type {
  BigQueryInspectionClient,
  BigQueryJobClient,
  DatasetRef,
  ListJobsPage,
  ListJobsRequest,
  TableRef,
} from './bigquery/client/job-client';
export { createAuthClient } from './bigquery/auth/create-auth-client';
export type { AuthClientOptions } from './bigquery/auth/create-auth-client';
export { normalizeDelegateList, normalizeOptionalTrimmed } from './core/shared/normalize';
export {
  SdkBigQueryClient,
  extractGoogleErrorMessage,
  mapGoogleErrorToBqInspectFailure,
  mapHttpStatusToErrorCode,
  resolveHttpStatus,
} from './bigquery/sdk/sdk-job-client';

/** @deprecated Use {@link SdkBigQueryClient} */
export { SdkBigQueryClient as SdkBigQueryJobClient } from './bigquery/sdk/sdk-job-client';

export { FixtureBigQueryClient, FixtureJobClient } from './test-support/fixture-job-client';
export type { FixtureBigQueryInput } from './test-support/fixture-job-client';

/** Library alias for the jobs-get input JSON Schema (same object as {@link jobsGetInputSchema}). */
export { jobsGetInputSchema as inputSchema } from './schemas/input-schema';
export { outputSchema } from './schemas/output-schema';

export { runJobsGet } from './commands/jobs/get';
export { runJobsSummary } from './commands/jobs/summary';
export { runJobsQuery } from './commands/jobs/query';
export { runJobsPerformance } from './commands/jobs/performance';
export { runJobsLineage } from './commands/jobs/lineage';
export { runJobsImpact } from './commands/jobs/impact';
export type {
  JobsViewCommandOptions,
  JobsViewCommandOptions as JobsGetCommandOptions,
  JobsViewCommandOptions as JobsPerformanceCommandOptions,
  JobsViewCommandOptions as JobsQueryCommandOptions,
  JobsViewCommandOptions as JobsSummaryCommandOptions,
} from './commands/jobs/run-jobs-view';
export { runJobsList } from './commands/jobs/list';
export type { JobsListCommandOptions } from './commands/jobs/list';
export { runDatasetsGet } from './commands/datasets/get';
export type { DatasetsGetCommandOptions } from './commands/datasets/get';
export { runTablesList } from './commands/tables/list';
export type { TablesListCommandOptions } from './commands/tables/list';
export { runTablesGet } from './commands/tables/get';
export type { TablesGetCommandOptions } from './commands/tables/get';
export { runSchemaCommand } from './commands/schema';
