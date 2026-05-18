import { parseOperationalArgv } from '../../cli/argv/operational-argv';
import { parseJobsViewInputForCommand } from '../../cli/input/input-parsers';
import { resolveParamsValue } from '../../cli/params/parse-params';
import { inspectJobs } from '../../core/jobs/get';
import { impersonationRequestFields } from '../../core/shared/impersonation-fields';
import { getCommandSchema } from '../../schemas/command-schemas';
import { createSdkInspectionClientFromInput } from '../command-shared';

import type { BigQueryJobClient } from '../../bigquery/port/inspection-client';
import type { ParsedJobsViewInput } from '../../cli/input/input-parsers';
import type { JobView } from '../../core/shared/types';
import type { JobsViewCommandId } from '../../schemas/command-schemas';

export interface JobsViewCommandOptions {
  client?: BigQueryJobClient;
  toolVersion: string;
}

function createRunJobsView(view: JobView, commandId: JobsViewCommandId) {
  return async function runJobsView(
    argv: string[],
    commandOptions: JobsViewCommandOptions,
  ): Promise<Awaited<ReturnType<typeof inspectJobs>> | unknown> {
    const argvParsed = parseOperationalArgv(argv);

    if (argvParsed.kind === 'input-schema') {
      return getCommandSchema(commandId, 'input');
    }

    if (argvParsed.kind === 'output-schema') {
      return getCommandSchema(commandId, 'output');
    }

    const raw = await resolveParamsValue(argvParsed.params);
    const input = parseJobsViewInputForCommand(commandId, raw);

    return executeJobsView(input, view, commandOptions);
  };
}

async function executeJobsView(
  input: ParsedJobsViewInput,
  view: JobView,
  commandOptions: JobsViewCommandOptions,
): Promise<Awaited<ReturnType<typeof inspectJobs>>> {
  const client =
    commandOptions.client ??
    (await createSdkInspectionClientFromInput({
      impersonateServiceAccount: input.impersonateServiceAccount,
      impersonateDelegates: input.impersonateDelegates,
    }));

  return inspectJobs(
    {
      jobs: input.jobs,
      view,
      ...impersonationRequestFields(input),
    },
    { client, toolVersion: commandOptions.toolVersion },
  );
}

export const runJobsGet = createRunJobsView('full', 'jobs get');
export const runJobsSummary = createRunJobsView('summary', 'jobs summary');
export const runJobsQuery = createRunJobsView('query', 'jobs query');
export const runJobsPerformance = createRunJobsView('performance', 'jobs performance');
export const runJobsLineage = createRunJobsView('lineage', 'jobs lineage');
export const runJobsImpact = createRunJobsView('impact', 'jobs impact');
