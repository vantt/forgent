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
  `tier: leaf-to-root | root-to-main` field; `root-to-main` gets the
  stricter verify/drift/footprint scope per the locked table (design
  report §G, reproduced under Canonical references below).

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

## Locked decisions

| ID | Decision |
|---|---|
| D1 | tsk-3bn's scope is the **full** Harness v2 package (drift + sync-root + merge-set clustering + two-tier verify), not just the original gap B/C slice. Locked by the user 2026-08-02, confirming the design-decisions report's D2 ("full package, not smallest slice") applies to this item specifically, after confirming none of tsk-3bn's dependency chain (tsk-4voj, tsk-2eq, tsk-480, tsk-396, tsk-15k, tsk-66x, tsk-2vd — all delivered/done) implements any part of drift/sync-root/clustering/tier itself; they are Layer-2 correctness prerequisites only, verified by code grep (no `driftStatus`, `sync-root`, or clustering logic exists anywhere in `src/`/`bin/` today). |
| D2 | Merge-set clustering ships v1 with the **permissive** escalation default: a merge set with a resolvable order (footprint overlap between two independently-ready items) auto-serializes — merge one, re-diff the other against the new tip, then merge — and escalates to a human only if that serialized re-check itself still conflicts. Matches research report §D.3 and §H.5 exactly (no deviation). Locked by the user 2026-08-02, resolving the design-decisions report's open question 3 (conservative-vs-permissive, given only 1 real incident to validate clustering against). |

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
- **tier** (`leaf-to-root` / `root-to-main`) — which verify/drift/footprint
  scope table row (design report §G) an item's merge falls under, derived
  from whether its target is its own parent root or `main` directly.

## Scout evidence

- `src/state/graph-harness.mjs:40` — `mergeReadiness(view)` exists today,
  pure, in-memory; no `driftStatus`, no `mergeSets`, no `tier` field yet.
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
  `fgos-planning`'s own shaping judgment per this skill's hard rules, not
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
