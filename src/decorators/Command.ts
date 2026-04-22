export interface CommandExample {
  syntax?: string;
  description?: string;
}

export interface CommandOptions {
  name: string;
  args?: string;
  description?: string;
  category?: string;
  aliases?: string | readonly string[];
  examples?: readonly CommandExample[];
  epilog?: readonly string[];
}

export function Command(options: CommandOptions | string) {
  const normalizedOptions: CommandOptions =
    typeof options === 'string' ? { name: options } : options;

  return (_target: unknown, context: ClassDecoratorContext) => {
    context.metadata.command = normalizedOptions;
  };
}
