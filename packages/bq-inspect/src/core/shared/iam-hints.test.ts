import { describe, expect, it } from 'vitest';

import { iamHintForApi } from './iam-hints';

describe('iamHintForApi', () => {
  it('returns jobs hint for bigquery.jobs APIs', () => {
    expect(iamHintForApi('bigquery.jobs.get')).toContain('resourceViewer');
  });

  it('returns metadata hint for datasets and tables APIs', () => {
    expect(iamHintForApi('bigquery.datasets.get')).toContain('metadataViewer');
    expect(iamHintForApi('bigquery.tables.list')).toContain('metadataViewer');
  });

  it('returns undefined for unknown APIs', () => {
    expect(iamHintForApi('other.api')).toBeUndefined();
  });
});
