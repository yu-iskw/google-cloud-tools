/* eslint-disable security/detect-non-literal-fs-filename -- fixture paths are resolved relative to this test file */
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { BqInspectFailure } from '../../core/shared/errors';
import { FixtureJobClient } from '../../test-support/fixture-job-client';

import { runJobsGet } from './get';

import type { InspectJobResponse } from '../../core/shared/types';

function jobsGetParams(body: Record<string, unknown>): string[] {
  return ['--params', JSON.stringify(body)];
}

describe('runJobsGet', () => {
  it('parses multiple jobs from params JSON', async () => {
    const fixturePath = path.join(__dirname, '..', '..', 'fixtures', 'successful-query-job.json');
    const job = JSON.parse(readFileSync(fixturePath, 'utf8')) as Record<string, unknown>;
    const client = new FixtureJobClient(
      new Map([
        ['job_a', job],
        ['job_b', { ...job, id: 'job_b' }],
      ]),
    );

    const response = (await runJobsGet(
      jobsGetParams({
        jobs: [
          { projectId: 'analytics-prod', jobId: 'job_a' },
          { projectId: 'analytics-prod', jobId: 'job_b' },
        ],
      }),
      { client, toolVersion: '0.1.0' },
    )) as InspectJobResponse;

    expect(response.request.jobs).toEqual([
      { projectId: 'analytics-prod', jobId: 'job_a' },
      { projectId: 'analytics-prod', jobId: 'job_b' },
    ]);
  });

  it('returns full job payload in the response', async () => {
    const fixturePath = path.join(__dirname, '..', '..', 'fixtures', 'successful-query-job.json');
    const job = JSON.parse(readFileSync(fixturePath, 'utf8')) as Record<string, unknown>;
    const client = new FixtureJobClient(new Map([['job_a', job]]));

    const response = (await runJobsGet(
      jobsGetParams({
        jobs: [{ projectId: 'analytics-prod', jobId: 'job_a' }],
      }),
      { client, toolVersion: '0.1.0' },
    )) as InspectJobResponse;

    const jobPayload = response.jobs[0]?.job as Record<string, unknown>;
    expect(jobPayload.id).toBe('analytics-prod:US.job_123');
    expect(jobPayload.statistics).toBeDefined();
    expect(jobPayload.configuration).toBeDefined();
    expect(response.request.view).toBe('full');
    expect(response.request).not.toHaveProperty('selector');
  });

  it('requires --params', async () => {
    await expect(
      runJobsGet([], {
        client: new FixtureJobClient(new Map()),
        toolVersion: '0.1.0',
      }),
    ).rejects.toBeInstanceOf(BqInspectFailure);
  });

  it('rejects unknown operational flags', async () => {
    await expect(
      runJobsGet(['--format', 'ndjson', '--params', '{}'], {
        client: new FixtureJobClient(new Map()),
        toolVersion: '0.1.0',
      }),
    ).rejects.toBeInstanceOf(BqInspectFailure);
  });

  it('rejects removed selector and preset params', async () => {
    await expect(
      runJobsGet(
        jobsGetParams({
          jobs: [{ projectId: 'analytics-prod', jobId: 'job_a' }],
          selector: 'id',
        }),
        { client: new FixtureJobClient(new Map()), toolVersion: '0.1.0' },
      ),
    ).rejects.toBeInstanceOf(BqInspectFailure);

    await expect(
      runJobsGet(
        jobsGetParams({
          jobs: [{ projectId: 'analytics-prod', jobId: 'job_a' }],
          preset: 'diagnostic',
        }),
        { client: new FixtureJobClient(new Map()), toolVersion: '0.1.0' },
      ),
    ).rejects.toBeInstanceOf(BqInspectFailure);
  });

  it('echoes impersonation fields on the response request envelope', async () => {
    const fixturePath = path.join(__dirname, '..', '..', 'fixtures', 'successful-query-job.json');
    const job = JSON.parse(readFileSync(fixturePath, 'utf8')) as Record<string, unknown>;
    const client = new FixtureJobClient(new Map([['job_a', job]]));

    const response = (await runJobsGet(
      jobsGetParams({
        jobs: [{ projectId: 'analytics-prod', jobId: 'job_a' }],
        impersonateServiceAccount: 'target@analytics-prod.iam.gserviceaccount.com',
        impersonateDelegates: ['delegate@analytics-prod.iam.gserviceaccount.com'],
      }),
      { client, toolVersion: '0.1.0' },
    )) as InspectJobResponse;

    expect(response.request.impersonateServiceAccount).toBe(
      'target@analytics-prod.iam.gserviceaccount.com',
    );
    expect(response.request.impersonateDelegates).toEqual([
      'delegate@analytics-prod.iam.gserviceaccount.com',
    ]);
  });
});
