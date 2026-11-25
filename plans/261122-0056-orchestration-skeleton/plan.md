---
contract: plan-v1
title: "Orchestration skeleton, keeper: admission in code, scheduling records from domain sources, question recipients, resource claims, the sleep record and periodic review"
status: draft
priority: P1
blockedBy:
  - 261118-1341-s6a-execution-tier-rust
  - 261120-0625-work-data-model
  - 261121-2109-component-authority
  - 261121-2110-component-authority-doors
  - 261124-2143-head-lifecycle-events
footprint:
  - plans/261122-0056-orchestration-skeleton/**
  - packages/supervision/contracts/scheduling-record.v1.json
  - packages/supervision/contracts/event-streams.v1.json
  - packages/supervision/rust/src/wake.rs
  - packages/supervision/rust/src/portfolio.rs
  - packages/supervision/rust/src/supervisor.rs
  - packages/supervision/rust/src/watcher.rs
  - packages/supervision/rust/src/keeper.rs
  - packages/supervision/rust/src/sources.rs
  - packages/supervision/rust/src/lib.rs
  - packages/supervision/rust/tests/wake.rs
  - packages/supervision/rust/tests/portfolio.rs
  - packages/supervision/rust/tests/watcher.rs
  - packages/supervision/rust/tests/definitions.rs
  - packages/supervision/rust/tests/keeper.rs
  - packages/supervision/rust/tests/sources.rs
  - packages/questions/contracts/questions-input.v1.json
  - packages/questions/contracts/question-event-payloads.v1.json
  - packages/questions/contracts/refusals.v1.json
  - packages/questions/rust/src/shape.rs
  - packages/questions/rust/src/record.rs
  - packages/questions/rust/src/usecase.rs
  - packages/questions/rust/src/notifier.rs
  - packages/questions/rust/src/lib.rs
  - packages/questions/rust/tests/store_usecases.rs
  - packages/questions/rust/tests/recipients.rs
  - packages/resource-referee/contracts/resource-referee.v1.json
  - packages/resource-referee/rust/src/catalog.rs
  - packages/resource-referee/rust/src/facts.rs
  - packages/resource-referee/rust/tests/referee.rs
  - packages/host-runtime/contracts/command-manifest.json
  - apps/fgos/src/wiring/supervision.rs
  - apps/fgos/src/wiring/resource_check.rs
  - core/config-standard/watcher.yaml
  - core/config-schema/watcher.schema.yaml
  - core/watcher/definitions/review-due.query.json
  - core/watcher/briefs/periodic-review.md
  - core/skills/fgos-supervisor/SKILL.md
  - src/workflow/records.mjs
  - src/workflow/case-verbs.mjs
  - test/workflow/records.test.mjs
  - src/session-host/head-stop.mjs
  - src/session-host/head-list.mjs
  - src/session-host/head-request.mjs
  - src/session-rotation/handoff-store.mjs
  - src/session-rotation/rotate.mjs
  - src/cli/command-registry.mjs
  - bin/fgos.mjs
  - test/session-host/head-stop.test.mjs
  - test/session-host/head-list.test.mjs
  - test/session-rotation/handoff-store.test.mjs
  - docs/platform/supervision/spec.md
  - docs/platform/questions/spec.md
  - docs/platform/workflow/spec.md
  - docs/platform/resource-referee/spec.md
  - docs/platform/session-host/spec.md
  - CHANGELOG.md
  - .agents/skills/**
  - plugins/fgOS/skills/**
  - .claude/skills/**
base: b1c7cb9b5df175c59bd2670c20c6bfe283341646
source:
  - plans/discussions/ds-yb4uz2p6hz-orchestration-skeleton/DISCUSSION.md
  - plans/discussions/ds-6psli4i4xl-workspace-ownership-survey-for-sleeping-leads/DISCUSSION.md
  - p-7pjiqfoj7v
  - p-radq263tbx
created: 2026-11-22
---

# Orchestration skeleton: the keeper

Answers the settled discussion `ds-yb4uz2p6hz-orchestration-skeleton` (owner approved §6 on 2026-11-21, round 42).
Every choice below cites the decision it honors (SR-D6 to SR-D10, OS-D1 to OS-D21 in that discussion's §4). No
locked decision is reopened here. Amended 2026-11-23 by the settled discussion
`ds-6psli4i4xl-workspace-ownership-survey-for-sleeping-leads` (D1 to D3 in its §4): phase 5 changed, phase 16 added.

**Split on 2026-11-25** (owner-approved supervisor order, delivered to the planner head
`head:planner-orchestration-skeleton`). The plan was not rewritten; its phases were divided. This plan keeps
the keeper phases 1, 3, 4, 5, 9, 10 and 16, plus a new integration phase 18. Phases 2, 6, 7, 8, 11, 12, 13, 14, 15
and 17 moved unchanged, with their ids, to plan
[`261125-1125-orchestration-skeleton-players`](../261125-1125-orchestration-skeleton-players/plan.md), which is
`blockedBy` this plan. Phase 5 stays here because it gives the keeper its plan source. Without that source the
keeper cannot see a running plan whose lead is idle.

## Outcome

fgOS gets a keeper in code that decides who acts next and when, within caps, from records that domains project
(product priority 2, OS-D3, OS-D4, OS-D7):

- Admission and caps move from the supervisor skill into the wake door
  (`packages/supervision/rust/src/wake.rs`). The door admits ready plans and starts their leads with `maxLeads` and
  the lane pool enforced, and every admit, hold and refusal carries a reason code (T1).
- A **keeper** grows out of the wake door inside Supervision. It reads the scheduling records that domains project
  (`{ item, step, waitingOn?, needs?, outcome? }`, OS-D9 to OS-D12) from registered sources: running plans and
  open workflow-case activities. It starts or wakes the player a record `needs` through the doors that already
  exist (Session Host, Identity, `bind()` and `fgos run`), and it asks the resource referee before any start. It
  raises one event when an `until` passes, and it raises "needs judgement" when its rules run out (missing need,
  round cap, orphan record). The supervisor LLM is called only for that judgement.
- Questions becomes the one door for asking any person. It gains a recipient `to` (owner, a `role`, or a `party`), an
  outbound notifier port, and a verified external-answer use case (OS-D16). The signed route that carries an outside
  answer in is phase 2 of the players plan.
- Heavy machine resources are claims of a new referee space `resource` (OS-D14).
- The sleep state of a head lives in its Session Host head record. `session stop --reason sleep` writes it together
  with a `sleep` handoff, and `fgos session list` shows live and sleeping agents (D2 of `ds-6psli4i4xl`). A running
  plan whose lead sleeps projects `waitingOn.until` from that record.
- A read-only periodic review Unit runs every `watcher.reviewIntervalSec` and turns findings into events (OS-D17).

## Acceptance criteria

Each criterion names the owning proof given in its phase file.

1. Admission and caps are enforced by code, and every admit, hold and refusal carries a reason code. A ready plan
   over `maxLeads` is refused with a reason code: `cargo test -p fgos-supervision --test wake` (phase 1).
2. One case with two parallel open steps yields two scheduling records and two started players. An `until` that
   passes raises exactly one event across repeated ticks. An orphan record raises "needs judgement" and the keeper
   does not close it. A running plan yields one lead record, and a sleeping lead's `wakeAt` becomes its `until`:
   `cargo test -p fgos-supervision --test keeper --test sources`, `node --test test/workflow/records.test.mjs`
   (phases 4, 5).
3. A question can be addressed to the owner, a `role` or a `party`. A verified external answer is accepted, and a
   wrong signature or a wrong answerer is refused: `cargo test -p fgos-questions --test recipients` (phase 3).
4. A `resource` claim over a held slot is refused, and a free slot is accepted:
   `cargo test -p fgos-resource-referee --test referee` (phase 10).
5. `session stop --reason sleep` writes the sleep fields and a `sleep` handoff, and `fgos session list` shows a
   sleeping head: `node --test test/session-host/head-stop.test.mjs test/session-host/head-list.test.mjs`
   (phase 16).
6. A `review-due` row starts one read-only Unit, and its findings become events:
   `cargo test -p fgos-supervision --test watcher --test definitions` (phase 9).
7. `npm test` and `cargo test --workspace` are green on the combined tree (phase 18).

## Non-goals

- Everything in the players plan: the signed webhook route and wake reasons, the keeper's sleep and wake decisions,
  handoff records, the records read port, tool players, the general plan contract with optional `wave`, the
  takeover check and frame intent, the lead's one harness, and the wake resume.
- Session placement port for an outside UI (OS-D20 port 4).
- The adapter of any specific webhook source or outbound channel. This plan ships the notifier port and the owner
  mailbox adapter only (OS-D8).
- Merging Questions with the Workflow gate and `fgos ask` in code (belongs to `component-authority`, OS-D16).
- Retiring the Work step FSM (N12). No Work projector is built (see "Decided here").
- Architecture Advisory Panel T0 (postponed, `q-kjat6xjwfv`).
- `bin/fgos-runner.mjs --watch` and `POST /v1/runner/tick`, which retire with S7 of plan
  `261118-1341-s6a-execution-tier-rust` (OS-D7).
- Inherited tasks T2 to T5 (`p-2wb2lfgky3`, `p-r3qqgwtcai`, `p-sdwybf7yre`, `p-lkzx3oygy4`) keep their own rows.

## Decided here

The planner decided the discussion's open points from the evidence. OS-D12 and OS-D19 were confirmed by the owner
(see Owner questions). Points that only the players plan uses are recorded there.

| Point | Decision | Why |
|---|---|---|
| Where the loop cap lives (OS-D13) | Inside `needs`: `needs.maxRounds`, declared by the domain from its frame. The keeper counts its own starts for (`item`, `step`) and raises "needs judgement" at the cap. | OS-D11 fixes three record items. The cap limits how often the keeper may start the player of a need, so it belongs to `needs`, not to a fourth item. |
| How domains hand records to the keeper | A source port in Supervision, with registered sources listed as data in `watcher.schedulingSources` (the same pattern as `watcher.definitions`). Plans are a native Rust source over the existing portfolio reader. Workflow cases are a source verb `fgos workflow records --json` over the existing case projection. Questions are not a record source: they answer `waitingOn: person`. | This keeps the keeper domain-agnostic (SR-D8) and reuses each domain's existing read door, with no second parser of the case ledger (design principle 1). |
| Machine resources (OS-D14) | A new claim space `resource` in the referee, compared by equality. A resource with capacity N is N named slots (`gpu#1`..`gpu#N`). | The referee compares and never acts. Equality over named slots fits its existing rule set with no new comparison kind. |
| Work projector | Not built. | Work is frozen history (work-data-model). Its ~273 open items are triaged under `p-jxwb7vi6a3`. |
| Split boundary (2026-11-25) | The keeper plan holds the phases that make the keeper see and start players (1, 4, 5), the doors it calls (3, 10), the sleep record its plan source reads (16), and the review that reads its output (9). | Phase 5 needs phases 4, 10 and 16. Phase 9 reviews what phases 4 and 5 produce. Every phase of the players plan consumes one of these, so the players plan can be `blockedBy` this one without a cycle. |
| Phase 9 depends on phases 4 and 5 (2026-11-25) | Phase 9 depends on 1, 4 and 5 (before the split: 1 only), and it runs in wave 4. | Its fixed brief reviews "oldest open records" and "open needs-judgement events", which exist only after phases 4 and 5. It also shares `watcher.yaml`, its schema and `wiring/supervision.rs` with phase 5, so the two cannot share a wave. The records read port (`fgos supervisor records --json`) is phase 8 of the players plan. Until it lands, the brief reads the keeper's decision events from the event stream. |
| Order against `261124-2143-head-lifecycle-events` (2026-11-25) | The whole plan is `blockedBy` 2143, not only phase 16. | The owner ordered phase 16 after 2143 because both write `src/session-host/head-stop.mjs`. 2143 also writes `wake.rs`, `portfolio.rs`, `supervisor.rs`, `wiring/supervision.rs`, `tests/wake.rs`, `tests/watcher.rs`, `tests/definitions.rs` and the supervisor skill, which are phases 1, 4, 5 and 9. If only phase 16 were held, the cross-plan overlap rule would make 2143 wait for this plan once it is `ready` while phase 16 waits for 2143, a deadlock. Only phases 3 and 10 lose a head start, and both are small. |
| Component declaration before code | The "Authority map" table below is the plan-time declaration. Phase 18 records each row through `fgos authority declare` when that verb exists on main. | The `declare` door shipped with `261121-2110-component-authority-doors`, so phase 18 checks it and uses it. |

## Authority map

The plan was created before 2026-11-24, so the mechanical rule does not apply. The model rows are named anyway,
for phase 18's declarations.

| New thing | Model row | Note |
|---|---|---|
| Admission and caps in the wake door, keeper (`keeper.rs`), decision kind "who acts next and when, within caps" | `supervision` | Grows from the wake door (OS-D7). No new component. |
| Scheduling record contract `scheduling-record.v1.json` | `supervision` | Read by the keeper and written by domain sources. |
| Source port and `watcher.schedulingSources` | `supervision`, `config` | Registered as data, like `watcher.definitions`. |
| `fgos workflow records --json` | `workflow` | A projection over the existing case projection. |
| Question recipient `to`, notifier port, verified external answer | `questions` | The one door for asking any person (OS-D16). |
| Claim space `resource` | `resource-referee` | No second referee (OS-D14). |
| `review-due` definition, `fgos.review.done` record | `supervision` | Periodic review (OS-D17), the watcher's definitions. |
| Sleep fields of the head record, `session stop --reason sleep`, `fgos session list` | `session-host`, `session-rotation` | D2. Identity's directory is unchanged. |

## Prior art (reused, and what was missing)

- Reused: the wake door and its ports (`Drain`, `Identity`, `StartSession`, `StopSession`, `Activity`), its capacity
  close rule (`CAPACITY_KINDS`) and `admissible()` in `portfolio.rs`; the raise door `queue.rs`; `run_wake`, which
  already takes a trigger and a ref; watcher definitions and their age conditions; `fgos run --case --activity`
  (case admission already exists in the run door); the case projection `src/workflow/case-projection.mjs`; the
  referee's claim spaces; `supervisor.maxLeads`, already in `core/config-standard/supervisor.yaml`.
- Reused for the sleep record (ds-6psli4i4xl §6): `stopHeadSession`, which already writes `retiredAt` and
  `retiredReason`; `writeHandoff`; the stop trace's measured fraction.
- Missing: admission in code (the supervisor skill admits today, and `maxLeads` falls back to a hardcoded 4 in the
  wiring); any scheduling record; question recipients; a resource claim space; the review definition; sleep fields
  and a view of sleeping heads.
- Line numbers from 2026-11-22 are not repeated here, because the code has moved since. Each phase re-reads its
  inputs at its own base.

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Admission in code](phase-01-admission-in-code.md) | - | packages/supervision/rust/src/wake.rs, packages/supervision/rust/src/portfolio.rs, packages/supervision/rust/src/supervisor.rs, packages/supervision/rust/tests/wake.rs, packages/supervision/rust/tests/portfolio.rs, apps/fgos/src/wiring/supervision.rs, core/skills/fgos-supervisor/SKILL.md | 1 | ready |
| 3 | [Question recipients, notifier port, verified answers](phase-03-question-recipients.md) | - | packages/questions/contracts/questions-input.v1.json, packages/questions/contracts/question-event-payloads.v1.json, packages/questions/contracts/refusals.v1.json, packages/questions/rust/src/shape.rs, packages/questions/rust/src/record.rs, packages/questions/rust/src/usecase.rs, packages/questions/rust/src/notifier.rs, packages/questions/rust/src/lib.rs, packages/questions/rust/tests/store_usecases.rs, packages/questions/rust/tests/recipients.rs | 1 | ready |
| 10 | [Resource claim space in the referee](phase-10-resource-claims.md) | - | packages/resource-referee/contracts/resource-referee.v1.json, packages/resource-referee/rust/src/catalog.rs, packages/resource-referee/rust/src/facts.rs, packages/resource-referee/rust/tests/referee.rs, apps/fgos/src/wiring/resource_check.rs | 1 | ready |
| 16 | [Sleep record in the head record; view of live and sleeping agents](phase-16-sleep-record-and-agents-view.md) | - | src/session-host/head-stop.mjs, src/session-host/head-list.mjs, src/session-host/head-request.mjs, src/session-rotation/handoff-store.mjs, src/session-rotation/rotate.mjs, src/cli/command-registry.mjs, bin/fgos.mjs, packages/host-runtime/contracts/command-manifest.json, test/session-host/head-stop.test.mjs, test/session-host/head-list.test.mjs, test/session-rotation/handoff-store.test.mjs | 1 | ready |
| 4 | [Scheduling record contract and keeper core](phase-04-keeper-core.md) | 1 | packages/supervision/contracts/scheduling-record.v1.json, packages/supervision/contracts/event-streams.v1.json, packages/supervision/rust/src/keeper.rs, packages/supervision/rust/src/lib.rs, packages/supervision/rust/src/wake.rs, packages/supervision/rust/tests/keeper.rs | 2 | ready |
| 5 | [Record sources and need resolution](phase-05-sources-and-needs.md) | 4, 10, 16 | packages/supervision/rust/src/sources.rs, packages/supervision/rust/src/lib.rs, packages/supervision/rust/src/portfolio.rs, packages/supervision/rust/tests/sources.rs, apps/fgos/src/wiring/supervision.rs, src/workflow/records.mjs, src/workflow/case-verbs.mjs, test/workflow/records.test.mjs, core/config-standard/watcher.yaml, core/config-schema/watcher.schema.yaml | 3 | ready |
| 9 | [Periodic review](phase-09-periodic-review.md) | 1, 4, 5 | core/watcher/definitions/review-due.query.json, core/watcher/briefs/periodic-review.md, core/config-standard/watcher.yaml, core/config-schema/watcher.schema.yaml, packages/supervision/rust/src/watcher.rs, packages/supervision/rust/tests/watcher.rs, packages/supervision/rust/tests/definitions.rs, apps/fgos/src/wiring/supervision.rs | 4 | ready |
| 18 | [Integration](phase-18-integration.md) | 1, 3, 4, 5, 9, 10, 16 | docs/platform/supervision/spec.md, docs/platform/questions/spec.md, docs/platform/workflow/spec.md, docs/platform/resource-referee/spec.md, docs/platform/session-host/spec.md, CHANGELOG.md, .agents/skills/, plugins/fgOS/skills/, .claude/skills/, plans/261122-0056-orchestration-skeleton/ | 5 | ready |

Phase ids are the original ids (the discussion's task order T1, T7.1 to T7.7). Waves, not ids, give the run order.
Phase 18 is new with the split, because each plan needs its own integration phase.

Hot files and their single writer per wave: `apps/fgos/src/wiring/supervision.rs` (waves 1, 3, 4: phases 1, 5, 9),
`core/config-standard/watcher.yaml` and its schema (waves 3, 4: phases 5, 9), `packages/supervision/rust/src/lib.rs`
(waves 2, 3: phases 4, 5), `packages/supervision/rust/src/wake.rs` (waves 1, 2: phases 1, 4),
`packages/supervision/rust/src/portfolio.rs` (waves 1, 3: phases 1, 5). Generated skill surfaces are regenerated
once, by `npm run build:skills` in phase 18. Phases edit only skill sources. Specs and `CHANGELOG.md` are written
only in phase 18.

Every `blockedBy` entry but `261124-2143-head-lifecycle-events` is done. The plan stays `draft` until 2143 is done,
then turns `ready` after the contract check passes at a fresh `base`.

## Owner questions

None is open. Recorded answers and orders:

- **2026-11-25, split (owner-approved supervisor order):** split this plan into the keeper plan and the players plan.
  Order phase 16 after `261124-2143-head-lifecycle-events`, and check phase 9 against phase 5. The resulting choices
  are under "Decided here".
- `q-e2bpqz65c2` (owner, 2026-11-22: "chốt cả hai như em khuyến nghị"): OS-D12 (one scheduling record per open step,
  keyed by `item`, `step`) and OS-D19 (handoff closes one record and opens the next) are final.
- `q-yoxcjqa46z`, `q-7wfzidusod` and the owner orders of 2026-11-22 and 2026-11-23 (via the secretary): this plan runs
  after component-authority and component-authority-doors, which are both done, and before
  `261122-1950-owner-communication-standard`. The supervisor admitted it at `c92bdd283` and paused it at 08:15 on
  2026-11-23 for doors, before any phase landed.
- Worktrees: only `261122-0056-orchestration-skeleton-p12` (branch `orchestration-skeleton/p12`, commit `66c320a1d`
  "compute optional phase waves in contract checks", not on main) is left. Phase 12 now belongs to the players plan,
  whose lead adopts or re-creates that branch under its own worktree name.

## Risks and rollback

- The keeper starts players in code, so a wrong rule could start too many sessions. Proof point: the owning tests
  of phases 1 and 4 drive every cap with fakes before any wiring. `maxLeads` and the lane pool are checked before
  each start, and an unknown identity or activity never counts as free (the wake door's existing rule).
- Admission moves out of the supervisor skill, and during the change both could admit. Phase 1 changes the skill in
  the same commit as the code, and the supervisor keeps only judgement.
- This plan and 2143 both change admission and the wake door. Phase 1 re-reads `wake.rs` and `portfolio.rs` after
  2143 lands and builds on 2143's lead-slot rule; it never restores the old rule.
- Rollback: each phase lands as its own commit through the land door. Revert that commit. The plan as a whole
  reverts by reverting its phase commits in reverse wave order. No data migration is involved: records are
  projections, recomputed on every tick.
