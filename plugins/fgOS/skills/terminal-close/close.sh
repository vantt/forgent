#!/usr/bin/env bash
# fgOS terminal close -- best-effort herdr pane close. Chrome-only
# (docs/history/fgos-terminal-close-autoclose/CONTEXT.md D2, mirrors
# terminal/rename.sh's own guard chain): never touches .fgos/ state, never
# blocks the caller. Any missing precondition is a silent no-op, exit 0.
#
# Usage: close.sh
set -u

# Not in a herdr-managed pane, or herdr unavailable: no-op.
[ "${HERDR_ENV:-}" = "1" ] || exit 0
command -v herdr >/dev/null 2>&1 || exit 0
[ -n "${HERDR_PANE_ID:-}" ] || exit 0
# Same ownership guard as terminal/rename.sh: never close a dead or foreign
# pane named by an inherited HERDR_PANE_ID.
. "$(dirname "$0")/../terminal/pane-owned.sh"
fgos_pane_owned "$HERDR_PANE_ID" || exit 0

herdr pane close "$HERDR_PANE_ID" >/dev/null 2>&1 || true
exit 0
