import { describe, expect, it } from 'vitest';

import { BqInspectFailure } from '../../core/shared/errors';

import { parseOperationalArgv } from './operational-argv';

describe('parseOperationalArgv', () => {
  it('returns input-schema', () => {
    expect(parseOperationalArgv(['--input-schema'])).toEqual({ kind: 'input-schema' });
  });

  it('returns output-schema', () => {
    expect(parseOperationalArgv(['--output-schema'])).toEqual({ kind: 'output-schema' });
  });

  it('returns run with params string', () => {
    expect(parseOperationalArgv(['--params', '{"projectId":"p"}'])).toEqual({
      kind: 'run',
      params: '{"projectId":"p"}',
    });
  });

  it('rejects positional arguments', () => {
    expect(() => parseOperationalArgv(['extra', '--params', '{}'])).toThrow(BqInspectFailure);
  });

  it('rejects both schema flags', () => {
    expect(() => parseOperationalArgv(['--input-schema', '--output-schema'])).toThrow(
      BqInspectFailure,
    );
  });

  it('rejects missing params for run', () => {
    expect(() => parseOperationalArgv([])).toThrow(BqInspectFailure);
  });

  it('rejects unknown flags', () => {
    expect(() => parseOperationalArgv(['--unknown'])).toThrow(BqInspectFailure);
  });
});
