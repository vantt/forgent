#!/usr/bin/env bash
# Why does `agent start ... -- --dangerously-skip-permissions` fail (rc=1) when
# the same start without it succeeds? The coupling rule this work is writing
# depends on that flag being usable, so the failure has to be explained rather
# than worked around.
set -uo pipefail
SESS=fgos-skipprobe
SOCK=$HOME/.config/herdr/sessions/$SESS/herdr.sock
STAMP=$(date +%s)
WORK=/var/tmp/fgos-skip-$STAMP
PRIV=/var/tmp/fgos-skiphome-$STAMP
say() { echo "[$(date +%T)] $*"; }
cleanup() {
  herdr session stop "$SESS" >/dev/null 2>&1; sleep 1
  herdr session delete "$SESS" >/dev/null 2>&1
  rm -rf "$WORK" "$PRIV"
  say "sessions left: $(herdr session list --json 2>/dev/null | python3 -c 'import sys,json;print(",".join(s["name"] for s in json.load(sys.stdin)["sessions"]))')"
}
trap cleanup EXIT

mkdir -p "$WORK" "$PRIV/.claude"; touch "$PRIV/.zshrc"
cp "$HOME/.claude/.credentials.json" "$PRIV/.claude/.credentials.json" 2>/dev/null
python3 - "$PRIV/.claude.json" "$WORK" <<'PY'
import json,sys
cfg,work=sys.argv[1],sys.argv[2]
json.dump({"hasCompletedOnboarding":True,"theme":"dark","installMethod":"native",
 "projects":{work:{"allowedTools":[],"hasTrustDialogAccepted":True,"mcpServers":{},
  "enabledMcpjsonServers":[],"disabledMcpjsonServers":[],"history":[]}}}, open(cfg,'w'), indent=2)
PY

herdr --session "$SESS" server >/dev/null 2>&1 &
for _ in $(seq 1 30); do [ -S "$SOCK" ] && break; sleep 0.5; done
export HERDR_SOCKET_PATH="$SOCK"

P=$(herdr workspace create --cwd "$WORK" --label skip --env "HOME=$PRIV" 2>&1 \
    | python3 -c "import sys,json;print(json.load(sys.stdin)['result']['root_pane']['pane_id'])")
for i in $(seq 1 120); do
  n=$(herdr pane process-info --pane "$P" 2>/dev/null \
      | python3 -c "import sys,json;pi=json.load(sys.stdin)['result']['process_info'];fg=pi['foreground_processes'];print('ready' if len(fg)==1 and fg[0]['pid']==pi['shell_pid'] else 'busy')" 2>/dev/null)
  [ "$n" = "ready" ] && break; sleep 0.5
done
say "pane=$P shell ready"

herdr agent start skip-a --kind claude --pane "$P" --timeout 45000 -- --dangerously-skip-permissions > /tmp/skip-start.json 2>&1
say "agent start rc=$?"
head -c 240 /tmp/skip-start.json; echo
say "--- argv actually launched ---"
herdr pane process-info --pane "$P" 2>/dev/null | python3 -c "import sys,json;print(' | '.join(p['cmdline'] for p in json.load(sys.stdin)['result']['process_info']['foreground_processes']))"
say "--- what is on the screen ---"
herdr pane read "$P" --source visible --lines 30 2>&1 | tail -18
rm -f /tmp/skip-start.json
