import { catalogErrorEnvelope } from '../shared/catalog-error';
import { buildToolEnvelope } from '../shared/envelope';

import type { BigQueryInspectionClient, TableRef } from '../../bigquery/port/inspection-client';
import type { CatalogResourceResponse } from '../shared/types';

export async function getTableMetadata(
  ref: TableRef,
  options: { client: Pick<BigQueryInspectionClient, 'getTable'>; toolVersion: string },
): Promise<CatalogResourceResponse> {
  const { tool, schemaVersion } = buildToolEnvelope(options.toolVersion);

  try {
    const resource = await options.client.getTable(ref);

    return {
      schemaVersion,
      tool,
      request: {
        projectId: ref.projectId,
        datasetId: ref.datasetId,
        tableId: ref.tableId,
      },
      resource,
      warnings: [],
      errors: [],
    };
  } catch (error: unknown) {
    return catalogErrorEnvelope(
      schemaVersion,
      tool,
      ref.projectId,
      ref.datasetId,
      ref.tableId,
      error,
    );
  }
}
