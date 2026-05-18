/* eslint-disable security/detect-non-literal-fs-filename -- fixture paths are resolved relative to this test file */
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { jobPresetSelectors } from '../core/presets/job-presets';
import { BqInspectFailure } from '../core/shared/errors';
import { FixtureJobClient } from '../test-support/fixture-job-client';

import { runJobsGet } from './jobs-get';

import type { InspectJobResponse } from '../core/shared/types';

describe('runJobsGet', () => {
  it('parses repeated --job-id values into multiple JobRefs', async () => {
    const fixturePath = path.join(__dirname, '..', 'fixtures', 'successful-query-job.json');
    const job = JSON.parse(readFileSync(fixturePath, 'utf8')) as Record<string, unknown>;
    const client = new FixtureJobClient(
      new Map([
        ['job_a', job],
        ['job_b', { ...job, id: 'job_b' }],
      ]),
    );

    const response = (await runJobsGet(
      ['--project', 'analytics-prod', '--job-id', 'job_a', '--job-id', 'job_b'],
      { client, toolVersion: '0.1.0' },
    )) as InspectJobResponse;

    expect(response.request.jobs).toEqual([
      { projectId: 'analytics-prod', jobId: 'job_a' },
      { projectId: 'analytics-prod', jobId: 'job_b' },
    ]);
  });

  it('rejects unsupported --format values', async () => {
    await expect(
      runJobsGet(['--project', 'analytics-prod', '--job-id', 'job_a', '--format', 'ndjson'], {
        client: new FixtureJobClient(new Map()),
        toolVersion: '0.1.0',
      }),
    ).rejects.toBeInstanceOf(BqInspectFailure);
  });

  it('requires --project', async () => {
    await expect(
      runJobsGet(['--job-id', 'job_a'], {
        client: new FixtureJobClient(new Map()),
        toolVersion: '0.1.0',
      }),
    ).rejects.toBeInstanceOf(BqInspectFailure);
  });

  it('applies --preset diagnostic as the selector string', async () => {
    const fixturePath = path.join(__dirname, '..', 'fixtures', 'successful-query-job.json');
    const job = JSON.parse(readFileSync(fixturePath, 'utf8')) as Record<string, unknown>;
    const client = new FixtureJobClient(new Map([['job_a', job]]));

    const response = (await runJobsGet(
      ['--project', 'analytics-prod', '--job-id', 'job_a', '--preset', 'diagnostic'],
      { client, toolVersion: '0.1.0' },
    )) as InspectJobResponse;

    expect(response.request.selector).toBe(jobPresetSelectors.diagnostic);
  });

  it('rejects --preset together with --select', async () => {
    await expect(
      runJobsGet(
        [
          '--project',
          'analytics-prod',
          '--job-id',
          'job_a',
          '--preset',
          'diagnostic',
          '--select',
          'id',
        ],
        { client: new FixtureJobClient(new Map()), toolVersion: '0.1.0' },
      ),
    ).rejects.toBeInstanceOf(BqInspectFailure);
  });

  it('rejects unknown --preset values', async () => {
    await expect(
      runJobsGet(['--project', 'analytics-prod', '--job-id', 'job_a', '--preset', 'nope'], {
        client: new FixtureJobClient(new Map()),
        toolVersion: '0.1.0',
      }),
    ).rejects.toBeInstanceOf(BqInspectFailure);
  });

  it('echoes impersonation flags on the response request envelope', async () => {
    const fixturePath = path.join(__dirname, '..', 'fixtures', 'successful-query-job.json');
    const job = JSON.parse(readFileSync(fixturePath, 'utf8')) as Record<string, unknown>;
    const client = new FixtureJobClient(new Map([['job_a', job]]));

    const response = (await runJobsGet(
      [
        '--project',
        'analytics-prod',
        '--job-id',
        'job_a',
        '--impersonate-service-account',
        'target@analytics-prod.iam.gserviceaccount.com',
        '--impersonate-delegate',
        'delegate@analytics-prod.iam.gserviceaccount.com',
      ],
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
