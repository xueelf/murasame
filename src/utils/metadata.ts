import type {
  CommandOptions,
  OptionOptions,
  OptionValue,
  ProgramOptions,
} from '../decorators';

export interface RegisteredOption extends OptionOptions {
  type: 'boolean' | 'string';
  defaultValue: OptionValue;
}

type Metadata = {
  program?: ProgramOptions;
  command?: CommandOptions;
  options?: Record<string, RegisteredOption>;
};

function isMetadata(value: unknown): value is Metadata {
  return value !== null && typeof value === 'object';
}

export function getMetadata(target: object): Metadata | undefined {
  if (Symbol.metadata === undefined) {
    return undefined;
  }
  const metadata = Reflect.get(target, Symbol.metadata);

  return isMetadata(metadata) ? metadata : undefined;
}

export function getProgramOptions(target: object): ProgramOptions | undefined {
  return getMetadata(target)?.program;
}

export function getCommandOptions(target: object): CommandOptions | undefined {
  return getMetadata(target)?.command;
}

export function getOptionRegistry(
  target: object,
): Record<string, RegisteredOption> | undefined {
  return getMetadata(target)?.options;
}
