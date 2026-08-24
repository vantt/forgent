# plan.md — tsk-5et

Mode: high-risk

Lane derived directly (no prior hand-off in this session — `fgos-routing`
was not loaded before this drive). Flags counted per
`fgos-routing`'s Mode gate: **existing covered behavior**
(`test/runner/merge.test.mjs` already exercises `performCatchUp`/
`mergeRunnerItemLocked`/`abortMergeIfPossible` directly), **weak proof
around the area** (the original "not uptodate" trigger for tsk-5et's own
reproduction stays unconfirmed by design — D2), and a plausible touch on
the **data-loss/audit hard-gate** (this change sits in the exact code
family `.fgos/events.jsonl`'s own append-only integrity guarantee
(ADR0020) depends on, already the subject of three adjacent
investigations — tsk-1ji, tsk-24e, tsk-3wq). Three flags plus a hard-gate
touch clears the 4+/hard-gate threshold for `high-risk` on its own.

## Approach

**Chosen path**: give both call sites a typed, non-throwing outcome for a
merge failure that never staged anything (a pre-merge refusal, of which
`not uptodate` is one instance), instead of feeding it through logic that
assumes a real conflict or blindly attempting `git merge --abort`.
Honors D1 (both functions in scope) and D2 (graceful handling is the bar,
not root-cause confirmation).

1. **`performCatchUp`** (`src/runner/merge.mjs:1634-1699`, catchup
   direction). Its own catch block (`:1656-1668`) unconditionally calls
   `resolveFgosOnlyConflict`, which only ever does something when `git
   diff --name-only --diff-filter=U` is non-empty — a pre-merge refusal
   never stages anything, so that list is always empty there,
   `resolveFgosOnlyConflict` returns `false`, and the code proceeds into
   its own **inline, unguarded** `execFileSync('git', ['merge',
   '--abort'], ...)` calls at `:1679` and `:1689`. Fix:
   - Detect a pre-merge refusal right after the initial merge attempt
     throws, via the same `mergeHeadExists(ephemeral.path)` helper
     `abortMergeIfPossible` already uses (`merge.mjs:1120-1127`) — no
     `MERGE_HEAD` means nothing was staged, so this is not a content
     conflict.
   - Replace both of `performCatchUp`'s own inline abort calls with the
     already-hardened, exported `abortMergeIfPossible(ephemeral.path)`
     (`merge.mjs:1129-1153`) instead of duplicating unguarded abort logic
     — DRY, and inherits its existing "no MERGE_HEAD → no-op" guard for
     free.
   - Add a new outcome distinct from `'conflict'` (e.g.
     `'merge-refused'`) for the pre-merge-refusal case, carrying the raw
     git error text, so a caller/report can tell "we hit a real conflict"
     apart from "git refused before even trying" — today's code would
     report `outcome: 'conflict', conflictedFiles: []`, an empty-array
     conflict report that is actively misleading.

2. **`mergeRunnerItemLocked`/`abortMergeIfPossible`**
   (`src/runner/merge.mjs:1129-1153` for `abortMergeIfPossible`,
   `:1242-1581` for `mergeRunnerItemLocked`, approve direction). **No
   production-code change** — corrected during `fgos-coding-validating`'s
   own reality gate (NOT READY round 1), which found this section's
   original premise false. Not a reopening of D1's decision (both
   functions stay "in scope" — see below for what that means here); this
   corrects the described mechanism only. Verified directly (all 5 call
   sites read: `merge.mjs:1346,1425,1463,1479,1545`):
   - `abortMergeIfPossible` already guards the "no `MERGE_HEAD`"
     pre-merge-refusal case (`mergeHeadExists` early return,
     `:1130-1132`) exactly like the fix `performCatchUp` needs above.
   - Every one of `mergeRunnerItemLocked`'s 5 call sites already wraps
     `abortMergeIfPossible` in its own `try { ... } catch (abortErr) {
     throw new MergeError(...) }` (e.g. `:1345-1349`, `:1424-1431`,
     `:1462-1466`, `:1478-1482`) for the case Round 5's own fixture 2
     reproduces (`MERGE_HEAD` existed, the abort itself then failed on a
     broken index). `MergeError` (`merge.mjs:62-70`) is not a raw/untyped
     throw — its own docstring already states "Raised only for a
     genuinely unexpected git failure (e.g. `git merge --abort` itself
     failing)", it sets `.category = 'merge-fail'`, and
     `store.mjs:85-87`'s `categoryOf` plus the CLI's own top-level catch
     (`bin/fgos.mjs:4369-4387`) already turn it into a clean one-line
     `fgos: <message>` report, a distinct exit code, and a recorded
     invocation fault — never a raw stack trace, never a silent success.
     This IS D2's "graceful typed outcome" bar, already met, for this
     function.
   - **What "in scope" means here, corrected**: no code change to
     `mergeRunnerItemLocked`/`abortMergeIfPossible` themselves. The
     concrete task is a **regression test** — port tsk-1ji's own Round 5
     fixture 2 (`docs/history/events-jsonl-merge-abort-truncation-gap/
     RESEARCH.md`) into `test/runner/merge.test.mjs` to lock in this
     already-correct behavior (asserts a `MergeError` with
     `.category === 'merge-fail'` is thrown, never swallowed, never an
     uncaught non-`MergeError` crash) — closing the gap that nothing
     today explicitly exercises this exact interleaving as an assertion,
     only as tsk-1ji's own one-off manual repro.

**Alternatives rejected:**
- A single generic `try { ... } catch { return { outcome: 'error' } }`
  wrapper around `performCatchUp` — rejected: collapses conflict /
  pre-merge-refusal into one bucket, losing exactly the diagnostic signal
  callers need.
- Also adding a new typed outcome to `mergeRunnerItemLocked`/
  `abortMergeIfPossible` — rejected after the reality-gate correction
  above: it already has one (`MergeError`, `.category = 'merge-fail'`);
  adding a second, differently-shaped mechanism for the same case would
  be the actual regression here, not a fix.
- Fixing only `performCatchUp`'s file, with no test-side coverage of the
  approve direction at all — rejected, D1 still calls for both functions
  to be addressed; the regression test IS that coverage now that no
  production fix is needed there.
- Gating this fix on first reproducing tsk-5et's own original "not
  uptodate" trigger — rejected, D2 is locked.

**Files touched, in order:**
1. `src/runner/merge.mjs` — `performCatchUp`'s fix only (item 1 above);
   no change to `mergeRunnerItemLocked`/`abortMergeIfPossible`.
2. `bin/fgos.mjs` — grep every read of `result.outcome` from the
   `catchup` CLI case before assuming it needs a new branch; add
   reporting for the new `'merge-refused'` outcome only where a
   switch/if-chain would otherwise silently fall through. The `approve`
   case needs no change — its `MergeError` handling already works.
3. `test/runner/merge.test.mjs` — extend with: (a) a `performCatchUp`
   pre-merge-refusal fixture, reusing this item's own `initRepo`/`git`/
   `headOf`/`makeBranchWithCommit` helpers (`RESEARCH.md` Round 1, Q2);
   (b) a real-conflict regression case proving classification did not
   flip to `'merge-refused'`; (c) tsk-1ji's own Round 5 fixture 2, ported
   in as a regression test proving `mergeRunnerItemLocked` still throws a
   `MergeError` (`.category === 'merge-fail'`) for a broken abort, never
   silently swallowed.
4. Any doc enumerating `performCatchUp`'s existing outcome vocabulary
   (grep for `'already-caught-up'`/`'merge-blocked-other-item'` under
   `docs/` before assuming one exists).

`fgos graph --json`: tsk-5et is not on `criticalPath` and `topUnblock` is
empty for it — no other item's ordering depends on this one, so file
order above is chosen for review/test locality, not graph-driven urgency.

**Impact-analysis posture**: `degraded` (GitNexus registered, `present`,
index flagged stale at last check — CONTEXT.md's own scout evidence).
Blast radius for `src/runner/merge.mjs`/`bin/fgos.mjs` callers of
`performCatchUp`/`mergeRunnerItemLocked` was cross-checked directly via
`rg` rather than trusted to the stale index; re-confirm with a fresh `rg`
pass at `executing` before landing, since a stale index could still be
hiding a caller this planning pass's own `rg` sweep missed.

## Risk map

| Component | Risk | Proof point |
|---|---|---|
| `performCatchUp`'s new pre-merge-refusal classification | medium | regression test: a genuine conflict still returns `'conflict'`; a `not uptodate`-shaped refusal returns `'merge-refused'`, never `'conflict'` |
| `performCatchUp`'s dedup onto `abortMergeIfPossible` | low | existing `merge.test.mjs` coverage of `abortMergeIfPossible` carries over; one new case exercises `performCatchUp`'s real-conflict-then-abort path unchanged |
| `mergeRunnerItemLocked`/`abortMergeIfPossible` broken-abort handling | none (no code change) | tsk-1ji's Round 5 fixture 2, ported as a regression test, proves the existing `MergeError` behavior — a locking test, not a fix |
| root trigger of tsk-5et's own reproduction (never-touched, non-union path) | unconfirmed / open by design | deferred per D2 — best-effort diagnostic repro, not a gating proof |

## Shape

One file's real change (`performCatchUp`) plus a locking regression test
for the already-correct sibling (`mergeRunnerItemLocked`) — see "Decide
the split" below for why this stays one piece rather than fragmenting.

**Concrete cases to prove** (high-risk depth):
- **Empty/boundary**: an already-caught-up merge (nothing to do) — must
  stay unaffected; existing coverage already exercises this branch.
- **Existing behavior that must not regress**: a genuine `.fgos/`
  union-path conflict must still resolve via `resolveFgosOnlyConflict`
  exactly as today; a genuine non-`.fgos/` conflict must still return
  `'conflict'` with real, non-empty `conflictedFiles`.
- **Concurrent access**: tsk-1ji's Round 5 fixture 2 (concurrent append
  landing on merge=union-staged content, then abort) — ported in as this
  item's own regression test proving `mergeRunnerItemLocked` still
  throws a typed `MergeError` for it, unchanged.
- **Partial failure**: a pre-merge refusal with `MERGE_HEAD` never
  created — must return the new `'merge-refused'` outcome, never attempt
  an abort, never throw uncaught.

## Decide the split

**No split — one piece.** Both fixes share one design pattern (a typed,
non-throwing outcome instead of an unguarded/duplicated abort attempt)
inside one file, cross-reference the same helper
(`abortMergeIfPossible`/`mergeHeadExists`) and the same test file.
Splitting into two items would fragment a change that is naturally
reviewed and tested as one unit, and would duplicate the shared-helper
context in two separate `plan.md`s for no independent-workability benefit
— neither half is mergeable or meaningfully testable without the other
half's own understanding of the shared outcome vocabulary.

## Outstanding questions

None
