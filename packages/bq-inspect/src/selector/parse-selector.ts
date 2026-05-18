import { BqInspectFailure, createBqInspectError } from '../core/shared/errors';

import type { SelectorAst, SelectorField } from './types';

const identStart = /[A-Za-z_]/;
const identChar = /[A-Za-z0-9_]/;

interface ParserState {
  index: number;
}

export function parseSelector(raw: string): SelectorAst {
  const input = raw.trim();

  if (input.length === 0) {
    throw new BqInspectFailure(
      createBqInspectError({
        code: 'BQINSPECT_SELECTOR_INVALID',
        message: 'Selector must not be empty.',
      }),
    );
  }

  const state: ParserState = { index: 0 };
  const fields = parseFields(input, state);

  skipWhitespace(input, state);

  if (state.index < input.length) {
    throw selectorInvalid(`Unexpected trailing input: ${input.slice(state.index)}`);
  }

  if (fields.length === 0) {
    throw selectorInvalid('Selector must include at least one field.');
  }

  return { fields };
}

function selectorInvalid(message: string): BqInspectFailure {
  return new BqInspectFailure(
    createBqInspectError({
      code: 'BQINSPECT_SELECTOR_INVALID',
      message,
    }),
  );
}

function skipWhitespace(input: string, state: ParserState): void {
  while (state.index < input.length && /\s/.test(input[state.index]!)) {
    state.index += 1;
  }
}

function readIdentifier(input: string, state: ParserState): string {
  if (state.index >= input.length || !identStart.test(input[state.index]!)) {
    throw selectorInvalid('Expected a field name.');
  }

  const start = state.index;
  state.index += 1;

  while (state.index < input.length && identChar.test(input[state.index]!)) {
    state.index += 1;
  }

  const name = input.slice(start, state.index);

  if (name === '*') {
    throw selectorInvalid('Wildcard selections are not supported.');
  }

  return name;
}

function parseChildrenBlock(input: string, state: ParserState): SelectorField[] {
  state.index += 1;
  const children = parseFields(input, state);

  if (state.index >= input.length || input[state.index] !== '}') {
    throw selectorInvalid('Unclosed selector block.');
  }

  state.index += 1;

  return children;
}

function rejectUnsupportedSuffix(input: string, state: ParserState): void {
  if (state.index >= input.length) {
    return;
  }

  const ch = input[state.index];

  if (ch === ':') {
    throw selectorInvalid('Selector aliases are not supported.');
  }

  if (ch === '(') {
    throw selectorInvalid('Selector arguments are not supported.');
  }
}

function parseFieldChildren(input: string, state: ParserState): SelectorField[] {
  skipWhitespace(input, state);

  if (state.index < input.length && input[state.index] === '{') {
    return parseChildrenBlock(input, state);
  }

  rejectUnsupportedSuffix(input, state);

  return [];
}

function shouldContinueFieldList(input: string, state: ParserState): boolean {
  skipWhitespace(input, state);

  if (state.index >= input.length) {
    return false;
  }

  const ch = input[state.index]!;

  if (ch === ',') {
    state.index += 1;

    return true;
  }

  if (ch === '}') {
    return false;
  }

  if (identStart.test(ch)) {
    return true;
  }

  throw selectorInvalid(`Unexpected character: ${ch}.`);
}

function parseFields(input: string, state: ParserState): SelectorField[] {
  const fields: SelectorField[] = [];

  while (state.index < input.length) {
    skipWhitespace(input, state);

    if (state.index >= input.length || input[state.index] === '}') {
      break;
    }

    if (input[state.index] === ',') {
      throw selectorInvalid('Unexpected comma.');
    }

    const name = readIdentifier(input, state);
    const children = parseFieldChildren(input, state);

    fields.push({ name, children });

    if (!shouldContinueFieldList(input, state)) {
      break;
    }
  }

  return fields;
}
