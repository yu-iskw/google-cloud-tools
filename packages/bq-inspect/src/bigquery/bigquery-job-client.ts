import type { JobRef } from '../core/shared/types';

export interface DatasetRef {
  projectId: string;
  datasetId: string;
}

export interface TableRef extends DatasetRef {
  tableId: string;
}

export interface ListJobsRequest {
  projectId: string;
  location?: string;
  allUsers?: boolean;
  minCreationTime?: number;
  maxCreationTime?: number;
  pageToken?: string;
  maxResults?: number;
}

export interface ListJobsPage {
  jobs: unknown[];
  nextPageToken?: string;
}

export interface BigQueryInspectionClient {
  getJob(ref: JobRef): Promise<unknown>;
  listJobs(request: ListJobsRequest): Promise<ListJobsPage>;
  getDataset(ref: DatasetRef): Promise<unknown>;
  listTables(ref: DatasetRef): Promise<unknown[]>;
  getTable(ref: TableRef): Promise<unknown>;
}

export type BigQueryJobClient = Pick<BigQueryInspectionClient, 'getJob'>;
