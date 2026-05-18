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

function readStringPath(input: unknown, path: string[]): string | undefined {
  let current: unknown = input;

  for (const key of path) {
    if (typeof current !== 'object' || current === null || !(key in current)) {
      return undefined;
    }

    current = (current as Record<string, unknown>)[key];
  }

  if (typeof current === 'string') {
    return current;
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
  return (
    readBigIntPath(job, ['statistics', 'query', 'totalSlotMs']) ??
    readBigIntPath(job, ['statistics', 'totalSlotMs'])
  );
}

function totalBytesBilled(job: unknown): bigint | undefined {
  return readBigIntPath(job, ['statistics', 'query', 'totalBytesBilled']);
}

function jobState(job: unknown): string | undefined {
  return readStringPath(job, ['status', 'state']);
}

function parentJobId(job: unknown): string | undefined {
  return readStringPath(job, ['statistics', 'parentJobId']);
}

export interface JobFilters {
  minSlotMs?: bigint;
  minBytesBilled?: bigint;
  state?: string;
  labels?: Record<string, string>;
  parentJobId?: string;
}

export function filterJobSummaries(jobs: unknown[], filters: JobFilters): unknown[] {
  return jobs.filter((job) => matchesFilters(job, filters));
}

function matchesFilters(job: unknown, filters: JobFilters): boolean {
  if (filters.state !== undefined && jobState(job) !== filters.state) {
    return false;
  }

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

  if (filters.labels !== undefined && Object.keys(filters.labels).length > 0) {
    const jobLabels = readLabels(job) ?? {};

    for (const [key, value] of Object.entries(filters.labels)) {
      if (jobLabels[key] !== value) {
        return false;
      }
    }
  }

  if (filters.parentJobId !== undefined && filters.parentJobId.length > 0) {
    if (parentJobId(job) !== filters.parentJobId) {
      return false;
    }
  }

  return true;
}
