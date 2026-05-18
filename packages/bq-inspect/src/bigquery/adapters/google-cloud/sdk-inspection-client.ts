/**
 * Google Cloud SDK adapter for read-only BigQuery inspection.
 * - listJobs: autoPaginate false (CLI exposes pageToken).
 * - listTables: default getTables() paging (full dataset in one response).
 */
import { BigQuery, type GetJobsOptions, type GetJobsResponse } from '@google-cloud/bigquery';

import { mapGoogleErrorToBqInspectFailure } from '../../errors/google-api-errors';

import type { JobRef } from '../../../core/shared/types';
import type { BigQueryInspectionClient } from '../../port/inspection-client';
import type { ListJobsPage, ListJobsRequest } from '../../types/list-jobs';
import type { DatasetRef, TableRef } from '../../types/refs';
import type { AuthClient } from 'google-auth-library';

function readNextPageToken(response: unknown): string | undefined {
  if (typeof response !== 'object' || response === null) {
    return undefined;
  }

  const record = response as Record<string, unknown>;
  const token = record.nextPageToken ?? record.pageToken;

  return typeof token === 'string' && token.length > 0 ? token : undefined;
}

export class SdkBigQueryClient implements BigQueryInspectionClient {
  private readonly authClient: AuthClient;
  private readonly bqByProject = new Map<string, BigQuery>();

  public constructor(authClient: AuthClient) {
    this.authClient = authClient;
  }

  private getBigQuery(projectId: string): BigQuery {
    let client = this.bqByProject.get(projectId);

    if (client === undefined) {
      client = new BigQuery({
        projectId,
        authClient: this.authClient,
      });
      this.bqByProject.set(projectId, client);
    }

    return client;
  }

  public async getJob(ref: JobRef): Promise<unknown> {
    try {
      const bq = this.getBigQuery(ref.projectId);
      const job =
        ref.location === undefined || ref.location.trim().length === 0
          ? bq.job(ref.jobId)
          : bq.job(ref.jobId, { location: ref.location.trim() });
      const [metadata] = await job.getMetadata();

      return metadata as unknown;
    } catch (error: unknown) {
      throw mapGoogleErrorToBqInspectFailure(error, 'bigquery.jobs.get', { jobRef: ref });
    }
  }

  public async listJobs(request: ListJobsRequest): Promise<ListJobsPage> {
    try {
      const bq = this.getBigQuery(request.projectId);
      const listOptions: GetJobsOptions = {
        autoPaginate: false,
        ...(request.allUsers === true ? { allUsers: true } : {}),
        ...(request.minCreationTime === undefined
          ? {}
          : { minCreationTime: String(request.minCreationTime) }),
        ...(request.maxCreationTime === undefined
          ? {}
          : { maxCreationTime: String(request.maxCreationTime) }),
        ...(request.pageToken === undefined || request.pageToken.length === 0
          ? {}
          : { pageToken: request.pageToken }),
        ...(request.maxResults === undefined ? {} : { maxResults: request.maxResults }),
        ...(request.state === undefined || request.state.length === 0
          ? {}
          : { stateFilter: [request.state.toLowerCase() as 'done' | 'pending' | 'running'] }),
        ...(request.parentJobId === undefined || request.parentJobId.length === 0
          ? {}
          : { parentJobId: request.parentJobId }),
      };

      const raw = (await bq.getJobs(listOptions)) as GetJobsResponse;

      const jobList = raw[0];
      const apiResponse = raw.length >= 3 ? raw[2] : undefined;
      const jobRecords = jobList as Array<{ metadata?: unknown }>;
      const nextPageToken = readNextPageToken(apiResponse);

      return {
        jobs: jobRecords.map((entry) => entry.metadata ?? entry),
        ...(nextPageToken === undefined ? {} : { nextPageToken }),
      };
    } catch (error: unknown) {
      throw mapGoogleErrorToBqInspectFailure(error, 'bigquery.jobs.list');
    }
  }

  public async getDataset(ref: DatasetRef): Promise<unknown> {
    try {
      const bq = this.getBigQuery(ref.projectId);
      const [metadata] = await bq.dataset(ref.datasetId).getMetadata();

      return metadata as unknown;
    } catch (error: unknown) {
      throw mapGoogleErrorToBqInspectFailure(error, 'bigquery.datasets.get');
    }
  }

  public async listTables(ref: DatasetRef): Promise<unknown[]> {
    try {
      const bq = this.getBigQuery(ref.projectId);
      const [tables] = await bq.dataset(ref.datasetId).getTables();

      return tables.map((table) => table.metadata ?? { id: table.id });
    } catch (error: unknown) {
      throw mapGoogleErrorToBqInspectFailure(error, 'bigquery.tables.list');
    }
  }

  public async getTable(ref: TableRef): Promise<unknown> {
    try {
      const bq = this.getBigQuery(ref.projectId);
      const [metadata] = await bq.dataset(ref.datasetId).table(ref.tableId).getMetadata();

      return metadata as unknown;
    } catch (error: unknown) {
      throw mapGoogleErrorToBqInspectFailure(error, 'bigquery.tables.get');
    }
  }
}
