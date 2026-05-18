import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SdkBigQueryClient } from './sdk-inspection-client';

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
        allUsers: true,
        minCreationTime: 1,
        maxCreationTime: 2,
        pageToken: 'tok',
        maxResults: 5,
        state: 'DONE',
        parentJobId: 'parent_1',
      }),
    ).resolves.toEqual({
      jobs: [{ id: 'listed' }],
      nextPageToken: 'next',
    });

    expect(getJobs).toHaveBeenCalledWith({
      autoPaginate: false,
      allUsers: true,
      minCreationTime: '1',
      maxCreationTime: '2',
      pageToken: 'tok',
      maxResults: 5,
      stateFilter: ['done'],
      parentJobId: 'parent_1',
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

    expect(getTables).toHaveBeenCalledWith();
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
