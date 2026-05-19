import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { createInputFailure } from '../../core/shared/errors';

export async function resolveParamsValue(raw: string): Promise<unknown> {
  const trimmed = raw.trim();

  if (trimmed.length === 0) {
    throw createInputFailure('--params value must not be empty.');
  }

  let text: string;

  if (trimmed.startsWith('@')) {
    const filePath = trimmed.slice(1).trim();

    if (filePath.length === 0) {
      throw createInputFailure('Expected a file path after @.');
    }

    const resolvedPath = path.isAbsolute(filePath)
      ? filePath
      : path.resolve(process.cwd(), filePath);

    try {
      // eslint-disable-next-line security/detect-non-literal-fs-filename -- path comes from user @file after resolve
      text = await readFile(resolvedPath, 'utf8');
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw createInputFailure(`Failed to read params file "${filePath}": ${message}`);
    }
  } else {
    text = trimmed;
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw createInputFailure('Params must be valid JSON.');
  }
}
