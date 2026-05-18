import { buildToolEnvelope } from '../shared/envelope';
import { BqInspectFailure } from '../shared/errors';

import { filterJobSummaries, type JobFilters } from './filter';

import type { BigQueryInspectionClient, ListJobsRequest } from '../../bigquery/client/job-client';
import type { BqInspectError, JobListFiltersEcho, ListJobsResponse } from '../shared/types';

interface ListJobsOrchestrationInput {
  client: BigQueryInspectionClient;
  toolVersion: string;
  listRequest: ListJobsRequest;
  filters: JobFilters;
  impersonateServiceAccount?: string;
  impersonateDelegates?: string[];
}

function filtersToEcho(filters: JobFilters): JobListFiltersEcho {
  return {
    ...(filters.minSlotMs !== undefined ? { minSlotMs: filters.minSlotMs.toString() } : {}),
    ...(filters.minBytesBilled !== undefined
      ? { minBytesBilled: filters.minBytesBilled.toString() }
      : {}),
    ...(filters.state !== undefined ? { state: filters.state } : {}),
    ...(filters.labels !== undefined && Object.keys(filters.labels).length > 0
      ? { labels: filters.labels }
      : {}),
    ...(filters.parentJobId !== undefined ? { parentJobId: filters.parentJobId } : {}),
  };
}

export async function listJobs(input: ListJobsOrchestrationInput): Promise<ListJobsResponse> {
  const { tool, schemaVersion } = buildToolEnvelope(input.toolVersion);

  const request: ListJobsResponse['request'] = {
    projectId: input.listRequest.projectId,
    ...(input.listRequest.location === undefined || input.listRequest.location.trim().length === 0
      ? {}
      : { location: input.listRequest.location.trim() }),
    ...(input.listRequest.allUsers === true ? { allUsers: true } : {}),
    ...(input.listRequest.minCreationTime !== undefined
      ? { minCreationTime: input.listRequest.minCreationTime }
      : {}),
    ...(input.listRequest.maxCreationTime !== undefined
      ? { maxCreationTime: input.listRequest.maxCreationTime }
      : {}),
    ...(input.listRequest.pageToken !== undefined && input.listRequest.pageToken.length > 0
      ? { pageToken: input.listRequest.pageToken }
      : {}),
    ...(input.listRequest.maxResults !== undefined
      ? { maxResults: input.listRequest.maxResults }
      : {}),
    filters: filtersToEcho(input.filters),
    ...(input.impersonateServiceAccount === undefined
      ? {}
      : {
          impersonateServiceAccount: input.impersonateServiceAccount,
          ...(input.impersonateDelegates !== undefined && input.impersonateDelegates.length > 0
            ? { impersonateDelegates: input.impersonateDelegates }
            : {}),
        }),
  };

  try {
    const page = await input.client.listJobs(input.listRequest);
    const filtered = filterJobSummaries(page.jobs, input.filters);

    return {
      schemaVersion,
      tool,
      request,
      jobs: filtered,
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
