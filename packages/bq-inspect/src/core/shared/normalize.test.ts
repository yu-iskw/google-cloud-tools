import { describe, expect, it } from 'vitest';

import { normalizeDelegateList, normalizeOptionalTrimmed } from './normalize';

describe('normalizeOptionalTrimmed', () => {
  it('returns undefined for undefined, blank, or whitespace-only values', () => {
    expect(normalizeOptionalTrimmed(undefined)).toBeUndefined();
    expect(normalizeOptionalTrimmed('')).toBeUndefined();
    expect(normalizeOptionalTrimmed('   ')).toBeUndefined();
  });

  it('trims non-empty strings', () => {
    expect(normalizeOptionalTrimmed('  sa@proj.iam.gserviceaccount.com  ')).toBe(
      'sa@proj.iam.gserviceaccount.com',
    );
  });
});

describe('normalizeDelegateList', () => {
  it('returns an empty array for undefined', () => {
    expect(normalizeDelegateList(undefined)).toEqual([]);
  });

  it('normalizes a single string entry', () => {
    expect(normalizeDelegateList('  a@x.iam.gserviceaccount.com  ')).toEqual([
      'a@x.iam.gserviceaccount.com',
    ]);
  });

  it('normalizes an array of delegates preserving order', () => {
    expect(
      normalizeDelegateList([
        '  first@x.iam.gserviceaccount.com ',
        ' second@x.iam.gserviceaccount.com',
      ]),
    ).toEqual(['first@x.iam.gserviceaccount.com', 'second@x.iam.gserviceaccount.com']);
  });

  it('drops empty entries after trim', () => {
    expect(normalizeDelegateList(['valid@x.iam.gserviceaccount.com', '   ', ''])).toEqual([
      'valid@x.iam.gserviceaccount.com',
    ]);
  });
});
