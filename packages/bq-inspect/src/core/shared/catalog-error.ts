import { BqInspectFailure } from './errors';

import type { BqInspectError, CatalogResourceResponse } from './types';

export function catalogErrorEnvelope(
  schemaVersion: CatalogResourceResponse['schemaVersion'],
  tool: CatalogResourceResponse['tool'],
  projectId: string,
  datasetId: string,
  tableId: string | undefined,
  error: unknown,
): CatalogResourceResponse {
  const errors: BqInspectError[] = [];

  if (error instanceof BqInspectFailure) {
    errors.push(error.details);
  } else {
    throw error;
  }

  return {
    schemaVersion,
    tool,
    request: {
      projectId,
      datasetId,
      ...(tableId === undefined || tableId.length === 0 ? {} : { tableId }),
    },
    warnings: [],
    errors,
  };
}
