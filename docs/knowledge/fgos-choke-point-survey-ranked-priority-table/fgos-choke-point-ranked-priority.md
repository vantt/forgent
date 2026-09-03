---
type: reference
title: fgOS choke-point survey — ranked priority table
tags: []
timestamp: 2026-07-29T06:18:36.000Z
source_capture_ids: [tsk-1ab-1, tsk-1ab-2]
framework: diataxis
mode: reference
---
# fgOS choke-point survey — ranked priority table

Quick-reference ranking for `tsk-1ab`'s survey of decision logic
reimplemented independently across CLI verb / runner loop / skill flows.
Full evidence and candidate-by-candidate confirmation:
`docs/decisions/0022-fgos-choke-point-survey.md`.

> ```json
> "actual":{"outcome":"proposed","passed":true,"attempts":1,"errorClass":null,"aheadCount":1}
> ```
> — real `work.outcome` capture, id `tsk-1ab-2`

## Ranked priority (risk DESC, frequency as tiebreak)

| Rank | Choke-point | Behavior-divergence risk | Call frequency | Fix shape |
|---|---|---|---|---|
| 1 | `take` vs `pick` claim-eligibility check | **High** — `fgos-routing`'s own documented `take --id <id>` example is hard-rejected by the CLI for exactly the case it describes | Very high — `fgos-routing` loads at the start of every fgOS session | Unify the eligibility guard between the two verbs, or fix `fgos-routing`'s prose to match `pick`'s actual (intentionally loosened) behavior |
| 2 | `isWorkingTreeClean` duplicated (`return` vs `approve`) | Medium — genuinely different scope (subtree vs whole-repo), can make `return` and `approve` disagree on "clean" | High — every `return` and every `approve` call | One parameterized function (scope: subtree \| whole-repo) instead of two separate definitions |
| 3 | `createWorktree` — 6 call sites, each owns baseRef/cleanup | Medium-low — each site is already contextually correct; main exposure is an orphaned worktree where cleanup is missing (`pick`) | High — spans `pick`/`approve`/`review`/runner dispatch | One wrapper keyed by operation kind (claim-isolate / merge-ephemeral / runner-dispatch) around `createWorktree` + uniform cleanup |

## Checked and ruled out (not choke-points)

Already centralized, confirmed by reading the shared implementation —
listed here so they are not re-investigated by a future survey:

- verify run + timeout → single `runGoalCheck` (`src/runner/goal-check.mjs`)
- `docType` validation → single `assertValidDocType` (`src/state/store.mjs`)
- `docsRef` validation → single `optionalField` helper (`bin/fgos.mjs`)
- `.fgos/events.jsonl`/`state.json` low-level append → single locked write
  door, `withEventsLock`/`appendEventLocked` (`src/state/events.mjs`)

## No fixes applied

This survey (`tsk-1ab`, split into `tsk-1ab-1`/`tsk-1ab-2`) only
discovers, confirms, and ranks — it applies none of the fixes above. Each
ranked row becomes its own item if and when picked up, the same way
`tsk-53f`'s claim/worktree finding became its own tracked item.
