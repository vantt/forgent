---
contract: plan-v1
title: "Orchestration skeleton, players: signal entry, sleep and wake with resume, handoff records, records read port, tool players, the general plan contract and one harness for leads"
status: draft
priority: P1
blockedBy:
  - 261122-0056-orchestration-skeleton
footprint:
  - plans/261125-1125-orchestration-skeleton-players/**
  - packages/supervision/rust/src/keeper.rs
  - packages/supervision/rust/src/sources.rs
  - packages/supervision/rust/src/discussion_source.rs
  - packages/supervision/rust/src/supervisor.rs
  - packages/supervision/rust/tests/keeper.rs
  - packages/supervision/rust/tests/sources.rs
  - packages/supervision/rust/tests/discussion_source.rs
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
  - packages/execution/engine/src/transport_round/session_attempt.rs
  - packages/execution/engine/tests/transport_round.rs
  - packages/distribution/contracts/doctor-registry.v1.json
  - packages/host-runtime/contracts/command-manifest.json
  - packages/host-runtime/contracts/command-routes.json
  - packages/host-runtime/contracts/command-route-annotations.json
  - apps/fgos/src/wiring/supervision.rs
  - apps/fgos/src/wiring/questions.rs
  - apps/fgos/src/wiring/scheduling.rs
  - apps/fgos/src/wiring/mod.rs
  - apps/fgos/src/wiring/unit_run_host/session_attempt.rs
  - apps/fgos/src/wiring/unit_run_host/tests/session_attempt.rs
  - apps/fgos/src/routing.rs
  - apps/fgos/src/cli_projector.rs
  - apps/fgos/tests/scheduling_records.rs
  - apps/fgos/tests/sleeping_lead_worktree.rs
  - apps/fgos-gateway/src/gateway.rs
  - apps/fgos-gateway/src/webhook.rs
  - apps/fgos-gateway/src/lib.rs
  - core/config-standard/watcher.yaml
  - core/config-standard/gateway.yaml
  - core/config-standard/runner.yaml
  - core/config-schema/watcher.schema.yaml
  - core/config-schema/gateway.schema.yaml
  - core/config-schema/runner.schema.yaml
  - core/watcher/definitions/discussion-settled.query.json
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
  - test/workflow/propose.test.mjs
  - test/workflow/propose-frame.test.mjs
  - src/session-host/head-start.mjs
  - test/session-host/head-start.test.mjs
  - src/runner/dispatch/confinement/authority-twin.mjs
  - src/runner/dispatch/provider-capacity.mjs
  - docs/platform/supervision/spec.md
  - docs/platform/questions/spec.md
  - docs/platform/workflow/spec.md
  - docs/platform/runner/spec.md
  - docs/platform/runner/contracts/routing-handoff.md
  - docs/platform/session-host/spec.md
  - CHANGELOG.md
  - .agents/skills/**
  - plugins/fgOS/skills/**
  - .claude/skills/**
source:
  - plans/discussions/ds-yb4uz2p6hz-orchestration-skeleton/DISCUSSION.md
  - plans/discussions/ds-6psli4i4xl-workspace-ownership-survey-for-sleeping-leads/DISCUSSION.md
  - p-7pjiqfoj7v
  - p-f367pplkhu
created: 2026-11-25
---

# Orchestration skeleton: the players

Split on 2026-11-25 from plan [`261122-0056-orchestration-skeleton`](../261122-0056-orchestration-skeleton/plan.md)
(the keeper plan), on an owner-approved supervisor order. The phase files moved unchanged and keep their original
ids, so the phase numbers in their text still match the discussion's task order. Every phase number below 17 that a
phase file names but this table does not (1, 3, 4, 5, 9, 10, 16) is a phase of the keeper plan, and the keeper plan
lands before this plan starts (`blockedBy`). Choices cite the decisions of `ds-yb4uz2p6hz-orchestration-skeleton`
§4 (SR-D6 to SR-D10, OS-D1 to OS-D21) and D1 to D3 of `ds-6psli4i4xl-workspace-ownership-survey-for-sleeping-leads`.
No locked decision is reopened.

## Outcome

With the keeper in place, fgOS runs every player through it and its existing doors, with no person watching
(product priority 2):

- Every outside entry goes through the one raise door and becomes an event first (OS-D8): a CLI wake carries a
  trigger and a ref, and a signed webhook route takes deliveries and outside parties' answers. Unsigned or replayed
  deliveries raise nothing.
- Sleep ends a session by default; a head talking with a person may sit in its pane up to
  `watcher.conversationSleepMaxSec` (OS-D18). A slept lead keeps its worktree and unlanded changes, finds them again
  from plan and `git worktree list` on waking (D1), and resumes its kept transcript after a light sleep on the same
  provider, else starts fresh with the `sleep` handoff (D3).
- A handoff between steps closes one record and opens the next (OS-D19). A settled discussion yields one planner
  record, so the supervisor is not woken for it.
- Scheduling records are readable as JSON from the CLI and the gateway (OS-D20 ports 2 and 3).
- A tool that declares a job invocation is a player through `fgos run` itself (OS-D15).
- A plan, whoever wrote it, needs only the general contract, and `wave` becomes optional and computable. fgOS checks
  a foreign plan's contract when it takes it over and names the broken rule (`p-f367pplkhu`). The approved frame
  carries the intended outcome and the non-goals next to its counters, and a lead can no longer run a writing phase
  outside a case: one harness (OS-D21).

## Acceptance criteria

Each criterion names the owning proof given in its phase file.

1. A signed delivery raises exactly one event, even when sent twice. A bad signature raises nothing and returns 401.
   A signed answer from the asked party becomes `questions.answered`, and one from another party is refused:
   `cargo test -p fgos-gateway webhook` (phase 2).
2. A lead slept with an unlanded change survives a land and a cleanup, and finds the change in the same worktree on
   waking: `cargo test -p fgos --test sleeping_lead_worktree` (phase 6). A light sleep resumes; a heavy sleep and a
   refused resume get the handoff: `node --test test/session-host/head-start.test.mjs` (phase 17).
3. A settled discussion yields one planner record and one start, and landing the plan that names it closes the
   record. A coordination handoff closes one record and opens the next:
   `cargo test -p fgos-supervision --test sources --test discussion_source` (phase 7).
4. The CLI JSON lists records from both sources with decisions, and the gateway route returns the same document:
   `cargo test -p fgos --test scheduling_records` (phase 8).
5. A Unit whose `capability` binds to a tool with a job invocation runs and settles through `fgos run`.
   `fgos run --provider` with a lookup-only tool is still refused: `cargo test -p fgos-execution --test tool_job`
   (phase 11).
6. A phase table without waves passes and gets computed waves. A foreign plan that breaks the contract is refused by
   `fgos workflow propose`, with the broken rule named. A lead's writing `fgos run` without `--case` is refused with a
   reason code: `node --test test/scripts/plan-contract-check.test.mjs test/workflow/propose.test.mjs`,
   `cargo test -p fgos-execution --test run_request_case` (phases 12, 13, 14).
7. `npm test` and `cargo test --workspace` are green on the combined tree (phase 15).

## Non-goals

- Everything in the keeper plan (admission, keeper core, record sources, question recipients, resource claims, the
  sleep record and `fgos session list`, periodic review).
- Session placement port for an outside UI (OS-D20 port 4).
- The adapter of any specific webhook source or outbound channel (GitHub, Multica, email, portal); the first source is
  chosen later (OS-D8). This plan ships the signed route only.
- Merging Questions with the Workflow gate and `fgos ask` in code (belongs to `component-authority`, OS-D16).
- The other kept-worktree lists (workflow, runner): separate backlog rows `p-kyen4k2k7z` and `p-fdkdy26tba`.

## Authority map

| New thing | Model row | Note |
|---|---|---|
| Signed webhook route that only calls the raise door | `fgos-gateway`, `supervision` | OS-D8; the gateway carries, Supervision raises. |
| Wake trigger and ref recorded on the wake span | `supervision` | The wiring stops hardcoding `"manual"`. |
| Keeper sleep and wake decisions, `watcher.conversationSleepMaxSec` | `supervision`, `config` | OS-D18; the default lives in `core/config-standard`. |
| Handoff as close one record, open the next; discussion source | `supervision` | OS-D19; the payload and trust boundary stay per `routing-handoff.md`. |
| `fgos supervisor records --json`, `GET /v1/scheduling-records` | `supervision`, `fgos-gateway`, `host-surface` | OS-D20 port 2; host routes go through the command manifest. |
| Tool job invocation | `execution-core`, `executor-model` | OS-D15; no second execution door. |
| `wave` optional and computed in the plan contract check | `supervision` | The plan contract and its check live in Supervision's `src/portfolio/`. |
| Contract check at takeover; frame intent `{ outcome, nonGoals }` | `workflow`, `supervision` | `propose` reads the plan through the portfolio check. |
| Refusal of a lead's writing run outside a case | `execution-core`, `workflow` | The run door refuses, and the case door is named in the refusal. |
| Wake resume of a kept transcript, `credentialStore.resumeArgs` | `session-host`, `execution-core`, `config` | D3; Session Host chooses, the engine launches. |

## Decided here

Carried over unchanged from the plan before the split; each was decided by the planner from the evidence on
2026-11-22 or 2026-11-23.

| Point | Decision | Why |
|---|---|---|
| Sleep limit for a head talking with a person (OS-D18) | `watcher.conversationSleepMaxSec`, default 43200 (12 hours), in `core/config-standard/watcher.yaml` | The owner's answers come back after a night (round 42 at 23:36, resumed next morning); 12 hours keeps a conversation across one night. Longer keeps a pane on an old release (the reason OS-D18 defaults to ending sessions). |
| `wave` in plan-v1 (OS-D21) | Optional. When a phase row has no wave, the check computes it: one more than the highest wave among its dependencies, then pushed later while it overlaps an earlier row of the same wave, in table order. When present it is checked as today. | A plan from another system knows its dependencies and footprints, not fgOS waves; the wave is derivable, so requiring it rejects valid foreign plans. |
| Frame lacks intended outcome and non-goals (OS-D21, workflow spec §2.2) | `propose` copies the plan's Outcome and Non-goals sections into the frame as `intent: { outcome, nonGoals }` next to the counters; they enter the frame's approval digest and the approval question. | The spec already names them as frame parts; copying is one read, no new authority. |
| Where the sleeping-lead amendment goes | The keeper side is phase 6; the Session Host side is phase 16 of the keeper plan; the wake resume is phase 17. | Three layers, no shared file boundary; phase 6 depends on both, so the hand-off's run order holds. |
| Which `until` a sleep writes | The earliest `waitingOn.until` of the head's records; a head waiting only on a person or an event gets the conversation limit. Plan and phase are passed when the record names them, else absent. | The discussion fixes where `wakeAt` is stored (D2), not where it comes from; the keeper already holds the records. Labeled assumption: it changes no outcome the owner set. |
| How a CLI is told to resume | `credentialStore.resumeArgs` in the executor config (`core/config-standard/runner.yaml`), next to `sessionDir`; an executor without it never resumes. | The resume is per CLI, and the executor config already declares where each CLI keeps its session. |
| Dependencies on keeper phases (2026-11-25) | Dropped from the `depends-on` column; the whole plan is `blockedBy` the keeper plan. Phase 2 needed 1 and 3; phase 6 needed 5 and 16; phase 7 and 8 needed 5; phase 17 needed 16. | `depends-on` names phases of the same plan; `blockedBy` already orders every one of them. |

## Prior art (reused, and what was missing)

- Reused: the raise door `queue.rs`; `run_wake`, which already takes a trigger and a ref; `fgos run --case
  --activity`; `fgos workflow propose` and `src/workflow/propose-frame.mjs`; `kind: tool` executors and their
  invocation list (`packages/execution/rust/src/tools.rs`); the checkout door's refusals
  (`worktree-dirty-preserved`, `worktree-delivery-unproven`); the lead skill's worktree name `<plan dir
  name>-p<NN>`; `seatSessionDir` and `keepSessionBeforeRemoval` (the transcript is already kept per launch).
- Reused from the keeper plan: the keeper, the record contract and sources, question recipients and the verified
  answer use case, the sleep record and `fgos session list`.
- Reused work: branch `orchestration-skeleton/p12` (commit `66c320a1d`, "compute optional phase waves in contract
  checks", worktree `261122-0056-orchestration-skeleton-p12`) already holds a start of phase 12. The lead of this plan
  rebases it on main and adopts it, or re-creates the work under this plan's worktree name.
- Missing: wake reasons; a webhook route; any resume of a kept transcript; the keeper's sleep decision; handoff
  records; a records read port; tool job invocations; the plan-contract check at takeover; frame intent; a refusal
  for a lead's writing run outside a case.

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 2 | [Signal entry: wake reasons and the signed webhook route](phase-02-signal-entry.md) | - | apps/fgos/src/wiring/supervision.rs, apps/fgos/src/wiring/questions.rs, apps/fgos-gateway/src/gateway.rs, apps/fgos-gateway/src/webhook.rs, apps/fgos-gateway/src/lib.rs, core/config-standard/gateway.yaml, core/config-schema/gateway.schema.yaml, packages/distribution/contracts/doctor-registry.v1.json, packages/host-runtime/contracts/command-manifest.json | 1 | ready |
| 11 | [Tool as a player through fgos run](phase-11-tool-player.md) | - | packages/execution/rust/src/tools.rs, packages/execution/rust/src/bind.rs, packages/execution/rust/src/executor_model.rs, packages/execution/rust/src/executor_config.rs, packages/execution/rust/src/unit/, packages/execution/rust/src/loops/, packages/execution/contracts/executor-model.v1.json, packages/execution/contracts/bind.v1.json, packages/execution/rust/tests/tool_job.rs | 1 | ready |
| 12 | [General plan contract, wave optional](phase-12-plan-contract-wave.md) | - | core/skills/_shared/plan-contract.md, scripts/plan-contract-check.mjs, test/scripts/plan-contract-check.test.mjs | 1 | ready |
| 17 | [Wake resumes the kept transcript or opens fresh with the handoff](phase-17-wake-resume.md) | - | src/session-host/head-start.mjs, src/runner/dispatch/confinement/authority-twin.mjs, src/runner/dispatch/provider-capacity.mjs, packages/execution/engine/src/transport_round/session_attempt.rs, packages/execution/engine/tests/transport_round.rs, apps/fgos/src/wiring/unit_run_host/session_attempt.rs, apps/fgos/src/wiring/unit_run_host/tests/session_attempt.rs, core/config-standard/runner.yaml, core/config-schema/runner.schema.yaml, test/session-host/head-start.test.mjs | 1 | ready |
| 13 | [Contract check at takeover; frame intent](phase-13-takeover-check-frame-intent.md) | 12 | src/portfolio/plan-contract.mjs, scripts/plan-contract-check.mjs, src/workflow/propose.mjs, src/workflow/propose-validate.mjs, src/workflow/propose-frame.mjs, src/workflow/case-frame.mjs, test/workflow/propose.test.mjs, test/workflow/propose-frame.test.mjs, test/portfolio/plan-contract.test.mjs | 2 | ready |
| 8 | [Scheduling records read port and command port](phase-08-records-read-port.md) | 2 | apps/fgos/src/wiring/scheduling.rs, apps/fgos/src/wiring/mod.rs, apps/fgos/src/routing.rs, apps/fgos/src/cli_projector.rs, apps/fgos/tests/scheduling_records.rs, packages/host-runtime/contracts/command-manifest.json, packages/host-runtime/contracts/command-routes.json, packages/host-runtime/contracts/command-route-annotations.json, apps/fgos-gateway/src/gateway.rs | 2 | ready |
| 6 | [Sleep and wake of players](phase-06-sleep-and-wake.md) | 17 | packages/supervision/rust/src/keeper.rs, packages/supervision/rust/tests/keeper.rs, core/config-standard/watcher.yaml, core/config-schema/watcher.schema.yaml, apps/fgos/src/wiring/supervision.rs, core/skills/fgos-lead/SKILL.md, apps/fgos/tests/sleeping_lead_worktree.rs | 2 | ready |
| 14 | [Lead runs phases inside cases; one harness](phase-14-lead-in-case.md) | 13 | packages/execution/rust/src/run_request/, packages/execution/rust/tests/run_request_case.rs, core/skills/fgos-lead/SKILL.md | 3 | ready |
| 7 | [Handoff as close one record, open the next](phase-07-handoff-records.md) | 6 | packages/supervision/rust/src/sources.rs, packages/supervision/rust/src/discussion_source.rs, packages/supervision/rust/src/supervisor.rs, packages/supervision/rust/tests/sources.rs, packages/supervision/rust/tests/discussion_source.rs, core/watcher/definitions/discussion-settled.query.json, core/skills/fgos-supervisor/SKILL.md, apps/fgos/src/wiring/supervision.rs | 3 | ready |
| 15 | [Integration](phase-15-integration.md) | 2, 6, 7, 8, 11, 12, 13, 14, 17 | docs/platform/supervision/spec.md, docs/platform/questions/spec.md, docs/platform/workflow/spec.md, docs/platform/runner/spec.md, docs/platform/runner/contracts/routing-handoff.md, docs/platform/session-host/spec.md, CHANGELOG.md, .agents/skills/, plugins/fgOS/skills/, .claude/skills/, plans/261125-1125-orchestration-skeleton-players/ | 4 | ready |

Hot files and their single writer per wave: `apps/fgos/src/wiring/supervision.rs` (waves 1, 2, 3: phases 2, 6, 7),
`packages/host-runtime/contracts/command-manifest.json` and `apps/fgos-gateway/src/gateway.rs` (waves 1, 2: phases
2, 8), `scripts/plan-contract-check.mjs` (waves 1, 2: phases 12, 13), `core/skills/fgos-lead/SKILL.md` (waves 2, 3:
phases 6, 14). Generated skill surfaces are regenerated once, by `npm run build:skills` in phase 15; specs and
`CHANGELOG.md` are written only in phase 15.

The plan stays `draft` until the keeper plan is done; it then turns `ready` once the contract check passes at a fresh
`base` (every phase re-reads its inputs there, since the files moved after 2026-11-23).

## Owner questions

None open. OS-D12 and OS-D19 are final (`q-e2bpqz65c2`, owner 2026-11-22). The split itself is the owner-approved
supervisor order of 2026-11-25; the keeper plan's "Owner questions" holds the earlier ordering answers.

## Risks and rollback

- A slept lead's work is lost if any remover skips the checkout door. Proof point: phase 6's `sleeping_lead_worktree`
  drives a real land and cleanup against a slept lead's dirty and undelivered worktree.
- A resume replays a transcript the new account cannot accept (signed thinking blocks, unverified). Phase 17 never
  assumes the replay: a refused resume falls back to the handoff in the same start, and its owning test uses a
  refusing fake CLI. Proof point for validating: one real resume of a Claude head across two accounts of the same
  pool, recorded as evidence, not as a gate.
- The webhook route is an outside entry: unsigned or replayed deliveries must not raise. Phase 2's owning test sends
  a bad signature and a replayed delivery id and gets refusals; the payload is stored as untrusted data and never
  interpreted as a command.
- A lead's writing run outside a case is refused (phase 14): any plan still run by an old lead release would stall.
  Phase 14 lands after phase 13, so `propose` can map every phase; the refusal names the case door to use.
- Rollback: each phase lands as its own commit through the land door; revert that commit. The plan as a whole
  reverts by reverting its phase commits in reverse wave order; no data migration is involved.
