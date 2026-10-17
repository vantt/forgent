# Main door P06, repo-lock part: worktree-admin around `git worktree add`

Status: DONE_WITH_CONCERNS. Fence F10 honored: no state-part contract; lock core imports nothing about the event log; `merge=union`, `.gitattributes`, `.fgos` strip untouched.

## Result
- `repo-locks.mjs`: new `addWorktreeSync(scope, repoRoot, args, {waitMs})` (default wait 30 s, queues concurrent adds); `addWorktree` unchanged (default one try). Shared `runWorktreeAdd`.
- `worktree.mjs`: `createWorktree` and `createDetachedMergeWorktree` add through the lock (rank 40, fresh scope unless `opts.scope`; `opts.waitMs`). `createClaimWorktree`/`createWorktree` take `startSha` (new branch forks from it when no `baseRef`). `beforeProvision` seam removed; `npm ci` already ran outside the lock. `HolderLockError` is rethrown, not wrapped into `WorktreeError`.
- `session.mjs` (one call), `integrate.mjs` (`createWorkflowWorktree`, `mergeWorkflowBranch`, optional `scope`): through `addWorktreeSync`.
- `claim-port.mjs`: passes `startSha: held.claim.headAtTake` (one line).
- `docs/architecture-manifest.json`: rows for `repo-locks`, `main-fgos-checkpoint`, `format-lock-duration`; stale `main-checkout-lock` row dropped (earlier phase left the manifest red).
- `worktree.test.mjs`: the beforeProvision test removed with its seam; the other asserts the scope is empty after create.
- `remove`/`prune` not wrapped (D8).

## Evidence
`FGOS_HOST_BIN` = host copied from the earlier phase build (Rust unchanged), `env -u CLAUDE_CODE_SESSION_ID -u CODEX_THREAD_ID -u FGOS_SESSION_ID`.
- New `test/runner/worktree-admin-multiprocess.test.mjs`: 8 processes x 20 adds, 161 worktrees registered, no `.git/worktrees` damage; main held does not block add and admin held does not block main; add under main = `lock-order-violation` (sync + async); sync wait/timeout/holder pid; `startSha`; `createWorkflowWorktree`; `createWorktree` held = `lock-held`. All pass.
- Phase files + repo-locks + worktree + callsite + session + architecture + `test/workflow/*.test.mjs` + `test/holder-lock/*.test.mjs`: 335 tests, 320 pass, 13 fail, 2 skipped. All 13 fail on `bin/fgos.mjs` importing deleted `main-checkout-lock.mjs`.
- On integration after merge (b66a1bf9a): worktree-admin, repo-locks, worktree, worktree-callsite, session, claim-port: 137 tests, 132 pass, 5 fail (the 5 `fgos unclaim` bin-spawning tests; same failing set as the integration tip before this phase).
- Broad `test/runner/**` + workflow + holder-lock + hook: 3327 tests, 36 fail; the same failing set as baseline for the sampled files; herdr idle test is a load flake, passes alone (51/51).
- Independent Sonnet review: no blocker. Medium (lock errors wrapped as `WorktreeError`) fixed with a test. Unused `scope` arg on `withMergeEphemeralWorktree` removed.

## Impact
GitNexus index stale; grep cross-check: `createWorktree` callers are the wrappers in worktree.mjs only; `createClaimWorktree` only `claim-port.mjs`. No HIGH/CRITICAL edit of an indexed public symbol beyond the `beforeProvision` removal (no remaining callers).

## Concerns / later phases
- `rg "'worktree', 'add'" src bin`: `repo-locks.mjs` plus `bin/fgos.mjs:3358` (P07 owns it).
- `bin/fgos.mjs` still imports the deleted lock module: unclaim, workflow, fanout, dispatch CLI tests stay red until P07.
- `session.mjs` uses its own scope, so rank is not checked against the sessions lock (worktree-admin is a leaf; no deadlock).

## Decisions
- Sync variant instead of making every creation helper async (blast radius).
- Default wait only on the sync variant; `addWorktree` keeps one try.
- Manifest rows fixed here because the architecture test could not reach later checks otherwise.
