import type { InspectJobRequest } from './types';

export interface ImpersonationFields {
  impersonateServiceAccount?: string;
  impersonateDelegates?: string[];
}

export function impersonationRequestFields(
  fields: ImpersonationFields,
): Pick<InspectJobRequest, 'impersonateDelegates' | 'impersonateServiceAccount'> {
  return {
    ...(fields.impersonateServiceAccount === undefined
      ? {}
      : { impersonateServiceAccount: fields.impersonateServiceAccount }),
    ...(fields.impersonateDelegates !== undefined && fields.impersonateDelegates.length > 0
      ? { impersonateDelegates: fields.impersonateDelegates }
      : {}),
  };
}
