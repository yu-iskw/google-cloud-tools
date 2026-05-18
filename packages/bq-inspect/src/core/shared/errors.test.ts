import { describe, expect, it } from 'vitest';

import { BqInspectFailure, createBqInspectError, getExitCode } from './errors';

import type { BqInspectError, BqInspectErrorCode } from './types';

const exitCodeCases: ReadonlyArray<[BqInspectErrorCode, number]> = [
  ['BQINSPECT_INPUT_INVALID', 2],
  ['BQINSPECT_PERMISSION_DENIED', 3],
  ['BQINSPECT_JOB_NOT_FOUND', 4],
  ['BQINSPECT_LOCATION_REQUIRED', 2],
  ['BQINSPECT_API_RATE_LIMITED', 5],
  ['BQINSPECT_API_UNAVAILABLE', 5],
  ['BQINSPECT_INTERNAL', 1],
];

describe('getExitCode', () => {
  it.each(exitCodeCases)('maps %s to exit code %i', (code, exitCode) => {
    expect(getExitCode(errorWithCode(code))).toBe(exitCode);
  });
});

describe('BqInspectFailure', () => {
  it('serializes only structured error details', () => {
    const failure = new BqInspectFailure(
      createBqInspectError({
        code: 'BQINSPECT_JOB_NOT_FOUND',
        message: 'Job was not found.',
        hint: 'Check the job ID and location.',
        source: { api: 'bigquery.jobs.get', status: 404 },
      }),
    );

    const serializedFailure = JSON.stringify(failure);

    expect(JSON.parse(serializedFailure) as unknown).toEqual({
      code: 'BQINSPECT_JOB_NOT_FOUND',
      message: 'Job was not found.',
      hint: 'Check the job ID and location.',
      retriable: false,
      source: { api: 'bigquery.jobs.get', status: 404 },
    });
    expect(serializedFailure).not.toContain('stack');
  });

  it('creates non-retriable input validation errors', () => {
    expect(
      createBqInspectError({
        code: 'BQINSPECT_INPUT_INVALID',
        message: 'Project ID is required.',
      }),
    ).toEqual({
      code: 'BQINSPECT_INPUT_INVALID',
      message: 'Project ID is required.',
      retriable: false,
    });
  });

  it('creates retriable API availability errors by default', () => {
    expect(
      createBqInspectError({
        code: 'BQINSPECT_API_UNAVAILABLE',
        message: 'BigQuery is unavailable.',
      }),
    ).toEqual({
      code: 'BQINSPECT_API_UNAVAILABLE',
      message: 'BigQuery is unavailable.',
      retriable: true,
    });
  });
});

function errorWithCode(code: BqInspectErrorCode): BqInspectError {
  return {
    code,
    message: code,
    retriable: false,
  };
}
