#!/bin/sh
# Install the plan-supervisor prototype for the current user.
#   install.sh                         copy the skill and scripts to ~/.claude/skills/plan-supervisor
#   install.sh --timer DIR [DIR...]    also set a systemd user timer that runs the watchdog on those projects
#   install.sh --uninstall             remove the timer and the copied skill (plan state files are kept)
#   --dry-run                          print what would be done, change nothing
# Environment: CLAUDE_HOME (default ~/.claude), XDG_CONFIG_HOME (default ~/.config).
set -eu
HERE="$(cd "$(dirname "$0")" && pwd)"
CLAUDE_HOME="${CLAUDE_HOME:-$HOME/.claude}"
UNITS="${XDG_CONFIG_HOME:-$HOME/.config}/systemd/user"
DEST="$CLAUDE_HOME/skills/plan-supervisor"
DRY=0; TIMER=0; UNINSTALL=0; PROJECTS=""
while [ $# -gt 0 ]; do
  case "$1" in
    --dry-run) DRY=1 ;;
    --timer) TIMER=1 ;;
    --uninstall) UNINSTALL=1 ;;
    -*) echo "unknown option $1" >&2; exit 2 ;;
    *) PROJECTS="$PROJECTS $1" ;;
  esac
  shift
done
run() { if [ "$DRY" -eq 1 ]; then echo "would: $*"; else "$@"; fi; }

if [ "$UNINSTALL" -eq 1 ]; then
  run systemctl --user disable --now plan-supervisor-watchdog.timer 2>/dev/null || true
  run rm -f "$UNITS/plan-supervisor-watchdog.service" "$UNITS/plan-supervisor-watchdog.timer"
  run rm -rf "$DEST"
  echo "removed (state under ~/.local/state/plan-supervisor is kept)"; exit 0
fi

command -v node >/dev/null || { echo "node is required" >&2; exit 1; }
run mkdir -p "$DEST/scripts"
run cp "$HERE/SKILL.md" "$DEST/SKILL.md"
run cp "$HERE/scripts/plan-board.mjs" "$HERE/scripts/plan-board.test.mjs" "$HERE/scripts/watchdog.sh" "$DEST/scripts/"
run chmod +x "$DEST/scripts/watchdog.sh"
echo "skill installed at $DEST"

if [ "$TIMER" -eq 1 ]; then
  [ -n "$PROJECTS" ] || { echo "--timer needs at least one project directory" >&2; exit 2; }
  NODE_DIR="$(dirname "$(command -v node)")"
  for P in $PROJECTS; do
    [ -d "$P/.fgos/assignments" ] || { echo "$P has no .fgos/assignments (is fgOS initialised there?)" >&2; exit 1; }
    # mark what already exists as seen, so only new failures alert
    (cd "$P" && run node "$DEST/scripts/plan-board.mjs" watch --baseline)
  done
  run mkdir -p "$UNITS"
  if [ "$DRY" -eq 1 ]; then echo "would: write $UNITS/plan-supervisor-watchdog.{service,timer} for:$PROJECTS"; else
    sed -e "s#@NODE_DIR@#$NODE_DIR#" -e "s#@SCRIPTS@#$DEST/scripts#" -e "s#@PROJECTS@#$(echo $PROJECTS)#" \
      "$HERE/systemd/plan-supervisor-watchdog.service.in" > "$UNITS/plan-supervisor-watchdog.service"
    cp "$HERE/systemd/plan-supervisor-watchdog.timer" "$UNITS/"
  fi
  run systemctl --user daemon-reload
  run systemctl --user enable --now plan-supervisor-watchdog.timer
  echo "watchdog timer enabled for:$PROJECTS (disable: systemctl --user disable --now plan-supervisor-watchdog.timer)"
fi
