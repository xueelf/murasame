import { Program, Command, Option, execute } from '@/index';
import { promptText } from '@/prompts';
import { colorize } from '@/utils/terminal';

const KOKKORO = colorize(['#57b497', 'bold'], 'Kokkoro');

@Command({
  name: 'start',
  category: 'runtime',
  description: 'Start the kokkoro bot process.',
  examples: [
    { syntax: 'kokkoro start', description: 'Start the kokkoro bot process.' },
  ],
  bottom: [
    'This command will start the bot and keep it running until you stop it.',
  ],
})
class StartCommand {
  @Option({ short: 'd', description: 'Enable debug mode' })
  static debug: boolean = false;
  @Option({ description: 'Specify config file' })
  static filename: string = 'kokkoro.json';

  constructor() {
    if (StartCommand.debug) {
      console.log('Debug mode is enabled.');
    }
    console.log('Starting the kokkoro bot...');
    console.log(`Config file: ${StartCommand.filename}`);
  }
}

@Command({
  name: 'test',
  category: 'runtime',
  description: 'Run unit tests in the current plugin project.',
})
class TestCommand {
  constructor() {
    console.log('Running plugin tests...');
  }
}

@Command({
  name: 'init',
  category: 'project',
  description: 'Initialize a new bot project from template.',
})
class InitCommand {
  @Option({ description: 'Specify config file' })
  static filename: string = 'kokkoro.json';

  constructor() {
    const name = promptText('Enter your bot name');

    console.log(name);
    console.log('Initializing a new kokkoro project...');
    console.log(`Filename: ${InitCommand.filename}`);
  }
}

@Command({
  name: 'create',
  category: 'project',
  args: '<plugin>',
  aliases: 'c',
  description: 'Create a new kokkoro plugin template.',
})
class CreateCommand {
  constructor(name: string) {
    console.log(`Creating plugin template for: ${name}`);
  }
}

@Command({
  name: 'install',
  category: 'core',
  aliases: 'i',
  description: 'Install dependencies for the bot project.',
})
class InstallCommand {
  constructor() {
    console.log('Installing dependencies...');
  }
}

@Command({
  name: 'link',
  category: 'core',
  args: '<plugin>',
  description: 'Link a local plugin during development.',
})
class LinkCommand {
  constructor(plugin?: string) {
    console.log(`Linking local plugin: ${plugin || 'all'}`);
  }
}

@Command({
  name: 'config',
  category: 'core',
  examples: [
    { syntax: 'set <key> <val>', description: 'Set a global config value' },
    { syntax: 'get <key>', description: 'Get a global config value' },
  ],
})
class ConfigCommand {
  constructor() {
    console.log('Managing configuration...');
  }
}

@Program({
  name: 'kokkoro',
  version: '3.0.0',
  description: `${KOKKORO} is a cute framework to build QQ bot.`,
  categories: {
    runtime: 'magenta',
    core: 'blue',
    project: 'cyan',
  },
  details: {
    'Learn more about Kokkoro:': colorize('cyan', 'https://kokkoro.js.org'),
  },
  commands: [
    StartCommand,
    TestCommand,
    InitCommand,
    CreateCommand,
    InstallCommand,
    LinkCommand,
    ConfigCommand,
  ],
})
class KokkoroProgram {}

execute(KokkoroProgram);
