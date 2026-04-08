import { describe, expect, test } from 'bun:test';
import { Command, Option, Program } from '@/index';
import { getMetadata, getOptionRegistry } from '@/utils';

describe('decorators', () => {
  test('writes program config to Symbol.metadata', () => {
    @Program({
      name: 'test-cli',
      version: '1.0.0',
    })
    class TestProgram {}

    expect(getMetadata(TestProgram)?.program).toEqual({
      name: 'test-cli',
      version: '1.0.0',
    });
  });

  test('writes command and option config to the same metadata object', () => {
    @Command({
      name: 'start',
      description: 'Start the server',
    })
    class StartCommand {
      @Option({ short: 'p', description: 'Port to bind' })
      static port = '3000';

      @Option({ description: 'Enable verbose logging' })
      static verbose = false;
    }

    expect(getMetadata(StartCommand)).toEqual({
      command: {
        name: 'start',
        description: 'Start the server',
      },
      options: {
        port: {
          short: 'p',
          description: 'Port to bind',
          type: 'string',
          defaultValue: '3000',
        },
        verbose: {
          description: 'Enable verbose logging',
          type: 'boolean',
          defaultValue: false,
        },
      },
    });

    expect(getOptionRegistry(StartCommand)).toEqual({
      port: {
        short: 'p',
        description: 'Port to bind',
        type: 'string',
        defaultValue: '3000',
      },
      verbose: {
        description: 'Enable verbose logging',
        type: 'boolean',
        defaultValue: false,
      },
    });
  });

  test('rejects instance fields for @Option', () => {
    expect(() => {
      class InvalidCommand {
        @Option()
        value = 'bad';
      }

      return InvalidCommand;
    }).toThrow(
      '@Option() can only be used on static properties. Property "value" is not static.',
    );
  });
});
