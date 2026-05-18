import { parseArgs } from 'node:util';

import { listTablesMetadata } from '../core/catalog/catalog';

import {
  assertJsonCliFormat,
  createSdkInspectionClientFromCli,
  requireCliString,
} from './command-shared';
import { resolveSchemaFlag } from './schema-flags';

import type { BigQueryInspectionClient } from '../bigquery/bigquery-job-client';
import type { tablesListInputSchema } from '../schemas/input-schema';
import type { tablesListOutputSchema } from '../schemas/output-schema';

export interface TablesListCommandOptions {
  client?: BigQueryInspectionClient;
  toolVersion: string;
}

export async function runTablesList(
  argv: string[],
  commandOptions: TablesListCommandOptions,
): Promise<
  | Awaited<ReturnType<typeof listTablesMetadata>>
  | typeof tablesListInputSchema
  | typeof tablesListOutputSchema
> {
  const parsed = parseArgs({
    args: argv,
    options: {
      project: { type: 'string' },
      dataset: { type: 'string' },
      format: { type: 'string' },
      'impersonate-service-account': { type: 'string' },
      'impersonate-delegate': { type: 'string', multiple: true },
      'input-schema': { type: 'boolean' },
      'output-schema': { type: 'boolean' },
    },
  });

  const schemaPayload = resolveSchemaFlag('tables list', parsed.values);

  if (schemaPayload !== undefined) {
    return schemaPayload as typeof tablesListInputSchema | typeof tablesListOutputSchema;
  }

  assertJsonCliFormat(parsed.values.format);

  const projectId = requireCliString(parsed.values.project, '--project');
  const datasetId = requireCliString(parsed.values.dataset, '--dataset');

  const client = commandOptions.client ?? (await createSdkInspectionClientFromCli(parsed.values));

  return listTablesMetadata(
    { projectId, datasetId },
    { client, toolVersion: commandOptions.toolVersion },
  );
}
