#!/bin/sh
# watchdog.sh [project-dir...] : cheap, LLM-free. With no arguments it reads the registered projects from
# ${XDG_CONFIG_HOME:-~/.config}/plan-supervisor/projects (one path per line, '#' comments), which `install.sh --add`
# maintains. For each project: run `plan-board.mjs watch`; on new alerts append to alerts.log, queue them for the owner
# and (when the project has an fgOS install and a live agent head) send a mailbox message so the alert shows up inside
# the owner's open Claude session. Per-project settings (stall minutes) live in the project's state dir (`config`).
HERE="$(cd "$(dirname "$0")" && pwd)"
BOARD="$HERE/plan-board.mjs"
LIST="${XDG_CONFIG_HOME:-$HOME/.config}/plan-supervisor/projects"
if [ $# -eq 0 ]; then
  [ -f "$LIST" ] || exit 0
  PROJECTS="$(grep -v '^[[:space:]]*#' "$LIST" | grep -v '^[[:space:]]*$')"
else
  PROJECTS="$(printf '%s\n' "$@")"
fi
printf '%s\n' "$PROJECTS" | while IFS= read -r P; do
  [ -n "$P" ] && [ -d "$P/.fgos/assignments" ] || continue
  OUT="$(cd "$P" && node "$BOARD" watch 2>&1)"; CODE=$?
  [ "$CODE" -eq 4 ] || continue
  # same state dir the script itself uses for this project
  DIR="$(cd "$P" && node "$BOARD" config get | node -e 'let t="";process.stdin.on("data",d=>t+=d).on("end",()=>process.stdout.write(JSON.parse(t).stateDir))')"
  mkdir -p "$DIR"
  { printf '%s\n' "$(date -Iseconds)"; printf '%s\n' "$OUT"; } >> "$DIR/alerts.log"
  (cd "$P" && node "$BOARD" queue add - "watchdog: $(printf '%s' "$OUT" | tr '\n' ';')" --kind failure >/dev/null 2>&1)
  FGOS="$P/.fgos/installation/bin/fgos"
  if [ -x "$FGOS" ]; then
    HEAD="$(cd "$P" && "$FGOS" mailbox list </dev/null 2>/dev/null | awk 'NR==1 && /alive/ {print $1}')"
    [ -n "$HEAD" ] && (cd "$P" && "$FGOS" mailbox send --to "$HEAD" "plan-supervisor watchdog ($(basename "$P")): $OUT" </dev/null >/dev/null 2>&1)
  fi
done
exit 0
