import { describe, expect, it } from 'vitest';

import { hintForApiError } from './api-error-hints';

describe('hintForApiError', () => {
  it('returns IAM hint for permission denied on jobs APIs', () => {
    const hint = hintForApiError('BQINSPECT_PERMISSION_DENIED', 'bigquery.jobs.get');

    expect(hint).toContain('resourceViewer');
  });

  it('appends location guidance when jobs.get fails without location on the job ref', () => {
    const hint = hintForApiError('BQINSPECT_PERMISSION_DENIED', 'bigquery.jobs.get', {
      jobRef: { projectId: 'p', jobId: 'j' },
    });

    expect(hint).toContain('resourceViewer');
    expect(hint).toContain('Add location on each job ref');
  });

  it('appends location guidance for job not found without location on the job ref', () => {
    const hint = hintForApiError('BQINSPECT_JOB_NOT_FOUND', 'bigquery.jobs.get', {
      jobRef: { projectId: 'p', jobId: 'j' },
    });

    expect(hint).toContain('Add location on each job ref');
  });

  it('does not append location guidance when location is set', () => {
    const hint = hintForApiError('BQINSPECT_PERMISSION_DENIED', 'bigquery.jobs.get', {
      jobRef: { projectId: 'p', jobId: 'j', location: 'US' },
    });

    expect(hint).toBe(
      'Grant roles/bigquery.resourceViewer or a custom role with jobs.get/jobs.list.',
    );
  });

  it('returns undefined for non-permission errors without job context', () => {
    expect(hintForApiError('BQINSPECT_API_RATE_LIMITED', 'bigquery.jobs.get')).toBeUndefined();
  });
});
