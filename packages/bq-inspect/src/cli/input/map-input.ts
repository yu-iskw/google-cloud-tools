import { normalizeJobRef } from '../../core/shared/job-ref';
import { normalizeDelegateList, normalizeOptionalTrimmed } from '../../core/shared/normalize';

import type {
  ImpersonationFields,
  ParsedCatalogInput,
  ParsedJobsListInput,
  ParsedJobsViewInput,
} from './parsed-input-types';
import type { ListJobsRequest } from '../../bigquery/client/job-client';
import type { JobFilters } from '../../core/jobs/filter';
import type { JobRef } from '../../core/shared/types';

function parseImpersonationFields(obj: Record<string, unknown>): ImpersonationFields {
  const impersonateServiceAccount =
    typeof obj.impersonateServiceAccount === 'string'
      ? normalizeOptionalTrimmed(obj.impersonateServiceAccount)
      : undefined;

  const rawDelegates = obj.impersonateDelegates;
  let impersonateDelegates: string[] | undefined;

  if (rawDelegates !== undefined) {
    impersonateDelegates = normalizeDelegateList(rawDelegates as string[]);

    if (impersonateDelegates.length === 0) {
      impersonateDelegates = undefined;
    }
  }

  return {
    ...(impersonateServiceAccount === undefined ? {} : { impersonateServiceAccount }),
    ...(impersonateDelegates === undefined ? {} : { impersonateDelegates }),
  };
}

function mapJobsArray(raw: unknown): JobRef[] {
  return (raw as JobRef[]).map((job) => normalizeJobRef(job));
}

export function mapJobsViewInput(obj: Record<string, unknown>): ParsedJobsViewInput {
  return {
    jobs: mapJobsArray(obj.jobs),
    ...parseImpersonationFields(obj),
  };
}

export function mapJobsListInput(obj: Record<string, unknown>): ParsedJobsListInput {
  const listRequest: ListJobsRequest = {
    projectId: String(obj.projectId).trim(),
    ...(typeof obj.location === 'string' && obj.location.trim().length > 0
      ? { location: obj.location.trim() }
      : {}),
    ...(obj.allUsers === true ? { allUsers: true } : {}),
    ...(typeof obj.minCreationTime === 'string'
      ? { minCreationTime: Date.parse(obj.minCreationTime) }
      : {}),
    ...(typeof obj.maxCreationTime === 'string'
      ? { maxCreationTime: Date.parse(obj.maxCreationTime) }
      : {}),
    ...(typeof obj.pageToken === 'string' && obj.pageToken.trim().length > 0
      ? { pageToken: obj.pageToken.trim() }
      : {}),
    ...(typeof obj.maxResults === 'number' ? { maxResults: obj.maxResults } : {}),
  };

  const labels =
    obj.labels !== undefined &&
    typeof obj.labels === 'object' &&
    obj.labels !== null &&
    Object.keys(obj.labels as Record<string, string>).length > 0
      ? (obj.labels as Record<string, string>)
      : undefined;

  const filters: JobFilters = {
    ...(typeof obj.minSlotMs === 'string' ? { minSlotMs: BigInt(obj.minSlotMs) } : {}),
    ...(typeof obj.minBytesBilled === 'string'
      ? { minBytesBilled: BigInt(obj.minBytesBilled) }
      : {}),
    ...(typeof obj.state === 'string' && obj.state.trim().length > 0
      ? { state: obj.state.trim() }
      : {}),
    ...(labels === undefined ? {} : { labels }),
    ...(typeof obj.parentJobId === 'string' && obj.parentJobId.trim().length > 0
      ? { parentJobId: obj.parentJobId.trim() }
      : {}),
  };

  return {
    listRequest,
    filters,
    ...parseImpersonationFields(obj),
  };
}

export function mapCatalogInput(obj: Record<string, unknown>): ParsedCatalogInput {
  return {
    projectId: String(obj.projectId).trim(),
    datasetId: String(obj.datasetId).trim(),
    ...(typeof obj.tableId === 'string' ? { tableId: obj.tableId.trim() } : {}),
    ...parseImpersonationFields(obj),
  };
}
