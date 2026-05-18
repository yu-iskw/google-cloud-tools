#!/usr/bin/env node

import { readFileSync } from 'node:fs';
import path from 'node:path';

import { resolveHelpText, stripTrailingHelpFlags } from './cli-help';
import { GLOBAL_USAGE } from './cli-usage';
import { runDatasetsGet } from './commands/datasets/get';
import { runJobsGet } from './commands/jobs/get';
import { runJobsList } from './commands/jobs/list';
import { runSchemaCommand } from './commands/schema';
import { runTablesGet } from './commands/tables/get';
import { runTablesList } from './commands/tables/list';
import { BqInspectFailure, createBqInspectError, getExitCode } from './core/shared/errors';

import type { BqInspectError } from './core/shared/types';

function readToolVersion(): string {
  const packageJsonPath = path.join(__dirname, '..', 'package.json');
  // eslint-disable-next-line security/detect-non-literal-fs-filename -- path is derived from this module location only
  const raw = readFileSync(packageJsonPath, 'utf8');
  const pkg = JSON.parse(raw) as { version?: string };

  return typeof pkg.version === 'string' ? pkg.version : '0.0.0';
}

function toCliError(error: unknown): BqInspectError {
  if (error instanceof BqInspectFailure) {
    return error.details;
  }

  if (error instanceof Error) {
    return createBqInspectError({
      code: 'BQINSPECT_INTERNAL',
      message: error.message,
    });
  }

  return createBqInspectError({
    code: 'BQINSPECT_INTERNAL',
    message: 'Unknown error.',
  });
}

async function main(rawArgv: string[]): Promise<void> {
  const { argv, wantsHelp } = stripTrailingHelpFlags(rawArgv);

  if (argv.length === 0) {
    process.stdout.write(`${GLOBAL_USAGE}\n`);

    return;
  }

  const helpText = resolveHelpText(argv, wantsHelp);

  if (helpText !== null) {
    process.stdout.write(`${helpText}\n`);

    return;
  }

  const toolVersion = readToolVersion();

  const routes: Array<{
    test: (a: string[]) => boolean;
    run: (a: string[]) => Promise<unknown>;
  }> = [
    {
      test: (a) => a[0] === 'jobs' && a[1] === 'get',
      run: (a) => runJobsGet(a.slice(2), { toolVersion }),
    },
    {
      test: (a) => a[0] === 'jobs' && a[1] === 'list',
      run: (a) => runJobsList(a.slice(2), { toolVersion }),
    },
    {
      test: (a) => a[0] === 'datasets' && a[1] === 'get',
      run: (a) => runDatasetsGet(a.slice(2), { toolVersion }),
    },
    {
      test: (a) => a[0] === 'tables' && a[1] === 'list',
      run: (a) => runTablesList(a.slice(2), { toolVersion }),
    },
    {
      test: (a) => a[0] === 'tables' && a[1] === 'get',
      run: (a) => runTablesGet(a.slice(2), { toolVersion }),
    },
    {
      test: (a) => a[0] === 'schema',
      run: (a) => runSchemaCommand(a.slice(1)),
    },
  ];

  const route = routes.find((r) => r.test(argv));

  if (route === undefined) {
    throw new BqInspectFailure(
      createBqInspectError({
        code: 'BQINSPECT_INPUT_INVALID',
        message: `Unknown command: ${argv.join(' ')}`,
      }),
    );
  }

  const response = await route.run(argv);
  process.stdout.write(`${JSON.stringify(response, null, 2)}\n`);
}

void main(process.argv.slice(2)).catch((error: unknown) => {
  const details = toCliError(error);
  process.stderr.write(`${JSON.stringify(details, null, 2)}\n`);
  process.exitCode = getExitCode(details);
});
