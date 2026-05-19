import { buildToolEnvelope } from '../shared/envelope';
import { BqInspectFailure } from '../shared/errors';

import type { BigQueryInspectionClient, DatasetRef } from '../../bigquery/port/inspection-client';
import type { BqInspectError, TablesListResponse } from '../shared/types';

export async function listTablesMetadata(
  ref: DatasetRef,
  options: { client: Pick<BigQueryInspectionClient, 'listTables'>; toolVersion: string },
): Promise<TablesListResponse> {
  const { tool, schemaVersion } = buildToolEnvelope(options.toolVersion);

  try {
    const tables = await options.client.listTables(ref);

    return {
      schemaVersion,
      tool,
      request: {
        projectId: ref.projectId,
        datasetId: ref.datasetId,
      },
      tables,
      warnings: [],
      errors: [],
    };
  } catch (error: unknown) {
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
        projectId: ref.projectId,
        datasetId: ref.datasetId,
      },
      tables: [],
      warnings: [],
      errors,
    };
  }
}
