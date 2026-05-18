import { GoogleAuth, Impersonated } from 'google-auth-library';

import type { AuthClient } from 'google-auth-library';

const readonlyScope = 'https://www.googleapis.com/auth/bigquery.readonly';
const cloudPlatformScope = 'https://www.googleapis.com/auth/cloud-platform';

export interface AuthClientOptions {
  impersonateServiceAccount?: string;
  impersonateDelegates?: string[];
}

export function normalizeOptionalTrimmed(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed.length === 0 ? undefined : trimmed;
}

export function normalizeDelegateList(value: string[] | string | undefined): string[] {
  if (value === undefined) {
    return [];
  }

  const list = Array.isArray(value) ? value : [value];

  return list.map((entry) => entry.trim()).filter((entry) => entry.length > 0);
}

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
