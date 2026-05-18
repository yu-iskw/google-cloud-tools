import { describe, expect, it } from 'vitest';

import { BqInspectFailure } from '../core/shared/errors';

import { runSchemaCommand } from './schema';

describe('runSchemaCommand', () => {
  it('emits JSON for schema input', async () => {
    const payload = await runSchemaCommand(['input', '--format', 'json-schema']);

    expect(() => JSON.stringify(payload)).not.toThrow();
    expect(payload).toHaveProperty('$schema');
  });

  it('emits JSON for schema output', async () => {
    const payload = await runSchemaCommand(['output', '--format', 'json-schema']);

    expect(() => JSON.stringify(payload)).not.toThrow();
  });

  it('emits JSON for schema selector with --resource job', async () => {
    const payload = await runSchemaCommand([
      'selector',
      '--format',
      'json-schema',
      '--resource',
      'job',
    ]);

    expect(() => JSON.stringify(payload)).not.toThrow();
    expect(payload).toMatchObject({
      properties: {
        exampleSelectors: {
          properties: {
            cost: {},
            governance: {},
          },
        },
      },
    });
  });

  it('fails for unsupported schema names', async () => {
    await expect(runSchemaCommand(['nope', '--format', 'json-schema'])).rejects.toBeInstanceOf(
      BqInspectFailure,
    );
  });

  it('fails when selector resource is missing', async () => {
    await expect(runSchemaCommand(['selector', '--format', 'json-schema'])).rejects.toBeInstanceOf(
      BqInspectFailure,
    );
  });
});
