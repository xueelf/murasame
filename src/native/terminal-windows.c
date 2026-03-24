#include <stdbool.h>
#include <windows.h>
#include <conio.h>

static DWORD original_mode;
static HANDLE stdin_handle;
static bool mode_saved = false;

void enable_raw_mode(void) {
    stdin_handle = GetStdHandle(STD_INPUT_HANDLE);

    if (stdin_handle == INVALID_HANDLE_VALUE) {
        return;
    }

    if (!GetConsoleMode(stdin_handle, &original_mode)) {
        return;
    }

    mode_saved = true;

    DWORD raw_mode = original_mode | ENABLE_VIRTUAL_TERMINAL_INPUT | ENABLE_PROCESSED_INPUT;
    raw_mode &= ~(ENABLE_LINE_INPUT | ENABLE_ECHO_INPUT);

    SetConsoleMode(stdin_handle, raw_mode);
}

void disable_raw_mode(void) {
    if (mode_saved && stdin_handle != INVALID_HANDLE_VALUE) {
        SetConsoleMode(stdin_handle, original_mode);
    }
}

int read_byte(void) {
    return _getch();
}
