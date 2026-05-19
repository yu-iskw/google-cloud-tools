import type { JobRef } from '../../core/shared/types';
import type { ListJobsPage, ListJobsRequest } from '../types/list-jobs';
import type { DatasetRef, TableRef } from '../types/refs';

export type { DatasetRef, ListJobsPage, ListJobsRequest, TableRef };

export interface BigQueryInspectionClient {
  getJob(ref: JobRef): Promise<unknown>;
  listJobs(request: ListJobsRequest): Promise<ListJobsPage>;
  getDataset(ref: DatasetRef): Promise<unknown>;
  listTables(ref: DatasetRef): Promise<unknown[]>;
  getTable(ref: TableRef): Promise<unknown>;
}

export type BigQueryJobClient = Pick<BigQueryInspectionClient, 'getJob'>;
