#!/bin/sh
# Probe 7 — the decisive one. Does herdr accept a pane confined the
# pid-preserving way, and does agy come to ready inside it?
#
# Probe 4 showed herdr refuses a bwrap pane with `agent_pane_busy`, and the
# control measurement showed why: bwrap forks, so the pane's foreground pid
# stops matching the shell pid herdr recorded. Probe 6 showed
# `unshare --mount --map-root-user` confines just as hard while keeping the
# pid. If herdr's check is really about pid identity, this pane should be
# accepted where the bwrap one was not.
#
# Answers, in order:
#   1. is the pane at a usable prompt after the switch?
#   2. does herdr still see it as its own shell?
#   3. does confinement hold in it?
#   4. does `agent start --kind agy` reach ready?
set -u

HERE=$(cd "$(dirname "$0")" && pwd)
WORKSPACE="$1"
AGENT_NAME="unshare-probe-$(date +%s | tail -c 5)"

pane_read() { herdr pane read "$1" 2>&1 | tail -c 400; }

printf '=== opening a pane in the workspace\n'
herdr pane split --direction right --no-focus --cwd "$WORKSPACE" > /tmp/probe7-split.json 2>&1
PANE=$(python3 -c 'import json;print(json.load(open("/tmp/probe7-split.json"))["result"]["pane"]["pane_id"])') \
  || { cat /tmp/probe7-split.json; exit 1; }
printf 'pane: %s\n' "$PANE"
sleep 2

printf '\n=== switching its shell into the namespace (exec, so the pid survives)\n'
herdr pane send-text "$PANE" "exec unshare --mount --map-root-user -- $HERE/unshare-shell.sh $WORKSPACE" >/dev/null 2>&1
herdr pane send-keys "$PANE" Enter >/dev/null 2>&1
sleep 4

printf '\n=== 1. usable prompt?\n'
herdr pane send-text "$PANE" 'echo PROBE7_ALIVE_$((6*7))' >/dev/null 2>&1
herdr pane send-keys "$PANE" Enter >/dev/null 2>&1
sleep 2
pane_read "$PANE"

printf '\n\n=== 2. does herdr still see its own shell?\n'
herdr pane process-info --pane "$PANE" 2>&1 | python3 -c '
import json,sys
d=json.load(sys.stdin)["result"]["process_info"]
fg=[p["pid"] for p in d["foreground_processes"]]
print("shell_pid:", d["shell_pid"], "| foreground:", fg, "| match:", d["shell_pid"] in fg)
'

printf '\n=== 3. does confinement hold?\n'
herdr pane send-text "$PANE" 'echo stray > /home/vantt/projects/forgentX/src/setup/probe7.txt 2>&1 || echo CONFINED_OK' >/dev/null 2>&1
herdr pane send-keys "$PANE" Enter >/dev/null 2>&1
sleep 2
pane_read "$PANE"
printf '\nstray on host: '
[ -f /home/vantt/projects/forgentX/src/setup/probe7.txt ] && echo 'YES -- LEAK' || echo 'no'

printf '\n=== 4. can herdr bring agy to ready here?\n'
herdr agent start "$AGENT_NAME" --kind agy --pane "$PANE" --timeout 90000 > /tmp/probe7-agent.json 2>&1
printf '(exit %s) ' "$?"
head -c 300 /tmp/probe7-agent.json

printf '\n\npane %s and agent %s left for inspection\n' "$PANE" "$AGENT_NAME"
