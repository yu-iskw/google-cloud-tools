import { parseArgs } from 'node:util';

import { normalizeDelegateList, normalizeOptionalTrimmed } from '../../bigquery/create-auth-client';
import { inspectJobs } from '../../core/inspect/inspect-jobs';
import { resolveJobPreset } from '../../core/presets/job-presets';
import { BqInspectFailure, createBqInspectError } from '../../core/shared/errors';
import {
  assertJsonCliFormat,
  createSdkInspectionClientFromCli,
  requireCliString,
} from '../command-shared';
import { resolveSchemaFlag } from '../schema-flags';

import type { BigQueryJobClient } from '../../bigquery/bigquery-job-client';
import type { JobRef, RedactionMode } from '../../core/shared/types';
import type { jobsGetInputSchema } from '../../schemas/input-schema';
import type { jobsGetOutputSchema } from '../../schemas/output-schema';

export interface JobsGetCommandOptions {
  client?: BigQueryJobClient;
  toolVersion: string;
}

export async function runJobsGet(
  argv: string[],
  commandOptions: JobsGetCommandOptions,
): Promise<
  Awaited<ReturnType<typeof inspectJobs>> | typeof jobsGetInputSchema | typeof jobsGetOutputSchema
> {
  const parsed = parseArgs({
    args: argv,
    options: {
      project: { type: 'string' },
      location: { type: 'string' },
      'job-id': { type: 'string', multiple: true },
      select: { type: 'string' },
      preset: { type: 'string' },
      redact: { type: 'string' },
      'fail-on-missing-field': { type: 'boolean' },
      format: { type: 'string' },
      'impersonate-service-account': { type: 'string' },
      'impersonate-delegate': { type: 'string', multiple: true },
      'input-schema': { type: 'boolean' },
      'output-schema': { type: 'boolean' },
    },
  });

  const schemaPayload = resolveSchemaFlag('jobs get', parsed.values);

  if (schemaPayload !== undefined) {
    return schemaPayload as typeof jobsGetInputSchema | typeof jobsGetOutputSchema;
  }

  assertJsonCliFormat(parsed.values.format);

  const rawJobIds = parsed.values['job-id'];
  const jobIds = normalizeRepeatedOption(rawJobIds);

  if (jobIds.length === 0) {
    throw new BqInspectFailure(
      createBqInspectError({
        code: 'BQINSPECT_INPUT_INVALID',
        message: 'At least one --job-id is required.',
      }),
    );
  }

  const projectId = requireCliString(parsed.values.project, '--project');

  const jobs: JobRef[] = jobIds.map((jobId) => ({
    projectId,
    location: parsed.values.location,
    jobId,
  }));

  const impersonateServiceAccount = normalizeOptionalTrimmed(
    parsed.values['impersonate-service-account'],
  );
  const impersonateDelegates = normalizeDelegateList(parsed.values['impersonate-delegate']);

  const client = commandOptions.client ?? (await createSdkInspectionClientFromCli(parsed.values));

  const selector = resolveSelectorInput({
    select: parsed.values.select,
    preset: parsed.values.preset,
  });

  const inspectRequest = {
    jobs,
    ...(selector === undefined ? {} : { selector }),
    redaction: parseRedaction(parsed.values.redact),
    failOnMissingField: parsed.values['fail-on-missing-field'] === true,
    ...(impersonateServiceAccount === undefined
      ? {}
      : {
          impersonateServiceAccount,
          ...(impersonateDelegates.length > 0 ? { impersonateDelegates } : {}),
        }),
  };

  return inspectJobs(inspectRequest, { client, toolVersion: commandOptions.toolVersion });
}

function resolveSelectorInput(input: {
  select: string | undefined;
  preset: string | undefined;
}): string | undefined {
  const selectTrimmed =
    input.select === undefined || input.select.trim().length === 0
      ? undefined
      : input.select.trim();
  const presetTrimmed =
    input.preset === undefined || input.preset.trim().length === 0
      ? undefined
      : input.preset.trim();

  if (selectTrimmed !== undefined && presetTrimmed !== undefined) {
    throw new BqInspectFailure(
      createBqInspectError({
        code: 'BQINSPECT_INPUT_INVALID',
        message: 'Use either --select or --preset, not both.',
      }),
    );
  }

  if (presetTrimmed !== undefined) {
    const resolved = resolveJobPreset(presetTrimmed);

    if (resolved === undefined) {
      throw new BqInspectFailure(
        createBqInspectError({
          code: 'BQINSPECT_INPUT_INVALID',
          message: `Unknown --preset value: ${presetTrimmed}`,
        }),
      );
    }

    return resolved;
  }

  return selectTrimmed;
}

function normalizeRepeatedOption(value: string[] | string | undefined): string[] {
  if (value === undefined) {
    return [];
  }

  return Array.isArray(value) ? value : [value];
}

function parseRedaction(value: string | undefined): RedactionMode {
  if (value === undefined) {
    return 'default';
  }

  if (value === 'default' || value === 'strict' || value === 'none') {
    return value;
  }

  throw new BqInspectFailure(
    createBqInspectError({
      code: 'BQINSPECT_INPUT_INVALID',
      message: `Invalid --redact value: ${value}`,
    }),
  );
}
