import { hintForApiError, type ApiErrorHintContext } from '../../core/shared/api-error-hints';
import { BqInspectFailure, createBqInspectError } from '../../core/shared/errors';

import type { BqInspectErrorCode } from '../../core/shared/types';

export function resolveHttpStatus(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null) {
    return undefined;
  }

  const record = error as Record<string, unknown>;
  const fromCode = parseHttpStatus(record.code);

  if (fromCode !== undefined) {
    return fromCode;
  }

  const response = record.response;

  if (typeof response === 'object' && response !== null) {
    const status = (response as { status?: unknown }).status;

    return parseHttpStatus(status);
  }

  return undefined;
}

function parseHttpStatus(value: unknown): number | undefined {
  if (typeof value === 'number' && value >= 100 && value < 600) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number.parseInt(value, 10);

    if (!Number.isNaN(parsed) && parsed >= 100 && parsed < 600) {
      return parsed;
    }
  }

  return undefined;
}

export function extractGoogleErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message;
  }

  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;

    if (typeof message === 'string' && message.trim().length > 0) {
      return message;
    }
  }

  return 'BigQuery request failed.';
}

export function mapHttpStatusToErrorCode(status: number): BqInspectErrorCode {
  if (status === 403 || status === 401) {
    return 'BQINSPECT_PERMISSION_DENIED';
  }

  if (status === 404) {
    return 'BQINSPECT_JOB_NOT_FOUND';
  }

  if (status === 429) {
    return 'BQINSPECT_API_RATE_LIMITED';
  }

  if (status >= 500) {
    return 'BQINSPECT_API_UNAVAILABLE';
  }

  return 'BQINSPECT_API_UNAVAILABLE';
}

export function mapGoogleErrorToBqInspectFailure(
  error: unknown,
  api = 'bigquery.jobs.get',
  context?: ApiErrorHintContext,
): BqInspectFailure {
  const status = resolveHttpStatus(error);
  const message = extractGoogleErrorMessage(error);

  if (status === undefined) {
    return new BqInspectFailure(
      createBqInspectError({
        code: 'BQINSPECT_INTERNAL',
        message,
      }),
    );
  }

  const code = mapHttpStatusToErrorCode(status);
  const hint = hintForApiError(code, api, context);

  return new BqInspectFailure(
    createBqInspectError({
      code,
      message,
      ...(hint === undefined ? {} : { hint }),
      source: { api, status },
    }),
  );
}
