import type {
  BigQueryInspectionClient,
  BigQueryJobClient,
  DatasetRef,
  ListJobsPage,
  ListJobsRequest,
  TableRef,
} from '../bigquery/bigquery-job-client';
import type { JobRef } from '../core/shared/types';

export interface FixtureBigQueryInput {
  jobsById?: ReadonlyMap<string, unknown>;
  listJobsPage?: ListJobsPage;
  datasetsByKey?: ReadonlyMap<string, unknown>;
  tablesListByKey?: ReadonlyMap<string, unknown[]>;
  tablesByKey?: ReadonlyMap<string, unknown>;
}

function datasetKey(ref: DatasetRef): string {
  return `${ref.projectId}:${ref.datasetId}`;
}

function tableKey(ref: TableRef): string {
  return `${ref.projectId}:${ref.datasetId}:${ref.tableId}`;
}

export class FixtureBigQueryClient implements BigQueryInspectionClient {
  public constructor(private readonly input: FixtureBigQueryInput) {}

  public async getJob(ref: JobRef): Promise<unknown> {
    const job = this.input.jobsById?.get(ref.jobId);

    if (job === undefined) {
      throw new Error(`Fixture job not found: ${ref.jobId}`);
    }

    return job;
  }

  public async listJobs(request: ListJobsRequest): Promise<ListJobsPage> {
    void request;

    return this.input.listJobsPage ?? { jobs: [] };
  }

  public async getDataset(ref: DatasetRef): Promise<unknown> {
    const key = datasetKey(ref);
    const dataset = this.input.datasetsByKey?.get(key);

    if (dataset === undefined) {
      throw new Error(`Fixture dataset not found: ${key}`);
    }

    return dataset;
  }

  public async listTables(ref: DatasetRef): Promise<unknown[]> {
    const key = datasetKey(ref);
    const tables = this.input.tablesListByKey?.get(key);

    if (tables === undefined) {
      throw new Error(`Fixture tables list not found: ${key}`);
    }

    return tables;
  }

  public async getTable(ref: TableRef): Promise<unknown> {
    const key = tableKey(ref);
    const table = this.input.tablesByKey?.get(key);

    if (table === undefined) {
      throw new Error(`Fixture table not found: ${key}`);
    }

    return table;
  }
}

export class FixtureJobClient implements BigQueryJobClient {
  private readonly inner: FixtureBigQueryClient;

  public constructor(jobsById: ReadonlyMap<string, unknown>) {
    this.inner = new FixtureBigQueryClient({ jobsById });
  }

  public async getJob(ref: JobRef): Promise<unknown> {
    return this.inner.getJob(ref);
  }
}
