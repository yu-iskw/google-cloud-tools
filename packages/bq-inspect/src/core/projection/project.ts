import type { SelectorAst, SelectorField } from '../../selector/types';
import type { BqInspectWarning } from '../shared/types';

export interface ProjectionResult {
  value: unknown;
  warnings: BqInspectWarning[];
}

export function applyProjection(input: unknown, selector: SelectorAst): ProjectionResult {
  const warnings: BqInspectWarning[] = [];
  const value = projectValue(input, selector.fields, '', warnings);

  return { value, warnings };
}

function projectValue(
  input: unknown,
  fields: SelectorField[],
  path: string,
  warnings: BqInspectWarning[],
): unknown {
  if (Array.isArray(input)) {
    return input.map((item, idx) =>
      projectValue(item, fields, `${path}[${String(idx)}]`, warnings),
    );
  }

  if (input === null || typeof input !== 'object') {
    return undefined;
  }

  const source = input as Record<string, unknown>;
  const projected: Record<string, unknown> = {};

  for (const field of fields) {
    const fieldPath = path.length === 0 ? field.name : `${path}.${field.name}`;
    const child = source[field.name];

    if (child === undefined) {
      warnings.push({
        code: 'BQINSPECT_FIELD_MISSING',
        message: `Selected field was not present: ${fieldPath}`,
        path: fieldPath,
      });

      continue;
    }

    projected[field.name] =
      field.children.length === 0
        ? child
        : projectValue(child, field.children, fieldPath, warnings);
  }

  return projected;
}
