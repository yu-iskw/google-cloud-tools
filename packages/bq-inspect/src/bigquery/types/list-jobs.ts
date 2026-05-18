/** Parameters forwarded to BigQuery jobs.list (REST query params only). */
export interface ListJobsRequest {
  projectId: string;
  allUsers?: boolean;
  minCreationTime?: number;
  maxCreationTime?: number;
  pageToken?: string;
  maxResults?: number;
  /** Maps to jobs.list stateFilter (DONE, PENDING, RUNNING). */
  state?: string;
  /** Maps to jobs.list parentJobId (child jobs of this parent). */
  parentJobId?: string;
}

export interface ListJobsPage {
  jobs: unknown[];
  nextPageToken?: string;
}
