import { parseArgs } from 'node:util';

import { BqInspectFailure, createBqInspectError } from '../core/shared/errors';
import { jobsGetInputSchema } from '../schemas/input-schema';
import { outputSchema } from '../schemas/output-schema';
import { selectorSchemaJob } from '../schemas/selector-schema';

export async function runSchemaCommand(argv: string[]): Promise<unknown> {
  const parsed = parseArgs({
    args: argv,
    options: {
      format: { type: 'string' },
      resource: { type: 'string' },
    },
    allowPositionals: true,
  });

  const name = parsed.positionals[0];

  if (name !== 'input' && name !== 'output' && name !== 'selector') {
    throw new BqInspectFailure(
      createBqInspectError({
        code: 'BQINSPECT_INPUT_INVALID',
        message: `Unknown schema command: ${String(name)}`,
      }),
    );
  }

  const format = parsed.values.format;

  if (format !== 'json-schema') {
    throw new BqInspectFailure(
      createBqInspectError({
        code: 'BQINSPECT_INPUT_INVALID',
        message:
          format === undefined
            ? 'Missing --format json-schema'
            : `Unsupported --format value: ${format}`,
      }),
    );
  }

  if (name === 'input') {
    return jobsGetInputSchema;
  }

  if (name === 'output') {
    return outputSchema;
  }

  const resource = parsed.values.resource;

  if (resource !== 'job') {
    throw new BqInspectFailure(
      createBqInspectError({
        code: 'BQINSPECT_INPUT_INVALID',
        message: 'schema selector requires --resource job',
      }),
    );
  }

  return selectorSchemaJob;
}
