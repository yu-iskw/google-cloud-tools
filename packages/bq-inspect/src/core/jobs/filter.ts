/* eslint-disable security/detect-object-injection -- JSON-like tree traversal uses keys from trusted BigQuery job list payloads */

function readBigIntPath(input: unknown, path: string[]): bigint | undefined {
  let current: unknown = input;

  for (const key of path) {
    if (typeof current !== 'object' || current === null || !(key in current)) {
      return undefined;
    }

    current = (current as Record<string, unknown>)[key];
  }

  if (typeof current === 'string' || typeof current === 'number') {
    try {
      return BigInt(current);
    } catch {
      return undefined;
    }
  }

  return undefined;
}

function readLabels(job: unknown): Record<string, string> | undefined {
  if (typeof job !== 'object' || job === null || !('labels' in job)) {
    return undefined;
  }

  const labels = (job as Record<string, unknown>).labels;

  if (typeof labels !== 'object' || labels === null) {
    return undefined;
  }

  const out: Record<string, string> = {};

  for (const [key, value] of Object.entries(labels)) {
    if (typeof value === 'string') {
      out[key] = value;
    }
  }

  return Object.keys(out).length > 0 ? out : undefined;
}

function totalSlotMs(job: unknown): bigint | undefined {
  const querySlots = readBigIntPath(job, ['statistics', 'query', 'totalSlotMs']);

  if (querySlots !== undefined) {
    return querySlots;
  }

  return readBigIntPath(job, ['statistics', 'totalSlotMs']);
}

function totalBytesBilled(job: unknown): bigint | undefined {
  return readBigIntPath(job, ['statistics', 'query', 'totalBytesBilled']);
}

/** Post-list filters only (fields BigQuery jobs.list cannot filter server-side). */
export interface JobFilters {
  minSlotMs?: bigint;
  minBytesBilled?: bigint;
  labels?: Record<string, string>;
}

function hasActiveJobFilters(filters: JobFilters): boolean {
  return (
    filters.minSlotMs !== undefined ||
    filters.minBytesBilled !== undefined ||
    (filters.labels !== undefined && Object.keys(filters.labels).length > 0)
  );
}

export function filterJobSummaries(jobs: unknown[], filters: JobFilters): unknown[] {
  if (!hasActiveJobFilters(filters)) {
    return jobs;
  }

  const labelsFilterActive = filters.labels !== undefined && Object.keys(filters.labels).length > 0;

  return jobs.filter((job) => matchesFilters(job, filters, labelsFilterActive));
}

function matchesFilters(job: unknown, filters: JobFilters, labelsFilterActive: boolean): boolean {
  if (filters.minSlotMs !== undefined) {
    const slot = totalSlotMs(job);

    if (slot === undefined || slot < filters.minSlotMs) {
      return false;
    }
  }

  if (filters.minBytesBilled !== undefined) {
    const billed = totalBytesBilled(job);

    if (billed === undefined || billed < filters.minBytesBilled) {
      return false;
    }
  }

  if (labelsFilterActive && filters.labels !== undefined) {
    const jobLabels = readLabels(job) ?? {};

    for (const [key, value] of Object.entries(filters.labels)) {
      if (jobLabels[key] !== value) {
        return false;
      }
    }
  }

  return true;
}
