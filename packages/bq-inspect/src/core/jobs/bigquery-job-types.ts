/**
 * Structural types for BigQuery Job REST resources (subset used by job projections).
 * @see https://cloud.google.com/bigquery/docs/reference/rest/v2/Job
 */

export interface TableReference {
  projectId?: string;
  datasetId?: string;
  tableId?: string;
}

export interface DatasetReference {
  projectId?: string;
  datasetId?: string;
}

export interface RoutineReference {
  projectId?: string;
  datasetId?: string;
  routineId?: string;
}

export interface RowAccessPolicyReference {
  projectId?: string;
  datasetId?: string;
  tableId?: string;
  policyId?: string;
}

export interface PropertyGraphReference {
  projectId?: string;
  graphId?: string;
}

export interface JobReference {
  projectId?: string;
  jobId?: string;
  location?: string;
}

export interface ErrorProto {
  reason?: string;
  location?: string;
  debugInfo?: string;
  message?: string;
}

export interface JobStatus {
  state?: string;
  errorResult?: ErrorProto;
  errors?: ErrorProto[];
}

export interface DmlStats {
  insertedRowCount?: string;
  deletedRowCount?: string;
  updatedRowCount?: string;
}

export interface ExplainQueryStage {
  name?: string;
  id?: string;
  startMs?: string;
  endMs?: string;
  inputStages?: string[];
  waitMsAvg?: string;
  waitMsMax?: string;
  waitRatioAvg?: number;
  waitRatioMax?: number;
  recordsRead?: string;
  recordsWritten?: string;
  parallelInputs?: string;
  completedParallelInputs?: string;
  status?: string;
  shuffleOutputBytes?: string;
  shuffleOutputBytesSpilled?: string;
  slotMs?: string;
  computeMode?: string;
}

export interface QueryTimelineSample {
  elapsedMs?: string;
  totalSlotMs?: string;
  pendingUnits?: string;
  completedUnits?: string;
  activeUnits?: string;
  estimatedRunnableUnits?: string;
}

/** Fields under statistics.query used by projections. */
export interface JobStatisticsQuery {
  statementType?: string;
  totalBytesProcessed?: string;
  totalBytesBilled?: string;
  totalSlotMs?: string;
  referencedTables?: TableReference[];
  referencedViews?: TableReference[];
  referencedRoutines?: RoutineReference[];
  referencedRowAccessPolicies?: RowAccessPolicyReference[];
  referencedDatasets?: DatasetReference[];
  referencedPropertyGraphs?: PropertyGraphReference[];
  destinationTable?: TableReference;
  ddlTargetTable?: TableReference;
  ddlAffectedRowAccessPolicy?: RowAccessPolicyReference;
  queryPlan?: ExplainQueryStage[];
  timeline?: QueryTimelineSample[];
  dmlStats?: DmlStats;
  query?: string;
  performanceInsights?: unknown[];
  queryInfo?: unknown;
}

/** Opaque job-kind stat blocks; projections pass them through by key. */
export type JobStatisticsExtension = Record<string, unknown>;

export interface JobStatistics extends JobStatisticsExtension {
  creationTime?: string;
  startTime?: string;
  endTime?: string;
  totalBytesProcessed?: string;
  totalSlotMs?: string;
  query?: JobStatisticsQuery;
  load?: JobStatisticsExtension;
  extract?: JobStatisticsExtension;
  copy?: JobStatisticsExtension;
  mlStatistics?: JobStatisticsExtension;
  exportDataStatistics?: JobStatisticsExtension;
  externalServiceCost?: JobStatisticsExtension;
  biEngineStatistics?: JobStatisticsExtension;
  loadQueryStatistics?: JobStatisticsExtension;
  searchStatistics?: JobStatisticsExtension;
  vectorSearchStatistics?: JobStatisticsExtension;
  sparkStatistics?: JobStatisticsExtension;
  materializedViewStatistics?: JobStatisticsExtension;
  metadataCacheStatistics?: JobStatisticsExtension;
}

export interface JobConfigurationQuery {
  query?: string;
  statementType?: string;
}

export interface JobConfiguration {
  query?: JobConfigurationQuery;
}

export interface BigQueryJob {
  id?: string;
  kind?: string;
  jobReference?: JobReference;
  status?: JobStatus;
  configuration?: JobConfiguration;
  labels?: Record<string, string>;
  statistics?: JobStatistics;
  sessionInfo?: JobStatisticsExtension;
  reservationEdition?: string;
  user_email?: string;
  principal_subject?: string;
}

export type ProjectedJobView = 'impact' | 'lineage' | 'performance' | 'query' | 'summary';

export type JobSummaryProjection = Pick<BigQueryJob, 'id' | 'jobReference' | 'kind' | 'status'> & {
  statistics?: JobStatistics;
};

export type JobQueryProjection = Pick<BigQueryJob, 'configuration' | 'jobReference' | 'labels'> & {
  statistics?: Pick<JobStatistics, 'query'>;
};

export type JobPerformanceProjection = Pick<
  BigQueryJob,
  'jobReference' | 'reservationEdition' | 'sessionInfo' | 'status'
> & {
  statistics?: JobStatistics;
};

export type JobLineageProjection = Pick<BigQueryJob, 'jobReference' | 'status'> & {
  statistics?: Pick<JobStatistics, 'query'>;
};

export type JobImpactProjection = Pick<BigQueryJob, 'jobReference' | 'status'> & {
  statistics?: JobStatistics;
};

export type JobProjection =
  | JobImpactProjection
  | JobLineageProjection
  | JobPerformanceProjection
  | JobQueryProjection
  | JobSummaryProjection;

export function isBigQueryJob(value: unknown): value is BigQueryJob {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
