export const selectorSchemaJob = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  title: 'bq-inspect selector schema (BigQuery Job resource)',
  type: 'object',
  required: ['selectorGrammar', 'exampleSelectors'],
  additionalProperties: false,
  properties: {
    selectorGrammar: {
      type: 'string',
      const: 'Comma-separated fields with optional nested blocks: field,parent{childA,childB}',
    },
    exampleSelectors: {
      type: 'object',
      additionalProperties: false,
      required: ['cost', 'statusAndFailure', 'slotsAndRuntime', 'queryPlan', 'governance'],
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
