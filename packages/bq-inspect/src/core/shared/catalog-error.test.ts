import { describe, expect, it } from 'vitest';

import { catalogErrorEnvelope } from './catalog-error';
import { BqInspectFailure, createBqInspectError } from './errors';

describe('catalogErrorEnvelope', () => {
  const tool = { name: 'bq-inspect' as const, version: '0.1.0', readOnly: true as const };
  const schemaVersion = 'bq-inspect.v1' as const;

  it('maps BqInspectFailure to errors array', () => {
    const failure = new BqInspectFailure(
      createBqInspectError({
        code: 'BQINSPECT_PERMISSION_DENIED',
        message: 'Denied.',
        source: { api: 'bigquery.datasets.get', status: 403 },
      }),
    );

    const envelope = catalogErrorEnvelope(schemaVersion, tool, 'p', 'd1', undefined, failure);

    expect(envelope.errors).toHaveLength(1);
    expect(envelope.errors[0]?.code).toBe('BQINSPECT_PERMISSION_DENIED');
    expect(envelope.request).toEqual({ projectId: 'p', datasetId: 'd1' });
    expect(envelope.resource).toBeUndefined();
  });

  it('includes tableId in request when provided', () => {
    const failure = new BqInspectFailure(
      createBqInspectError({
        code: 'BQINSPECT_JOB_NOT_FOUND',
        message: 'Missing.',
        source: { api: 'bigquery.tables.get', status: 404 },
      }),
    );

    const envelope = catalogErrorEnvelope(schemaVersion, tool, 'p', 'd1', 't1', failure);

    expect(envelope.request).toEqual({ projectId: 'p', datasetId: 'd1', tableId: 't1' });
  });

  it('rethrows non-BqInspectFailure errors', () => {
    expect(() =>
      catalogErrorEnvelope(schemaVersion, tool, 'p', 'd1', undefined, new Error('boom')),
    ).toThrow('boom');
  });
});
