import { SPACE, colorize, writeText } from '../utils/terminal';

export interface InputOptions {
  default?: string;
}

function resolveDefaultValue(
  options?: InputOptions | string,
): string | undefined {
  if (typeof options === 'string') {
    return options;
  }
  return options?.default;
}

export function input(
  message: string,
  options?: InputOptions | string,
): string | null {
  const defaultValue = resolveDefaultValue(options);

  if (message.length > 0) {
    const suffix = defaultValue ? `(${defaultValue}):` : ':';

    writeText(colorize('cyan', message), SPACE, colorize('dim', suffix));
  }
  const result = prompt('');

  if (result === null) {
    return defaultValue ?? null;
  }

  const trimmedResult = result.trim();
  return trimmedResult === '' ? (defaultValue ?? '') : trimmedResult;
}
