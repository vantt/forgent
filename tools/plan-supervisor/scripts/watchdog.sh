#!/bin/sh
# watchdog.sh <project-dir>...  : cheap, LLM-free. For each project: run `plan-board.mjs watch`; on new alerts append to
# alerts.log, queue them for the owner, and (when the project has an fgOS install and a live agent head) send a mailbox
# message so the alert shows up inside the owner's open Claude session. Meant to be run by a systemd user timer.
HERE="$(cd "$(dirname "$0")" && pwd)"
BOARD="$HERE/plan-board.mjs"
for P in "$@"; do
  [ -d "$P/.fgos/assignments" ] || continue
  cd "$P" || continue
  OUT="$(node "$BOARD" watch 2>&1)"; CODE=$?
  [ "$CODE" -eq 4 ] || continue
  DIR="${XDG_STATE_HOME:-$HOME/.local/state}/plan-supervisor/$(basename "$P")"
  mkdir -p "$DIR"
  { printf '%s\n' "$(date -Iseconds)"; printf '%s\n' "$OUT"; } >> "$DIR/alerts.log"
  node "$BOARD" queue add - "watchdog: $(printf '%s' "$OUT" | tr '\n' ';')" >/dev/null 2>&1
  FGOS="$P/.fgos/installation/bin/fgos"
  if [ -x "$FGOS" ]; then
    HEAD="$("$FGOS" mailbox list </dev/null 2>/dev/null | awk 'NR==1 && /alive/ {print $1}')"
    [ -n "$HEAD" ] && "$FGOS" mailbox send --to "$HEAD" "plan-supervisor watchdog ($(basename "$P")): $OUT" </dev/null >/dev/null 2>&1
  fi
done
exit 0
