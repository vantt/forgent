#!/usr/bin/env bash
# Functional verify for tsk-5fs (D1 + D2): exercises the real CLI end to end
# in an isolated temp git repo/store, never grepping source text — a
# literal-string grep on flag names is provably unreliable (matches
# comments/error strings, misses `flags.refs`/`flags['goal-tier']` parsing).
set -euo pipefail

REPO_ROOT="$(git rev-parse --show-toplevel)"
FGOS="$REPO_ROOT/bin/fgos.mjs"

tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

git -C "$tmp" init -q -b main
git -C "$tmp" config user.email test@example.com
git -C "$tmp" config user.name Test
echo seed > "$tmp/seed.txt"
git -C "$tmp" add seed.txt
git -C "$tmp" commit -q -m seed

cd "$tmp"
node "$FGOS" init > /dev/null

# D1: submit exposes the same optional fields add already has.
submit_out="$(node "$FGOS" submit "test item" \
  --refs a,b --parent zzz --footprint x.js,y.js \
  --goal-tier milestone --targets t1,t2 --urgent high)"
id="$(node -e "console.log(JSON.parse(process.argv[1]).data.id)" "$submit_out")"

after_submit="$(node "$FGOS" list --id "$id" --json)"
node -e "
const w = JSON.parse(process.argv[1]).data.work[process.argv[2]];
const need = { refs: ['a','b'], parent: 'zzz', footprint: ['x.js','y.js'], goalTier: 'milestone', targets: ['t1','t2'], urgent: 'high' };
for (const [k, v] of Object.entries(need)) {
  const got = JSON.stringify(w[k]);
  const want = JSON.stringify(v);
  if (got !== want) { console.error('D1 FAIL: submit field ' + k + ' got ' + got + ' want ' + want); process.exit(1); }
}
" "$after_submit" "$id"

# D2: goalTier is editable after creation via fgos edit.
node "$FGOS" edit "$id" --goal-tier mvp > /dev/null
after_edit="$(node "$FGOS" list --id "$id" --json)"
node -e "
const w = JSON.parse(process.argv[1]).data.work[process.argv[2]];
if (w.goalTier !== 'mvp') { console.error('D2 FAIL: goalTier not editable via fgos edit, got ' + JSON.stringify(w.goalTier)); process.exit(1); }
" "$after_edit" "$id"

echo OK
