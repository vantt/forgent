#!/bin/sh
# Install the plan-supervisor prototype for the current user and register projects with its watchdog.
#   install.sh                          install or update the skill and scripts in ~/.claude/skills/plan-supervisor
#   install.sh --add DIR [DIR...]       register projects: shows a readiness check for each, marks existing runs as seen,
#                                       and (re)writes the systemd user timer. Additive: earlier projects stay.
#         [--max-running N] [--stall-min N]   per-project settings for the DIRs of this call (defaults 1 and 20)
#   install.sh --remove DIR [DIR...]    unregister; the timer is disabled when no project is left
#   install.sh --list                   show registered projects and their settings
#   install.sh --uninstall              remove the timer and the copied skill (state files are kept)
#   --dry-run                           print what would change, change nothing
# Environment: CLAUDE_HOME (~/.claude), XDG_CONFIG_HOME (~/.config), PLAN_SUPERVISOR_NO_SYSTEMD=1 (skip systemctl).
set -eu
HERE="$(cd "$(dirname "$0")" && pwd)"
CLAUDE_HOME="${CLAUDE_HOME:-$HOME/.claude}"
CONFIG="${XDG_CONFIG_HOME:-$HOME/.config}"
UNITS="$CONFIG/systemd/user"
LIST="$CONFIG/plan-supervisor/projects"
DEST="$CLAUDE_HOME/skills/plan-supervisor"
BOARD="$DEST/scripts/plan-board.mjs"
DRY=0; MODE=install; MAXRUN=""; STALL=""; DIRS=""
while [ $# -gt 0 ]; do
  case "$1" in
    --dry-run) DRY=1 ;;
    --add) MODE=add ;;
    --remove) MODE=remove ;;
    --list) MODE=list ;;
    --uninstall) MODE=uninstall ;;
    --max-running) shift; MAXRUN="${1:-}" ;;
    --stall-min) shift; STALL="${1:-}" ;;
    -*) echo "unknown option $1" >&2; exit 2 ;;
    *) DIRS="$DIRS
$1" ;;
  esac
  shift
done
run() { if [ "$DRY" -eq 1 ]; then echo "would: $*"; else "$@"; fi; }
systemctl_user() { [ "${PLAN_SUPERVISOR_NO_SYSTEMD:-0}" = 1 ] && { echo "(skipping systemctl --user $*)"; return 0; }; run systemctl --user "$@"; }
canon() { (cd "$1" 2>/dev/null && pwd -P) || return 1; }

install_skill() {
  command -v node >/dev/null || { echo "node is required" >&2; exit 1; }
  run mkdir -p "$DEST/scripts"
  run cp "$HERE/SKILL.md" "$DEST/SKILL.md"
  run cp "$HERE/scripts/plan-board.mjs" "$HERE/scripts/plan-board.test.mjs" "$HERE/scripts/watchdog.sh" "$DEST/scripts/"
  run chmod +x "$DEST/scripts/watchdog.sh"
  echo "skill installed at $DEST"
}
write_units_and_toggle() {
  N=0; [ -f "$LIST" ] && N="$(grep -cv '^[[:space:]]*\(#\|$\)' "$LIST" || true)"
  if [ "$N" -gt 0 ]; then
    run mkdir -p "$UNITS"
    if [ "$DRY" -eq 1 ]; then echo "would: write $UNITS/plan-supervisor-watchdog.{service,timer}"; else
      sed -e "s#@NODE_DIR@#$(dirname "$(command -v node)")#" -e "s#@SCRIPTS@#$DEST/scripts#" \
        "$HERE/systemd/plan-supervisor-watchdog.service.in" > "$UNITS/plan-supervisor-watchdog.service"
      cp "$HERE/systemd/plan-supervisor-watchdog.timer" "$UNITS/"
    fi
    systemctl_user daemon-reload
    systemctl_user enable --now plan-supervisor-watchdog.timer
    echo "watchdog timer enabled for $N project(s)"
  else
    systemctl_user disable --now plan-supervisor-watchdog.timer 2>/dev/null || true
    echo "no project registered: watchdog timer disabled"
  fi
}

case "$MODE" in
  install) install_skill ;;
  uninstall)
    systemctl_user disable --now plan-supervisor-watchdog.timer 2>/dev/null || true
    run rm -f "$UNITS/plan-supervisor-watchdog.service" "$UNITS/plan-supervisor-watchdog.timer"
    run rm -rf "$DEST"
    echo "removed (project list $LIST and state under ~/.local/state/plan-supervisor are kept)" ;;
  list)
    [ -f "$LIST" ] || { echo "no project registered"; exit 0; }
    grep -v '^[[:space:]]*\(#\|$\)' "$LIST" | while IFS= read -r P; do
      printf '%s\n' "$P"; (cd "$P" 2>/dev/null && node "$BOARD" config get 2>/dev/null) | sed 's/^/    /'
    done ;;
  add)
    [ -n "$DIRS" ] || { echo "--add needs at least one project directory" >&2; exit 2; }
    install_skill
    run mkdir -p "$(dirname "$LIST")"
    printf '%s\n' "$DIRS" | while IFS= read -r D; do
      [ -n "$D" ] || continue
      P="$(canon "$D")" || { echo "not a directory: $D" >&2; exit 1; }
      [ -d "$P/.fgos" ] || { echo "$P has no .fgos: run \`fgctl init\` there first" >&2; exit 1; }
      echo "== $P"
      (cd "$P" && node "$DEST/scripts/plan-board.mjs" doctor) || echo "   (required checks above must be fixed for the supervisor to drive this project; the watchdog still works)"
      [ -z "$MAXRUN" ] || (cd "$P" && run node "$DEST/scripts/plan-board.mjs" config set maxRunning "$MAXRUN")
      [ -z "$STALL" ] || (cd "$P" && run node "$DEST/scripts/plan-board.mjs" config set stallMin "$STALL")
      mkdir -p "$P/.fgos/assignments" 2>/dev/null || true
      # mark what exists as seen only for a project not registered yet: re-adding must not swallow real new alerts
      if [ -f "$LIST" ] && grep -qxF "$P" "$LIST"; then echo "   already registered: baseline kept"; else
        (cd "$P" && run node "$DEST/scripts/plan-board.mjs" watch --baseline)
      fi
      if [ "$DRY" -eq 1 ]; then echo "would: register $P"; else
        touch "$LIST"; grep -qxF "$P" "$LIST" || printf '%s\n' "$P" >> "$LIST"
      fi
    done
    write_units_and_toggle ;;
  remove)
    [ -n "$DIRS" ] || { echo "--remove needs at least one project directory" >&2; exit 2; }
    [ -f "$LIST" ] || { echo "no project registered"; exit 0; }
    printf '%s\n' "$DIRS" | while IFS= read -r D; do
      [ -n "$D" ] || continue
      P="$(canon "$D" 2>/dev/null || printf '%s' "$D")"
      if [ "$DRY" -eq 1 ]; then echo "would: unregister $P"; else
        grep -vxF "$P" "$LIST" > "$LIST.new" || true; mv "$LIST.new" "$LIST"; echo "unregistered $P"
      fi
    done
    write_units_and_toggle ;;
esac
