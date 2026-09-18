#!/usr/bin/env bash
# Settles WHERE --dangerously-skip-permissions comes from.
#
# Observed but not explained: in the operator's default session, `agent start
# --kind claude` with no trailing args produced `claude --dangerously-skip-permissions`.
# In an isolated session, the same call WITH `-- --model haiku` produced an agent
# that stopped at a permission dialog. Two variables changed at once. This
# isolates them: same isolated session, two panes, one start with no trailing
# args and one with them, comparing the argv herdr actually launched.
#
# It is not in the default config and not in the detection manifest, so the
# remaining candidates are a built-in per-kind launch spec, or displacement by
# the caller's own trailing args.
set -uo pipefail
SESS=fgos-permprobe
SOCK=$HOME/.config/herdr/sessions/$SESS/herdr.sock
STAMP=$(date +%s)
WORK=/var/tmp/fgos-perm-$STAMP
PRIV=/var/tmp/fgos-permhome-$STAMP
say() { echo "[$(date +%T)] $*"; }
cleanup() {
  say cleanup
  herdr session stop "$SESS" >/dev/null 2>&1; sleep 1
  herdr session delete "$SESS" >/dev/null 2>&1
  rm -rf "$WORK" "$PRIV"
  say "sessions left: $(herdr session list --json 2>/dev/null | python3 -c 'import sys,json;print(",".join(s["name"] for s in json.load(sys.stdin)["sessions"]))')"
}
trap cleanup EXIT

mkdir -p "$WORK" "$PRIV/.claude"
touch "$PRIV/.zshrc"
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
say "isolated session up"

new_pane() {
  herdr workspace create --cwd "$WORK" --label perm --env "HOME=$PRIV" 2>&1 \
    | python3 -c "import sys,json;print(json.load(sys.stdin)['result']['root_pane']['pane_id'])"
}
wait_shell() {
  for i in $(seq 1 120); do
    n=$(herdr pane process-info --pane "$1" 2>/dev/null \
        | python3 -c "import sys,json;pi=json.load(sys.stdin)['result']['process_info'];fg=pi['foreground_processes'];print('ready' if len(fg)==1 and fg[0]['pid']==pi['shell_pid'] else 'busy')" 2>/dev/null)
    [ "$n" = "ready" ] && return 0; sleep 0.5
  done; return 1
}
argv_of() {
  herdr pane process-info --pane "$1" 2>/dev/null \
    | python3 -c "import sys,json;print(' '.join(p['cmdline'] for p in json.load(sys.stdin)['result']['process_info']['foreground_processes']))"
}

say "=== A: agent start with NO trailing args ==="
PA=$(new_pane); wait_shell "$PA"
herdr agent start perm-a --kind claude --pane "$PA" --timeout 45000 >/dev/null 2>&1
say "rc=$? argv: $(argv_of "$PA")"

say "=== B: agent start WITH trailing args ==="
PB=$(new_pane); wait_shell "$PB"
herdr agent start perm-b --kind claude --pane "$PB" --timeout 45000 -- --model haiku >/dev/null 2>&1
say "rc=$? argv: $(argv_of "$PB")"

say "=== C: trailing args INCLUDING the flag ==="
PC=$(new_pane); wait_shell "$PC"
herdr agent start perm-c --kind claude --pane "$PC" --timeout 45000 -- --model haiku --dangerously-skip-permissions >/dev/null 2>&1
say "rc=$? argv: $(argv_of "$PC")"
