---
contract: plan-v1
title: "Head lifecycle events: the host reports the end of a lead, finished planners and leads are closed, and a waiting lead does not hold a working slot"
status: running
lead: head:lead-forgent-261124-2143-head-l-84936
priority: P1
blockedBy:
  - 261124-0004-heads-operate-without-owner
base: ae9f98741330ec92fef41d3b05bdcf78ab19bfaa
footprint:
  - plans/261124-2143-head-lifecycle-events/**
  - apps/fgos/src/wiring/observe_sources/head_state.rs
  - apps/fgos/src/wiring/observe_sources/tests/mod.rs
  - apps/fgos/observe-kinds.json
  - apps/fgos/src/wiring/supervision.rs
  - apps/fgos/tests/supervision_verbs.rs
  - core/watcher/definitions/lead-ended.query.json
  - core/watcher/definitions/session-gone.query.json
  - core/watcher/definitions/plan-drafted.query.json
  - core/attention/definitions/head-gone.query.json
  - packages/supervision/rust/src/wake.rs
  - packages/supervision/rust/src/supervisor.rs
  - packages/supervision/rust/src/portfolio.rs
  - packages/supervision/rust/tests/definitions.rs
  - packages/supervision/rust/tests/watcher.rs
  - packages/supervision/rust/tests/wake.rs
  - packages/supervision/rust/tests/fixtures/definitions/**
  - src/session-host/head-stop.mjs
  - test/session-host/head-stop.test.mjs
  - bin/fgos.mjs
  - packages/supervision/rust/observe-kinds.json
  - src/cli/command-registry.mjs
  - packages/host-runtime/contracts/command-manifest.json
  - docs/platform/supervision/spec.md
  - docs/platform/observe/spec.md
  - docs/platform/session-host/spec.md
  - core/skills/fgos-supervisor/SKILL.md
  - .agents/skills/**
  - plugins/fgOS/skills/**
  - .claude/skills/**
  - plans/backlog.md
  - plans/backlog/p-pv7ha3l5ss-head-lifecycle-events-end-of-work-stop-rule-and-lead-slots.md
  - plans/backlog/p-iatzcg2gee-*.md
  - plans/backlog/p-6hqvgokerb-*.md
  - plans/backlog/p-tyowvhthul-*.md
source:
  - plans/discussions/ds-f3x53nlibp-head-lifecycle-events/DISCUSSION.md
  - p-pv7ha3l5ss
  - p-iatzcg2gee
  - p-6hqvgokerb
  - p-tyowvhthul
created: 2026-11-24
---

# Head lifecycle events

## Outcome

The supervisor always learns that a head's work has ended, whether the head reported it or died, and acts on it:
it reads the result, closes the finished head and frees the lane. The end signal comes from the host (the run
supervisor that ran the head's attempt), never from the head, so it holds when a head crashes or forgets its
handoff. A planner is closed as soon as its plan lands, a lead as soon as its plan is `done`, through one door
whatever role name the lead holds. A lead that only waits on something outside its plan does not hold a working
slot (rule shape pending owner question, see Owner questions).

Plan `261124-0004-heads-operate-without-owner` runs first: it gives every head the rule that its last action raises
a handoff. This plan is the safety net under that rule.

## Acceptance criteria

1. The diagnosis names the cause of the missing event on 2026-11-23 with evidence: `reports/diagnosis.md`.
2. `p-iatzcg2gee`: a lead that ends, finished or failed, produces a `lead-ended` row on the supervision queue with
   no one raising it by hand; one owning test drives an ended lead with an empty queue and shows the row
   (`cargo test -p fgos-supervision --test watcher`), and the supervisor procedure reads its result and frees the
   lane (`core/skills/fgos-supervisor/SKILL.md`).
3. A head that dies after its last action (agent process killed, no `session stop`) still produces an end row:
   the projection owning proof in `apps/fgos/src/wiring/observe_sources/tests/mod.rs`
   (`cargo test -p fgos observe_sources`).
4. `p-6hqvgokerb`: a planner is stopped as soon as its plan lands as `draft` or `ready`, and every lead whose plan is
   `done` is closed by the same door whatever role name it holds (`head:lead-*` or `lead:<LANE>`); one fixture shows
   both closed within one wake (`cargo test -p fgos-supervision --test wake`), and the short-role stop is proven in
   `node --test test/session-host/head-stop.test.mjs`.
5. `p-tyowvhthul`: the rule the owner picks is written in `docs/platform/supervision/spec.md`, and one owning test
   drives two leads, one waiting outside, and shows the ready plan admitted
   (`cargo test -p fgos-supervision --test wake` or `cargo test -p fgos --test supervision_verbs`, named in phase 4).
6. The close of each row: `p-iatzcg2gee`, `p-6hqvgokerb`, `p-tyowvhthul` and `p-pv7ha3l5ss` are `done` in
   `plans/backlog/` and `plans/backlog.md`, each citing the proof above.
7. `npm test` and `cargo test --workspace` green on the combined tree (`reports/integration.md`).

## Non-goals

- The head-side handoff rule, the planner raise right and the skill wording that goes with them (plan 0004 phase 3).
- Confinement (`p-fsg6aolefe`).
- Any change to how a plan is approved as `ready`.
- A live idle lead whose plan is not done: `p-4uqiyjwrtd` and the existing `session-idle`/`plan-no-progress` rules
  own it.
- Putting a waiting head to sleep and waking or resuming it on time: plan `261122-0056-orchestration-skeleton`
  phases 6, 16 and 17 own it (`p-g6heszkdc7`). Phase 4 here is the interim slot rule until that lands.

## Prior art

- Reused: the `lead-ended` watcher definition (`core/watcher/definitions/lead-ended.query.json`) and the
  `fgos.head.state` projection (`apps/fgos/src/wiring/observe_sources/head_state.rs`); today `retired` comes only
  from `retiredAt`, which only `session stop` writes (`src/session-host/head-stop.mjs`).
- Reused: the run supervisor already writes `closed.json` (`{attemptId, closedBy, steps, at}`) into a head's run
  directory when the attempt closes, on any exit; the placement's `runDir` points at it. This is the host-side end
  signal; no new writer is added.
- Reused: the wake door (`packages/supervision/rust/src/wake.rs`) already holds the `StopSession` port
  (`activity`, `stop`) it uses for `stop_stuck`; the close of finished heads goes through the same port.
- Reused: the lead's existing park record (a phase parked in the phase table with its reason) as the only source
  of "waits outside"; no new plan field.
- Missing: no state for "the head's attempt closed but nobody stopped it"; no row when a plan lands as `draft`;
  `session stop` refuses a lead that holds a short `lead:<LANE>` role; admission counts every live lead.
- Candidate causes the diagnosis checks first: (a) a finished lead stays live and idle, so no `retiredAt` and no
  `retired`; (b) a gone head's record is stamped with its `startedAt`, and the watcher reads only
  `last_full_tick - lookbackSec` onward (`packages/supervision/rust/src/watcher.rs`), so a lead placed more than a
  day earlier drops out; (c) a lead started by hand under a short role has no placement, so no record at all.

## Authority map

| New thing | Model row | Note |
|---|---|---|
| `ended` state of `fgos.head.state`, read from the run directory's `closed.json` | `session-host`, `run-supervisor` | Extends the projection; `closed.json` stays the run supervisor's record |
| `lead-ended` reads `retired` or `ended` | `supervision` | Extends the existing definition |
| `plan-drafted` watcher row (a plan landed as `draft`) | `supervision` | One new definition file beside `plan-became-ready` |
| Wake door closes a planner whose plan landed and a lead whose plan is `done` | `supervision` | Through the existing `StopSession` port; no new verb |
| `session stop` accepts a lead's short `lead:<LANE>` role | `session-host` | Extends `stopHeadSession`; same door |
| Admission counts a lead waiting outside as not holding a working slot | `admission`, `supervision` | Owner pick `q-eoxlvo7i4r`; interim, retired by the sleep rule of plan `261122-0056-orchestration-skeleton` phase 6 |

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Diagnose why an ended lead raised no event](phase-01-diagnosis.md) | - | plans/261124-2143-head-lifecycle-events/reports/diagnosis.md | 1 | done |
| 3 | [Close finished planners and leads through one door](phase-03-close-finished-heads.md) | - | packages/supervision/rust/src/wake.rs, packages/supervision/rust/tests/wake.rs, apps/fgos/src/wiring/supervision.rs, apps/fgos/tests/supervision_verbs.rs, core/watcher/definitions/plan-drafted.query.json, packages/supervision/rust/tests/definitions.rs, packages/supervision/rust/tests/fixtures/definitions/plan-drafted/**, src/session-host/head-stop.mjs, test/session-host/head-stop.test.mjs, bin/fgos.mjs, packages/supervision/rust/observe-kinds.json, src/cli/command-registry.mjs, packages/host-runtime/contracts/command-manifest.json | 1 | done |
| 2 | [Host-side end signal for a head](phase-02-host-end-signal.md) | 1, 3 | apps/fgos/src/wiring/observe_sources/head_state.rs, apps/fgos/src/wiring/observe_sources/tests/mod.rs, apps/fgos/observe-kinds.json, core/watcher/definitions/lead-ended.query.json, core/watcher/definitions/session-gone.query.json, core/attention/definitions/head-gone.query.json, packages/supervision/rust/tests/definitions.rs, packages/supervision/rust/tests/watcher.rs, packages/supervision/rust/tests/fixtures/definitions/** | 2 | done |
| 4 | [A lead waiting outside does not hold a working slot](phase-04-waiting-lead-slot.md) | 3 | packages/supervision/rust/src/supervisor.rs, packages/supervision/rust/src/portfolio.rs, packages/supervision/rust/tests/wake.rs, apps/fgos/src/wiring/supervision.rs, apps/fgos/tests/supervision_verbs.rs | 2 | done |
| 5 | [Spec, skill and generated skills](phase-05-spec-and-skill.md) | 2, 3, 4 | docs/platform/supervision/spec.md, docs/platform/observe/spec.md, docs/platform/session-host/spec.md, core/skills/fgos-supervisor/SKILL.md, .agents/skills/**, plugins/fgOS/skills/**, .claude/skills/** | 3 | ready |
| 6 | [Integration, full gates and closing the rows](phase-06-integration.md) | 1, 2, 3, 4, 5 | plans/backlog.md, plans/backlog/p-pv7ha3l5ss-head-lifecycle-events-end-of-work-stop-rule-and-lead-slots.md, plans/backlog/p-iatzcg2gee-*.md, plans/backlog/p-6hqvgokerb-*.md, plans/backlog/p-tyowvhthul-*.md, plans/261124-2143-head-lifecycle-events/reports/integration.md | 4 | ready |

Phase 1 found candidate (a): both leads stayed live and idle, so no `retiredAt` and `lead-ended` matched no row
(`reports/diagnosis.md`); phase 2 runs as written.

Phase 3 landed as `2b18815f1` (branch `head-lifecycle-events/p03d`, 2026-11-26). A short-role lead with no run
supervisor (started by hand) is not ended: `session stop --role` answers `stopped: false, reason: no-supervisor` and
the wake door records `stop-failed` with that reason, so such a lead is still closed by the supervisor's procedure. A
role that still leads a plan not done is never closed. A plan's first landing as `draft` produces
`fgos.plan.status` `to: draft` (`apps/fgos/src/wiring/observe_sources/plan_history.rs`, `status_transitions`), so
`plan-drafted` reads it as written. The wake span's `fgos.supervisor.error` attribute was undeclared in
`packages/supervision/rust/observe-kinds.json`, so every wake span carrying an error was refused; phase 3 declared it.

Phase 2 landed as `0463c0385` (2026-11-26). A head whose `runDir` holds `closed.json` and whose placement has no
`retiredAt` projects `ended` at the file's instant; `lead-ended` reads `retired` or `ended`. Steps 3 and 4 were
skipped: the diagnosis ruled out the window drop and the unplaced head. Because the run supervisor writes
`closed.json` on every attempt end, `session-gone` and `head-gone` now also match `ended` for a shaper, planner,
secretary or supervisor role, so a dead non-lead head still raises them. The query language has no negated prefix,
so those two definitions list the non-lead personas: a new head persona has to be added to both.

Phase 4 landed as `8eeb37fef` (2026-11-26). Owner answer `q-kikgj6qaiu` changed the source of "waits outside" to
open owner questions per phase (`plan:<dir>#phase-NN` or `plan:<dir>`), read through an `OpenQuestions` port whose
adapter reads the question store; the corrected brief is `phase-04-waiting-lead-slot.md` (`5cd0d5f91`).

Phase 3 depends on nothing: closing finished heads does not wait for the diagnosis. Phase 2 follows phase 3
because both add rows to `packages/supervision/rust/tests/definitions.rs` fixtures through the shared
definitions directory, and phase 2's shape depends on the diagnosis. Phase 4 follows phase 3 because both write
`apps/fgos/src/wiring/supervision.rs` and `packages/supervision/rust/tests/wake.rs`. Phases 2 and 4 share wave 2
with disjoint footprints. Phase 4 follows the owner's answer below. Hot files:
`core/skills/fgos-supervisor/SKILL.md` and the three supervision/observe/session-host specs belong to phase 5 alone;
generated skill copies are regenerated there with `npm run build:skills`, never hand-merged; `CHANGELOG.md` and the
backlog belong to phase 6.

Checked: `node scripts/plan-contract-check.mjs --plan plans/261124-2143-head-lifecycle-events` and
`fgos resource-check --plan plans/261124-2143-head-lifecycle-events` on 2026-11-24: contract check ok; resource
check accept with 0 findings, the shared files (3 x 2, 3 x 4) sitting in different waves by depends-on.
Re-checked 2026-11-25 when the plan was set `ready` (owner approval, supervision event `0622c457271d5acb`):
plan 0004 is `done`; no code file in the footprint changed since the first base, so `base` moves to the trunk tip
only to take in 0004's spec and skill edits, which phase 5 now names. `CHANGELOG.md` is left out of the footprint while the running
plan `261125-1631-agent-context-engine` holds it; phase 6 adds it back once that plan is `done` (as `53d90e0ef` did
for plan 261125-1558). This plan
overlaps plan 0004 on `docs/platform/supervision/spec.md`, `docs/platform/session-host/spec.md`,
`core/skills/fgos-supervisor/SKILL.md` and the generated skill trees; `blockedBy` resolves it.

## Owner questions

- q-eoxlvo7i4r: Lead slots: count a lead waiting outside as free, or raise the lane count from measured capacity?
  Answered 2026-11-24: "a waiting lead does not hold a working slot". The owner added that a head left waiting a
  long time should be shut down and woken when needed (plan `261122-0056-orchestration-skeleton` phase 6), so this
  rule is the interim. No question is open.

## Risks and rollback

- Closing a head that is still working: the close step stops only a head whose activity is `Idle` and whose plan is
  `done` (lead) or whose discussion's plan has landed (planner); `Busy` and `Unknown` are never stopped, as
  `stop_stuck` already does. Proof point: a busy-lead case in the phase 3 fixture.
- `ended` raised for a head that rotated: a rotation writes a new placement with a new `runDir`, so the closed
  `closed.json` of the old attempt is no longer read. Proof point: a rotated-head case in phase 2.
- A gone record's instant moved to fix the window drop must stay one id per incident, or a handled incident is
  raised again on every tick. Proof point: phase 2 asserts the same event id on two ticks.
- Shared files with plan `261122-0056-orchestration-skeleton` phase 1 (`wake.rs`, `portfolio.rs`, `supervisor.rs`,
  `apps/fgos/src/wiring/supervision.rs`, `tests/wake.rs`): both plans are `draft`. Whichever is set `ready` second
  takes the other in `blockedBy`; this plan is smaller and P1, so it should go first and 0056 phase 1 rebases on it.
- Rollback: revert the plan's merge commit; no data migration, no new config key, no state file is added.
