import {
  DATASETS_GET_USAGE,
  GLOBAL_USAGE,
  JOBS_GET_USAGE,
  JOBS_LIST_USAGE,
  SCHEMA_INPUT_USAGE,
  SCHEMA_OUTPUT_USAGE,
  SCHEMA_SELECTOR_USAGE,
  SCHEMA_USAGE,
  TABLES_GET_USAGE,
  TABLES_LIST_USAGE,
} from './cli-usage';

function commandHelpForKey(key: string): string | undefined {
  switch (key) {
    case 'schema input':
      return SCHEMA_INPUT_USAGE;
    case 'schema output':
      return SCHEMA_OUTPUT_USAGE;
    case 'schema selector':
      return SCHEMA_SELECTOR_USAGE;
    case 'schema':
      return SCHEMA_USAGE;
    case 'jobs get':
      return JOBS_GET_USAGE;
    case 'jobs list':
      return JOBS_LIST_USAGE;
    case 'datasets get':
      return DATASETS_GET_USAGE;
    case 'tables list':
      return TABLES_LIST_USAGE;
    case 'tables get':
      return TABLES_GET_USAGE;
    default:
      return undefined;
  }
}

export function stripTrailingHelpFlags(argv: string[]): { argv: string[]; wantsHelp: boolean } {
  const copy = [...argv];
  let wantsHelp = false;

  while (
    copy.length > 0 &&
    (copy[copy.length - 1] === '--help' || copy[copy.length - 1] === '-h')
  ) {
    wantsHelp = true;
    copy.pop();
  }

  return { argv: copy, wantsHelp };
}

/**
 * Returns help text when the user asked for help, or null to continue normal dispatch.
 * Empty argv (no command) is handled by the caller with GLOBAL_USAGE.
 */
export function resolveHelpText(argv: string[], wantsHelp: boolean): string | null {
  if (!wantsHelp) {
    return null;
  }

  const key = argv.join(' ');
  const usage = commandHelpForKey(key);

  if (usage !== undefined) {
    return usage;
  }

  if (argv.length > 0) {
    return `${GLOBAL_USAGE}\n\nUnknown command: ${key}`;
  }

  return GLOBAL_USAGE;
}
