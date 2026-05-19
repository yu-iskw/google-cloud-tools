import { buildToolEnvelope } from '../shared/envelope';
import { BqInspectFailure } from '../shared/errors';
import {
  impersonationRequestFields,
  type ImpersonationFields,
} from '../shared/impersonation-fields';

import { filterJobSummaries, type JobFilters } from './filter';

import type { BigQueryInspectionClient } from '../../bigquery/port/inspection-client';
import type { ListJobsRequest } from '../../bigquery/types/list-jobs';
import type { BqInspectError, JobListFiltersEcho, ListJobsResponse } from '../shared/types';

interface ListJobsOrchestrationInput extends ImpersonationFields {
  client: BigQueryInspectionClient;
  toolVersion: string;
  listRequest: ListJobsRequest;
  filters: JobFilters;
}

function filtersToEcho(filters: JobFilters): JobListFiltersEcho {
  return {
    ...(filters.minSlotMs !== undefined ? { minSlotMs: filters.minSlotMs.toString() } : {}),
    ...(filters.minBytesBilled !== undefined
      ? { minBytesBilled: filters.minBytesBilled.toString() }
      : {}),
    ...(filters.labels === undefined ? {} : { labels: filters.labels }),
  };
}

function buildListJobsRequestEcho(
  listRequest: ListJobsRequest,
  filters: JobFilters,
  impersonation: ImpersonationFields,
): ListJobsResponse['request'] {
  return {
    projectId: listRequest.projectId,
    ...(listRequest.allUsers === true ? { allUsers: true } : {}),
    ...(listRequest.minCreationTime !== undefined
      ? { minCreationTime: listRequest.minCreationTime }
      : {}),
    ...(listRequest.maxCreationTime !== undefined
      ? { maxCreationTime: listRequest.maxCreationTime }
      : {}),
    ...(listRequest.pageToken !== undefined && listRequest.pageToken.length > 0
      ? { pageToken: listRequest.pageToken }
      : {}),
    ...(listRequest.maxResults !== undefined ? { maxResults: listRequest.maxResults } : {}),
    ...(listRequest.state === undefined || listRequest.state.length === 0
      ? {}
      : { state: listRequest.state }),
    ...(listRequest.parentJobId === undefined || listRequest.parentJobId.length === 0
      ? {}
      : { parentJobId: listRequest.parentJobId }),
    filters: filtersToEcho(filters),
    ...impersonationRequestFields(impersonation),
  };
}

export async function listJobs(input: ListJobsOrchestrationInput): Promise<ListJobsResponse> {
  const { tool, schemaVersion } = buildToolEnvelope(input.toolVersion);
  const request = buildListJobsRequestEcho(input.listRequest, input.filters, input);

  try {
    const page = await input.client.listJobs(input.listRequest);
    const jobs = filterJobSummaries(page.jobs, input.filters);

    return {
      schemaVersion,
      tool,
      request,
      jobs,
      page: {
        ...(page.nextPageToken === undefined || page.nextPageToken.length === 0
          ? {}
          : { nextPageToken: page.nextPageToken }),
      },
      warnings: [],
      errors: [],
    };
  } catch (error: unknown) {
    const errors: BqInspectError[] = [];

    if (error instanceof BqInspectFailure) {
      errors.push(error.details);
    } else {
      throw error;
    }

    return {
      schemaVersion,
      tool,
      request,
      jobs: [],
      page: {},
      warnings: [],
      errors,
    };
  }
}
