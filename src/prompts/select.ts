import { cc } from 'bun:ffi';
import source from '@/native/terminal.c' with { type: 'file' };
import { ANSI, SYMBOL, colorize, writeText } from '@/utils/terminal';

export interface SelectChoice {
  value: string;
  label?: string;
  text?: string;
  disabled?: boolean;
  selected?: boolean;
}

export type SelectOption = SelectChoice;

const terminalBindings = cc({
  source,
  symbols: {
    enable_raw_mode: { returns: 'void' },
    disable_raw_mode: { returns: 'void' },
    read_byte: { returns: 'i32' },
  },
});

const { enable_raw_mode, disable_raw_mode, read_byte } =
  terminalBindings.symbols;

function getChoiceLabel(choice: SelectChoice): string {
  return choice.label ?? choice.text ?? choice.value;
}

function getInitialSelectionIndex(choices: readonly SelectChoice[]): number {
  const selectedChoiceIndex = choices.findIndex(
    choice => choice.selected && !choice.disabled,
  );

  if (selectedChoiceIndex !== -1) {
    return selectedChoiceIndex;
  }

  return choices.findIndex(choice => !choice.disabled);
}

function moveSelection(
  currentIndex: number,
  delta: number,
  choices: readonly SelectChoice[],
): number {
  let nextIndex = currentIndex;

  do {
    nextIndex = (nextIndex + delta + choices.length) % choices.length;
  } while (choices[nextIndex]?.disabled);

  return nextIndex;
}

function renderChoiceLine(choice: SelectChoice, isSelected: boolean): string {
  const label = getChoiceLabel(choice);

  if (choice.disabled) {
    return `${SYMBOL.INDENT}${colorize('dim', `${label} (disabled)`)}${ANSI.CLEAR_TO_END}\n`;
  }

  if (isSelected) {
    return `${SYMBOL.POINTER}${colorize('underline', label)}${ANSI.CLEAR_TO_END}\n`;
  }

  return `${SYMBOL.INDENT}${label}${ANSI.CLEAR_TO_END}\n`;
}

function renderChoices(
  choices: readonly SelectChoice[],
  selectedIndex: number,
  moveCursorUp = true,
): void {
  if (moveCursorUp) {
    writeText(ANSI.CURSOR_UP(choices.length));
  }

  for (let index = 0; index < choices.length; index += 1) {
    const choice = choices[index];

    if (!choice) {
      continue;
    }

    writeText(renderChoiceLine(choice, index === selectedIndex));
  }
}

function clearInteractiveBlock(choiceCount: number): void {
  writeText(
    ANSI.CURSOR_SHOW,
    ANSI.CURSOR_UP(choiceCount + 1),
    '\r',
    ANSI.CLEAR_LINE,
    ANSI.ERASE_DOWN,
  );
}

export function select(
  message: string,
  choices: SelectChoice[],
): SelectChoice | null {
  if (choices.length === 0) {
    return null;
  }

  let selectedIndex = getInitialSelectionIndex(choices);

  if (selectedIndex === -1) {
    return null;
  }

  let isCancelled = false;
  let isConfirmed = false;

  writeText(
    SYMBOL.QUESTION,
    message,
    colorize('dim', ' - Press return to submit.'),
    '\n',
  );

  try {
    enable_raw_mode();
    writeText(ANSI.CURSOR_HIDE);
    renderChoices(choices, selectedIndex, false);

    while (!isCancelled && !isConfirmed) {
      const keyCode = read_byte();
      let selectionDelta = 0;

      switch (keyCode) {
        case -1:
        case 3:
        case 4:
          isCancelled = true;
          break;

        case 10:
        case 13:
          isConfirmed = true;
          break;

        case 27: {
          const nextByte = read_byte();

          if (nextByte !== 91) {
            isCancelled = true;
            break;
          }

          const arrowKey = read_byte();
          if (arrowKey === 65) {
            selectionDelta = -1;
          } else if (arrowKey === 66) {
            selectionDelta = 1;
          }
          break;
        }

        case 74:
        case 106:
          selectionDelta = 1;
          break;

        case 75:
        case 107:
          selectionDelta = -1;
          break;

        default:
          if (keyCode >= 49 && keyCode <= 57) {
            const directSelectionIndex = keyCode - 49;
            const directSelection = choices[directSelectionIndex];

            if (directSelection && !directSelection.disabled) {
              selectedIndex = directSelectionIndex;
              isConfirmed = true;
            }
          }
          break;
      }

      if (!isCancelled && !isConfirmed && selectionDelta !== 0) {
        selectedIndex = moveSelection(selectedIndex, selectionDelta, choices);
        renderChoices(choices, selectedIndex);
      }
    }
  } finally {
    disable_raw_mode();
  }

  clearInteractiveBlock(choices.length);

  if (isCancelled) {
    writeText(SYMBOL.ERROR, 'Cancelled\n');
    return null;
  }

  const selectedChoice = choices[selectedIndex];

  if (!selectedChoice) {
    return null;
  }

  writeText(
    SYMBOL.SUCCESS,
    message,
    colorize('dim', ': '),
    getChoiceLabel(selectedChoice),
    '\n',
  );

  return selectedChoice;
}
