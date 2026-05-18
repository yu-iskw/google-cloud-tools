import { describe, expect, it } from 'vitest';

import { resolveHelpText, stripTrailingHelpFlags } from './cli-help';
import { GLOBAL_USAGE, JOBS_GET_USAGE } from './cli-usage';

describe('stripTrailingHelpFlags', () => {
  it('strips trailing --help and -h', () => {
    expect(stripTrailingHelpFlags(['jobs', 'get', '--help'])).toEqual({
      argv: ['jobs', 'get'],
      wantsHelp: true,
    });
    expect(stripTrailingHelpFlags(['jobs', 'get', '-h'])).toEqual({
      argv: ['jobs', 'get'],
      wantsHelp: true,
    });
    expect(stripTrailingHelpFlags(['--help'])).toEqual({
      argv: [],
      wantsHelp: true,
    });
  });

  it('leaves argv unchanged when no help flag', () => {
    expect(stripTrailingHelpFlags(['jobs', 'get', '--project', 'p'])).toEqual({
      argv: ['jobs', 'get', '--project', 'p'],
      wantsHelp: false,
    });
  });
});

describe('resolveHelpText', () => {
  it('returns null when help was not requested', () => {
    expect(resolveHelpText(['jobs', 'get'], false)).toBeNull();
  });

  it('returns global usage for bare --help', () => {
    const text = resolveHelpText([], true);

    expect(text).toBe(GLOBAL_USAGE);
    expect(text).toContain('jobs get');
  });

  it('returns jobs get usage', () => {
    const text = resolveHelpText(['jobs', 'get'], true);

    expect(text).toBe(JOBS_GET_USAGE);
    expect(text).toContain('--params');
    expect(text).toContain('jobs');
    expect(text).toContain('--input-schema');
    expect(text).toContain('--output-schema');
    expect(text).not.toContain('--selector-schema');
    expect(text).not.toContain('--project');
  });

  it('returns jobs list usage', () => {
    const text = resolveHelpText(['jobs', 'list'], true);

    expect(text).toContain('--params');
    expect(text).toContain('minCreationTime');
    expect(text).toContain('allUsers');
    expect(text).not.toContain('--min-creation-time');
  });

  it('returns catalog command usage', () => {
    expect(resolveHelpText(['datasets', 'get'], true)).toContain('datasetId');
    expect(resolveHelpText(['tables', 'list'], true)).toContain('tables list');
    expect(resolveHelpText(['tables', 'get'], true)).toContain('tableId');
    expect(resolveHelpText(['tables', 'get'], true)).not.toContain('--table');
  });

  it('returns schema usage variants', () => {
    expect(resolveHelpText(['schema'], true)).toContain('json-schema');
    expect(resolveHelpText(['schema', 'input'], true)).toContain('schema input');
    expect(resolveHelpText(['schema', 'output'], true)).toContain('schema output');
  });

  it('returns global usage plus unknown command line', () => {
    const text = resolveHelpText(['foo', 'bar'], true);

    expect(text).toContain(GLOBAL_USAGE);
    expect(text).toContain('Unknown command: foo bar');
  });
});
