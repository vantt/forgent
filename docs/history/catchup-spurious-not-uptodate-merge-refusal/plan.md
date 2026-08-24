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
   (`src/runner/merge.mjs:1074-1098` corrected line range —  actually
   `:1129-1153`, see correction below — and `:1242-1341`, approve
   direction). **Correction to CONTEXT.md's own scout evidence**, found
   while reading the code directly during this Approach step (not a
   reopening of D1's decision — the scope decision itself stands;
   this only corrects the described mechanism):
   `abortMergeIfPossible` already guards the exact "no `MERGE_HEAD`"
   pre-merge-refusal case CONTEXT.md flagged (`mergeHeadExists` early
   return at `:1130-1132`) — it does NOT share `performCatchUp`'s
   unguarded-inline-abort defect. The real remaining gap here, per
   `docs/history/events-jsonl-merge-abort-truncation-gap/RESEARCH.md`
   Round 5 (tsk-1ji, fixture 2): when a merge DID stage something (real
   `MERGE_HEAD` exists) and the abort ITSELF then fails (a broken index —
   `fatal: Could not reset index file to revision 'HEAD'`), the catch
   block's own `if (!mergeHeadExists(repoRoot)) return; throw err;`
   correctly re-throws (`MERGE_HEAD` is still present, since the abort
   never completed) — but that throw currently propagates as a raw,
   untyped `MergeError` out of `mergeRunnerItemLocked` to its caller
   (`approve`), instead of surfacing as one of the function's own defined
   outcomes (`'merged'`/`'conflict'`/`'verify-fail'`/
   `'merge-blocked-other-item'`). Fix: catch that specific re-thrown case
   at `mergeRunnerItemLocked`'s own call sites and return a new typed
   outcome (e.g. `'main-checkout-broken'`) carrying the raw error —
   **never swallow it or attempt a second automatic recovery**; the
   broken index still needs the exact same manual recovery it needs
   today (tsk-1ji: "a main-checkout availability problem, not a
   silent-data-loss problem" — this fix must not turn it into one).

**Alternatives rejected:**
- A single generic `try { ... } catch { return { outcome: 'error' } }`
  wrapper around either function — rejected: collapses conflict /
  pre-merge-refusal / broken-index into one bucket, losing exactly the
  diagnostic signal callers need and risking a silent-success mask over a
  genuinely broken checkout (the failure mode D2/tsk-1ji both explicitly
  rule out).
- Fixing only `performCatchUp` — rejected, D1 is locked.
- Gating this fix on first reproducing tsk-5et's own original "not
  uptodate" trigger — rejected, D2 is locked.

**Files touched, in order:**
1. `src/runner/merge.mjs` — the two fixes above.
2. `bin/fgos.mjs` — grep every read of `result.outcome` from `catchup`/
   `approve`'s own CLI cases before assuming they need a new branch; add
   reporting for the new outcome value(s) only where a switch/if-chain
   would otherwise silently fall through.
3. `test/runner/merge.test.mjs` — extend with: (a) a `performCatchUp`
   pre-merge-refusal fixture, reusing this item's own `initRepo`/`git`/
   `headOf`/`makeBranchWithCommit` helpers (`RESEARCH.md` Round 1, Q2);
   (b) a real-conflict regression case proving classification did not
   flip to `'merge-refused'`; (c) tsk-1ji's own Round 5 fixture 2, ported
   in as a regression test for `mergeRunnerItemLocked`'s new
   `'main-checkout-broken'` outcome.
4. Any doc enumerating the existing outcome vocabulary (grep for
   `'already-caught-up'`/`'merge-blocked-other-item'` under `docs/`
   before assuming one exists).

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

## Shape

Single cohesive change across one file's two call sites (plus their
shared test file) — see "Decide the split" below for why this stays one
piece rather than fragmenting into two.

**Concrete cases to prove** (high-risk depth):
- **Empty/boundary**: an already-caught-up merge (nothing to do) — must
  stay unaffected; existing coverage already exercises this branch.
- **Existing behavior that must not regress**: a genuine `.fgos/`
  union-path conflict must still resolve via `resolveFgosOnlyConflict`
  exactly as today; a genuine non-`.fgos/` conflict must still return
  `'conflict'` with real, non-empty `conflictedFiles`.
- **Concurrent access**: tsk-1ji's Round 5 fixture 2 (concurrent append
  landing on merge=union-staged content, then abort) — ported in as this
  item's own regression test for `'main-checkout-broken'`.
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
