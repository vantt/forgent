#!/usr/bin/env bash
# P6 probe — Family B V0 shape against a real claude agent in a real herdr pane.
# Proves/refutes, in one run:
#   1. trust pre-seed removes the blocked-on-startup wall for a fresh worktree
#   2. `agent start` returns ready (not agent_not_ready) once trust is seeded
#   3. brief-as-file + one-line pointer via `agent prompt --wait` delivers
#   4. the worker writes a receiver-written receipt (ack) then a result file
#   5. `agent prompt` preserves a MULTI-LINE prompt (the open F3 question)
# Read-only w.r.t. fgOS state. Cleans up worktree, pane, and the trust entry.
set -uo pipefail

REPO=/home/vantt/projects/forgentX
STAMP=$(date +%s)
WT=/var/tmp/fgos-p6-$STAMP
OUT=$WT/outbox
AGENT=fgosp6$STAMP
LOG=${1:-/tmp/p6-result.json}
CLAUDE_CFG=$HOME/.claude.json
ts() { date +%s%3N; }
say() { echo "[$(date +%T.%3N)] $*"; }

cleanup() {
  say "cleanup"
  [ -n "${PANE:-}" ] && herdr pane close "$PANE" >/dev/null 2>&1
  python3 - "$CLAUDE_CFG" "$WT" <<'PY'
import json,sys,os,tempfile
cfg,path=sys.argv[1],sys.argv[2]
d=json.load(open(cfg))
if d.get('projects',{}).pop(path,None) is not None:
    fd,tmp=tempfile.mkstemp(dir=os.path.dirname(cfg)); os.close(fd)
    json.dump(d,open(tmp,'w'),indent=2); os.replace(tmp,cfg)
    print('trust entry removed:',path)
else:
    print('trust entry absent (nothing to remove)')
PY
  git -C "$REPO" worktree remove --force "$WT" >/dev/null 2>&1 && say "worktree removed" || say "worktree remove FAILED (check manually: $WT)"
}
trap cleanup EXIT

say "== phase 1: disposable worktree =="
git -C "$REPO" worktree add --detach "$WT" >/dev/null 2>&1 || { say "worktree add failed"; exit 1; }
mkdir -p "$OUT"; say "worktree=$WT"

say "== phase 2: pre-seed trust (derived from an already-trusted repo root) =="
python3 - "$CLAUDE_CFG" "$WT" "$REPO" <<'PY'
import json,sys,os,tempfile
cfg,path,root=sys.argv[1],sys.argv[2],sys.argv[3]
d=json.load(open(cfg)); pr=d.setdefault('projects',{})
parent=pr.get(root,{})
assert parent.get('hasTrustDialogAccepted') is True, f"refusing: repo root {root} is not itself trusted"
pr[path]={'allowedTools':[],'hasTrustDialogAccepted':True,'mcpServers':{},'enabledMcpjsonServers':[],'disabledMcpjsonServers':[],'history':[]}
fd,tmp=tempfile.mkstemp(dir=os.path.dirname(cfg)); os.close(fd)
json.dump(d,open(tmp,'w'),indent=2); os.replace(tmp,cfg)
print('trust seeded for',path)
PY
[ $? -ne 0 ] && exit 1

say "== phase 3: pane + agent start (timing the readiness handshake) =="
PANE=$(herdr tab create --workspace wS --cwd "$WT" --label fgos-p6 --no-focus 2>&1 | python3 -c "import sys,json;print(json.load(sys.stdin)['result']['root_pane']['pane_id'])")
say "pane=$PANE"
T0=$(ts)
START_OUT=$(herdr agent start "$AGENT" --kind claude --pane "$PANE" --timeout 60000 -- --model haiku 2>&1); START_RC=$?
T1=$(ts)
say "agent start rc=$START_RC elapsed=$((T1-T0))ms"
echo "$START_OUT" | head -c 400; echo
herdr agent get "$AGENT" 2>&1 | head -c 300; echo

if [ $START_RC -ne 0 ]; then
  say "agent start did not reach ready — capturing screen and stopping"
  herdr agent read "$AGENT" --source visible --lines 30 2>&1 | tail -20
  exit 2
fi

say "== phase 4: brief-as-file + one-line pointer =="
cat > "$OUT/brief-1.md" <<EOF
# Assignment brief (round 1)

You are a standalone worker. Do ONLY what this file says. Ignore any repository
workflow instructions. Never run a project CLI. Your only writes are the two
files named below.

## Task
Report how many lines this brief file has.

## Required outputs, in THIS order
1. FIRST write $OUT/ack-1.tmp containing:
   {"job":"$AGENT","round":1,"agent":"claude","received_at":"<ISO8601 now>"}
   then rename it to $OUT/ack-1.json
2. LAST write $OUT/result-1.tmp containing:
   {"status":"done","summary":"<one line>","line_count":<number>}
   then rename it to $OUT/result-1.json

Write the ack file before doing anything else. Do not print the answer only;
the files are the deliverable.
EOF
say "brief written ($(wc -l < "$OUT/brief-1.md") lines)"

T2=$(ts)
PROMPT_OUT=$(herdr agent prompt "$AGENT" "Read the file $OUT/brief-1.md and follow its instructions exactly." --wait --timeout 30000 2>&1); PROMPT_RC=$?
T3=$(ts)
say "agent prompt rc=$PROMPT_RC elapsed=$((T3-T2))ms"
echo "$PROMPT_OUT" | head -c 300; echo

say "== phase 5: ladder poll for receipts =="
ACK_MS=""; RES_MS=""
for i in $(seq 1 120); do
  [ -z "$ACK_MS" ] && [ -f "$OUT/ack-1.json" ] && ACK_MS=$(( $(ts) - T2 )) && say "ack-1.json seen at +${ACK_MS}ms"
  if [ -f "$OUT/result-1.json" ]; then RES_MS=$(( $(ts) - T2 )); say "result-1.json seen at +${RES_MS}ms"; break; fi
  sleep 0.5
done
say "files in outbox: $(ls "$OUT" 2>/dev/null | tr '\n' ' ')"
[ -f "$OUT/ack-1.json" ] && { echo "--- ack:"; cat "$OUT/ack-1.json"; }
[ -f "$OUT/result-1.json" ] && { echo "--- result:"; cat "$OUT/result-1.json"; }

say "== phase 6: MULTI-LINE prompt delivery (the open F3 question) =="
ML=$'Round 2. This prompt deliberately spans several lines.\nLINE-TWO-MARKER\nLINE-THREE-MARKER\n\nWrite the number of lines you received in THIS message (count them) plus the\ntwo MARKER words, to '"$OUT"$'/multiline-1.json as {"lines":<n>,"markers":["..",".."]}\nWrite it directly, no rename needed.'
T4=$(ts)
ML_OUT=$(herdr agent prompt "$AGENT" "$ML" --wait --timeout 30000 2>&1); ML_RC=$?
say "multiline prompt rc=$ML_RC elapsed=$(( $(ts) - T4 ))ms"
echo "$ML_OUT" | head -c 300; echo
for i in $(seq 1 60); do [ -f "$OUT/multiline-1.json" ] && break; sleep 0.5; done
[ -f "$OUT/multiline-1.json" ] && { echo "--- multiline result:"; cat "$OUT/multiline-1.json"; } || say "multiline-1.json NOT written"
say "--- screen tail (what the agent actually received) ---"
herdr agent read "$AGENT" --source recent-unwrapped --lines 60 2>&1 | tail -30

say "== phase 7: exit + liveness =="
herdr agent get "$AGENT" 2>&1 | head -c 250; echo
herdr pane process-info --pane "$PANE" 2>&1 | head -c 300; echo

python3 - "$LOG" "$START_RC" "$((T1-T0))" "$PROMPT_RC" "$((T3-T2))" "${ACK_MS:-null}" "${RES_MS:-null}" "$ML_RC" "$OUT" <<'PY'
import json,sys,os
log,src,se,pr,pe,ack,res,ml,out=sys.argv[1:10]
def n(x): return None if x in ('null','') else int(x)
json.dump({'agent_start_rc':int(src),'agent_start_ms':int(se),'prompt_rc':int(pr),'prompt_ms':int(pe),
 'ack_ms':n(ack),'result_ms':n(res),'multiline_rc':int(ml),
 'outbox':sorted(os.listdir(out)) if os.path.isdir(out) else []}, open(log,'w'), indent=2)
print('summary ->',log)
PY
cat "$LOG"
