#!/usr/bin/env bash
# Phase 01 blocking question, step 2 of 2 — no agent, no tokens.
#
# Step 1 (env-probe.sh) measured, with a private HOME:
#   COCKPIT=REACHABLE            -- the worker still reaches the operator's cockpit
#   VIA_HOME_FALLBACK=BLOCKED    -- but NOT through the $HOME/.config path
# So HOME isolation closes one of the two ways in, and the remaining way is the
# HERDR_SOCKET_PATH herdr injects. P7 showed --env cannot clear a HERDR_* name
# by setting it EMPTY. This asks two further questions:
#   D. does --env stick when the value is NON-empty (a bogus path)?
#   E. does HOME really change (direct read, step 1's marker A timed out)?
set -uo pipefail
PRIV=/tmp/fgos-priv2-$$
RES=/tmp/fgos-sock-res-$$.txt
mkdir -p "$PRIV"; : > "$RES"
say() { echo "[$(date +%T)] $*"; }
cleanup() { [ -n "${PANE:-}" ] && herdr pane close "$PANE" >/dev/null 2>&1; rm -rf "$PRIV" "$RES"; }
trap cleanup EXIT

PANE=$(herdr tab create --workspace wS --cwd /tmp --label fgos-sock --no-focus \
        --env "HOME=$PRIV" --env "HERDR_SOCKET_PATH=/nonexistent/herdr.sock" 2>&1 \
       | python3 -c "import sys,json;print(json.load(sys.stdin)['result']['root_pane']['pane_id'])")
say "pane=$PANE  private HOME=$PRIV"

for i in $(seq 1 120); do
  n=$(herdr pane process-info --pane "$PANE" 2>/dev/null \
      | python3 -c "import sys,json;print(len(json.load(sys.stdin)['result']['process_info']['foreground_processes']))" 2>/dev/null)
  [ "$n" = "0" ] && break; sleep 0.5
done
say "shell ready after ~$((i/2))s"

run() {
  herdr pane run "$PANE" "$1" >/dev/null 2>&1
  for _ in $(seq 1 40); do grep -q "$2" "$RES" 2>/dev/null && return 0; sleep 0.5; done
  say "TIMED OUT waiting for $2"; return 1
}

# one variable per line, no printf escapes -- step 1's marker A died on quoting
run "echo HOMEIS=\$HOME >> $RES; echo SOCKIS=\$HERDR_SOCKET_PATH >> $RES; echo doneD >> $RES" doneD
run "{ herdr pane list >/dev/null 2>&1 && echo COCKPIT_WITH_BOGUS_SOCK=REACHABLE || echo COCKPIT_WITH_BOGUS_SOCK=BLOCKED; echo doneE; } >> $RES" doneE

echo "================= RESULTS ================="
grep -E '^(HOMEIS=|SOCKIS=|COCKPIT_WITH_BOGUS_SOCK=)' "$RES" 2>/dev/null || echo "(nothing captured)"
echo "==========================================="
