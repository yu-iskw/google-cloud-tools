import { createAuthClient } from '../bigquery/auth/create-auth-client';
import { SdkBigQueryClient } from '../bigquery/sdk/sdk-job-client';

interface ImpersonationInput {
  impersonateServiceAccount?: string;
  impersonateDelegates?: string[];
}

export async function createSdkInspectionClientFromInput(
  input: ImpersonationInput,
): Promise<SdkBigQueryClient> {
  return new SdkBigQueryClient(
    await createAuthClient({
      impersonateServiceAccount: input.impersonateServiceAccount,
      impersonateDelegates: input.impersonateDelegates,
    }),
  );
}
