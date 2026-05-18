/* eslint-disable security/detect-non-literal-fs-filename -- temp paths under os.tmpdir() */
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { afterEach, describe, expect, it } from 'vitest';

import { BqInspectFailure } from '../../core/shared/errors';

import { resolveParamsValue } from './parse-params';

describe('resolveParamsValue', () => {
  const originalCwd = process.cwd();
  let tempDir: string | undefined;

  afterEach(async () => {
    process.chdir(originalCwd);

    if (tempDir !== undefined) {
      await rm(tempDir, { recursive: true, force: true });
      tempDir = undefined;
    }
  });

  it('parses inline JSON objects', async () => {
    const value = await resolveParamsValue('{"projectId":"p"}');

    expect(value).toEqual({ projectId: 'p' });
  });

  it('reads JSON from @file relative to cwd', async () => {
    tempDir = await mkdtemp(path.join(os.tmpdir(), 'bq-inspect-params-'));
    const filePath = path.join(tempDir, 'params.json');
    await writeFile(filePath, '{"jobs":[{"projectId":"p","jobId":"j"}]}', 'utf8');
    process.chdir(tempDir);

    const value = await resolveParamsValue('@params.json');

    expect(value).toEqual({ jobs: [{ projectId: 'p', jobId: 'j' }] });
  });

  it('rejects empty inline params', async () => {
    await expect(resolveParamsValue('   ')).rejects.toBeInstanceOf(BqInspectFailure);
  });

  it('rejects @ without a path', async () => {
    await expect(resolveParamsValue('@')).rejects.toBeInstanceOf(BqInspectFailure);
  });

  it('rejects invalid JSON', async () => {
    await expect(resolveParamsValue('{not json}')).rejects.toBeInstanceOf(BqInspectFailure);
  });

  it('rejects missing @file', async () => {
    await expect(resolveParamsValue('@./does-not-exist.json')).rejects.toBeInstanceOf(
      BqInspectFailure,
    );
  });
});
