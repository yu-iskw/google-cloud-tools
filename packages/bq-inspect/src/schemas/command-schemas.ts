import {
  datasetsGetInputSchema,
  jobsGetInputSchema,
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
  jobsListOutputSchema,
  jobsPerformanceOutputSchema,
  jobsQueryOutputSchema,
  jobsSummaryOutputSchema,
  tablesListOutputSchema,
} from './output-schema';

export type CommandId =
  | 'datasets get'
  | 'jobs get'
  | 'jobs list'
  | 'jobs performance'
  | 'jobs query'
  | 'jobs summary'
  | 'tables get'
  | 'tables list';

export type JobsViewCommandId = Extract<
  CommandId,
  'jobs get' | 'jobs performance' | 'jobs query' | 'jobs summary'
>;

type SchemaKind = 'input' | 'output';

export function getCommandSchema(command: CommandId, kind: SchemaKind): unknown {
  const key = `${command}:${kind}`;

  switch (key) {
    case 'jobs get:input':
      return jobsGetInputSchema;
    case 'jobs get:output':
      return jobsGetOutputSchema;
    case 'jobs summary:input':
      return jobsSummaryInputSchema;
    case 'jobs summary:output':
      return jobsSummaryOutputSchema;
    case 'jobs query:input':
      return jobsQueryInputSchema;
    case 'jobs query:output':
      return jobsQueryOutputSchema;
    case 'jobs performance:input':
      return jobsPerformanceInputSchema;
    case 'jobs performance:output':
      return jobsPerformanceOutputSchema;
    case 'jobs list:input':
      return jobsListInputSchema;
    case 'jobs list:output':
      return jobsListOutputSchema;
    case 'datasets get:input':
      return datasetsGetInputSchema;
    case 'datasets get:output':
      return catalogResourceOutputSchema;
    case 'tables list:input':
      return tablesListInputSchema;
    case 'tables list:output':
      return tablesListOutputSchema;
    case 'tables get:input':
      return tablesGetInputSchema;
    case 'tables get:output':
      return catalogResourceOutputSchema;
    default:
      throw new Error(`Unhandled schema key: ${key}`);
  }
}
