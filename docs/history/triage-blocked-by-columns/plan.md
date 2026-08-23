# tsk-dus: plan

## Mode

**Standard.** Flags counted against the mode gate:
- **Public contracts** — yes. `rankImpact`'s row shape (`fgos triage --json`'s
  `data` field) is a contract other readers can depend on; adding a
  `blockedBy` field changes it.
- **Existing covered behavior** — yes. `test/state/impact.test.mjs:85-91`
  and `:218-231` assert the row's *exact* shape with `assert.deepEqual`
  against a literal object — adding a field breaks both without an update.
- Everything else (auth, authorization, data model, audit/security,
  external systems, cross-platform, weak proof, multi-domain) — no.

2 flags → standard: a phased plan, no split (this item has no deps/parent,
sits alone in its own graph component per `fgos graph tsk-dus --json`, so
there's nothing to order against and no candidate to split off).

## Approach

Locked decisions from `docs/history/triage-blocked-by-columns/CONTEXT.md`:
D1 (blocked-by is a list of ids), D2 (unified deps+parent graph, same edges
`blocks` already uses), D3 (drop the `component` column).

**Rejected alternative:** compute `blocked-by` client-side in the skill
from raw `deps`/`parent` fields. Rejected because `rankImpact`'s row
doesn't expose `deps`/`parent` today (by design — it emits only the
derived/human-facing fields), and duplicating the unified-edge logic in a
markdown skill file would drift from `rankImpact`'s own edge-direction
convention (`buildUnifiedEdges` in `src/state/dep-graph.mjs`) instead of
reusing it.

### Risk map

| Component | Risk | Proof point (→ fgos-coding-validating) |
|---|---|---|
| `rankImpact` new field | Medium — must reuse `buildUnifiedEdges`'s existing `{from, to}` convention correctly in reverse, and keep done-row semantics (`blockedBy: []`) consistent with the existing `blocks: 0` treatment | Unit tests: deps-only, parent-only, combined, done-row, empty-view cases |
| Existing exact-shape tests | Low — two `deepEqual` assertions need their literal expected objects updated | `npm test` stays green after the field is added |
| Skill table rendering | Low — pure prose/instruction edit, no code | Manual render against a real `fgos triage --json` with a mixed backlog |

### Files touched

1. `src/state/impact.mjs` — add `blockedBy` to each row `rankImpact`
   returns:
   - Open rows: reverse the same unified edges used for `blocks` — for
     row `id`, collect every `to` where `{from: id, to}` is a unified edge
     AND `to` is still open (i.e. `id`'s own unmet `deps`, plus — if `id`
     is itself a child — nothing from its parent side, since the
     parent→child edge direction credits the CHILD's blocks, not the
     child's blocked-by; a parent item's blocked-by instead picks up its
     own still-open children via their `deps`-shaped edges). Sort the
     resulting ids ascending for deterministic output (edge insertion
     order is declaration order, not sorted).
   - Done rows (`includeDone`): always `blockedBy: []`, matching the
     existing `blocks: 0` / `componentSize: 0` done-row treatment — a
     done item has nothing left to be blocked by.
2. `test/state/impact.test.mjs` — update the two exact-shape assertions
   (`:85-91`, `:218-231`) to include `blockedBy`; add new cases: deps-only
   blocked-by, parent-only blocked-by (a parent item's blocked-by lists its
   open child), combined case, and a done-row always getting `[]`.
3. `plugins/fgOS/skills/triage/SKILL.md` step 3 — change the rendered
   table's columns to **id, status, stage, blocked-by, blocks, tier,
   title** (per CONTEXT.md's final order): add `status` (render
   `item.status` raw), rename the `goalTier` column header to `tier` (same
   values/rendering), add `blocked-by` (render `data.blockedBy` as a
   comma-joined list, or `-` when empty), and remove the `component`
   column and its rendering rule entirely.
4. `docs/specs/work-state.md:28` — one-line correction. This line already
   describes `fgos triage`'s `blocks` as counting only items listing this
   one in `deps`, which has been stale since `rankImpact` added
   parent-child credit (STR21-era fix, see `impact.mjs`'s own header
   comment) — predates this item. Since this item adds `blockedBy` next to
   `blocks` in the same verb's output, correct this line to mention both
   fields and the deps+parent unified-graph scope, so the spec stops
   contradicting the code it's supposed to describe.

### Order

Single, non-split item — no `fgos graph --what-if` candidates to compare.
Sequence: (1) `impact.mjs` + its tests first (the data layer the skill
depends on), (2) the skill's rendering instructions, (3) the doc-spec
line, since it only describes behavior phases 1–2 establish.

## Execution note

Per the locked platform decision that Execute/`return` already have a
working mechanical verify path, this plan does not redesign that — it only
names the command that proves this item done:

```
node --test --test-name-pattern="rankImpact" test/state/impact.test.mjs
```

for the data-layer change (verified during fgos-coding-validating: 22/22 pass on
the pre-change suite — `npm test -- --test-name-pattern=...` does NOT
scope as expected, it silently runs the full suite instead; use the
`node --test` form directly), broadened to a full `npm test` run before
`return` (existing-covered-behavior flag means the whole suite, not just
the new cases, must stay green — confirmed clean pre-change: 1706 pass, 0
fail, 5 skipped).
