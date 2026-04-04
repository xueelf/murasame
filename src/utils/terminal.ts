import { stdout, write } from 'bun';
import { stripVTControlCharacters, styleText } from 'util';

type StyleToken = Parameters<typeof styleText>[0];

export type ThemeColor = StyleToken | `#${string}`;

function isStyleToken(color: ThemeColor): color is StyleToken {
  return typeof color === 'string' || Array.isArray(color);
}

function isHexColor(color: string): color is `#${string}` {
  return /^#[0-9a-fA-F]{6}$/.test(color);
}

export function colorize(
  color: ThemeColor | readonly ThemeColor[],
  text: string,
): string {
  const colors = Array.isArray(color) ? color : [color];
  let styledText = text;

  for (const currentColor of colors) {
    if (typeof currentColor === 'string' && isHexColor(currentColor)) {
      const hex = currentColor.slice(1);
      const red = Number.parseInt(hex.slice(0, 2), 16);
      const green = Number.parseInt(hex.slice(2, 4), 16);
      const blue = Number.parseInt(hex.slice(4, 6), 16);

      styledText = `\x1b[38;2;${red};${green};${blue}m${styledText}\x1b[39m`;
      continue;
    }

    if (isStyleToken(currentColor)) {
      styledText = styleText(currentColor, styledText);
    }
  }

  return styledText;
}

export function visibleTextWidth(text: string): number {
  return stripVTControlCharacters(text).length;
}

export const ANSI = {
  CURSOR_HIDE: '\x1b[?25l',
  CURSOR_SHOW: '\x1b[?25h',
  CLEAR_LINE: '\x1b[2K',
  CLEAR_TO_END: '\x1b[0K',
  ERASE_DOWN: '\x1b[0J',
  CURSOR_UP: (lineCount: number) => `\x1b[${lineCount}A`,
};

export const SPACE = ' ';

export const SYMBOL = {
  INDENT: SPACE.repeat(4),
  POINTER: `${colorize('cyan', '❯')}${SPACE.repeat(3)}`,
  SUCCESS: `${colorize('green', '✓')}${SPACE}`,
  ERROR: `${colorize('red', 'x')}${SPACE}`,
  QUESTION: `${colorize('cyan', '?')}${SPACE}`,
};

export function writeText(...parts: readonly string[]): void {
  write(stdout, parts.join(''));
}
