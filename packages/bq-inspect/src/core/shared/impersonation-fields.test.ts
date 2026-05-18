import { describe, expect, it } from 'vitest';

import { impersonationRequestFields } from './impersonation-fields';

describe('impersonationRequestFields', () => {
  it('returns empty object when impersonation fields are unset', () => {
    expect(impersonationRequestFields({})).toEqual({});
  });

  it('includes service account when set', () => {
    expect(
      impersonationRequestFields({ impersonateServiceAccount: 'sa@p.iam.gserviceaccount.com' }),
    ).toEqual({ impersonateServiceAccount: 'sa@p.iam.gserviceaccount.com' });
  });

  it('omits empty delegate list', () => {
    expect(
      impersonationRequestFields({
        impersonateServiceAccount: 'sa@p.iam.gserviceaccount.com',
        impersonateDelegates: [],
      }),
    ).toEqual({ impersonateServiceAccount: 'sa@p.iam.gserviceaccount.com' });
  });

  it('includes non-empty delegate list', () => {
    expect(
      impersonationRequestFields({
        impersonateDelegates: ['d1@p.iam.gserviceaccount.com'],
      }),
    ).toEqual({ impersonateDelegates: ['d1@p.iam.gserviceaccount.com'] });
  });
});
