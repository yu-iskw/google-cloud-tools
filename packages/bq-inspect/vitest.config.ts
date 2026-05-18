import { defineConfig, mergeConfig } from 'vitest/config';

import {
  coverageExclude,
  coverageThresholdBlock,
  sharedCoverageConfig,
  sharedTestConfig,
} from '../../vitest.shared';

const bqInspectCoverageExclude = coverageExclude(
  '**/parsed-input-types.ts',
  'src/core/shared/types.ts',
  'src/bigquery/client/job-client.ts',
  'src/commands/jobs/get.ts',
  'src/commands/jobs/query.ts',
  'src/commands/jobs/performance.ts',
  'src/commands/jobs/summary.ts',
  'src/commands/jobs/lineage.ts',
  'src/commands/jobs/impact.ts',
);

export default mergeConfig(
  sharedTestConfig,
  sharedCoverageConfig,
  defineConfig({
    test: {
      name: 'bq-inspect',
      coverage: {
        exclude: bqInspectCoverageExclude,
        thresholds: {
          perFile: true,
          'src/core/**': { ...coverageThresholdBlock },
          'src/cli/input/**': { ...coverageThresholdBlock },
          'src/cli/params/**': { ...coverageThresholdBlock },
          'src/bigquery/**': { ...coverageThresholdBlock },
        },
      },
    },
  }),
);
