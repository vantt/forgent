---
contract: plan-v1
title: "S6a, Execution (tier 5) in Rust: run, dispatch subs, run supervisor Node side, one worktree door"
status: draft
priority: P1
blockedBy:
  - 261115-2328-execution-read-door
footprint:
  - plans/261118-1341-s6a-execution-tier-rust/**
  - Cargo.toml
  - Cargo.lock
  - packages/execution/**
  - packages/run-supervisor/**
  - packages/git/node-addon/**
  - packages/host-runtime/**
  - packages/distribution/contracts/doctor-registry.v1.json
  - packages/git/contracts/mutation-census.v1.json
  - apps/fgos/**
  - src/runner/execution/**
  - src/runner/dispatch/**
  - src/runner/dispatch.mjs
  - src/runner/worktree.mjs
  - src/runner/agent-definitions.mjs
  - src/runner/loop.mjs
  - src/runner/work-dispatch.mjs
  - src/run-supervisor/**
  - src/verbs/worktree/**
  - src/verbs/dispatch/**
  - src/verbs/state/read.mjs
  - src/workflow/**
  - src/setup/**
  - src/native/door.mjs
  - src/util/payload-root.mjs
  - src/seat-binding/client.mjs
  - src/event-store/consumers.mjs
  - src/session-rotation/rotate.mjs
  - src/portfolio/open-questions.mjs
  - src/report/capability-plan-lint.mjs
  - src/cli/command-registry.mjs
  - src/cli/verb-exit.mjs
  - bin/fgos.mjs
  - bin/fgos-runner.mjs
  - scripts/run-tests.mjs
  - scripts/run-rust-dev-host.mjs
  - scripts/backfill-unit-summaries.mjs
  - scripts/lib/test-file-watchdog.mjs
  - scripts/lib/mailbox-live-confined.mjs
  - test/**
  - docs/architecture-manifest.json
  - docs/platform/runner/**
  - docs/platform/run-supervisor/spec.md
  - docs/platform/git/spec.md
  - docs/platform/agent-confinement/spec.md
  - docs/platform/component-boundary.md
  - docs/reading-map.md
  - docs/backlog.md
  - CHANGELOG.md
base: 0981437d2ba8060d3a9ba2ed25e005b2671dcf2f
source:
  - docs/discussions/rust-verb-migration-s6a/DISCUSSION.md
  - docs/discussions/rust-verb-migration-s6a/QUESTIONS.md
  - plans/261114-2051-rust-verb-migration-program/plan.md
  - plans/reports/planner-261118-1347-s6a-facts-and-design.md
created: 2026-11-18
---

# S6a, Execution (tier 5) in Rust

Source (binding, D1-D5 not reopened): [DISCUSSION.md](../../docs/discussions/rust-verb-migration-s6a/DISCUSSION.md)
Hand-off block; owner answers Q1-Q4 in QUESTIONS.md; program row S6a. Planner scan with every `file:line` behind
this plan: [planner-261118-1347-s6a-facts-and-design.md](../reports/planner-261118-1347-s6a-facts-and-design.md)
(read on `0981437d2`). Rules for every phase lead: [phase-lead-rules.md](phase-lead-rules.md).

## Outcome

Tier 5 (Execution) of the fgOS CLI runs in Rust and its Node code is deleted: `fgos run`, the dispatch subs
`probe-account`, `probe-session`, `reconcile`, `inspect`, `show-run`, `watch`, `recover`, the Node side of the run
supervisor, and `fgos worktree` / `resync-worktree` as the one checkout door (create, provisioning by default with
`--bare`, remove, resync, leftovers, orphan reclaim). Work's `create*`/`remove*` in `src/runner/worktree.mjs` become
thin addon wrappers (D5). Every `doors` row whose `retiredBy` names S6a closes. The 30 `bridge:S6a` doctor rows plus
`seat-binding-route` run in Rust. Workflow (S6b) and Work (S7) stay Node and reach Execution only through Rust doors.

## Acceptance criteria

Copied from the hand-off block, each with its check:

1. `command-routes` show `run`, `dispatch` (all subs), `worktree`, `resync-worktree` native; no `legacy-cli` row for
   them. Check: `packages/host-runtime/contracts/command-routes.json` (`route_kind: native` for `run`, `worktree`,
   `resync-worktree`; `dispatch.route_kind` native or every sub in `native_subcommands`); `test/rust-host/command-routes.test.mjs`.
2. `src/runner/execution`, `src/runner/dispatch`, `src/run-supervisor`, `src/verbs/{worktree,dispatch}` gone; the
   lifecycle part of `src/runner/worktree.mjs` gone, wrappers call the addon. Check: `ls` of each path fails;
   `rg -n "^export function (provisionWorktree|provisionSkillRoots|provisioningStateRoot|removeProvisioned|resyncWorktree|resyncClaimWorktree)\b" src/runner/worktree.mjs` finds nothing; every kept D5 export (`createWorktree`, `createClaimWorktree`, `createDispatchWorktree`, `createVerifyCheckout`, `removeWorktree`, `removeDispatchWorktree`, `listLeftovers`, `reclaimOrphanedCheckout`, `provisionDependencies`, `runWorktreeSetupCommands`) is one addon call (phase 04 report table).
3. A session-style checkout works through `fgos worktree create --bare` and `remove`, so plan 0947 can delete
   `session.rs`. Check: `apps/fgos/tests/cli_tests.rs` case "a detached checkout without provisioning is created and
   removed through the worktree verb" (phase 01).
4. Doors rows naming S6a in `retiredBy` closed; doctor-registry has no `bridge:S6a` owner. Check:
   `node -e` over `docs/architecture-manifest.json` finds no `S6a` in any `retiredBy`; `rg -n '"bridge:S6a"' packages/distribution/contracts/doctor-registry.v1.json` finds nothing.
5. `npm test` and `cargo test --workspace` green (on the integration head, then on main after landing).

Added by the planner (measurable forms of the hand-off constraints):

6. `fgos worktree create` keeps its name and argv; `--bare` exists and has a `## [Unreleased]` line in `CHANGELOG.md`.
7. `test/architecture.test.mjs` green with the new and changed `doors` rows (phase 22 list), including "the addon
   never links the run engine" and "only fgos-checkout provisions a checkout".
8. `node scripts/git-one-door-scan.mjs --root .` count not above the S6a base.

## Non-goals

`fgos-runner` and the Work loop (S7, D3); `fgos workflow` (S6b); deleting `fgos session`, `sessions.json` and renaming
`head` (plan 0947, D1); `head-request.v1.json` verb renames (0947 P5, 1045 P10, 1159 P8); the branch, ref, trunk,
dirty and path helpers of `src/runner/worktree.mjs` (S7); `fgos worktree list|gc` (0947 SV-1); any new verb, flag or
behaviour beyond `--bare` (RUL104: a port keeps behaviour, even a known defect, which becomes a backlog row).

## Decisions taken from evidence (no owner question)

| ID | Decision | Evidence |
|---|---|---|
| P1 | The checkout engine is a new crate `fgos-checkout` at `packages/execution/checkout` (Execution-owned, layer 2 where `src/runner/worktree.mjs` sits today), over `fgos-git` `GitDriver`, `fgos-process`, `fgos-config`, `fgos-durable-file`; linked by the host and by the addon. Not in `fgos-git`; not in `fgos-execution` | Git spec `:81`, `:122`, G-032/G-100/G-195 (Git spawns only `git`, provisioning is Execution, outside every Git lock); manifest tier 2 "worktree" (`docs/architecture-manifest.json:68`); S5 D1 keeps `fgos-execution` pure; principle 2 (lowest layer that needs it: Work, Workflow, Execution and the old session job all sit above) and 7 (one authority) |
| P2 | Effectful Execution code goes to a new crate `fgos-execution-engine` at `packages/execution/engine`; `fgos-execution` stays pure (unit, run request, patterns and loops as state machines, outcome, settlement math, port traits); the run supervisor's Node controller half goes into `fgos-run-supervisor`; host wiring only constructs and injects | the supervisor is the per-attempt layer below units (`packages/run-supervisor/rust/src/lib.rs:1-6`, deps process, terminal-control, session-host); tens of thousands of lines in `apps/fgos/src/wiring` would be testable only through the binary |
| P3 | The addon links `fgos-execution` and `fgos-checkout`, never `fgos-execution-engine`; a `doors` row checks the addon's `Cargo.toml` | otherwise the engine runs inside Node as a second door and drags terminal-control and session-host into the addon |
| P4 | Node callers above tier 5 reach Execution three ways: (a) long operations through the host: `fgos run --unit <file> --json` with a case-admission peer (JSON lines on a dedicated fd, protocol number, `host-version-mismatch` on skew) and `fgos internal execution <op> --protocol 1` for custody, verify, attempt sweep and cancel; (b) pure helpers the engine also needs through an addon `execution` namespace over `fgos-execution`; (c) helpers only one Node layer uses move (`git mv`) into that layer, one copy, ported by S6b/S7 | 53 importers (scan §2); the port has four operations, one mid-run (`case-admission-port.mjs:6-13`), and the workflow holds `advance` in process (`src/workflow/runner.mjs:77`), so a Rust twin over the ledger would contend with its parent and duplicate Workflow's authority (component-boundary "imports flow Workflow -> Execution Core only"); S5 D2 route pattern |
| P5 | Native `fgos run` reaches the Workflow port, when the run asks it, through the same peer protocol served by a Node peer entry of the legacy payload (`src/workflow/admission-peer.mjs`), exec'd through `components.legacyNode.entry`; retired by S6b when Workflow is Rust. A run the port is never asked for spawns no Node | standalone `fgos run` builds the port today (`src/runner/execution/run-request.mjs:356`); precedent S5 D6 (a native verb asks an upper Node layer through one declared bridge, deleted with that layer) |
| P6 | The worktree phase (01) is in wave 1, needs only S5 on main, and lands on `main` on its own so plan 0947 starts; payload-root (02) and everything else land through the integration branch as one series | D1; 0947 works on main; S5 integration model |
| P7 | Library first, cutover per door: Rust modules land with golden vectors recorded from Node (Node keeps running unchanged on the integration branch); each door's cutover phase wires the Rust path and deletes the Node path it replaces; a Node module is deleted by the phase that removes its last caller | design principle 1, L10; the integration branch never activates a release, so a twin lives only between phases |
| P8 | `payload-root.mjs` moves to `src/util/payload-root.mjs` (tier 0, beside `host-bin-path.mjs`) | its importers span tiers 0-6; manifest already ranks it tier 0 (`:55`); `OWN_PAYLOAD_ROOT` keeps `../..` |
| P9 | The run supervisor's post-receipt steps (settle-attempt, cleanup-trust, finalize-home, stray writes, worker artifacts) run in Rust behind a host route the supervisor already spawns (`attempt_step.rs`), composed from the engine in host wiring; `fgos-run-supervisor` gains no engine dependency | settle and finalize-home need settlement and credential renewal (engine); layering |
| P10 | `per-session checkout registry` row: plan 0947 phase 3 deletes it with `session.rs`; if S6a closes first, phase 22 rewrites its `retiredBy` to "plan 0947 (D1)" so no row names S6a | D1 moved that retirement to 0947 |
| P11 | `seat-binding-route` moves to Rust when a Node caller of `src/seat-binding/client.mjs` remains after phase 20 (expected: Workflow's dry bind); if none remains, the client, the route's Node protocol and the row go together as a removed behaviour | S5 D15 (the row probes the binary the Node client runs) |
| P12 | Parity tables for moved doctor rows and the cut-over verbs run on the integration branch only (restore `9772db47d^:test/rust-host/parity-cases/doctor.cases.mjs`; runner `test/rust-host/verb-parity.test.mjs`, or its last version before S5's close if deleted) and are deleted at phase 22; S4 doctor fixtures stay | S5 D14, `0c9153b98` |

Prior art reused: Git Worktree port and its provisioning record format (`git/spec.md:551`); S5 integration model,
lead rules, D2 route pattern, D7 declared twins, parity tables off main; the combined addon door
(`src/native/door.mjs`). Missing and built: Rust provisioning, a Rust unit runner, the admission peer protocol.

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 0 | [Facts, census, port map](phase-00-facts.md) | - | plans/261118-1341-s6a-execution-tier-rust/reports/** | 1 | draft |
| 1 | [One worktree door in Rust](phase-01-worktree-door.md) | - | packages/execution/checkout/**, Cargo.toml, apps/fgos/src/wiring/worktree.rs, apps/fgos/src/wiring/mod.rs, apps/fgos/src/main.rs, apps/fgos/src/routing.rs, apps/fgos/src/cli_projector.rs, apps/fgos/Cargo.toml, apps/fgos/tests/cli_tests.rs, packages/host-runtime/rust/src/catalog.rs, src/cli/command-registry.mjs, bin/fgos.mjs, src/verbs/worktree/**, test/verbs/worktree-create.test.mjs, test/verbs/worktree-remove.test.mjs, test/rust-host/command-routes.test.mjs, docs/architecture-manifest.json, docs/platform/git/spec.md, CHANGELOG.md | 1 | draft |
| 2 | [payload-root to the shared leaf layer](phase-02-payload-root.md) | 0 | src/util/payload-root.mjs, src/run-supervisor/payload-root.mjs, src/native/door.mjs, src/seat-binding/client.mjs, src/event-store/consumers.mjs, src/workflow/loader.mjs, src/run-supervisor/direct-launch.mjs, src/run-supervisor/attempt-step.mjs, src/runner/execution/unit-run-record.mjs, docs/architecture-manifest.json | 3 | draft |
| 3 | [Engine crate skeleton](phase-03-engine-skeleton.md) | 0, 1 | packages/execution/engine/Cargo.toml, packages/execution/engine/src/lib.rs, Cargo.toml | 2 | draft |
| 4 | [Work checkout wrappers over the addon](phase-04-checkout-wrappers.md) | 1 | packages/execution/checkout/**, packages/git/node-addon/**, src/native/door.mjs, src/runner/worktree.mjs, test/runner/worktree.test.mjs, test/runner/worktree-callsite-wrapper.test.mjs | 2 | draft |
| 5 | [Run supervisor controller half in Rust](phase-05-run-supervisor-controller.md) | 0 | packages/run-supervisor/rust/src/controller/**, packages/run-supervisor/rust/src/lib.rs, packages/run-supervisor/rust/tests/controller_*.rs, packages/run-supervisor/contracts/controller/** | 2 | draft |
| 6 | [Execution pure core](phase-06-execution-pure-core.md) | 0 | packages/execution/rust/**, packages/execution/contracts/core/** | 2 | draft |
| 7 | [Confinement policy and request](phase-07-confinement-policy.md) | 3 | packages/execution/engine/src/confinement/policy/**, packages/execution/engine/tests/confinement_policy.rs, packages/execution/contracts/confinement-policy.v1.json | 3 | draft |
| 8 | [Confinement driver, cleanup, probes](phase-08-confinement-driver.md) | 3 | packages/execution/engine/src/confinement/driver/**, packages/execution/engine/tests/confinement_driver.rs, packages/execution/contracts/confinement-driver.v1.json | 3 | draft |
| 9 | [Provider accounts and capacity](phase-09-provider-accounts.md) | 3 | packages/execution/engine/src/accounts/**, packages/execution/engine/tests/accounts.rs, packages/execution/contracts/accounts.v1.json | 3 | draft |
| 10 | [Credential renewal](phase-10-credential-renewal.md) | 3, 4 | packages/execution/engine/src/credentials/**, packages/execution/engine/tests/credentials.rs, packages/execution/contracts/credentials.v1.json | 3 | draft |
| 11 | [Transport and worker sessions](phase-11-transport.md) | 3, 5 | packages/execution/engine/src/transport/**, packages/execution/engine/tests/transport.rs, packages/execution/contracts/transport.v1.json | 3 | draft |
| 12 | [Run result and evidence](phase-12-run-result.md) | 3 | packages/execution/engine/src/run_result/**, packages/execution/engine/tests/run_result.rs, packages/execution/contracts/run-result-write.v1.json | 3 | draft |
| 13 | [Assignment model](phase-13-assignment-model.md) | 6, 7, 9 | packages/execution/engine/src/assignment/**, packages/execution/engine/tests/assignment.rs, packages/execution/contracts/assignment.v1.json | 4 | draft |
| 14 | [Settlement and post-receipt steps](phase-14-settlement-steps.md) | 5, 10, 12 | packages/execution/engine/src/settlement/**, packages/execution/engine/src/steps/**, packages/execution/engine/tests/settlement.rs, packages/execution/contracts/settlement.v1.json | 4 | draft |
| 15 | [Doctor rows: confinement](phase-15-doctor-confinement.md) | 7, 8 | apps/fgos/src/wiring/doctor/confinement.rs, apps/fgos/src/wiring/doctor/mod.rs, packages/distribution/contracts/doctor-registry.v1.json, src/setup/registrations.mjs, test/setup/**, test/rust-host/verb-parity.test.mjs, test/rust-host/parity-cases/**, docs/architecture-manifest.json | 4 | draft |
| 16 | [Assignment runner](phase-16-assignment-runner.md) | 8, 10, 11, 13, 14 | packages/execution/engine/src/assignment_runner/**, packages/execution/engine/tests/assignment_runner.rs, packages/execution/contracts/assignment-runner.v1.json | 5 | draft |
| 17 | [Doctor rows: executor, accounts, run supervisor, terminal](phase-17-doctor-execution.md) | 5, 9, 10, 11, 13, 15 | apps/fgos/src/wiring/doctor/**, packages/distribution/contracts/doctor-registry.v1.json, src/setup/**, src/runner/agent-definitions.mjs, test/setup/**, test/rust-host/parity-cases/**, docs/architecture-manifest.json | 5 | draft |
| 18 | [Unit run core](phase-18-unit-run-core.md) | 4, 6, 16 | packages/execution/engine/src/unit_run/**, packages/execution/engine/tests/unit_run.rs, packages/execution/contracts/unit-run.v1.json, packages/execution/contracts/admission-peer.v1.json | 6 | draft |
| 19 | [`fgos run` native, internal execution routes, admission peer](phase-19-run-native.md) | 18 | apps/fgos/src/wiring/run.rs, apps/fgos/src/wiring/execution_routes.rs, apps/fgos/src/wiring/attempt_step.rs, apps/fgos/src/wiring/mod.rs, apps/fgos/src/main.rs, apps/fgos/src/routing.rs, apps/fgos/src/cli_projector.rs, apps/fgos/Cargo.toml, apps/fgos/tests/cli_tests.rs, packages/host-runtime/rust/src/catalog.rs, packages/run-supervisor/rust/src/attempt_step.rs, packages/execution/contracts/execution-routes.v1.json, src/cli/command-registry.mjs, bin/fgos.mjs, src/workflow/admission-peer.mjs, test/cli/run-verb.test.mjs, test/rust-host/**, docs/architecture-manifest.json | 7 | draft |
| 20 | [Node consumer seam; Execution Core Node deleted](phase-20-node-seam.md) | 17, 19 | src/workflow/**, src/runner/execution/**, src/run-supervisor/**, src/runner/dispatch/**, src/runner/loop.mjs, src/runner/work-dispatch.mjs, src/verbs/state/read.mjs, src/session-rotation/rotate.mjs, src/portfolio/open-questions.mjs, src/report/capability-plan-lint.mjs, src/cli/verb-exit.mjs, src/seat-binding/client.mjs, bin/fgos-runner.mjs, scripts/run-tests.mjs, scripts/run-rust-dev-host.mjs, scripts/backfill-unit-summaries.mjs, scripts/lib/test-file-watchdog.mjs, scripts/lib/mailbox-live-confined.mjs, packages/git/node-addon/**, src/native/door.mjs, test/workflow/**, test/runner/execution/**, test/run-supervisor/**, test/runner/loop*.test.mjs, docs/architecture-manifest.json | 8 | draft |
| 21 | [Dispatch subs native; Dispatch Node deleted](phase-21-dispatch-subs.md) | 20 | apps/fgos/src/wiring/dispatch_subs.rs, apps/fgos/src/wiring/mod.rs, apps/fgos/src/main.rs, apps/fgos/src/routing.rs, apps/fgos/src/cli_projector.rs, apps/fgos/tests/cli_tests.rs, packages/host-runtime/rust/src/catalog.rs, src/cli/command-registry.mjs, bin/fgos.mjs, src/verbs/dispatch/**, src/runner/dispatch/**, src/runner/dispatch.mjs, test/cli/dispatch-*.test.mjs, test/runner/dispatch*.test.mjs, test/runner/dispatch/**, docs/architecture-manifest.json | 9 | draft |
| 22 | [Close: doors, docs, integration gate](phase-22-close.md) | 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21 | docs/architecture-manifest.json, test/architecture.test.mjs, test/rust-host/verb-parity.test.mjs, test/rust-host/parity-cases/**, docs/platform/runner/**, docs/platform/run-supervisor/spec.md, docs/platform/agent-confinement/spec.md, docs/platform/component-boundary.md, docs/platform/git/spec.md, docs/reading-map.md, docs/backlog.md, CHANGELOG.md, plans/261118-1341-s6a-execution-tier-rust/reports/** | 10 | draft |

Effort (lead-days): 0: 1.5; 1: 2.5; 2: 0.5; 3: 0.5; 4: 2; 5: 2.5; 6: 3; 7: 2.5; 8: 2.5; 9: 2; 10: 2; 11: 2.5;
12: 1.5; 13: 2.5; 14: 2; 15: 2; 16: 2.5; 17: 2.5; 18: 2.5; 19: 2.5; 20: 2.5; 21: 2; 22: 2.5. Total about 49.
Critical path 0 -> 3 -> 8 -> 16 -> 18 -> 19 -> 20 -> 21 -> 22: 1.5 + 0.5 + 2.5 + 2.5 + 2.5 + 2.5 + 2.5 + 2 + 2.5 =
19.5 lead-days. Phase 6 at 3d is above the 2d size rule: split it by module in phase 00 if the port map shows two
disjoint halves (both halves edit `packages/execution/rust/src/lib.rs`, so a split serializes them).

External gates: the plan starts when S5 phases 11 and 12 are on `main` (`blockedBy` S5). Plan 1045 phase 6 is a
phase-level gate, not a plan-level `blockedBy` (that would hold phase 1 and so plan 0947): phase 5 and every phase that
ports the launchers (5, 11, 16, 19) start only after 1045 P6 is on `main` (D4); the plan lead checks the 1045 row on
the board before starting them.

**Waves.** 1: 0, 1. 2: 3, 4, 5, 6. 3: 2, 7, 8, 9, 10, 11, 12. 4: 13, 14, 15. 5: 16, 17. 6: 18. 7: 19. 8: 20.
9: 21. 10: 22. Within a wave: 8 lands after 7; 10 after 9 (shared types are fixed by the skeleton in 3).

**Contract check (by reading; script run recorded in the Validation log).** Every phase sits in a later wave than
each dependency. Same-wave footprints are disjoint: wave 1 (plan reports vs checkout crate and host files); wave 2
(`packages/execution/engine/` + root `Cargo.toml` vs `packages/execution/checkout/`, `packages/git/node-addon/`,
`src/native/door.mjs`, `src/runner/worktree.mjs` vs `packages/run-supervisor/` vs `packages/execution/rust/`); wave 3 (Node payload-root files
and manifest vs one engine module directory each); wave 4 (`engine/src/assignment/` vs `engine/src/{settlement,steps}/`
vs doctor wiring and registry); wave 5 (`engine/src/assignment_runner/` vs doctor wiring); waves 6-10 one phase each.
`docs/architecture-manifest.json` has one writer per wave (1, 15, 17, 19, 20, 21, 22 sit in waves 1, 4, 5, 7, 8, 9, 10;
2 in wave 3). Phase 0's footprint path `plans/.../reports/**` is inside the plan's own dir.

### Parallel map

```text
wave 1:  [0 facts]  [1 worktree door -> lands on main, unblocks plan 0947]
wave 2:  [3 engine skeleton]  [4 Work checkout wrappers]  [5 supervisor controller (after 1045 P6)]  [6 pure core]
wave 3:  [2 payload-root]  [7 conf policy] [8 conf driver] [9 accounts] [10 credentials] [11 transport] [12 run result]
wave 4:  [13 assignment model]  [14 settlement + steps]  [15 doctor: confinement (parity runner restored)]
wave 5:  [16 assignment runner]  [17 doctor: executor, accounts, supervisor, terminal]
wave 6:  [18 unit run core]
wave 7:  [19 fgos run native + internal routes + admission peer]
wave 8:  [20 Node seam; src/runner/execution and src/run-supervisor deleted]
wave 9:  [21 dispatch subs native; src/runner/dispatch, src/verbs/dispatch deleted]
wave 10: [22 close + integration gate]
```

### Hot and generated files

Generated, regenerated on every rebase, never hand-merged, not counted as footprint overlap: `Cargo.lock`,
`packages/host-runtime/contracts/command-routes.json`, `command-manifest.json`, `packages/git/contracts/mutation-census.v1.json`,
`test/suite-baseline.json`, skill renders. Hand-edited hot files, one writer per wave (from the table): root
`Cargo.toml` (1, 3), `apps/fgos/src/main.rs`, `routing.rs`, `cli_projector.rs`, `apps/fgos/tests/cli_tests.rs`,
`src/cli/command-registry.mjs`, `bin/fgos.mjs` (1, 19, 21), `packages/git/node-addon/**` and `src/native/door.mjs`
(4, 20; 2 edits only the door's import line in wave 3), `doctor-registry.v1.json` and `src/setup/registrations.mjs`
(15, 17), `packages/execution/engine/src/lib.rs` (3 only: the skeleton declares every module), `CHANGELOG.md` (1, 22).

## Data flow

- `fgos worktree create <path> [--branch|--detach] [--base] [--bare] [--json]`: host argv -> invocation root and store
  admission (F0 doors) -> `fgos-checkout::create` -> `GitDriver::create_worktree|create_detached_worktree` (worktree-admin
  lock, `.fgos` strip) -> lock released -> unless `--bare`: dependency install, `worktreeSetup.commands` with
  `FGOS_REPO_ROOT`, skill roots, provisioning record under the state root (same format as Node's) -> `fgos.v1` envelope.
  `remove`: set aside recorded bytes -> `GitDriver::remove_worktree` (delivery evidence digest) -> put back on refusal,
  delete record on success.
- Work wrapper: `createWorktree(repoRoot, id, opts)` -> addon `checkout.create` (synchronous, as today) -> same crate.
- `fgos run`: host argv -> `fgos-execution` unit build and validation -> `fgos-execution` bind (S5) -> engine
  `unit_run` (pattern loop) -> `assignment_runner` per seat (confinement, accounts lease, transport, supervisor
  handover via `fgos-run-supervisor` controller) -> `settlement` -> commit of declared writes (`fgos-git` ScopedCommit) ->
  provenance under `.fgos/assignments/<unitRunId>/` -> envelope. Case admission asks go to the `CaseAdmission` port:
  the peer adapter writes JSON lines on fd 3 to the Workflow parent, or to the Node peer the host exec'd (P5).
- Workflow -> Execution: `src/workflow/runner.mjs` spawns `fgos run --unit <file> --json --admission-fd 3` async and
  serves `resolveBinding|admit|recheckEffect|settle` from its existing port; on child exit without `settle` it settles
  with `releasedUnitRunSettle`. Custody/verify/sweep/cancel: `fgos internal execution <op> --protocol 1`.
- Doctor: host doctor engine -> `wiring/doctor/{confinement,execution,run_supervisor,terminal}.rs` -> engine / supervisor
  / checkout judgments -> row results.

## Test matrix

| Layer | Owning proof | Phase |
|---|---|---|
| Checkout create/provision/bare/remove/set-aside/resync/leftovers/orphan reclaim, no Git lock held during setup commands, Node-era provisioning record read | `packages/execution/checkout/tests/*.rs` on real temp repos | 1 |
| Worktree verbs end to end (argv kept, `--bare`, session-style checkout) | `apps/fgos/tests/cli_tests.rs` (one case per verb shape) | 1 |
| Work wrappers keep their contract | one wiring test in `test/runner/worktree.test.mjs` | 4 |
| Supervisor controller (lease, cwd lock, cancel registry, runtime dir, trust store, launch with `lanes`) | `packages/run-supervisor/rust/tests/controller_*.rs` | 5 |
| Unit, run request, patterns and loops, outcome, seat checks, case paths | golden vectors in `packages/execution/contracts/`, run by `fgos-execution` tests | 6 |
| Confinement, accounts, credentials, transport, run result, assignment, settlement, steps, assignment runner, unit run | one golden or integration test file per engine module | 7-18 |
| `fgos run`, internal routes, admission peer protocol (incl. child dies between admit and settle) | `cli_tests.rs` (`run`), `engine/tests/unit_run.rs` (peer protocol), one Node wiring test in `test/workflow/` | 18, 19, 20 |
| Dispatch subs | `cli_tests.rs` one case per sub | 21 |
| Moved doctor rows | Rust row tests per group; registry exact-set test; parity tables (integration only) | 15, 17 |
| Only the doors do the job | `test/architecture.test.mjs` `checkDoors` with seeded cases per new or changed row | 22 |
| Census | `test/setup/git-mutation-census.test.mjs` | every code phase |
| Whole system | `cargo test --workspace`, one full `npm test` on the integration head; again on main | 22 |

Every Node test of a retired path is deleted in the phase that deletes the path; each phase report has a table
"retired test -> owner now" (design principle 8). No behaviour gets a second proof.

## Owner questions

None open. D1-D5 answered 2026-11-18. P1-P12 are decided from evidence.

- **P5 answered 2026-11-18 by the owner (via head:secretary-miu): option A.** A native standalone `fgos run` that asks
  for the Workflow port still execs the Node peer entry (`src/workflow/admission-peer.mjs`, through
  `components.legacyNode.entry`) for Workflow admission until S6b. Workflow admission does **not** move into S6a; S6b
  retires the peer when Workflow is Rust. A run the port is never asked for spawns no Node.

## Risks and rollback

| Risk | L x I | Mitigation |
|---|---|---|
| Port drift: a Rust module behaves differently from the Node it replaces (34k lines) | H x H | golden vectors recorded from Node on the integration base before each port (phase 00 lists the recorder per module); parity tables per cut-over verb and doctor row; RUL104 keeps defects |
| Provisioning runs under a Git lock in Rust | M x H | phase 1 proof "no Git lock held while setup commands run" |
| Checkouts provisioned by Node are removed by Rust and refuse on ignored bytes | M x H | phase 1 reads the existing record format (fixture written by the Node code before deletion) |
| Admission reservation leaked when `fgos run` dies between `admit` and `settle` | M x H | parent settles with `releasedUnitRunSettle` on exit without settle; proof in phase 20 |
| Peer channel corruption or deadlock | M x M | dedicated fd, never stdout; parent never uses `spawnSync`; protocol number |
| Addon links the engine | L x H | `doors` row on `packages/git/node-addon/Cargo.toml` (22); review |
| Plan 1045 P6/P10 and 0947 edit the same supervisor and dispatch files | H x M | collision table; S6a ports what landed; later lander rebases |
| Phase sizes optimistic for ports of 2-3k Node lines | H x M | phase 00 splits any module group over 2 500 Node lines; plan lead re-sizes after wave 3 |
| Node event loop blocked by a synchronous addon dependency install | M x M | same contract as today (Node functions are synchronous, scan §3); phase 4 measures |
| `--bare` read as Git's "bare repository" | M x L | help text says "no provisioning"; owner chose the name (D2) |

Collision table:

| Shared file or area | This plan | Other plan or lane | Mitigation |
|---|---|---|---|
| `packages/run-supervisor/**`, `src/run-supervisor/direct-launch.mjs`, `src/runner/dispatch/assignment-runner.mjs`, `envelope.v3.json` | 5, 11, 16, 19, 20 | 1045 P6 (lane pool), P10 (head-request) | D4: 1045 P6 lands first; S6a ports `lanes`; P10's `head_request.rs` untouched by S6a |
| `apps/fgos/src/{main,routing}.rs`, `catalog.rs`, `command-registry.mjs`, `bin/fgos.mjs`, generated routes | 1, 19, 21 | 0947 P3, P4, P5 | 0947 starts after 1; later lander rebases and regenerates |
| `src/runner/dispatch/**`, `src/runner/merge.mjs`, `bin/fgos.mjs` | 13-21 (port, delete) | 0947 P4 (identity stops reading `sessions.json`) | if 0947 P4 lands first, S6a ports its change; if S6a deletes first, 0947 P4 drops those paths from its footprint |
| `src/setup/**`, `doctor-registry.v1.json` | 15, 17 | 0947 P1 (session rows) | additive; rebase |
| `docs/architecture-manifest.json`, `test/architecture.test.mjs` | 1, 2, 15, 17, 19-22 | every lane adding a door row | rebase, rerun the architecture test |
| `CHANGELOG.md`, `docs/backlog.md`, `docs/reading-map.md` | 1, 22 | every lane | big lead serializes |

Integration and landing: phase 1 lands on `main` directly after OPC MERGE (build, stage, activate, board line).
Every other phase lands on `s6a-execution/integration` cut from `main` after phase 1; phase 22 runs the full gate
there and the big lead lands it on main as one series. Landing preconditions: no run in flight and no open mutating
assignment (the run path changes process), activate, `fgos doctor` through the installed shim, board line, owner-machine
guide linked on the board.

Rollback: phase 1 is one revertible series on main (revert restores the Node verb; 0947 must not have deleted
`session.rs` yet, else revert 0947 P3 first). The integration series reverts as a whole before activation; after
activation, revert the series, rebuild and reactivate with nothing in flight. Inside the integration branch, revert in
reverse wave order (22, 21, 20, 19, 18, ...); library phases (3, 5-14, 16, 18) revert alone because nothing calls them
before their cutover phase.

## Sibling edits the program needs (for the secretary; this plan edits no other file)

- Program plan `plans/261114-2051-rust-verb-migration-program/plan.md` row S6a: drop the `fgos-runner` entry from
  Goal; add the checkout-lifecycle part of `src/runner/worktree.mjs` to Main files (D3, D5). Row S7: Goal gains the
  `fgos-runner` entry (`bin/fgos-runner.mjs`).
- Plan `plans/261118-0947-session-verb-for-agent-sessions/plan.md`: `blockedBy` gains this plan's phase 1 (one
  worktree door in Rust, `fgos worktree create --bare` and `remove` native); its phase 4 footprint gains
  `packages/mailbox/rust/store/src/hook/resolve.rs` (D1; `Source::Registry` at `:43`).
- Plan 1045: no change (P6 lands first, P10 relies on stable `worktree create` argv).

## Unresolved questions

1. plan-contract `blockedBy` holds plan names only; "0947 blocked by S6a phase 1" cannot be expressed as data. The
   secretary records it in 0947's prose and board row until the contract gains phase granularity.
2. Whether phase 6 splits in two (decided in phase 00 from the port map).
3. Whether `seat-binding-route` moves or retires (P11, decided in phase 20 from the remaining callers).

## Validation log

- 2026-11-18 planner: plan written against `0981437d2`; status `draft` until S5 phases 11 and 12 land and phase 00 re-reads the census.
- 2026-11-18 planner: `scripts/plan-contract-check.mjs --plan` (main checkout's script with its staged addon env, plan path absolute) prints `ok`.
- 2026-11-18 planner: design forks P1-P4 checked with kongming counsel (one reply; adopted, with P5 added from `run-request.mjs:356`).
- 2026-11-18 lead:S6A-LAND: owner answered P5 = A (Owner questions); sibling edits applied to the program plan `261114-2051` rows S6a/S7 and to plan `261118-0947` (`blockedBy`, phase 4 footprint). Status stays `draft` until S5 phases 11 and 12 land.
