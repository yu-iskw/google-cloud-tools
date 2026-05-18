import type { JobView } from '../shared/types';

function omitKeys(
  source: Record<string, unknown>,
  keys: readonly string[],
): Record<string, unknown> {
  const output = { ...source };

  for (const key of keys) {
    Reflect.deleteProperty(output, key);
  }

  return output;
}

function trimStatisticsQuery(statistics: unknown, queryKeysToOmit: readonly string[]): unknown {
  if (typeof statistics !== 'object' || statistics === null) {
    return statistics;
  }

  const stats = statistics as Record<string, unknown>;
  const query = stats.query;

  if (typeof query !== 'object' || query === null) {
    return { ...stats };
  }

  return {
    ...stats,
    query: omitKeys(query as Record<string, unknown>, queryKeysToOmit),
  };
}

function pickDefined(
  record: Record<string, unknown>,
  keys: readonly string[],
): Record<string, unknown> {
  const output: Record<string, unknown> = {};

  for (const key of keys) {
    if (Object.hasOwn(record, key)) {
      // eslint-disable-next-line security/detect-object-injection -- keys are fixed per view, not user-controlled
      output[key] = record[key];
    }
  }

  return output;
}

function projectSummary(record: Record<string, unknown>): Record<string, unknown> {
  const output = pickDefined(record, ['id', 'jobReference', 'kind', 'status']);

  if (record.statistics !== undefined) {
    output.statistics = trimStatisticsQuery(record.statistics, ['queryPlan', 'timeline']);
  }

  return output;
}

function projectQuery(record: Record<string, unknown>): Record<string, unknown> {
  return pickDefined(record, ['jobReference', 'configuration', 'labels']);
}

function projectPerformance(record: Record<string, unknown>): Record<string, unknown> {
  const output = pickDefined(record, [
    'jobReference',
    'status',
    'sessionInfo',
    'reservationEdition',
  ]);

  if (record.statistics !== undefined) {
    output.statistics = trimStatisticsQuery(record.statistics, ['query']);
  }

  return output;
}

export function projectJob(job: unknown, view: JobView): unknown {
  if (view === 'full') {
    return job;
  }

  if (typeof job !== 'object' || job === null) {
    return job;
  }

  const record = job as Record<string, unknown>;

  switch (view) {
    case 'summary':
      return projectSummary(record);
    case 'query':
      return projectQuery(record);
    case 'performance':
      return projectPerformance(record);
  }
}
