import type { BqInspectSchemaVersion } from './types';

const schemaVersion: BqInspectSchemaVersion = 'bq-inspect.v1';

export function buildToolEnvelope(toolVersion: string): {
  schemaVersion: BqInspectSchemaVersion;
  tool: { name: 'bq-inspect'; version: string; readOnly: true };
} {
  return {
    schemaVersion,
    tool: {
      name: 'bq-inspect',
      version: toolVersion,
      readOnly: true,
    },
  };
}
