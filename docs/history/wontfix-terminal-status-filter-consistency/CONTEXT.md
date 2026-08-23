# wontfix terminal-status filter consistency — CONTEXT

Item: tsk-37u

## Feature boundary

`fsm-wontfix-terminal-status` introduced `wontfix` as a second terminal
status, symmetric with `done` (fsm.mjs D4: zero doors out). That work
already fixed one consumer — `frontier.mjs`'s `hasOpenDescendant`
(parent-lineage) — to treat `wontfix` as resolved, same as `done`. This
item is the sweep of every OTHER place in the codebase that still checks
only `status === 'done'` / `!== 'done'` to decide "is this item
closed/resolved/no-longer-blocking", and brings each one into a single,
internally-consistent story for `wontfix`.

Scope is the 6 sites named in tsk-37u's own submission text (status axis
#1-5, stage axis #6), re-scoped below by the decisions this doc locks —
not a re-open of `fsm-wontfix-terminal-status` itself, and not a design
of *how* to implement the fix (that's `fgos-coding-planning`'s job next).

## Locked decisions

**D1 — `deps`-readiness gates treat `wontfix` as satisfying, same as `done`.**
Applies to `frontier.mjs:89`'s `depsReady` and `claim-port.mjs:152`'s
`unmergedDeps`. A dep that reaches `wontfix` unblocks its dependents
exactly like a dep that reaches `done`.

- Scout: `frontier.mjs:10-11` documents this as deliberate design (D5):
  "done means 'accepted into the main tree' — a dep sitting at
  'awaiting-approval', 'doing', or 'blocked' does NOT unblock its
  dependents." The first framing of this item's bug list (frontier.mjs:89
  as a plain oversight) was wrong — it is a documented decision, not a
  bug — the real question was whether `wontfix` should join `done` under
  that same door, which this item answers.
- Concrete risk considered and accepted: dependent A's implementation may
  assume dep B's actual content exists (e.g. calls a function B was
  supposed to add). If B closes `wontfix` (abandoned, nothing built) and
  A auto-unblocks, A may run against a false assumption. Weighed against:
  a permanent, silent deadlock on A that nobody notices, since nothing
  ever reaches `done` to unblock it.
- Consistency driver: keeping `frontier.mjs`/`claim-port.mjs` at
  permanent-block while D2 (below) makes reporting views show the same
  item as "not blocked" would make triage/list lie about actual
  claimability — a dependent would show `blockedBy: []` (looks ready) but
  never actually appear in `fgos ready`. D1 and D2 must agree; the person
  choosing this doc's decisions chose to resolve the tension by making
  both sides say "wontfix satisfies", not by giving reporting a separate
  "blocked-by-wontfix" label (that alternative was presented and
  rejected).
- `claim-port.mjs:152`'s own rationale independently supports this side
  for its own check: the unmergedDeps guard exists because "done
  guarantees content merged onto rootBranch" (claim-port.mjs:143-149) — a
  `wontfix` dep never had content to merge in the first place, so
  refusing the claim as "unmerged" is reporting a merge risk that cannot
  exist.

**D2 — reporting/advisory views treat `wontfix` as resolved, same as `done`.**
Applies to:
- `impact.mjs:78,133` (`rankImpact`'s `openIds`, and its `includeDone`
  filter) — a `wontfix` item drops out of `blocks`/`blockedBy` counting
  and out of the default (non-`--all`) ranked view, and appears in the
  `--all` done-appended tail the same way a `done` item does.
- `command-registry.mjs:285,289` (`fgos list`/`fgos triage` default
  open-only view) — same treatment; `tsk-mvp-test-1` (status `wontfix`)
  is the concrete example that surfaced this: it stays in the default
  `fgos list`/`fgos triage` output today even though it is fully
  resolved.
- `graph-metrics.mjs:296,356,376,397,402` (`staleBlocked`'s `blockedBy`,
  the two `notDone` sets in `greedyTopUnblock`/`goalScopedGreedyTopUnblock`,
  and `whatIf`'s `newlyReady`) — a `wontfix` item is excluded from
  "not-done" candidate/blocking sets the same way a `done` item is.

Rationale: every one of these sites is already framed (in their own doc
comments) as "done means nothing left to unblock/report, because nothing
further will happen to it" — `wontfix` is the same kind of nothing-further
terminal state. Making D2 agree with D1 removes the display/gate mismatch
described above. This changes shipped behavior: `tsk-5oa`'s existing
verify command asserts the default `fgos list` view contains no
`status === 'done'` item; extending that view to also exclude `wontfix`
is an intentional, accepted contract change for this item, not an
oversight to be caught by that pre-existing test — planning must account
for updating `tsk-5oa`'s verify assertion (or an equivalent replacement)
alongside the fix.

**D3 — `entropy.mjs`'s `stage-clarify` signal excludes items with a
terminal status (`done` or `wontfix`).**

- Scout: `entropy.mjs:86`'s `countStageClarify` currently counts
  `w.stage === 'clarify'` with no status guard at all. Confirmed via
  `replay.mjs:325` that `item.stage` is only ever written by a dedicated
  move-stage event — no status transition (including the three doors into
  `wontfix`: `blocked/todo/doing -> wontfix`) ever touches `stage`. An
  item closed `wontfix` while still parked at stage `clarify` (never
  explored) permanently inflates the `stage-clarify` entropy weight (3),
  a false "still waiting" reading on an item that will never move again.
- `entropy.mjs:15`'s separate `FINAL_STATUSES` set (used only by
  `countMissingActual`, a different signal) already excludes `wontfix`
  deliberately, for an unrelated reason (a `wontfix` item can never
  mechanically acquire an `actual` outcome, since the close-settlement
  write only fires on `to === 'done'`) — that exclusion is unaffected by
  this decision and is not being revisited here.

## Excluded from scope (confirmed non-bugs, audited, unchanged)

- `entropy.mjs`'s `FINAL_STATUSES`/`countMissingActual` — deliberately
  excludes `wontfix` (see D3 note above); correct as-is.
- `store.mjs:481,507,539` (compound-learn gate, acceptance-clause gate,
  close-settlement/learning write) — all gated on `to === 'done'` only,
  by design: these enforce "proof the work was actually built and
  verified," which a `wontfix` item (never built) should skip entirely.
- `loop.mjs:951,971` (clarify/decompose sweep) — only ever touches
  `status === 'todo'` items; terminal statuses are naturally excluded,
  not a bug.
- `decompose.mjs:309` (`work.stage ?? 'executing'` hardcoded literal) —
  a pre-existing, already-documented limitation (domains.mjs's comment on
  the `synthetic` domain), not a hidden bug this item uncovered.

## Pinned terms

- **Terminal status**: a status with zero outgoing FSM edges. Exactly two
  today — `done` and `wontfix` (fsm.mjs's `TRANSITIONS` table has no
  `from: 'done'` or `from: 'wontfix'` entry). Every decision in this doc
  is scoped to exactly this pair; no other status is terminal.
- **Deps-readiness / dependency-ready**: whether an item's `deps` entries
  are satisfied enough to let the item itself become claimable/frontier-
  eligible (`frontier.mjs`'s `depsReady`, `claim-port.mjs`'s
  `unmergedDeps` check). Distinct from **lineage/parent-resolved**
  (`frontier.mjs`'s `hasOpenDescendant`, already fixed by
  `fsm-wontfix-terminal-status` before this item existed) — the two were
  already inconsistent with each other before this item; D1 makes
  `deps`-readiness match what lineage already does.

## Canonical references

- `src/state/fsm.mjs:1-27` — terminal-state design comment (`done`,
  `wontfix`).
- `src/state/frontier.mjs:8-27,74-94,129-152` — `depsReady`,
  `hasOpenDescendant`, and the existing `RESOLVED_STATUSES = new
  Set(['done', 'wontfix'])` constant already used for lineage (D1's
  natural implementation should reuse this same set for `deps`, not
  invent a second one — a note for `fgos-coding-planning`, not a decision this
  doc locks).
- `src/runner/claim-port.mjs:120-158` — `unmergedDeps` guard and its
  "done guarantees merged content" rationale.
- `src/state/impact.mjs:1-90` — `rankImpact`'s `openIds`/`includeDone`
  doc comments and implementation.
- `src/cli/command-registry.mjs:285,289` — `list`/`triage` open-only
  default docstring.
- `src/state/graph-metrics.mjs:281-402` — `staleBlocked`, `greedyTopUnblock`,
  `goalScopedGreedyTopUnblock`, `whatIf`.
- `src/report/entropy.mjs:15,86` — `FINAL_STATUSES`, `countStageClarify`.
- `src/state/replay.mjs:325` — sole writer of `item.stage`.
- `docs/history/fsm-wontfix-terminal-status/CONTEXT.md` — the prior
  decision record introducing `wontfix` and fixing lineage; this item
  extends that work to `deps` and to the reporting/entropy surfaces it
  did not touch.
- tsk-5oa (done) — the existing default-open-view feature whose verify
  command's "no `done` item in default `fgos list`" assertion needs
  extending (D2) to also assert no `wontfix` item.

## Outstanding questions deferred to planning

- None outstanding on the "what" — all three axes (deps-gating,
  reporting, entropy) are locked (D1/D2/D3). `fgos-coding-planning` decides how
  to implement (e.g. whether `frontier.mjs`'s existing `RESOLVED_STATUSES`
  constant is exported and reused across the other 5 sites, or each site
  gets its own local constant) and whether this splits into multiple
  child items (6 call sites across 4 files plus one test-assertion
  update).
