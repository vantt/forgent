# work-item-status-delivered-retrospective-cleanup — plan

Item: `tsk-1ca`. Decisions: `CONTEXT.md` (16 D-IDs, this directory).

## Mode

**high-risk** — 4 flags apply (≥4 or any hard-gate flag = high-risk):

- **data model** — `work.status` enum and the FSM transition table
  (`src/state/fsm.mjs`) are core data model, gaining 3 new states and 7 new
  edges (D1/D2).
- **public contracts** — `RESOLVED_STATUSES` (`frontier.mjs`) is consumed by
  6 modules (D13); the `work.move`/`work.stage` event shapes and the CLI
  verb surface (`compound`, future retrospective/cleanup verbs) are
  contracts other sessions/tests already depend on.
- **existing covered behavior** — this item supersedes RUL4/RUL49/RUL50/
  RUL51 (D1/D11), all of which have direct test coverage today
  (`fsm.test.mjs`, `stage.test.mjs`, `workflow-stage-graphs.test.mjs`,
  `compound-learn-done-gate.test.mjs`, `compound-learn-lifecycle.test.mjs`).
- **multi-domain** — D5 requires the new edges to be genuinely
  domain-agnostic, verified against both `coding` and the illustrative
  `synthetic` domain.

A smaller mode would not honestly cover this: superseding four locked
rules and rewriting a shared constant's 6 consumers cannot be shaped as a
single small/tiny task without hiding real risk.

## Approach

**Chosen path**: implement in dependency order — FSM core first (nothing
else compiles conceptually without it), then the two things that read the
new states (stage retirement, RUL12 fix), then the new runtime pieces
(harness + loop + edges) that only make sense once states exist, then a
dedicated regression pass. This mirrors `CONTEXT.md`'s own D1→D16 layering
— each later decision cites and depends on an earlier one.

**Alternatives rejected**: a single monolithic PR touching all of
`fsm.mjs`/`frontier.mjs`/`workflow-stage-graphs.mjs`/the new harness at
once — rejected because `fgos-coding-validating`'s reality check and any human
review would have no way to isolate which of the 4 flags above broke if
something regresses. Splitting by "file touched" instead of by "decision
group" was also considered and rejected: `fsm.mjs` alone serves both D1/D2
(new states) and D3/D4 (gate placement) — those two are inseparable in one
file and belong in the same piece, whereas `frontier.mjs`'s single-line
fix (D13) is fully independent of stage retirement (D11) despite both
reading `work.status`.

**Impact-analysis posture**: `full` (GitNexus `present`, checked via
`fgos tool query --capability impact-analysis --status present`). Every
proof point below that claims a blast radius is backed by a real `impact()`
call at `fgos-coding-implement` time, not a guess.

### Risk map

| Component | How risky | What proves it |
|---|---|---|
| `src/state/fsm.mjs` new edges (D1/D2/D3/D4) | High — wrong edge/gate placement silently reopens the exact RUL58 hole D3 exists to close | `node --test test/state/fsm.test.mjs` green, including new cases for all 7 new edges and the RUL58-at-delivered / RUL50-content-at-cleanup split; `impact({target:'transitionWork', direction:'upstream'})` before editing |
| Stage retirement (D11) | High — touches a locked law (RUL49/50/51), existing tests assert the OLD gate shape | `node --test test/state/stage.test.mjs test/state/workflow-stage-graphs.test.mjs test/state/compound-learn-done-gate.test.mjs test/e2e/compound-learn-lifecycle.test.mjs` green after rewrite (not just passing — confirm they assert the NEW shape, not vacuously deleted) |
| `RESOLVED_STATUSES` fix (D13) | Medium — one constant, but 6 blast-radius consumers | `node --test test/state/frontier.test.mjs test/state/graph-metrics.test.mjs test/runner/claim-port.test.mjs test/state/impact.test.mjs test/report/entropy.test.mjs`; `impact({target:'RESOLVED_STATUSES', direction:'downstream'})` to confirm exactly these consumers, no more |
| cleanup harness + retrospective loop + TTL (D7/D8/D9/D10) | High — new subsystem, no existing test scaffold, touches `src/runner/worktree.mjs`'s synchronous-cleanup behavior (D7 removes it) | new `test/runner/cleanup-harness.test.mjs` + `test/runner/retrospective-loop.test.mjs`; `node --test test/runner/worktree.test.mjs` still green (removeWorktree/removeDispatchWorktree themselves unchanged, only *when* they're called moves) |
| Domain-agnostic verification (D5) | Medium — `synthetic` domain has zero worktree; harness must not hard-fail it | extend `test/e2e/synthetic-domain.test.mjs` to drive a synthetic item through delivered→retrospective→cleanup→done |
| Lazy-default (D6) | Low — read-only assertion, no migration code to write | a fixture-log test asserting a pre-feature `done` item's `stage` stays `executing` and is untouched by replay |

### Files likely touched (order of work)

1. `src/state/fsm.mjs` (edge table, D1/D2), `src/state/work.mjs` (`STATUSES`, D1),
   `src/state/store.mjs` `moveWork` lines ~501-536 (the ACTUAL RUL50/RUL58
   gate code — confirmed by reading it during validating, not `fsm.mjs` as
   an earlier draft of this plan assumed) — D3/D4
2. `src/state/workflow-stage-graphs.mjs`, `src/state/stage.mjs` — D11 (retire `compound-learn` stage/edge), plus D5's new `worktreeBacked`-equivalent field for the harness (deferred detail, `CONTEXT.md`)
3. `src/state/frontier.mjs` (`RESOLVED_STATUSES`) — D13
4. New: cleanup harness module (name TBD at execute time, e.g.
   `src/runner/cleanup-harness.mjs`), new retrospective-loop entry point,
   `src/runner/worktree.mjs` (stop synchronous cleanup call sites) — D7/D8/D9/D10
5. Test suite rewrite/extension across all of the above, plus
   `test/e2e/synthetic-domain.test.mjs` — D5/D6

`fgos graph --json`'s global `topUnblock` (read during this planning pass)
names `tsk-3p1` as the single highest-leverage item in the whole backlog
(unblocks 3 directly, 4 newly) — `tsk-3p1` is superseded by this item's D1,
so landing piece 1 below effectively resolves that unblock for free; worth
flagging to whoever re-triages the backlog after this ships.

## Shape — split into 5 pieces

Each child carries `parent: tsk-1ca`. Order 1→5 is a real dependency chain,
not a suggestion — 2/3 both require 1; 4 requires 1 and 2; 5 requires all
of 1-4 to exist to regression-test against.

1. **FSM core: delivered/retrospective/cleanup states + gate split** (`tsk-5e9`)
   Add `delivered`/`retrospective`/`cleanup` to `work.mjs`'s `STATUSES`;
   add the 7 edges to `fsm.mjs`'s `TRANSITIONS` (D2). The RUL50/RUL58 gate
   blocks live in `src/state/store.mjs`'s `moveWork`, NOT `fsm.mjs` (both
   are separate `if (to === 'done')` blocks, lines ~501-536, that run
   after `transitionWork`'s pure edge check and before the event append —
   confirmed by reading the file at `fgos-coding-validating` time). Move the
   acceptance-clause block's condition to `to === 'delivered'` (D3); leave
   the compound-learn block's condition at `to === 'done'` but retarget it
   to read `retrospective`/`cleanup` completion instead of stage
   (superseded by D11 anyway once piece 2 lands) (D4). `done` keeps exactly
   one incoming edge.
   Verify: `node --test test/state/fsm.test.mjs test/state/compound-learn-done-gate.test.mjs`
   (this test file covers BOTH RUL50 and RUL58's store.mjs gate blocks —
   piece 1 only touches its acceptance/RUL58 assertions here; piece 2
   below further rewrites this SAME file's compound-learn-stage
   assertions — sequential, not a conflict, but noted so whoever executes
   either piece doesn't clobber the other's edits.)

2. **Retire `compound-learn` stage; retarget `fgos-coding-compounding`** (`tsk-1zi`, dep tsk-5e9)
   Remove `compound-learn` from `coding`'s `stages`/`stepMap`/
   `transitions`/`skillMap` in `workflow-stage-graphs.mjs` (supersedes
   RUL49); remove the `compound` verb's stage-move behavior (supersedes
   RUL51); `fgos-coding-compounding` now triggers on `status==='retrospective'`
   instead of `stage==='compound-learn'` (D11). Rewrite
   `compound-learn-done-gate.test.mjs`/`compound-learn-lifecycle.test.mjs`
   to assert the new trigger.
   Verify: `node --test test/state/stage.test.mjs test/state/workflow-stage-graphs.test.mjs test/state/compound-learn-done-gate.test.mjs test/e2e/compound-learn-lifecycle.test.mjs`

3. **RUL12 fix: `RESOLVED_STATUSES` single-set expansion** (`tsk-1d4`, dep tsk-5e9)
   `frontier.mjs:160` — `{done, wontfix}` → `{delivered, retrospective,
   cleanup, done, wontfix}` (D13). No change to `fgos rollup`'s separate
   done-only counter.
   Verify: `node --test test/state/frontier.test.mjs test/state/graph-metrics.test.mjs test/runner/claim-port.test.mjs test/state/impact.test.mjs test/report/entropy.test.mjs`

4. **cleanup harness, retrospective loop, TTL config, reject/retry edges** (`tsk-3wo`, deps tsk-5e9,tsk-1zi)
   Two new runtime pieces: (a) a retrospective loop, run-once-per-
   invocation, scanning `status==='delivered'` items, invoking
   `fgos-coding-compounding`'s work, transitioning `delivered->retrospective-
   >cleanup` on success, with dedup/idempotency guarding
   `addOutcome`/`addDecision` against a crashed-and-retried item
   (`CONTEXT.md`'s deferred item 1); (b) a cleanup harness verifying (i)
   `headAtTake`/`headAtReturn` still resolve on main, (ii) genuine
   retrospective content exists, gating `cleanup->done`, else
   `cleanup->blocked` with `reason` (D8). TTL threshold is a new global
   config key, clock anchored to the specific `retrospective->cleanup`
   event timestamp, mirroring `classifyStaleDoing`'s `claimedAt` pattern
   (D7). `src/runner/worktree.mjs`'s `removeWorktree`/
   `removeDispatchWorktree` call sites move from synchronous
   (merge/return-time) to TTL-gated (this harness).
   Verify: `node --test test/runner/worktree.test.mjs test/runner/cleanup-harness.test.mjs test/runner/retrospective-loop.test.mjs` (last two are new files this piece creates)

5. **Domain-agnostic + lazy-default regression pass**
   Extend `test/e2e/synthetic-domain.test.mjs` to drive a `synthetic` item
   through the full `delivered->retrospective->cleanup->done` chain,
   confirming the cleanup harness no-ops its merge-check for a
   non-worktree-backed domain (D5) rather than hard-failing. Add a fixture
   asserting a pre-feature `done` item is untouched by replay (D6, no
   backfill). Full-suite regression close-out.
   Verify: `npm test`

## Assumptions (unproven here, `fgos-coding-validating` to check)

- The new cleanup-harness/retrospective-loop module names and CLI verb
  names are implementer's choice at execute time (`CONTEXT.md` "Deferred to
  planning") — not material to this plan's shape, pinned as an assumption
  rather than asked.
- `workflow-stage-graphs.mjs`'s new domain field (`worktreeBacked` or
  equivalent) is designed inside piece 2 or 4 at execute time, not
  pre-specified here — its exact shape doesn't change piece boundaries or
  verify commands above.
- The consumer audit `CONTEXT.md` flags as deferred (CLI display/triage-
  table columns, discovery-judge, beyond the 6 already named in D13) is
  assumed complete once piece 3's listed test files are green — if
  `fgos-coding-validating` or `fgos-coding-implement`'s own `impact()` call surfaces a
  7th consumer, it folds into piece 3, not a new piece.
