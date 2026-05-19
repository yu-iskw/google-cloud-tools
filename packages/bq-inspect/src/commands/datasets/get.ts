import { parseOperationalArgv } from '../../cli/argv/operational-argv';
import { parseDatasetsGetInput } from '../../cli/input/input-parsers';
import { resolveParamsValue } from '../../cli/params/parse-params';
import { getDatasetMetadata } from '../../core/datasets/get';
import { getCommandSchema } from '../../schemas/command-schemas';
import { createSdkInspectionClientFromInput } from '../command-shared';

import type { BigQueryInspectionClient } from '../../bigquery/port/inspection-client';
import type { ParsedCatalogInput } from '../../cli/input/input-parsers';
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
  const argvParsed = parseOperationalArgv(argv);

  if (argvParsed.kind === 'input-schema') {
    return getCommandSchema('datasets get', 'input') as typeof datasetsGetInputSchema;
  }

  if (argvParsed.kind === 'output-schema') {
    return getCommandSchema('datasets get', 'output') as typeof catalogResourceOutputSchema;
  }

  const raw = await resolveParamsValue(argvParsed.params);
  const input = parseDatasetsGetInput(raw);

  return executeDatasetsGet(input, commandOptions);
}

async function executeDatasetsGet(
  input: ParsedCatalogInput,
  commandOptions: DatasetsGetCommandOptions,
): Promise<Awaited<ReturnType<typeof getDatasetMetadata>>> {
  const client =
    commandOptions.client ??
    (await createSdkInspectionClientFromInput({
      impersonateServiceAccount: input.impersonateServiceAccount,
      impersonateDelegates: input.impersonateDelegates,
    }));

  return getDatasetMetadata(
    { projectId: input.projectId, datasetId: input.datasetId },
    { client, toolVersion: commandOptions.toolVersion },
  );
}
