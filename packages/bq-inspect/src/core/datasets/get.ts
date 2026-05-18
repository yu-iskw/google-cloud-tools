import { catalogErrorEnvelope } from '../shared/catalog-error';
import { buildToolEnvelope } from '../shared/envelope';

import type { BigQueryInspectionClient, DatasetRef } from '../../bigquery/client/job-client';
import type { CatalogResourceResponse } from '../shared/types';

export async function getDatasetMetadata(
  ref: DatasetRef,
  options: { client: Pick<BigQueryInspectionClient, 'getDataset'>; toolVersion: string },
): Promise<CatalogResourceResponse> {
  const { tool, schemaVersion } = buildToolEnvelope(options.toolVersion);

  try {
    const resource = await options.client.getDataset(ref);

    return {
      schemaVersion,
      tool,
      request: {
        projectId: ref.projectId,
        datasetId: ref.datasetId,
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
      undefined,
      error,
    );
  }
}
