# tsk-2eq — leaf approve's main-checkout lock resolves to a discarded worktree

## Feature boundary

Fix the lock-scope bug in the **leaf-into-root merge path** of `approve`
only: `mergeRunnerItem` is called with `ephemeral.path` (a freshly-created,
freshly-`.fgos`-stripped worktree, per ADR0020) instead of the real repo
root, so the lock file it acquires is guaranteed fresh every call and never
actually contends. Root-into-main approve is unaffected — it already passes
the real `repoRoot`.

Out of scope: the separate `catchup` path (`bin/fgos.mjs` — target-into-item
merge for `blocked` items) does not call `mergeRunnerItem`/
`acquireMainCheckoutLock` at all today. That is a different, more severe bug
class (no lock whatsoever, not a wrong-scope lock) and is not covered by
this item's own description or acceptance criteria — flagged here for
separate filing, not fixed here.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | tsk-2eq proceeds now, unblocked by `tsk-45y`. The item's own description flags an unresolved design tension against `tsk-45y` ("worktrees should not be blocked by `.fgos` locking at all") as needing a human tie-break before this fix lands (per an older 2026-08-01 research report's explicit sequencing). A same-day 2026-08-02 report (`plans/reports/internal-design-260802-0907-merge-harness-v2-locked-decisions-report.md`, its own D3) re-scanned the code and found the framing wrong: `main-checkout.lock` and `events.lock` are, and always have been, two separate lock files; `main-checkout.lock` only ever guards the `claim` moment and the merge/verify/commit window, never ordinary state writes; ADR0020 already gives every dispatch worktree zero writable `.fgos` path. tsk-45y's actual complaint matches a different, already-fixed item (`tsk-56t`, done — `EnterWorktree` + cwd-relative `dataDir()` could recreate a divergent local `.fgos/events.jsonl`), not this lock. User confirmed: proceed now rather than wait for a separate tsk-45y resolution pass. |

## Pinned assumptions (deferred to `fgos-coding-planning`)

- The fix mechanism itself — e.g. splitting a `lockRoot` parameter from the
  git-operation `cwd` inside `mergeRunnerItem`/`mergeRunnerItemLocked` — is
  an implementation decision, not decided here. Confirmed as a real
  constraint during scouting: `repoRoot` inside `mergeRunnerItemLocked`
  (`src/runner/merge.mjs:694`) is not only the lock-file root but also the
  `cwd` for every git operation (`isAlreadyMerged`, `runGoalCheck`, the
  merge/commit calls) — simply swapping in the real `repoRoot` everywhere
  would move those git operations off the ephemeral worktree and onto the
  real checkout, landing the merge on `main`'s working tree instead of
  `fgw/<root>`. This is the exact "acceptance-criterion warning" already
  present in the item's own description; planning must design the fix so
  the lock resolves to the real repo root while git operations keep running
  against `ephemeral.path`.
- The `catchup` path's own missing-lock gap (see Feature boundary) is noted
  but not filed as a new item by this session — left for whoever picks it
  up next, per this item's own "not yet actioned" filing posture.

## Pinned terms

- **leaf approve**: `approve` of a non-root item, merging its branch into
  its parent root's integration branch (`fgw/<rootId>`) — as opposed to
  **root approve**, merging a root's own branch into `main`.
- **ephemeral worktree**: a throwaway worktree created solely to stage one
  merge (`withMergeEphemeralWorktree`, `src/runner/worktree.mjs:433`),
  force-removed once the merge attempt settles either way.

## Scout evidence cited

- `bin/fgos.mjs:2174` — leaf approve calls
  `mergeRunnerItem(ephemeral.path, item, { timeoutMs })` inside
  `withMergeEphemeralWorktree(repoRoot, rootId, ...)` (line 2173).
- `bin/fgos.mjs:2248` — root approve calls
  `mergeRunnerItem(repoRoot, item, { timeoutMs })` — real repo root, this
  path is unaffected.
- `src/runner/worktree.mjs:433-440` — `withMergeEphemeralWorktree` wraps
  `createWorktree` + a `finally` that force-removes the worktree.
- `src/runner/worktree.mjs:314-317` (`createWorktree`) —
  `fs.rmSync(path.join(worktreePath, '.fgos'), { recursive: true, force:
  true })` strips any checked-out `.fgos/` from every fresh worktree, per
  ADR0020.
- `src/runner/merge.mjs:619-670` (`mergeRunnerItem`) — `const fgosDir =
  path.join(repoRoot, '.fgos')` (line 642), then `acquireMainCheckoutLock(
  fgosDir, ...)` (line 651). When `repoRoot` is `ephemeral.path`, `fgosDir`
  points inside a directory that was just stripped of `.fgos` — the lock
  helper's own `fs.mkdirSync(dir, { recursive: true })` silently recreates
  it, so the lock is always fresh and never contends.
- `src/runner/merge.mjs:694` (`mergeRunnerItemLocked`) — confirms `repoRoot`
  is reused as the `cwd` for `isAlreadyMerged`, `runGoalCheck`, and the
  downstream merge/commit git calls, not just for lock resolution.
- `bin/fgos.mjs:2416-2511` (`catchup` case) — a separate ephemeral-worktree
  merge path that never calls `acquireMainCheckoutLock` at all; confirms
  the out-of-scope note above.
- `plans/reports/internal-research-260801-1823-merge-mechanism-grand-orchestrator-design-report.md`
  — original diagnosis (Family 4), and the now-superseded sequencing that
  gated tsk-2eq behind a human tie-break on tsk-45y.
- `plans/reports/internal-design-260802-0907-merge-harness-v2-locked-decisions-report.md`
  (D3) — the same-day re-scan that resolves the tsk-45y gate, cited in
  full for D1 above.
- `impact-analysis: full` — GitNexus registered and `present`
  (`fgos tool query --capability impact-analysis --status present`), so the
  CLAUDE.md impact-analysis gate applies at its normal strength once
  implementation starts (`fgos-coding-planning`/`fgos-coding-implement`'s concern, not
  this skill's).

## Canonical references

- `docs/decisions/0020-chan-fgos-khoi-worktree-worker.md` (ADR0020) — why
  worktrees never carry a writable `.fgos/`.
- Item refs already on `tsk-2eq`: the two report paths cited above.

## Outstanding questions deferred to planning

None outstanding — the fix mechanism itself (lock-root vs git-op-cwd split)
is fully an implementation decision, pinned as an assumption above rather
than left open.
