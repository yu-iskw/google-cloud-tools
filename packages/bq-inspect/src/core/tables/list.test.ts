import { describe, expect, it } from 'vitest';

import { BqInspectFailure, createBqInspectError } from '../shared/errors';

import { listTablesMetadata } from './list';

import type { BigQueryInspectionClient } from '../../bigquery/port/inspection-client';

describe('listTablesMetadata', () => {
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

  it('returns errors for list tables failures', async () => {
    const client: Pick<BigQueryInspectionClient, 'listTables'> = {
      async listTables() {
        throw new BqInspectFailure(
          createBqInspectError({
            code: 'BQINSPECT_PERMISSION_DENIED',
            message: 'Denied.',
            source: { api: 'bigquery.tables.list', status: 403 },
          }),
        );
      },
    };

    const response = await listTablesMetadata(
      { projectId: 'p', datasetId: 'd1' },
      { client, toolVersion: '0.1.0' },
    );

    expect(response.tables).toEqual([]);
    expect(response.errors[0]?.code).toBe('BQINSPECT_PERMISSION_DENIED');
  });

  it('rethrows non-BqInspectFailure errors', async () => {
    const client: Pick<BigQueryInspectionClient, 'listTables'> = {
      async listTables() {
        throw new Error('boom');
      },
    };

    await expect(
      listTablesMetadata({ projectId: 'p', datasetId: 'd1' }, { client, toolVersion: '0.1.0' }),
    ).rejects.toThrow('boom');
  });
});
