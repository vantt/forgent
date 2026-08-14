# Plan — tsk-11v: honor a declared deps edge in decompose's footprint gate

Mode: tiny

No `exploring` stage ran for this item (discovery's own verdict was `clear`,
which skips straight to `planning` — `fgos discover --verdict clear`,
2026-08-14). There is no `CONTEXT.md`/locked-decisions table for this
feature; every claim below cites either `docs/history/tsk-11v-footprint-
deps-sequence/RESEARCH.md`'s round 1, or a direct repo `file:line` read done
in this planning pass.

## Approach

**Bug, confirmed** (RESEARCH.md round 1): `footprintOverlapAmong`
(`src/state/graph-metrics.mjs:598-612`) only ever reads `.id`/`.footprint`
off each candidate — it has no `deps` concept at all. The one caller that
actually needs a deps-aware exemption is `resolvePlan`'s decompose
footprint-overlap gate (`src/intake/plan.mjs:884-895`): `footprintCandidates`
is built as `{ id, footprint }` only, even though `child.deps` (sibling
indices, resolved to real ids the same way line 937 already does:
`child.deps.map((depIndex) => childIds[depIndex])`) is available at that
exact point. The gate parks `need-human` on a shared-footprint pair even
when the decomposer already declared one child depends on the other —
exactly the `sequence` option `FOOTPRINT_CONFLICT_SUGGESTIONS`
(`graph-metrics.mjs:583`) documents but which this call site can never
apply today.

**Blast radius (GitNexus `impact`, `footprintOverlapAmong`, direction
upstream, capability posture: `impact-analysis: full`, `fgos tool query
--capability impact-analysis --status present` → `gitnexus` `present`):**
risk `HIGH`, 6 direct callers — `resolvePlan` (plan.mjs), `mergeReadiness`
(graph-harness.mjs), `footprintOverlap`/`computeSchedule`
(graph-metrics.mjs), `footprintConflicts` (store.mjs), and
`scripts/verify-fanout-overlap.mjs`. Read directly, all 6:

- `resolvePlan` — the one caller that actually needs the fix (above).
- `mergeReadiness`'s `syncClear` (`graph-harness.mjs:117-126`) is filtered
  to `depsClear` items only (`deps.every((dep) =>
  isResolvedStatus(work[dep]))`) — by the time an item reaches this
  candidate set every one of its `deps` is already resolved, so two
  `syncClear` items can never have an open deps edge between them.
- `footprintOverlap`/`computeSchedule` both source candidates from
  `frontier(view)` (`frontier.mjs:107`: `item.deps.every((dep) =>
  isResolvedStatus(work[dep]))`) — same guarantee: no two frontier items
  ever have an unresolved deps edge between them.
- `footprintConflicts` (store.mjs:1132) sources candidates from
  `frontierAcrossSteps` (`frontier.mjs:127-135`), itself a dedup'd union of
  `frontier(view, {step})` across steps — same underlying `frontier()`
  deps-clear guarantee, so the same holds.
- `scripts/verify-fanout-overlap.mjs:104` calls `footprintOverlapAmong` on
  **raw siblings** (`children`, every child of one parent, not frontier- or
  deps-filtered) — the one caller where a deps-aware exemption inside the
  shared function would NOT be a pure no-op: two footprint-conflicting,
  deps-linked siblings could newly pass its `disjointChildren` pre-filter
  (script line 110-112). The script's own PASS claim only fires on a
  genuine wall-clock `doing`-window overlap (line 121-128), which a real
  deps edge should prevent by construction, so this is very unlikely to
  ever fire wrong — but it is a real, if narrow, semantic shift this item
  has no reason to introduce.

**Design decision, made here:** because only one of the 6 callers needs the
exemption, and one other caller has a genuine (if narrow) semantic risk from
widening the shared function, this plan does NOT touch
`footprintOverlapAmong`'s signature or behavior at all. Instead, `resolvePlan`
filters its own `footprintConflicts` result locally, after the existing call,
dropping any conflict pair already connected by a `deps` edge in either
direction. This shrinks the GitNexus-reported blast radius from 6 direct
callers to exactly 1 (`resolvePlan` itself) — `footprintOverlapAmong` and the
other 5 callers stay byte-for-byte unchanged, provably untouched rather than
merely reasoned-safe.

Files touched: `src/intake/plan.mjs` only (the `resolvePlan` block at
884-895). No split — this is one honest, contained piece of work.

## Shape

At `src/intake/plan.mjs:884-895`, after building `footprintCandidates` and
calling `footprintOverlapAmong` exactly as today, compute each reconciled
child's own resolved `deps` (already-materialized: its real stored
`view.work[entry.id].deps`; new: `entry.child.deps.map((depIndex) =>
childIds[depIndex])`, the same resolution `addWork` already does at line
937 — mirrors the existing `alreadyMaterialized ? view.work[...] :
entry.child...` asymmetry the footprint build-up right above it already
uses) into a small `id -> deps[]` map, then filter `footprintConflicts` to
drop any `{a, b}` pair where `a` is in `b`'s resolved deps or `b` is in
`a`'s — a declared `sequence` resolution, honored for the first time.
Everything else in the function (the `need-human` park on a remaining
conflict, the completeness advisory below it) is untouched.

Proof point for this piece (medium risk per the vocabulary above — one
function, well-covered, but a real behavior change to a `need-human` gate):
`test/intake/plan.test.mjs` already covers `resolvePlan`'s footprint gate.
`fgos-coding-validating`'s reality check should confirm it has (or add) a
case for two children sharing a footprint AND declaring a `deps` edge
between them, asserting the gate no longer parks `need-human` for that pair
— the concrete case this whole item exists to prove.

## Outstanding questions

None
