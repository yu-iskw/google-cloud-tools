import { parseOperationalArgv } from '../../cli/argv/operational-argv';
import { parseTablesListInput } from '../../cli/input/input-parsers';
import { resolveParamsValue } from '../../cli/params/parse-params';
import { listTablesMetadata } from '../../core/tables/list';
import { getCommandSchema } from '../../schemas/command-schemas';
import { createSdkInspectionClientFromInput } from '../command-shared';

import type { BigQueryInspectionClient } from '../../bigquery/port/inspection-client';
import type { ParsedCatalogInput } from '../../cli/input/input-parsers';
import type { tablesListInputSchema } from '../../schemas/input-schema';
import type { tablesListOutputSchema } from '../../schemas/output-schema';

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
  const argvParsed = parseOperationalArgv(argv);

  if (argvParsed.kind === 'input-schema') {
    return getCommandSchema('tables list', 'input') as typeof tablesListInputSchema;
  }

  if (argvParsed.kind === 'output-schema') {
    return getCommandSchema('tables list', 'output') as typeof tablesListOutputSchema;
  }

  const raw = await resolveParamsValue(argvParsed.params);
  const input = parseTablesListInput(raw);

  return executeTablesList(input, commandOptions);
}

async function executeTablesList(
  input: ParsedCatalogInput,
  commandOptions: TablesListCommandOptions,
): Promise<Awaited<ReturnType<typeof listTablesMetadata>>> {
  const client =
    commandOptions.client ??
    (await createSdkInspectionClientFromInput({
      impersonateServiceAccount: input.impersonateServiceAccount,
      impersonateDelegates: input.impersonateDelegates,
    }));

  return listTablesMetadata(
    { projectId: input.projectId, datasetId: input.datasetId },
    { client, toolVersion: commandOptions.toolVersion },
  );
}
