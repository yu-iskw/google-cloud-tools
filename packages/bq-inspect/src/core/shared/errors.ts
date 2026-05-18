import type { BqInspectError, BqInspectErrorCode } from './types';

const exitCodes: Record<BqInspectErrorCode, number> = {
  BQINSPECT_INPUT_INVALID: 2,
  BQINSPECT_SELECTOR_INVALID: 2,
  BQINSPECT_FIELD_UNKNOWN: 2,
  BQINSPECT_PERMISSION_DENIED: 3,
  BQINSPECT_JOB_NOT_FOUND: 4,
  BQINSPECT_LOCATION_REQUIRED: 2,
  BQINSPECT_API_RATE_LIMITED: 5,
  BQINSPECT_API_UNAVAILABLE: 5,
  BQINSPECT_INTERNAL: 1,
};

const defaultRetriableByCode: Record<BqInspectErrorCode, boolean> = {
  BQINSPECT_INPUT_INVALID: false,
  BQINSPECT_SELECTOR_INVALID: false,
  BQINSPECT_FIELD_UNKNOWN: false,
  BQINSPECT_PERMISSION_DENIED: false,
  BQINSPECT_JOB_NOT_FOUND: false,
  BQINSPECT_LOCATION_REQUIRED: false,
  BQINSPECT_API_RATE_LIMITED: true,
  BQINSPECT_API_UNAVAILABLE: true,
  BQINSPECT_INTERNAL: false,
};

export class BqInspectFailure extends Error {
  public readonly details: BqInspectError;

  public constructor(details: BqInspectError) {
    super(details.message);
    this.name = 'BqInspectFailure';
    this.details = details;
  }

  public toJSON(): BqInspectError {
    return this.details;
  }
}

export function getExitCode(error: BqInspectError): number {
  return exitCodes[error.code];
}

export function createBqInspectError(
  input: Omit<BqInspectError, 'retriable'> & { retriable?: boolean },
): BqInspectError {
  const retriable = input.retriable ?? defaultRetriableByCode[input.code];

  return {
    code: input.code,
    message: input.message,
    retriable,
    ...(input.hint === undefined ? {} : { hint: input.hint }),
    ...(input.source === undefined ? {} : { source: input.source }),
  };
}

export function createInputFailure(message: string, hint?: string): BqInspectFailure {
  return new BqInspectFailure(
    createBqInspectError({
      code: 'BQINSPECT_INPUT_INVALID',
      message,
      hint,
    }),
  );
}
