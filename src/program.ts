import minimist, { Opts } from 'minimist';
import { Order } from './order';

export interface ProgramConfig {
  name?: string;
  prefix?: string;
  version?: string;
  description?: string;
}

export class Murasame {
  public config?: ProgramConfig;
  public orders: Order[];

  constructor(private options?: Opts) {
    this.orders = [];
    this.config = <ProgramConfig>this.constructor[Symbol.metadata]?.config;
  }

  public get prefix(): string | undefined {
    return this.config?.prefix;
  }

  public static debug(argv: string[] | string) {
    if (typeof argv === 'string') {
      argv = argv.split(' ');
    }
    console.log(minimist(argv));
  }

  private getStatement(name: string): string {
    const prefix = this.config?.prefix;
    return prefix ? `  $ ${prefix} ${name}` : `  $ ${name}`;
  }

  public parse(): void {
    const argv = process.argv.slice(2);
    const { _, ...query } = minimist(argv, this.options);

    if (this.prefix && this.prefix !== _.shift()) {
      return this.help();
    }

    for (const order of this.orders) {
      if (!order.isMatched(_)) {
        continue;
      }
      return order.action(query);
    }
    return this.help();
  }

  public help() {
    const name = this.config?.name;
    const message = name ? [name] : [];
    const statements = ['Usage:'];

    for (const order of this.orders) {
      const statement = this.getStatement(order.name);
      statements.push(statement);
    }
    message.push(statements.join('\n'));

    if (this.config?.description) {
      message.push(this.config.description);
    }
    console.log(message.join('\n\n'));
  }
}
