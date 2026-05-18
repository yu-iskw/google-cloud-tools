import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BqInspectFailure } from '../../core/shared/errors';

import {
  extractGoogleErrorMessage,
  mapGoogleErrorToBqInspectFailure,
  mapHttpStatusToErrorCode,
  resolveHttpStatus,
  SdkBigQueryClient,
} from './sdk-job-client';

import type { AuthClient } from 'google-auth-library';

const getMetadata = vi.fn();
const job = vi.fn(() => ({ getMetadata }));
const getJobs = vi.fn();
const datasetGetMetadata = vi.fn();
const getTables = vi.fn();
const tableGetMetadata = vi.fn();
const dataset = vi.fn(() => ({
  getMetadata: datasetGetMetadata,
  getTables,
  table: vi.fn(() => ({ getMetadata: tableGetMetadata })),
}));

vi.mock('@google-cloud/bigquery', () => ({
  BigQuery: vi.fn(function BigQuery() {
    return {
      job,
      getJobs,
      dataset,
    };
  }),
}));

describe('resolveHttpStatus', () => {
  it('reads numeric HTTP codes from error.code', () => {
    expect(resolveHttpStatus({ code: 404 })).toBe(404);
  });

  it('reads HTTP status from nested response.status', () => {
    expect(resolveHttpStatus({ response: { status: 403 } })).toBe(403);
  });

  it('parses stringified HTTP codes', () => {
    expect(resolveHttpStatus({ code: '429' })).toBe(429);
  });

  it('returns undefined when no HTTP status is present', () => {
    expect(resolveHttpStatus({ code: 'ENOTFOUND' })).toBeUndefined();
    expect(resolveHttpStatus(null)).toBeUndefined();
  });
});

describe('mapHttpStatusToErrorCode', () => {
  it.each([
    [401, 'BQINSPECT_PERMISSION_DENIED'],
    [403, 'BQINSPECT_PERMISSION_DENIED'],
    [404, 'BQINSPECT_JOB_NOT_FOUND'],
    [429, 'BQINSPECT_API_RATE_LIMITED'],
    [500, 'BQINSPECT_API_UNAVAILABLE'],
    [418, 'BQINSPECT_API_UNAVAILABLE'],
  ])('maps HTTP %i to %s', (status, code) => {
    expect(mapHttpStatusToErrorCode(status)).toBe(code);
  });
});

describe('extractGoogleErrorMessage', () => {
  it('prefers Error.message when present', () => {
    expect(extractGoogleErrorMessage(new Error('boom'))).toBe('boom');
  });

  it('falls back to a generic message for non-Errors', () => {
    expect(extractGoogleErrorMessage('x')).toBe('BigQuery request failed.');
  });

  it('reads message from plain objects', () => {
    expect(extractGoogleErrorMessage({ message: 'from object' })).toBe('from object');
  });
});

describe('mapGoogleErrorToBqInspectFailure', () => {
  it('maps HTTP errors to BqInspectFailure with source status', () => {
    const failure = mapGoogleErrorToBqInspectFailure(
      { code: 404, message: 'Missing job.' },
      'bigquery.jobs.get',
    );

    expect(failure).toBeInstanceOf(BqInspectFailure);
    expect(failure.details.code).toBe('BQINSPECT_JOB_NOT_FOUND');
    expect(failure.details.source).toEqual({ api: 'bigquery.jobs.get', status: 404 });
  });

  it('adds IAM hints for permission denied on catalog APIs', () => {
    const failure = mapGoogleErrorToBqInspectFailure(
      { code: 403, message: 'Denied.' },
      'bigquery.tables.get',
    );

    expect(failure.details.code).toBe('BQINSPECT_PERMISSION_DENIED');
    expect(failure.details.hint).toContain('metadataViewer');
    expect(failure.details.source).toEqual({ api: 'bigquery.tables.get', status: 403 });
  });

  it('adds location guidance for jobs.get 403 when job ref has no location', () => {
    const failure = mapGoogleErrorToBqInspectFailure(
      { code: 403, message: 'Access Denied.' },
      'bigquery.jobs.get',
      { jobRef: { projectId: 'p', jobId: 'j' } },
    );

    expect(failure.details.hint).toContain('Add location on each job ref');
  });

  it('adds location guidance for jobs.get 404 when job ref has no location', () => {
    const failure = mapGoogleErrorToBqInspectFailure(
      { code: 404, message: 'Not found: Job' },
      'bigquery.jobs.get',
      { jobRef: { projectId: 'p', jobId: 'j' } },
    );

    expect(failure.details.code).toBe('BQINSPECT_JOB_NOT_FOUND');
    expect(failure.details.hint).toContain('Add location on each job ref');
  });

  it('maps missing status to internal errors', () => {
    const failure = mapGoogleErrorToBqInspectFailure(new Error('network'));

    expect(failure.details.code).toBe('BQINSPECT_INTERNAL');
  });
});

describe('SdkBigQueryClient', () => {
  const authClient = {} as AuthClient;

  beforeEach(() => {
    vi.clearAllMocks();
    job.mockReturnValue({ getMetadata });
    getMetadata.mockResolvedValue([{ id: 'job-1' }]);
    getJobs.mockResolvedValue([[{ metadata: { id: 'listed' } }], {}, { nextPageToken: 'next' }]);
    datasetGetMetadata.mockResolvedValue([{ datasetId: 'd' }]);
    getTables.mockResolvedValue([[{ metadata: { tableId: 't' }, id: 't-fallback' }]]);
    tableGetMetadata.mockResolvedValue([{ tableId: 't' }]);
  });

  it('getJob returns metadata with location', async () => {
    const client = new SdkBigQueryClient(authClient);

    await expect(client.getJob({ projectId: 'p', jobId: 'j', location: 'US' })).resolves.toEqual({
      id: 'job-1',
    });
    expect(job).toHaveBeenCalledWith('j', { location: 'US' });
  });

  it('getJob omits location when blank', async () => {
    const client = new SdkBigQueryClient(authClient);

    await client.getJob({ projectId: 'p', jobId: 'j', location: '  ' });

    expect(job).toHaveBeenCalledWith('j');
  });

  it('getJob maps API errors to BqInspectFailure', async () => {
    getMetadata.mockRejectedValue({ code: 404, message: 'Missing.' });
    const client = new SdkBigQueryClient(authClient);

    await expect(client.getJob({ projectId: 'p', jobId: 'j' })).rejects.toMatchObject({
      details: { code: 'BQINSPECT_JOB_NOT_FOUND' },
    });
  });

  it('listJobs returns jobs and next page token', async () => {
    const client = new SdkBigQueryClient(authClient);

    await expect(
      client.listJobs({
        projectId: 'p',
        location: 'US',
        allUsers: true,
        minCreationTime: 1,
        maxCreationTime: 2,
        pageToken: 'tok',
        maxResults: 5,
      }),
    ).resolves.toEqual({
      jobs: [{ id: 'listed' }],
      nextPageToken: 'next',
    });
  });

  it('getDataset returns metadata', async () => {
    const client = new SdkBigQueryClient(authClient);

    await expect(client.getDataset({ projectId: 'p', datasetId: 'd' })).resolves.toEqual({
      datasetId: 'd',
    });
  });

  it('listTables returns table metadata', async () => {
    const client = new SdkBigQueryClient(authClient);

    await expect(client.listTables({ projectId: 'p', datasetId: 'd' })).resolves.toEqual([
      { tableId: 't' },
    ]);
  });

  it('getTable returns metadata', async () => {
    const client = new SdkBigQueryClient(authClient);

    await expect(
      client.getTable({ projectId: 'p', datasetId: 'd', tableId: 't' }),
    ).resolves.toEqual({ tableId: 't' });
  });

  it('reuses BigQuery client per project', async () => {
    const { BigQuery } = await import('@google-cloud/bigquery');
    const client = new SdkBigQueryClient(authClient);

    await client.getJob({ projectId: 'p', jobId: 'a' });
    await client.getJob({ projectId: 'p', jobId: 'b' });

    expect(BigQuery).toHaveBeenCalledTimes(1);
  });
});
