import { SdkBigQueryClient } from '../bigquery/adapters/google-cloud/sdk-inspection-client';
import { createAuthClient } from '../bigquery/auth/create-auth-client';

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
