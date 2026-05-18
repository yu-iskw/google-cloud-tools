/* eslint-disable security/detect-non-literal-fs-filename -- fixture paths are resolved relative to this test file */
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { parseSelector } from '../../selector/parse-selector';
import { applyProjection } from '../projection/project';

import { redactValue } from './redact';

describe('redactValue', () => {
  it('strict redaction removes query text and principal fields', () => {
    const fixturePath = path.join(__dirname, '..', '..', 'fixtures', 'successful-query-job.json');
    const job = JSON.parse(readFileSync(fixturePath, 'utf8')) as Record<string, unknown>;
    const selector = parseSelector(
      'configuration{query{query}},user_email,principal_subject,labels',
    );
    const projected = applyProjection(job, selector).value as Record<string, unknown>;

    const redacted = redactValue(projected, 'strict') as Record<string, unknown>;

    expect(redacted.configuration).toEqual({
      query: {
        query: '[REDACTED]',
      },
    });
    expect(redacted.user_email).toBe('[REDACTED]');
    expect(redacted.principal_subject).toBe('[REDACTED]');
    expect(redacted.labels).toEqual({ team: '[REDACTED]' });
  });

  it('default redaction preserves numeric statistics while redacting string literals in SQL', () => {
    const fixturePath = path.join(__dirname, '..', '..', 'fixtures', 'successful-query-job.json');
    const job = JSON.parse(readFileSync(fixturePath, 'utf8')) as Record<string, unknown>;
    const selector = parseSelector(
      'statistics{query{totalBytesProcessed,totalBytesBilled}},configuration{query{query}}',
    );
    const projected = applyProjection(job, selector).value as Record<string, unknown>;

    const redacted = redactValue(projected, 'default') as Record<string, unknown>;

    expect(redacted.statistics).toEqual({
      query: {
        totalBytesProcessed: '12345',
        totalBytesBilled: '12345',
      },
    });
    expect(String((redacted.configuration as { query: { query: string } }).query.query)).toContain(
      '[REDACTED]',
    );
    expect(
      String((redacted.configuration as { query: { query: string } }).query.query),
    ).not.toContain('alice');
  });

  it('does not mutate input', () => {
    const input = { configuration: { query: { query: "SELECT 'secret'" } } };
    const snapshot = structuredClone(input);

    redactValue(input, 'default');

    expect(input).toEqual(snapshot);
  });
});
