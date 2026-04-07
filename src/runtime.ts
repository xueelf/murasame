import { parseArgs } from 'util';
import type { CommandOptions } from '@/decorators/Command';
import type { CommandClass, ProgramOptions } from '@/decorators/Program';
import {
  getCommandOptions,
  getOptionRegistry,
  getProgramOptions,
  type RegisteredOption,
} from '@/utils/metadata';
import { colorize, type ThemeColor, visibleTextWidth } from '@/utils/terminal';

type ProgramClass = abstract new (...args: never[]) => object;

type ParseOptionSpec = {
  type: 'boolean' | 'string';
  short?: string;
};

interface CommandDescriptor {
  classRef: CommandClass;
  command: CommandOptions;
  registeredOptions: Record<string, RegisteredOption>;
}

interface FlagHelpRow {
  renderedFlag: string;
  rawWidth: number;
  description: string;
}

function getExecutableName(programOptions: ProgramOptions): string {
  return programOptions.prefix ?? programOptions.name ?? 'cli';
}

function getCommandAliases(
  aliases: CommandOptions['aliases'],
): readonly string[] {
  if (typeof aliases === 'string') {
    return [aliases];
  }
  return aliases ?? [];
}

function getCommandDescriptors(
  programOptions: ProgramOptions,
): CommandDescriptor[] {
  const descriptors: CommandDescriptor[] = [];

  for (const classRef of programOptions.commands ?? []) {
    descriptors.push({
      classRef,
      command: getCommandOptions(classRef) ?? { name: classRef.name },
      registeredOptions: getOptionRegistry(classRef) ?? {},
    });
  }

  return descriptors;
}

function getCommandIndex(argv: readonly string[]): number {
  return argv.findIndex(argument => !argument.startsWith('-'));
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function buildParseOptions(
  registeredOptions: Readonly<Record<string, RegisteredOption>>,
): Record<string, ParseOptionSpec> {
  const parseOptions: Record<string, ParseOptionSpec> = {
    help: { type: 'boolean', short: 'h' },
  };

  for (const optionName in registeredOptions) {
    const registeredOption = registeredOptions[optionName];

    if (!registeredOption) {
      continue;
    }

    parseOptions[optionName] = registeredOption.short
      ? { type: registeredOption.type, short: registeredOption.short }
      : { type: registeredOption.type };
  }

  return parseOptions;
}

function getParsedOptionValue(
  parsedValues: ReturnType<typeof parseArgs>['values'],
  optionName: string,
): boolean | string | undefined {
  const parsedValue = parsedValues[optionName];

  return typeof parsedValue === 'boolean' || typeof parsedValue === 'string'
    ? parsedValue
    : undefined;
}

function normalizeExampleSyntax(
  executableName: string,
  commandName: string,
  syntax: string,
): string {
  if (syntax.startsWith(`${executableName} ${commandName}`)) {
    return syntax;
  }

  if (syntax.startsWith(commandName)) {
    return `${executableName} ${syntax}`;
  }

  return `${executableName} ${commandName}${syntax ? ` ${syntax}` : ''}`;
}

function getInlineSynopsis(
  executableName: string,
  commandOptions: CommandOptions,
  syntax?: string,
): string {
  if (commandOptions.args && !syntax) {
    return commandOptions.args;
  }

  if (!syntax) {
    return '';
  }

  const normalizedSyntax = normalizeExampleSyntax(
    executableName,
    commandOptions.name,
    syntax,
  );
  const prefix = `${executableName} ${commandOptions.name}`;

  return normalizedSyntax.startsWith(prefix)
    ? normalizedSyntax.slice(prefix.length).trim()
    : syntax;
}

function findCommandPalette(
  categories: Readonly<Record<string, ThemeColor | readonly ThemeColor[]>>,
  category: string | undefined,
): ThemeColor | readonly ThemeColor[] | undefined {
  if (!category) {
    return undefined;
  }

  return categories[category];
}

function createCommandName(
  commandName: string,
  theme?: ThemeColor | readonly ThemeColor[],
): string {
  const boldCommandName = colorize('bold', commandName);

  return theme ? colorize(theme, boldCommandName) : boldCommandName;
}

function createFlagHelpRow(
  optionName: string,
  registeredOption: RegisteredOption,
): FlagHelpRow {
  const baseFlag = registeredOption.short
    ? `-${registeredOption.short}, --${optionName}`
    : `    --${optionName}`;
  const rawWidth =
    baseFlag.length + (registeredOption.type === 'string' ? 6 : 0);

  return {
    renderedFlag:
      colorize('cyan', baseFlag) +
      (registeredOption.type === 'string'
        ? colorize('cyan', '=') + colorize(['dim', 'cyan'], '<val>')
        : ''),
    rawWidth,
    description: registeredOption.description ?? '',
  };
}

function printTopLevelHelp(
  programOptions: ProgramOptions,
  commands: readonly CommandDescriptor[],
): void {
  const executableName = getExecutableName(programOptions);
  const versionSuffix = programOptions.version
    ? ` ${colorize('dim', `(${programOptions.version})`)}`
    : '';
  const description =
    programOptions.description ?? `${executableName} is a command line tool.`;

  console.log(`${description}${versionSuffix}\n`);
  console.log(
    `${colorize('bold', 'Usage:')} ${colorize(['green', 'bold'], `${executableName} <command>`)} ${colorize('cyan', '[...flags]')} ${colorize('bold', '[...args]')}\n`,
  );
  console.log(colorize('bold', 'Commands:'));

  const categories = programOptions.categories ?? {};
  const categorizedCommands = new Map<string, CommandDescriptor[]>();

  for (const command of commands) {
    const categoryName = command.command.category ?? 'default';
    const groupedCommands = categorizedCommands.get(categoryName);

    if (groupedCommands) {
      groupedCommands.push(command);
      continue;
    }

    categorizedCommands.set(categoryName, [command]);
  }

  const orderedCategories = Array.from(categorizedCommands.keys()).sort(
    (leftCategory, rightCategory) => {
      const knownCategoryOrder = Object.keys(categories);
      const leftIndex = knownCategoryOrder.indexOf(leftCategory);
      const rightIndex = knownCategoryOrder.indexOf(rightCategory);

      if (leftIndex !== -1 && rightIndex !== -1) {
        return leftIndex - rightIndex;
      }

      if (leftIndex !== -1) {
        return -1;
      }

      if (rightIndex !== -1) {
        return 1;
      }

      return 0;
    },
  );

  let isFirstCategory = true;
  for (const category of orderedCategories) {
    const categoryCommands = categorizedCommands.get(category);

    if (!categoryCommands || categoryCommands.length === 0) {
      continue;
    }

    if (!isFirstCategory) {
      console.log('');
    }
    isFirstCategory = false;

    const categoryPalette = findCommandPalette(categories, category);

    for (const command of categoryCommands) {
      const examples =
        command.command.examples && command.command.examples.length > 0
          ? command.command.examples
          : [
              {
                syntax: command.command.args,
                description: command.command.description,
              },
            ];
      const renderedCommandName = createCommandName(
        command.command.name,
        categoryPalette,
      );

      for (let index = 0; index < examples.length; index += 1) {
        const example = examples[index];

        if (!example) {
          continue;
        }

        const isFirstLine = index === 0;
        const inlineSynopsis = getInlineSynopsis(
          executableName,
          command.command,
          example.syntax,
        );
        const descriptionText =
          example.description ??
          (isFirstLine ? (command.command.description ?? '') : '');

        let line = '  ';
        let currentWidth = 2;

        if (isFirstLine) {
          line += renderedCommandName;
          currentWidth += visibleTextWidth(command.command.name);
        }

        const synopsisPadding = Math.max(
          isFirstLine ? 1 : 0,
          12 - currentWidth,
        );
        line += ' '.repeat(synopsisPadding);
        currentWidth += synopsisPadding;

        if (inlineSynopsis) {
          line += colorize('dim', inlineSynopsis);
          currentWidth += visibleTextWidth(inlineSynopsis);
        }

        const descriptionPadding = Math.max(1, 33 - currentWidth);
        line += ' '.repeat(descriptionPadding);

        const firstAlias = getCommandAliases(command.command.aliases)[0];
        const aliasHint =
          isFirstLine && firstAlias
            ? ` ${colorize('dim', `(${executableName} ${firstAlias})`)}`
            : '';

        console.log(`${line}${descriptionText}${aliasHint}`);
      }
    }
  }

  const helpLabel = `${colorize('dim', '<command>')} ${colorize(['cyan', 'bold'], '--help')}`;
  const helpPadding = ' '.repeat(
    Math.max(0, 31 - visibleTextWidth('<command> --help')),
  );

  console.log(`\n  ${helpLabel}${helpPadding}Print help text for command.`);

  if (programOptions.details) {
    console.log('');
    for (const [label, value] of Object.entries(programOptions.details)) {
      const detailPadding = ' '.repeat(
        Math.max(0, 33 - visibleTextWidth(label)),
      );
      console.log(`${label}${detailPadding}${value}`);
    }
  }
}

function printCommandHelp(
  programOptions: ProgramOptions,
  command: CommandDescriptor,
): void {
  const executableName = getExecutableName(programOptions);
  const argsText = command.command.args ? ` ${command.command.args}` : '';

  console.log(
    `${colorize('bold', 'Usage:')} ${colorize(['green', 'bold'], `${executableName} ${command.command.name}`)} ${colorize('cyan', '[flags]')}${argsText}`,
  );

  const aliases = getCommandAliases(command.command.aliases);
  if (aliases.length > 0) {
    const renderedAliases = aliases
      .map(alias => colorize(['green', 'bold'], `${executableName} ${alias}`))
      .join(', ');

    console.log(`${colorize('bold', 'Alias:')} ${renderedAliases}`);
  }

  if (command.command.description) {
    console.log(`\n  ${command.command.description}`);
  }

  console.log('');
  console.log(colorize('bold', 'Flags:'));

  const flagRows: FlagHelpRow[] = [
    {
      renderedFlag: colorize('cyan', '-h, --help'),
      rawWidth: 10,
      description: 'Print help text for command.',
    },
  ];

  for (const optionName in command.registeredOptions) {
    const registeredOption = command.registeredOptions[optionName];

    if (!registeredOption) {
      continue;
    }

    flagRows.push(createFlagHelpRow(optionName, registeredOption));
  }

  const maxFlagWidth = flagRows.reduce(
    (maxWidth, flagRow) => Math.max(maxWidth, flagRow.rawWidth),
    10,
  );
  const alignColumn = Math.max(25, maxFlagWidth + 4);

  for (const flagRow of flagRows) {
    const padding = ' '.repeat(
      Math.max(1, alignColumn - (2 + flagRow.rawWidth)),
    );
    console.log(`  ${flagRow.renderedFlag}${padding}${flagRow.description}`);
  }

  if (command.command.examples && command.command.examples.length > 0) {
    console.log(`\n${colorize('bold', 'Examples:')}`);
    for (let index = 0; index < command.command.examples.length; index += 1) {
      const example = command.command.examples[index];

      if (!example) {
        continue;
      }

      if (example.description) {
        console.log(`  ${colorize('dim', example.description)}`);
      }

      const renderedSyntax = normalizeExampleSyntax(
        executableName,
        command.command.name,
        example.syntax ?? '',
      );
      console.log(`  ${colorize(['green', 'bold'], renderedSyntax)}`);

      if (index < command.command.examples.length - 1) {
        console.log('');
      }
    }
  }

  if (command.command.bottom && command.command.bottom.length > 0) {
    console.log('');
    for (const line of command.command.bottom) {
      console.log(line);
    }
  }
}

function printUnknownCommand(
  programOptions: ProgramOptions,
  commandName: string,
): void {
  const executableName = getExecutableName(programOptions);

  console.error(colorize('red', `Command "${commandName}" not found.`));
  console.log(
    `Run ${colorize(['green', 'bold'], `${executableName} --help`)} to see available commands.`,
  );
}

export function execute(
  ProgramClass: ProgramClass,
  argv: readonly string[] = process.argv.slice(2),
): void {
  const programOptions = getProgramOptions(ProgramClass) ?? {};
  const commands = getCommandDescriptors(programOptions);
  const commandIndex = getCommandIndex(argv);

  if (commandIndex === -1) {
    if (argv.includes('-v') || argv.includes('--version')) {
      console.log(programOptions.version ?? '0.0.0');
      return;
    }

    printTopLevelHelp(programOptions, commands);
    return;
  }

  const commandName = argv[commandIndex];

  if (!commandName) {
    printTopLevelHelp(programOptions, commands);
    return;
  }

  const matchedCommand = commands.find(
    command =>
      command.command.name === commandName ||
      getCommandAliases(command.command.aliases).includes(commandName),
  );

  if (!matchedCommand) {
    printUnknownCommand(programOptions, commandName);
    process.exit(1);
  }

  let parsedArguments: ReturnType<typeof parseArgs>;
  try {
    parsedArguments = parseArgs({
      args: argv.slice(commandIndex + 1),
      options: buildParseOptions(matchedCommand.registeredOptions),
      strict: true,
      allowPositionals: true,
    });
  } catch (error: unknown) {
    console.error(colorize('red', `Error: ${toErrorMessage(error)}`));
    process.exit(1);
  }

  if (parsedArguments.values.help === true) {
    printCommandHelp(programOptions, matchedCommand);
    return;
  }

  for (const optionName in matchedCommand.registeredOptions) {
    const parsedValue = getParsedOptionValue(
      parsedArguments.values,
      optionName,
    );

    if (parsedValue !== undefined) {
      Reflect.set(matchedCommand.classRef, optionName, parsedValue);
    }
  }

  Reflect.construct(matchedCommand.classRef, parsedArguments.positionals);
}
