import { type ThemeColor } from '@/utils/terminal';

export type CommandClass = abstract new (...args: never[]) => object;

export interface ProgramOptions {
  name?: string;
  description?: string;
  version?: string;
  prefix?: string;
  commands?: readonly CommandClass[];
  categories?: Readonly<Record<string, ThemeColor | readonly ThemeColor[]>>;
  details?: Readonly<Record<string, string>>;
}

export function Program(options: ProgramOptions = {}) {
  return (_target: unknown, context: ClassDecoratorContext) => {
    context.metadata.program = options;
  };
}
