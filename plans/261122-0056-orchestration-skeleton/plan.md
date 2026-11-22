---
contract: plan-v1
title: "Orchestration skeleton: a code keeper that admits, starts and wakes players from domain scheduling records, one raise door for every entry, and one harness for plans"
status: draft
priority: P1
blockedBy:
  - 261118-1341-s6a-execution-tier-rust
  - 261120-0625-work-data-model
  - 261121-2109-component-authority
  - 261122-0118-heads-stable-and-able
  - 261122-1950-owner-communication-standard
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
  - packages/supervision/rust/src/discussion_source.rs
  - packages/supervision/rust/src/lib.rs
  - packages/supervision/rust/tests/wake.rs
  - packages/supervision/rust/tests/portfolio.rs
  - packages/supervision/rust/tests/watcher.rs
  - packages/supervision/rust/tests/definitions.rs
  - packages/supervision/rust/tests/keeper.rs
  - packages/supervision/rust/tests/sources.rs
  - packages/supervision/rust/tests/discussion_source.rs
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
  - packages/execution/rust/src/tools.rs
  - packages/execution/rust/src/bind.rs
  - packages/execution/rust/src/executor_model.rs
  - packages/execution/rust/src/executor_config.rs
  - packages/execution/rust/src/unit/**
  - packages/execution/rust/src/loops/**
  - packages/execution/rust/src/run_request/**
  - packages/execution/contracts/executor-model.v1.json
  - packages/execution/contracts/bind.v1.json
  - packages/execution/rust/tests/tool_job.rs
  - packages/execution/rust/tests/run_request_case.rs
  - packages/distribution/contracts/doctor-registry.v1.json
  - packages/host-runtime/contracts/command-manifest.json
  - packages/host-runtime/contracts/command-routes.json
  - packages/host-runtime/contracts/command-route-annotations.json
  - apps/fgos/src/wiring/supervision.rs
  - apps/fgos/src/wiring/questions.rs
  - apps/fgos/src/wiring/resource_check.rs
  - apps/fgos/src/wiring/scheduling.rs
  - apps/fgos/src/wiring/mod.rs
  - apps/fgos/src/routing.rs
  - apps/fgos/src/cli_projector.rs
  - apps/fgos/tests/scheduling_records.rs
  - apps/fgos-gateway/src/gateway.rs
  - apps/fgos-gateway/src/webhook.rs
  - apps/fgos-gateway/src/lib.rs
  - core/config-standard/watcher.yaml
  - core/config-standard/gateway.yaml
  - core/config-schema/watcher.schema.yaml
  - core/config-schema/gateway.schema.yaml
  - core/watcher/definitions/review-due.query.json
  - core/watcher/definitions/discussion-settled.query.json
  - core/watcher/briefs/periodic-review.md
  - core/skills/fgos-supervisor/SKILL.md
  - core/skills/fgos-lead/SKILL.md
  - core/skills/_shared/plan-contract.md
  - scripts/plan-contract-check.mjs
  - test/scripts/plan-contract-check.test.mjs
  - src/portfolio/plan-contract.mjs
  - test/portfolio/plan-contract.test.mjs
  - src/workflow/propose.mjs
  - src/workflow/propose-validate.mjs
  - src/workflow/propose-frame.mjs
  - src/workflow/case-frame.mjs
  - src/workflow/records.mjs
  - src/workflow/case-verbs.mjs
  - test/workflow/propose.test.mjs
  - test/workflow/propose-frame.test.mjs
  - test/workflow/records.test.mjs
  - docs/platform/supervision/spec.md
  - docs/platform/questions/spec.md
  - docs/platform/workflow/spec.md
  - docs/platform/resource-referee/spec.md
  - docs/platform/runner/spec.md
  - docs/platform/runner/contracts/routing-handoff.md
  - CHANGELOG.md
  - .agents/skills/**
  - plugins/fgOS/skills/**
  - .claude/skills/**
base: 0e527ffa28de6cbb0a1e39d9d7098f6ba6454481
source:
  - plans/discussions/ds-yb4uz2p6hz-orchestration-skeleton/DISCUSSION.md
  - p-7pjiqfoj7v
  - p-radq263tbx
  - p-f367pplkhu
created: 2026-11-22
---

# Orchestration skeleton

Answers the settled discussion `ds-yb4uz2p6hz-orchestration-skeleton` (owner approved §6 on 2026-11-21, round 42).
Every choice below cites the decision it honors (SR-D6 to SR-D10, OS-D1 to OS-D21 in that discussion's §4). No
locked decision is reopened here.

## Outcome

fgOS keeps its own rhythm without a person watching (product priority 2, OS-D3):

- Only the watcher timer and outside signals start activity. Every entry (timer row, signed webhook, CLI wake,
  an outside party's answer) goes through the one raise door (`packages/supervision/rust/src/queue.rs`) and
  becomes an event first (OS-D8).
- A **keeper** written in code, grown out of the wake door (`packages/supervision/rust/src/wake.rs`) inside
  Supervision, decides one thing: who acts next and when, within caps (OS-D4, OS-D7). It admits ready plans and
  starts their leads in code with `maxLeads` and the lane pool enforced (T1). It reads the scheduling records that
  domains project (`{ item, step, waitingOn?, needs?, outcome? }`, OS-D9 to OS-D12), starts or wakes the player a
  record `needs` through the doors that already exist (Session Host, Identity, `bind()` and `fgos run`), raises one
  event when an `until` passes, and raises "needs judgement" when its rules run out. The supervisor LLM is called
  only for that judgement; its decision comes back as an event.
- Sleep ends a session by default; a head talking with a person may sit in its pane up to a configured limit
  (OS-D18). A handoff between steps closes one record and opens the next (OS-D19).
- Questions is the one door for asking any person: it gains a recipient `to` (owner, a `role`, or a `party`), an
  outbound notifier port, and verified answers that come back through the raise door (OS-D16).
- A tool that declares a job invocation is a player through `fgos run` itself (OS-D15). Heavy machine resources are
  claims judged by the resource referee (OS-D14).
- A read-only periodic review Unit runs every `watcher.reviewIntervalSec` and turns findings into events (OS-D17).
- A plan, whoever wrote it, needs only the general contract; `wave` becomes optional and computable; fgOS checks a
  foreign plan's contract when it takes it over and names the broken rule (`p-f367pplkhu`). The lead maps each phase
  into workflow cases through `fgos workflow propose`, the approved frame carries the intended outcome and the
  non-goals next to its counters, and a lead can no longer run a writing phase outside a case: one harness (OS-D21).
- Scheduling records are readable as JSON from the CLI and the gateway (OS-D20 ports 2 and 3).

## Acceptance criteria

Each maps to the discussion's hand-off criteria; the owning proof is named in the phase file.

1. Admission and caps are enforced by code; every admit, hold and refusal carries a reason code. A ready plan over
   `maxLeads` is refused with a reason code: `cargo test -p fgos-supervision --test wake` (phase 1).
2. One case with two parallel open steps yields two scheduling records and two started players; an `until` that
   passes raises exactly one event across repeated ticks; an orphan record raises "needs judgement" and is not closed
   by the keeper: `cargo test -p fgos-supervision --test keeper` and `--test sources` (phases 4, 5).
3. A multi-phase plan runs every phase through a guide case; a lead's writing `fgos run` without `--case` is refused
   with a reason code; a foreign plan that breaks the contract is refused by `fgos workflow propose` with the broken
   rule named: `node --test test/workflow/propose.test.mjs`, `cargo test -p fgos-execution --test run_request_case`
   (phases 13, 14).
4. A question to an outside `party` receives a signed answer through the raise door and becomes
   `questions.answered`; a wrong signature or a wrong answerer is refused: `cargo test -p fgos-questions --test
   recipients` and the webhook test of phase 2.
5. A Unit whose `capability` binds to a tool with a job invocation runs and settles through `fgos run`; `fgos run
   --provider` with a lookup-only tool is still refused: `cargo test -p fgos-execution --test tool_job` (phase 11).
6. A `review-due` row starts one read-only Unit and its findings become events: `cargo test -p fgos-supervision
   --test watcher` (phase 9).
7. `npm test` and `cargo test --workspace` are green on the combined tree (phase 15).

## Non-goals

- Session placement port for an outside UI (OS-D20 port 4; later, only when a real UI needs to host sessions).
- The adapter of any specific webhook source or outbound channel (GitHub, Multica, email, portal); the first source is
  chosen later (OS-D8). This plan ships the signed route, the port, and the owner mailbox adapter only.
- Merging Questions with the Workflow gate and `fgos ask` in code (belongs to `component-authority`, OS-D16).
- Retiring the Work step FSM (coding cutover plan, N12). No Work projector is built: Work is frozen as read-only
  history by plan `261120-0625-work-data-model`, so it has no open steps for the keeper to drive (see "Decided here").
- Architecture Advisory Panel T0 (postponed, `q-kjat6xjwfv`).
- `bin/fgos-runner.mjs --watch` and `POST /v1/runner/tick`: they retire with S7 of plan
  `261118-1341-s6a-execution-tier-rust` (OS-D7); nothing here is built on them, and neither becomes an entry.
- Inherited tasks T2 to T5 (`p-2wb2lfgky3`, `p-r3qqgwtcai`, `p-sdwybf7yre`, `p-lkzx3oygy4`) keep their own rows.

## Decided here

The discussion left five points open, each blocking part of the plan. OS-D12 and OS-D19 were confirmed by the owner
(Owner questions); the planner decided the rest from the evidence.

| Point | Decision | Why |
|---|---|---|
| Sleep limit for a head talking with a person (OS-D18) | `watcher.conversationSleepMaxSec`, default 43200 (12 hours), in `core/config-standard/watcher.yaml` | The owner's answers come back after a night (round 42 at 23:36, resumed next morning); 12 hours keeps a conversation across one night. Longer keeps a pane on an old release (the reason OS-D18 defaults to ending sessions). The key sits with the other no-LLM rhythm keys. |
| `wave` in plan-v1 (OS-D21) | Optional. When a phase row has no wave, the check computes it: one more than the highest wave among its dependencies, then pushed later while it overlaps an earlier row of the same wave, in table order. When present it is checked as today. | A plan from another system knows its dependencies and footprints, not fgOS waves; the wave is derivable, so requiring it rejects valid foreign plans. Plans that write waves keep today's check. |
| Frame lacks intended outcome and non-goals (OS-D21, workflow spec §2.2) | `propose` copies the plan's Outcome and Non-goals sections into the frame as `intent: { outcome, nonGoals }` next to the counters; they enter the frame's approval digest and the approval question. | The spec already names them as frame parts; the plan sections already exist under the contract. Copying is one read, no new authority. |
| Where the loop cap lives (OS-D13) | Inside `needs`: `needs.maxRounds`, declared by the domain from its frame; the keeper counts its own starts for (`item`, `step`) and raises "needs judgement" at the cap. | OS-D11 fixes three record items; the cap is a limit on how often the keeper may start the player of a need, so it belongs to `needs`, not a fourth item. |
| How domains hand records to the keeper | A source port in Supervision with registered sources listed as data in `watcher.schedulingSources` (same pattern as `watcher.definitions`). Plans are a native Rust source over the existing portfolio reader; workflow cases are a source verb `fgos workflow records --json` over the existing case projection. Questions are not a record source: they answer `waitingOn: person`. | Keeps the keeper domain-agnostic (SR-D8) and reuses each domain's existing read door; no second parser of the case ledger (design principle 1). |
| Machine resources (OS-D14) | A new claim space `resource` in the referee, compared by equality; a resource with capacity N is N named slots (`gpu#1`..`gpu#N`). | The referee compares and never acts; equality over named slots fits its existing rule set with no new comparison kind. |
| Work projector | Not built. | Work is frozen history (work-data-model); its ~273 open items are triaged under `p-jxwb7vi6a3`. |
| Component declaration before code | The plan's "New things" table below is the plan-time declaration. Phase 15 records each row through `fgos authority declare` when that verb exists on main; otherwise the table stays the record for the sweep of plan `261121-2110-component-authority-doors`. | The `declare` door is itself still a draft plan; blocking on it would stall this plan behind five other plans. |

## New things (authority map)

| New thing | Owner component | Note |
|---|---|---|
| Keeper (`keeper.rs`), decision kind "who acts next and when, within caps" | Supervision | grows from the wake door (OS-D7); no new component |
| Scheduling record contract `scheduling-record.v1.json` | Supervision | read by the keeper; written by domain sources |
| Source port and `watcher.schedulingSources` | Supervision | data registration, like `watcher.definitions` |
| `fgos workflow records --json` | Workflow | a projection over the existing case projection |
| Signed webhook route | Gateway | calls only the raise door (OS-D8) |
| Question recipient `to`, notifier port, verified external answer | Questions | the one door for asking any person (OS-D16) |
| Claim space `resource` | Resource referee | no second referee (OS-D14) |
| Tool job invocation | Execution (`bind()`, `fgos run`) | no second execution door (OS-D15) |
| `review-due` definition, `fgos.review.done` record | Supervision (watcher) | periodic review (OS-D17) |
| `fgos supervisor records --json`, `GET /v1/scheduling-records` | Supervision, Gateway | portfolio read (OS-D20 port 2) |

## Prior art (reused, and what was missing)

- Reused: the wake door and its ports (`Drain`, `Identity`, `StartSession`, `StopSession`, `Activity`), its capacity
  close rule (`CAPACITY_KINDS`) and `admissible()` in `portfolio.rs`; the raise door `queue.rs`; `run_wake` already
  takes a trigger and ref (the wiring hardcodes `"manual"`, `apps/fgos/src/wiring/supervision.rs:1940`); watcher
  definitions and their age conditions; `fgos run --case --activity` (case admission already exists in the run door);
  `fgos workflow propose` and `src/workflow/propose-frame.mjs`; the case projection `src/workflow/case-projection.mjs`;
  the referee's claim spaces; `kind: tool` executors and their invocation list (`packages/execution/rust/src/tools.rs`);
  `supervisor.maxLeads` already in `core/config-standard/supervisor.yaml`.
- Missing: admission in code (the supervisor skill admits today, and `maxLeads` falls back to a hardcoded 4 in the
  wiring, `supervision.rs:1965`); any scheduling record; wake reasons; a webhook route; question recipients; a resource
  claim space; tool job invocations; the review definition; the plan-contract check at takeover; frame intent; a
  refusal for a lead's writing run outside a case.

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Admission in code](phase-01-admission-in-code.md) | - | packages/supervision/rust/src/wake.rs, packages/supervision/rust/src/portfolio.rs, packages/supervision/rust/src/supervisor.rs, packages/supervision/rust/tests/wake.rs, packages/supervision/rust/tests/portfolio.rs, apps/fgos/src/wiring/supervision.rs, core/skills/fgos-supervisor/SKILL.md | 1 | ready |
| 3 | [Question recipients, notifier port, verified answers](phase-03-question-recipients.md) | - | packages/questions/contracts/questions-input.v1.json, packages/questions/contracts/question-event-payloads.v1.json, packages/questions/contracts/refusals.v1.json, packages/questions/rust/src/shape.rs, packages/questions/rust/src/record.rs, packages/questions/rust/src/usecase.rs, packages/questions/rust/src/notifier.rs, packages/questions/rust/src/lib.rs, packages/questions/rust/tests/store_usecases.rs, packages/questions/rust/tests/recipients.rs | 1 | ready |
| 10 | [Resource claim space in the referee](phase-10-resource-claims.md) | - | packages/resource-referee/contracts/resource-referee.v1.json, packages/resource-referee/rust/src/catalog.rs, packages/resource-referee/rust/src/facts.rs, packages/resource-referee/rust/tests/referee.rs, apps/fgos/src/wiring/resource_check.rs | 1 | ready |
| 11 | [Tool as a player through fgos run](phase-11-tool-player.md) | - | packages/execution/rust/src/tools.rs, packages/execution/rust/src/bind.rs, packages/execution/rust/src/executor_model.rs, packages/execution/rust/src/executor_config.rs, packages/execution/rust/src/unit/, packages/execution/rust/src/loops/, packages/execution/contracts/executor-model.v1.json, packages/execution/contracts/bind.v1.json, packages/execution/rust/tests/tool_job.rs | 1 | ready |
| 12 | [General plan contract, wave optional](phase-12-plan-contract-wave.md) | - | core/skills/_shared/plan-contract.md, scripts/plan-contract-check.mjs, test/scripts/plan-contract-check.test.mjs | 1 | ready |
| 2 | [Signal entry: wake reasons and the signed webhook route](phase-02-signal-entry.md) | 1, 3 | apps/fgos/src/wiring/supervision.rs, apps/fgos/src/wiring/questions.rs, apps/fgos-gateway/src/gateway.rs, apps/fgos-gateway/src/webhook.rs, apps/fgos-gateway/src/lib.rs, core/config-standard/gateway.yaml, core/config-schema/gateway.schema.yaml, packages/distribution/contracts/doctor-registry.v1.json, packages/host-runtime/contracts/command-manifest.json | 2 | ready |
| 4 | [Scheduling record contract and keeper core](phase-04-keeper-core.md) | 1 | packages/supervision/contracts/scheduling-record.v1.json, packages/supervision/contracts/event-streams.v1.json, packages/supervision/rust/src/keeper.rs, packages/supervision/rust/src/lib.rs, packages/supervision/rust/src/wake.rs, packages/supervision/rust/tests/keeper.rs | 2 | ready |
| 13 | [Contract check at takeover; frame intent](phase-13-takeover-check-frame-intent.md) | 12 | src/portfolio/plan-contract.mjs, scripts/plan-contract-check.mjs, src/workflow/propose.mjs, src/workflow/propose-validate.mjs, src/workflow/propose-frame.mjs, src/workflow/case-frame.mjs, test/workflow/propose.test.mjs, test/workflow/propose-frame.test.mjs, test/portfolio/plan-contract.test.mjs | 2 | ready |
| 9 | [Periodic review](phase-09-periodic-review.md) | 1 | core/watcher/definitions/review-due.query.json, core/watcher/briefs/periodic-review.md, core/config-standard/watcher.yaml, core/config-schema/watcher.schema.yaml, packages/supervision/rust/src/watcher.rs, packages/supervision/rust/tests/watcher.rs, packages/supervision/rust/tests/definitions.rs, apps/fgos/src/wiring/supervision.rs | 3 | ready |
| 14 | [Lead runs phases inside cases; one harness](phase-14-lead-in-case.md) | 13 | packages/execution/rust/src/run_request/, packages/execution/rust/tests/run_request_case.rs, core/skills/fgos-lead/SKILL.md | 3 | ready |
| 5 | [Record sources and need resolution](phase-05-sources-and-needs.md) | 4, 10 | packages/supervision/rust/src/sources.rs, packages/supervision/rust/src/lib.rs, packages/supervision/rust/src/portfolio.rs, packages/supervision/rust/tests/sources.rs, apps/fgos/src/wiring/supervision.rs, src/workflow/records.mjs, src/workflow/case-verbs.mjs, test/workflow/records.test.mjs, core/config-standard/watcher.yaml, core/config-schema/watcher.schema.yaml | 4 | ready |
| 6 | [Sleep and wake of players](phase-06-sleep-and-wake.md) | 5 | packages/supervision/rust/src/keeper.rs, packages/supervision/rust/tests/keeper.rs, core/config-standard/watcher.yaml, core/config-schema/watcher.schema.yaml, apps/fgos/src/wiring/supervision.rs | 5 | ready |
| 8 | [Scheduling records read port and command port](phase-08-records-read-port.md) | 5, 2 | apps/fgos/src/wiring/scheduling.rs, apps/fgos/src/wiring/mod.rs, apps/fgos/src/routing.rs, apps/fgos/src/cli_projector.rs, apps/fgos/tests/scheduling_records.rs, packages/host-runtime/contracts/command-manifest.json, packages/host-runtime/contracts/command-routes.json, packages/host-runtime/contracts/command-route-annotations.json, apps/fgos-gateway/src/gateway.rs | 5 | ready |
| 7 | [Handoff as close one record, open the next](phase-07-handoff-records.md) | 5, 6 | packages/supervision/rust/src/sources.rs, packages/supervision/rust/src/discussion_source.rs, packages/supervision/rust/src/supervisor.rs, packages/supervision/rust/tests/sources.rs, packages/supervision/rust/tests/discussion_source.rs, core/watcher/definitions/discussion-settled.query.json, core/skills/fgos-supervisor/SKILL.md, apps/fgos/src/wiring/supervision.rs | 6 | ready |
| 15 | [Integration](phase-15-integration.md) | 2, 3, 7, 8, 9, 11, 14 | docs/platform/supervision/spec.md, docs/platform/questions/spec.md, docs/platform/workflow/spec.md, docs/platform/resource-referee/spec.md, docs/platform/runner/spec.md, docs/platform/runner/contracts/routing-handoff.md, CHANGELOG.md, .agents/skills/, plugins/fgOS/skills/, .claude/skills/, plans/261122-0056-orchestration-skeleton/ | 7 | ready |

Phase ids follow the discussion's task order (T1, T7.1 to T7.7); waves, not ids, give the run order.

Door check: `fgos resource-check --units` on the draft table answered `accept (15 units, 0 findings)`. Every shared
path sits in different waves. Hot files and their single writer per wave: `apps/fgos/src/wiring/supervision.rs`
(waves 1, 2, 3, 4, 5, 6: phases 1, 2, 9, 5, 6, 7), `core/config-standard/watcher.yaml` and its schema (waves 3, 4, 5:
phases 9, 5, 6), `apps/fgos-gateway/src/gateway.rs` and `command-manifest.json` (waves 2, 5: phases 2, 8),
`packages/supervision/rust/src/lib.rs` (waves 2, 4). Generated skill surfaces (`.agents/skills/`,
`plugins/fgOS/skills/`, `.claude/skills/`) are regenerated once, by `npm run build:skills` in phase 15; phases edit
only skill sources. Specs and `CHANGELOG.md` are written only in phase 15.

No phase waits on an owner question: the owner confirmed OS-D12 and OS-D19 as final on 2026-11-22
(`q-e2bpqz65c2`). The whole plan still waits on `blockedBy`. The first two (`261118-1341-s6a-execution-tier-rust`,
`261120-0625-work-data-model`) are done. On 2026-11-22 the `ready` flip was refused for footprint overlap with three
active plans, now added to `blockedBy`: `261122-1950-owner-communication-standard` (the Questions crate and contracts,
`wiring/questions.rs`, the questions spec), `261122-0118-heads-stable-and-able` (`wiring/supervision.rs`, routing, the
plan-contract check, the supervisor and lead skills, the supervision spec) and `261121-2109-component-authority` (the
runner and workflow specs). These paths are each plan's core files, so narrowing the footprint would not clear the
overlap. The plan turns `ready` once all three are done; reordering them is a priority call for the secretary.

## Owner questions

- `q-e2bpqz65c2` (answered by the owner directly in the planner session, 2026-11-22: "chốt cả hai như em khuyến
  nghị"): OS-D12 (one scheduling record per open step, keyed by `item`, `step`) and OS-D19 (handoff closes one record
  and opens the next) are final. The planner head cannot write `questions answer`, so it closed the question with
  the owner's words as the reason.

## Risks and rollback

- The keeper starts players in code: a wrong rule could start too many sessions. Proof point: phase 1 and phase 4
  owning tests drive every cap with fakes before any wiring; `maxLeads` and the lane pool are checked before each
  start, and an unknown identity or activity never counts as free (the wake door's existing rule).
- Admission moves out of the supervisor skill: during the change both could admit. Phase 1 changes the skill in the
  same commit as the code; the supervisor keeps only judgement.
- The webhook route is an outside entry: unsigned or replayed deliveries must not raise. Phase 2's owning test sends a
  bad signature and a replayed delivery id and gets refusals; the payload is stored as untrusted data and never
  interpreted as a command.
- A lead's writing run outside a case is refused (phase 14): any plan still run by an old lead release would stall.
  Phase 14 lands after phase 13, so `propose` can map every phase; the refusal names the case door to use.
- Rollback: each phase lands as its own commit through the land door; revert that commit. The plan as a whole reverts
  by reverting its phase commits in reverse wave order; no data migration is involved (records are projections,
  recomputed on every tick).
