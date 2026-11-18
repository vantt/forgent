<!-- DRAFT INPUT, not a plan. A planner subagent started by the shaper wrote this plan.md (phase files never written) before the owner rule of 2026-11-18 (the secretary starts planners). The secretary's planner may use or replace it. The minted plan dir plans/261118-1045-project-supervisor/ was left empty. -->

---
contract: plan-v1
title: "Project supervisor: a no-LLM watcher on a timer wakes an LLM supervisor that admits ready plans into a lane pool, starts one lead per plan, and lands through one Rust door"
status: draft
priority: P1
blockedBy:
  - 261117-1856-secretary-session-spine
  - 261118-0947-session-verb-for-agent-sessions
  - 261118-0936-ops-metrics
footprint:
  - plans/261118-1045-project-supervisor/**
  - docs/platform/supervision/**
  - docs/platform/system-overview/spec.md
  - docs/platform/component-boundary.md
  - docs/platform/run-supervisor/spec.md
  - docs/platform/session-host/spec.md
  - docs/platform/holder-lock/spec.md
  - docs/platform/packaging-distribution/spec.md
  - docs/reading-map.md
  - docs/backlog.md
  - CHANGELOG.md
  - Cargo.toml
  - Cargo.lock
  - packages/supervision/**
  - packages/event-store/contracts/consumers.v1.json
  - packages/run-supervisor/rust/src/lanes.rs
  - packages/run-supervisor/rust/src/supervise.rs
  - packages/run-supervisor/rust/src/lib.rs
  - packages/run-supervisor/rust/src/head_request.rs
  - packages/run-supervisor/rust/tests/**
  - packages/run-supervisor/contracts/head-request.v1.json
  - packages/holder-lock/contracts/lock-registry.v1.json
  - packages/distribution/rust/src/timer.rs
  - packages/distribution/contracts/doctor-registry.v1.json
  - packages/git/contracts/mutation-census.v1.json
  - packages/host-runtime/contracts/command-manifest.json
  - packages/host-runtime/contracts/command-routes.json
  - packages/config/**
  - apps/fgos/Cargo.toml
  - apps/fgos/src/main.rs
  - apps/fgos/src/routing.rs
  - apps/fgos/src/wiring/mod.rs
  - apps/fgos/src/wiring/supervision.rs
  - apps/fgos/src/wiring/observe_declarations.rs
  - apps/fgos/src/wiring/metrics_sources.rs
  - apps/fgos/src/wiring/doctor/**
  - apps/fgos/tests/supervision_*.rs
  - core/config-standard/**
  - core/config-schema/**
  - core/watcher/**
  - core/agents/**
  - core/skills/**
  - core/task-specs/fgos-fanout.md
  - domains/coding/skills/fgos-coding-planning/**
  - .agents/skills/**
  - .claude/skills/**
  - .claude/agents/**
  - plugins/fgOS/skills/**
  - .githooks/pre-commit
  - scripts/plan-contract-check.mjs
  - bin/fgos.mjs
  - src/cli/command-registry.mjs
  - src/session-host/**
  - src/state/worker-slots.mjs
  - src/runner/claim-port.mjs
  - src/runner/loop.mjs
  - src/runner/fanout-batch.mjs
  - src/setup/**
  - test/**
  - docs/architecture-manifest.json
base: 9b462207d4ef96f71394c6a3970e6cd54021dbf3
source:
  - plans/reports/shaping-261118-1045-supervisor-owner-questions.md
  - p-t55xjys4u5
  - p-dkkodseo63
created: 2026-11-18
---

# Project supervisor

Design input: [shaping report, section "SETTLED DESIGN"](../reports/shaping-261118-1045-supervisor-owner-questions.md#settled-design-the-planners-input-supersedes-the-earlier-rounds-where-they-differ)
(authoritative; earlier rounds hold the owner quotes). Ops-metrics phase numbers follow its 16-phase table on branch
`shape/ops-metrics` (coordinator update 2026-11-18), not the numbers in the shaping report.

## Outcome

fgOS coordinates the plans of the project it runs on with no person sitting by:

- A **watcher** (Rust, no LLM, third per-project OS timer) runs detection definitions each tick, records each raised
  event once in the Event Store, and runs the configured action per row kind: wake the supervisor (default) or notify
  through the mailbox. It decides, starts and stops nothing.
- A **supervisor** (LLM head session, persona `supervisor`) is woken through one door `fgos supervisor wake`. It drains
  the event queue: admits `ready` plans by priority while leads < `supervisor.maxLeads` and a lane is free, starts one
  **lead** per plan, restarts/parks/asks about a gone or stuck lead, closes done plans, and starts a **planner** when a
  discussion settles. It asks the owner only through batched five-part questions (`fgos questions --open`).
- A **lead** (persona `lead`, confined) drives one plan's waves through `fgos run`, reviews each phase and lands it with
  **`fgos land`**, the one Rust landing door that replaces `land-branch.sh` and the hand census fix.
- **Lanes** are worker seats pooled per machine (`workerSlots.ceiling`, default 4, `fgos slots`), enforced where a
  worker seat starts. A lead takes no lane.

## Settled design and decisions

Settled by the owner (shaping report items 1-10): watcher/supervisor split, wake triggers, supervisor duties, lead
persona and grant, landing door, lane pool, portfolio = plan frontmatter only, planner door, observe kinds, Rust first.
Decided by the planner inside that frame (evidence-backed; say so if one is wrong):

| id | decision | ground |
|---|---|---|
| PS-1 | New area **Supervision** (`docs/platform/supervision/spec.md`) and one crate `packages/supervision/rust` (`fgos-supervision`): portfolio reader, event queue, watcher, wake door, supervisor verbs, discussion source, landing use case | a new product area gets a spec before code (L5 q2); one crate keeps one door per job; modules are file-disjoint so phases run in parallel |
| PS-2 | `fgos land` composes existing Git ports: Remote fetch, Land prepare (holds the target's merge slot, rank 20, across the gate), consumer gate on the candidate, Land publish, Remote push; retries 3 times when the remote moved. **No new `land` lock**: the merge slot already serialises | `packages/git/rust/src/land.rs:102` ("keeping this value alive keeps the target's rank-20 slot"); Git spec §3 Land/Remote rows; one door (principle 1) |
| PS-3 | Land **merges**, it does not rebase | Git has no rebase port and adding one is a new mechanism (RUL104); existing plans' rollback assumes one merge commit per phase (ops-metrics, session-verb plans) |
| PS-4 | Generated-file conflicts are resolved by the Land port's declared files (`LandRequest.files`, bound to the pinned target): run `land.regenerate`, pass the bytes | `land.rs:26-33`; `landRunnerItem` does the same (`src/runner/merge.mjs:904-910`) |
| PS-5 | Gate and regeneration are project config (`land.gates: [{run, when?}]`, `land.regenerate`), never fgOS-repo constants; an empty `land.gates` refuses `land-gate-missing`. This repo's land-branch.sh list becomes its project config | mission #1 (D-ADR0035): `fgos land` serves other projects; precedent `runner.capabilities.<c>.verify` (`core/config-schema/runner.schema.yaml:501`) |
| PS-6 | `fgos land --paths <p>...` commits main-checkout edits of exact paths (ScopedCommit) then gates/pushes the same way: the one way a confined head's portfolio edit (status, priority, phase table, board line, DISCUSSION.md) reaches `main` | `fgos.plan.status` is read from git history (ops-metrics phase 11); confined heads cannot run git |
| PS-7 | Pre-commit census refusal applies only to commits on the trunk; branch commits pass and `fgos land` regenerates and gates the census. Retires p-t55xjys4u5 | `.githooks/pre-commit:420-438`; backlog p-t55xjys4u5 |
| PS-8 | One supervisor per project = the Identity role `head:supervisor-main` (head start fronts a live holder). The watcher tick takes a new repo lock `watcher`. No `supervisor` lock | a holder-lock is process-bound and an LLM session spans many processes; `startHeadSession` already refuses a second holder (`src/session-host/head-start.mjs:202-219`) |
| PS-9 | Delivery to a live supervisor = the queue: `supervisor done` refuses while unhandled events exist, and the next tick re-wakes for any unhandled event when no supervisor is live | no typed-input delivery into a mid-turn LLM pane; queue is Event Store truth (shaper round 4) |
| PS-10 | Long request verbs (`land`, `run`) answer at once with a ticket; `request result <id>` reads the outcome | request verbs are bounded to 60 s and served one at a time (`head_request.rs:33,382`) |
| PS-11 | A head name is at most 32 chars (`head-start.mjs:151`): lead/planner name = the plan or discussion dir cut to 32 chars, resolved back by unique prefix; the portfolio reader flags a collision and the supervisor asks instead of starting | plan dirs reach 43 chars (`261118-0947-session-verb-for-agent-sessions`) |
| PS-12 | Lane count = held machine-scope lane locks (`<lockRoot>/lane/<k>.lock`), taken by the worker's run supervisor before launch, released with it; a head session takes none. The Work-item count of `worker-slots.mjs` and the `claimWork` gate are retired (L10) | correctness from OS state (principle 5); `worker-slots.mjs:21-25` already says a claim runs only after a worker stands, so the seat-start gate dominates |
| PS-13 | The watcher's OS timer fires at `watcher.activeIntervalSec`; a tick with no running plan and no live lead exits early until `watcher.idleIntervalSec` passed since the last full tick. `watcher.enabled` is global-only (decides what runs on this machine) | timer schedules have one interval (`timer.rs:117-139`); config spec §3 rule on machine keys |
| PS-14 | Shaper grant gains writes `docs/discussions` and verb `land`; secretary, planner, supervisor, lead gain `land` | the `discussion-settled` trigger needs the marker on `main`; today a confined shaper writes nothing (`head-grants.mjs:27`) |

## Acceptance criteria

1. `cargo test -p fgos-supervision` green: portfolio order and admissibility, event raised once and handled, watcher
   pace and per-kind actions, wake starts or skips, land merge/regenerate/gate/push/retry on a fixture remote.
2. `cargo test -p fgos-run-supervisor lanes` green: a worker seat past the ceiling ends `abandoned-not-started` with
   `lane-pool-full`; a session attempt takes no lane; a killed supervisor frees its lane.
3. `npm run fgos:dev -- slots --json` reports `{lanes:{ceiling,live,free,seats}}`;
   `rg -n "countWorkerSlots|hasWorkerSlotRoom" src bin test` finds nothing.
4. Each trigger definition in `core/watcher/definitions/` raises exactly one row on its fixture
   (`cargo test -p fgos-supervision --test definitions`).
5. `npm run fgos:dev -- doctor --json` has rows `watcher-timer` and `supervisor-events-unhandled`;
   `cargo test -p fgos-distribution timer` renders the watcher unit on Linux and macOS.
6. `apps/fgos/tests/supervision_verbs.rs` drives `watcher tick`, `supervisor wake|plans|queue|handled|done` and `land`
   once each through the host.
7. `test/session-host/head-start.test.mjs` (owner of `grantOf`) proves the lead's writes come from its plan footprint and the new personas'
   verbs; `test/session-host/head-request.test.mjs` proves a ticket verb answers at once and `request result` returns the outcome.
8. Live (integration phase report): on the main checkout a throwaway `ready` plan is admitted, its lead lands one phase
   with `fgos land`, the plan reaches `done` with a board line, and no person typed a command after `ready`.
9. `rg -n "land-branch" core domains docs/platform src` finds nothing and the script is deleted from the main checkout's
   `.fgos/runtime/tmp/`.
10. `npm test` and `cargo test --workspace` green on the combined tree; `cargo clippy --workspace -- -D warnings`;
    msvc and `aarch64-apple-darwin` compile checks; `node scripts/plan-contract-check.mjs --plan plans/261118-1045-project-supervisor` ok.

## Non-goals

- The Work layer (no work items read; `fgos ready`/`schedule` untouched) beyond retiring the slot count it no longer owns.
- External UI integration and the six ports (plan `261118-1117-external-ui-integration-multica`).
- Defining liveness detections `head-gone`, `plan-no-progress` (ops-metrics phase 14); this plan only runs them.
- Notifier channels beyond the mailbox; automatic code review beyond the lead's brief; a rebase port in Git.
- Cross-machine supervision of one project: the watcher is enabled per machine (PS-13); `running` committed on `main`
  is the only cross-machine claim.

## Leader rules (every phase)

- Step 0 re-greps every input: this plan was written on `base` before its three blocking plans finished; a finding
  that changes a decision above stops the phase with `NEEDS_CONTEXT`.
- New code is Rust (owner 2026-11-18); a Node side stays a thin caller. Landed Node code is edited, not ported.
- One owning proof per behaviour at the lowest layer; the host gets one wiring proof per verb. A retired mechanism
  retires its tests in the same phase and names the test that now owns the behaviour (principle 8).
- Generated files (command manifest/routes, skill renders, census) are regenerated, never hand-merged.
- Config keys only through `core/config-standard` + `core/config-schema`; doctor rows only through
  `packages/distribution/contracts/doctor-registry.v1.json`.
- No plan ids or phase numbers in code comments, test names or commit messages.

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [Supervision area spec](phase-01-supervision-spec.md) | - | docs/platform/supervision/**, docs/platform/system-overview/spec.md, docs/platform/component-boundary.md, docs/reading-map.md | 1 | draft |
| 2 | [Spike: start a head from the timer environment](phase-02-spike-timer-head-start.md) | - | plans/261118-1045-project-supervisor/reports/spike-timer-head-start.md | 1 | draft |
| 3 | [Crate scaffold, portfolio reader, contracts](phase-03-crate-and-portfolio-reader.md) | - | Cargo.toml, Cargo.lock, packages/supervision/rust/Cargo.toml, packages/supervision/rust/src/lib.rs, packages/supervision/rust/src/portfolio.rs, packages/supervision/rust/tests/portfolio.rs, packages/supervision/contracts/**, packages/supervision/rust/observe-kinds.json, packages/event-store/contracts/consumers.v1.json, scripts/plan-contract-check.mjs, test/scripts/plan-contract-check.test.mjs | 1 | draft |
| 4 | [Config keys: watcher, supervisor, land, lanes](phase-04-config-keys.md) | - | core/config-standard/watcher.yaml, core/config-standard/supervisor.yaml, core/config-standard/land.yaml, core/config-standard/workerSlots.yaml, core/config-schema/watcher.schema.yaml, core/config-schema/supervisor.schema.yaml, core/config-schema/land.schema.yaml, core/config-schema/workerSlots.schema.yaml, packages/config/** | 1 | draft |
| 5 | [Census refusal only on trunk commits](phase-05-census-hook-trunk-only.md) | - | .githooks/pre-commit, test/githooks/census-drift.test.mjs | 1 | draft |
| 6 | [Lane pool at worker seat start](phase-06-lane-pool.md) | 4 | packages/run-supervisor/rust/src/lanes.rs, packages/run-supervisor/rust/src/supervise.rs, packages/run-supervisor/rust/src/lib.rs, packages/run-supervisor/rust/tests/lanes.rs, packages/holder-lock/contracts/lock-registry.v1.json, docs/platform/holder-lock/spec.md, docs/platform/run-supervisor/spec.md | 2 | draft |
| 7 | [Landing use case](phase-07-landing-use-case.md) | 3, 4 | packages/supervision/rust/src/land.rs, packages/supervision/rust/tests/land.rs | 2 | draft |
| 8 | [Event queue in the Event Store](phase-08-event-queue.md) | 3 | packages/supervision/rust/src/queue.rs, packages/supervision/rust/tests/queue.rs | 2 | draft |
| 9 | [Personas and grants](phase-09-personas-and-grants.md) | 3 | src/session-host/head-grants.mjs, test/session-host/head-start.test.mjs, core/agents/supervisor.yaml, core/agents/lead.yaml, core/agents/planner.yaml, .claude/agents/** | 2 | draft |
| 10 | [Request transport: ticket verbs and session stop](phase-10-request-transport.md) | - | packages/run-supervisor/contracts/head-request.v1.json, packages/run-supervisor/rust/src/head_request.rs, packages/run-supervisor/rust/tests/head_request*.rs, src/session-host/head-request.mjs, src/session-host/head-request-client.mjs, src/session-host/head-stop.mjs, test/session-host/head-request.test.mjs, test/session-host/head-stop.test.mjs, docs/platform/session-host/spec.md | 2 | draft |
| 11 | [Watcher tick and mailbox notifier](phase-11-watcher-tick.md) | 3, 4, 8 | packages/supervision/rust/src/watcher.rs, packages/supervision/rust/src/notify.rs, packages/supervision/rust/tests/watcher.rs | 3 | draft |
| 12 | [Wake door and supervisor verbs](phase-12-wake-and-supervisor-verbs.md) | 3, 8, 10 | packages/supervision/rust/src/wake.rs, packages/supervision/rust/src/supervisor.rs, packages/supervision/rust/tests/wake.rs | 3 | draft |
| 13 | [Wake trigger and pace definitions](phase-13-trigger-definitions.md) | 3 | core/watcher/**, packages/supervision/rust/tests/definitions.rs, packages/supervision/rust/tests/fixtures/definitions/** | 3 | draft |
| 14 | [Discussion status source](phase-14-discussion-source.md) | 3 | packages/supervision/rust/src/discussion_source.rs, packages/supervision/rust/tests/discussion_source.rs | 3 | draft |
| 15 | [Watcher timer schedule and doctor row](phase-15-watcher-timer.md) | 2, 4 | packages/distribution/rust/src/timer.rs, apps/fgos/src/wiring/doctor/mailbox.rs, packages/distribution/contracts/doctor-registry.v1.json, docs/platform/packaging-distribution/spec.md | 3 | draft |
| 16 | [Host wiring of the new verbs](phase-16-host-wiring.md) | 6, 7, 8, 10, 11, 12, 14, 15 | apps/fgos/Cargo.toml, Cargo.lock, apps/fgos/src/main.rs, apps/fgos/src/routing.rs, apps/fgos/src/wiring/mod.rs, apps/fgos/src/wiring/supervision.rs, apps/fgos/src/wiring/observe_declarations.rs, apps/fgos/src/wiring/metrics_sources.rs, apps/fgos/src/wiring/doctor/supervision.rs, apps/fgos/src/wiring/doctor/mod.rs, apps/fgos/tests/supervision_verbs.rs, packages/distribution/contracts/doctor-registry.v1.json, src/cli/command-registry.mjs, packages/host-runtime/contracts/command-manifest.json, packages/host-runtime/contracts/command-routes.json, bin/fgos.mjs, test/cli/** | 4 | draft |
| 17 | [Retire the work-item slot count](phase-17-retire-work-item-slots.md) | 16 | src/state/worker-slots.mjs, src/runner/claim-port.mjs, src/runner/loop.mjs, src/runner/fanout-batch.mjs, src/setup/**, test/state/worker-slots.test.mjs, test/runner/claim-port.test.mjs, test/runner/claim-capacity-race.test.mjs, test/runner/loop.test.mjs, test/runner/dispatch.test.mjs, test/setup/checks-doctor-config.test.mjs, test/architecture.test.mjs, docs/architecture-manifest.json | 5 | draft |
| 18 | [Skills: supervisor, lead, planner door, secretary and shaper](phase-18-skills.md) | 9, 16 | core/skills/fgos-supervisor/**, core/skills/fgos-lead/**, core/skills/fgos-secretary/**, core/skills/fgos-shaping/**, core/skills/fgos-fanout/**, core/task-specs/fgos-fanout.md, domains/coding/skills/fgos-coding-planning/**, .agents/skills/**, .claude/skills/**, plugins/fgOS/skills/** | 5 | draft |
| 19 | [Integration, live run and full gate](phase-19-integration.md) | 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18 | CHANGELOG.md, docs/backlog.md, docs/platform/supervision/spec.md, packages/git/contracts/mutation-census.v1.json, plans/261118-1045-project-supervisor/reports/integration.md | 6 | draft |

**Ops-metrics waits** (its 16-phase table): phase 3 kinds file → ops 1; phase 11 → ops 4, 7 (runs ops 14 definitions
at run time); phase 12 → ops 4; phase 13 → ops 5, 7, 8, 11; phase 14 → ops 1, 5; phase 16 → ops 7, 11
(`observe_declarations.rs`, `metrics_sources.rs`). Phases 1, 2, 4-10, 15 need nothing from ops-metrics.

**Contract reading check (planner).** Every phase sits in a later wave than each dependency. Disjoint per wave:
wave 1 docs / report / crate+contracts / config / hook; wave 2 run-supervisor lanes+supervise vs head_request (separate
files; only 6 touches `lib.rs`), supervision `land.rs` vs `queue.rs`, `head-grants.mjs` vs the other session-host files;
wave 3 four supervision module files plus `core/watcher` and distribution+doctor; waves 4-6 single or disjoint.
**Hot files, one writer per wave:** `Cargo.lock` 3 then 16; `doctor-registry.v1.json` 15 then 16; `command-registry.mjs`
and generated command contracts 16 only; skill renders 18 only, agent renders 9 only; `docs/platform/supervision/spec.md`
1 then 19; census 19 only; CHANGELOG and backlog 19 only. `packages/supervision/rust/src/lib.rs` is written once by 3
(declares every module) and never again.

## Owner questions

None open. PS-3 (merge, not rebase) changes the shape of `main` history; say so if a linear history is wanted, and
the `squash` flag the Land port already has becomes a `land.squash` key.

## Risks and rollback

- **A head cannot be started from a timer** (no terminal session in a systemd/launchd service). Phase 2 proves the
  needed service environment before phase 15 renders it; if no environment works, the wake door asks the mailbox
  recipient to start the supervisor and the spike result becomes an owner question.
- **Land publishes into a main checkout with unrelated dirty edits.** Phase 7 tests the dirty-unrelated case against
  the Land port's refusal codes; `--paths` lands are how heads keep `main` clean.
- **Lane locks leak on a crash.** A holder-lock dies with its process (principle 5); phase 6 proves a killed supervisor
  frees its lane.
- **Arming `workerSlots.ceiling: 4` everywhere** changes running projects; the CHANGELOG line names it and
  `fgos config set workerSlots.ceiling` raises it.
- **Footprint overlap with ops-metrics** (CHANGELOG, doctor registry, skills, `apps/fgos/src/wiring`): this plan turns
  `ready` only after ops-metrics is `done`; the check does not read `blockedBy`.
- **Rollback.** Each phase lands as one merge commit; revert in reverse wave order. Reverting 16 removes the verbs
  while the crate stays inert; reverting 17 needs 16 present; the timer of phase 15 is removed by `fgos doctor --fix`
  once `watcher.enabled` is false.

## Prior art: reused / missing

Reused: OS timer schedule template and doctor rows (`timer.rs`, `doctor/mailbox.rs`); Git Land/Remote/ScopedCommit
ports and the merge slot; Land declared files (as `landRunnerItem`); head start, grants, request socket and Identity
role uniqueness (secretary plan); `workerSlots.ceiling` key and `fgos slots` verb; Event Store consumer registration
(mailbox as template); Observe write door, `metrics query --def`, kinds declaration (ops-metrics); plan-contract
vocabulary; the parked `plan-supervisor` prototype (`origin/plan-supervisor-prototype`, unmerged: lanes by priority,
no-LLM watchdog timer) and the hand brief `.fgos/runtime/tmp/supervisor-brief-secretary-plan.md`, both folded into the
lead skill. Missing and added: watcher process, wake door, event queue, landing door, lane locks, supervisor/lead
personas and skills, discussion status source, ticket request verbs, `session stop`.
