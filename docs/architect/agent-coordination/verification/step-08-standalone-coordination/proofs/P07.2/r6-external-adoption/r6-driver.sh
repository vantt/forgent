#!/usr/bin/env bash
# r6-driver.sh -- R6 external-adoption live proof driver. Documents the
# EXACT real commands run against /home/vantt/projects/mdview (a real,
# independently-running, non-fgOS-source project) for reproducibility. This
# is a record of what was executed, not a script meant to be re-run blind
# (it targets this machine's real mdview checkout and a scratch dir under
# this session's own scratchpad) -- see summary in the final Doer report
# for narrative context.
#
# mdview boundary discipline (matches P05.2's own precedent): only ever
# writes into mdview's own gitignored `.fgos/*` (coordination sessions,
# assignments) or into THIS repo's own proof-artifacts directory. Never
# runs `git add`/`git commit`/`git push` inside mdview, never edits any of
# mdview's own git-tracked files.
set -euo pipefail

REPO_ROOT="/home/vantt/projects/forgentX"
MDVIEW="/home/vantt/projects/mdview"
SCRATCH="${1:?usage: r6-driver.sh <scratch-dir>}"
PROOF="$REPO_ROOT/docs/architect/agent-coordination/verification/step-08-standalone-coordination/proofs/P07.2/r6-external-adoption"

mkdir -p "$SCRATCH/pack" "$SCRATCH/install" "$SCRATCH/fake-home/.fgos"

# --- before snapshot (mdview tracked git state) ---
{
  echo "=== git status before ==="
  git -C "$MDVIEW" status
  echo "=== git diff before ==="
  git -C "$MDVIEW" diff
} > "$PROOF/mdview-git-status-before.txt"

# --- 1. installed/packed surface: npm pack + npm install -g into a scratch
#     prefix, exactly the precedent test/install-packaging.test.mjs already
#     established for this repo (never npm link -- that would symlink back
#     to this dev checkout's live source, defeating "installed/packed, not
#     source"). ---
(cd "$REPO_ROOT" && npm pack --json --pack-destination "$SCRATCH/pack") > "$SCRATCH/pack.json"
TARBALL=$(ls "$SCRATCH/pack"/*.tgz | head -1)
npm install -g "$TARBALL" --prefix "$SCRATCH/install"
FGOS_BIN="$SCRATCH/install/bin/fgos"

# --- 2. deliberately-broken fake-GLOBAL fgOS config, used ONLY for the
#     config-precedence sub-proof below (HOME override, never touches the
#     real machine-wide ~/.fgos/config.json other concurrent sessions rely
#     on). Real claude-CLI credentials are symlinked in so the live
#     dispatch itself still authenticates -- isolating only fgOS's own
#     global config resolution, not breaking the executor's own auth. ---
cat > "$SCRATCH/fake-home/.fgos/config.json" <<'EOF'
{
  "runner": {
    "executor": { "command": "__R072_FAKE_GLOBAL_NONEXISTENT_EXECUTOR__", "args": ["{prompt}"] },
    "models": { "light": "fake-global-light", "standard": "fake-global-standard", "heavy": "fake-global-heavy" },
    "timeoutMs": 111111
  }
}
EOF
ln -sfn "$HOME/.claude" "$SCRATCH/fake-home/.claude"
ln -sfn "$HOME/.claude.json" "$SCRATCH/fake-home/.claude.json"

# --- 3. config-awareness doctor check, from mdview's own cwd, under the
#     fake-global HOME -- proves `active: project`, global also present. ---
(cd "$MDVIEW" && HOME="$SCRATCH/fake-home" "$FGOS_BIN" doctor) > "$PROOF/config-precedence/doctor-output-under-fake-global-home.json"

# --- 4. real, live `coordination run` from mdview's own cwd under the
#     fake-global HOME -- proves the resolved policy provenance
#     (model="sonnet", mdview's real project value) wins over the fake
#     global's ("fake-global-standard"), even though the live LLM step
#     itself hits an unrelated auth artifact caused by isolating HOME.
#     NOTE: "sonnet" is also fgOS's own hardcoded default for the
#     `standard` tier, so this run alone does not distinguish "read
#     mdview's real project config" from "silently fell through to the
#     hardcoded default" -- see config-precedence/config-precedence-notes.md
#     for the follow-up rerun (op_006) that closes that gap with a
#     distinguishable real project value ("opus"). ---
(cd "$MDVIEW" && HOME="$SCRATCH/fake-home" "$FGOS_BIN" coordination run \
  --file "$PROOF/agent-led-request-mdview.json" --executor claude) \
  > "$PROOF/config-precedence/agent-led-envelope-under-fake-global-home.json" || true

# --- 5. real, live `coordination run` from mdview's own cwd, REAL HOME
#     (unmodified, so claude auth resolves normally) -- the primary R6
#     end-to-end proof: no source-repo cwd/import assumption, real
#     dispatch, real evidence persisted under mdview's own gitignored
#     .fgos/. Both agent-led and declared-protocol kinds, per R6's text. ---
(cd "$MDVIEW" && "$FGOS_BIN" coordination run --file "$PROOF/agent-led-request-mdview.json" --executor claude) \
  > "$PROOF/cli-output/agent-led-envelope.json"
(cd "$MDVIEW" && "$FGOS_BIN" coordination run --file "$PROOF/declared-consult-request-mdview.json" --executor claude) \
  > "$PROOF/cli-output/declared-consult-envelope.json"

# --- 6. `coordination show`, read-only, real -- reproducible evidence
#     export: copy the real persisted session/assignment/run state out of
#     mdview's own gitignored .fgos/ into this repo's proof-artifacts dir. ---
COORD_ID=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$PROOF/cli-output/declared-consult-envelope.json','utf8')).data.coordinationId)")
(cd "$MDVIEW" && "$FGOS_BIN" coordination show "$COORD_ID" --json) > "$PROOF/cli-output/show-envelope.json"

mkdir -p "$PROOF/evidence-export/coordination-sessions" "$PROOF/evidence-export/assignments"
cp -r "$MDVIEW"/.fgos/coordination/sessions/* "$PROOF/evidence-export/coordination-sessions/" 2>/dev/null || true
cp -r "$MDVIEW"/.fgos/assignments/* "$PROOF/evidence-export/assignments/" 2>/dev/null || true

# --- 7. after snapshot (mdview tracked git state) -- must byte-match the
#     before snapshot's git status/diff body. ---
{
  echo "=== git status after ==="
  git -C "$MDVIEW" status
  echo "=== git diff after ==="
  git -C "$MDVIEW" diff
} > "$PROOF/mdview-git-status-after.txt"

echo "R6 driver done."
