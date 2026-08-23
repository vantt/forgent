# tsk-4jf — Split TTL out of the D8 harness in `assessCleanupReadiness`

Restore-to-decision, not a design change: `work-item-status-delivered-
retrospective-cleanup` D8 locks exactly TWO checks for the `cleanup ->
done` gate — (1) code still merged on main, (2) retrospective actually
produced content. D7 places the TTL elsewhere: a park deadline, a
precondition to even *run* the D8 harness ("run only after TTL elapses
AND the cleanup->done harness (D8) passes" — two clauses joined by AND,
not folded into one). `assessCleanupReadiness`
(`src/state/cleanup-harness.mjs:123`) currently merges all three checks
into one `reasons` array, and `bin/fgos.mjs`'s `case 'cleanup'` (line
1082) parks `cleanup -> blocked` on ANY failing reason, TTL included.

## Scout evidence

- `src/state/cleanup-harness.mjs:123-138` — `assessCleanupReadiness` runs
  `checkCleanupTTLElapsed`, `checkRetrospectiveContent`, and (when
  worktree-backed) `checkMergeStillResolves`, pushing all three into one
  flat `reasons` array and returning `{ ready: reasons.length === 0,
  reasons }`. No distinction between "not ready yet" and "actually
  failed."
- `bin/fgos.mjs:1082-1086` — `if (!assessment.ready)` moves straight to
  `blocked` with `reason: assessment.reasons.join('; ')`, regardless of
  which check(s) failed.
- `.fgos/events.jsonl` — 6 historical `cleanup -> blocked` transitions
  (tsk-3b3, tsk-1ca, tsk-3w3x, tsk-3o3, tsk-3xo, tsk-5y5), all 6 with a
  TTL-only reason, 0 from the D8 content/merge checks. All 6 are still
  parked at `blocked` today (none recovered), 4/6 parked within 3-20s of
  entering `cleanup`. `blocked` is outside `TAIL_RESOLVED_STATUSES`
  (`src/state/frontier.mjs:221`, per D13), so each of these merged items
  reads back as unresolved/in-progress rather than done.
- `src/state/cleanup-pool.mjs:37-53` — `pickNextCleanupItem` already
  pre-filters candidates by TTL (guard-at-caller, tsk-dvc), but its own
  header cites `docs/history/fgos-cleanup-loop/CONTEXT.md` D1 as the
  reason a naive loop doesn't work; that guard is bypassable by any other
  caller of `fgos cleanup <id>` directly (one-door-write, CTR001, means
  the correctness has to live in the verb, not a picker that's just one
  caller among several) — confirmed by 3/6 park events (tsk-3o3, tsk-3xo,
  tsk-5y5) landing AFTER tsk-dvc delivered (2026-08-02T11:23:54).
- `docs/history/fgos-cleanup-loop/CONTEXT.md` — referenced by
  `cleanup-pool.mjs`'s own header comment but does not exist in this
  checkout. Noted, not chased further: it is a stale doc pointer in a
  comment, not a blocker for this item's own scope.
- `fgos tool query --capability impact-analysis --status present`:
  GitNexus registered and `present` — impact-analysis: full. `impact`
  will be run on `assessCleanupReadiness` and the `case 'cleanup':` block
  before either is edited, per the repo's capability gate.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | `assessCleanupReadiness` returns two separate groups instead of one flat `ready`/`reasons` pair — `notReadyYet` (TTL-only) and `failed` (content + merge checks). Shape and field names are the implementer's call in `fgos-coding-planning`, not fixed here. |
| D2 | `bin/fgos.mjs`'s `case 'cleanup':` branches on the two groups: `failed` non-empty → `cleanup -> blocked` exactly as today, joined-reason string unchanged. `failed` empty AND `notReadyYet` non-empty → no-op: no `moveWork` call, item stays at `cleanup`, no new event is written. |
| D3 | `pickNextCleanupItem`'s existing TTL pre-filter (`cleanup-pool.mjs:43-44`) is kept as a scheduling optimization (skip invoking a verb call known in advance to be a no-op) — no longer read as a correctness guard. Its comment gets updated to say so explicitly, so a future reader doesn't mistake it for the guard again. |
| D4 | Recovering the 6 historically-stuck `blocked` items (tsk-3b3, tsk-1ca, tsk-3w3x, tsk-3o3, tsk-3xo, tsk-5y5) is manual operational follow-up through the existing mechanical `blocked -> delivered` retry edge (D2 of the parent feature) — not new code, not part of this item's test/acceptance scope, and not performed by this item itself. |
| D5 | The unexplained early-caller question ("what calls `fgos cleanup` before TTL elapses today") is noted as curiosity, not a blocking unknown — once the verb is a safe no-op, an early call is harmless by construction. |

## Pinned terms

- **no-op** (this item's scope): the `cleanup` verb returns a result
  without calling `moveWork` and without writing any `work.move` event —
  the item's `status` stays exactly `cleanup`.
- **notReadyYet** vs **failed**: `notReadyYet` = TTL park precondition
  (D7), never a `blocked` cause on its own. `failed` = the two D8 gate
  checks (retrospective content, merge-still-resolves) — either failing
  still parks `cleanup -> blocked`, unchanged from today.

## Test plan (already specified in the item, restated for traceability)

- Unit coverage for `assessCleanupReadiness` across all 4 combinations of
  {TTL elapsed/not} x {D8 checks pass/fail}.
- A test for the `cleanup` verb proving that TTL-not-elapsed alone
  produces zero `work.move` events.
- `test/state/cleanup-harness.test.mjs` and `test/state/cleanup-pool.test.mjs`
  stay green throughout.

## Outstanding / deferred

- Exact return-value shape for the no-op verb result (field names,
  whether `notReadyYet` reasons are surfaced to the caller) — implementer
  choice, left to `fgos-coding-planning`/execution, not locked here (out of this
  skill's scope per its own rules).
