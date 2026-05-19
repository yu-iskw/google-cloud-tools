/* eslint-disable security/detect-non-literal-fs-filename -- fixture paths are resolved relative to this test file */
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { projectJob } from './project-job';

function loadFixture(name = 'successful-query-job.json'): Record<string, unknown> {
  const fixturePath = path.join(__dirname, '..', '..', 'fixtures', name);

  return JSON.parse(readFileSync(fixturePath, 'utf8')) as Record<string, unknown>;
}

describe('projectJob', () => {
  it('summary omits configuration and strips queryPlan from statistics', () => {
    const fixture = loadFixture();
    const fixtureStats = fixture.statistics as Record<string, unknown>;
    const fixtureQuery = fixtureStats.query as Record<string, unknown>;
    const job = {
      ...fixture,
      statistics: {
        ...fixtureStats,
        query: {
          ...fixtureQuery,
          queryPlan: [{ name: 'stage' }],
          timeline: [{ elapsedMs: '1' }],
        },
      },
    };

    const projected = projectJob(job, 'summary') as Record<string, unknown>;

    expect(projected.configuration).toBeUndefined();
    expect(projected.user_email).toBeUndefined();
    expect(projected.id).toBe('analytics-prod:US.job_123');
    expect(projected.status).toBeDefined();

    const queryStats = (projected.statistics as { query: Record<string, unknown> }).query;
    expect(queryStats.totalBytesProcessed).toBe('12345');
    expect(queryStats.queryPlan).toBeUndefined();
    expect(queryStats.timeline).toBeUndefined();
  });

  it('query keeps SQL, configuration, and lineage-related statistics', () => {
    const projected = projectJob(loadFixture('query-job-with-lineage.json'), 'query') as Record<
      string,
      unknown
    >;

    expect(String((projected.configuration as { query: { query: string } }).query.query)).toContain(
      'SELECT',
    );
    const queryStats = (projected.statistics as { query: Record<string, unknown> }).query;
    expect(queryStats.referencedTables).toHaveLength(1);
    expect(queryStats.queryPlan).toBeUndefined();
    expect(queryStats.dmlStats).toBeUndefined();
    expect(queryStats.totalSlotMs).toBe('100');
  });

  it('performance keeps queryPlan and omits configuration SQL', () => {
    const fixture = loadFixture();
    const fixtureStats = fixture.statistics as Record<string, unknown>;
    const fixtureQuery = fixtureStats.query as Record<string, unknown>;
    const job = {
      ...fixture,
      statistics: {
        ...fixtureStats,
        query: {
          ...fixtureQuery,
          query: 'SELECT 1',
          queryPlan: [{ name: 'stage' }],
        },
      },
    };

    const projected = projectJob(job, 'performance') as Record<string, unknown>;

    expect(projected.configuration).toBeUndefined();
    const queryStats = (projected.statistics as { query: Record<string, unknown> }).query;
    expect(queryStats.queryPlan).toEqual([{ name: 'stage' }]);
    expect(queryStats.query).toBeUndefined();
  });

  it('lineage keeps referencedTables and drops queryPlan', () => {
    const projected = projectJob(loadFixture('query-job-with-lineage.json'), 'lineage') as Record<
      string,
      unknown
    >;

    expect(projected.configuration).toBeUndefined();
    const queryStats = (projected.statistics as { query: Record<string, unknown> }).query;
    expect(queryStats.referencedTables).toHaveLength(1);
    expect(queryStats.queryPlan).toBeUndefined();
    expect(queryStats.dmlStats).toBeUndefined();
  });

  it('impact keeps dmlStats and job-type statistics', () => {
    const projected = projectJob(loadFixture('query-job-with-lineage.json'), 'impact') as Record<
      string,
      unknown
    >;

    const stats = projected.statistics as Record<string, unknown>;
    const queryStats = stats.query as Record<string, unknown>;
    expect(queryStats.dmlStats).toBeDefined();
    expect(queryStats.referencedTables).toBeUndefined();
    expect(stats.mlStatistics).toEqual({ modelId: 'model_1' });
    expect(stats.queryPlan).toBeUndefined();
  });

  it('full returns the job unchanged', () => {
    const job = loadFixture();
    const snapshot = structuredClone(job);

    expect(projectJob(job, 'full')).toEqual(snapshot);
  });

  it('does not mutate input', () => {
    const input = { configuration: { query: { query: "SELECT 'secret'" } } };
    const snapshot = structuredClone(input);

    projectJob(input, 'summary');

    expect(input).toEqual(snapshot);
  });
});
