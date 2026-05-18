import { describe, expect, it } from 'vitest';

import { BqInspectFailure } from '../core/shared/errors';

import { runDatasetsGet } from './datasets/get';
import { runJobsGet } from './jobs/get';
import { runJobsImpact } from './jobs/impact';
import { runJobsLineage } from './jobs/lineage';
import { runJobsList } from './jobs/list';
import { runJobsSummary } from './jobs/summary';
import { runTablesGet } from './tables/get';
import { runTablesList } from './tables/list';

describe('per-command schema flags', () => {
  it('jobs get --input-schema returns input schema without job ids', async () => {
    const schema = await runJobsGet(['--input-schema'], { toolVersion: '0.1.0' });

    expect(schema).toMatchObject({
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      title: 'bq-inspect jobs get input',
    });
    expect(JSON.stringify(schema)).not.toContain('selector');
    expect(JSON.stringify(schema)).toContain('"jobs"');
  });

  it('jobs get --output-schema returns output schema', async () => {
    const schema = await runJobsGet(['--output-schema'], { toolVersion: '0.1.0' });

    expect(schema).toMatchObject({ title: 'bq-inspect jobs get output' });
  });

  it('jobs summary --output-schema includes view const', async () => {
    const schema = await runJobsSummary(['--output-schema'], { toolVersion: '0.1.0' });

    expect(schema).toMatchObject({ title: 'bq-inspect jobs summary output' });
    expect(JSON.stringify(schema)).toContain('"summary"');
  });

  it('jobs lineage --output-schema includes view const', async () => {
    const schema = await runJobsLineage(['--output-schema'], { toolVersion: '0.1.0' });

    expect(schema).toMatchObject({ title: 'bq-inspect jobs lineage output' });
    expect(JSON.stringify(schema)).toContain('"lineage"');
  });

  it('jobs impact --output-schema includes view const', async () => {
    const schema = await runJobsImpact(['--output-schema'], { toolVersion: '0.1.0' });

    expect(schema).toMatchObject({ title: 'bq-inspect jobs impact output' });
    expect(JSON.stringify(schema)).toContain('"impact"');
  });

  it('rejects both schema flags on jobs get', async () => {
    await expect(
      runJobsGet(['--input-schema', '--output-schema'], { toolVersion: '0.1.0' }),
    ).rejects.toMatchObject({
      details: {
        code: 'BQINSPECT_INPUT_INVALID',
        message: 'Use either --input-schema or --output-schema, not both.',
      },
    });
  });

  it('jobs list --input-schema', async () => {
    const schema = await runJobsList(['--input-schema'], { toolVersion: '0.1.0' });

    expect(schema).toMatchObject({ title: 'bq-inspect jobs list input' });
  });

  it('datasets get --output-schema', async () => {
    const schema = await runDatasetsGet(['--output-schema'], { toolVersion: '0.1.0' });

    expect(schema).toMatchObject({ title: 'bq-inspect catalog resource output' });
  });

  it('tables list --output-schema', async () => {
    const schema = await runTablesList(['--output-schema'], { toolVersion: '0.1.0' });

    expect(schema).toMatchObject({ title: 'bq-inspect tables list output' });
  });

  it('tables get --input-schema includes tableId', async () => {
    const schema = await runTablesGet(['--input-schema'], { toolVersion: '0.1.0' });

    expect(JSON.stringify(schema)).toContain('tableId');
    expect(schema).toMatchObject({ title: 'bq-inspect tables get input' });
  });

  it('mutual exclusion is BqInspectFailure', async () => {
    await expect(
      runJobsList(['--input-schema', '--output-schema'], { toolVersion: '0.1.0' }),
    ).rejects.toBeInstanceOf(BqInspectFailure);
  });
});
