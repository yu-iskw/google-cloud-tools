import { parseArgs } from 'node:util';

/* eslint-disable security/detect-object-injection -- label keys come from validated KEY=VALUE CLI pairs */

import { normalizeDelegateList, normalizeOptionalTrimmed } from '../bigquery/create-auth-client';
import { listJobs } from '../core/list/list-jobs';
import { BqInspectFailure, createBqInspectError } from '../core/shared/errors';

import {
  assertJsonCliFormat,
  createSdkInspectionClientFromCli,
  requireCliString,
} from './command-shared';
import { resolveSchemaFlag } from './schema-flags';

import type { BigQueryInspectionClient, ListJobsRequest } from '../bigquery/bigquery-job-client';
import type { JobFilters } from '../core/list/filter-jobs';
import type { jobsListInputSchema } from '../schemas/input-schema';
import type { jobsListOutputSchema } from '../schemas/output-schema';

export interface JobsListCommandOptions {
  client?: BigQueryInspectionClient;
  toolVersion: string;
}

export async function runJobsList(
  argv: string[],
  commandOptions: JobsListCommandOptions,
): Promise<
  Awaited<ReturnType<typeof listJobs>> | typeof jobsListInputSchema | typeof jobsListOutputSchema
> {
  const parsed = parseArgs({
    args: argv,
    options: {
      project: { type: 'string' },
      location: { type: 'string' },
      'min-creation-time': { type: 'string' },
      'max-creation-time': { type: 'string' },
      'page-token': { type: 'string' },
      'max-results': { type: 'string' },
      'all-users': { type: 'boolean' },
      'min-slot-ms': { type: 'string' },
      'min-bytes-billed': { type: 'string' },
      state: { type: 'string' },
      label: { type: 'string', multiple: true },
      'parent-job-id': { type: 'string' },
      format: { type: 'string' },
      'impersonate-service-account': { type: 'string' },
      'impersonate-delegate': { type: 'string', multiple: true },
      'input-schema': { type: 'boolean' },
      'output-schema': { type: 'boolean' },
    },
  });

  const schemaPayload = resolveSchemaFlag('jobs list', parsed.values);

  if (schemaPayload !== undefined) {
    return schemaPayload as typeof jobsListInputSchema | typeof jobsListOutputSchema;
  }

  assertJsonCliFormat(parsed.values.format);

  const projectId = requireCliString(parsed.values.project, '--project');

  const minCreationTime = parseOptionalEpochMs(
    parsed.values['min-creation-time'],
    '--min-creation-time',
  );
  const maxCreationTime = parseOptionalEpochMs(
    parsed.values['max-creation-time'],
    '--max-creation-time',
  );

  const maxResults = parseOptionalPositiveInt(parsed.values['max-results'], '--max-results');
  const pageToken = normalizeOptionalTrimmed(parsed.values['page-token']);

  const listRequest: ListJobsRequest = {
    projectId,
    ...(parsed.values.location === undefined || parsed.values.location.trim().length === 0
      ? {}
      : { location: parsed.values.location.trim() }),
    ...(parsed.values['all-users'] === true ? { allUsers: true } : {}),
    ...(minCreationTime === undefined ? {} : { minCreationTime }),
    ...(maxCreationTime === undefined ? {} : { maxCreationTime }),
    ...(pageToken === undefined ? {} : { pageToken }),
    ...(maxResults === undefined ? {} : { maxResults }),
  };

  const filters = buildJobFilters(parsed.values);

  const impersonateServiceAccount = normalizeOptionalTrimmed(
    parsed.values['impersonate-service-account'],
  );
  const impersonateDelegates = normalizeDelegateList(parsed.values['impersonate-delegate']);

  const client = commandOptions.client ?? (await createSdkInspectionClientFromCli(parsed.values));

  return listJobs({
    client,
    toolVersion: commandOptions.toolVersion,
    listRequest,
    filters,
    ...(impersonateServiceAccount === undefined
      ? {}
      : {
          impersonateServiceAccount,
          ...(impersonateDelegates.length > 0 ? { impersonateDelegates } : {}),
        }),
  });
}

function parseOptionalEpochMs(value: string | undefined, flag: string): number | undefined {
  if (value === undefined || value.trim().length === 0) {
    return undefined;
  }

  const epochMs = Date.parse(value.trim());

  if (Number.isNaN(epochMs)) {
    throw new BqInspectFailure(
      createBqInspectError({
        code: 'BQINSPECT_INPUT_INVALID',
        message: `${flag} must be a valid ISO-8601 date-time string.`,
      }),
    );
  }

  return epochMs;
}

function parseOptionalPositiveInt(value: string | undefined, flag: string): number | undefined {
  if (value === undefined || value.trim().length === 0) {
    return undefined;
  }

  const n = Number.parseInt(value.trim(), 10);

  if (!Number.isFinite(n) || n < 1) {
    throw new BqInspectFailure(
      createBqInspectError({
        code: 'BQINSPECT_INPUT_INVALID',
        message: `${flag} must be a positive integer.`,
      }),
    );
  }

  return n;
}

function buildJobFilters(values: {
  'min-slot-ms'?: string;
  'min-bytes-billed'?: string;
  state?: string;
  label?: string[] | string;
  'parent-job-id'?: string;
}): JobFilters {
  const minSlotMsRaw = normalizeOptionalTrimmed(values['min-slot-ms']);
  const minBytesBilledRaw = normalizeOptionalTrimmed(values['min-bytes-billed']);
  const state = normalizeOptionalTrimmed(values.state);
  const parentJobId = normalizeOptionalTrimmed(values['parent-job-id']);

  let minSlotMs: bigint | undefined;

  if (minSlotMsRaw !== undefined) {
    try {
      minSlotMs = BigInt(minSlotMsRaw);
    } catch {
      throw new BqInspectFailure(
        createBqInspectError({
          code: 'BQINSPECT_INPUT_INVALID',
          message: '--min-slot-ms must be an integer.',
        }),
      );
    }
  }

  let minBytesBilled: bigint | undefined;

  if (minBytesBilledRaw !== undefined) {
    try {
      minBytesBilled = BigInt(minBytesBilledRaw);
    } catch {
      throw new BqInspectFailure(
        createBqInspectError({
          code: 'BQINSPECT_INPUT_INVALID',
          message: '--min-bytes-billed must be an integer.',
        }),
      );
    }
  }

  const labels = parseLabelOptions(values.label);

  return {
    ...(minSlotMs === undefined ? {} : { minSlotMs }),
    ...(minBytesBilled === undefined ? {} : { minBytesBilled }),
    ...(state === undefined ? {} : { state }),
    ...(labels === undefined ? {} : { labels }),
    ...(parentJobId === undefined ? {} : { parentJobId }),
  };
}

function parseLabelOptions(raw: string[] | string | undefined): Record<string, string> | undefined {
  if (raw === undefined) {
    return undefined;
  }

  const entries = Array.isArray(raw) ? raw : [raw];
  const out: Record<string, string> = {};

  for (const entry of entries) {
    const trimmed = entry.trim();

    if (trimmed.length === 0) {
      continue;
    }

    const eq = trimmed.indexOf('=');

    if (eq <= 0 || eq === trimmed.length - 1) {
      throw new BqInspectFailure(
        createBqInspectError({
          code: 'BQINSPECT_INPUT_INVALID',
          message: `Invalid --label value: ${trimmed}. Expected KEY=VALUE.`,
        }),
      );
    }

    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();

    if (key.length === 0) {
      throw new BqInspectFailure(
        createBqInspectError({
          code: 'BQINSPECT_INPUT_INVALID',
          message: `Invalid --label value: ${trimmed}. Expected KEY=VALUE.`,
        }),
      );
    }

    out[key] = value;
  }

  return Object.keys(out).length > 0 ? out : undefined;
}
