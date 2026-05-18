import { parseArgs } from 'node:util';

import { getDatasetMetadata } from '../../core/catalog/catalog';
import {
  assertJsonCliFormat,
  createSdkInspectionClientFromCli,
  requireCliString,
} from '../command-shared';
import { resolveSchemaFlag } from '../schema-flags';

import type { BigQueryInspectionClient } from '../../bigquery/bigquery-job-client';
import type { datasetsGetInputSchema } from '../../schemas/input-schema';
import type { catalogResourceOutputSchema } from '../../schemas/output-schema';

export interface DatasetsGetCommandOptions {
  client?: BigQueryInspectionClient;
  toolVersion: string;
}

export async function runDatasetsGet(
  argv: string[],
  commandOptions: DatasetsGetCommandOptions,
): Promise<
  | Awaited<ReturnType<typeof getDatasetMetadata>>
  | typeof catalogResourceOutputSchema
  | typeof datasetsGetInputSchema
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

  const schemaPayload = resolveSchemaFlag('datasets get', parsed.values);

  if (schemaPayload !== undefined) {
    return schemaPayload as typeof catalogResourceOutputSchema | typeof datasetsGetInputSchema;
  }

  assertJsonCliFormat(parsed.values.format);

  const projectId = requireCliString(parsed.values.project, '--project');
  const datasetId = requireCliString(parsed.values.dataset, '--dataset');

  const client = commandOptions.client ?? (await createSdkInspectionClientFromCli(parsed.values));

  return getDatasetMetadata(
    { projectId, datasetId },
    { client, toolVersion: commandOptions.toolVersion },
  );
}
