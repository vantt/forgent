#!/usr/bin/env bash
# herdr-cockpit.sh — the official fgOS operator cockpit (P40/D d3dbe7f5,
# supersedes the tmux-based D ef6ed305). herdr only arranges panes; every
# pane runs the real fgOS CLI standalone (chrome only — see the hard rule in
# docs/operator-runbook-herdr-cockpit.md). Must run from inside a
# herdr-managed pane (HERDR_ENV=1).
set -euo pipefail

if [ "${HERDR_ENV:-}" != "1" ]; then
  echo "Not running inside a herdr-managed pane (HERDR_ENV != 1) — stopping (see upstreams/herdr/SKILL.md driving-gate)." >&2
  exit 1
fi

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WORKSPACE_ID="${HERDR_WORKSPACE_ID:?HERDR_WORKSPACE_ID not set}"
TAB_LABEL="fgos-cockpit"

json_get() {
  # $1 = jq-less dotted path into the piped JSON, python for portability
  python3 -c "import json,sys; d=json.load(sys.stdin); print(eval('d'+sys.argv[1]))" "$1"
}

# A new tab in the CALLER's current workspace — the operator's real
# checkout, on purpose (unlike docs/history/herdr-interim-cockpit's
# deliberately-isolated named test session for a throwaway experiment).
TAB_JSON=$(herdr tab create --workspace "$WORKSPACE_ID" --label "$TAB_LABEL" --no-focus)
TAB_ID=$(echo "$TAB_JSON" | json_get "['result']['tab']['tab_id']")
PANE1_ID=$(echo "$TAB_JSON" | json_get "['result']['root_pane']['pane_id']")

# Pane 1 (tab's root pane): the runner loop. `--once` + runner.lock are
# already idempotent (no new runner flag needed) — this just wraps the
# existing verb in a poll-sleep shell loop.
herdr pane rename "$PANE1_ID" "fgos-runner-loop"
herdr pane run "$PANE1_ID" "cd '${REPO_ROOT}' && while true; do node bin/fgos-runner.mjs --once; sleep 5; done"

# Pane 2: live tail of whichever .fgos log currently exists (glob, never
# hardcode the filename — it can rotate/be created after this script runs).
PANE2_JSON=$(herdr pane split "$PANE1_ID" --direction down --ratio 0.5 --no-focus)
PANE2_ID=$(echo "$PANE2_JSON" | json_get "['result']['pane']['pane_id']")
herdr pane rename "$PANE2_ID" "fgos-tail-log"
herdr pane run "$PANE2_ID" "tail -F '${REPO_ROOT}/.fgos/logs/'*.log"

# Pane 3: human door — plain interactive shell; intentionally left
# unscripted, this pane IS where a human types the next fgos verb.
PANE3_JSON=$(herdr pane split "$PANE1_ID" --direction right --ratio 0.5 --no-focus)
PANE3_ID=$(echo "$PANE3_JSON" | json_get "['result']['pane']['pane_id']")
herdr pane rename "$PANE3_ID" "human-door"

# Pane 4: dashboard + attention (poll status line + native notification on a
# NEW awaiting-human item — see scripts/herdr-cockpit-notify.mjs).
PANE4_JSON=$(herdr pane split "$PANE2_ID" --direction right --ratio 0.5 --no-focus)
PANE4_ID=$(echo "$PANE4_JSON" | json_get "['result']['pane']['pane_id']")
herdr pane rename "$PANE4_ID" "fgos-dashboard"
herdr pane run "$PANE4_ID" "cd '${REPO_ROOT}' && node scripts/herdr-cockpit-notify.mjs --interval 5"

echo
echo "Cockpit tab '$TAB_LABEL' ($TAB_ID) ready in workspace $WORKSPACE_ID."
echo "Panes: fgos-runner-loop=$PANE1_ID  fgos-tail-log=$PANE2_ID  human-door=$PANE3_ID  fgos-dashboard=$PANE4_ID"
echo "Focus it with: herdr tab focus $TAB_ID"
