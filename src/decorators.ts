import type { Murasame, ProgramConfig } from './program';
import { Order } from './order';

export function Program<T extends new () => Murasame>(config: ProgramConfig) {
  return function (target: T, context: ClassDecoratorContext<T>) {
    context.metadata.config = config;
  };
}

export function Command(statement: string) {
  return function (target: Function, context: ClassMethodDecoratorContext<Murasame>) {
    context.addInitializer(function (this: Murasame) {
      const order = new Order(statement, target);
      this.orders.push(order);
    });
  };
}
