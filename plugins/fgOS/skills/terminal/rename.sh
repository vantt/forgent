#!/usr/bin/env bash
# fgOS terminal rename -- best-effort herdr pane label. Chrome-only (D2,
# docs/history/fgos-terminal-pane-rename/CONTEXT.md): never touches .fgos/
# state, never blocks the caller. Any missing precondition is a silent
# no-op, exit 0.
#
# Usage: rename.sh <task-id> <project-root>
#   <task-id>      the claimed fgOS item id (first label segment)
#   <project-root> absolute path to this repo's checkout, so the fgOS
#                  session-id fallback (fg.ssid) can be resolved even when
#                  this script itself runs from an installed plugin cache
#                  copy that doesn't carry src/ alongside it.
set -u

task_id="${1:-}"
project_root="${2:-}"

# Not in a herdr-managed pane, or herdr unavailable, or no task id: no-op.
[ "${HERDR_ENV:-}" = "1" ] || exit 0
command -v herdr >/dev/null 2>&1 || exit 0
[ -n "${HERDR_PANE_ID:-}" ] || exit 0
[ -n "$task_id" ] || exit 0

# fg.ssid (D1): fgOS/bee's own session id. BEE_SESSION_ID first, else
# resolveWriterIdentity()'s own env/registry/pid fallback chain
# (src/runner/session-identity.mjs) -- dropped entirely if neither resolves.
fg_ssid="${BEE_SESSION_ID:-}"
if [ -z "$fg_ssid" ] && [ -n "$project_root" ] && [ -f "$project_root/src/runner/session-identity.mjs" ]; then
  fg_ssid=$(node -e "
    import(process.argv[1]).then(({ resolveWriterIdentity }) => {
      process.stdout.write(String(resolveWriterIdentity().id));
    }).catch(() => {});
  " -- "$project_root/src/runner/session-identity.mjs" 2>/dev/null || true)
fi

# a.ssid (D1): the coding agent tool's own native session id. Claude Code
# exposes CLAUDE_CODE_SESSION_ID; other agent tools are not detected today
# (docs/history/fgos-terminal-pane-rename/CONTEXT.md, outstanding questions)
# and simply drop this segment (D4).
a_ssid="${CLAUDE_CODE_SESSION_ID:-}"

# resolveWriterIdentity()'s own fallback chain reads CLAUDE_CODE_SESSION_ID
# too when BEE_SESSION_ID is unset, so fg_ssid can come back equal to
# a_ssid -- collapsing the two genuinely-distinct identities D1 requires.
# Drop the duplicate rather than show the same value twice.
if [ -n "$fg_ssid" ] && [ "$fg_ssid" = "$a_ssid" ]; then
  fg_ssid=""
fi

# D4: taskid | fg.ssid:<v> | a.ssid:<v>, unresolved segments dropped.
label="$task_id"
[ -n "$fg_ssid" ] && label="$label | fg.ssid:$fg_ssid"
[ -n "$a_ssid" ] && label="$label | a.ssid:$a_ssid"

herdr pane rename "$HERDR_PANE_ID" "$label" >/dev/null 2>&1 || true
exit 0
