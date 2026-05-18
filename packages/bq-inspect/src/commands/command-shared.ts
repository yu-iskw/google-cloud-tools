import {
  createAuthClient,
  normalizeDelegateList,
  normalizeOptionalTrimmed,
} from '../bigquery/create-auth-client';
import { SdkBigQueryClient } from '../bigquery/sdk-job-client';
import { BqInspectFailure, createBqInspectError } from '../core/shared/errors';

interface ImpersonationCliValues {
  'impersonate-service-account'?: string;
  'impersonate-delegate'?: string[] | string;
}

export function requireCliString(value: string | undefined, flag: string): string {
  if (value === undefined || value.trim().length === 0) {
    throw new BqInspectFailure(
      createBqInspectError({
        code: 'BQINSPECT_INPUT_INVALID',
        message: `${flag} is required.`,
      }),
    );
  }

  return value.trim();
}

export function assertJsonCliFormat(format: string | undefined): void {
  const resolved = format ?? 'json';

  if (resolved !== 'json') {
    throw new BqInspectFailure(
      createBqInspectError({
        code: 'BQINSPECT_INPUT_INVALID',
        message: `Unsupported --format value: ${resolved}`,
      }),
    );
  }
}

export async function createSdkInspectionClientFromCli(
  values: ImpersonationCliValues,
): Promise<SdkBigQueryClient> {
  const impersonateServiceAccount = normalizeOptionalTrimmed(values['impersonate-service-account']);
  const impersonateDelegates = normalizeDelegateList(values['impersonate-delegate']);

  return new SdkBigQueryClient(
    await createAuthClient({
      impersonateServiceAccount,
      impersonateDelegates: impersonateDelegates.length > 0 ? impersonateDelegates : undefined,
    }),
  );
}
