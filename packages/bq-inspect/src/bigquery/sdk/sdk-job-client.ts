import { BigQuery, type GetJobsOptions, type GetJobsResponse } from '@google-cloud/bigquery';

import { hintForApiError, type ApiErrorHintContext } from '../../core/shared/api-error-hints';
import { BqInspectFailure, createBqInspectError } from '../../core/shared/errors';

import type { BqInspectErrorCode, JobRef } from '../../core/shared/types';
import type {
  BigQueryInspectionClient,
  DatasetRef,
  ListJobsPage,
  ListJobsRequest,
  TableRef,
} from '../client/job-client';
import type { AuthClient } from 'google-auth-library';

export function resolveHttpStatus(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null) {
    return undefined;
  }

  const record = error as Record<string, unknown>;
  const fromCode = parseHttpStatus(record.code);

  if (fromCode !== undefined) {
    return fromCode;
  }

  const response = record.response;

  if (typeof response === 'object' && response !== null) {
    const status = (response as { status?: unknown }).status;

    return parseHttpStatus(status);
  }

  return undefined;
}

function parseHttpStatus(value: unknown): number | undefined {
  if (typeof value === 'number' && value >= 100 && value < 600) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);

    if (!Number.isNaN(parsed) && parsed >= 100 && parsed < 600) {
      return parsed;
    }
  }

  return undefined;
}

export function extractGoogleErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;

    if (typeof message === 'string' && message.trim().length > 0) {
      return message;
    }
  }

  return 'BigQuery request failed.';
}

export function mapHttpStatusToErrorCode(status: number): BqInspectErrorCode {
  if (status === 403 || status === 401) {
    return 'BQINSPECT_PERMISSION_DENIED';
  }

  if (status === 404) {
    return 'BQINSPECT_JOB_NOT_FOUND';
  }

  if (status === 429) {
    return 'BQINSPECT_API_RATE_LIMITED';
  }

  if (status >= 500) {
    return 'BQINSPECT_API_UNAVAILABLE';
  }

  return 'BQINSPECT_API_UNAVAILABLE';
}

function readNextPageToken(response: unknown): string | undefined {
  if (typeof response !== 'object' || response === null) {
    return undefined;
  }

  const record = response as Record<string, unknown>;
  const token = record.nextPageToken ?? record.pageToken;

  return typeof token === 'string' && token.length > 0 ? token : undefined;
}

export function mapGoogleErrorToBqInspectFailure(
  error: unknown,
  api = 'bigquery.jobs.get',
  context?: ApiErrorHintContext,
): BqInspectFailure {
  const status = resolveHttpStatus(error);
  const message = extractGoogleErrorMessage(error);

  if (status === undefined) {
    return new BqInspectFailure(
      createBqInspectError({
        code: 'BQINSPECT_INTERNAL',
        message,
      }),
    );
  }

  const code = mapHttpStatusToErrorCode(status);
  const hint = hintForApiError(code, api, context);

  return new BqInspectFailure(
    createBqInspectError({
      code,
      message,
      ...(hint === undefined ? {} : { hint }),
      source: { api, status },
    }),
  );
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
        ...(request.location === undefined || request.location.trim().length === 0
          ? {}
          : { location: request.location.trim() }),
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
      const [tables] = await bq.dataset(ref.datasetId).getTables({ autoPaginate: false });

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
