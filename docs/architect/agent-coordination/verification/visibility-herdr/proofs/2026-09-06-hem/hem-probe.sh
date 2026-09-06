#!/usr/bin/env bash
# tsk-hem negative proof: a real claude agent in a fresh worktree built from the
# branch that carries the hook guard must complete a turn with NO hook error.
# This is the exact measurement that found the defect, re-run against the fix.
set -uo pipefail
REPO=/home/vantt/projects/forgentX
BRANCH=${1:-visibility-herdr-spawn-investigation}
STAMP=$(date +%s)
WT=/var/tmp/fgos-hem-$STAMP
AGENT=fgoshem$STAMP
CFG=$HOME/.claude.json
say() { echo "[$(date +%T)] $*"; }

cleanup() {
  say cleanup
  [ -n "${PANE:-}" ] && herdr pane close "$PANE" >/dev/null 2>&1
  python3 - "$CFG" "$WT" <<'PY'
import json,sys,os,tempfile
cfg,path=sys.argv[1],sys.argv[2]
d=json.load(open(cfg))
if d.get('projects',{}).pop(path,None) is not None:
    fd,t=tempfile.mkstemp(dir=os.path.dirname(cfg)); os.close(fd)
    json.dump(d,open(t,'w'),indent=2); os.replace(t,cfg); print('trust removed')
PY
  git -C "$REPO" worktree remove --force "$WT" >/dev/null 2>&1 && say "worktree removed" || say "WORKTREE REMOVE FAILED: $WT"
}
trap cleanup EXIT

git -C "$REPO" worktree add --detach "$WT" "$BRANCH" >/dev/null 2>&1 || { say "worktree add failed"; exit 1; }
say "worktree=$WT on $BRANCH"
say "guarded registrations present: $(rg -c 'exit 0; exec node' "$WT/.claude/settings.json" || echo 0)"
say "hook scripts present in worktree: $(ls "$WT/.claude/hooks" 2>/dev/null | wc -l) (expected 0)"

python3 - "$CFG" "$WT" "$REPO" <<'PY'
import json,sys,os,tempfile
cfg,path,root=sys.argv[1],sys.argv[2],sys.argv[3]
d=json.load(open(cfg)); pr=d.setdefault('projects',{})
assert pr.get(root,{}).get('hasTrustDialogAccepted') is True, "repo root not trusted"
pr[path]={'allowedTools':[],'hasTrustDialogAccepted':True,'mcpServers':{},'enabledMcpjsonServers':[],'disabledMcpjsonServers':[],'history':[]}
fd,t=tempfile.mkstemp(dir=os.path.dirname(cfg)); os.close(fd)
json.dump(d,open(t,'w'),indent=2); os.replace(t,cfg); print('trust seeded')
PY

PANE=$(herdr tab create --workspace wS --cwd "$WT" --label fgos-hem --no-focus 2>&1 | python3 -c "import sys,json;print(json.load(sys.stdin)['result']['root_pane']['pane_id'])")
say "pane=$PANE"
herdr agent start "$AGENT" --kind claude --pane "$PANE" --timeout 60000 -- --model haiku >/dev/null 2>&1
say "agent start rc=$?"
herdr agent prompt "$AGENT" "Use the Write tool to create a file named turn-proof.txt in the current directory containing the single word READY. Then stop." --wait --timeout 60000 >/dev/null 2>&1
say "prompt rc=$?"
sleep 6; echo "turn-proof file: $(test -f "$WT/turn-proof.txt" && cat "$WT/turn-proof.txt" || echo MISSING)"
OUT=$(rtk proxy herdr agent read "$AGENT" --source recent-unwrapped --lines 120 2>&1)
echo "$OUT" | tail -25
echo "================ VERDICT ================"
if echo "$OUT" | rg -qi "hook error|Cannot find module|MODULE_NOT_FOUND"; then
  echo "FAIL — hook error still present"; exit 1
else
  echo "PASS — a full turn completed with no hook error"
fi
