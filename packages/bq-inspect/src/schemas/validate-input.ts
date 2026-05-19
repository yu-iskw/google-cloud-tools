// eslint-disable-next-line import-x/no-named-as-default -- Ajv2020 is the documented default export entry
import Ajv2020 from 'ajv/dist/2020';
import addFormats from 'ajv-formats';

import { createInputFailure } from '../core/shared/errors';

import { getCommandSchema, type CommandId } from './command-schemas';

import type { ErrorObject, ValidateFunction } from 'ajv';

const ajv = new Ajv2020({ allErrors: true, strict: false });
addFormats(ajv);

const validatorCache = new Map<CommandId, ValidateFunction>();

function getValidator(commandId: CommandId): ValidateFunction {
  const cached = validatorCache.get(commandId);

  if (cached !== undefined) {
    return cached;
  }

  const schema = getCommandSchema(commandId, 'input') as object;
  const validate = ajv.compile(schema);
  validatorCache.set(commandId, validate);

  return validate;
}

function formatAjvErrors(
  errors: ErrorObject[] | null | undefined,
): { path: string; message: string }[] {
  if (errors === null || errors === undefined) {
    return [];
  }

  return errors.slice(0, 5).map((error) => ({
    path: error.instancePath.length > 0 ? error.instancePath : '/',
    message: error.message ?? 'validation failed',
  }));
}

export function validateInput(commandId: CommandId, data: unknown): Record<string, unknown> {
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    throw createInputFailure('params must be a JSON object.');
  }

  const validate = getValidator(commandId);

  if (!validate(data)) {
    throw createInputFailure('params do not match the input schema.', {
      hint: `Run bq-inspect ${commandId} --input-schema.`,
      source: { schemaErrors: formatAjvErrors(validate.errors) },
    });
  }

  return data as Record<string, unknown>;
}
