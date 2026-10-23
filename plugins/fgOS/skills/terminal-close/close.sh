#!/usr/bin/env bash
# fgOS terminal close -- best-effort close of the caller's own herdr pane,
# through the terminal-control port. Chrome-only
# (docs/history/fgos-terminal-close-autoclose/CONTEXT.md D2, mirrors
# terminal/rename.sh's own guard chain): never touches .fgos/ state, never
# blocks the caller. Any missing precondition is a silent no-op, exit 0.
#
# Usage: close.sh
set -u

# Not in a herdr-managed pane, or herdr unavailable: no-op.
[ "${HERDR_ENV:-}" = "1" ] || exit 0
command -v herdr >/dev/null 2>&1 || exit 0
command -v fgos >/dev/null 2>&1 || exit 0
[ -n "${HERDR_PANE_ID:-}" ] || exit 0
# Same ownership rule as terminal/rename.sh, kept by the port's attach below:
# a dead or foreign pane named by an inherited HERDR_PANE_ID is never taken, so
# never closed.
. "$(dirname "$0")/../terminal/terminal-port.sh"

# The pane is attached under this session's key (idempotent when /fgOS:terminal
# already did it). Naming it as the caller's own pane is what lets the port
# close an attached pane: the one case where it does.
key=$(fgos_terminal_key "${CLAUDE_PROJECT_DIR:-}")
fgos_terminal_attach "$key" "$HERDR_PANE_ID" || exit 0
fgos_terminal_call release "{\"key\":$(fgos_json_str "$key"),\"disposition\":\"close\",\"callerPane\":$(fgos_json_str "$HERDR_PANE_ID")}" >/dev/null || true
exit 0
