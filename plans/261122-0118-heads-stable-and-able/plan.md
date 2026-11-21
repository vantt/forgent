---
contract: plan-v1
title: "Make the secretary and the supervisor heads stable and fully able: head verbs, plan check at the land door, provider floor, release pickup, rotation recovery, idle and wake tuning, live grant probe"
status: draft
priority: P1
blockedBy: []
base: aa35c0664447f6d01d214911973c4d0246715e39
footprint:
  - plans/261122-0118-heads-stable-and-able/**
  - src/session-host/head-grants.mjs
  - src/session-host/head-request.mjs
  - src/session-host/head-request-client.mjs
  - test/session-host/head-grants.test.mjs
  - test/session-host/head-request.test.mjs
  - test/session-host/head-start.test.mjs
  - apps/fgos/src/routing.rs
  - packages/run-supervisor/contracts/head-request.v1.json
  - packages/run-supervisor/rust/src/head_request.rs
  - packages/run-supervisor/rust/src/supervise/terminal.rs
  - packages/run-supervisor/rust/tests/head_request.rs
  - packages/supervision/rust/src/land.rs
  - packages/supervision/rust/tests/land.rs
  - scripts/plan-contract-check.mjs
  - test/scripts/plan-contract-check.test.mjs
  - src/session-rotation/rotate.mjs
  - test/session-rotation/rotate.test.mjs
  - packages/session-host/contracts/rotation-files.v1.json
  - packages/distribution/contracts/doctor-registry.v1.json
  - apps/fgos/src/wiring/doctor/**
  - core/skills/_shared/plan-contract.md
  - core/skills/_shared/friction-capture.md
  - core/skills/fgos-supervisor/SKILL.md
  - core/skills/fgos-lead/SKILL.md
  - core/skills/fgos-secretary/SKILL.md
  - .agents/skills/**
  - plugins/fgOS/skills/**
  - .fgos/config.yaml
  - docs/platform/session-host/spec.md
  - docs/platform/run-supervisor/spec.md
  - docs/platform/supervision/spec.md
  - test/skills/fgos-supervisor-idle-lead.test.mjs
  - test/live/head-grant-probe.live.mjs
  - CHANGELOG.md
source:
  - plans/discussions/heads-stable-and-able/DISCUSSION.md
  - p-vquz26ibnn
  - p-of5vpvce3e
  - p-s2t244hkqj
  - p-ycausep3zs
  - p-5gczifzh7h
  - p-erwx4t7gl6
  - p-ekqtvofdoh
  - p-ndortdckid
  - p-d3ub553ogh
  - p-bakpfrvigb
created: 2026-11-22
---

# Heads stable and able

The owner settled the scope through Miu on 2026-11-22: one plan that closes every gap of `p-vquz26ibnn` and the rows
folded into it, with no owner question tonight. Owner decisions already recorded in
`plans/backlog/p-vquz26ibnn-make-the-secretary-and-the-supervisor-stable.md` (2026-11-21 17:39 and 21:28) are scope and
are not reopened here.

## Outcome

The secretary head (Miu) and the supervisor head run stable and can do everything their roles need through their
request sockets: every head records its own friction, the supervisor patches config, a lead raises an event when it parks
a phase, a plan that breaks the contract cannot land, an admitted plan carries `base` and `lead`, no coordinating head is
bound to a weaker provider family, a live head's next request runs the newest activated release, a rotation whose
executor died is resolved on the lineage's normal path, an idle lead is checked rather than believed, the supervisor's
wake rate and false idle alarms are measured before and after one tuning change, the time from an owner question being
asked to the owner seeing it is measured, the secretary wakes on new questions or mail by the mechanism the owner picks,
and the manual `lead:SUPERVISOR` session has a written retire condition. A live per-verb probe from confined heads proves
the grants, verb by verb.

## Acceptance criteria

1. Live probe table for both heads exists at `plans/261122-0118-heads-stable-and-able/reports/head-grant-probe.md`, each
   verb `served`, `refused as expected`, or named out of scope with a reason (phase 11, `node test/live/head-grant-probe.live.mjs`).
2. Every folded row is closed by a phase or carries an explicit no (table "Folded rows" below; phase 11 checks each
   row's done-when against the landed evidence).
3. Wake rate and false idle alarms have a before (`reports/baseline-wake-and-idle.md`, phase 1) and an after
   (`reports/after-wake-and-idle.md`, phase 9) measured the same way.
4. The retire condition of the manual `lead:SUPERVISOR` session is a settled fact in `docs/platform/supervision/spec.md`
   (phase 7).
5. `npm test` and `cargo test --workspace` green on main with every phase landed (phase 11).
6. `node scripts/plan-contract-check.mjs --plan plans/<dir>` refuses a `running` plan with no `lead` and the land door
   refuses a paths land of a plan that fails the check, main unchanged (phase 3: `node scripts/run-tests.mjs
   test/scripts/plan-contract-check.test.mjs`, `cargo test -p fgos-supervision --test land`).

## Non-goals

- The old Work-item `fgos answer` in the secretary sandbox (owner withdrew it 2026-11-21).
- New orchestration primitives (keeper, scheduling records, player wake from domain records, question recipients and
  notifier): owned by draft plan `261122-0056-orchestration-skeleton`. This plan uses only existing doors: the closed
  raise kinds (`coordination-help`), `watcher tune`, `metrics record` of `fgos.coordination.*` kinds, `session type` on an
  event-named session.
- The seat judge that swaps a coordinating head to another family of enough quality (`p-s2t244hkqj`): that row asks for a
  shaped discussion and an owner pick before any build; this plan keeps the fixed Claude pin, which is the safe floor
  that row itself names. The row stays open.
- Miu's expired login (an owner account action, not code).

## Folded rows

| row | closed by | note |
|---|---|---|
| p-vquz26ibnn (2) config patch joins the supervisor grant | phase 2 | owner yes 2026-11-21 17:39 |
| p-vquz26ibnn (a) secretary wakes on new questions or mail, relays unasked | phase 10 | mechanism is the owner's pick; only that phase waits |
| p-vquz26ibnn (b) time from question asked to owner seeing it | phase 8 | relay record plus measure |
| p-vquz26ibnn (c) a lead that parks a phase raises an event itself | phases 2, 7 | lead gains `supervisor raise`; lead skill names the trigger |
| p-vquz26ibnn (7) wake rate and false idle alarms | phases 1, 9 | before, one tuning change, after |
| p-vquz26ibnn (8) retire condition of manual `lead:SUPERVISOR` | phase 7 | owner approved 2026-11-21 |
| p-vquz26ibnn verb-by-verb list from a confined head | phase 11 | live probe, not a reading of `GRANTS` |
| p-ndortdckid heads record friction | phases 2, 7 | `friction record` through the socket for every head |
| p-of5vpvce3e coordinating head never on a weak provider | phase 4 | supervisor, lead, planner, shaper already pinned; secretary pinned here; owning test |
| p-s2t244hkqj seat judge | explicit no | see Non-goals |
| p-ycausep3zs head picks up a newer release | phase 5 | route resolves the active release per request |
| p-5gczifzh7h supervisor checks a lead's claimed wait | phase 7 | a screen claim never closes `session-idle` |
| p-erwx4t7gl6 land door runs the plan check | phase 3 | land gate with a `{plans}` placeholder |
| p-ekqtvofdoh admission writes `base` and `lead` | phases 3, 7 | skill writes both; check makes a missing `lead` an error |
| p-d3ub553ogh secretary sandbox TMPDIR | already closed | `bbe0ffe2a` sets `TMPDIR=/tmp` (private tmpfs); proof `test/session-host/head-start.test.mjs:247`; phase 11 re-confirms live |
| p-bakpfrvigb orphan rotation state | phase 6 | resolved on the lineage's normal path plus one doctor pointer row |
| p-4r4h3jqtth head ran 33 h without rotating | already done | plan `261121-0745-head-rotation-trace`, `65ad518d5` |

## Prior art reused and what was missing

- Grants stay one table, `src/session-host/head-grants.mjs` (`grantOf`); verbs are served by
  `src/session-host/head-request.mjs` behind the Rust transport `packages/run-supervisor/rust/src/head_request.rs`, and a
  confined CLI call is mapped to a socket verb in `apps/fgos/src/routing.rs` (`confined_head_call`). Missing: `friction
  record`, `config patch` (supervisor), `supervisor raise` (lead).
- The land door already runs configured gates with `when` globs, unconfined, for a paths land too
  (`packages/supervision/rust/src/land.rs`, `run_gates`). Missing: a gate for `plans/**` and a placeholder naming the
  landed plan directories (only `{tests}` exists).
- Persona pins already exist in `.fgos/config.yaml` (`runner.personas.<p>.prefer: claude`, tier flagship for supervisor,
  lead, shaper, planner). Missing: the secretary pin (tier and pool only) and an owning test.
- The raise door's closed kinds (`packages/supervision/rust/src/queue.rs`, `COORDINATION_KINDS`) already include
  `coordination-help`; no new kind is added.
- Watcher actions and thresholds (`core/config-standard/watcher.yaml`: `sessionIdleLimit`, `activeIntervalSec`,
  `actions`) are tuned with the existing `fgos watcher tune`.
- Head `TMPDIR` was fixed in `bbe0ffe2a`; the 33-hour rotation gap was closed by plan `261121-0745-head-rotation-trace`.

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Baseline: wake rate and idle alarms](phase-01-baseline-wake-and-idle.md) | - | plans/261122-0118-heads-stable-and-able/reports/baseline-wake-and-idle.md | 1 | ready |
| 2 | [Head verbs through the request socket](phase-02-head-verbs.md) | - | src/session-host/head-grants.mjs, src/session-host/head-request.mjs, src/session-host/head-request-client.mjs, test/session-host/head-grants.test.mjs, test/session-host/head-request.test.mjs, apps/fgos/src/routing.rs, packages/run-supervisor/contracts/head-request.v1.json, docs/platform/session-host/spec.md | 1 | ready |
| 3 | [The land door runs the plan check](phase-03-land-plan-check.md) | - | packages/supervision/rust/src/land.rs, packages/supervision/rust/tests/land.rs, scripts/plan-contract-check.mjs, test/scripts/plan-contract-check.test.mjs, core/skills/_shared/plan-contract.md, .agents/skills/**, plugins/fgOS/skills/**, .fgos/config.yaml | 1 | ready |
| 4 | [Coordinating heads keep their provider floor](phase-04-provider-floor.md) | 3 | .fgos/config.yaml, test/session-host/head-start.test.mjs | 2 | ready |
| 5 | [A live head's requests run the active release](phase-05-release-pickup.md) | 2 | packages/run-supervisor/rust/src/head_request.rs, packages/run-supervisor/rust/src/supervise/terminal.rs, packages/run-supervisor/rust/tests/head_request.rs, packages/run-supervisor/contracts/head-request.v1.json, docs/platform/run-supervisor/spec.md | 2 | ready |
| 6 | [A rotation whose executor died is resolved](phase-06-orphan-rotation.md) | 2 | src/session-rotation/rotate.mjs, test/session-rotation/rotate.test.mjs, packages/session-host/contracts/rotation-files.v1.json, packages/distribution/contracts/doctor-registry.v1.json, apps/fgos/src/wiring/doctor/**, docs/platform/session-host/spec.md | 2 | ready |
| 7 | [Supervisor and lead rules, retire condition](phase-07-supervisor-lead-rules.md) | 2, 3 | core/skills/fgos-supervisor/SKILL.md, core/skills/fgos-lead/SKILL.md, core/skills/_shared/friction-capture.md, .agents/skills/**, plugins/fgOS/skills/**, docs/platform/supervision/spec.md, test/skills/fgos-supervisor-idle-lead.test.mjs | 2 | ready |
| 8 | [Question relay is recorded and measured](phase-08-question-relay-measure.md) | 7 | core/skills/fgos-secretary/SKILL.md, .agents/skills/**, plugins/fgOS/skills/**, plans/261122-0118-heads-stable-and-able/reports/question-relay.md | 3 | ready |
| 9 | [One watcher tuning change, measured after](phase-09-watcher-tuning.md) | 1, 4, 7 | .fgos/config.yaml, plans/261122-0118-heads-stable-and-able/reports/after-wake-and-idle.md | 3 | ready |
| 10 | [The secretary wakes on new questions or mail](phase-10-secretary-wake.md) | 8 | core/skills/fgos-secretary/SKILL.md, .agents/skills/**, plugins/fgOS/skills/**, plans/261122-0118-heads-stable-and-able/reports/secretary-wake.md | 4 | draft |
| 11 | [Integration gate and live grant probe](phase-11-integration-and-probe.md) | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10 | test/live/head-grant-probe.live.mjs, CHANGELOG.md, plans/261122-0118-heads-stable-and-able/reports/head-grant-probe.md | 5 | ready |

Each phase names its canonical dispatch capability in its file: `code:implement` for 2 to 7 and 10 and the probe script
of 11; phases 1, 8's measure, 9's after-measure and 11's gate are evidence reads (`code:test`). No executor, provider or
model is pinned here; `decide` chooses at execution time.

Checks made on this table (`fgos resource-check --plan plans/261122-0118-heads-stable-and-able` and
`node scripts/plan-contract-check.mjs --plan plans/261122-0118-heads-stable-and-able`): no two phases of one wave share a
path; each phase sits in a later wave than its dependencies. Hot files are serialized by wave: `.fgos/config.yaml`
(3, then 4, then 9), the generated skill renders `.agents/skills/**` and `plugins/fgOS/skills/**` (3, 7, 8, 10, one per
wave), `head-request.v1.json` (2, then 5), `docs/platform/session-host/spec.md` (2, then 6). `CHANGELOG.md` has one
writer, phase 11.

### Footprint overlap with the two running plans

Checked by running the contract check on a copy of this plan set to `ready`: it is refused for overlapping both running
plans.

- `261118-1341-s6a-execution-tier-rust` lists `src/session-host/head-request.mjs`, `src/session-rotation/rotate.mjs`,
  `apps/fgos/src/routing.rs`, `packages/run-supervisor/**`, `packages/distribution/contracts/doctor-registry.v1.json`
  and `apps/fgos/src/wiring/doctor/**`. Phases 2, 5 and 6 must touch these.
- `261120-0625-work-data-model` lists `src/session-host/head-grants.mjs`, `scripts/plan-contract-check.mjs`,
  `packages/supervision/rust/src/land.rs`, the supervisor and secretary skills and their renders,
  `docs/platform/session-host/spec.md`, `docs/platform/supervision/spec.md` and `CHANGELOG.md`. Only two lands remain
  in that plan, and both wait on the supervisor's open question `q-wjecldhcmr` (git recover of the main checkout).

While those footprints stand, the check refuses this plan as `ready` and the supervisor's `admissible` excludes it. The
plan therefore lands `draft`, with every phase that waits on no owner answer marked `ready`. It becomes admissible when
work-data-model is done, and when s6a is done or narrows its plan footprint to the files its remaining phases still
change, none of them in this plan's list. Ordering these plans is the secretary's call (the owner ranked `p-vquz26ibnn`
first). `blockedBy` stays empty because no phase here needs a result of either plan.

## Owner questions

None asked now. The owner said not to ask tonight, and the one open point (the secretary wake mechanism, a choice the
owner reserved on 2026-11-21 21:28) blocks only phase 10: that phase's first step asks it with `fgos questions ask` in
the five-part form, with the proposal written in the phase file, and lists the `q-` id here.

## Risks and rollback

- **Overlap with s6a and work-data-model** (above): the plan cannot be admitted until both are resolved; nothing
  breaks meanwhile.
- **The new land gate refuses lands it should not**: a running plan that already overlaps another running plan (s6a and
  `261120-0625-work-data-model` overlap today) must still land its phase-table updates. Phase 3 reports cross-plan overlap
  as an error only for a plan that is `ready`, and as a warning for one already `running`; its test covers both.
- **Release pickup crosses a layer**: the activation reader lives in `packages/distribution`; phase 5 injects the
  resolution as a port from the code that builds the socket config, never copies the reader, and stops for a plan change
  if the needed file is outside its footprint.
- **The idle-lead rule types into a pane**: only `session type` on a session an open `session-idle` event names, which the
  socket already enforces (`target-not-stuck`).
- **`.fgos/config.yaml` carries uncommitted owner edits in the main checkout**: phases 3, 4 and 9 change it only through
  `fgos config patch` or `fgos watcher tune` on their branch, and the lead reports a refused local fast-forward instead of
  touching the main checkout.
- **Rollback**: every phase lands as its own commit; revert that commit. The grant table, the land gate entry and the
  persona pin are each one config or table line, so a revert restores the previous behavior without a migration.
