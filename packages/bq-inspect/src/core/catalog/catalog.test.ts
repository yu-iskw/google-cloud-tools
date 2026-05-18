import { describe, expect, it } from 'vitest';

import { BqInspectFailure, createBqInspectError } from '../shared/errors';

import { getDatasetMetadata, getTableMetadata, listTablesMetadata } from './catalog';

import type { BigQueryInspectionClient } from '../../bigquery/bigquery-job-client';

describe('catalog metadata', () => {
  it('returns dataset metadata', async () => {
    const client: Pick<BigQueryInspectionClient, 'getDataset'> = {
      async getDataset() {
        return { datasetId: 'd1', friendlyName: 'D' };
      },
    };

    const response = await getDatasetMetadata(
      { projectId: 'p', datasetId: 'd1' },
      { client, toolVersion: '0.1.0' },
    );

    expect(response.errors).toEqual([]);
    expect(response.resource).toEqual({ datasetId: 'd1', friendlyName: 'D' });
  });

  it('returns tables list', async () => {
    const client: Pick<BigQueryInspectionClient, 'listTables'> = {
      async listTables() {
        return [{ tableId: 't1' }];
      },
    };

    const response = await listTablesMetadata(
      { projectId: 'p', datasetId: 'd1' },
      { client, toolVersion: '0.1.0' },
    );

    expect(response.tables).toHaveLength(1);
  });

  it('returns errors for table metadata failures', async () => {
    const client: Pick<BigQueryInspectionClient, 'getTable'> = {
      async getTable() {
        throw new BqInspectFailure(
          createBqInspectError({
            code: 'BQINSPECT_JOB_NOT_FOUND',
            message: 'Missing.',
            source: { api: 'bigquery.tables.get', status: 404 },
          }),
        );
      },
    };

    const response = await getTableMetadata(
      { projectId: 'p', datasetId: 'd1', tableId: 't1' },
      { client, toolVersion: '0.1.0' },
    );

    expect(response.resource).toBeUndefined();
    expect(response.errors[0]?.code).toBe('BQINSPECT_JOB_NOT_FOUND');
  });
});
