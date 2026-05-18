export interface JobRef {
  projectId: string;
  location?: string;
  jobId: string;
}

export type RedactionMode = 'default' | 'none' | 'strict';

export type BqInspectSchemaVersion = 'bq-inspect.v1';

export interface InspectJobRequest {
  jobs: JobRef[];
  selector?: string;
  redaction?: RedactionMode;
  failOnMissingField?: boolean;
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
    selector?: string;
    redaction: RedactionMode;
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
  };
}

export type BqInspectErrorCode =
  | 'BQINSPECT_API_RATE_LIMITED'
  | 'BQINSPECT_API_UNAVAILABLE'
  | 'BQINSPECT_FIELD_UNKNOWN'
  | 'BQINSPECT_INPUT_INVALID'
  | 'BQINSPECT_INTERNAL'
  | 'BQINSPECT_JOB_NOT_FOUND'
  | 'BQINSPECT_LOCATION_REQUIRED'
  | 'BQINSPECT_PERMISSION_DENIED'
  | 'BQINSPECT_SELECTOR_INVALID';

/** Serializable echo of job list filters for JSON output */
export interface JobListFiltersEcho {
  minSlotMs?: string;
  minBytesBilled?: string;
  state?: string;
  labels?: Record<string, string>;
  parentJobId?: string;
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
    location?: string;
    allUsers?: boolean;
    minCreationTime?: number;
    maxCreationTime?: number;
    pageToken?: string;
    maxResults?: number;
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
