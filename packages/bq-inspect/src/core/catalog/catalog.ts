import { buildToolEnvelope } from '../shared/envelope';
import { BqInspectFailure } from '../shared/errors';

import type {
  BigQueryInspectionClient,
  DatasetRef,
  TableRef,
} from '../../bigquery/bigquery-job-client';
import type { BqInspectError, CatalogResourceResponse, TablesListResponse } from '../shared/types';

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

function catalogErrorEnvelope(
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
