import { describe, expect, it } from 'vitest';

import { FixtureBigQueryClient } from '../../test-support/fixture-job-client';
import { BqInspectFailure, createBqInspectError } from '../shared/errors';

import { listJobs } from './list';

import type { BigQueryInspectionClient } from '../../bigquery/port/inspection-client';

describe('listJobs', () => {
  it('returns filtered jobs and nextPageToken from the client page', async () => {
    const client = new FixtureBigQueryClient({
      listJobsPage: {
        jobs: [
          { status: { state: 'DONE' }, statistics: { query: { totalSlotMs: '5000' } } },
          { status: { state: 'DONE' }, statistics: { query: { totalSlotMs: '10' } } },
        ],
        nextPageToken: 'next',
      },
    });

    const response = await listJobs({
      client,
      toolVersion: '0.1.0',
      listRequest: { projectId: 'p' },
      filters: { minSlotMs: 1000n },
    });

    expect(response.errors).toEqual([]);
    expect(response.jobs).toHaveLength(1);
    expect(response.page.nextPageToken).toBe('next');
    expect(response.request.projectId).toBe('p');
    expect(response.request.filters.minSlotMs).toBe('1000');
  });

  it('captures BigQuery failures into the response errors envelope', async () => {
    const client: BigQueryInspectionClient = {
      async getJob() {
        throw new Error('not used');
      },
      async listJobs() {
        throw new BqInspectFailure(
          createBqInspectError({
            code: 'BQINSPECT_PERMISSION_DENIED',
            message: 'Denied.',
            source: { api: 'bigquery.jobs.list', status: 403 },
          }),
        );
      },
      async getDataset() {
        throw new Error('not used');
      },
      async listTables() {
        throw new Error('not used');
      },
      async getTable() {
        throw new Error('not used');
      },
    };

    const response = await listJobs({
      client,
      toolVersion: '0.1.0',
      listRequest: { projectId: 'p' },
      filters: {},
    });

    expect(response.jobs).toEqual([]);
    expect(response.errors).toHaveLength(1);
    expect(response.errors[0]?.code).toBe('BQINSPECT_PERMISSION_DENIED');
  });

  it('rethrows non-BqInspectFailure errors', async () => {
    const client: BigQueryInspectionClient = {
      async getJob() {
        throw new Error('not used');
      },
      async listJobs() {
        throw new Error('boom');
      },
      async getDataset() {
        throw new Error('not used');
      },
      async listTables() {
        throw new Error('not used');
      },
      async getTable() {
        throw new Error('not used');
      },
    };

    await expect(
      listJobs({
        client,
        toolVersion: '0.1.0',
        listRequest: { projectId: 'p' },
        filters: {},
      }),
    ).rejects.toThrow('boom');
  });

  it('echoes list request options and impersonation in the request envelope', async () => {
    const client = new FixtureBigQueryClient({ listJobsPage: { jobs: [] } });

    const response = await listJobs({
      client,
      toolVersion: '0.1.0',
      listRequest: {
        projectId: 'p',
        allUsers: true,
        minCreationTime: 1,
        maxCreationTime: 2,
        pageToken: 'tok',
        maxResults: 10,
        state: 'DONE',
        parentJobId: 'parent_1',
      },
      filters: { labels: { team: 'data' } },
      impersonateServiceAccount: 'sa@p.iam.gserviceaccount.com',
      impersonateDelegates: ['d@p.iam.gserviceaccount.com'],
    });

    expect(response.request).toMatchObject({
      projectId: 'p',
      allUsers: true,
      minCreationTime: 1,
      maxCreationTime: 2,
      pageToken: 'tok',
      maxResults: 10,
      state: 'DONE',
      parentJobId: 'parent_1',
      impersonateServiceAccount: 'sa@p.iam.gserviceaccount.com',
      impersonateDelegates: ['d@p.iam.gserviceaccount.com'],
      filters: { labels: { team: 'data' } },
    });
  });
});
