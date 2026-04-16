# murasame

Murasame is a decorator-based CLI framework developed on top of Bun. You can easily create your own command-line tools using the latest ECMAScript decorator syntax.

Read in other languages: English | [简体中文](./README.zh.md)

## Introduction

As we all know, in traditional development, if you want to develop a command-line tool using JavaScript, almost all packages on npm are implemented through **chaining**:

```javascript
const cli = require('other package');

function reverseString(text) {
  return text.split('').reverse().join('');
}

cli
  .name('my-tools')
  .version('1.1.4')
  .description('Some of my command line tools.');

cli
  .command('echo')
  .description('Output a text to the terminal.')
  .argument('<text>')
  .option('-r, --reverse', 'Reverse of the string.', false)
  .action(({ args, options }) => {
    const { text } = args;
    const { reverse } = options;

    console.log(reverse ? reverseString(text) : text);
  });

cli.parse();
```

In the early days, JavaScript did not have the concept of decorators. Decorators in TypeScript were implemented through the [reflect-metadata](https://www.npmjs.com/package/reflect-metadata) dependency library, which is not an official ECMAScript specification. Now, we can directly run native decorators through Bun:

```typescript
import { Program, Command, Option, execute } from 'murasame';

@Command({
  name: 'echo',
  args: '<text>',
  description: 'Output a text to the terminal.',
})
class EchoCommand {
  @Option({ short: 'r', description: 'Reverse of the string.' })
  static reverse: boolean = false;

  constructor(text: string) {
    console.log(EchoCommand.reverse ? this.reverseString(text) : text);
  }
  reverseString(text: string) {
    return text.split('').reverse().join('');
  }
}

@Program({
  name: 'my-tools',
  version: '1.1.4',
  description: 'Some of my command line tools.',
  commands: [EchoCommand],
})
class Tools {}

execute(Tools);
```

Isn't this cool? The code is much more readable and conducive to modular management.

## Installation

> Since the current decorators are in the [stage 3](https://github.com/tc39/proposal-decorators) phase, this project is currently a pure TypeScript package. You can simply use Bun to run it directly.

### What is Bun?

Bun is a JavaScript runtime, similar to Node.js and Deno, but it can natively execute TypeScript code, and extended support for the new decorators was added in v1.3.10.

You can install it by executing the corresponding scripts in your terminal:

```shell
# macOS & Linux
curl -fsSL https://bun.com/install | bash
```

```shell
# Windows
powershell -c "irm bun.sh/install.ps1|iex"
```

In addition, you can visit the [Bun official documentation](https://bun.com/docs/installation#installation) to view more installation methods.

### Dependencies

After completing the preparation work, we can simply add the dependencies using `bun add`:

```shell
bun add murasame
```

## Quick Start

Here is a complete single-file example showing how to quickly build a command-line tool with arguments and options using Murasame:

```typescript
import { Program, Command, Option, execute } from 'murasame';

@Command({
  name: 'echo',
  args: '<text>',
  description: 'Output a text to the terminal.',
})
class EchoCommand {
  @Option({ short: 'r', description: 'Reverse of the string.' })
  static reverse: boolean = false;

  constructor(message: string) {
    console.log(EchoCommand.reverse ? this.reverseString(message) : message);
  }
  reverseString(text: string) {
    return text.split('').reverse().join('');
  }
}

@Program({
  name: 'my-tools',
  version: '1.1.4',
  description: 'Some of my command line tools.',
  commands: [EchoCommand],
})
class Tools {}

execute(Tools);
```

If you've **manually configured** the `lib` option in the `compilerOptions` node of your `tsconfig.json`, you'll need to append `"ESNext.Decorators"` to get the latest decorator syntax support when using native TypeScript decorators:

```json
{
  "compilerOptions": {
    "lib": ["ESNext", "ESNext.Decorators"]
  }
}
```

After saving the `cli.ts` code, you can run it directly with Bun. Murasame will automatically collect the defined decorator metadata upon application startup, and finally output the CLI panel:

```shell
$ bun cli.ts
```

```
Some of my command line tools. (1.1.4)

Usage: my-tools <command> [...flags] [...args]

Commands:
  echo      <text>               Output a text to the terminal.

  <command> --help               Print help text for command.
```

If you don't know what options a command supports, you can also append `-h` to get the instruction documentation for that command:

```shell
$ bun cli.ts echo -h
```

```
Usage: my-tools echo [flags] <text>

  Output a text to the terminal.

Flags:
  -h, --help             Print help text for command.
  -r, --reverse          Reverse of the string.
```

By providing the corresponding command, you can run the program immediately, and the positional arguments will be automatically injected into the constructor by their declared order:

```shell
$ bun cli.ts echo ciallo
```

```
ciallo
```

Append the option short name `-r` to output the reversed string:

```shell
$ bun cli.ts echo ciallo -r
```

```
ollaic
```

## API & Concepts

Murasame deeply replicates the default behavior of Bun's native CLI, aiming to bring a consistent and harmonious experience to developers using Bun.

### Program Entry: `@Program(options?: ProgramOptions)`

`@Program` is the application's primary entry decorator. It is used to define global configurations of the CLI and serves as a mounting point for all commands:

```typescript
@Program({
  name: 'my-tools',
  version: '1.1.4',
  description: 'Some of my command line tools.',
  commands: [CdCommand, EchoCommand, LsCommand, PingCommand, RmCommand],
  categories: {},
  details: {
    Blog: 'https://blog.yuki.sh',
    GitHub: 'https://github.com/xueelf',
  },
})
class Tools {}
```

- **`name`**: Program name.
- **`version`**: The current release version number. You can query it using `--version` or `-v`.
- **`description`**: The description text of the program, which will be displayed at the very top.
- **`commands`**: Available commands. Pass them as an array (classes decorated with `@Command`).
- **`categories`** _(optional)_: Pass in corresponding category names and color styles to arrange commands into categories.
- **`details`** _(optional)_: Add extra details at the very bottom of the CLI panel. Mostly used for related extension hyperlinks, copyright declarations, or author info.

#### version

The CLI will create `--version` and `-v` options by default.

#### categories

If your commands gradually increase over iterations, you can pass this object to further categorize commands in the terminal visually.

If `categories` is not configured, all commands will be stacked under the _Commands:_ label in the order they are passed to `commands`. For example, in the code snippet above, without specifying categories, the layout in the terminal looks like this:

```
Some of my command line tools. (1.1.4)

Usage: my-tools <command> [...flags] [...args]

Commands:
  cd        <path>               Change the current working directory.
  echo      <text>               Output a text to the terminal.
  ls
  ping      <host>               Check the network connectivity to a host.
  rm        <path>               Remove a file or directory.

  <command> --help               Print help text for command.

Blog                             https://blog.yuki.sh
GitHub                           https://github.com/xueelf
```

If configured like the snippet above, and specifying the `category` property in the corresponding command decorator (`@Command`), the CLI layout will change as follows:

```
Some of my command line tools. (1.1.4)

Usage: my-tools <command> [...flags] [...args]

Commands:
  cd        <path>               Change the current working directory.
  ls
  rm        <path>               Remove a file or directory.

  ping      <host>               Check the network connectivity to a host.

  echo      <text>               Output a text to the terminal.

  <command> --help               Print help text for command.

Blog                             https://blog.yuki.sh
GitHub                           https://github.com/xueelf
```

Different categories will be separated by newlines and sorted alphabetically.

By default, the command names within the _Commands:_ label will output in black bold text. We can customize the text style through `categories`:

```typescript
@Program({
  categories: {
    file: 'blue',
    network: ['magenta', 'underline'],
    system: '#114514',
  },
})
class Tools {}
```

### Defining Commands: `@Command(options: CommandOptions | string)`

`@Command` is used to declare an individual executable command. When this command is invoked, Murasame will parse the arguments input in the terminal and inject them sequentially into the instance object of that class:

```typescript
@Command({
  name: 'echo',
  aliases: ['print'],
  args: '<text>',
  description: 'Output a text to the terminal.',
  examples: [
    {
      description: 'Print a text',
      syntax: 'my-tools echo ciallo',
    },
    {
      description: 'Print a text in reverse',
      syntax: 'my-tools echo ciallo -r',
    },
  ],
})
class EchoCommand {
  @Option({ short: 'r', description: 'Reverse of the string.' })
  static reverse: boolean = false;

  constructor(message: string) {
    console.log(EchoCommand.reverse ? this.reverseString(message) : message);
  }
  reverseString(text: string) {
    return text.split('').reverse().join('');
  }
}
```

- **`name`**: Command name.
- **`args`**: Arguments information.
- **`aliases`**: Invocation aliases.
- **`category`**: Command category, corresponding to the `categories` key in `@Program`.
- **`description`**: The description text of the command, which will automatically align and display on the right side of the command.
- **`examples`**: Add usage examples for the current command. Accepts an array of objects containing `syntax` and `description`.
- **`bottom`**: Append additional supplementary explanations or prompt texts at the very bottom of the current command's help panel. Supports passing a string or an array composed of multi-line strings.

#### args

`args` is used to define and display the positional arguments required by the current command (such as `<text>`, `[options]`, etc.) in the terminal help prompt. When the command is executed, the underlying engine will inject the consecutive positional arguments it reads into the `constructor` of the command class sequentially, following the original passed-in order:

```typescript
@Command({
  name: 'echo',
  args: '<text>',
})
class EchoCommand {
  constructor(text: string) {
    console.log(text);
  }
}
```

#### aliases

Command aliases are common in CLI utilities. For example, the `npm install` we use frequently can be abbreviated as `npm i`, where `i` serves as an alias for `install`. You can even specify multiple aliases:

```typescript
@Command({
  name: 'install',
  aliases: ['i', 'add'],
})
class InstallCommand {}
```

This way, whether you type `my-tools install`, `my-tools i`, or `my-tools add`, it will invoke the same command.

### Defining Options: `@Option(options?: OptionOptions)`

The option decorator must be applied on the **static properties (`static`)** of the class. The decorator evaluates automatically how this option should be managed based on your initial JavaScript type (`string` or `boolean`):

```typescript
@Command('echo')
class EchoCommand {
  @Option({ short: 'r', description: 'Reverse of the string.' })
  static reverse: boolean = false;

  constructor() {
    console.log(EchoCommand.reverse);
  }
}
```

For instance, a boolean value gets treated as a simple flag switch (providing an input signifies true):

```shell
$ my-tools echo
$ my-tools echo --reverse
$ my-tools echo -r
```

```
false
true
true
```

```typescript
@Command('echo')
class EchoCommand {
  @Option({ short: 'o', description: '' })
  static outfile: string = 'out.txt';

  constructor() {
    console.log(EchoCommand.outfile);
  }
}
```

A string type indicates that it must safely receive a value. When calling, you can pass it separated by a space, or **adjoined by an equals sign**:

```shell
$ my-tools echo --outfile index.txt
$ my-tools echo --outfile=index.txt
$ my-tools echo -o index.txt
$ my-tools echo -oindex.txt
```

```
index.txt
index.txt
index.txt
index.txt
```

In CLI industry standards (like POSIX Utility Syntax Guidelines and GNU Command Line Standards), carrying parameters values with commands is an extremely standard and common practice. Pertaining to argument formats, here is the industry consensus in standard parsers (including Bun's built-in parsing and Node's util.parseArgs):

- Long options
  - `--outfile out.txt` (space): POSIX standard, the broadly acknowledged way to pass values.
  - `--outfile=out.txt` (equals sign)
- Short options
  - `-o out` (space): POSIX standard, the most widely accepted short option format.
  - `-oout` (compact): POSIX standard, trailing compactly, e.g., mysql -uroot -ppassword.
  - `-o=out` (equals sign, non-standard)

The equals sign `=` is traditionally designed specifically for long options (`--outfile=out`) in specifications. Adjoining short options with equals signs technically breaks formal POSIX standardization; however, modern CLI parsing APIs (including parseArgs) strive to present high tolerance towards users, and commonly parse `-o=out` precisely all the same.

### Execution: `execute(ProgramClass)`

When all the commands and configurations have been defined, merely hand over the primary container class annotated with the `@Program` decorator to the `execute` processor:

```typescript
import { execute } from 'murasame';

@Program({
  name: 'my-tools',
  version: '1.1.4',
  description: 'Some of my command line tools.',
  commands: [EchoCommand],
})
class Tools {}

execute(Tools);
```

## Beautiful Aesthetics & Built-in Interactions

It's not constrained to solely CLI decorators alone. Murasame incorporates a lightweight C-FFI layer underneath, allowing us to easily invoke built-in high-performance terminal interactive APIs. Apart from that, text beautification tools are provided.

### Text Coloring: `colorize(color, text)`

If you'd like to add striking colors or decorations (like bold or underline) to the texts output in the terminal, you can use the built-in `colorize` function, which processes text directly into ANSI escape code sequences:

```typescript
import { colorize } from 'murasame';

// Single color
console.log(colorize('cyan', 'Hello, Murasame!'));

// Array combo of colors/formats: [foregroundColor, style]
console.log(colorize(['#57b497', 'bold'], 'Ciallo～(∠·ω< )⌒★'));
```

### Text Input: `promptText(message, options?)`

Blocks the executing main thread, waiting for the user to input a piece of normal text content within the terminal window:

```typescript
import { promptText } from 'murasame/interact';

const answer = promptText('What is your name?', { default: 'Yuki' });
console.log(`Hello, ${answer}!`);
```

### Single Choice List: `select(message, choices)`

Renders a selectable single-choice list on the terminal where users can seamlessly interact using the keyboard (up/down selection and enter to confirm):

```typescript
import { select } from 'murasame/interact';

const framework = select('Choose your favorite framework:', [
  { label: 'Vue', value: 'vue' },
  { label: 'React', value: 'react' },
  { label: 'Svelte', value: 'svelte' },
]);

console.log(`Your choice: ${framework?.value}`);
```

Besides interacting visually with keyboard arrow keys, you can also operate using `j` and `k`. Simultaneously, triggering a double press of `ESC` or directly hitting `Ctrl + c` will cancel the operation.

If you are careful enough, you might have already noticed that whether it's `promptText` or `select`, their terminal layout styling and logical interactive behaviors are entirely identical to the native Bun CLI.

## FAQ

### Origin of the Name

The word _murasame_ is the romaji of the Japanese word "ムラサメ" (usually written in kanji as "村雨", and translated to "Autumn Rain" in English), referring to a kind of rain that is violent at first, then gentle, occurring in fits and starts. In traditional Japanese poetry, it is frequently associated with the cold rain of autumn.

Meanwhile, she is also the name of a character standing from the game SENREN＊BANKA, translated as "丛雨" in Chinese. She handles problems to aid her master and stays by his side managing various issues. I love rain, and I also like Murasame, so I chose it as the name for this project.

## Thanks

The package name "murasame" was originally occupied but remained unmaintained for a relatively long time. After communicating with the author, [Kamata](https://github.com/kamataryo) transferred its publish permissions over to me. Hereby, I express my gratitude once again!
