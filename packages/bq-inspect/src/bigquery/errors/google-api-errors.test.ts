import { describe, expect, it } from 'vitest';

import { BqInspectFailure } from '../../core/shared/errors';

import {
  extractGoogleErrorMessage,
  mapGoogleErrorToBqInspectFailure,
  mapHttpStatusToErrorCode,
  resolveHttpStatus,
} from './google-api-errors';

describe('resolveHttpStatus', () => {
  it('reads numeric HTTP codes from error.code', () => {
    expect(resolveHttpStatus({ code: 404 })).toBe(404);
  });

  it('reads HTTP status from nested response.status', () => {
    expect(resolveHttpStatus({ response: { status: 403 } })).toBe(403);
  });

  it('parses stringified HTTP codes', () => {
    expect(resolveHttpStatus({ code: '429' })).toBe(429);
  });

  it('returns undefined when no HTTP status is present', () => {
    expect(resolveHttpStatus({ code: 'ENOTFOUND' })).toBeUndefined();
    expect(resolveHttpStatus(null)).toBeUndefined();
  });
});

describe('mapHttpStatusToErrorCode', () => {
  it.each([
    [401, 'BQINSPECT_PERMISSION_DENIED'],
    [403, 'BQINSPECT_PERMISSION_DENIED'],
    [404, 'BQINSPECT_JOB_NOT_FOUND'],
    [429, 'BQINSPECT_API_RATE_LIMITED'],
    [500, 'BQINSPECT_API_UNAVAILABLE'],
    [418, 'BQINSPECT_API_UNAVAILABLE'],
  ])('maps HTTP %i to %s', (status, code) => {
    expect(mapHttpStatusToErrorCode(status)).toBe(code);
  });
});

describe('extractGoogleErrorMessage', () => {
  it('prefers Error.message when present', () => {
    expect(extractGoogleErrorMessage(new Error('boom'))).toBe('boom');
  });

  it('falls back to a generic message for non-Errors', () => {
    expect(extractGoogleErrorMessage('x')).toBe('BigQuery request failed.');
  });

  it('reads message from plain objects', () => {
    expect(extractGoogleErrorMessage({ message: 'from object' })).toBe('from object');
  });
});

describe('mapGoogleErrorToBqInspectFailure', () => {
  it('maps HTTP errors to BqInspectFailure with source status', () => {
    const failure = mapGoogleErrorToBqInspectFailure(
      { code: 404, message: 'Missing job.' },
      'bigquery.jobs.get',
    );

    expect(failure).toBeInstanceOf(BqInspectFailure);
    expect(failure.details.code).toBe('BQINSPECT_JOB_NOT_FOUND');
    expect(failure.details.source).toEqual({ api: 'bigquery.jobs.get', status: 404 });
  });

  it('adds IAM hints for permission denied on catalog APIs', () => {
    const failure = mapGoogleErrorToBqInspectFailure(
      { code: 403, message: 'Denied.' },
      'bigquery.tables.get',
    );

    expect(failure.details.code).toBe('BQINSPECT_PERMISSION_DENIED');
    expect(failure.details.hint).toContain('metadataViewer');
    expect(failure.details.source).toEqual({ api: 'bigquery.tables.get', status: 403 });
  });

  it('adds location guidance for jobs.get 403 when job ref has no location', () => {
    const failure = mapGoogleErrorToBqInspectFailure(
      { code: 403, message: 'Access Denied.' },
      'bigquery.jobs.get',
      { jobRef: { projectId: 'p', jobId: 'j' } },
    );

    expect(failure.details.hint).toContain('Add location on each job ref');
  });

  it('adds location guidance for jobs.get 404 when job ref has no location', () => {
    const failure = mapGoogleErrorToBqInspectFailure(
      { code: 404, message: 'Not found: Job' },
      'bigquery.jobs.get',
      { jobRef: { projectId: 'p', jobId: 'j' } },
    );

    expect(failure.details.code).toBe('BQINSPECT_JOB_NOT_FOUND');
    expect(failure.details.hint).toContain('Add location on each job ref');
  });

  it('maps missing status to internal errors', () => {
    const failure = mapGoogleErrorToBqInspectFailure(new Error('network'));

    expect(failure.details.code).toBe('BQINSPECT_INTERNAL');
  });
});
