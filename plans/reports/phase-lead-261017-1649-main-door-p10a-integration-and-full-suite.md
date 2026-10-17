# Main door P10 section A (repo-lock part): integration, full suite, review, smoke, landing readiness

Status: DONE_WITH_CONCERNS. Fence F10 honored: no state part, no `stateTx`, no hot-lock, no `events.lock`/`claims.lock` merge; `.gitattributes`, `merge=union`, `.fgos` strip rule untouched. Nothing merged to main, nothing activated, no fence placed in a real workspace.

## Integration
- Merged main (1 docs commit: program board row) into `main-door/integration` (`3dc1d3752`). Phases P00-P09 were already on the branch.
- Private build: `CARGO_TARGET_DIR=.fgos/runtime/phase-target`, `cargo build --release -p fgos -p fgctl` ok; this worktree's build link repointed to it; `node_modules` is a real dir. `FGOS_HOST_BIN` = that fgos.

## Evidence (session env vars unset)
- `cargo test --workspace`: 436 pass, 0 fail.
- Full `npm test` (before the fix commit): 8113 tests, 8020 pass, 4 fail, 14 skipped, 75 todo.
  - `test/cli/fgos-claim-2.test.mjs` "lock-status: nothing held": real defect of this branch's test. The npm door holds the machine-wide `full-suite` queue lock for the whole run, so that row is legitimately held inside it. Fixed: the test skips that one row only when `FGOS_FULL_SUITE_QUEUE_HELD=1`.
  - `test/scripts/check-decision-citation-drift.test.mjs`: `docs/specs/distribution.md:336` cited RUL18 with no gloss. Fails on main too (line came with the earlier lock lane); glossed in place. 31/31.
  - `test/runner/herdr-reconciliation.test.mjs` live-herdr case and `test/scripts/run-test-canary.test.mjs` wrapper-overhead median: load flakes (review subagent and suite overlapped). Both files re-run alone: 54/54 here and on main.
  - The runner trio and `skill-wrappers.test.mjs:755` did not fail in this run.
- After the fix commit (serial): `test/holder-lock/*`, `test/setup/holder-lock-checks`, `test/setup/registrations`, `test/cli/fgos-claim-2`, `test/scripts/check-decision-citation-drift`: 212 tests, 210 pass, 0 fail, 2 skipped (no NFS mount). The full suite was not repeated after this commit (changes: one git format string, one test guard, one doc gloss, one new test).
- Plan `rg` criterion, repo-lock part (`src bin scripts .githooks`): `FGOS_MAIN_LOCK_HOLDER_PID` only in `src/runner/dispatch/adapters.mjs:102,115` (scrubs a leaked value from worker env, on purpose). `HOLDER_PID_ENV_VAR`, `allowSelfRecognition`, `forceReclaimAmbiguousLock`, `acquireMainCheckoutLock`, `renewMainCheckoutLockIfOwn`, `heldMainCheckoutWriter`, `acquiringMainCheckoutWriter`: none. `lock.rs`: no `read_to_string`. `withEventsLock`, `withClaimsLock`, `claims.lock` remain by design (state part, on hold).
- Benchmark (criterion 5) belongs to the state part: not run.

## Review (one Sonnet round, `main...main-door/integration`)
Holds: lock rank order at every call site (slot, then worktree-admin, then main; `LockScope` throws `lock-order-violation`), fd borrowing (description only at slot 3, `gc.auto=0`/`maintenance.auto=false`, worker env drops `FGOS_LOCK_FD`, hook tests dev:ino and a non-blocking lock, sibling refused), no v1 path left, checkpoint adapter detachable (`repo-locks.mjs` imports only `holder-lock`; `repo-locks-multiprocess` runs without a checkpoint).
- Low, fixed: `mergeSlotCandidates` used `%(refname:short)`, which yields `heads/<name>` when a tag shares the name, so no tombstone for that slot. Now `%(refname:lstrip=2)`; new test fails without the fix.
- Info: a v1 slot file for a branch deleted before cutover is not fenced (matches the registry `fenceNote`).
- No second round needed.

## Smoke on a scratch clone (release from this branch, `fgctl init --from`, scratch HOME and state home, no real workspace)
`fgctl init` ok; `doctor`: `lock-fences` "all 11 legacy lock path(s) fenced", `lock-holders` 0 held, `lock-borrow-vectors` green, `lock-kernel-semantics`, `active-release-matches-checkout`, hook-wired (after `core.hooksPath`, set by hand in the clone) all pass.
- `take` ok. `pick` ok (worktree-admin). `return` ok. `approve` ok three times (merge under slot, main lock for commit/land). `lock-status`: 17 rows free. `lock fence main-checkout`, `worktree-admin`, `merge-slot --param ref=main`: all free, exit 0. Hand commit in the clone's main: hook passed. Workflow runner `--units` step: run started and ran; the unit failed `nonzero-process-exit` because the scratch HOME has no provider login (expected); no lock refusal.
- `sync-root`: refused only by git, `.fgos/distribution.json` staged by `fgctl init` in the clone (not a lock). Root-branch happy path not exercised.
- `lock-order-violation` or unexpected lock refusal: none.
- Clone-only artifacts, no defects: `detectTrunk` picked the clone's `origin/HEAD` (`main-door/integration`), so merges landed there, not on `main`; a `HOME` override broke `rustup` for the worktree setup command (set to empty in the clone); a missing git identity made the first `approve` block the item; `fgos edit --verify` after `pick` invalidates the claim revision (`settleClaim`), as designed.

## Landing readiness (section C, repo-lock part only)
Fences: `main-checkout` tombstone and one `merge-slot` tombstone per local ref. No `events.lock`/`claims.lock`/porting tombstones.
1. `which -a fgctl`: one path, the 4.4a build with the observe/install/activation fences (`~/.local/bin/fgctl`); if the 4.4a landing is not done, stop (its landing report is the gate).
2. Stop every writer in forgentX, mdview, mcp-skill-hub: agent sessions, `fgos run`, workflow runner, `fgos gateway stop`, background runner, panes. No process may hold `.fgos/main-checkout.lock` or `merge-slot--*.lock` v1 files (`fgos lock-status` of the old release, then `ls`). The quiesce scan blocks `doctor --fix` while any `fgos`/`fgctl` of the workspace runs.
3. Merge main into `main-door/integration` again (main moves), re-run `test/holder-lock`, `test/setup/holder-lock-checks`, then ff-merge into main from the main checkout (no branch switch).
4. Build, stage, activate in all three workspaces (vector and probe gates of the lock foundation run at activation); `fgctl` first, before any `doctor --fix`.
5. Per workspace `fgos doctor --fix` for `lock-fences` (stopped check, then tombstones for `main-checkout` and `merge-slot` per ref, then re-check). Branches created after this step get no slot tombstone: rerun `doctor --fix` after any new local branch while an old release could still run.
6. `fgos doctor` through the shim in all three: pass `active-release-matches-checkout`, `lock-fences`, `lock-borrow-vectors`, `lock-kernel-semantics`, `main-checkout-hook-wired`, `lock-holders` (no foreign holder). `lock-record-unreadable` does not exist yet (state part).
7. Smoke per workspace: `fgos take` a test item, `return`, hand commit in main (hook passes), `fgos lock-status`. Then rebase open worktrees onto the new main (old hooks refuse commits in main; workers unaffected).
8. Landing report: commit, activation id, doctor results, evidence that the v1 `acquireMainCheckoutLock`/v1 hook/v1 slot fail by name on the tombstones (test `fences-main-door` shows it).
Rollback: before step 5 revert the merge and activate the previous release in the three workspaces. After step 5: stop writers, revert, activate previous release, `rm -r` the tombstone directories listed by `fenceStatus` (main-checkout, merge slots), nothing else to undo (lock files only; event log and claim files unchanged). Old releases cannot take a tombstoned lock, so the tombstones must be removed before the old release runs.

## Decisions
- Fixed the three issues in this branch (test guard, doc gloss, tag-name fence); did not touch the runner trio or herdr/canary tests.
- Replaced the day of dogfood by the smoke above, per brief.

## Concerns
- Full `npm test` not repeated after the fix commit (narrow serial re-run is green).
- GitNexus index stale; reviewer cross-checked by grep. No HIGH/CRITICAL impact (fence listing helper, one test).
- A tag/branch name clash was the only fence defect found; refs deleted before cutover stay unfenced by design.

## Unresolved questions
None.
