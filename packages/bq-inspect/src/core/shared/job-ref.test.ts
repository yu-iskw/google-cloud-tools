import { describe, expect, it } from 'vitest';

import { BqInspectFailure } from './errors';
import { normalizeJobRef } from './job-ref';

describe('normalizeJobRef', () => {
  it('trims project, location, and job ID', () => {
    expect(
      normalizeJobRef({ projectId: ' analytics-prod ', location: ' US ', jobId: ' job_123 ' }),
    ).toEqual({ projectId: 'analytics-prod', location: 'US', jobId: 'job_123' });
  });

  it('omits blank locations after trimming', () => {
    expect(
      normalizeJobRef({ projectId: 'analytics-prod', location: ' ', jobId: 'job_123' }),
    ).toEqual({ projectId: 'analytics-prod', jobId: 'job_123' });
  });

  it('rejects blank project IDs with a typed non-retriable input failure', () => {
    expect(() => normalizeJobRef({ projectId: ' ', jobId: 'job_123' })).toThrow(BqInspectFailure);

    try {
      normalizeJobRef({ projectId: ' ', jobId: 'job_123' });
    } catch (error) {
      expect(error).toBeInstanceOf(BqInspectFailure);
      expect((error as BqInspectFailure).details).toMatchObject({
        code: 'BQINSPECT_INPUT_INVALID',
        message: 'Project ID is required.',
        retriable: false,
      });
    }
  });

  it('rejects blank job IDs with a typed non-retriable input failure', () => {
    expect(() => normalizeJobRef({ projectId: 'analytics-prod', jobId: ' ' })).toThrow(
      BqInspectFailure,
    );

    try {
      normalizeJobRef({ projectId: 'analytics-prod', jobId: ' ' });
    } catch (error) {
      expect(error).toBeInstanceOf(BqInspectFailure);
      expect((error as BqInspectFailure).details).toMatchObject({
        code: 'BQINSPECT_INPUT_INVALID',
        message: 'Job ID is required.',
        retriable: false,
      });
    }
  });
});
