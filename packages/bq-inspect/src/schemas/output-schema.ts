const toolBlock = {
  type: 'object',
  required: ['name', 'version', 'readOnly'],
  additionalProperties: false,
  properties: {
    name: { const: 'bq-inspect' },
    version: { type: 'string', minLength: 1 },
    readOnly: { const: true },
  },
} as const;

const schemaVersionField = { const: 'bq-inspect.v1' } as const;

type JobViewConst = 'full' | 'impact' | 'lineage' | 'performance' | 'query' | 'summary';

function makeJobsViewOutputSchema(view: JobViewConst, title: string) {
  return {
    title,
    type: 'object',
    required: ['schemaVersion', 'tool', 'request', 'jobs', 'warnings', 'errors'],
    additionalProperties: false,
    properties: {
      schemaVersion: schemaVersionField,
      tool: toolBlock,
      request: {
        type: 'object',
        required: ['jobs', 'view'],
        additionalProperties: false,
        properties: {
          jobs: { type: 'array' },
          view: { const: view },
          impersonateServiceAccount: { type: 'string', minLength: 1 },
          impersonateDelegates: {
            type: 'array',
            items: { type: 'string', minLength: 1 },
          },
        },
      },
      jobs: {
        type: 'array',
        items: {
          type: 'object',
          required: ['jobRef', 'source', 'warnings', 'errors'],
          additionalProperties: false,
          properties: {
            jobRef: { type: 'object' },
            source: {
              type: 'object',
              required: ['api', 'fetchedAt'],
              additionalProperties: false,
              properties: {
                api: { const: 'bigquery.jobs.get' },
                fetchedAt: { type: 'string', minLength: 1 },
              },
            },
            job: true,
            warnings: { type: 'array' },
            errors: { type: 'array' },
          },
        },
      },
      warnings: { type: 'array' },
      errors: { type: 'array' },
    },
  } as const;
}

export const jobsGetOutputSchema = makeJobsViewOutputSchema('full', 'bq-inspect jobs get output');
export const jobsSummaryOutputSchema = makeJobsViewOutputSchema(
  'summary',
  'bq-inspect jobs summary output',
);
export const jobsQueryOutputSchema = makeJobsViewOutputSchema(
  'query',
  'bq-inspect jobs query output',
);
export const jobsPerformanceOutputSchema = makeJobsViewOutputSchema(
  'performance',
  'bq-inspect jobs performance output',
);
export const jobsLineageOutputSchema = makeJobsViewOutputSchema(
  'lineage',
  'bq-inspect jobs lineage output',
);
export const jobsImpactOutputSchema = makeJobsViewOutputSchema(
  'impact',
  'bq-inspect jobs impact output',
);

export const jobsListOutputSchema = {
  title: 'bq-inspect jobs list output',
  type: 'object',
  required: ['schemaVersion', 'tool', 'request', 'jobs', 'page', 'warnings', 'errors'],
  additionalProperties: false,
  properties: {
    schemaVersion: schemaVersionField,
    tool: toolBlock,
    request: {
      type: 'object',
      required: ['projectId', 'filters'],
      additionalProperties: true,
      properties: {
        projectId: { type: 'string', minLength: 1 },
        location: { type: 'string', minLength: 1 },
        allUsers: { type: 'boolean' },
        minCreationTime: { type: 'number' },
        maxCreationTime: { type: 'number' },
        pageToken: { type: 'string' },
        maxResults: { type: 'number' },
        filters: { type: 'object' },
        impersonateServiceAccount: { type: 'string', minLength: 1 },
        impersonateDelegates: {
          type: 'array',
          items: { type: 'string', minLength: 1 },
        },
      },
    },
    jobs: { type: 'array' },
    page: {
      type: 'object',
      additionalProperties: false,
      properties: {
        nextPageToken: { type: 'string' },
      },
    },
    warnings: { type: 'array' },
    errors: { type: 'array' },
  },
} as const;

export const catalogResourceOutputSchema = {
  title: 'bq-inspect catalog resource output',
  type: 'object',
  required: ['schemaVersion', 'tool', 'request', 'warnings', 'errors'],
  additionalProperties: false,
  properties: {
    schemaVersion: schemaVersionField,
    tool: toolBlock,
    request: {
      type: 'object',
      required: ['projectId', 'datasetId'],
      additionalProperties: true,
      properties: {
        projectId: { type: 'string', minLength: 1 },
        datasetId: { type: 'string', minLength: 1 },
        tableId: { type: 'string', minLength: 1 },
      },
    },
    resource: true,
    warnings: { type: 'array' },
    errors: { type: 'array' },
  },
} as const;

export const tablesListOutputSchema = {
  title: 'bq-inspect tables list output',
  type: 'object',
  required: ['schemaVersion', 'tool', 'request', 'tables', 'warnings', 'errors'],
  additionalProperties: false,
  properties: {
    schemaVersion: schemaVersionField,
    tool: toolBlock,
    request: {
      type: 'object',
      required: ['projectId', 'datasetId'],
      additionalProperties: false,
      properties: {
        projectId: { type: 'string', minLength: 1 },
        datasetId: { type: 'string', minLength: 1 },
      },
    },
    tables: { type: 'array' },
    warnings: { type: 'array' },
    errors: { type: 'array' },
  },
} as const;

export const outputSchema = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  title: 'bq-inspect command output (union)',
  oneOf: [
    jobsGetOutputSchema,
    jobsSummaryOutputSchema,
    jobsQueryOutputSchema,
    jobsPerformanceOutputSchema,
    jobsLineageOutputSchema,
    jobsImpactOutputSchema,
    jobsListOutputSchema,
    catalogResourceOutputSchema,
    tablesListOutputSchema,
  ],
} as const;
