#!/usr/bin/env bash
# Phase 01 blocking question, step 1 of 2 — no agent, no tokens.
#
# P7 measured that a worker pane reaches the operator's herdr cockpit socket
# even with every HERDR_* variable stripped, because the client falls back to
# $HOME/.config/herdr/herdr.sock. Two ways in were therefore identified:
#   (1) the HERDR_SOCKET_PATH herdr injects into every pane it creates
#   (2) the $HOME fallback path
# P7 proved --env cannot clear (1) for HERDR_* names. It never tested whether
# --env can set a NON-herdr variable such as HOME, which is what (2) turns on.
#
# Answers exactly three things, writes nothing outside /tmp:
#   A. does `--env HOME=...` actually take effect inside the pane?
#   B. with a private HOME, is the operator's cockpit still reachable?
#   C. which of the two ways in is doing the work?
#
# NOTE on measurement: never `wait-output` on a literal that also appears in the
# typed command. `pane run` echoes the command line, so such a wait matches its
# own keystrokes and returns before anything has executed. Results are appended
# to a file and the file is polled instead.
set -uo pipefail
PRIV=/tmp/fgos-priv-home-$$
RES=/tmp/fgos-iso-res-$$.txt
mkdir -p "$PRIV"; : > "$RES"
say() { echo "[$(date +%T)] $*"; }
cleanup() { [ -n "${PANE:-}" ] && herdr pane close "$PANE" >/dev/null 2>&1; rm -rf "$PRIV" "$RES"; }
trap cleanup EXIT

say "private HOME = $PRIV"
PANE=$(herdr tab create --workspace wS --cwd /tmp --label fgos-iso --no-focus \
        --env "HOME=$PRIV" --env "XDG_CONFIG_HOME=$PRIV/.config" 2>&1 \
       | python3 -c "import sys,json;print(json.load(sys.stdin)['result']['root_pane']['pane_id'])")
say "pane=$PANE"

for i in $(seq 1 90); do
  n=$(herdr pane process-info --pane "$PANE" 2>/dev/null \
      | python3 -c "import sys,json;print(len(json.load(sys.stdin)['result']['process_info']['foreground_processes']))" 2>/dev/null)
  [ "$n" = "0" ] && break; sleep 0.5
done
say "shell ready after ~$((i/2))s"

run() {
  herdr pane run "$PANE" "$1" >/dev/null 2>&1
  for _ in $(seq 1 40); do grep -q "$2" "$RES" 2>/dev/null && return 0; sleep 0.5; done
  say "TIMED OUT waiting for marker $2"; return 1
}

run "printf 'HOME=[%s]\nSOCKVAR=[%s]\ndoneA\n' \"\$HOME\" \"\$HERDR_SOCKET_PATH\" >> $RES" doneA
run "{ herdr pane list >/dev/null 2>&1 && echo COCKPIT=REACHABLE || echo COCKPIT=BLOCKED; echo doneB; } >> $RES" doneB
run "{ env -u HERDR_SOCKET_PATH herdr pane list >/dev/null 2>&1 && echo VIA_HOME_FALLBACK=REACHABLE || echo VIA_HOME_FALLBACK=BLOCKED; echo doneC; } >> $RES" doneC

echo "================= RESULTS ================="
if grep -qE '^(HOME=|SOCKVAR=|COCKPIT=|VIA_HOME_FALLBACK=)' "$RES" 2>/dev/null; then
  grep -E '^(HOME=|SOCKVAR=|COCKPIT=|VIA_HOME_FALLBACK=)' "$RES"
else
  echo "(nothing captured — raw pane tail below)"
  rtk proxy herdr pane read "$PANE" --source recent-unwrapped --lines 60 | tail -20
fi
echo "==========================================="
