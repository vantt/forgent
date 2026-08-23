# tsk-5e97 — decompose.mjs must check footprint-overlap before finalizing children

## Feature boundary

`resolveDecompose`'s `decompose` verdict branch (`src/intake/plan.mjs:477-504`)
writes each tentative child's `footprint` field but never checks whether two
sibling children's declared footprints overlap before creating them. This item
adds that check, calling the existing `footprintOverlapAmong` (already built
and used elsewhere) against the tentative child set — never against
`view`/frontier, since the children don't exist as real work items yet.

Out of scope (explicitly, per item description): `/fgOS:conflicts`
(`fgos conflicts`, `footprintConflicts` in `store.mjs:905`) and
`mergeReadiness`/`graph-harness.mjs` are untouched — those check overlap
among already-created `todo`/`proposed` items in the frontier, a different
lifecycle point from decompose-time tentative children. tsk-3hk (a separate,
dependent item) is not blocked on this — `footprintOverlapAmong` already
exists and is usable today, independent of tsk-3hk's own new fields
(`mergeAfter`/`tier`).

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | On footprint overlap among decompose's tentative children, gate to `awaiting-human`: park the item (no children created yet), ask text lists the conflicting pairs + suggestions (`sequence`/`hoist`/`re-slice`). This mirrors the existing `keywordRiskGate`/`blastRadiusGate` pattern in `decompose.mjs:442-468` (both park to human on detection, never auto-adjust) and matches `footprintOverlapAmong`'s own docstring: "the detector suggests, it never re-slices" (`graph-metrics.mjs:511`). Auto-merging or auto-nesting children is explicitly rejected — no such logic exists anywhere in this codebase's footprint-conflict handling, and would be new heuristic surface with no precedent. |

## Pinned terms

- **"Tentative children"** — the `verdict.children` array from a `decompose`
  verdict, after `childIds` are computed (`decompose.mjs:482`,
  `${work.id}-<n>`) but before `addWork` has been called for any of them —
  real ids exist, real work-item records don't yet.
- **Footprint overlap gate** — the new gate this item adds, alongside the two
  existing gates (`keywordRiskGate`, `blastRadiusGate`) that can force a
  `decompose`/`pass-through` verdict into a `need-human` outcome before any
  state-changing write happens.

## Scout evidence

- `footprintOverlapAmong(candidates)` — `src/state/graph-metrics.mjs:515-529`.
  Pairwise declared-footprint comparison over an explicit candidate list
  (`{id, footprint}` shape); an item with no footprint never conflicts.
  Explicit design note in its docstring: "the detector suggests, it never
  re-slices" — precedent against auto-adjustment.
- Existing callers: `footprintOverlap` (`graph-metrics.mjs:539`, frontier-only
  wrapper used by `fgos conflicts`/`footprintConflicts` in `store.mjs:905`)
  and `mergeReadiness` (`src/state/graph-harness.mjs:60`, proposed-and-dep-clear
  set for merge-ordering). Neither call site is the decompose-time gap this
  item closes — both operate on already-created items.
- `decompose.mjs:190-198` (`normalizeChild`) and `:482-499` (the `decompose`
  branch): today the model-proposed `footprint` per child is written straight
  through with zero cross-child validation.
- Existing gate precedent: `keywordRiskGate` (`decompose.mjs:445`) and
  `blastRadiusGate` (`decompose.mjs:453-454`), combined into `risksGate`
  (`:455`), checked at `:457` before any `addWork` call. Both use a
  `gate.ask.includes(<reason text>)` bypass check so a human's `fgos answer`
  release doesn't re-park on the identical stale reason forever
  (`decompose.mjs:436-444`, `:451-452`).
- Impact-analysis capability gate (`fgos tool query --capability
  impact-analysis --status present`): 1 provider registered, `gitnexus`,
  `status: "present"` → posture is **full**. `impact-analysis: full` — the
  GitNexus MUST rules in `CLAUDE.md`/`AGENTS.md` apply as written for the
  implementation session (run `impact()` on `resolveDecompose` and any other
  touched symbol before editing).
- No prior `judgeDiscovery` verdict recorded for tsk-5e97
  (`view.discovery['tsk-5e97']` was `undefined` at scout time) — this is the
  item's first pass through `clarify`.

## Canonical references

- `plans/reports/internal-design-260802-0907-merge-harness-v2-locked-decisions-report.md`
  — the worktree-strategy vs merge-strategy discussion this item's
  description cites as its origin (tsk-3bn drift, 41.7% cross-agent conflict
  rate from footprint overlap between open parallel worktrees).
- `docs/history/merge-standardization/CONTEXT.md` (D4-revised) — the prior
  decision record that extracted `footprintOverlapAmong` out of
  `footprintOverlap`, establishing the reusable candidate-list shape this
  item now calls a third time.

## Outstanding questions deferred to planning

- Exact insertion point and control flow inside `resolveDecompose` (before
  vs. interleaved with the existing `risksGate` check at `decompose.mjs:457`)
  — implementation choice, not a product decision.
- Whether a new `DEFAULT_FOOTPRINT_OVERLAP_GATE_REASON` constant follows the
  same `gate.ask.includes(...)` bypass-detection pattern as
  `keywordRiskGate`/`blastRadiusGate` so a human's `fgos answer` release
  doesn't re-park on an identical stale reason — naming/wiring detail, not a
  product-level ambiguity; the *behavior* (does a human answer release the
  gate) is already implied by D1's "mirrors the existing gate pattern"
  framing, but the exact mechanism is planning's call.
- Ask-text format for listing conflicting pairs + suggestions (plain prose
  vs. structured list) — implementation detail.
