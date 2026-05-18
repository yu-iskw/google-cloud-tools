import { isBigQueryJob } from './bigquery-job-types';

import type {
  BigQueryJob,
  JobImpactProjection,
  JobLineageProjection,
  JobPerformanceProjection,
  JobProjection,
  JobQueryProjection,
  JobStatistics,
  JobStatisticsQuery,
  JobSummaryProjection,
  ProjectedJobView,
} from './bigquery-job-types';
import type { JobView } from '../shared/types';

const QUERY_LINEAGE_KEYS = [
  'referencedTables',
  'referencedViews',
  'referencedRoutines',
  'referencedRowAccessPolicies',
  'referencedDatasets',
  'referencedPropertyGraphs',
  'destinationTable',
  'ddlTargetTable',
  'ddlAffectedRowAccessPolicy',
  'statementType',
] as const satisfies readonly (keyof JobStatisticsQuery)[];

const QUERY_IMPACT_KEYS = [
  'dmlStats',
  'statementType',
] as const satisfies readonly (keyof JobStatisticsQuery)[];

const STATISTICS_IMPACT_TOP_KEYS = [
  'load',
  'extract',
  'copy',
  'mlStatistics',
  'exportDataStatistics',
  'externalServiceCost',
  'biEngineStatistics',
  'loadQueryStatistics',
  'searchStatistics',
  'vectorSearchStatistics',
  'sparkStatistics',
  'materializedViewStatistics',
  'metadataCacheStatistics',
] as const satisfies readonly (keyof JobStatistics)[];

const QUERY_QUERY_VIEW_KEYS = [
  ...QUERY_LINEAGE_KEYS,
  'totalBytesProcessed',
  'totalBytesBilled',
  'totalSlotMs',
] as const satisfies readonly (keyof JobStatisticsQuery)[];

function omitKeys<T extends object, K extends keyof T>(source: T, keys: readonly K[]): Omit<T, K> {
  const output = { ...source };

  for (const key of keys) {
    Reflect.deleteProperty(output, key);
  }

  return output;
}

function trimStatisticsQuery(
  statistics: JobStatistics,
  queryKeysToOmit: readonly (keyof JobStatisticsQuery)[],
): JobStatistics {
  const query = statistics.query;

  if (query === undefined) {
    return { ...statistics };
  }

  return {
    ...statistics,
    query: omitKeys(query, queryKeysToOmit),
  };
}

function pickDefined<T extends object, K extends keyof T>(
  record: T,
  keys: readonly K[],
): Pick<T, K> {
  const output = {} as Pick<T, K>;

  for (const key of keys) {
    if (Object.hasOwn(record, key)) {
      // eslint-disable-next-line security/detect-object-injection -- keys are fixed per view, not user-controlled
      output[key] = record[key];
    }
  }

  return output;
}

function hasKeys(record: object): boolean {
  return Object.keys(record).length > 0;
}

function pickQuerySubset(
  statistics: JobStatistics | undefined,
  keys: readonly (keyof JobStatisticsQuery)[],
): Pick<JobStatistics, 'query'> | undefined {
  const query = statistics?.query;

  if (query === undefined) {
    return undefined;
  }

  const picked = pickDefined(query, keys);

  return hasKeys(picked) ? { query: picked } : undefined;
}

function pickStatisticsTopLevel(
  statistics: JobStatistics | undefined,
  keys: readonly (keyof JobStatistics)[],
): JobStatistics | undefined {
  if (statistics === undefined) {
    return undefined;
  }

  const picked = pickDefined(statistics, keys);

  return hasKeys(picked) ? picked : undefined;
}

function mergeStatisticsParts(
  queryPart: Pick<JobStatistics, 'query'> | undefined,
  topPart: JobStatistics | undefined,
): JobStatistics | undefined {
  if (queryPart === undefined && topPart === undefined) {
    return undefined;
  }

  return { ...queryPart, ...topPart };
}

function projectSummary(job: BigQueryJob): JobSummaryProjection {
  const output: JobSummaryProjection = pickDefined(job, ['id', 'jobReference', 'kind', 'status']);

  if (job.statistics !== undefined) {
    output.statistics = trimStatisticsQuery(job.statistics, ['queryPlan', 'timeline']);
  }

  return output;
}

function projectQuery(job: BigQueryJob): JobQueryProjection {
  const output: JobQueryProjection = pickDefined(job, ['jobReference', 'configuration', 'labels']);
  const stats = pickQuerySubset(job.statistics, QUERY_QUERY_VIEW_KEYS);

  if (stats !== undefined) {
    output.statistics = stats;
  }

  return output;
}

function projectPerformance(job: BigQueryJob): JobPerformanceProjection {
  const output: JobPerformanceProjection = pickDefined(job, [
    'jobReference',
    'status',
    'sessionInfo',
    'reservationEdition',
  ]);

  if (job.statistics !== undefined) {
    output.statistics = trimStatisticsQuery(job.statistics, ['query']);
  }

  return output;
}

function projectLineage(job: BigQueryJob): JobLineageProjection {
  const output: JobLineageProjection = pickDefined(job, ['jobReference', 'status']);
  const stats = pickQuerySubset(job.statistics, QUERY_LINEAGE_KEYS);

  if (stats !== undefined) {
    output.statistics = stats;
  }

  return output;
}

function projectImpact(job: BigQueryJob): JobImpactProjection {
  const output: JobImpactProjection = pickDefined(job, ['jobReference', 'status']);
  const statistics = mergeStatisticsParts(
    pickQuerySubset(job.statistics, QUERY_IMPACT_KEYS),
    pickStatisticsTopLevel(job.statistics, STATISTICS_IMPACT_TOP_KEYS),
  );

  if (statistics !== undefined) {
    output.statistics = statistics;
  }

  return output;
}

const jobProjectors = {
  summary: projectSummary,
  query: projectQuery,
  performance: projectPerformance,
  lineage: projectLineage,
  impact: projectImpact,
} satisfies Record<ProjectedJobView, (job: BigQueryJob) => JobProjection>;

export function projectJob(job: unknown, view: JobView): unknown {
  if (view === 'full') {
    return job;
  }

  if (!isBigQueryJob(job)) {
    return job;
  }

  // eslint-disable-next-line security/detect-object-injection -- view is a typed ProjectedJobView
  return jobProjectors[view](job);
}
