import { defineConfig } from 'vitest/config';

/** Default per-glob minimums for packages that opt into coverage thresholds. */
export const coverageThresholdBlock = {
  lines: 85,
  functions: 85,
  branches: 80,
  statements: 85,
} as const;

/** Excludes applied to every workspace with coverage enabled. */
const baseCoverageExclude = [
  '**/*.{test,spec}.ts',
  '**/test-support/**',
  '**/fixtures/**',
  '**/*.d.ts',
] as const;

export function coverageExclude(...workspacePaths: string[]): string[] {
  return [...baseCoverageExclude, ...workspacePaths];
}

/** Shared test discovery defaults for workspace packages. */
export const sharedTestConfig = defineConfig({
  test: {
    include: ['src/**/*.{test,spec}.ts'],
    exclude: ['node_modules'],
  },
});

/** Shared coverage provider, reporters, and per-file enforcement (no glob thresholds). */
export const sharedCoverageConfig = defineConfig({
  test: {
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: coverageExclude(),
      reporter: ['text', 'text-summary', 'html'],
      thresholds: {
        perFile: true,
      },
    },
  },
});
