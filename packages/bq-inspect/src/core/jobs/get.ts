import { BqInspectFailure, createBqInspectError } from '../shared/errors';
import { impersonationRequestFields } from '../shared/impersonation-fields';
import { normalizeJobRef } from '../shared/job-ref';

import { projectJob } from './project-job';

import type { BigQueryJobClient } from '../../bigquery/port/inspection-client';
import type {
  BqInspectError,
  BqInspectSchemaVersion,
  BqInspectWarning,
  InspectedJob,
  InspectJobRequest,
  InspectJobResponse,
  JobRef,
  JobView,
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
  view: JobView,
): InspectJobResponse['request'] {
  return {
    jobs: request.jobs,
    view,
    ...impersonationRequestFields(request),
  };
}

export async function inspectJobs(
  request: InspectJobRequest,
  options: InspectJobOptions,
): Promise<InspectJobResponse> {
  const now = options.now ?? (() => new Date());
  const view: JobView = request.view ?? 'summary';
  const globalWarnings: BqInspectWarning[] = [];

  const inspectedJobs: InspectedJob[] = await Promise.all(
    request.jobs.map(async (inputRef) =>
      inspectOneJob({
        inputRef,
        client: options.client,
        now,
        view,
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
    request: buildRequestEcho(request, view),
    jobs: inspectedJobs,
    warnings: globalWarnings,
    errors,
  };
}

interface InspectOneJobInput {
  inputRef: JobRef;
  client: BigQueryJobClient;
  now: () => Date;
  view: JobView;
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

  const projectedJob = projectJob(job, input.view);

  return {
    jobRef,
    source: {
      api: jobsGetApi,
      fetchedAt,
    },
    job: projectedJob,
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
