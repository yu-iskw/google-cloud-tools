import { createInputFailure } from './errors';

import type { JobRef } from './types';

export function normalizeJobRef(input: JobRef): JobRef {
  const projectId = input.projectId.trim();
  const jobId = input.jobId.trim();
  const location = input.location?.trim();

  if (projectId.length === 0) {
    throw createInputFailure('Project ID is required.');
  }

  if (jobId.length === 0) {
    throw createInputFailure('Job ID is required.');
  }

  return location === undefined || location.length === 0
    ? { projectId, jobId }
    : { projectId, location, jobId };
}
