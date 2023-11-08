# murasame

[![package](https://img.shields.io/npm/v/murasame?color=3CB371&label=murasame&style=flat-square&labelColor=FAFAFA&logo=npm)](https://www.npmjs.com/package/murasame)
[![engine](https://img.shields.io/node/v/murasame?color=339933&style=flat-square&labelColor=FAFAFA&logo=Node.js)](https://nodejs.org)

Read this in other languages: English | [简体中文](./README.zh.md)

## Introduction

This project is an implementation of a command line interfaces decorators.

This project was originally created for personal use and had no intention of being open source, as its applicability was limited. However, with JavaScript soon to support decorators, it would be my greatest honor if my code can provide some level of assistance to you.

### Chaining

```javascript
const cli = require('other package');

cli
  .name('my-tools')
  .version('0.0.1')
  .description('Some of my cli tools.');

cli
  .command('test')
  .action(() => {
    // ...
  });

cli.parse();
```

### Decorators

```typescript
import { Murasame, Program, Command } from 'murasame';

@Program({
  name: 'my-tools',
  version: '0.0.1',
  description: 'Some of my cli tools.',
})
class Tools extends Murasame {
  @Command('test')
  test() {
    // ...
  }
}

const tools = new Tools();
tools.parse();
```

This is so cool, isn't it?

## Install

> The current decorator is in [stage 3](https://github.com/tc39/proposal-decorators) state in JavaScript, and this project is currently a pure TypeScript package that you can use tools such as ts-node to work with.

```shell
npm i typescript ts-node murasame
```

## Usage

You need to set your `tsconfig.json` compilation `target` to `es2022` or below, and configure your `lib` setting to either include `"esnext"` or `"esnext.decorators"`.

```json
{
  "compilerOptions": {
    "target": "es2022",
    "lib": ["es2022", "esnext.decorators"]
  }
}
```

Example:

```typescript
import { Murasame, Program, Command } from 'murasame';

@Program({
  name: 'my-tools',
  prefix: 'tool',
  version: '0.0.1',
  description: 'Some of my cli tools.',
})
class Tools extends Murasame {
  @Command('build')
  build(query: Record<string, unknown>) {
    console.log(query);
  }

  @Command('request')
  request(query: Record<string, unknown>) {
    console.log(query);
  }
}

const tools = new Tools();
tools.parse();
```

```shell
$ ts-node index.ts
my-tools

Usage:
  $ tool build
  $ tool request

Some of my cli tools.
$ ts-node index.ts tool build -d --outdir lib
{ d: true, outdir: 'lib' }
```

## References

#### Murasame.debug(argv: string | string[])

`debug()` is a static method that can parse and print out the parameters of the current command.

#### Murasame(options?: minimist.Opts)

You can pass in the [options of minimist](https://github.com/minimistjs/minimist#methods) to change the parameter parsing of the command.

```typescript
class Tools extends Murasame {
  constructor() {
    super({
      boolean: true,
    });
  }
}
```

#### new Murasame().parse()

Parse the parameters of the current `process.argv` and execute the corresponding method.

## FAQ

### What does this project name mean?

Murasame is a word that originated from Japan (村雨, ムラサメ, literally "village rain", though often translated as "autumn rain"), refers to a type of rain that falls hard, then gently, in fits and starts. In Japanese poetic tradition, it is particularly associated with the cold rains of autumn.

Additionally, it is also the name of a character in the game "Senren ＊ Banka", She assists her master in various things. I have a fondness for rain and also for 'ムラサメ' (murasame), so I chose it as the name for this project.

### Why didn't you provide an option decorators?

This project was initially developed to meet my personal requirements. For parameter parsing, I utilized minimist to handle basic command processing in everyday situations. Consequently, I did not implement any validation for the options.

However, once decorators are supported in JavaScript, I will turn murasame into a truly meaningful package. (●'◡'●)

## Thank

The package name "murasame" had already been in use initially, but it was not being actively maintained. After attempting to reach out to the author, they transferred the package to me. I am deeply grateful for this!
