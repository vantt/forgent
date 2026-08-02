# CONTEXT: tsk-396 — merge-before-gate ordering in approve

## Feature boundary

`fgos approve`'s local-merge paths (leaf→root and root→main, both in
`bin/fgos.mjs`'s `approve` command) call `mergeRunnerItem()`
(`src/runner/merge.mjs`) — a real `git merge`/`git commit` onto the
target branch — and only *after* that succeeds call `moveWork(..., to:
'delivered')` (`src/state/store.mjs`). If `moveWork` then refuses the
transition, the merge commit has already landed on the target branch
while the item's status stays `awaiting-approval` — a state/reality
mismatch. In scope: confirming and fixing this ordering for the gate
that can currently trigger it. Out of scope: redesigning
`mergeRunnerItem`/`moveWork` beyond what closes this ordering gap;
the broader merge-harness-v2 design (drift detection, sync-root,
merge-set clustering) tracked separately in
`plans/reports/internal-design-260802-0907-merge-harness-v2-locked-decisions-report.md`.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Retarget scope from the retired `compound-learn` stage-gate (the mechanism tsk-396 was originally filed against) to the current live analog: the RUL58 acceptance-evidence check inside `moveWork`'s `awaiting-approval -> delivered` door (`src/state/store.mjs:512-519`), which still runs after `mergeRunnerItem`'s real git merge commits. The original mechanism no longer exists in the code; this is the structurally identical gap that does. |

## Pinned terms

- **The live gap** — in both `approve` merge paths (leaf→root,
  `bin/fgos.mjs` ~line 2223; root→main, ~line 2297), `mergeRunnerItem()`
  runs to completion (merge committed onto the target branch) before
  `moveWork(..., to: 'delivered')` is called. If the item has an
  `acceptance` clause with missing `evidence`, `moveWork` throws
  (`store.mjs:512-519`), leaving the merge commit on the target branch
  with the item still `awaiting-approval`.
- **Already-shipped mitigation, not a full fix** — `tsk-3yl`
  (`4dc4f8f`, 2026-07-29) made `mergeRunnerItem` idempotent
  (`isAlreadyMerged()`): a retry after this failure re-verifies instead
  of creating a second merge commit. This closes the original repro's
  "second merge commit lands on top" symptom but does not change the
  ordering itself — a permanently-unmet acceptance clause still leaves
  main holding a merge for an item stuck at `awaiting-approval`
  indefinitely.
- **Acceptance bar (carried over from the original filing, applied to
  the current target)** — the RUL58 check should either run before the
  real merge is committed, or the merge should stay reversible until
  the check passes. Both `approve` merge paths (leaf→root, root→main)
  share the same `mergeRunnerItem()` → `moveWork()` shape and are both
  in scope — not just one of the two call sites.

## Scout evidence

- `src/runner/merge.mjs:672-707` (`isAlreadyMerged`, tsk-3yl D1) — the
  existing idempotency fix; comment explicitly frames the original bug
  as "not just the compound-learn gap that first surfaced this."
- `bin/fgos.mjs:2139-2309` — `approve`'s `source === 'runner'` branch:
  Iron Law gate already correctly hoisted *before* any merge (line
  2081, f01 finding); RUL58/CAS checks are not — they live inside
  `moveWork`, called at lines ~2223 and ~2297, after
  `mergeRunnerItem()` has already returned `outcome: 'merged'`.
- `src/state/store.mjs:485-520` — RUL58 acceptance-evidence check,
  gated on `to === 'delivered'`, placed inside `moveWork` (comment: "AFTER
  transitionWork's CAS + precondition checks... BEFORE the append
  below").
- `docs/history/work-item-status-delivered-retrospective-cleanup/CONTEXT.md`
  D9, D11 (commit `f9ac110`, 2026-08-01) — `compound-learn` stage
  retired outright; `approve`/`return` now stop at `delivered`, never
  attempt `done` inline. FSM code landed `c436304` (2026-08-02 00:07).
- `plans/reports/internal-research-260801-1823-merge-mechanism-grand-orchestrator-design-report.md`
  line 60 — original bug description, written against the
  pre-refactor `compound-learn` mechanism (report committed
  2026-08-01, before the FSM refactor landed).
- `plans/reports/internal-design-260802-0907-merge-harness-v2-locked-decisions-report.md`
  line 176-178 — lists `tsk-396` as one of 8 prerequisite bug fixes,
  explicitly "unchanged from yesterday's sequencing" (i.e. not
  re-verified against current code — unlike `tsk-45y`/`tsk-2eq`, which
  that same report did re-check). This clarify pass is the first
  re-verification against current code.
- `impact-analysis: full` — GitNexus registered and present
  (`fgos tool query --capability impact-analysis --status present`,
  one provider, `gitnexus`, status `present`).

## Canonical references

- `plans/reports/internal-research-260801-1823-merge-mechanism-grand-orchestrator-design-report.md`
- `plans/reports/internal-design-260802-0907-merge-harness-v2-locked-decisions-report.md`
- `docs/history/work-item-status-delivered-retrospective-cleanup/CONTEXT.md`

## Outstanding questions deferred to planning

- Exact fix shape (reorder the RUL58 check ahead of `mergeRunnerItem`,
  extract it into a standalone pre-flight validator, or another
  approach) — implementation choice, belongs to `fgos-planning`.
