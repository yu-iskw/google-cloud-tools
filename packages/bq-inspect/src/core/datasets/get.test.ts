import { describe, expect, it } from 'vitest';

import { BqInspectFailure, createBqInspectError } from '../shared/errors';

import { getDatasetMetadata } from './get';

import type { BigQueryInspectionClient } from '../../bigquery/port/inspection-client';

describe('getDatasetMetadata', () => {
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

  it('returns errors for dataset metadata failures', async () => {
    const client: Pick<BigQueryInspectionClient, 'getDataset'> = {
      async getDataset() {
        throw new BqInspectFailure(
          createBqInspectError({
            code: 'BQINSPECT_PERMISSION_DENIED',
            message: 'Denied.',
            source: { api: 'bigquery.datasets.get', status: 403 },
          }),
        );
      },
    };

    const response = await getDatasetMetadata(
      { projectId: 'p', datasetId: 'd1' },
      { client, toolVersion: '0.1.0' },
    );

    expect(response.resource).toBeUndefined();
    expect(response.errors[0]?.code).toBe('BQINSPECT_PERMISSION_DENIED');
  });
});
