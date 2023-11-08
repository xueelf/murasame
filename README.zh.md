# murasame

[![package](https://img.shields.io/npm/v/murasame?color=3CB371&label=murasame&style=flat-square&labelColor=FAFAFA&logo=npm)](https://www.npmjs.com/package/murasame)
[![engine](https://img.shields.io/node/v/murasame?color=339933&style=flat-square&labelColor=FAFAFA&logo=Node.js)](https://nodejs.org)

使用其他语言阅读：[English](./README.md) | 简体中文

## 介绍

这个项目是一个命令行的装饰器实现。

该项目最初是为了个人使用而做的，并没有开源的打算。不过，随着 JavaScript 即将支持装饰器，如果我的代码多少能给你带来帮助，那就是我最大的荣幸了。

### 链式调用

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

### 装饰器

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

这很酷，不是么？

## 安装

> 由于当前装饰器处于 [stage 3](https://github.com/tc39/proposal-decorators) 状态，所以该项目目前是一个纯 TypeScript 包，你可以使用 ts-node 等工具来运行。

```shell
npm i typescript ts-node murasame
```

## 使用

你需要将 `tsconfig.json` 中 compilation 下的 `target` 设置为 `es2022` 或更低，并将 `lib` 设置配置为包含 `"esnext"` 或者 `"esnext.decorators"`。

```json
{
  "compilerOptions": {
    "target": "es2022",
    "lib": ["es2022", "esnext.decorators"]
  }
}
```

示例：

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

## 参考

#### Murasame.debug(argv: string | string[])

`debug()` 是一个静态方法，可以解析并打印出当前命令的参数。

#### Murasame(options?: minimist.Opts)

你可以传入 [minimist options](https://github.com/minimistjs/minimist#methods) 来改变命令的参数解析。

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

解析当前 `process.argv` 的参数并执行相应的方法。

## FAQ

### 这个项目名字是什么意思？

Murasame 这个词起源于日本（ムラサメ, 汉字写作“村雨”，在英语中经常被翻译为“秋雨”），指的是一种雨，先猛烈，然后轻柔，时断时续。在日本的诗歌传统中，她经常与秋天的冷雨联系在一起。

同时，她也是游戏《千恋万花》中一个角色的名字，她为主人排忧解难，帮助解决了各种各样的事情。我喜欢下雨，也喜欢“丛雨” （原文 ムラサメ 的国内翻译），所以我选择将她的罗马音作为了这个项目的名字。

### 为什么没有提供一个 Option 装饰器？

这个项目最初是为了满足个人自用开发的，我直接使用了 minimist 来处理命令的参数解析。因为平时只是进行一些简单地命令处理，所以我没有对这些选项进行任何校验。

不过，等 JavaScript 支持了装饰器，我就会把 murasame 变成一个真正意义上的依赖包。(●'◡'●)

## 感谢

包名“murasame”最初已经被使用了，但很长时间都没有较为活跃的维护。在试图联系作者后，他将包权限转交给了我，在这里再次表示感谢！
