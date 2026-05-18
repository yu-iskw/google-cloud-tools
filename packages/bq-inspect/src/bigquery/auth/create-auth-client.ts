import { GoogleAuth, Impersonated } from 'google-auth-library';

import { normalizeDelegateList, normalizeOptionalTrimmed } from '../../core/shared/normalize';

import type { AuthClient } from 'google-auth-library';

const readonlyScope = 'https://www.googleapis.com/auth/bigquery.readonly';
const cloudPlatformScope = 'https://www.googleapis.com/auth/cloud-platform';

export interface AuthClientOptions {
  impersonateServiceAccount?: string;
  impersonateDelegates?: string[];
}

export { normalizeDelegateList, normalizeOptionalTrimmed };

export async function createAuthClient(options: AuthClientOptions = {}): Promise<AuthClient> {
  const targetPrincipal = normalizeOptionalTrimmed(options.impersonateServiceAccount);

  if (targetPrincipal === undefined) {
    const googleAuth = new GoogleAuth({ scopes: [readonlyScope] });

    return (await googleAuth.getClient()) as AuthClient;
  }

  const sourceGoogleAuth = new GoogleAuth({ scopes: [cloudPlatformScope] });
  const sourceClient = (await sourceGoogleAuth.getClient()) as AuthClient;
  const delegates = normalizeDelegateList(options.impersonateDelegates);

  return new Impersonated({
    sourceClient,
    targetPrincipal,
    delegates,
    targetScopes: [readonlyScope],
  });
}
