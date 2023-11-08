export class Order {
  constructor(public name: string, public action: Function) {}

  public isMatched(argv: string[]): boolean {
    const argc = argv.length;
    const name = argv.join(' ');

    return name === this.name;
  }
}
