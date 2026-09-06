#!/usr/bin/env bash
# Answers the two remaining questions from session-findings.md, in one run:
#   Q1. do `agent start` / `agent prompt` behave the same inside a NON-default
#       herdr session?
#   Q2. does an agent CLI start and work with a PRIVATE HOME, and what is the
#       minimum that has to be present in that HOME?
#
# Phase A uses an empty private HOME to record the failure mode.
# Phase B adds only the provider credential file and a pre-seeded trust entry,
# and then asks the agent to write a file, which is the real end-to-end check.
#
# Never prints the contents of any credential file. Creates and destroys its own
# herdr session; never touches the operator's `default` session.
set -uo pipefail
SESS=fgos-agentprobe
SOCK=$HOME/.config/herdr/sessions/$SESS/herdr.sock
STAMP=$(date +%s)
WORK=/var/tmp/fgos-agentprobe-$STAMP
PRIV_A=/var/tmp/fgos-homeA-$STAMP
PRIV_B=/var/tmp/fgos-homeB-$STAMP
say() { echo "[$(date +%T)] $*"; }

cleanup() {
  say cleanup
  herdr session stop "$SESS" >/dev/null 2>&1
  sleep 1
  herdr session delete "$SESS" >/dev/null 2>&1
  rm -rf "$WORK" "$PRIV_A" "$PRIV_B"
  say "operator sessions left: $(herdr session list --json 2>/dev/null | python3 -c 'import sys,json;print(",".join(s["name"] for s in json.load(sys.stdin)["sessions"]))')"
}
trap cleanup EXIT

mkdir -p "$WORK" "$PRIV_A" "$PRIV_B/.claude"
# A private HOME must be PROVISIONED, not merely empty. With no ~/.zshrc, zsh runs
# its first-run wizard, which is an interactive prompt sitting where the shell
# prompt should be. herdr types the launch command into it, the wizard eats the
# first keystroke as its menu choice, and `claude ...` arrives as `laude ...`.
# Measured directly on the first run of this probe. An empty file is enough, and
# the wizard itself names the remedy.
touch "$PRIV_A/.zshrc" "$PRIV_B/.zshrc"

say "starting isolated session $SESS"
herdr --session "$SESS" server >/tmp/fgos-agentprobe-server.log 2>&1 &
for _ in $(seq 1 30); do [ -S "$SOCK" ] && break; sleep 0.5; done
[ -S "$SOCK" ] || { say "session socket never appeared"; exit 1; }
export HERDR_SOCKET_PATH="$SOCK"
say "socket up: $SOCK"

new_pane() { # $1 = HOME to inject
  herdr workspace create --cwd "$WORK" --label probe --env "HOME=$1" 2>&1 \
    | python3 -c "import sys,json;print(json.load(sys.stdin)['result']['root_pane']['pane_id'])"
}
# Ready == the ONLY foreground process is the shell itself. An earlier version of
# this waited for zero foreground processes, which never happens: an idle pane
# always lists its own shell. That loop always ran to its cap, and its "shell
# ready" line was a timeout being misread as a success.
wait_shell() {
  for i in $(seq 1 120); do
    n=$(herdr pane process-info --pane "$1" 2>/dev/null \
        | python3 -c "import sys,json;pi=json.load(sys.stdin)['result']['process_info'];fg=pi['foreground_processes'];print('ready' if len(fg)==1 and fg[0]['pid']==pi['shell_pid'] else 'busy')" 2>/dev/null)
    [ "$n" = "ready" ] && { say "shell ready after ~$((i/2))s"; return 0; }
    sleep 0.5
  done; say "shell NEVER became ready"; return 1
}
# `herdr pane read` prints PLAIN TEXT, not JSON. An earlier version parsed it as
# JSON, so every screen capture in this probe came back empty.
screen() { herdr pane read "$1" --source visible --lines 25 2>&1 | tail -14; }

echo; say "===== PHASE A: empty private HOME ====="
PA=$(new_pane "$PRIV_A"); say "pane=$PA"
wait_shell "$PA"
herdr agent start probe-a --kind claude --pane "$PA" --timeout 45000 -- --model haiku >/tmp/fgos-a.json 2>&1
say "agent start rc=$?"
head -c 240 /tmp/fgos-a.json; echo
say "--- screen ---"; screen "$PA"

echo; say "===== PHASE B: private HOME + credential + trust ====="
cp "$HOME/.claude/.credentials.json" "$PRIV_B/.claude/.credentials.json" 2>/dev/null && say "credential copied (contents never printed)" || say "NO credential file to copy"
python3 - "$PRIV_B/.claude.json" "$WORK" <<'PY'
import json,sys
cfg,work=sys.argv[1],sys.argv[2]
# Credentials and a trust entry are NOT enough. With a fresh config the agent
# starts and herdr reports it idle and interactive_ready while it actually sits
# in its own first-run onboarding wizard (theme picker), so a prompt sent then is
# swallowed. Measured on the previous run of this probe. The onboarding markers
# below are what an already-set-up profile carries.
json.dump({
 "hasCompletedOnboarding": True,
 "theme": "dark",
 "installMethod": "native",
 "projects": {work: {"allowedTools": [], "hasTrustDialogAccepted": True, "mcpServers": {},
   "enabledMcpjsonServers": [], "disabledMcpjsonServers": [], "history": []}},
}, open(cfg,'w'), indent=2)
print("trust + onboarding pre-seeded in the private HOME for", work)
PY
PB=$(new_pane "$PRIV_B"); say "pane=$PB"
wait_shell "$PB"
herdr agent start probe-b --kind claude --pane "$PB" --timeout 60000 -- --model haiku >/tmp/fgos-b.json 2>&1
RC=$?; say "agent start rc=$RC"
head -c 300 /tmp/fgos-b.json; echo

if [ $RC -eq 0 ]; then
  say "--- Q1: does agent prompt work in a non-default session? ---"
  herdr agent prompt probe-b "Use the Write tool to create turn-proof.txt in the current directory containing the single word READY. Then stop." --wait --timeout 90000 >/tmp/fgos-p.json 2>&1
  say "agent prompt rc=$?"
  # Poll for the deliverable rather than sleeping once: a turn that really runs
  # takes tens of seconds, and `agent prompt --wait` returning is not proof the
  # work happened -- that is the whole point of a receiver-written artifact.
  for _ in $(seq 1 40); do [ -f "$WORK/turn-proof.txt" ] && break; sleep 2; done
  say "turn-proof: $(test -f "$WORK/turn-proof.txt" && cat "$WORK/turn-proof.txt" || echo MISSING)"
  say "--- what the agent is actually showing ---"; screen "$PB"
else
  say "--- screen ---"; screen "$PB"
fi
rm -f /tmp/fgos-a.json /tmp/fgos-b.json /tmp/fgos-p.json /tmp/fgos-agentprobe-server.log
