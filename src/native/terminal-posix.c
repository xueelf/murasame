#include <stdbool.h>
#include <termios.h>
#include <unistd.h>

static struct termios original_termios;
static bool termios_saved = false;

void enable_raw_mode(void) {
    if (tcgetattr(STDIN_FILENO, &original_termios) == -1) {
        return;
    }
    termios_saved = true;

    struct termios raw_mode = original_termios;
    raw_mode.c_iflag &= ~(BRKINT | ICRNL | INPCK | ISTRIP | IXON);
    raw_mode.c_oflag &= ~(OPOST);
    raw_mode.c_cflag |= (CS8);
    raw_mode.c_lflag &= ~(ECHO | ICANON | IEXTEN | ISIG);
    raw_mode.c_cc[VMIN] = 1;
    raw_mode.c_cc[VTIME] = 0;

    tcsetattr(STDIN_FILENO, TCSANOW, &raw_mode);
}

void disable_raw_mode(void) {
    if (termios_saved) {
        tcsetattr(STDIN_FILENO, TCSANOW, &original_termios);
    }
}

int read_byte(void) {
    char byte = 0;

    if (read(STDIN_FILENO, &byte, 1) == 1) {
        return (int)byte;
    }

    return -1;
}
