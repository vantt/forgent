#!/usr/bin/env bash
# The whole coupling, proven end to end: an isolated herdr session, a private
# HOME provisioned with all five items, an explicitly declared permission
# posture, and a real turn that must leave a file behind.
#
# The five items, each found by hitting its own failure earlier in this
# directory:
#   1. .zshrc                                  -- else zsh's first-run wizard eats the launch command
#   2. .claude/.credentials.json               -- provider auth
#   3. .claude.json hasCompletedOnboarding     -- else the agent sits in its own onboarding wizard
#   4. .claude.json projects[cwd] trust        -- else the folder-trust dialog
#   5. .claude/settings.json
#      skipDangerousModePermissionPrompt       -- else --dangerously-skip-permissions stops at
#                                                its one-time acceptance dialog
#
# On the operator's machine 1 and 5 are supplied invisibly, by a shell alias in
# ~/.zshrc and a key in ~/.claude/settings.json. A private HOME removes both,
# which is why an isolated worker stopped at a permission dialog while the
# operator's own sessions never do. The posture is therefore DECLARED here.
set -uo pipefail
SESS=fgos-provisioned
SOCK=$HOME/.config/herdr/sessions/$SESS/herdr.sock
STAMP=$(date +%s)
WORK=/var/tmp/fgos-prov-$STAMP
PRIV=/var/tmp/fgos-provhome-$STAMP
say() { echo "[$(date +%T)] $*"; }
cleanup() {
  herdr session stop "$SESS" >/dev/null 2>&1; sleep 1
  herdr session delete "$SESS" >/dev/null 2>&1
  rm -rf "$WORK" "$PRIV"
  say "sessions left: $(herdr session list --json 2>/dev/null | python3 -c 'import sys,json;print(",".join(s["name"] for s in json.load(sys.stdin)["sessions"]))')"
}
trap cleanup EXIT

mkdir -p "$WORK" "$PRIV/.claude"
touch "$PRIV/.zshrc"                                                   # 1
cp "$HOME/.claude/.credentials.json" "$PRIV/.claude/.credentials.json" # 2
python3 - "$PRIV" "$WORK" <<'PY'
import json,sys,os
priv,work=sys.argv[1],sys.argv[2]
json.dump({"hasCompletedOnboarding":True,"theme":"dark","installMethod":"native",   # 3
 "projects":{work:{"allowedTools":[],"hasTrustDialogAccepted":True,"mcpServers":{}, # 4
  "enabledMcpjsonServers":[],"disabledMcpjsonServers":[],"history":[]}}},
 open(os.path.join(priv,'.claude.json'),'w'), indent=2)
json.dump({"skipDangerousModePermissionPrompt":True},                               # 5
 open(os.path.join(priv,'.claude','settings.json'),'w'), indent=2)
print("private HOME provisioned with all five items")
PY

herdr --session "$SESS" server >/dev/null 2>&1 &
for _ in $(seq 1 30); do [ -S "$SOCK" ] && break; sleep 0.5; done
export HERDR_SOCKET_PATH="$SOCK"
say "isolated session up"

P=$(herdr workspace create --cwd "$WORK" --label prov --env "HOME=$PRIV" 2>&1 \
    | python3 -c "import sys,json;print(json.load(sys.stdin)['result']['root_pane']['pane_id'])")
for i in $(seq 1 120); do
  n=$(herdr pane process-info --pane "$P" 2>/dev/null \
      | python3 -c "import sys,json;pi=json.load(sys.stdin)['result']['process_info'];fg=pi['foreground_processes'];print('ready' if len(fg)==1 and fg[0]['pid']==pi['shell_pid'] else 'busy')" 2>/dev/null)
  [ "$n" = "ready" ] && break; sleep 0.5
done
say "pane=$P shell ready"

# posture DECLARED, not inherited from any shell alias
herdr agent start prov-a --kind claude --pane "$P" --timeout 60000 \
  -- --model haiku --dangerously-skip-permissions >/tmp/prov-start.json 2>&1
say "agent start rc=$?"
head -c 200 /tmp/prov-start.json; echo
say "argv: $(herdr pane process-info --pane "$P" 2>/dev/null | python3 -c "import sys,json;print(' '.join(p['cmdline'] for p in json.load(sys.stdin)['result']['process_info']['foreground_processes']))")"

herdr agent prompt prov-a "Use the Write tool to create turn-proof.txt in the current directory containing the single word READY. Then stop." --wait --timeout 90000 >/dev/null 2>&1
say "agent prompt rc=$?"
for _ in $(seq 1 45); do [ -f "$WORK/turn-proof.txt" ] && break; sleep 2; done
echo "================= VERDICT ================="
if [ -f "$WORK/turn-proof.txt" ]; then
  echo "PASS -- unattended turn completed with no human input: $(cat "$WORK/turn-proof.txt")"
else
  echo "FAIL -- no artifact; screen below"; herdr pane read "$P" --source visible --lines 25 2>&1 | tail -16
fi
echo "==========================================="
rm -f /tmp/prov-start.json
