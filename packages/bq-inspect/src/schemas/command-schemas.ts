import {
  datasetsGetInputSchema,
  jobsGetInputSchema,
  jobsImpactInputSchema,
  jobsLineageInputSchema,
  jobsListInputSchema,
  jobsPerformanceInputSchema,
  jobsQueryInputSchema,
  jobsSummaryInputSchema,
  tablesGetInputSchema,
  tablesListInputSchema,
} from './input-schema';
import {
  catalogResourceOutputSchema,
  jobsGetOutputSchema,
  jobsImpactOutputSchema,
  jobsLineageOutputSchema,
  jobsListOutputSchema,
  jobsPerformanceOutputSchema,
  jobsQueryOutputSchema,
  jobsSummaryOutputSchema,
  tablesListOutputSchema,
} from './output-schema';

export type CommandId =
  | 'datasets get'
  | 'jobs get'
  | 'jobs impact'
  | 'jobs lineage'
  | 'jobs list'
  | 'jobs performance'
  | 'jobs query'
  | 'jobs summary'
  | 'tables get'
  | 'tables list';

export type JobsViewCommandId = Extract<
  CommandId,
  'jobs get' | 'jobs impact' | 'jobs lineage' | 'jobs performance' | 'jobs query' | 'jobs summary'
>;

type SchemaKind = 'input' | 'output';

const commandSchemas: Record<`${CommandId}:${SchemaKind}`, unknown> = {
  'jobs get:input': jobsGetInputSchema,
  'jobs get:output': jobsGetOutputSchema,
  'jobs summary:input': jobsSummaryInputSchema,
  'jobs summary:output': jobsSummaryOutputSchema,
  'jobs query:input': jobsQueryInputSchema,
  'jobs query:output': jobsQueryOutputSchema,
  'jobs performance:input': jobsPerformanceInputSchema,
  'jobs performance:output': jobsPerformanceOutputSchema,
  'jobs lineage:input': jobsLineageInputSchema,
  'jobs lineage:output': jobsLineageOutputSchema,
  'jobs impact:input': jobsImpactInputSchema,
  'jobs impact:output': jobsImpactOutputSchema,
  'jobs list:input': jobsListInputSchema,
  'jobs list:output': jobsListOutputSchema,
  'datasets get:input': datasetsGetInputSchema,
  'datasets get:output': catalogResourceOutputSchema,
  'tables list:input': tablesListInputSchema,
  'tables list:output': tablesListOutputSchema,
  'tables get:input': tablesGetInputSchema,
  'tables get:output': catalogResourceOutputSchema,
};

export function getCommandSchema(command: CommandId, kind: SchemaKind): unknown {
  const key = `${command}:${kind}` as `${CommandId}:${SchemaKind}`;
  // eslint-disable-next-line security/detect-object-injection -- key is a typed CommandId:SchemaKind union
  const schema = commandSchemas[key];

  if (schema === undefined) {
    throw new Error(`Unhandled schema key: ${key}`);
  }

  return schema;
}
