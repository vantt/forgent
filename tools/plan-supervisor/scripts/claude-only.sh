#!/bin/sh
# claude-only.sh [PROJECT_DIR] : make a project's fgOS config use the claude family only (project config; the machine's
# global config is not touched). Needed when only one provider family may see the repo or the others are out of quota.
# Consequence you must know: fgOS refuses the `reviewed` pattern with only one family (independence-unsatisfiable), so
# the conductor runs activities with `--pattern solo --reason ...`, and the case frame allows only 2 such deviations
# (deviation-limit-reached), so plan work is split into small cases. Undo: remove the keys with `fgos config unset`.
set -eu
P="${1:-.}"
cd "$P"
FGOS="$(pwd -P)/.fgos/installation/bin/fgos"
[ -x "$FGOS" ] || { echo "fgOS is not initialised here (run fgctl init)" >&2; exit 1; }
R="claude-only for this project (set by plan-supervisor claude-only.sh): one provider family sees the repo"
set_pref() { "$FGOS" config set "runner.capabilities.$1.prefer" "$2" --reason "$R" </dev/null >/dev/null && echo "set $1"; }
for CAP in review code:implement code:test execute; do set_pref "$CAP" '["claude"]'; done
for CAP in advise code:review code:debug; do set_pref "$CAP" '[{"executor":"claude","invocation":"claude-cli-bwrap"}]'; done
"$FGOS" config set 'runner.capabilities.code:*.roles.red-team.prefer' '["claude"]' --reason "$R" </dev/null >/dev/null && echo "set red-team seats of code:*"
for CAP in advise review code:implement code:review; do
  printf '%s -> ' "$CAP"; "$FGOS" dispatch decide --for "$CAP" </dev/null 2>/dev/null | grep -E '"executorId"' | tr -d ' \n'; echo
done
