import { parseSelector } from '../../selector/parse-selector';
import { applyProjection } from '../projection/project';
import { redactValue } from '../redaction/redact';
import { BqInspectFailure, createBqInspectError } from '../shared/errors';
import { normalizeJobRef } from '../shared/job-ref';

import type { BigQueryJobClient } from '../../bigquery/bigquery-job-client';
import type {
  BqInspectError,
  BqInspectSchemaVersion,
  BqInspectWarning,
  InspectedJob,
  InspectJobRequest,
  InspectJobResponse,
  JobRef,
  RedactionMode,
} from '../shared/types';

export interface InspectJobOptions {
  client: BigQueryJobClient;
  toolVersion: string;
  now?: () => Date;
}

const responseSchemaVersion: BqInspectSchemaVersion = 'bq-inspect.v1';
const jobsGetApi = 'bigquery.jobs.get' as const;

function buildRequestEcho(
  request: InspectJobRequest,
  redaction: RedactionMode,
): InspectJobResponse['request'] {
  return {
    jobs: request.jobs,
    ...(request.selector !== undefined ? { selector: request.selector } : {}),
    redaction,
    ...(request.impersonateServiceAccount !== undefined
      ? { impersonateServiceAccount: request.impersonateServiceAccount }
      : {}),
    ...(request.impersonateDelegates !== undefined && request.impersonateDelegates.length > 0
      ? { impersonateDelegates: request.impersonateDelegates }
      : {}),
  };
}

export async function inspectJobs(
  request: InspectJobRequest,
  options: InspectJobOptions,
): Promise<InspectJobResponse> {
  const now = options.now ?? (() => new Date());
  const redaction: RedactionMode = request.redaction ?? 'default';
  const globalWarnings: BqInspectWarning[] = [];

  const selectorParse = tryParseSelector(request.selector);

  if (selectorParse.errors.length > 0) {
    return {
      schemaVersion: responseSchemaVersion,
      tool: {
        name: 'bq-inspect',
        version: options.toolVersion,
        readOnly: true,
      },
      request: buildRequestEcho(request, redaction),
      jobs: [],
      warnings: globalWarnings,
      errors: selectorParse.errors,
    };
  }

  const inspectedJobs: InspectedJob[] = await Promise.all(
    request.jobs.map(async (inputRef) =>
      inspectOneJob({
        inputRef,
        client: options.client,
        now,
        selectorAst: selectorParse.ast,
        failOnMissingField: request.failOnMissingField === true,
        redaction,
      }),
    ),
  );

  for (const job of inspectedJobs) {
    globalWarnings.push(...job.warnings);
  }

  const errors = inspectedJobs.flatMap((job) => job.errors);

  return {
    schemaVersion: responseSchemaVersion,
    tool: {
      name: 'bq-inspect',
      version: options.toolVersion,
      readOnly: true,
    },
    request: buildRequestEcho(request, redaction),
    jobs: inspectedJobs,
    warnings: globalWarnings,
    errors,
  };
}

function tryParseSelector(selector: string | undefined): {
  ast: ReturnType<typeof parseSelector> | undefined;
  errors: BqInspectError[];
} {
  if (selector === undefined || selector.trim().length === 0) {
    return { ast: undefined, errors: [] };
  }

  try {
    return { ast: parseSelector(selector), errors: [] };
  } catch (error) {
    if (error instanceof BqInspectFailure) {
      return { ast: undefined, errors: [error.details] };
    }

    return {
      ast: undefined,
      errors: [
        createBqInspectError({
          code: 'BQINSPECT_INTERNAL',
          message: error instanceof Error ? error.message : 'Unexpected selector parse failure.',
        }),
      ],
    };
  }
}

interface InspectOneJobInput {
  inputRef: JobRef;
  client: BigQueryJobClient;
  now: () => Date;
  selectorAst: ReturnType<typeof parseSelector> | undefined;
  failOnMissingField: boolean;
  redaction: RedactionMode;
}

async function inspectOneJob(input: InspectOneJobInput): Promise<InspectedJob> {
  const warnings: BqInspectWarning[] = [];
  const errors: BqInspectError[] = [];
  const fetchedAt = input.now().toISOString();

  let jobRef: JobRef;

  try {
    jobRef = normalizeJobRef(input.inputRef);
  } catch (error) {
    return buildFailedInspection({
      error,
      jobRef: fallbackJobRef(input.inputRef),
      fetchedAt,
      warnings,
      errors,
      fallbackMessage: 'Unexpected job reference failure.',
    });
  }

  let job: unknown;

  try {
    job = await input.client.getJob(jobRef);
  } catch (error) {
    return buildFailedInspection({
      error,
      jobRef,
      fetchedAt,
      warnings,
      errors,
      fallbackMessage: 'Unexpected BigQuery client failure.',
    });
  }

  let projected: unknown = job;

  if (input.selectorAst !== undefined) {
    const projection = applyProjection(job, input.selectorAst);
    warnings.push(...projection.warnings);

    if (input.failOnMissingField) {
      for (const warning of projection.warnings) {
        if (warning.code === 'BQINSPECT_FIELD_MISSING') {
          errors.push(
            createBqInspectError({
              code: 'BQINSPECT_FIELD_UNKNOWN',
              message: `Missing selected field: ${warning.path ?? warning.message}`,
              hint: 'Fix the selector or omit --fail-on-missing-field.',
            }),
          );
        }
      }
    }

    projected = projection.value;
  }

  const redactedJob = redactValue(projected, input.redaction);

  return {
    jobRef,
    source: {
      api: jobsGetApi,
      fetchedAt,
    },
    job: redactedJob,
    warnings,
    errors,
  };
}

function buildFailedInspection(input: {
  error: unknown;
  jobRef: JobRef;
  fetchedAt: string;
  warnings: BqInspectWarning[];
  errors: BqInspectError[];
  fallbackMessage: string;
}): InspectedJob {
  if (input.error instanceof BqInspectFailure) {
    input.errors.push(input.error.details);
  } else {
    input.errors.push(
      createBqInspectError({
        code: 'BQINSPECT_INTERNAL',
        message: input.error instanceof Error ? input.error.message : input.fallbackMessage,
      }),
    );
  }

  return {
    jobRef: input.jobRef,
    source: {
      api: jobsGetApi,
      fetchedAt: input.fetchedAt,
    },
    warnings: input.warnings,
    errors: input.errors,
  };
}

function fallbackJobRef(job: JobRef): JobRef {
  const projectId = job.projectId.trim();
  const jobId = job.jobId.trim();
  const location = job.location?.trim();

  if (location === undefined || location.length === 0) {
    return { projectId, jobId };
  }

  return { projectId, location, jobId };
}
