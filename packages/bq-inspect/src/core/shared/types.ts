export interface JobRef {
  projectId: string;
  location?: string;
  jobId: string;
}

export type JobView = 'full' | 'impact' | 'lineage' | 'performance' | 'query' | 'summary';

export type BqInspectSchemaVersion = 'bq-inspect.v1';

export interface InspectJobRequest {
  jobs: JobRef[];
  view?: JobView;
  schemaVersion?: BqInspectSchemaVersion;
  impersonateServiceAccount?: string;
  impersonateDelegates?: string[];
}

export interface InspectJobResponse {
  schemaVersion: BqInspectSchemaVersion;
  tool: {
    name: 'bq-inspect';
    version: string;
    readOnly: true;
  };
  request: {
    jobs: JobRef[];
    view: JobView;
    impersonateServiceAccount?: string;
    impersonateDelegates?: string[];
  };
  jobs: InspectedJob[];
  warnings: BqInspectWarning[];
  errors: BqInspectError[];
}

export interface InspectedJob {
  jobRef: JobRef;
  source: {
    api: 'bigquery.jobs.get';
    fetchedAt: string;
  };
  job?: unknown;
  warnings: BqInspectWarning[];
  errors: BqInspectError[];
}

export interface BqInspectWarning {
  code: string;
  message: string;
  path?: string;
}

export interface BqInspectError {
  code: BqInspectErrorCode;
  message: string;
  hint?: string;
  retriable: boolean;
  source?: {
    api?: string;
    status?: number;
    schemaErrors?: { path: string; message: string }[];
  };
}

export type BqInspectErrorCode =
  | 'BQINSPECT_API_RATE_LIMITED'
  | 'BQINSPECT_API_UNAVAILABLE'
  | 'BQINSPECT_INPUT_INVALID'
  | 'BQINSPECT_INTERNAL'
  | 'BQINSPECT_JOB_NOT_FOUND'
  | 'BQINSPECT_LOCATION_REQUIRED'
  | 'BQINSPECT_PERMISSION_DENIED';

/** Serializable echo of post-list filters (applied client-side after jobs.list). */
export interface JobListFiltersEcho {
  minSlotMs?: string;
  minBytesBilled?: string;
  labels?: Record<string, string>;
}

export interface ListJobsResponse {
  schemaVersion: BqInspectSchemaVersion;
  tool: {
    name: 'bq-inspect';
    version: string;
    readOnly: true;
  };
  request: {
    projectId: string;
    allUsers?: boolean;
    minCreationTime?: number;
    maxCreationTime?: number;
    pageToken?: string;
    maxResults?: number;
    state?: string;
    parentJobId?: string;
    filters: JobListFiltersEcho;
    impersonateServiceAccount?: string;
    impersonateDelegates?: string[];
  };
  jobs: unknown[];
  page: { nextPageToken?: string };
  warnings: BqInspectWarning[];
  errors: BqInspectError[];
}

export interface CatalogResourceResponse {
  schemaVersion: BqInspectSchemaVersion;
  tool: {
    name: 'bq-inspect';
    version: string;
    readOnly: true;
  };
  request: Record<string, string>;
  resource?: unknown;
  warnings: BqInspectWarning[];
  errors: BqInspectError[];
}

export interface TablesListResponse {
  schemaVersion: BqInspectSchemaVersion;
  tool: {
    name: 'bq-inspect';
    version: string;
    readOnly: true;
  };
  request: { projectId: string; datasetId: string };
  tables: unknown[];
  warnings: BqInspectWarning[];
  errors: BqInspectError[];
}
