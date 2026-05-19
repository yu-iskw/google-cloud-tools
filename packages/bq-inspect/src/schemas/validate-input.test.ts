import { describe, expect, it } from 'vitest';

import { BqInspectFailure } from '../core/shared/errors';

import { validateInput } from './validate-input';

describe('validateInput', () => {
  it('accepts valid jobs get params', () => {
    const obj = validateInput('jobs get', {
      jobs: [{ projectId: 'p', jobId: 'j' }],
    });

    expect(obj.jobs).toHaveLength(1);
  });

  it('rejects non-object params', () => {
    expect(() => validateInput('jobs get', null)).toThrow(BqInspectFailure);
    expect(() => validateInput('jobs get', [])).toThrow(BqInspectFailure);
  });

  it('rejects empty jobs array', () => {
    expect(() => validateInput('jobs get', { jobs: [] })).toThrow(BqInspectFailure);
  });

  it('rejects unknown properties', () => {
    expect(() =>
      validateInput('jobs get', {
        jobs: [{ projectId: 'p', jobId: 'j' }],
        projectId: 'p',
      }),
    ).toThrow(BqInspectFailure);

    expect(() =>
      validateInput('jobs get', {
        jobs: [{ projectId: 'p', jobId: 'j' }],
        redaction: 'default',
      }),
    ).toThrow(BqInspectFailure);
  });

  it('rejects invalid date-time on jobs list', () => {
    expect(() =>
      validateInput('jobs list', {
        projectId: 'p',
        minCreationTime: 'not-a-date',
      }),
    ).toThrow(BqInspectFailure);
  });

  it('rejects invalid minSlotMs pattern', () => {
    expect(() =>
      validateInput('jobs list', {
        projectId: 'p',
        minSlotMs: 'abc',
      }),
    ).toThrow(BqInspectFailure);
  });

  it('includes schemaErrors on failure', () => {
    try {
      validateInput('jobs get', { jobs: [] });
      expect.fail('expected throw');
    } catch (error: unknown) {
      expect(error).toBeInstanceOf(BqInspectFailure);
      const failure = error as BqInspectFailure;
      expect(failure.details.source?.schemaErrors?.length).toBeGreaterThan(0);
    }
  });

  it('requires tableId for tables get', () => {
    expect(() =>
      validateInput('tables get', {
        projectId: 'p',
        datasetId: 'd',
      }),
    ).toThrow(BqInspectFailure);
  });
});
