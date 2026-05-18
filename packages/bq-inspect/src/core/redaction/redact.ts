/* eslint-disable security/detect-object-injection -- JSON-like tree traversal uses keys from trusted BigQuery job payloads */
import type { RedactionMode } from '../shared/types';

const redacted = '[REDACTED]';

const strictScalarFieldNames = new Set(['query', 'user_email', 'principal_subject']);

const defaultMaxQueryChars = 24_000;

export function redactValue(value: unknown, mode: RedactionMode): unknown {
  if (mode === 'none') {
    return value;
  }

  return redactNode(value, mode, []);
}

function redactNode(value: unknown, mode: RedactionMode, path: string[]): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => redactNode(item, mode, path));
  }

  if (value === null || typeof value !== 'object') {
    return value;
  }

  const output: Record<string, unknown> = {};

  for (const [key, child] of Object.entries(value)) {
    if (mode === 'strict' && key === 'labels' && child !== null && typeof child === 'object') {
      output[key] = redactLabelLikeObject(child as Record<string, unknown>);

      continue;
    }

    if (mode === 'strict' && strictScalarFieldNames.has(key)) {
      if (child !== null && typeof child === 'object' && !Array.isArray(child)) {
        output[key] = redactNode(child, mode, [...path, key]);
        continue;
      }

      output[key] = redacted;
      continue;
    }

    if (
      mode === 'default' &&
      key === 'query' &&
      typeof child === 'string' &&
      (path.join('.') === 'configuration.query' || path.join('.') === 'statistics.query')
    ) {
      output[key] = capQuery(redactSqlLiterals(child));
      continue;
    }

    output[key] = redactNode(child, mode, [...path, key]);
  }

  return output;
}

function redactLabelLikeObject(input: Record<string, unknown>): Record<string, unknown> {
  const output: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input)) {
    output[key] = typeof value === 'string' ? redacted : value;
  }

  return output;
}

function redactSqlLiterals(sql: string): string {
  return sql.replaceAll(/'[^']*'/g, "'[REDACTED]'");
}

function capQuery(sql: string): string {
  if (sql.length <= defaultMaxQueryChars) {
    return sql;
  }

  return `${sql.slice(0, defaultMaxQueryChars)}\n/* truncated by bq-inspect */`;
}
