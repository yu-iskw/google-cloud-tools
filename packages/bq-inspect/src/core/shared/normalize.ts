export function normalizeOptionalTrimmed(value: string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }

  const trimmed = value.trim();

  return trimmed.length === 0 ? undefined : trimmed;
}

export function normalizeDelegateList(value: string[] | string | undefined): string[] {
  if (value === undefined) {
    return [];
  }

  const list = Array.isArray(value) ? value : [value];

  return list.map((entry) => entry.trim()).filter((entry) => entry.length > 0);
}
