if (Symbol.metadata === undefined) {
  Reflect.defineProperty(Symbol, 'metadata', {
    value: Symbol.for('Symbol.metadata'),
  });
}
export * from './decorators';
export * from './runtime';
