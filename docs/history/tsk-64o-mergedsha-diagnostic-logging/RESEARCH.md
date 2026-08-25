# RESEARCH — tsk-64o mergedSha diagnostic logging

Accumulating research log for tsk-64o (fgos-researching helper, invoked from
fgos-coding-discovering). Each round is dated and appended, never overwritten.

## Round 1 — 2026-08-20

**Asked:** tsk-64o's description cites file/function locations
(`bin/fgos.mjs:resolveRefSha`, `moveDeliveredOrRecordFault`) for the two
points that compute `mergedSha` before calling `moveWork`, plus a third
GitHub-path point reading `result.mergeCommit?.oid`. Are these locations
still accurate in the current tree, and does the current code already log
`mergedSha` unconditionally (success or failure) anywhere, or only on
`moveWork` failure — the exact gap tsk-64o asks to close?

**Checked:**

- `rg -n "resolveRefSha" bin/fgos.mjs src/runner/*.mjs` — `resolveRefSha` is
  defined in `src/runner/worktree.mjs:163`, not `bin/fgos.mjs` (only a
  comment pointer at `bin/fgos.mjs:142`). It is imported and called from
  `src/verbs/merge/approve.mjs:48,792`. **Item's file citation is stale** —
  the real call site moved to `src/verbs/merge/approve.mjs` at some point
  after the item was written; `bin/fgos.mjs` itself no longer contains this
  logic directly.
- `rg -n "moveDeliveredOrRecordFault|mergedSha|mergeCommit" src/verbs/merge/approve.mjs`
  — confirmed exactly 3 places `mergedSha`/`mergedInto` are computed before
  a `moveWork(..., to: 'delivered', ...)` call:
  1. `src/verbs/merge/approve.mjs:636` — leaf-into-root merge:
     `const mergedSha = currentHead(ephemeral.path);` then
     `moveDeliveredOrRecordFault(dir, id, 'leaf-into-root merge', testForceLockTimeoutId, { mergedSha, mergedInto: rootBranch })`
     at line 637.
  2. `src/verbs/merge/approve.mjs:792` — root-into-main merge:
     `const mergedSha = resolveRefSha(repoRoot, 'main');` then
     `moveDeliveredOrRecordFault(dir, id, 'root-into-main merge', testForceLockTimeoutId, { mergedSha, mergedInto: 'main' })`
     at line 793. Comment at lines 787-791 explicitly notes this reuses the
     "same resolveRefSha-of-the-target-branch approach as the leaf-into-root
     path above" — this is the path tsk-64o's description says tsk-5dk went
     through ("root-into-main, 'verify skipped: the merged tree is identical
     to...' fast path").
  3. `src/verbs/merge/approve.mjs:358` — GitHub path:
     `moveWork(dir, { id, to: 'delivered', ..., mergedSha: result.mergeCommit?.oid, mergedInto: 'main' })`
     — calls `moveWork` **directly**, not through `moveDeliveredOrRecordFault`
     (no try/catch guard, no fault-log path). This is a structurally
     separate call site from the two local-merge paths above.
- `rg -n "skipRedundantChecks|verify skipped" src/runner/merge.mjs` — the
  "verify skipped: the merged tree is identical to ..." message the item
  cites is `src/runner/merge.mjs:1257`, gated by `skipRedundantChecks =
  mergedTreeAlreadyVerified(repoRoot, item, branch)` at line 1250. This fast
  path only skips the goal-check re-run — it does NOT skip the
  `mergedSha`/`moveWork` call in `approve.mjs` (both `636`/`792` run
  unconditionally after `merge()` returns a `'merged'` outcome, regardless
  of whether `skipRedundantChecks` fired inside it).
- Read `src/verbs/merge/approve.mjs:74-99` (`moveDeliveredOrRecordFault`
  itself). Confirmed: `mergedSha`/`mergedInto` are passed straight into
  `moveWork(...)` at line 85 inside a `try`. **No logging of `mergedSha`
  happens before this call today, on either the success or failure branch.**
  Only on the `catch` branch (an `EventLogError`, e.g. `lock-timeout`) does
  `recordApprovePostSuccessFault(dir, { id, phase, detail: err.message })`
  fire (line 98) — and that record does not even include `mergedSha`, only
  `err.message`. **On the success branch (the one tsk-5dk actually took —
  `moveWork` returned an `event`, not an error), nothing is ever written
  anywhere with the `mergedSha` value that was passed in.** This exactly
  matches the gap tsk-64o's description names: "ghi lại giá trị mergedSha
  ngay trước khi gọi moveWork ... bất kể thành công hay thất bại, không chỉ
  khi lỗi."
- Read `src/cli/approve-fault-log.mjs` in full. `recordApprovePostSuccessFault(dir,
  { id, phase, detail })` is a plain `fs.appendFileSync` to
  `approve-post-success-faults.jsonl` in `dir` (no `events.lock` sharing,
  never throws into its caller). Its existing shape (`{ts, id, phase,
  detail}`) is the established durable-log pattern already in place for
  this exact call site — a natural place to route a new unconditional
  `mergedSha` record through, either by widening this function's own record
  shape or adding a parallel append call at the same site.

**Found — answers the two questions asked:**
1. The item's own file/function citations are stale on the exact file
   (`bin/fgos.mjs` → really `src/verbs/merge/approve.mjs`) but accurate on
   function names (`resolveRefSha`, `moveDeliveredOrRecordFault`) and on
   there being exactly 3 relevant call sites, not 2 — matching the item's
   own third point ("và điểm GitHub path đọc `result.mergeCommit?.oid`").
2. Today, `mergedSha` is computed at all 3 sites but never durably recorded
   anywhere on the success branch — only a failure (`EventLogError`) is
   logged, and even that log entry omits `mergedSha`. Two of the three sites
   (`636`, `792`) funnel through one shared function
   (`moveDeliveredOrRecordFault`), so one unconditional pre-`moveWork` log
   line inside that function (line ~85, before the `moveWork` call) covers
   both. The third (GitHub path, line 358) calls `moveWork` directly and
   needs its own separate log line, since it never goes through
   `moveDeliveredOrRecordFault`.

**Still open:** none for this specific ambiguity (locations + current
logging gap) — this was the concrete question posed to close discovery.
Whether the new unconditional log widens `approve-fault-log.mjs`'s existing
record shape or adds a second log file is a planning-stage design choice,
not a discovery-stage ambiguity — either is mechanically fine given the
evidence above.

**Verify (real, runnable):** `npm test -- test/verbs/merge/approve.test.mjs`
(existing suite for this file) stays green after adding the log calls, plus
a new assertion that `approve-post-success-faults.jsonl` (or whichever file
the planning stage picks) gains one record per successful local-merge/
GitHub-merge `approve` call, carrying the `mergedSha` value that was passed
into `moveWork`.
