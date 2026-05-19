import { parseArgs } from 'node:util';

import { createInputFailure } from '../../core/shared/errors';

type OperationalArgv =
  | { kind: 'input-schema' }
  | { kind: 'output-schema' }
  | { kind: 'run'; params: string };

export function parseOperationalArgv(argv: string[]): OperationalArgv {
  let parsed: ReturnType<typeof parseArgs>;

  try {
    parsed = parseArgs({
      args: argv,
      options: {
        params: { type: 'string' },
        'input-schema': { type: 'boolean' },
        'output-schema': { type: 'boolean' },
      },
      strict: true,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw createInputFailure(message);
  }

  if (parsed.positionals.length > 0) {
    throw createInputFailure(`Unexpected positional argument(s): ${parsed.positionals.join(' ')}`);
  }

  const wantsInput = parsed.values['input-schema'] === true;
  const wantsOutput = parsed.values['output-schema'] === true;

  if (wantsInput && wantsOutput) {
    throw createInputFailure('Use either --input-schema or --output-schema, not both.');
  }

  if (wantsInput) {
    return { kind: 'input-schema' };
  }

  if (wantsOutput) {
    return { kind: 'output-schema' };
  }

  const params = parsed.values.params;

  if (typeof params !== 'string' || params.trim().length === 0) {
    throw createInputFailure('--params is required (JSON object or @path to a JSON file).', {
      hint: 'Use --input-schema to print the expected params shape.',
    });
  }

  return { kind: 'run', params };
}
