import { describe, expect, it } from 'vitest';

import { BqInspectFailure, createBqInspectError } from '../shared/errors';

import { getTableMetadata } from './get';

import type { BigQueryInspectionClient } from '../../bigquery/port/inspection-client';

describe('getTableMetadata', () => {
  it('returns table metadata on success', async () => {
    const client: Pick<BigQueryInspectionClient, 'getTable'> = {
      async getTable() {
        return { tableId: 't1', type: 'TABLE' };
      },
    };

    const response = await getTableMetadata(
      { projectId: 'p', datasetId: 'd1', tableId: 't1' },
      { client, toolVersion: '0.1.0' },
    );

    expect(response.errors).toEqual([]);
    expect(response.resource).toEqual({ tableId: 't1', type: 'TABLE' });
    expect(response.request).toEqual({ projectId: 'p', datasetId: 'd1', tableId: 't1' });
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
