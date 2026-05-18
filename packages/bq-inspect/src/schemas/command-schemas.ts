import {
  datasetsGetInputSchema,
  jobsGetInputSchema,
  jobsListInputSchema,
  tablesGetInputSchema,
  tablesListInputSchema,
} from './input-schema';
import {
  catalogResourceOutputSchema,
  jobsGetOutputSchema,
  jobsListOutputSchema,
  tablesListOutputSchema,
} from './output-schema';

export type CommandId = 'datasets get' | 'jobs get' | 'jobs list' | 'tables get' | 'tables list';

type SchemaKind = 'input' | 'output';

export function getCommandSchema(command: CommandId, kind: SchemaKind): unknown {
  const key = `${command}:${kind}`;

  switch (key) {
    case 'jobs get:input':
      return jobsGetInputSchema;
    case 'jobs get:output':
      return jobsGetOutputSchema;
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
