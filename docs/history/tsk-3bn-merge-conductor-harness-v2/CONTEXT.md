# CONTEXT: tsk-3bn — Merge Conductor Harness v2 (drift + sync-root + merge-set clustering + two-tier verify)

## Feature boundary

tsk-3bn originated as a real incident report (2026-08-01, closing milestone
tsk-u9k): `fgw/<root>` can advance past the point it was last synced to
`main` with nothing detecting it, because no supported action exists for
syncing a root branch mid-flight and no check watches for the drift. Two
design sessions since then (research report 260801-1823, design-decisions
report 260802-0907 — both already on this item's `refs`) turned that
incident into a full Layer-1 harness design. This item's scope is now
**locked to that full design** (D1 below): not just the original two gaps,
but the entire "Harness v2" package the design-decisions report calls out
as one coherent v1 shippable unit.

**Supersedes `tsk-3hk` (closed `wontfix`).** `tsk-3hk` was filed this
morning (2026-08-02) as "Merge Harness v2 (Layer 1)" holding exactly the
merge-set-clustering + tier slice, after an earlier same-morning decision
(03:43) had narrowed tsk-3bn back to gap B/C only specifically to avoid
duplicating tsk-3hk. D1/D3 below reopen that narrowing — tsk-3bn absorbs
tsk-3hk's scope back in, and tsk-3hk is closed as superseded rather than
left open as a duplicate. See D3.

In scope:
- **Drift detection** (`driftStatus`, new, read-only, git-inspecting) —
  per-root-branch ahead/behind vs its real target (`main` or a deeper
  parent), computed fresh every call, no cached state.
- **`sync-root <root-id>`** (new Layer-2 action, mutates) — merges
  `fgw/<root-id>`'s current tip into its target, records a real
  decision/event, does NOT change the root item's own status/stage.
- **Merge-set clustering** (`mergeReadiness` extension) — replaces today's
  pairwise "drop the whole conflicting pair from `ready`" with an ordered
  `mergeSets` array (`items`, `order`, `reason: footprint-overlap |
  shared-root | deps-chain`); adds a `blocked-on-sync` bucket for items
  whose parent root has unresolved drift.
- **Two-tier verification** — every `ready`/`mergeSets` entry gets a
  `mergeTier: leaf-to-root | root-to-main` field (D7 — named `mergeTier`,
  not the canonical reports' bare `tier`); `root-to-main` gets the
  stricter verify/drift/footprint scope per the locked table (design
  report §G, reproduced under Canonical references below).
- **`mergeAfter: [ids]`** (new field, D4/D5) — a weak, merge-order-only
  edge, implemented as the `waits-for` kind `dep-graph.mjs` already
  reserves: read ONLY by `mergeReadiness`'s `waiting` gate (extends the
  existing `depsClear` check to also require every `mergeAfter` target
  RESOLVED), explicitly NOT read by `frontier.mjs`'s start-eligibility.
  Validated at set-time through the same write-door guard `deps`/`parent`
  already get (`store.mjs`): target existence, no self-reference, no
  cycle — `assertNoUnifiedCycle` extended to include `waits-for` edges, so
  a cycle mixing `mergeAfter` with `deps`/`parent` is rejected at set-time.
  Settable anytime via `fgos edit <id> --merge-after <ids>`, not just at
  decompose/planning time — the need is often decided spontaneously
  mid-work ("want X to land first"), not upfront.

Out of scope (explicitly deferred, not this item):
- §A (lock scope) and §E (single-queue-per-target) — already closed by
  `tsk-2eq` (delivered).
- §F (consolidate throwaway-worktree creation) — already closed by
  `tsk-2vd` (done).
- Iron Law rescoping — already closed by `tsk-4voj` (delivered; this
  item's real `deps` entry).
- Restacking open leaves after a `sync-root` (research report §C's
  "crucially" note) — named as a follow-on refinement in that report, not
  part of the locked D2 package captured here.
- `tsk-45y` / `tsk-19j` / `tsk-18a` / `tsk-3wq` / `tsk-280` / `tsk-3au` —
  separate items, unrelated to this scope; not touched.
- `tsk-2ie` ("loại quan hệ 5" — `duplicates`/`supersededBy` field) and
  `tsk-3gx` ("loại quan hệ 4" — `promote-to-component` action) — both
  filed today, both `deps` on this item (repointed from `tsk-3hk`, see
  D6), both explicitly self-scope away from this item's boundary in their
  own descriptions. Real downstream consumers of the `graph-harness.mjs`
  layer this item builds, not part of it.

## Locked decisions

| ID | Decision |
|---|---|
| D1 | tsk-3bn's scope is the **full** Harness v2 package (drift + sync-root + merge-set clustering + two-tier verify), not just the original gap B/C slice. Locked by the user 2026-08-02, confirming the design-decisions report's D2 ("full package, not smallest slice") applies to this item specifically, after confirming none of tsk-3bn's dependency chain (tsk-4voj, tsk-2eq, tsk-480, tsk-396, tsk-15k, tsk-66x, tsk-2vd — all delivered/done) implements any part of drift/sync-root/clustering/tier itself; they are Layer-2 correctness prerequisites only, verified by code grep (no `driftStatus`, `sync-root`, or clustering logic exists anywhere in `src/`/`bin/` today). |
| D2 | Merge-set clustering ships v1 with the **permissive** escalation default: a merge set with a resolvable order (footprint overlap between two independently-ready items) auto-serializes — merge one, re-diff the other against the new tip, then merge — and escalates to a human only if that serialized re-check itself still conflicts. Matches research report §D.3 and §H.5 exactly (no deviation). Locked by the user 2026-08-02, resolving the design-decisions report's open question 3 (conservative-vs-permissive, given only 1 real incident to validate clustering against). |
| D3 | Conflict discovered mid-planning: a prior decision on this item (2026-08-02T03:43, before this session) had narrowed tsk-3bn to gap B/C only, precisely to avoid duplicating `tsk-3hk`'s clustering+tier scope. D1 (above) unknowingly reversed that narrowing. Presented to the user as a real fork — revert D1, or keep D1 wide and fold `tsk-3hk` in — user chose to keep D1 wide. `tsk-3hk` closed `wontfix` as superseded, its decision log cross-referencing this one. D1 stands as tsk-3bn's final, current scope. |
| D4 | `mergeAfter: [ids]` — a new, weak, merge-order-only field — is IN v1 scope (tsk-3hk's original proposal, reconsidered). Initial analysis found no case in the 3 locked `mergeSets` reasons (`footprint-overlap`/`shared-root`/`deps-chain`) that needs it — each already resolves via an existing field. User overrode with real, grounded counter-evidence: release-order preference independent of code/footprint/shared-root is a real, recurring, often-spontaneous need ("want X to land first"), not hypothetical. Kept minimal: no new `mergeSets` reason category, no new escalation path — the field only extends the existing `waiting` gate (`graph-harness.mjs`) the same way unmet `deps` already does; `frontier.mjs` deliberately never reads it, so start-eligibility is unaffected. Settable anytime via `fgos edit --merge-after`, matching its spontaneous-decision nature — not fixed only at planning/decompose time. Unset (default/common case) is a pure no-op: existing auto-computed order (rankImpact + the new clustering) applies exactly as already locked; `mergeAfter` only fires when a person deliberately sets it. Set is a hard gate, not a soft priority nudge — matches "human has their own plan" being meant literally, not just a ranking hint another item's priority could override. |
| D5 | `mergeAfter` is implemented as the `waits-for` edge kind `dep-graph.mjs`'s own header comment already reserves ("declared vocabulary only... that is S2b's job once a real stored form + producer exist") — not a bespoke second validation path. Setting it goes through the SAME write-door validation `deps`/`parent` already get in `store.mjs` (lines 178-179/259-260 today): target-id existence (mirrors `validateDeps`), no self-reference, and `assertNoUnifiedCycle` extended to include `waits-for` edges in the unified adjacency alongside `blocks`(deps)/`parent-child` — so a cycle MIXING `mergeAfter` with `deps`/`parent` (e.g. A `deps:[B]` + B `mergeAfter:[A]`, a real deadlock: A can't start until B resolved, B can't merge until A resolved) is caught at set-time, not discovered later as a stuck item. Answers the user's explicit ask: mergeAfter may only be set when it keeps the unified graph valid. |
| D6 | Closing `tsk-3hk` `wontfix` (D3) had a real consequence caught in a follow-up review: `tsk-2ie` and `tsk-3gx` both had `deps` on `tsk-3hk`. `wontfix` is a RESOLVED status, so `tsk-2ie` (deps: `[tsk-3hk]` only) became falsely deps-ready (verified via direct `isDepsAndLineageReady()` call: `true` before, `false` after) despite the `graph-harness.mjs` layer it needs not existing yet. Both repointed: `tsk-2ie` → `deps: [tsk-3bn]`, `tsk-3gx` → `deps: [tsk-3bn]` (deduped, was `[tsk-3bn, tsk-3hk]`). Full backlog sweep after the fix found no other item still referencing `tsk-3hk` in `deps`, and no children of `tsk-3hk` (`parent` field) to orphan. |
| D7 | The design's two-tier-verify field is named `mergeTier`, not the canonical reports' bare `tier`, on `mergeReadiness`'s output. Caught in a second review pass: `work.tier` already exists (`work.mjs`'s `TIERS = ['light','standard','heavy']`) as a stored, persistent field on every work item — the item's own cost/model-weight (tsk-3bn itself carries `tier: 'heavy'`). Reusing the bare name for `leaf-to-root`/`root-to-main` on the same entity type would either risk an implementer overwriting the real field or at minimum cause serious reader confusion (`item.tier` meaning two unrelated things depending on code path). No functional trade-off to weigh — pure rename before this reaches planning. |

## Pinned terms

(All defined in the two canonical reports; pinned here for stability, not
redefined.)

- **root** — a work item whose `fgw/<id>` branch is a merge target for its
  own children (leaf items merge into it before it merges to `main`).
- **drift** — a root's `fgw/<root>` branch has commits not yet reachable
  from its target (`main` or its own parent root), with nothing having
  flagged it.
- **sync-root** — the new supported action that merges a root's current
  tip into its target without altering the root item's status/stage.
- **merge set** — the design report's DAG-computed cluster of items that
  must merge together in a determined order (footprint overlap, shared
  root, or deps chain) — not just a pairwise conflict exclusion.
- **mergeTier** (`leaf-to-root` / `root-to-main`) — which verify/drift/
  footprint scope table row (design report §G) an item's merge falls
  under, derived from whether its target is its own parent root or `main`
  directly. Named `mergeTier`, not the canonical reports' bare `tier`
  (D7) — `work.tier` already exists as a stored, persistent field with a
  completely different domain (`light`/`standard`/`heavy`, the item's own
  cost/model-weight, `work.mjs`'s `TIERS`) and a different meaning; reusing
  the bare name on `mergeReadiness`'s output would collide.
- **mergeAfter** — a weak edge distinct from `deps`: blocks an item's
  *merge* until its targets are RESOLVED, but never blocks the item's own
  *start/dispatch* the way `deps` does. Exists specifically to let two
  independently-codeable items still merge in a chosen order.

## Scout evidence

- `src/state/graph-harness.mjs:40` — `mergeReadiness(view)` exists today,
  pure, in-memory; no `driftStatus`, no `mergeSets`, no `mergeTier` field
  yet.
- `src/state/work.mjs` (`TIERS = ['light','standard','heavy']`) —
  confirmed `work.tier` is a real, distinct, already-used field before
  naming the new merge-scope field `mergeTier` instead of bare `tier`
  (D7).
- `bin/fgos.mjs:34,1336-1358` — `merge next`/`merge list` call
  `mergeReadiness` directly; no `sync-root` case exists in the verb
  dispatch today.
- `rg -n "sync-root|driftStatus|mergeReadiness|blocked-on-sync" src bin`
  — zero hits beyond the existing `mergeReadiness` definition/call sites;
  confirms none of the locked design is implemented yet.
- `fgos tool query --capability impact-analysis --status present` —
  GitNexus registered and `present` → impact-analysis posture for this
  item is **full**; `impact()` blast-radius checks apply as written in
  `CLAUDE.md`'s gate before editing `mergeReadiness` or `bin/fgos.mjs`'s
  merge dispatch.
- `fgos list --json` (`view.discovery["tsk-3bn"]`) — empty; no prior
  `judgeDiscovery` verdicts recorded for this item before this session.
- Dependency-chain status check (`fgos list --all --json`): `tsk-4voj`,
  `tsk-2eq`, `tsk-480`, `tsk-396`, `tsk-15k`, `tsk-66x` all `delivered`;
  `tsk-2vd` `done`. None implement drift/sync-root/clustering/tier —
  confirmed by reading each item's title and cross-checking against the
  design report's own "8 bug fixes ... all prerequisite to trusting
  Layer 1's output means anything" framing.
- tsk-3bn's own graph fields today: `parent: null`, `deps: ["tsk-4voj"]`
  (now delivered → unblocked), `footprint: null`, `verify: "chưa xác định
  — P15 bổ sung"` (undetermined — left for planning, not a clarify-stage
  concern).
- `src/state/dep-graph.mjs` — the unified typed-edge cycle detector
  (`blocks`=deps, `parent-child`=parent) already exists and is wired at
  `store.mjs`'s write door (`assertNoCycle`/`assertNoUnifiedCycle`, lines
  178-179 for `add`, 259-260 for `edit`). Its own header comment already
  reserves `waits-for` as declared-but-unimplemented vocabulary for
  exactly this kind of edge ("S2b's job once a real stored form +
  producer exist") — `mergeAfter` (D4/D5) is that producer, not a new
  mechanism. No `docs/history/` doc found for the referenced decision IDs
  (`f176c18a`/`2ccf9804`) — those are `fgos decision` hash ids, not a
  feature dir.
- `fgos graph --what-if tsk-3bn --json` — completing tsk-3bn unblocks 3
  items transitively, newly-readying `tsk-3hk` (its `deps` included
  `tsk-3bn`) — this is what surfaced the D3 conflict: reading `tsk-3hk`'s
  full description showed it explicitly deferring drift/sync-root to
  "the decision on tsk-3bn," which turned out to predate and contradict
  D1. `fgos show tsk-3bn --json`'s `decisions` array confirmed the
  03:43 narrowing decision D1 had missed.

## Canonical references

- `plans/reports/internal-research-260801-1823-merge-mechanism-grand-orchestrator-design-report.md`
  — problem inventory, external-practice research, Design: The Merge
  Conductor (§A-I), sequencing (tsk-3bn = item 5, "the Conductor's actual
  first shippable slice" for the original B+C-only scope — since
  superseded in scope by D1 above), open questions.
- `plans/reports/internal-design-260802-0907-merge-harness-v2-locked-decisions-report.md`
  — D1-D4, the two-composable-function harness spec (`mergeReadiness`
  extension + new `driftStatus`), Layer 2 additions (`sync-root`), filing
  recommendation, open questions 1-3.
- Design report §G (two-tier verification table), reproduced for
  traceability:

  | | Leaf → root | Root → main |
  |---|---|---|
  | Verify scope | item's own declared `verify` | full suite (`npm test`) |
  | Drift pre-flight | check against root's own last-known tip | check against `main`'s own last-known tip |
  | Footprint/merge-set check | against siblings under the SAME root only | against every OTHER open root's already-merged content too |
  | Escalation trigger | genuine footprint overlap, or item's own Iron Law hit | ANY of the above, plus: drift detected and not yet resolved by a `sync-root`; a merge set spanning more than one root not-yet-synced |

## Outstanding questions deferred to planning

- Filing structure — single item vs. a small root with children
  (drift-detection / merge-set-clustering / sync-root-action) — is
  `fgos-coding-planning`'s own shaping judgment per this skill's hard rules, not
  decided here. The design report's own filing recommendation (heavy item
  or root + 2-3 children) is a starting suggestion, not a lock.
- Exact `driftStatus` file placement (new file vs. new export in
  `graph-harness.mjs`) — implementation choice, left to planning per the
  design report's own "kept separate ... because it shells into git"
  framing (a suggestion, not a hard requirement).
- `verify` field for this item is still undetermined ("P15 bổ sung") —
  planning's responsibility to set before this item can reach `executing`.
- Restacking open leaves after a `sync-root` (research report §C) — named
  as a real follow-on need but explicitly out of this item's locked scope
  (see Feature boundary); planning should note it as a likely next item
  rather than silently fold it in.
- Whether `deps-chain`-reason items move from today's plain `waiting`
  bucket into the new `mergeSets` structure, or stay conceptually in
  `waiting` with `mergeSets` metadata layered on top — the two canonical
  reports use "`deps-chain`" as a `mergeSets` `reason` without pinning
  this mechanically. `mergeAfter` (D4/D5) was deliberately kept consistent
  with today's simpler behavior (extends `waiting`, not `mergeSets`) —
  if planning resolves `deps-chain` the other way (promoted into
  `mergeSets` proper), `mergeAfter` should very likely follow the same
  shape for consistency. Implementation-shape, not product scope — left
  to planning, flagged here so it isn't silently decided either way.
