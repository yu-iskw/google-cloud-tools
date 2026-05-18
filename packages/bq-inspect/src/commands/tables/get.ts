import { parseArgs } from 'node:util';

import { getTableMetadata } from '../../core/catalog/catalog';
import {
  assertJsonCliFormat,
  createSdkInspectionClientFromCli,
  requireCliString,
} from '../command-shared';
import { resolveSchemaFlag } from '../schema-flags';

import type { BigQueryInspectionClient } from '../../bigquery/bigquery-job-client';
import type { tablesGetInputSchema } from '../../schemas/input-schema';
import type { catalogResourceOutputSchema } from '../../schemas/output-schema';

export interface TablesGetCommandOptions {
  client?: BigQueryInspectionClient;
  toolVersion: string;
}

export async function runTablesGet(
  argv: string[],
  commandOptions: TablesGetCommandOptions,
): Promise<
  | Awaited<ReturnType<typeof getTableMetadata>>
  | typeof catalogResourceOutputSchema
  | typeof tablesGetInputSchema
> {
  const parsed = parseArgs({
    args: argv,
    options: {
      project: { type: 'string' },
      dataset: { type: 'string' },
      table: { type: 'string' },
      format: { type: 'string' },
      'impersonate-service-account': { type: 'string' },
      'impersonate-delegate': { type: 'string', multiple: true },
      'input-schema': { type: 'boolean' },
      'output-schema': { type: 'boolean' },
    },
  });

  const schemaPayload = resolveSchemaFlag('tables get', parsed.values);

  if (schemaPayload !== undefined) {
    return schemaPayload as typeof catalogResourceOutputSchema | typeof tablesGetInputSchema;
  }

  assertJsonCliFormat(parsed.values.format);

  const projectId = requireCliString(parsed.values.project, '--project');
  const datasetId = requireCliString(parsed.values.dataset, '--dataset');
  const tableId = requireCliString(parsed.values.table, '--table');

  const client = commandOptions.client ?? (await createSdkInspectionClientFromCli(parsed.values));

  return getTableMetadata(
    { projectId, datasetId, tableId },
    { client, toolVersion: commandOptions.toolVersion },
  );
}
