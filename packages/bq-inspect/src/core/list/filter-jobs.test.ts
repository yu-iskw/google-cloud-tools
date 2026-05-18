import { describe, expect, it } from 'vitest';

import { filterJobSummaries } from './filter-jobs';

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

  it('filters by state', () => {
    const jobs = [baseJob, { ...baseJob, status: { state: 'RUNNING' } }];

    expect(filterJobSummaries(jobs, { state: 'DONE' })).toHaveLength(1);
  });

  it('filters by labels', () => {
    const jobs = [baseJob, { ...baseJob, labels: { team: 'other' } }];

    const filtered = filterJobSummaries(jobs, { labels: { team: 'data-platform' } });

    expect(filtered).toHaveLength(1);
  });

  it('filters by parent job id', () => {
    const child = { ...baseJob, statistics: { ...baseJob.statistics, parentJobId: 'parent_1' } };

    expect(filterJobSummaries([baseJob, child], { parentJobId: 'parent_1' })).toEqual([child]);
  });
});
