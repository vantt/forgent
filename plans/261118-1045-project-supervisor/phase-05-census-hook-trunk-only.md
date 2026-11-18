# Phase 5 — Census refusal only on trunk commits

The pre-commit hook refuses any commit that stages a census-listed file without the regenerated census. A seat that edits such a file on its branch has its runner commit refused after a passing round. This phase narrows the refusal to commits made on the trunk. Branch commits pass; `fgos land` regenerates and gates the census at landing (phase 7). Node, edit in place (a landed Node hook is edited, not ported).

## Inputs
Step 0 first: re-grep every item. A finding that changes a plan decision stops the phase with `NEEDS_CONTEXT`.
- `.githooks/pre-commit`: `censusDriftRefusal` at `:424` (header comment `:421-423`, refusal text `:451-452`); its caller `:585`. Plan.md cites `:420-438`; the function really spans `:424-455`.
- Branch read pattern: `:376-379` (`git symbolic-ref --short -q HEAD`, detached HEAD gives an empty result).
- Trunk detection precedent (Node): `detectTrunk` at `src/runner/worktree.mjs:476-482`: the `refs/remotes/origin/HEAD` target, else a local `main` or `master` branch, else `main`. It reads through the native Git addon, so the hook may not be able to import it.
- Test owner: `test/githooks/census-drift.test.mjs`: fixture at `:20-34` (scratch repo on `main`, no `origin`), tests at `:35`, `:49`, `:59`, `:77`, `:93`.
- Backlog row `p-t55xjys4u5` in `docs/backlog.md:22` (the problem and its trial source). Closing the row is phase 19.
- Census scanner: `scripts/git-one-door-scan.mjs` (`censusDrift`, `MUTATION_CENSUS_PATH`).

## Footprint
`.githooks/pre-commit`, `test/githooks/census-drift.test.mjs`.

## Steps
1. In `censusDriftRefusal`, before any scan work, decide whether the commit is on the trunk:
   - branch = `git symbolic-ref --short -q HEAD` in `committingToplevel`;
   - trunk = the short name behind `refs/remotes/origin/HEAD` when it resolves, else a local `main` or `master` branch, else `main` (the `detectTrunk` rule);
   - on a branch that is not the trunk, return `null` (no refusal);
   - on the trunk, or on a detached HEAD (empty branch name), keep the current check. Detached fails closed.
2. Do not add a second trunk detector if the hook can import `detectTrunk`; the hook is a standalone script that must also run in a probe tree, so if the import is not safe there, keep the three-line read above and say so in the comment. Step 0 decides.
3. Rewrite the header comment of `censusDriftRefusal`: it states the rule (trunk commits only) and why (a branch is gated and regenerated when it lands). No plan or phase ids.
4. Tests in `census-drift.test.mjs` (extend, do not copy cases):
   - a drifting staged file on a non-trunk branch (`git checkout -b feature/x` in the fixture) commits with exit 0;
   - the same drift on `main` is refused (the existing first test owns it; assert it still passes);
   - a detached HEAD with drift is refused;
   - a fixture with an `origin/HEAD` pointing at `trunk` refuses on `trunk` and passes on `main` (one test).

## Verify
- `node scripts/run-tests.mjs test/githooks/census-drift.test.mjs` passes.
- `node scripts/run-tests.mjs test/githooks` passes.
- Manual, scratch repo only: commit a census-listed edit on a branch with the real hook: allowed; on `main`: refused with the existing message.

## Rollback
Revert the phase commit. The old hook refuses on every branch again; branch seats then need the hand census fix as before.
