import { type RegisteredOption } from '../utils/metadata';

export interface OptionOptions {
  description?: string;
  short?: string;
}

export type OptionValue = boolean | string;

export function Option(options: OptionOptions = {}) {
  return <This, Value extends OptionValue>(
    _target: undefined,
    context: ClassFieldDecoratorContext<This, Value>,
  ) => {
    if (!context.static) {
      throw new Error(
        `@Option() can only be used on static properties. Property "${String(context.name)}" is not static.`,
      );
    }
    context.metadata.options ??= {};

    return (initialValue: Value): Value => {
      Reflect.set(<object>context.metadata.options, context.name, {
        ...options,
        type: typeof initialValue === 'boolean' ? 'boolean' : 'string',
        defaultValue: initialValue,
      } satisfies RegisteredOption);

      return initialValue;
    };
  };
}
