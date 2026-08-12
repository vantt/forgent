# tsk-3yl: plan

## Mode

Flags checked (auth / authorization / data model / audit-security /
external systems / public contracts / cross-platform / existing covered
behavior / weak proof around the area / multi-domain):

- **Existing covered behavior** — `mergeRunnerItem`/`mergeRunnerItemLocked`
  already has a dedicated test suite (`test/runner/merge.test.mjs:320-409`)
  covering merged/conflict/verify-fail/commit-hook-refusal/lock-held paths.
  This flag applies.
- No other flag applies: no auth/authorization, no data-model change, no
  external system, no public HTTP/API contract (the `outcome` enum is an
  internal return shape already unioned by both existing call sites), no
  cross-platform concern, no multi-domain fan-out, and the area is
  well-proven (not weak-proof) — the bug itself was caught by a real
  dogfood run, not a coverage gap.

**Mode: small.** One flag, no gray areas left (both material decisions —
scope of the fix, and D1 on the verify-on-short-circuit question — are
already locked in `CONTEXT.md`). The change is confined to one function in
one file, with no caller-side changes required (confirmed by scout: both
`bin/fgos.mjs` call sites already fall through generically on any outcome
other than `conflict`/`fgos-write-rejected`/`verify-fail`).

## Approach

`fgos graph tsk-3yl --json` shows this item in a component of size 1 — no
deps, no children, nothing else waiting on it. No split candidate to
compare via `--what-if`; this proceeds as one piece.

**Chosen path:** add an ancestry short-circuit at the top of
`mergeRunnerItemLocked` (`src/runner/merge.mjs:401`), before the existing
`git merge --no-commit --no-ff branch` call:

1. Run `git merge-base --is-ancestor <branch> HEAD` (via the module's
   existing `git()` helper, catching its non-zero exit rather than
   treating it as a thrown error — `git merge-base --is-ancestor` uses
   exit code as its actual return value, not an error signal).
2. If `<branch>` **is** an ancestor of `HEAD` (already merged):
   - Run the existing `runGoalCheck(item, repoRoot, timeoutMs)` unchanged
     (per `CONTEXT.md` D1 — no skip, no synthetic result).
   - If `!check.passed`, return `{ outcome: 'verify-fail', branch, check }`
     — identical shape to the normal path's verify-fail return.
   - If `check.passed`, return `{ outcome: 'merged', branch, check }`
     directly — skip `git merge --no-commit --no-ff` and `git commit`
     entirely, since there is nothing to stage or commit.
3. If `<branch>` is **not** an ancestor of `HEAD`, fall through to the
   existing merge/verify/commit sequence unchanged.

**Alternatives rejected:**
- *Detect "nothing to commit" after the fact* (catch the specific `git
  commit` failure and reinterpret it) — rejected: `git commit --no-edit`'s
  failure message for "nothing to commit" isn't a stable, parseable
  signal (locale/git-version dependent), whereas `git merge-base
  --is-ancestor` is a direct, intended-for-this boolean check. Checking
  ancestry *before* attempting the merge (as the item's own description
  and backlog row `p-b91d487a` both specify) also avoids ever touching
  `git merge --no-commit --no-ff` in the already-merged case, so there is
  no staged-merge-then-abort dance needed for a no-op.
- *Skip verify on the short-circuit path* — rejected per `CONTEXT.md` D1.

**Risk map:**

| Component | Risk | Proof point (for `fgos-coding-validating`) |
|---|---|---|
| Ancestry check placement (before merge attempt, inside the existing lock's critical section) | low | Existing test suite's lock-acquisition test (`:396-409`) must still pass unchanged — the short-circuit still runs inside `mergeRunnerItemLocked`, called after the lock is already held. |
| Reusing `outcome: 'merged'` for the idempotent path | low | New test asserting HEAD does not move a second time, no new commit is created, and `cleanupMergedBranch`/status-move-to-`done` still work (exercised indirectly — `bin/fgos.mjs`'s own approve path needs no change, verified by the existing call-site fallthrough already reading `result.check`/`.branch` generically). |
| `git merge-base --is-ancestor` exit-code handling (not an error) | medium | New unit test directly calling `mergeRunnerItem` on an already-merged branch must observe `outcome: 'merged'` without a thrown `MergeError`, proving the exit-code path is read as a boolean, not misrouted into the `git()` helper's throw-on-nonzero behavior. |
| Idempotent retry after a real partial-failure scenario (merge landed, later step died) | medium | New unit test seeds this exact reproduction: merge branch already fast-forwarded into `main`/HEAD directly (bypassing `mergeRunnerItem`, simulating "a prior successful run already committed it"), then calls `mergeRunnerItem` again and asserts a clean `'merged'` outcome instead of a thrown `MergeError`. |

## Cases to prove (small-mode depth)

- Already-merged branch, verify passes → `outcome: 'merged'`, no new
  commit, HEAD unchanged from before the call.
- Already-merged branch, verify now fails (simulating "something else on
  HEAD regressed since the original merge landed") → `outcome:
  'verify-fail'`, not a forced `'merged'`.
- Not-yet-merged branch → existing merge/verify/commit path runs exactly
  as before (regression guard — the four existing outcome tests at
  `:320-409` must keep passing unmodified).
- Existing lock-held test (`:396-409`) must still refuse before the
  ancestry check ever runs (lock acquisition happens first, same as
  today).

## Files touched

- `src/runner/merge.mjs` — add the ancestry short-circuit inside
  `mergeRunnerItemLocked`. No new exported symbol required unless the
  implementer finds the check reads more clearly as a small local
  function (deferred to Execute, per `CONTEXT.md`'s "deferred to
  planning" note — module shape, not scope).
- `test/runner/merge.test.mjs` — add the two new idempotent-path tests
  described above, alongside the existing `mergeRunnerItem` suite
  (`:320-409`).

No other file needs to change — both `bin/fgos.mjs` call sites already
handle any non-blocked outcome generically.

## Verify

`node --test --test-name-pattern="mergeRunnerItem|merge.*idempotent"
test/runner/merge.test.mjs` — corrected at `fgos-coding-validating` from the
`discover` verdict's original `npm test -- --testNamePattern=...` form.
Confirmed by real execution: `npm test -- --testNamePattern=...` silently
runs the *entire* 1276-test suite unfiltered — `--testNamePattern` isn't a
flag Node's test runner recognizes (the real flag is
`--test-name-pattern`), and even that flag has no effect when appended to
`npm test`'s own globbed script command (`node --test
'test/**/*.test.mjs'`); it only filters when passed to `node --test`
targeting the file directly. Both confirmed by running the corrected
command against the 8 existing `mergeRunnerItem` tests (`test/runner/
merge.test.mjs:320-409`) and observing the exact expected count.

New tests added during execution must contain "idempotent" in their test
name for this pattern to pick them up (per the `merge.*idempotent` half
of the alternation).
