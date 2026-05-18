const JSON_SCHEMA_DRAFT_2020_12 = 'https://json-schema.org/draft/2020-12/schema';

export const jobsGetInputSchema = {
  $schema: JSON_SCHEMA_DRAFT_2020_12,
  title: 'bq-inspect jobs get input',
  type: 'object',
  required: ['jobs'],
  additionalProperties: false,
  properties: {
    jobs: {
      type: 'array',
      minItems: 1,
      items: {
        type: 'object',
        required: ['projectId', 'jobId'],
        additionalProperties: false,
        properties: {
          projectId: { type: 'string', minLength: 1 },
          location: { type: 'string', minLength: 1 },
          jobId: { type: 'string', minLength: 1 },
        },
      },
    },
    selector: {
      type: 'string',
      description:
        'Comma-separated job fields with optional nested blocks. Mutually exclusive with preset.',
    },
    preset: {
      enum: ['diagnostic'],
      description: 'Named selector preset. Mutually exclusive with selector.',
    },
    redaction: { enum: ['default', 'strict', 'none'] },
    failOnMissingField: { type: 'boolean' },
    impersonateServiceAccount: { type: 'string', minLength: 1 },
    impersonateDelegates: {
      type: 'array',
      items: { type: 'string', minLength: 1 },
    },
  },
  $defs: {
    selectorGrammar: {
      const: 'Comma-separated fields with optional nested blocks: field,parent{childA,childB}',
    },
    exampleSelectors: {
      type: 'object',
      additionalProperties: false,
      properties: {
        cost: {
          type: 'string',
          const: 'statistics{totalBytesProcessed,totalBytesBilled,reservation_id}',
        },
        statusAndFailure: {
          type: 'string',
          const: 'status{state,errorResult},errorResult',
        },
        slotsAndRuntime: {
          type: 'string',
          const: 'statistics{query{totalSlotMs,totalProcessingTimeMs}}',
        },
        queryPlan: {
          type: 'string',
          const: 'statistics{query{queryPlan}}',
        },
        governance: {
          type: 'string',
          const: 'configuration{labels},user_email',
        },
      },
    },
  },
} as const;

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
    allUsers: { type: 'boolean' },
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
