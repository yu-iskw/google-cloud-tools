const JSON_SCHEMA_DRAFT_2020_12 = 'https://json-schema.org/draft/2020-12/schema';

const jobsViewInputProperties = {
  jobs: {
    type: 'array',
    minItems: 1,
    items: {
      type: 'object',
      required: ['projectId', 'jobId'],
      additionalProperties: false,
      properties: {
        projectId: { type: 'string', minLength: 1 },
        location: {
          type: 'string',
          minLength: 1,
          description:
            'BigQuery location for the job (for example US or EU). Omit when the API does not require it.',
        },
        jobId: { type: 'string', minLength: 1 },
      },
    },
  },
  impersonateServiceAccount: { type: 'string', minLength: 1 },
  impersonateDelegates: {
    type: 'array',
    items: { type: 'string', minLength: 1 },
  },
} as const;

function makeJobsViewInputSchema(title: string) {
  return {
    $schema: JSON_SCHEMA_DRAFT_2020_12,
    title,
    type: 'object',
    required: ['jobs'],
    additionalProperties: false,
    properties: jobsViewInputProperties,
  } as const;
}

export const jobsGetInputSchema = makeJobsViewInputSchema('bq-inspect jobs get input');
export const jobsSummaryInputSchema = makeJobsViewInputSchema('bq-inspect jobs summary input');
export const jobsQueryInputSchema = makeJobsViewInputSchema('bq-inspect jobs query input');
export const jobsPerformanceInputSchema = makeJobsViewInputSchema(
  'bq-inspect jobs performance input',
);

export const jobsListInputSchema = {
  $schema: JSON_SCHEMA_DRAFT_2020_12,
  title: 'bq-inspect jobs list input',
  type: 'object',
  required: ['projectId'],
  additionalProperties: false,
  properties: {
    projectId: { type: 'string', minLength: 1 },
    location: { type: 'string', minLength: 1 },
    minCreationTime: { type: 'string', format: 'date-time' },
    maxCreationTime: { type: 'string', format: 'date-time' },
    pageToken: { type: 'string', minLength: 1 },
    maxResults: { type: 'integer', minimum: 1 },
    allUsers: {
      type: 'boolean',
      description:
        'When true, list jobs from all users in the project (requires permission to list all users’ jobs).',
    },
    minSlotMs: { type: 'string', pattern: '^[0-9]+$' },
    minBytesBilled: { type: 'string', pattern: '^[0-9]+$' },
    state: { type: 'string', minLength: 1 },
    labels: { type: 'object', additionalProperties: { type: 'string' } },
    parentJobId: { type: 'string', minLength: 1 },
    impersonateServiceAccount: { type: 'string', minLength: 1 },
    impersonateDelegates: {
      type: 'array',
      items: { type: 'string', minLength: 1 },
    },
  },
} as const;

export const datasetsGetInputSchema = {
  $schema: JSON_SCHEMA_DRAFT_2020_12,
  title: 'bq-inspect datasets get input',
  type: 'object',
  required: ['projectId', 'datasetId'],
  additionalProperties: false,
  properties: {
    projectId: { type: 'string', minLength: 1 },
    datasetId: { type: 'string', minLength: 1 },
    impersonateServiceAccount: { type: 'string', minLength: 1 },
    impersonateDelegates: {
      type: 'array',
      items: { type: 'string', minLength: 1 },
    },
  },
} as const;

export const tablesListInputSchema = {
  $schema: JSON_SCHEMA_DRAFT_2020_12,
  title: 'bq-inspect tables list input',
  type: 'object',
  required: ['projectId', 'datasetId'],
  additionalProperties: false,
  properties: {
    projectId: { type: 'string', minLength: 1 },
    datasetId: { type: 'string', minLength: 1 },
    impersonateServiceAccount: { type: 'string', minLength: 1 },
    impersonateDelegates: {
      type: 'array',
      items: { type: 'string', minLength: 1 },
    },
  },
} as const;

export const tablesGetInputSchema = {
  $schema: JSON_SCHEMA_DRAFT_2020_12,
  title: 'bq-inspect tables get input',
  type: 'object',
  required: ['projectId', 'datasetId', 'tableId'],
  additionalProperties: false,
  properties: {
    projectId: { type: 'string', minLength: 1 },
    datasetId: { type: 'string', minLength: 1 },
    tableId: { type: 'string', minLength: 1 },
    impersonateServiceAccount: { type: 'string', minLength: 1 },
    impersonateDelegates: {
      type: 'array',
      items: { type: 'string', minLength: 1 },
    },
  },
} as const;
