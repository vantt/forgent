---
type: explanation
source_capture_ids: [tsk-37u]
framework: diataxis
mode: explanation
---

# Why `wontfix` had to join `done` at every "is this resolved?" check site

`fsm-wontfix-terminal-status` introduced `wontfix` as a second terminal
status, symmetric with `done` (`fsm.mjs`'s `TRANSITIONS` table has no
`from: 'done'` or `from: 'wontfix'` entry — zero doors out of either). That
earlier work fixed exactly one consumer: `frontier.mjs`'s
`hasOpenDescendant` (parent-lineage). Everywhere else in the codebase kept
checking only `status === 'done'` / `status !== 'done'` to decide "is this
item closed/resolved/no-longer-blocking" — silently leaving `wontfix` out.
This is the discussion of why that gap mattered enough to sweep, and why
the sweep landed where it did (full locked decisions in
`docs/history/wontfix-terminal-status-filter-consistency/CONTEXT.md`).

## The gap was a real deadlock, not a cosmetic inconsistency

`frontier.mjs:10-11` documents `done`-only gating as deliberate: "done
means 'accepted into the main tree' — a dep sitting at 'awaiting-approval',
'doing', or 'blocked' does NOT unblock its dependents." That framing was
correct for those three statuses. It was wrong for `wontfix`, because
`wontfix` isn't a dep that *might still* produce content later — it's a dep
that has permanently stopped. Leaving `frontier.mjs:89`'s `depsReady` and
`claim-port.mjs:152`'s `unmergedDeps` checking only `done` meant a
dependent behind a `wontfix`'d dep was blocked forever, with nothing left
that could ever unblock it.

The trade-off was weighed explicitly, not assumed: "dependent A's
implementation may assume dep B's actual content exists (e.g. calls a
function B was supposed to add). If B closes `wontfix` (abandoned, nothing
built) and A auto-unblocks, A may run against a false assumption." That
real risk was accepted over the alternative — "a permanent, silent deadlock
on A that nobody notices, since nothing ever reaches `done` to unblock it"
— because a silent, undiagnosable deadlock is worse than a possible false
assumption a human can still catch in review.

`claim-port.mjs`'s own stated rationale independently pointed the same
way: its `unmergedDeps` guard exists because "done guarantees content
merged onto rootBranch" — and a `wontfix` dep never had content to merge in
the first place, so refusing the claim as "unmerged" was reporting a merge
risk that couldn't actually exist for that dep.

## Why gating and reporting couldn't be allowed to disagree

Fixing only the dependency-readiness gate (`frontier.mjs`/`claim-port.mjs`)
while leaving the reporting/advisory views (`impact.mjs`'s `rankImpact`,
`command-registry.mjs`'s default `list`/`triage`, `graph-metrics.mjs`'s
`staleBlocked`/`greedyTopUnblock`/`goalScopedGreedyTopUnblock`/`whatIf`)
still checking only `done` would have made those views lie: a dependent
would show `blockedBy: []` (looks ready) but never actually appear in
`fgos ready` — because the gate and the report would be answering the same
question two different ways. `tsk-mvp-test-1` (a real item at status
`wontfix`) was the concrete case that surfaced this: it stayed in the
default `fgos list`/`fgos triage` output even though it was fully resolved.

Two ways to close that gap were on the table: make every reporting site
say "wontfix satisfies", matching the gate; or give reporting a separate
"blocked-by-wontfix" label distinct from "blocked-by-still-open". The
second was considered and rejected — the chosen shape keeps exactly one
predicate for "is this resolved enough that nothing further will happen to
it," reused everywhere, rather than layering a second reporting-only
category on top of the FSM's own two terminal states.

This does change shipped behavior on purpose, not by accident: `tsk-5oa`'s
existing verify command already asserted the default `fgos list` view
contains no `status === 'done'` item. Extending that view to also exclude
`wontfix` is an intentional, accepted contract change made alongside this
fix, not a regression that assertion happened to catch.

## Why the entropy signal needed its own, separate fix

`entropy.mjs:86`'s `countStageClarify` counted `w.stage === 'clarify'`
with no status guard at all — a different bug shape from D1/D2, because it
isn't about "resolved" gating a dependent, it's about a resolved item still
inflating a *signal about itself*. Confirmed via `replay.mjs:325` (the sole
writer of `item.stage`) that no status transition — including all three
doors into `wontfix` (`blocked/todo/doing -> wontfix`) — ever touches
`stage`. So an item closed `wontfix` while still parked at stage `clarify`
(never explored at all) would permanently inflate the `stage-clarify`
entropy weight, a false "still waiting" reading on an item that will never
move again.

This is deliberately scoped apart from `entropy.mjs`'s separate
`FINAL_STATUSES` set (used only by `countMissingActual`), which already
excludes `wontfix` — but for an unrelated reason: a `wontfix` item can
never mechanically acquire an `actual` outcome, since the close-settlement
write only fires on `to === 'done'`. That exclusion was audited and left
unchanged; `countStageClarify`'s missing guard was the actual bug.

## What was confirmed as correct as-is, and why

Not every `status === 'done'`-only check in the codebase was a bug. Three
sites were read carefully and excluded from scope, each for a reason
grounded in what the check actually protects:

- `store.mjs`'s compound-learn gate, acceptance-clause gate, and
  close-settlement/learning write are all gated on `to === 'done'` only,
  by design — they enforce "proof the work was actually built and
  verified," which a `wontfix` item (never built) should skip entirely,
  not satisfy.
- `loop.mjs`'s clarify/decompose sweep only ever touches
  `status === 'todo'` items — terminal statuses are naturally excluded
  from a sweep that only acts on open work; there was nothing to fix.
- `decompose.mjs`'s `work.stage ?? 'executing'` fallback is a
  pre-existing, already-documented limitation (noted in `workflow-stage-graphs.mjs`'s
  comment on the `synthetic` domain), not a hidden bug this sweep
  uncovered.

The distinction that separates these from D1-D3: does the check answer
"has this item finished the thing status/stage tracks," where `wontfix`
genuinely never will (correct to exclude) — or does it answer "is there
still something left to happen with/because of this item," where
`wontfix`'s terminal, nothing-further-happens nature makes it equivalent
to `done` (needed the fix)?

## What this means for the next person adding a "closed?" check

Before writing a new `status === 'done'` / `status !== 'done'` check
anywhere in this codebase, ask which of the two questions above it's
actually answering. If it's the second — "is this item resolved enough
that nothing further will happen to it or because of it" — it needs
`wontfix` in the set too, not just `done`. `frontier.mjs`'s existing
`RESOLVED_STATUSES = new Set(['done', 'wontfix'])` constant is the reusable
single source for that predicate; a new site re-declaring its own local
`done`-only check is exactly the shape of bug this item swept.
