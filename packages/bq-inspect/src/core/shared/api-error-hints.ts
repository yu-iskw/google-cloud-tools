import { iamHintForApi } from './iam-hints';

import type { BqInspectErrorCode, JobRef } from './types';

export interface ApiErrorHintContext {
  jobRef?: JobRef;
}

const missingJobLocationHint =
  'Add location on each job ref (use the same region as in jobs.list output). Without location, jobs.get often returns 403 Access Denied instead of a clear not-found error.';

const jobsGetPermissionDeniedWithLocationHint =
  'Confirm projectId and jobId from jobs.list output. BigQuery may return Access Denied for a non-existent or inaccessible job even when location is set, not only for IAM gaps.';

function isJobLocationMissing(jobRef: JobRef | undefined): boolean {
  const location = jobRef?.location?.trim();

  return location === undefined || location.length === 0;
}

export function hintForApiError(
  code: BqInspectErrorCode,
  api: string,
  context?: ApiErrorHintContext,
): string | undefined {
  const parts: string[] = [];
  const iamHint = code === 'BQINSPECT_PERMISSION_DENIED' ? iamHintForApi(api) : undefined;

  if (iamHint !== undefined) {
    parts.push(iamHint);
  }

  if (
    api === 'bigquery.jobs.get' &&
    isJobLocationMissing(context?.jobRef) &&
    (code === 'BQINSPECT_PERMISSION_DENIED' || code === 'BQINSPECT_JOB_NOT_FOUND')
  ) {
    parts.push(missingJobLocationHint);
  }

  if (
    api === 'bigquery.jobs.get' &&
    code === 'BQINSPECT_PERMISSION_DENIED' &&
    !isJobLocationMissing(context?.jobRef)
  ) {
    parts.push(jobsGetPermissionDeniedWithLocationHint);
  }

  if (parts.length === 0) {
    return undefined;
  }

  return parts.join(' ');
}
