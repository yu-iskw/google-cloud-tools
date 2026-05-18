import { describe, expect, it } from 'vitest';

import { BqInspectFailure } from '../core/shared/errors';

import { parseSelector } from './parse-selector';

describe('parseSelector', () => {
  it('parses nested compact selectors', () => {
    expect(parseSelector('id,status{state,errorResult}')).toEqual({
      fields: [
        { name: 'id', children: [] },
        {
          name: 'status',
          children: [
            { name: 'state', children: [] },
            { name: 'errorResult', children: [] },
          ],
        },
      ],
    });
  });

  it('allows whitespace and newlines between fields', () => {
    expect(parseSelector('id\nstatus{\n  state\n}')).toEqual({
      fields: [
        { name: 'id', children: [] },
        { name: 'status', children: [{ name: 'state', children: [] }] },
      ],
    });
  });

  it('allows implicit field boundaries without commas', () => {
    expect(parseSelector('id status')).toEqual({
      fields: [
        { name: 'id', children: [] },
        { name: 'status', children: [] },
      ],
    });
  });

  it('rejects aliases', () => {
    expect(() => parseSelector('bytesBilled:totalBytesBilled')).toThrow(BqInspectFailure);
  });

  it('rejects wildcards', () => {
    expect(() => parseSelector('*')).toThrow(BqInspectFailure);
  });
});
