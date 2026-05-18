import type { ListJobsRequest } from '../../bigquery/client/job-client';
import type { JobFilters } from '../../core/jobs/filter';
import type { ImpersonationFields } from '../../core/shared/impersonation-fields';
import type { JobRef } from '../../core/shared/types';

export type { ImpersonationFields };

export type ParsedJobsViewInput = ImpersonationFields & {
  jobs: JobRef[];
};

export type ParsedJobsListInput = ImpersonationFields & {
  listRequest: ListJobsRequest;
  filters: JobFilters;
};

export type ParsedCatalogInput = ImpersonationFields & {
  projectId: string;
  datasetId: string;
  tableId?: string;
};
