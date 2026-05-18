import { describe, expect, it } from 'vitest';

import { filterJobSummaries } from './filter';

describe('filterJobSummaries', () => {
  const baseJob = {
    status: { state: 'DONE' },
    statistics: {
      query: {
        totalSlotMs: '5000',
        totalBytesBilled: '100',
      },
    },
    labels: { team: 'data-platform', dbt_invocation_id: 'abc' },
  };

  it('filters by minimum slot ms using statistics.query.totalSlotMs', () => {
    const jobs = [
      baseJob,
      { ...baseJob, statistics: { query: { totalSlotMs: '10', totalBytesBilled: '100' } } },
    ];

    const filtered = filterJobSummaries(jobs, { minSlotMs: 1000n });

    expect(filtered).toHaveLength(1);
    expect(filtered[0]).toEqual(baseJob);
  });

  it('falls back to statistics.totalSlotMs when query totalSlotMs is absent', () => {
    const job = {
      status: { state: 'DONE' },
      statistics: { totalSlotMs: '8000', query: { totalBytesBilled: '1' } },
    };

    const filtered = filterJobSummaries([job], { minSlotMs: 7000n });

    expect(filtered).toEqual([job]);
  });

  it('filters by labels', () => {
    const jobs = [baseJob, { ...baseJob, labels: { team: 'other' } }];

    const filtered = filterJobSummaries(jobs, { labels: { team: 'data-platform' } });

    expect(filtered).toHaveLength(1);
  });

  it('filters by minimum bytes billed', () => {
    const jobs = [
      baseJob,
      { ...baseJob, statistics: { query: { totalSlotMs: '5000', totalBytesBilled: '1' } } },
    ];

    const filtered = filterJobSummaries(jobs, { minBytesBilled: 50n });

    expect(filtered).toHaveLength(1);
    expect(filtered[0]).toEqual(baseJob);
  });

  it('excludes jobs with invalid numeric statistics', () => {
    const job = {
      status: { state: 'DONE' },
      statistics: { query: { totalSlotMs: 'not-a-number', totalBytesBilled: '100' } },
    };

    expect(filterJobSummaries([job], { minSlotMs: 1n })).toEqual([]);
  });

  it('ignores empty label filters', () => {
    expect(filterJobSummaries([baseJob], { labels: {} })).toEqual([baseJob]);
  });
});
