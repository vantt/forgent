# phase-2-routing-10 — fix-first: reap reclaims orphaned checked-out branch after SIGKILL

Status: [DONE]

Outcome: fixed the crash-idempotency bug diagnosed and reproduced on cell 9.
`src/runner/worktree.mjs` now detects a branch already checked out at an
orphaned path (via `git worktree list --porcelain`) and reclaims it before
reuse — force-removing the stale directory if it still exists on disk,
pruning git's own bookkeeping if the directory is already gone —
`reclaimOrphanedCheckout(repoRoot, branch)`. `WorktreeError` now carries
`.category = 'worktree-fail'` alongside its existing `.errorClass`.
`src/runner/loop.mjs`'s `startupReap` wraps its own worktree operations so
any remaining `worktree-fail` during reap degrades the item to
`blocked`/`runner-crash-reclaim` instead of crashing the whole reap raw.

`test/e2e/runner-loop.test.mjs`'s previously-red crash-idempotency case
(owned by cell 9, left untouched in the working tree) now passes as-is.
Two new unit tests were added in `test/runner/worktree.test.mjs`
(`reclaimOrphanedCheckout`, plus `createWorktree`'s reclaim path for both
"path still exists" and "path already gone" sub-cases), replacing an old
test that had encoded the crash bug itself as the expected `createWorktree`
contract. One new unit test was added in `test/runner/loop.test.mjs`
reproducing cell 9's exact bug at the `startupReap` level (branch left
checked out, no `removeWorktree` call) and asserting a clean reap to
`proposed`.

Verify: `npm test` — 234/234 (229 baseline + 3 e2e, all green, plus 5 new
unit cases net of the 2 old assertions replaced).

Files touched (committed in this cell's single commit):

- `src/runner/worktree.mjs`
- `src/runner/loop.mjs`
- `test/runner/worktree.test.mjs`
- `test/runner/loop.test.mjs`
- `.bee/cells/phase-2-routing-10.json`

Full trace, verify output, and behavior-change evidence:
`.bee/cells/phase-2-routing-10.json`.
