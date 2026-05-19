import { validateInput } from '../../schemas/validate-input';

import { mapCatalogInput, mapJobsListInput, mapJobsViewInput } from './map-input';

import type {
  ParsedCatalogInput,
  ParsedJobsListInput,
  ParsedJobsViewInput,
} from './parsed-input-types';
import type { CommandId, JobsViewCommandId } from '../../schemas/command-schemas';

export type { ParsedCatalogInput, ParsedJobsListInput, ParsedJobsViewInput };

type CatalogCommandId = Extract<CommandId, 'datasets get' | 'tables get' | 'tables list'>;

function parseCatalogInput(commandId: CatalogCommandId, raw: unknown): ParsedCatalogInput {
  return mapCatalogInput(validateInput(commandId, raw));
}

function parseJobsViewInput(commandId: JobsViewCommandId, raw: unknown): ParsedJobsViewInput {
  return mapJobsViewInput(validateInput(commandId, raw));
}

export function parseJobsGetInput(raw: unknown): ParsedJobsViewInput {
  return parseJobsViewInput('jobs get', raw);
}

export function parseJobsViewInputForCommand(
  commandId: JobsViewCommandId,
  raw: unknown,
): ParsedJobsViewInput {
  return parseJobsViewInput(commandId, raw);
}

export function parseJobsListInput(raw: unknown): ParsedJobsListInput {
  return mapJobsListInput(validateInput('jobs list', raw));
}

export function parseDatasetsGetInput(raw: unknown): ParsedCatalogInput {
  return parseCatalogInput('datasets get', raw);
}

export function parseTablesListInput(raw: unknown): ParsedCatalogInput {
  return parseCatalogInput('tables list', raw);
}

export function parseTablesGetInput(raw: unknown): ParsedCatalogInput {
  return parseCatalogInput('tables get', raw);
}
