import { describe, expect, it } from 'vitest';

import { BqInspectFailure, createBqInspectError, normalizeJobRef } from './index';

import type { InspectJobRequest, InspectJobResponse, JobRef, RedactionMode } from './index';

describe('public exports', () => {
  it('exports job reference validation and typed error helpers', () => {
    const ref: JobRef = { projectId: ' analytics-prod ', jobId: ' job_123 ' };

    expect(normalizeJobRef(ref)).toEqual({ projectId: 'analytics-prod', jobId: 'job_123' });
    expect(
      new BqInspectFailure(
        createBqInspectError({ code: 'BQINSPECT_INPUT_INVALID', message: 'Invalid input.' }),
      ),
    ).toBeInstanceOf(Error);
  });

  it('exports request and response contract types', () => {
    const redaction: RedactionMode = 'default';
    const request: InspectJobRequest = {
      jobs: [{ projectId: 'analytics-prod', jobId: 'job_123' }],
      redaction,
    };
    const response: InspectJobResponse = {
      schemaVersion: 'bq-inspect.v1',
      tool: {
        name: 'bq-inspect',
        version: '0.1.0',
        readOnly: true,
      },
      request: {
        jobs: request.jobs,
        redaction,
      },
      jobs: [],
      warnings: [],
      errors: [],
    };

    expect(response.request.jobs).toEqual(request.jobs);
  });
});
