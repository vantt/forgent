# CONTEXT: tsk-2ie — duplicates/supersededBy field on the merge harness

## Feature boundary

`mergeReadiness` (`src/state/graph-harness.mjs`) can put two work items
that solve the SAME underlying problem into `ready` at the same time,
because nothing on the work-item schema records that relationship. Real
evidence:

- `tsk-2ib` was genuinely closed "duplicate of `tsk-3yl`", but had to go
  `proposed -> todo -> wontfix` (a two-step FSM detour) because no direct
  edge existed to record "this item is superseded by that one" — repeated
  across multiple sessions before landing.
- `tsk-1ua` (done) already added the `wontfix` terminal status covering
  "closed without being built (superseded, duplicate, admin decision)"
  (`src/state/work.mjs:68-70`) — that is the DONE-item cleanup layer,
  applied AFTER a duplicate has already been noticed. This item targets
  the GRAPH layer instead: warn/exclude BEFORE an item climbs the merge
  queue, not clean up after the fact.

This item adds the schema field(s) and wires `mergeReadiness` to read
them. It explicitly does NOT fix the dispatch/claim-layer concurrency bug
that lets the same item get built twice in parallel (a separate,
already-named issue at the claim-port/dispatch layer) — that class of
incident is cited in the item's own description only as motivating
context for "duplicate work is a real, recurring problem class," not as
something this item's mechanism resolves directly.

Depends on `tsk-2u0` (delivered) — `mergeReadiness` v2's `mergeAfter`
edge is the load-bearing precedent this item's design mirrors field-for-
field.

## Locked decisions

| ID | Decision |
|---|---|
| D1 | Schema adds **both** `supersededBy: <id>` (directed, singular — mirrors `parent`'s shape, `work.mjs:329-337`) and `duplicates: [ids]` (undirected, array — mirrors `deps`/`mergeAfter`'s shape). Matches the two distinct non-blocking dependency-type entries bd's own taxonomy already names separately (`supersedes` vs `duplicates`, cited in `docs/distillery/deep-dives/work-item-schema-and-io-contracts.md:70` and `docs/distillery/deep-dives/work-item-management.md:78`) — not a single field doing double duty. Locked by the user 2026-08-02, choosing the wider option over the item description's own narrower "pick one" framing. |
| D2 | `mergeReadiness` excludes item A from `ready` when A carries `supersededBy: B` **and** either: (a) `B`'s status is in `RESOLVED_STATUSES` (`frontier.mjs:172` — `delivered`/`retrospective`/`cleanup`/`done`/`wontfix`, the exact gate `deps`/`mergeAfter` already reuse for "target cleared"), **or** (b) `B` is itself present in this SAME `mergeReadiness` call's ready-set (about to merge this same round). Locked by the user 2026-08-02, choosing the wider trigger over "RESOLVED-only" specifically because RESOLVED-only would still let A and B both land in `ready` in the same batch — the actual race the item's evidence motivates. |
| D3 | `supersededBy`'s target id must already exist as a real work item — validated at write-time (`fgos edit --superseded-by`), mirroring `validateMergeAfter` exactly (`work.mjs:507-520`). A typo'd or deleted target fails loud at edit time instead of silently no-op'ing later inside `mergeReadiness`. Locked by the user 2026-08-02, over the more lenient `parent`-style "allow dangling" alternative — nothing in this item's scope needs supersededBy set before the winning item exists. |
| D4 | `duplicates` is **informational only**: zero effect on `mergeReadiness`'s `ready`/`waiting`/`mergeSets`/`blockedOnSync` output. Visible via `fgos list`/`fgos show` only. Locked by the user 2026-08-02 over the alternative (surfacing an unresolved-duplicates item as a new warning bucket in `mergeReadiness`'s output) — matches the scout doc's own framing of bd's non-blocking types verbatim: "chở tri thức mà không nghẹt điều phối" (carries knowledge without choking coordination), `docs/distillery/deep-dives/work-item-management.md:78`. Only `supersededBy` (D2) actually gates anything. |

## Pinned terms

- **supersededBy** — a directed, singular field: the id of the OTHER item
  that replaces this one. Presence means "I lose, that one wins" (D1/D2).
- **duplicates** — an undirected, array field: ids of other items covering
  the same ground, with no winner declared. Carries knowledge only (D4) —
  never gates `mergeReadiness`'s output by itself. Setting `supersededBy`
  is the only way to actually resolve a `duplicates` overlap into an
  exclusion.
- **RESOLVED_STATUSES** — `frontier.mjs:172`'s existing set
  (`delivered`/`retrospective`/`cleanup`/`done`/`wontfix`); D2 reuses it
  unchanged rather than inventing a second "is this item done" check.

## Assumptions (inferred from precedent, not asked — flagged for planning to challenge if wrong)

- **Neither field participates in the unified blocking-cycle graph**
  (`dep-graph.mjs`'s `blocks`/`parent-child`/`waits-for` edges) or in
  `frontier.mjs` start-eligibility. Inferred from bd's own taxonomy split
  (4 blocking types vs 6 non-blocking "carries knowledge" types, of which
  `supersedes`/`duplicates` are two) and from this item's own explicit
  descoping of the dispatch-layer concurrency fix — this item is read-only
  detection at merge time, never a start-time gate.
- **No dedicated write-time cycle guard** for a mutual/contradictory
  `supersededBy` (A supersededBy B, B supersededBy A). Read at
  `mergeReadiness` time under D2's rule, a genuine mutual pair simply ends
  up excluded from `ready` on both sides (computed against the same
  pre-exclusion candidate set) — a visible stall requiring a human to edit
  one side away, not a crash or a silently-picked winner. Consistent with
  the already-locked `mergeSets` philosophy of this same harness
  (design-decisions report D2: permissive by default, escalate — here,
  stall visibly — only on genuine ambiguity).
- **`duplicates` entries get the same existence check as `supersededBy`**
  (D3) for consistency, even though the question that locked D3 named
  `supersededBy` specifically — an informational-only field (D4) still
  deserves loud failure on a typo'd/deleted id over silent inconsistency
  with its sibling field.
- Self-reference on either field is rejected, mirroring the existing
  `parent`/`mergeAfter` self-reference checks (`work.mjs:230-232,
  335-337`).

## Scout evidence

- `src/state/graph-harness.mjs:83-179` — `mergeReadiness(view, opts)`
  current shape (`ready`/`waiting`/`conflicts`/`mergeSets`/`blockedOnSync`/
  `mergeTier`); this item extends its exclusion logic, no other bucket.
- `src/state/dep-graph.mjs:36-47,157-158,183-186` — `mergeAfter`'s
  `waits-for` edge is the load-bearing precedent for field validation,
  direction convention, and deliberate non-participation in
  start-eligibility.
- `src/state/work.mjs:214-234` — `mergeAfter`'s exact validation block
  (array-of-non-empty-strings, self-reference check) to mirror for both
  new fields' shape checks.
- `src/state/work.mjs:329-338` — `parent`'s singular-pointer shape,
  mirrored by `supersededBy`.
- `src/state/work.mjs:489-520` — `validateDeps`/`validateMergeAfter`
  existence-check pattern, mirrored by D3's `validateSupersededBy`.
- `src/state/work.mjs:81-92` — `STATUSES` including `wontfix` as the
  existing DONE-item duplicate/superseded terminal state (the layer this
  item is deliberately NOT touching).
- `src/state/frontier.mjs:172` — `RESOLVED_STATUSES`, reused unchanged by
  D2.
- `src/state/store.mjs:192` (`EDITABLE_FIELDS`) — where `supersededBy`/
  `duplicates` join the `fgos edit` allowlist, same door `mergeAfter` went
  through.
- `docs/distillery/deep-dives/work-item-schema-and-io-contracts.md:70` and
  `docs/distillery/deep-dives/work-item-management.md:78` — bd's own
  `supersedes`/`duplicates` non-blocking dependency-type entries, the
  external precedent both fields' shape and semantics are drawn from.
- `docs/history/tsk-3bn-merge-conductor-harness-v2/CONTEXT.md:65-66,
  D4-D5` — `mergeAfter`'s full design record (field validation, edit-flag
  wiring, non-participation in `frontier.mjs`), the closest sibling
  feature to this one; also records that `tsk-2ie` itself was repointed
  from the now-closed `tsk-3hk` onto `tsk-3bn`/`tsk-2u0` (D6 there).
- `plans/reports/internal-design-260802-0907-merge-harness-v2-locked-decisions-report.md` —
  canonical design report already on this item's `refs`; §D2's permissive-
  escalation philosophy is what the read-time-stall assumption above
  mirrors.

## Canonical references

- `docs/history/tsk-3bn-merge-conductor-harness-v2/CONTEXT.md` — sibling
  feature, `mergeAfter`'s full design record.
- `plans/reports/internal-design-260802-0907-merge-harness-v2-locked-decisions-report.md` —
  design report on this item's `refs`.

## Outstanding questions deferred to planning

None material enough to block planning — the three assumptions above are
inferred from strong, cited precedent; flag to the user only if planning's
own read of the code disagrees with any of them.
