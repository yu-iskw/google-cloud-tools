/* eslint-disable security/detect-non-literal-fs-filename -- fixture paths are resolved relative to this test file */
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { parseSelector } from '../../selector/parse-selector';

import { applyProjection } from './project';

describe('applyProjection', () => {
  it('projects nested objects', () => {
    const input = { a: { b: 1, c: 2 }, d: 3 };
    const selector = parseSelector('a{b}');

    expect(applyProjection(input, selector).value).toEqual({ a: { b: 1 } });
  });

  it('projects arrays using the same child selector for each element', () => {
    const input = {
      items: [
        { id: 1, secret: 'x' },
        { id: 2, secret: 'y' },
      ],
    };
    const selector = parseSelector('items{id}');

    expect(applyProjection(input, selector).value).toEqual({ items: [{ id: 1 }, { id: 2 }] });
  });

  it('omits missing fields and records warnings', () => {
    const input = { id: 'job_123' };
    const selector = parseSelector('id,missing');

    const result = applyProjection(input, selector);

    expect(result.value).toEqual({ id: 'job_123' });
    expect(result.warnings).toEqual([
      {
        code: 'BQINSPECT_FIELD_MISSING',
        message: 'Selected field was not present: missing',
        path: 'missing',
      },
    ]);
  });

  it('does not mutate the input object', () => {
    const fixturePath = path.join(__dirname, '..', '..', 'fixtures', 'successful-query-job.json');
    const input = JSON.parse(readFileSync(fixturePath, 'utf8')) as Record<string, unknown>;
    const snapshot = structuredClone(input);
    const selector = parseSelector('status{state}');

    applyProjection(input, selector);

    expect(input).toEqual(snapshot);
  });
});
