import { parseOperationalArgv } from '../../cli/argv/operational-argv';
import { parseTablesGetInput } from '../../cli/input/input-parsers';
import { resolveParamsValue } from '../../cli/params/parse-params';
import { createInputFailure } from '../../core/shared/errors';
import { getTableMetadata } from '../../core/tables/get';
import { getCommandSchema } from '../../schemas/command-schemas';
import { createSdkInspectionClientFromInput } from '../command-shared';

import type { BigQueryInspectionClient } from '../../bigquery/port/inspection-client';
import type { ParsedCatalogInput } from '../../cli/input/input-parsers';
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
  const argvParsed = parseOperationalArgv(argv);

  if (argvParsed.kind === 'input-schema') {
    return getCommandSchema('tables get', 'input') as typeof tablesGetInputSchema;
  }

  if (argvParsed.kind === 'output-schema') {
    return getCommandSchema('tables get', 'output') as typeof catalogResourceOutputSchema;
  }

  const raw = await resolveParamsValue(argvParsed.params);
  const input = parseTablesGetInput(raw);

  return executeTablesGet(input, commandOptions);
}

async function executeTablesGet(
  input: ParsedCatalogInput,
  commandOptions: TablesGetCommandOptions,
): Promise<Awaited<ReturnType<typeof getTableMetadata>>> {
  const client =
    commandOptions.client ??
    (await createSdkInspectionClientFromInput({
      impersonateServiceAccount: input.impersonateServiceAccount,
      impersonateDelegates: input.impersonateDelegates,
    }));

  if (input.tableId === undefined) {
    throw createInputFailure('tableId is required.');
  }

  return getTableMetadata(
    {
      projectId: input.projectId,
      datasetId: input.datasetId,
      tableId: input.tableId,
    },
    { client, toolVersion: commandOptions.toolVersion },
  );
}
