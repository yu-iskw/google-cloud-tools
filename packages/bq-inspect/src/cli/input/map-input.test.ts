import { describe, expect, it } from 'vitest';

import { mapCatalogInput, mapJobsListInput, mapJobsViewInput } from './map-input';

describe('mapJobsViewInput', () => {
  it('normalizes job refs', () => {
    expect(
      mapJobsViewInput({
        jobs: [{ projectId: ' p ', jobId: 'j', location: 'US' }],
      }),
    ).toEqual({
      jobs: [{ projectId: 'p', jobId: 'j', location: 'US' }],
    });
  });

  it('maps impersonation fields', () => {
    expect(
      mapJobsViewInput({
        jobs: [{ projectId: 'p', jobId: 'j' }],
        impersonateServiceAccount: ' sa@x.com ',
        impersonateDelegates: [' d@x.com ', ''],
      }),
    ).toEqual({
      jobs: [{ projectId: 'p', jobId: 'j' }],
      impersonateServiceAccount: 'sa@x.com',
      impersonateDelegates: ['d@x.com'],
    });
  });

  it('drops empty impersonateDelegates after normalization', () => {
    expect(
      mapJobsViewInput({
        jobs: [{ projectId: 'p', jobId: 'j' }],
        impersonateDelegates: ['', '  '],
      }),
    ).toEqual({ jobs: [{ projectId: 'p', jobId: 'j' }] });
  });
});

describe('mapJobsListInput', () => {
  it('maps optional list request and filter fields', () => {
    const input = mapJobsListInput({
      projectId: ' p ',
      maxCreationTime: '2026-05-18T00:00:00.000Z',
      pageToken: ' tok ',
      maxResults: 10,
      minBytesBilled: '1000',
      state: ' DONE ',
      parentJobId: ' parent ',
    });

    expect(input.listRequest).toEqual({
      projectId: 'p',
      maxCreationTime: Date.parse('2026-05-18T00:00:00.000Z'),
      pageToken: 'tok',
      maxResults: 10,
    });
    expect(input.filters).toEqual({
      minBytesBilled: 1000n,
      state: 'DONE',
      parentJobId: 'parent',
    });
  });
});

describe('mapCatalogInput', () => {
  it('trims catalog identifiers and optional tableId', () => {
    expect(mapCatalogInput({ projectId: ' p ', datasetId: ' d ', tableId: ' t ' })).toEqual({
      projectId: 'p',
      datasetId: 'd',
      tableId: 't',
    });
  });
});
