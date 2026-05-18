/* eslint-disable security/detect-non-literal-fs-filename -- fixture paths are resolved relative to this test file */
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { FixtureJobClient } from '../../test-support/fixture-job-client';
import { BqInspectFailure, createBqInspectError } from '../shared/errors';

import { inspectJobs } from './get';

import type { BigQueryJobClient } from '../../bigquery/port/inspection-client';

describe('inspectJobs', () => {
  it('produces the RFC envelope shape for a single job with summary view by default', async () => {
    const fixturePath = path.join(__dirname, '..', '..', 'fixtures', 'successful-query-job.json');
    const job = JSON.parse(readFileSync(fixturePath, 'utf8')) as Record<string, unknown>;
    const client = new FixtureJobClient(new Map([['job_123', job]]));
    const fixedNow = () => new Date('2020-01-01T00:00:00.000Z');

    const response = await inspectJobs(
      { jobs: [{ projectId: 'analytics-prod', location: 'US', jobId: 'job_123' }] },
      { client, toolVersion: '0.1.0', now: fixedNow },
    );

    expect(response.schemaVersion).toBe('bq-inspect.v1');
    expect(response.tool).toEqual({ name: 'bq-inspect', version: '0.1.0', readOnly: true });
    expect(response.request).toEqual({
      jobs: [{ projectId: 'analytics-prod', location: 'US', jobId: 'job_123' }],
      view: 'summary',
    });
    expect(response.jobs).toHaveLength(1);
    expect(response.jobs[0]?.jobRef).toEqual({
      projectId: 'analytics-prod',
      location: 'US',
      jobId: 'job_123',
    });
    expect(response.jobs[0]?.source).toEqual({
      api: 'bigquery.jobs.get',
      fetchedAt: '2020-01-01T00:00:00.000Z',
    });
    expect(response.jobs[0]?.errors).toEqual([]);
    expect(response.errors).toEqual([]);
    const jobPayload = response.jobs[0]?.job as Record<string, unknown>;
    expect(jobPayload.id).toBe('analytics-prod:US.job_123');
    expect(jobPayload.status).toBeDefined();
    expect(jobPayload.statistics).toBeDefined();
    expect(jobPayload.configuration).toBeUndefined();
  });

  it('supports multiple job IDs as independent results', async () => {
    const fixturePath = path.join(__dirname, '..', '..', 'fixtures', 'successful-query-job.json');
    const jobA = JSON.parse(readFileSync(fixturePath, 'utf8')) as Record<string, unknown>;
    const jobB = { ...jobA, id: 'job_b' };
    const client = new FixtureJobClient(
      new Map([
        ['job_a', jobA],
        ['job_b', jobB],
      ]),
    );

    const response = await inspectJobs(
      {
        jobs: [
          { projectId: 'analytics-prod', jobId: 'job_a' },
          { projectId: 'analytics-prod', jobId: 'job_b' },
        ],
      },
      { client, toolVersion: '0.1.0', now: () => new Date('2020-01-01T00:00:00.000Z') },
    );

    expect(response.jobs).toHaveLength(2);
    expect(response.jobs[0]?.jobRef.jobId).toBe('job_a');
    expect(response.jobs[1]?.jobRef.jobId).toBe('job_b');
  });

  it('returns full job payload when view is full', async () => {
    const fixturePath = path.join(__dirname, '..', '..', 'fixtures', 'successful-query-job.json');
    const job = JSON.parse(readFileSync(fixturePath, 'utf8')) as Record<string, unknown>;
    const client = new FixtureJobClient(new Map([['job_123', job]]));

    const response = await inspectJobs(
      {
        jobs: [{ projectId: 'analytics-prod', jobId: 'job_123' }],
        view: 'full',
      },
      { client, toolVersion: '0.1.0', now: () => new Date('2020-01-01T00:00:00.000Z') },
    );

    const fullJob = response.jobs[0]?.job as Record<string, unknown>;
    expect(fullJob.configuration).toBeDefined();
    expect(fullJob.user_email).toBe('alice@example.com');
    expect(response.request.view).toBe('full');
  });

  it('records validation errors for invalid job references', async () => {
    const client = new FixtureJobClient(new Map());

    const response = await inspectJobs(
      { jobs: [{ projectId: ' ', jobId: 'job_123' }] },
      { client, toolVersion: '0.1.0', now: () => new Date('2020-01-01T00:00:00.000Z') },
    );

    expect(response.jobs[0]?.errors[0]?.code).toBe('BQINSPECT_INPUT_INVALID');
    expect(response.errors).toHaveLength(1);
  });

  it('uses fallback job ref with location when validation fails', async () => {
    const client = new FixtureJobClient(new Map());

    const response = await inspectJobs(
      { jobs: [{ projectId: ' ', location: ' US ', jobId: ' job_123 ' }] },
      { client, toolVersion: '0.1.0', now: () => new Date('2020-01-01T00:00:00.000Z') },
    );

    expect(response.jobs[0]?.jobRef).toEqual({
      projectId: '',
      location: 'US',
      jobId: 'job_123',
    });
    expect(response.jobs[0]?.errors[0]?.code).toBe('BQINSPECT_INPUT_INVALID');
    expect(response.errors).toHaveLength(1);
  });

  it('records BqInspectFailure from getJob', async () => {
    const client: BigQueryJobClient = {
      async getJob() {
        throw new BqInspectFailure(
          createBqInspectError({
            code: 'BQINSPECT_JOB_NOT_FOUND',
            message: 'Missing.',
            source: { api: 'bigquery.jobs.get', status: 404 },
          }),
        );
      },
    };

    const response = await inspectJobs(
      { jobs: [{ projectId: 'p', jobId: 'missing' }] },
      { client, toolVersion: '0.1.0', now: () => new Date('2020-01-01T00:00:00.000Z') },
    );

    expect(response.jobs[0]?.errors[0]?.code).toBe('BQINSPECT_JOB_NOT_FOUND');
  });

  it('maps unexpected getJob errors to internal errors', async () => {
    const client: BigQueryJobClient = {
      async getJob() {
        throw new Error('network');
      },
    };

    const response = await inspectJobs(
      { jobs: [{ projectId: 'p', jobId: 'j1' }] },
      { client, toolVersion: '0.1.0', now: () => new Date('2020-01-01T00:00:00.000Z') },
    );

    expect(response.jobs[0]?.errors[0]?.code).toBe('BQINSPECT_INTERNAL');
    expect(response.jobs[0]?.errors[0]?.message).toBe('network');
  });

  it('includes impersonation fields in request echo', async () => {
    const fixturePath = path.join(__dirname, '..', '..', 'fixtures', 'successful-query-job.json');
    const job = JSON.parse(readFileSync(fixturePath, 'utf8')) as Record<string, unknown>;
    const client = new FixtureJobClient(new Map([['job_123', job]]));

    const response = await inspectJobs(
      {
        jobs: [{ projectId: 'p', jobId: 'job_123' }],
        impersonateServiceAccount: 'sa@p.iam.gserviceaccount.com',
        impersonateDelegates: ['d@p.iam.gserviceaccount.com'],
      },
      { client, toolVersion: '0.1.0', now: () => new Date('2020-01-01T00:00:00.000Z') },
    );

    expect(response.request).toMatchObject({
      impersonateServiceAccount: 'sa@p.iam.gserviceaccount.com',
      impersonateDelegates: ['d@p.iam.gserviceaccount.com'],
    });
  });
});
