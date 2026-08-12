# tsk-18a-merge-conflict-misclassification — plan

Item: `tsk-18a`. Decisions: `docs/history/tsk-18a-merge-conflict-misclassification/CONTEXT.md`
(D1, D2). No split — one cohesive change.

## Mode

**standard** (3 flags counted):

- **public contract** — `docs/specs/runner.md` hardcodes the accepted
  blocked-`reason` set for `fgos catchup`; D1 adds a new value to it.
- **existing covered behavior** — `test/runner/merge.test.mjs` already
  asserts `outcome === 'conflict'` on three real-conflict scenarios
  (lines ~335, ~415, ~500); the classification fix must not change any of
  those outcomes, only add a new branch alongside them.
- **weak proof around the area** — D2 requires an actual concurrency
  reproduction attempt, which may or may not reproduce on demand; the
  fix's correctness does not depend on that reproduction succeeding, but
  "done" does depend on the attempt being made and recorded.

No hard-gate flag applies (no auth, no data loss, no audit/security
surface, no external provider, nothing being removed) — **standard**, not
high-risk. Not **tiny/small**: three real files change together
(`src/runner/merge.mjs`, `bin/fgos.mjs`, `docs/specs/runner.md`) plus a
docs-history repro record, and D2's reproduction step is genuine
investigative work, not a one-line change.

## Impact-analysis posture

`fgos tool query --capability impact-analysis --status present` →
`gitnexus` present — **full** posture; MUST rules apply at execute time.

Checked now (informational, re-run for real at `fgos-coding-implement` per
`CLAUDE.md`'s own gate — the index may drift between now and then):
- `mergeRunnerItemLocked` upstream impact: **LOW risk**, exactly one
  caller (`mergeRunnerItem`, same file) — the classification change stays
  contained to this one call chain.
- `abortMergeIfPossible` — not resolved by the current index (GitNexus
  reports stale, last indexed `7b9cd8d`; this function was added by
  `tsk-2j9` after that index ran). Re-index (`node .gitnexus/run.cjs
  analyze`) before editing at execute time so this symbol resolves.

## Approach

### D1 — classification fix

`mergeRunnerItemLocked`'s catch block (`src/runner/merge.mjs:820-840`)
currently does, on any failure of `git merge --no-commit --no-ff branch`:
try the decision-index-collision self-resolve, and otherwise
unconditionally call `abortMergeIfPossible` then return
`{outcome: 'conflict', branch}` — discarding `err.message`/`err.stderr`
entirely and never checking whether a real conflict (`MERGE_HEAD`
present) actually happened.

Fix: capture `mergeHeadExists(repoRoot)` **before** calling
`abortMergeIfPossible` (which itself deletes `MERGE_HEAD` as a side
effect of a successful abort) — this reuses `tsk-2j9`'s own exported
signal, not a new one. Branch on that captured boolean:
- `true` → unchanged path, `{outcome: 'conflict', branch}` — every
  existing test in `test/runner/merge.test.mjs` stays green.
- `false` → new outcome (name TBD, `CONTEXT.md` D1 uses
  `merge-failed-unclassified` as a placeholder), carrying the real
  `err.message`/`err.stderr`/`err.status` from the failed `git()` call.

Two `approve` call sites in `bin/fgos.mjs` (leaf→root `:2253-2263`,
root→main `:2346-2359`) each gain a parallel branch for the new outcome:
`moveWork(..., reason: <new-reason>)` + `addFriction(...)` with the real
captured stderr/exit-code embedded in `detail` (today's `detail` string
for `'conflict'` is static text with no diagnostic value — the new
branch's `detail` is the first place this file records a REAL git error
message on this path).

`bin/fgos.mjs:2511`'s `CATCHUP_REASONS` set gains the new value, and its
validation error message (`:2515`) is updated to name it. `fgos catchup`
needs no other change — it already re-attempts the same merge direction
from a fresh ephemeral worktree, which is exactly the right recovery for
a transient/unclassified failure (more so than for a genuine conflict).

`docs/specs/runner.md`'s catchup precondition line (documents the
accepted-reason set) gets the new value added in the same commit — never
left to drift from the code.

**Proof point (test-coverage, no live concurrency needed):** a git
merge can genuinely fail without ever creating `MERGE_HEAD` — git
refuses up front with "The following untracked working tree files would
be overwritten by merge" when an untracked file at the target checkout
collides with a path the incoming branch would introduce. This is a
real, deterministic, no-mocking repro of the exact class D1 targets
(fits `development-rules.md`'s "implement real behavior, no fake
data/mocks" — this is real git, not a stub). New test in
`test/runner/merge.test.mjs`: seed an untracked colliding file in
`repoRoot` before calling `mergeRunnerItem`, assert the new outcome (not
`'conflict'`), assert `MERGE_HEAD` was never created, assert the
captured error text mentions the real git refusal, and assert the
existing real-conflict tests (`shared.txt` scenarios) are unaffected.

### D2 — concurrency reproduction attempt

Both prerequisite fixes are confirmed `delivered` on `main`
(`fgos list --id tsk-2j9` / `--id tsk-2eq`): `tsk-2j9`'s abort-crash
guard, and `tsk-2eq`'s fix making `mergeRunnerItem` hold the real
`main-checkout.lock` (keyed to `lockRoot`, not the ephemeral worktree)
for the whole merge window, before the first `git()` call
(`src/runner/merge.mjs:619-678`).

Concrete, buildable repro candidate (ties directly to a real root-cause
class, not a contrived race): a concurrent session leaves a stray
untracked or modified file in the shared main checkout mid-operation
(e.g. an interrupted `take`/`return`, or another `approve` that already
holds the lock and is mid-verify) that collides with a path the item
being merged would introduce — exactly the untracked-file-collision
shape the D1 test above proves triggers a non-`MERGE_HEAD` failure. Since
`tsk-2eq` now serializes the actual `git merge --no-commit --no-ff`
window behind the real lock, the open question is narrower than
originally framed: does the lock's serialization also prevent a
*already-present* stray file (left behind before this session ever
acquired the lock) from causing the same failure once this session's own
merge call runs? The lock cannot retroactively clean up state left by an
earlier, unrelated failure.

Concrete steps for the reproduction attempt (recorded in a new
`docs/history/tsk-18a-merge-conflict-misclassification/repro-notes.md`
before the item is returned, per D2):
1. Build two real concurrent shell processes against a scratch clone of
   this repo (not the live main checkout): process A runs a `fgos
   approve` (or a direct `mergeRunnerItem` call) on a leaf item; process
   B, timed to land mid-window, either (a) leaves a stray untracked file
   at a path process A's branch introduces, or (b) itself holds
   `main-checkout.lock` and only releases it after A's merge call has
   already started (proving A now correctly blocks/waits instead of
   racing, thanks to `tsk-2eq`).
2. Record whether A's merge call still misclassifies, and if so, exactly
   what real git error surfaces (this is the same information D1's fix
   now captures and persists, so this step doubles as verification that
   the diagnostic capture itself works end-to-end).
3. Write the result — reproduced or not, and why — into
   `repro-notes.md`, and append it to the item's decision log
   (`fgos decision`) before `fgos-coding-validating`'s reality check runs.

This step does not gate D1 landing (the classification fix is correct
regardless of root cause), but per D2 it gates the item being reported
done.

## Risk map

| Component | Risk | Proof point |
|---|---|---|
| `mergeRunnerItemLocked` classification branch | Low (single caller, `mergeRunnerItemLocked` impact = LOW/1 direct) | New untracked-file-collision test; all 3 existing `'conflict'` tests stay green |
| `bin/fgos.mjs` `CATCHUP_REASONS` + validation message | Low, but a public/documented contract | `docs/specs/runner.md` updated same commit; existing `test/cli/fgos.test.mjs` catchup tests re-run unchanged (no existing test asserts the OLD reason set is exhaustive, per scout) |
| D2 concurrency repro | Medium (may not reproduce on demand) | `repro-notes.md` + `fgos decision` entry recording the real attempt and result either way — not gated on reproducing |

## Files touched

- `src/runner/merge.mjs` — classification fix (D1).
- `bin/fgos.mjs` — two `approve` call sites + `CATCHUP_REASONS` (D1).
- `docs/specs/runner.md` — accepted-reason list (D1).
- `test/runner/merge.test.mjs` — new deterministic test (D1 proof point).
- `docs/history/tsk-18a-merge-conflict-misclassification/repro-notes.md`
  — new, D2's recorded reproduction attempt.

## Order

`fgos graph --what-if tsk-18a` shows `unblocksTransitive: 1`
(`newlyReady: ["tsk-3wq"]`) — no internal ordering choice needed within
this single item; D1 and D2 can proceed in either order (D1 does not
depend on D2's result), but both must land before `fgos return`.

## Verify

Real, runnable command replacing the item's current placeholder
(`"chưa xác định — P15 bổ sung"`):

```
test -f docs/history/tsk-18a-merge-conflict-misclassification/repro-notes.md && node --test test/runner/merge.test.mjs test/cli/fgos.test.mjs
```

The `test -f` clause enforces D2's own gate (the repro attempt's result
must exist on disk before this item can be reported done, not just
described in prose); `node --test ...` runs D1's new deterministic test
alongside every existing `'conflict'`-outcome and `catchup` test, proving
no regression. (`npm test --` was tried first and rejected: the package's
`test` script hardcodes its own glob, so appended file args ran the full
2173-test suite instead of scoping down — confirmed by actually running
it. `node --test <files>` directly does scope correctly, confirmed the
same way: 520 tests, 0 fail, baseline green before any code change.)

## Assumptions (unproven, flagged for `fgos-coding-validating`)

- The untracked-file-collision scenario is assumed to be a real,
  reachable trigger for "git merge fails without creating `MERGE_HEAD`"
  on this codebase's git version — not yet empirically run.
- `err.stderr` on `execFileSync`'s thrown error is assumed to be a
  populated UTF-8 string (via `git()`'s `encoding: 'utf8'` option) in
  every failure mode relevant here — not yet empirically confirmed for
  the untracked-file-collision case specifically.
- The exact new reason-value name (`merge-failed-unclassified` per
  `CONTEXT.md` D1) is a placeholder; finalizing it is implementer-level
  per `CONTEXT.md`'s own deferred-questions section.
