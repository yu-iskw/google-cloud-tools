import { describe, expect, it } from 'vitest';

import { BqInspectFailure } from '../../core/shared/errors';

import {
  parseDatasetsGetInput,
  parseJobsGetInput,
  parseJobsListInput,
  parseTablesGetInput,
  parseTablesListInput,
} from './input-parsers';

describe('parseJobsGetInput', () => {
  it('parses jobs with optional location', () => {
    const input = parseJobsGetInput({
      jobs: [{ projectId: 'p', jobId: 'a', location: 'US' }],
    });

    expect(input.jobs).toEqual([{ projectId: 'p', jobId: 'a', location: 'US' }]);
  });

  it('rejects removed redaction field', () => {
    expect(() =>
      parseJobsGetInput({
        jobs: [{ projectId: 'p', jobId: 'a' }],
        redaction: 'strict',
      }),
    ).toThrow(BqInspectFailure);
  });

  it('rejects removed selector and preset fields', () => {
    expect(() =>
      parseJobsGetInput({
        jobs: [{ projectId: 'p', jobId: 'a' }],
        selector: 'id',
      }),
    ).toThrow(BqInspectFailure);

    expect(() =>
      parseJobsGetInput({
        jobs: [{ projectId: 'p', jobId: 'a' }],
        preset: 'diagnostic',
      }),
    ).toThrow(BqInspectFailure);
  });

  it('rejects unknown keys', () => {
    expect(() =>
      parseJobsGetInput({
        jobs: [{ projectId: 'p', jobId: 'a' }],
        projectId: 'p',
      }),
    ).toThrow(BqInspectFailure);
  });
});

describe('parseJobsListInput', () => {
  it('parses API list request and post-list filters', () => {
    const input = parseJobsListInput({
      projectId: 'p',
      allUsers: true,
      minCreationTime: '2026-05-17T00:00:00.000Z',
      state: 'DONE',
      parentJobId: 'parent_1',
      minSlotMs: '60000',
      labels: { env: 'prod' },
    });

    expect(input.listRequest).toEqual({
      projectId: 'p',
      allUsers: true,
      minCreationTime: Date.parse('2026-05-17T00:00:00.000Z'),
      state: 'DONE',
      parentJobId: 'parent_1',
    });
    expect(input.filters.minSlotMs).toBe(60_000n);
    expect(input.filters.labels).toEqual({ env: 'prod' });
  });

  it('rejects location on jobs list (not a jobs.list API parameter)', () => {
    expect(() =>
      parseJobsListInput({
        projectId: 'p',
        location: 'EU',
      }),
    ).toThrow(BqInspectFailure);
  });
});

describe('parseDatasetsGetInput', () => {
  it('parses catalog identifiers', () => {
    expect(parseDatasetsGetInput({ projectId: 'p', datasetId: 'd' })).toEqual({
      projectId: 'p',
      datasetId: 'd',
    });
  });
});

describe('parseTablesListInput', () => {
  it('matches datasets get shape', () => {
    expect(parseTablesListInput({ projectId: 'p', datasetId: 'd' })).toEqual({
      projectId: 'p',
      datasetId: 'd',
    });
  });
});

describe('parseTablesGetInput', () => {
  it('requires tableId', () => {
    expect(parseTablesGetInput({ projectId: 'p', datasetId: 'd', tableId: 't' })).toEqual({
      projectId: 'p',
      datasetId: 'd',
      tableId: 't',
    });
  });

  it('rejects missing tableId', () => {
    expect(() => parseTablesGetInput({ projectId: 'p', datasetId: 'd' })).toThrow(BqInspectFailure);
  });
});
