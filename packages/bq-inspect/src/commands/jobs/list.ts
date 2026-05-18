import { parseOperationalArgv } from '../../cli/argv/operational-argv';
import { parseJobsListInput } from '../../cli/input/input-parsers';
import { resolveParamsValue } from '../../cli/params/parse-params';
import { listJobs } from '../../core/jobs/list';
import { getCommandSchema } from '../../schemas/command-schemas';
import { createSdkInspectionClientFromInput } from '../command-shared';

import type { BigQueryInspectionClient } from '../../bigquery/client/job-client';
import type { ParsedJobsListInput } from '../../cli/input/input-parsers';
import type { jobsListInputSchema } from '../../schemas/input-schema';
import type { jobsListOutputSchema } from '../../schemas/output-schema';

export interface JobsListCommandOptions {
  client?: BigQueryInspectionClient;
  toolVersion: string;
}

export async function runJobsList(
  argv: string[],
  commandOptions: JobsListCommandOptions,
): Promise<
  Awaited<ReturnType<typeof listJobs>> | typeof jobsListInputSchema | typeof jobsListOutputSchema
> {
  const argvParsed = parseOperationalArgv(argv);

  if (argvParsed.kind === 'input-schema') {
    return getCommandSchema('jobs list', 'input') as typeof jobsListInputSchema;
  }

  if (argvParsed.kind === 'output-schema') {
    return getCommandSchema('jobs list', 'output') as typeof jobsListOutputSchema;
  }

  const raw = await resolveParamsValue(argvParsed.params);
  const input = parseJobsListInput(raw);

  return executeJobsList(input, commandOptions);
}

async function executeJobsList(
  input: ParsedJobsListInput,
  commandOptions: JobsListCommandOptions,
): Promise<Awaited<ReturnType<typeof listJobs>>> {
  const client =
    commandOptions.client ??
    (await createSdkInspectionClientFromInput({
      impersonateServiceAccount: input.impersonateServiceAccount,
      impersonateDelegates: input.impersonateDelegates,
    }));

  return listJobs({
    client,
    toolVersion: commandOptions.toolVersion,
    listRequest: input.listRequest,
    filters: input.filters,
    ...(input.impersonateServiceAccount === undefined
      ? {}
      : {
          impersonateServiceAccount: input.impersonateServiceAccount,
          ...(input.impersonateDelegates !== undefined && input.impersonateDelegates.length > 0
            ? { impersonateDelegates: input.impersonateDelegates }
            : {}),
        }),
  });
}
