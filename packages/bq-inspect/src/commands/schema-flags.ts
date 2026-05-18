import { BqInspectFailure, createBqInspectError } from '../core/shared/errors';
import { getCommandSchema } from '../schemas/command-schemas';

import type { CommandId } from '../schemas/command-schemas';

interface SchemaFlagValues {
  'input-schema'?: boolean;
  'output-schema'?: boolean;
}

export function resolveSchemaFlag(
  command: CommandId,
  values: SchemaFlagValues,
): unknown | undefined {
  const wantsInput = values['input-schema'] === true;
  const wantsOutput = values['output-schema'] === true;

  if (wantsInput && wantsOutput) {
    throw new BqInspectFailure(
      createBqInspectError({
        code: 'BQINSPECT_INPUT_INVALID',
        message: 'Use either --input-schema or --output-schema, not both.',
      }),
    );
  }

  if (wantsInput) {
    return getCommandSchema(command, 'input');
  }

  if (wantsOutput) {
    return getCommandSchema(command, 'output');
  }

  return undefined;
}
