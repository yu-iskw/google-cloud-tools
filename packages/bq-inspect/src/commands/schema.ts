import { parseArgs } from 'node:util';

import { BqInspectFailure, createBqInspectError } from '../core/shared/errors';
import { jobsGetInputSchema } from '../schemas/input-schema';
import { outputSchema } from '../schemas/output-schema';

export async function runSchemaCommand(argv: string[]): Promise<unknown> {
  const parsed = parseArgs({
    args: argv,
    options: {
      format: { type: 'string' },
    },
    allowPositionals: true,
  });

  const name = parsed.positionals[0];

  if (name !== 'input' && name !== 'output') {
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

  return outputSchema;
}
