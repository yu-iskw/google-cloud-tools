/* eslint-disable security/detect-non-literal-fs-filename -- fixture paths are resolved relative to this test file */
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { FixtureJobClient } from '../../test-support/fixture-job-client';

import { inspectJobs } from './inspect-jobs';

describe('inspectJobs', () => {
  it('produces the RFC envelope shape for a single job', async () => {
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
      redaction: 'default',
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

  it('applies selector projection and failOnMissingField errors', async () => {
    const fixturePath = path.join(__dirname, '..', '..', 'fixtures', 'successful-query-job.json');
    const job = JSON.parse(readFileSync(fixturePath, 'utf8')) as Record<string, unknown>;
    const client = new FixtureJobClient(new Map([['job_123', job]]));

    const response = await inspectJobs(
      {
        jobs: [{ projectId: 'analytics-prod', jobId: 'job_123' }],
        selector: 'id,missing',
        failOnMissingField: true,
      },
      { client, toolVersion: '0.1.0', now: () => new Date('2020-01-01T00:00:00.000Z') },
    );

    expect(response.jobs[0]?.warnings.some((w) => w.code === 'BQINSPECT_FIELD_MISSING')).toBe(true);
    expect(response.jobs[0]?.errors.some((e) => e.code === 'BQINSPECT_FIELD_UNKNOWN')).toBe(true);
  });
});
