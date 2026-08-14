# Research — tsk-11v: footprintOverlapAmong ignores deps edges

## 2026-08-14 — Round 1 (discovery)

**Asked:** Does `footprintOverlapAmong` (src/state/graph-metrics.mjs) consider a
candidate pair's `deps` edge before flagging a footprint conflict? Who are all
its callers, and is it safe to make it deps-aware for all of them, or only for
the decompose gate?

**Checked:**
- `src/state/graph-metrics.mjs:598-612` (`footprintOverlapAmong`) — read directly.
- `src/state/graph-metrics.mjs:614-624` (`footprintOverlap`) — read directly.
- `src/intake/plan.mjs:35,869-895` (decompose's footprint-overlap gate) — read directly.
- `src/intake/plan.mjs:217,937` (`child.deps`/`rawDeps` handling) — read directly.
- `src/state/graph-harness.mjs:109-151` (`mergeReadiness`, `syncClear` build-up) — read directly.

**Found:**
- `footprintOverlapAmong(candidates)` (graph-metrics.mjs:598) only reads
  `candidates[i].id` and `candidates[i].footprint`. It never reads or receives
  any `deps`/`rawDeps` field — the bug is not "reads deps and ignores it", it
  is "the function's own candidate shape has no deps field at all, and no
  caller passes one in." Confirmed by direct read: the loop body
  (line 600-610) only ever touches `.id` and `.footprint`.
- Caller 1, `footprintOverlap(view)` (graph-metrics.mjs:622) — candidates =
  `frontier(view)`. Frontier items are, by definition, independently
  dispatchable right now (no unresolved `deps`). Two items can never both sit
  in `frontier()` while one depends on the other: if A depends on B and B is
  still open, A is not ready (excluded from frontier); if B is done, B itself
  is excluded from frontier. So this caller never actually has a
  deps-related pair in its candidate set — a deps-aware exemption would be a
  no-op here, not a behavior change.
- Caller 2, `graph-harness.mjs:146` (`mergeReadiness`'s `syncClear`) —
  candidates are `proposed` items (status `awaiting-approval`) filtered to
  `depsClear` (graph-harness.mjs:117-126: `deps.every((dep) =>
  isResolvedStatus(work[dep]))`). Same guarantee as caller 1: by the time an
  item reaches `syncClear`, every one of its `deps` is already resolved
  (done/delivered/retrospective/cleanup), so no two `syncClear` items can
  have an open deps edge between them either. A deps-aware exemption is a
  no-op here too.
- Caller 3, `src/intake/plan.mjs:884-889` (decompose's footprint-overlap
  gate) — THIS is the real bug site. `footprintCandidates` (line 884-888) is
  built as `{ id, footprint }` only, from `childReconciliation` — it never
  includes the tentative child's own `deps` info, even though
  `verdict.children[i].deps` (an array of sibling INDICES, converted to real
  ids at line 937: `deps: child.deps.map((depIndex) => childIds[depIndex])`)
  is available at this exact point in the function, already reconciled to
  real ids via `childIds` (line 867). The gate flags a conflict and parks
  `need-human` (line 890-894) even when the decomposer already declared one
  child depends on the other — exactly the "sequence" resolution
  (`FOOTPRINT_CONFLICT_SUGGESTIONS`, graph-metrics.mjs:583) the item's own
  suggestion list documents but which no code path ever honors.
- `test/state/graph-metrics.test.mjs` covers `footprintOverlapAmong`/
  `footprintOverlap`; `test/intake/plan.test.mjs` covers `resolvePlan`
  (the decompose gate). Both exist and are runnable today —
  `node --test test/state/graph-metrics.test.mjs test/intake/plan.test.mjs`.

**Remains open:** none — evidence is sufficient to fix at the single real call
site (`src/intake/plan.mjs`'s footprint gate), by making `footprintOverlapAmong`
accept an optional per-candidate deps signal and skipping a pair already
connected by `deps` in either direction; the other two callers are provably
unaffected (a deps-aware exemption is a no-op for both, given their own
candidate-set guarantees above) so this is safe to change in the shared
function itself rather than forking a decompose-only copy.
