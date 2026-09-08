#!/bin/sh
# Probe 4 — can a herdr pane's own shell be put inside the namespace, so that
# the agent herdr starts there inherits it?
#
# `herdr agent start --kind agy` runs the canonical executable and takes no
# command override, so bwrap cannot be inserted at that call. What it does
# require is a pane already sitting at an interactive shell prompt. If that
# shell is itself inside a bwrap namespace, everything herdr subsequently
# starts in the pane inherits it -- including agy.
#
# This probe answers three things in order, and stops being useful if the
# first fails:
#   1. does `exec bwrap ... $SHELL` leave the pane at a usable prompt?
#   2. does the confinement hold in that shell?
#   3. does `herdr agent start --kind agy` still reach ready through it?
set -u

WORKSPACE="$1"
WORKER_HOME="$2"
AGENT_NAME="bwrap-probe-$(date +%s | tail -c 6)"

json() { python3 -c 'import json,sys; print(json.load(sys.stdin)["result"][sys.argv[1]][sys.argv[2]])' "$2" "$3" < "$1"; }

printf '=== opening a pane in the workspace\n'
herdr pane split --direction right --no-focus --cwd "$WORKSPACE" > /tmp/probe4-split.json 2>&1
PANE=$(json /tmp/probe4-split.json pane pane_id) || { cat /tmp/probe4-split.json; exit 1; }
printf 'pane: %s\n' "$PANE"

printf '\n=== replacing its shell with one inside the namespace\n'
BW="bwrap --ro-bind / / --dev /dev --proc /proc --tmpfs /tmp --bind $WORKSPACE $WORKSPACE --bind $WORKER_HOME $WORKER_HOME --setenv HOME $WORKER_HOME"
herdr pane send-text "$PANE" "exec $BW -- /bin/bash --norc" > /dev/null 2>&1
herdr pane send-keys "$PANE" Enter > /dev/null 2>&1
sleep 3

printf '\n=== 1. is the pane at a usable prompt?\n'
herdr pane send-text "$PANE" 'echo PROBE_ALIVE_$((6*7))' > /dev/null 2>&1
herdr pane send-keys "$PANE" Enter > /dev/null 2>&1
sleep 2
herdr pane read "$PANE" --lines 6 > /tmp/probe4-read1.json 2>&1
python3 -c 'import json;print(json.load(open("/tmp/probe4-read1.json"))["result"]["read"]["text"][-300:])'

printf '\n=== 2. does the confinement hold in that shell?\n'
herdr pane send-text "$PANE" 'echo stray > /home/vantt/projects/forgentX/src/setup/probe4.txt 2>&1 || echo CONFINED_OK' > /dev/null 2>&1
herdr pane send-keys "$PANE" Enter > /dev/null 2>&1
sleep 2
herdr pane read "$PANE" --lines 6 > /tmp/probe4-read2.json 2>&1
python3 -c 'import json;print(json.load(open("/tmp/probe4-read2.json"))["result"]["read"]["text"][-300:])'
printf 'stray file on host: '
[ -f /home/vantt/projects/forgentX/src/setup/probe4.txt ] && echo 'YES -- LEAK' || echo 'no'

printf '\n=== 3. can herdr bring agy to ready in this pane?\n'
herdr agent start "$AGENT_NAME" --kind agy --pane "$PANE" --timeout 60000 > /tmp/probe4-agent.json 2>&1
printf '(exit %s)\n' "$?"
head -c 400 /tmp/probe4-agent.json

printf '\n\n=== pane left open for inspection: %s\n' "$PANE"
printf 'agent name: %s\n' "$AGENT_NAME"
