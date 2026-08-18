# Research: tsk-2iz — decision-index auto-resolve duplicate IDs + skipped abort

## Round 1 — 2026-08-14 (discovery stage)

**Asked:** Does the current code still match Finding 3's description
(`nextFreeDecisionId(repoRoot, 'HEAD')` ignores the branch's own new decision
files, and a throw inside `autoResolveDecisionIndexCollision` skips the
merge abort)? What is the concrete, provably-safe fix?

**Checked:**
- `src/runner/merge.mjs:583-594` (`nextFreeDecisionId`), `:681-708`
  (`autoResolveDecisionIndexCollision`), `:1179-1214` (the call site inside
  `mergeRunnerItemLocked`'s own `git merge` catch block), `:525-541`
  (`classifyDecisionIndexCollision`) — all read directly.
- `test/runner/merge.test.mjs` — grepped for existing coverage
  (`nextFreeDecisionId`, `autoResolveDecisionIndexCollision`,
  `classifyDecisionIndexCollision`), confirmed a real, runnable existing
  suite covers the self-resolve happy path.

**Found:**
1. `nextFreeDecisionId(repoRoot, ref)` (merge.mjs:583) computes the max
   decision id from a SINGLE ref's `docs/decisions/` tree via `git ls-tree`.
   Its only real caller, `autoResolveDecisionIndexCollision` (line 693,
   confirmed the only caller by GitNexus's own call-graph AND a plain
   `grep -rn "nextFreeDecisionId("` across `src/`/`bin/`/`test/` — no other
   hit), passes the literal string `'HEAD'` — exactly as described. The
   function already fetches BOTH `headFiles` (line 686-688) and
   `branchFiles` (line 689-690) locally for a different purpose (finding
   `theirsFile` per colliding id) but never uses `branchFiles` to inform
   the next-id computation — confirmed the gap is real and current, no
   repo drift since the report was written.
2. Confirmed exactly the failure scenario the report describes by reasoning
   through the code: a branch whose own new decision files include an id
   ABOVE `HEAD`'s own current max (e.g. branch forked at max=0040, wrote
   0041 AND 0042 of its own; main independently landed its own 0041,
   producing the collision) would have `nextFreeDecisionId(repoRoot,
   'HEAD')` return 0042 (HEAD's own max+1) — landing the renamed branch
   file directly on top of the branch's own already-clean 0042 file. Two
   files now claim id 0042, both committed, no uniqueness check anywhere
   in this path.
3. The call site (line 1204 pre-fix: `if (classification &&
   autoResolveDecisionIndexCollision(repoRoot, branch, classification))`)
   has no try/catch of its own around either
   `classifyDecisionIndexCollision` or `autoResolveDecisionIndexCollision`
   — both do real fs/git work (`classifyDecisionIndexCollision`:
   `fs.readFileSync`; `autoResolveDecisionIndexCollision` →
   `renumberDecisionFile`: `git mv` + file read/write) that can throw on a
   genuine unexpected failure, DISTINCT from `autoResolveDecisionIndexCollision`
   returning `false` (its own documented "doesn't match the expected shape,
   fall back safe" case, line 699-701's `return false`). A throw from
   either function propagates straight out of the enclosing `catch` block
   — confirmed by reading the surrounding `try { git(repoRoot, ['merge',
   ...]) } catch (err) { ...unguarded call here... }` structure directly —
   skipping the `abortMergeIfPossible(repoRoot)` call entirely (it only
   runs in the `else` branch, never reached on a throw). This leaves
   `MERGE_HEAD` and any partial `git mv` rename staged in the shared main
   checkout — confirmed as the exact failure mode, not a hypothetical.

**Decided (from evidence above):**
- Generalize `nextFreeDecisionId(repoRoot, refs)` to accept a single ref or
  an array of refs, computing the max across the union — the ONLY caller
  changes to pass `['HEAD', branch]` instead of `'HEAD'`. No new git calls
  beyond what the generalized loop needs (one `ls-tree` per ref, same as
  before for the single-ref case — the existing `headFiles`/`branchFiles`
  local sets in `autoResolveDecisionIndexCollision` are NOT reused for this
  to avoid duplicating the max-computation loop in two places; consistency
  over micro-optimizing away one extra git call).
- Wrap the `classifyDecisionIndexCollision` + `autoResolveDecisionIndexCollision`
  pair in a local try/catch inside the existing `catch (err)` block. A
  caught throw is treated the same as `resolved: false` (falls through to
  the existing `abortMergeIfPossible` + report path, unchanged), but the
  real thrown error is now reported via the existing `merge-failed-unclassified`
  outcome shape (never silently discarded, never left to propagate
  uncaught) instead of skipping the abort.

**Remaining open:** none. Both fixes are direct, evidence-grounded
implementations of the report's own "Suggested direction" — no new product
decision needed.

**Verify (real, runnable):**
```
node --test test/runner/merge.test.mjs
```
(existing suite covering `nextFreeDecisionId`/`autoResolveDecisionIndexCollision`/
`classifyDecisionIndexCollision`'s own self-resolve happy path — two new
cases added proving Finding 3's exact failure scenario is closed, and that
a real throw inside the resolve step still falls through to the abort.)
