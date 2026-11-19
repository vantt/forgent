---
contract: plan-v1
title: "S6a, Execution (tier 5) in Rust: run, dispatch subs, run supervisor Node side"
status: ready
priority: P1
blockedBy:
  - 261115-2328-execution-read-door
  - 261118-1455-s6a-worktree-door
footprint:
  - plans/261118-1341-s6a-execution-tier-rust/**
  - Cargo.toml
  - Cargo.lock
  - packages/execution/**
  - packages/run-supervisor/**
  - packages/holder-lock/rust/src/port.rs
  - packages/holder-lock/rust/tests/handle_file.rs
  - packages/git/node-addon/**
  - packages/host-runtime/**
  - packages/distribution/contracts/doctor-registry.v1.json
  - packages/git/contracts/mutation-census.v1.json
  - apps/fgos/**
  - src/runner/execution/**
  - src/runner/dispatch/**
  - src/runner/dispatch.mjs
  - src/runner/agent-definitions.mjs
  - src/runner/agent-listing.mjs
  - src/runner/capability-config.mjs
  - src/runner/operation-capability.mjs
  - src/runner/operation-choice.mjs
  - src/runner/fanout-batch.mjs
  - src/runner/work-compat.mjs
  - src/runner/loop.mjs
  - src/runner/work-dispatch.mjs
  - src/run-supervisor/**
  - src/verbs/dispatch/**
  - src/verbs/state/read.mjs
  - src/workflow/**
  - src/setup/**
  - src/native/door.mjs
  - src/native/stop-processes-inside.mjs
  - src/native/execution-door.mjs
  - src/util/payload-root.mjs
  - src/seat-binding/client.mjs
  - src/session-host/head-start.mjs
  - src/session-host/head-request.mjs
  - src/session-host/head-stop.mjs
  - src/runner/agent-roster.mjs
  - src/report/authoritative-match.mjs
  - scripts/git/e3-bench.mjs
  - scripts/check-decision-citation-drift.baseline.json
  - src/event-store/consumers.mjs
  - src/session-rotation/rotate.mjs
  - src/report/capability-plan-lint.mjs
  - src/cli/command-registry.mjs
  - src/cli/verb-exit.mjs
  - bin/fgos.mjs
  - bin/fgos-runner.mjs
  - scripts/run-tests.mjs
  - scripts/run-rust-dev-host.mjs
  - scripts/backfill-unit-summaries.mjs
  - scripts/record-mailbox-hook-fixtures.mjs
  - scripts/lib/test-file-watchdog.mjs
  - scripts/lib/mailbox-live-confined.mjs
  - test/**
  - docs/architecture-manifest.json
  - docs/platform/runner/**
  - docs/platform/run-supervisor/spec.md
  - docs/platform/agent-confinement/spec.md
  - docs/platform/component-boundary.md
  - docs/reading-map.md
  - docs/backlog.md
  - CHANGELOG.md
base: b5b23753415a5cfd04822ab47b55d11b12e25a2e
source:
  - docs/discussions/rust-verb-migration-s6a/DISCUSSION.md
  - docs/discussions/rust-verb-migration-s6a/QUESTIONS.md
  - plans/261114-2051-rust-verb-migration-program/plan.md
  - plans/reports/planner-261118-1347-s6a-facts-and-design.md
  - plans/reports/validator-261118-1442-s6a-plan-validate.md
  - plans/reports/red-team-261118-1442-s6a-plan-red-team.md
created: 2026-11-18
---

# S6a, Execution (tier 5) in Rust

Source (binding, D1-D5 not reopened): [DISCUSSION.md](../../docs/discussions/rust-verb-migration-s6a/DISCUSSION.md)
Hand-off block; owner answers Q1-Q4 in QUESTIONS.md; owner P5 = A (below); program row S6a. Planner scan:
[planner-261118-1347-s6a-facts-and-design.md](../reports/planner-261118-1347-s6a-facts-and-design.md) (read on
`0981437d2`; its seam regex is superseded by phase 00, V1). Reviews applied 2026-11-18:
[validation](../reports/validator-261118-1442-s6a-plan-validate.md),
[red team](../reports/red-team-261118-1442-s6a-plan-red-team.md). Rules for every phase lead:
[phase-lead-rules.md](phase-lead-rules.md). The one worktree door (old phases 01 and 04) is its own plan,
[261118-1455-s6a-worktree-door](../261118-1455-s6a-worktree-door/plan.md), landed on `main` before this plan starts.

## Outcome

Tier 5 (Execution) of the fgOS CLI runs in Rust and its Node code is deleted: `fgos run`, the dispatch subs
`probe-account`, `probe-session`, `reconcile`, `inspect`, `show-run`, `watch`, `recover`, and the Node side of the run
supervisor. Every `doors` row whose `retiredBy` names S6a closes. The 32 `bridge:S6a` doctor rows (31 plus
`seat-binding-route`, owner `bridge:S6a` since S5 phase 11; count on `f031ab0c8`) run in Rust. Workflow (S6b) and Work (S7) stay Node and reach Execution only through one declared
Node seam (`src/native/execution-door.mjs`: host routes over stdin/stdout and the addon `execution` namespace) that
S6b and S7 retire.

## Acceptance criteria

Copied from the hand-off block, each with its check:

1. `command-routes` show `run` and `dispatch` (all subs) native; no `legacy-cli` row for them (`worktree`,
   `resync-worktree`: worktree-door plan). Check (V21):
   `node -e 'const r=require("./packages/host-runtime/contracts/command-routes.json");for(const k of ["run","worktree","resync-worktree"])if(r[k].route_kind!=="native")process.exit(1);const d=r.dispatch;if(d.route_kind!=="native"&&["show-run","inspect","watch","recover","reconcile","probe-account","probe-session"].some(s=>!(d.native_subcommands||[]).includes(s)))process.exit(1)'`;
   `test/rust-host/command-routes.test.mjs`.
2. `src/runner/execution`, `src/runner/dispatch`, `src/run-supervisor`, `src/verbs/dispatch`, `src/runner/dispatch.mjs`
   gone. Check: `ls` of each path fails; phase 21 step 3 scans empty.
3. (Worktree door, session-style checkout: acceptance 3 of the worktree-door plan.)
4. Doors rows naming S6a in `retiredBy` closed; doctor-registry has no `bridge:S6a` owner. Check (V21):
   `node -e 'const m=require("./docs/architecture-manifest.json");if(m.doors.some(d=>/S6a/.test(d.retiredBy||"")))process.exit(1)'`;
   `rg -n '"bridge:S6a"' packages/distribution/contracts/doctor-registry.v1.json` finds nothing.
5. `npm test` and `cargo test --workspace` green (on the integration head, then on main after landing).

Added by the planner (measurable forms of the hand-off constraints):

6. `fgos run` keeps its argv and envelope; no new flag (P14). Check: phase 19 `cli_tests.rs` cases; parity table.
7. `test/architecture.test.mjs` green with the new and changed `doors` rows (phase 22 list), including "the addon
   never links the run engine" and "case admission crosses the process boundary only through the peer protocol".
8. `node scripts/git-one-door-scan.mjs --root .` count not above the S6a base.
9. Canary and reverse-read tables in `reports/close.md` (phase 22): the integration head served a read-only run, a
   writing run, a workflow case step, a Work step and a credential renewal on a real machine, and the base release read
   what it wrote.

## Non-goals

The worktree door (own plan); `fgos-runner` and the Work loop (S7, D3); `fgos workflow` (S6b); deleting
the old `fgos session` lifecycle, `sessions.json` and renaming `head` to `session` (plan 0947, D1; done `37b345016`); `head-request.v1.json` verb renames (0947 P5,
1045 P10, 1159 P8); `fgos worktree list|gc` (0947 SV-1); any new verb, flag or behaviour (RUL104: a port keeps
behaviour, even a known defect, which becomes a backlog row).

## Decisions taken from evidence (no owner question)

| ID | Decision | Evidence |
|---|---|---|
| P1 | The checkout engine is the crate `fgos-checkout` at `packages/execution/checkout`, built by the worktree-door plan | Git spec `:81`, `:122`; manifest tier 2 "worktree" (`docs/architecture-manifest.json:68`); S5 D1; principles 2, 7 |
| P2 | Effectful Execution code goes to a new crate `fgos-execution-engine` at `packages/execution/engine`; `fgos-execution` stays pure; the run supervisor's Node controller half goes into `fgos-run-supervisor`; host wiring only constructs and injects | `packages/run-supervisor/rust/src/lib.rs:1-6`; testability outside the binary |
| P3 | The addon links `fgos-execution`, `fgos-checkout` and `fgos-run-supervisor` with only its `lease` feature (P15), never `fgos-execution-engine`; a `doors` row checks the addon's `Cargo.toml` | otherwise the engine runs inside Node as a second door and drags terminal-control and session-host into the addon |
| P4 | Node callers above tier 5 reach Execution four ways, all through `src/native/execution-door.mjs` (P14) except (c): (a) long or effectful operations through host routes `fgos internal execution <op> --protocol 1` (request on stdin, framed lines on stdout; ops `run-unit`, `launch-session`, `custody`, `verify`, `sweep-attempts`, `cancel`); (b) pure helpers and effectful reads through the addon `execution` namespace; (c) helpers only one Node layer uses move (`git mv`) into that layer, one copy; (d) Work callers (S7) use (a)/(b) at the call site only | 60 non-test importer files, 197 hits (phase 00 scan, V1); the port has mid-run operations (`case-admission-port.mjs:6-13`) and Workflow holds `advance` in process (`src/workflow/runner.mjs:77`); component-boundary "imports flow Workflow -> Execution Core only"; S5 D2 route pattern (`src/seat-binding/client.mjs:3`) |
| P5 | Owner answer A: native standalone `fgos run` reaches Workflow admission through a Node peer until S6b. The peer is the payload module `src/workflow/admission-peer.mjs`, started by the doctor bridge's launcher generalised to a named payload module (`apps/fgos/src/wiring/doctor/bridge.rs:186-199` -> `legacy_exec`), over the peer's stdin/stdout (P13). Every standalone `fgos run --writes` starts it (`resolveBinding` on every writing run, `unit-run-start.mjs:199-205`), as does `--case` and a confined worker's writing run; a read-only run without `--case` starts no Node | owner 2026-11-18; F4, F10; precedent S5 D6 |
| P6 | The worktree door is its own plan, landed on `main` as one series (Rust verbs plus Work wrappers, no window with two provisioning doors); this plan is `blockedBy` it and plan 0947 is `blockedBy` it instead of this plan | V8 (0947 waited about 49 lead-days on the whole plan; `blockedBy` holds plan names only), F1, V9; prior art S2 phase 06 (callers converted in the same change) |
| P7 | Library first, cut-over per door: Rust modules land with golden vectors recorded from Node by committed recorders (P21); each door's cut-over phase wires the Rust path and deletes the Node path it replaces; a Node module is deleted by the phase that removes its last caller | design principle 1, L10; the integration branch never activates a release, so a twin lives only between phases |
| P8 | `payload-root.mjs` moves to `src/util/payload-root.mjs` (tier 0) | importers span tiers 0-6; manifest `:55`; `OWN_PAYLOAD_ROOT` keeps `../..` |
| P9 | The run supervisor's post-receipt steps run in Rust behind a host route the supervisor already spawns (`attempt_step.rs`), composed from the engine in host wiring; `fgos-run-supervisor` gains no engine dependency | settle and finalize-home need settlement and credential renewal (engine); layering |
| P10 | `per-session checkout registry` row: plan 0947 phase 3 deletes it with `session.rs`; if S6a closes first, phase 22 rewrites its `retiredBy` to "plan 0947 (D1)" | D1 |
| P11 | `seat-binding-route` moves to Rust, decided in phase 17 (plan lead, phase 0, 2026-11-19): `src/seat-binding/client.mjs` keeps Node callers after phase 20, because the callers above tier 5 that bind through `bind.mjs` today (`src/runner/loop.mjs:83`, S7; `src/setup/seat-binding-checks.mjs:3` and `blind-steps-proven-pools.mjs:13`, rows `bridge:S6b`; `src/session-host/head-start.mjs:121`) switch to the client or the door in phase 20, and `bind.mjs` itself goes in phase 21 with its dispatch importers. Phase 17 judges the row in Rust by probing the route; phase 20 consumes that: it keeps the client and deletes nothing of the route | S5 D15; [facts-part-b](reports/facts-part-b.md) §4 (live callers of the client) |
| P12 | Parity tables for moved doctor rows and the cut-over verbs run on the integration branch only (restore `9772db47d^:test/rust-host/parity-cases/doctor.cases.mjs`; runner `test/rust-host/verb-parity.test.mjs`) and are deleted at phase 22; S4 doctor fixtures stay | S5 D14, `0c9153b98` |
| P13 | Host and Node talk only over a child's stdin/stdout with prefixed JSON lines (the doctor bridge's framing: only prefixed lines count). Both directions use it: the host starts the P5 peer (host is parent), and Workflow/Work start `fgos internal execution run-unit` (Node is parent) and answer the peer over the child's stdout/stdin. One Rust adapter over a `(reader, writer)` pair, one Node server; no inherited fd above 2, no new `bin/fgos.mjs` arm. The Node-parent direction does not reuse the doctor bridge itself (that is host -> Node); it reuses the existing Node -> host route pattern (request on stdin) made async | F3: `packages/process/rust/src/control.rs:288-312` and `platform/windows.rs:218-219` refuse descriptor slots on Windows, pipes work everywhere; F10: `bridge.rs:1-8,31,186-199`, `legacy_exec.rs:260` already launch a payload module over stdin/stdout; L10 |
| P14 | Execution's one Node seam is a new tier-0 file `src/native/execution-door.mjs`: `runUnitInHost` (same options object and result as `runUnit`; an error result carries `errorClass` and an error type tag, e.g. `CaseAdmissionRefusedError`, `RunnerConfigError`, so the door rethrows an instance of that class and `instanceof` branches in callers keep working: `src/workflow/runner.mjs:277`, `src/runner/work-dispatch.mjs:297`; schema in phase 18, rethrow in 19, callers in 20), `launchSessionInHost`, `executionOp`, `serveAdmissionPeer`, and re-exports of the addon `execution` reads with their Node names. Workflow and the three Work `runUnit` call sites (`operation-choice.mjs:2327`, `work-dispatch.mjs:129`, `fanout-batch.mjs:98`) and `head-start.mjs:135` change only the call and its import. `fgos run` argv is not widened for Work-only options. S6b deletes the Workflow uses and the peer entry; S7 deletes the Work uses and the file | V2: Work passes `runnerConfig`, `declared`, `pinInputs`, `raiseAuthorized`, `session`, `onUnitRunCreated`; Workflow passes `acceptedReports`, `overrides`, `accountPin`, `caseRef`, `onCaseAdmitted` (`runner.mjs:158-177`), none of which argv carries; the addon cannot run a unit (P3, long operation); owner rule "foundation first, Work later" |
| P15 | `custodyHeld`, `unitRunFacts` and `judgeUnitRun` reach Workflow through the addon `execution` namespace, not a host spawn: they are reads of `unit.json`, holder-lock holders on `dispatch-cwd` and the run control ledger (`custody-door.mjs:41`, `unit-run-record.mjs:31-46`, `run-lock.mjs:309-318`). Judgements are pure in `fgos-execution` (6c); the ledger read is `fgos-run-supervisor`'s `lease` feature (phase 05 makes terminal-control and session-host optional, prior art `fgos-identity` `features = ["directory"]`); phase 18 keeps the record bytes Node's | F6: called under the advance hold on every advance (`case-runtime.mjs:74-80`); a spawn per reservation per advance would be a sync spawn in a hot path; the addon already links holder-lock and durable-file |
| P16 | On child exit without `settle`, the seam settles nothing and reports `unsettled`; the reservation stays live and Workflow's existing `releaseDeadReservations` decides it with `reservationDead`'s proof (custody + unit-run record), never a blind `releasedUnitRunSettle` | F5; `src/workflow/case-runtime.mjs:74-80,104-111`; the proof's inability to tell a settled committed run from a never-started one exists today (Workflow dying in process) and becomes a backlog row (RUL104) |
| P17 | The peer protocol carries six operations (`resolveBinding`, `admit`, `recheckEffect`, `settle`, `activityUnitOf`, `confinedWriteRefusal`) and two acknowledged events (`unitRunCreated`, `caseAdmitted`) | F4, V3: `run-request.mjs:321-328,351`, `bin/fgos.mjs:2499-2505`, `src/workflow/case-admission-port.mjs:38,124`; V18: `runner.mjs:173` |
| P18 | `loadRunnerConfigForDir` stays one copy: its whole composition (retired keys, global-rigor refusal, `runner_check`, origins, confinement normalisation, error codes) is ported to `fgos-execution::runner_config` (6c) and served to Node by the addon; no switch to `src/config/facade.mjs` | V5: `dispatch/config.mjs:316-345` vs `facade.mjs:81`; S5 `runner_check.rs` |
| P19 | Tier-0 leaves living in deleted directories move first (phase 02): `payload-root.mjs` -> `src/util/`, `stop-processes-inside.mjs` -> `src/native/` (beside `process-identity.mjs`; `npm test` and `fgos:dev` keep needing only the addon, never a built host), `capability-config.mjs` -> `src/runner/` (beside `rigor.mjs`); the engine uses `fgos-process` directly | V6, F14: `test/helpers/process-tmp-root.mjs:14` (about 610 test files), `scripts/run-tests.mjs:31`, `run-rust-dev-host.mjs:9`; manifest tier 0 for all three |
| P20 | Phases over the 2 500 Node-line rule are split now, by file: 6 -> 6, 6b, 6c (6c adds the config loader and run facts); 7 -> 7, 7b; 8 -> 8, 8b; 13 -> 13, 13b; 16 -> 16, 16b; and on `f031ab0c8` (phase 00): 11 -> 11 (transport base, 1 528), 11b (transport round, session attempt, run inspection, 1 498; cut along the Node import direction so 11b depends on 11); `bind.mjs` and `dry-bind.mjs` port in 16 (2 264) instead of 18 (2 298). Phase ids stay stable (no renumbering) so the reviews' citations stay valid; ids 1 and 4 moved to the worktree-door plan | F8; `wc -l` on `b5b237534`: old 6 = 4 108, 7 = 3 095, 8 = 2 891, 13 = 4 305, 16 = 3 578; on `f031ab0c8`: 11 = 3 026, 18 = 2 529 with `bind.mjs` ([facts-part-a](reports/facts-part-a.md) §1) |
| P21 | Golden recorders are committed at `test/golden-recorders/<module>.recorder.mjs` and deleted with the Node module they import; before each cut-over phase the lead ports main's changes to the deleted Node paths since the integration base (re-sync rule); a Node-era record corpus is committed at `packages/execution/contracts/corpus/` and replayed by every reader | F7: 69 + 132 + 26 commits in 14 days on the three Node dirs; `.fgos/runtime/` ignored (`.gitignore:23`); F13: other projects pin releases and upgrade later, `legacy-seat-read.mjs:1-8` |
| P22 | Every phase that deletes or moves a file edits the `doors` entries and manifest entries naming it in the same change; phase 22 only adds rows and closes rows whose job is gone | V4: `test/architecture.test.mjs:1848-1849` stale check; 16 rows name files these phases delete (phase 00 §5) |

Prior art reused: S5 integration model, lead rules, D2 route pattern, D7 declared twins, parity tables off main; the
combined addon door (`src/native/door.mjs`); the doctor bridge's payload launcher and framing; `adopt.rs --scan`
(`packages/run-supervisor/rust/src/adopt.rs:148,180`) and the `dispatch-cwd` holder-lock resource
(`packages/holder-lock/contracts/lock-registry.v1.json:145`, test `packages/holder-lock/rust/src/fence.rs:865`) reused by phase 05 (V11); the `fgos-identity` feature-gate pattern.
Missing and built: a Rust unit runner, the admission peer protocol, the Execution Node seam.

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 0 | [Facts, census, port map, corpus](phase-00-facts.md) | - | plans/261118-1341-s6a-execution-tier-rust/reports/**, packages/execution/contracts/corpus/**, test/golden-recorders/seam-scan.mjs | 1 | done |
| 2 | [Tier-0 leaves out of the deleted directories](phase-02-payload-root.md) | 0 | src/util/payload-root.mjs, src/native/stop-processes-inside.mjs, src/runner/capability-config.mjs, src/run-supervisor/**, src/runner/execution/**, src/runner/dispatch/**, src/verbs/dispatch/inspect.mjs, src/native/door.mjs, src/seat-binding/client.mjs, src/event-store/consumers.mjs, src/workflow/loader.mjs, src/workflow/propose.mjs, src/runner/operation-capability.mjs, src/setup/executor-profile-warnings.mjs, src/setup/registrations.mjs, src/setup/seat-binding-checks.mjs, bin/fgos.mjs, scripts/run-tests.mjs, scripts/lib/test-file-watchdog.mjs, scripts/run-rust-dev-host.mjs, test/helpers/process-tmp-root.mjs, test/helpers/executor-model-vectors.helper.mjs, test/runner/stop-processes-inside.test.mjs, test/runner/capability-config.test.mjs, test/runner/execution/capability-config.test.mjs, test/scripts/run-rust-dev-host-staging.test.mjs, test/state/domain-registry-compiled.test.mjs, test/event-store/consumers.test.mjs, test/run-supervisor/attempt-steps.test.mjs, test/runner/dispatch-reconciliation-import-graph.test.mjs, packages/distribution/contracts/doctor-registry.v1.json, docs/architecture-manifest.json, docs/platform/seat-binding/spec.md | 2 | done |
| 3 | [Crate skeletons](phase-03-engine-skeleton.md) | 0 | packages/execution/engine/**, packages/execution/rust/Cargo.toml, packages/execution/rust/src/lib.rs, packages/execution/rust/src/unit/mod.rs, packages/execution/rust/src/run_request/mod.rs, packages/execution/rust/src/patterns/mod.rs, packages/execution/rust/src/outcome/mod.rs, packages/execution/rust/src/loops/mod.rs, packages/execution/rust/src/seat_resolver/mod.rs, packages/execution/rust/src/case_paths/mod.rs, packages/execution/rust/src/handoff/mod.rs, packages/execution/rust/src/unit_record/mod.rs, packages/execution/rust/src/admission/mod.rs, packages/execution/rust/src/runner_config/mod.rs, packages/execution/rust/src/run_facts/mod.rs, Cargo.toml | 2 | done |
| 5 | [Run supervisor controller half in Rust](phase-05-run-supervisor-controller.md) | 0 | packages/run-supervisor/rust/src/controller/**, packages/run-supervisor/rust/src/lib.rs, packages/run-supervisor/rust/Cargo.toml, packages/run-supervisor/rust/tests/controller_*.rs, packages/run-supervisor/contracts/controller/**, test/golden-recorders/run-supervisor-controller.recorder.mjs | 2 | draft |
| 6 | [Pure core: unit, run request, patterns](phase-06-execution-pure-core.md) | 3 | packages/execution/rust/src/unit/**, packages/execution/rust/src/run_request/**, packages/execution/rust/src/patterns/**, packages/execution/rust/tests/core_unit.rs, packages/execution/contracts/core-unit/**, test/golden-recorders/core-unit.recorder.mjs | 3 | draft |
| 6b | [Pure core: outcome, loops, seats, records, admission contract](phase-06b-execution-pure-loops-seats.md) | 3 | packages/execution/rust/src/outcome/**, packages/execution/rust/src/loops/**, packages/execution/rust/src/seat_resolver/**, packages/execution/rust/src/case_paths/**, packages/execution/rust/src/handoff/**, packages/execution/rust/src/unit_record/**, packages/execution/rust/src/admission/**, packages/execution/rust/tests/core_loops.rs, packages/execution/contracts/core-loops/**, test/golden-recorders/core-loops.recorder.mjs | 3 | draft |
| 6c | [Pure core: runner config loader, run facts](phase-06c-runner-config-and-run-facts.md) | 3 | packages/execution/rust/src/runner_config/**, packages/execution/rust/src/run_facts/**, packages/execution/rust/tests/core_runner_config.rs, packages/execution/contracts/core-runner-config/**, packages/execution/contracts/core-run-facts/**, test/golden-recorders/core-runner-config.recorder.mjs | 3 | draft |
| 7 | [Confinement policies and resources](phase-07-confinement-policy.md) | 3 | packages/execution/engine/src/confinement/policy/**, packages/execution/engine/tests/confinement_policy.rs, packages/execution/contracts/confinement-policy/**, test/golden-recorders/confinement-policy.recorder.mjs | 3 | draft |
| 8 | [Confinement driver, registry, attestation](phase-08-confinement-driver.md) | 3 | packages/execution/engine/src/confinement/driver/**, packages/execution/engine/tests/confinement_driver.rs, packages/execution/contracts/confinement-driver/**, test/golden-recorders/confinement-driver.recorder.mjs | 3 | draft |
| 9 | [Provider accounts and capacity](phase-09-provider-accounts.md) | 3 | packages/execution/engine/src/accounts/**, packages/execution/engine/tests/accounts.rs, packages/execution/contracts/accounts/**, test/golden-recorders/accounts.recorder.mjs | 3 | draft |
| 10 | [Credential renewal](phase-10-credential-renewal.md) | 3 | packages/execution/engine/src/credentials/**, packages/execution/engine/tests/credentials.rs, packages/execution/contracts/credentials/**, test/golden-recorders/credentials.recorder.mjs | 3 | draft |
| 11 | [Transport base: adapters, worker sessions, visibility](phase-11-transport.md) | 3, 5 | packages/execution/engine/src/transport/**, packages/execution/engine/tests/transport.rs, packages/execution/contracts/transport/**, test/golden-recorders/transport.recorder.mjs | 3 | draft |
| 12 | [Run result and evidence](phase-12-run-result.md) | 3 | packages/execution/engine/src/run_result/**, packages/execution/engine/tests/run_result.rs, packages/execution/contracts/run-result/**, test/golden-recorders/run-result.recorder.mjs | 3 | draft |
| 7b | [Confinement request and authority](phase-07b-confinement-request-authority.md) | 7 | packages/execution/engine/src/confinement/request/**, packages/execution/engine/tests/confinement_request.rs, packages/execution/contracts/confinement-request/**, test/golden-recorders/confinement-request.recorder.mjs | 4 | draft |
| 8b | [Confinement cleanup and probes](phase-08b-confinement-cleanup-probes.md) | 8 | packages/execution/engine/src/confinement/cleanup/**, packages/execution/engine/tests/confinement_cleanup.rs, packages/execution/contracts/confinement-cleanup/**, test/golden-recorders/confinement-cleanup.recorder.mjs | 4 | draft |
| 11b | [Transport round, session attempt, run inspection](phase-11b-transport-round.md) | 11 | packages/execution/engine/src/transport_round/**, packages/execution/engine/tests/transport_round.rs, packages/execution/contracts/transport-round/**, test/golden-recorders/transport-round.recorder.mjs, packages/holder-lock/rust/src/port.rs, packages/holder-lock/rust/tests/handle_file.rs | 4 | draft |
| 13 | [Assignment model](phase-13-assignment-model.md) | 6, 6b, 7, 9 | packages/execution/engine/src/assignment/**, packages/execution/engine/tests/assignment.rs, packages/execution/contracts/assignment/**, test/golden-recorders/assignment.recorder.mjs | 4 | draft |
| 14 | [Settlement and post-receipt steps](phase-14-settlement-steps.md) | 5, 10, 12 | packages/execution/engine/src/settlement/**, packages/execution/engine/src/steps/**, packages/execution/engine/tests/settlement.rs, packages/execution/contracts/settlement/**, test/golden-recorders/settlement.recorder.mjs | 4 | draft |
| 13b | [Prompt templates and execution contract](phase-13b-execution-contract.md) | 6c, 13 | packages/execution/engine/src/contract/**, packages/execution/engine/tests/contract.rs, packages/execution/contracts/execution-contract/**, test/golden-recorders/execution-contract.recorder.mjs | 5 | draft |
| 15 | [Doctor rows: confinement](phase-15-doctor-confinement.md) | 7b, 8b, 10 | apps/fgos/Cargo.toml, apps/fgos/src/wiring/doctor/confinement.rs, apps/fgos/src/wiring/doctor/mod.rs, packages/distribution/contracts/doctor-registry.v1.json, src/setup/registrations.mjs, src/setup/checks.mjs, test/runner/dispatch-confinement-backend-p03.test.mjs, test/runner/dispatch-confinement-blind.test.mjs, test/runner/dispatch-confinement-p05.test.mjs, test/runner/provider-credential-renewal.test.mjs, test/setup/**, test/rust-host/verb-parity.test.mjs, test/rust-host/parity-cases/**, docs/architecture-manifest.json | 5 | draft |
| 16 | [Dispatch planning, planners and the bind facade](phase-16-dispatch-planning.md) | 6, 6c, 9, 13 | packages/execution/engine/src/planning/**, packages/execution/engine/tests/planning.rs, packages/execution/contracts/planning/**, test/golden-recorders/planning.recorder.mjs | 5 | draft |
| 16b | [Assignment runner](phase-16b-assignment-runner-core.md) | 7b, 8b, 10, 11, 11b, 13b, 14, 16 | packages/execution/engine/src/assignment_runner/**, packages/execution/engine/tests/assignment_runner.rs, packages/execution/contracts/assignment-runner/**, test/golden-recorders/assignment-runner.recorder.mjs | 6 | draft |
| 17 | [Doctor rows: executor, accounts, run supervisor, terminal](phase-17-doctor-execution.md) | 5, 9, 10, 11, 11b, 13b, 15 | apps/fgos/src/wiring/doctor/**, packages/distribution/contracts/doctor-registry.v1.json, src/setup/**, src/runner/agent-definitions.mjs, src/runner/agent-listing.mjs, test/seat-binding/route-doctor-check.test.mjs, test/runner/provider-pool-lease.test.mjs, test/runner/operation-prompt-templates.test.mjs, test/setup/**, test/rust-host/parity-cases/**, docs/architecture-manifest.json | 6 | draft |
| 18 | [Unit run core and admission peer](phase-18-unit-run-core.md) | 6b, 6c, 16b | packages/execution/engine/src/unit_run/**, packages/execution/engine/tests/unit_run.rs, packages/execution/contracts/unit-run/**, packages/execution/contracts/admission-peer/**, test/golden-recorders/unit-run.recorder.mjs | 7 | draft |
| 19 | [`fgos run` native, internal execution routes, admission peer](phase-19-run-native.md) | 18 | apps/fgos/src/wiring/run.rs, apps/fgos/src/wiring/execution_routes.rs, apps/fgos/src/wiring/attempt_step.rs, apps/fgos/src/wiring/mod.rs, apps/fgos/src/wiring/doctor/bridge.rs, apps/fgos/src/legacy_exec.rs, apps/fgos/src/main.rs, apps/fgos/src/routing.rs, apps/fgos/src/cli_projector.rs, apps/fgos/Cargo.toml, apps/fgos/tests/cli_tests.rs, packages/host-runtime/rust/src/catalog.rs, packages/run-supervisor/rust/src/attempt_step.rs, packages/execution/contracts/execution-routes/**, src/cli/command-registry.mjs, bin/fgos.mjs, src/native/execution-door.mjs, src/runner/dispatch/runner-config-error.mjs, src/runner/execution/case-admission-port.mjs, src/workflow/admission-peer.mjs, test/native/execution-door.test.mjs, test/cli/run-verb.test.mjs, test/rust-host/**, docs/architecture-manifest.json | 8 | draft |
| 20 | [Node consumer seam; Execution Core Node deleted (23 files without a Node dispatch importer)](phase-20-node-seam.md) | 17, 19 | src/workflow/**, src/runner/execution/account-pin.mjs, src/runner/execution/case-admission-port.mjs, src/runner/execution/case-run-paths.mjs, src/runner/execution/commit-unit-work.mjs, src/runner/execution/custody-door.mjs, src/runner/execution/dry-bind.mjs, src/runner/execution/handoff-refs.mjs, src/runner/execution/loops/history-outcome.mjs, src/runner/execution/partial-writes.mjs, src/runner/execution/patterns/catalog-entries.mjs, src/runner/execution/patterns/catalog.mjs, src/runner/execution/run.mjs, src/runner/execution/run-request.mjs, src/runner/execution/unit.mjs, src/runner/execution/unit-run-record.mjs, src/runner/execution/unit-run-start.mjs, src/runner/execution/unit-summary.mjs, src/runner/execution/unit-sync.mjs, src/run-supervisor/attempt-step.mjs, src/run-supervisor/cancel-opt-in.mjs, src/run-supervisor/steps/finalize-home.mjs, src/run-supervisor/steps/settle-attempt.mjs, src/run-supervisor/step-support.mjs, src/runner/dispatch/**, src/runner/loop.mjs, src/runner/operation-choice.mjs, src/runner/work-dispatch.mjs, src/runner/fanout-batch.mjs, src/runner/work-compat.mjs, src/runner/operation-capability.mjs, src/runner/agent-definitions.mjs, src/session-host/head-start.mjs, src/session-host/head-request.mjs, src/session-host/head-stop.mjs, src/verbs/state/read.mjs, src/session-rotation/rotate.mjs, src/report/capability-plan-lint.mjs, src/cli/verb-exit.mjs, src/seat-binding/client.mjs, src/setup/**, src/native/execution-door.mjs, src/native/door.mjs, bin/fgos.mjs, bin/fgos-runner.mjs, src/verbs/dispatch/show-run.mjs, src/verbs/dispatch/recover.mjs, scripts/git/e3-bench.mjs, scripts/lib/mailbox-live-confined.mjs, scripts/backfill-unit-summaries.mjs, scripts/record-mailbox-hook-fixtures.mjs, packages/git/node-addon/**, test/golden-recorders/**, test/workflow/**, test/runner/**, test/run-supervisor/attempt-steps.test.mjs, test/helpers/**, test/session-host/**, test/setup/**, test/native/**, test/convention/seat-id.test.mjs, test/portfolio/work-questions.test.mjs, test/seat-binding/client.test.mjs, docs/architecture-manifest.json | 9 | draft |
| 21 | [Dispatch subs native; Dispatch Node and the rest of Execution Core Node deleted](phase-21-dispatch-subs.md) | 11b, 20 | apps/fgos/src/wiring/dispatch_subs.rs, apps/fgos/src/wiring/mod.rs, apps/fgos/src/main.rs, apps/fgos/src/routing.rs, apps/fgos/src/cli_projector.rs, apps/fgos/tests/cli_tests.rs, packages/host-runtime/rust/src/catalog.rs, src/cli/command-registry.mjs, bin/fgos.mjs, src/verbs/dispatch/**, src/runner/dispatch/**, src/runner/dispatch.mjs, src/runner/execution/**, src/run-supervisor/**, src/runner/agent-roster.mjs, src/report/authoritative-match.mjs, scripts/check-decision-citation-drift.baseline.json, test/golden-recorders/**, test/run-supervisor/**, test/helpers/**, test/scripts/write-wrapper-script.test.mjs, test/cli/**, test/runner/**, test/verbs/**, test/config/facade.test.mjs, test/holder-lock/windows-borrow.test.mjs, test/holder-lock/driver-unavailable.test.mjs, test/live/mailbox-wake-probe.live.mjs, test/seat-binding/client.test.mjs, test/session-identity/attempt-writer-id.test.mjs, test/state/work-size-rigor.test.mjs, test/util/session-identity.test.mjs, test/git/write-scope-parity.test.mjs, test/rust-host/**, docs/architecture-manifest.json | 10 | draft |
| 22 | [Close: doors, docs, canary, integration gate](phase-22-close.md) | 0, 2, 3, 5, 6, 6b, 6c, 7, 7b, 8, 8b, 9, 10, 11, 11b, 12, 13, 13b, 14, 15, 16, 16b, 17, 18, 19, 20, 21 | docs/architecture-manifest.json, test/architecture.test.mjs, test/rust-host/verb-parity.test.mjs, test/rust-host/parity-cases/**, test/golden-recorders/**, docs/platform/runner/**, docs/platform/run-supervisor/spec.md, docs/platform/agent-confinement/spec.md, docs/platform/component-boundary.md, docs/reading-map.md, docs/backlog.md, CHANGELOG.md, plans/261118-1341-s6a-execution-tier-rust/reports/** | 11 | draft |

Effort (lead-days): 0: 2; 2: 1; 3: 0.75; 5: 2.5; 6: 1.5; 6b: 2; 6c: 1.5; 7: 1.5; 7b: 1.5; 8: 1.5; 8b: 1.5; 9: 2;
10: 2; 11: 1.75; 11b: 1.25; 12: 1.5; 13: 2; 13b: 1.5; 14: 2; 15: 2; 16: 2.25; 16b: 2.5; 17: 2.5; 18: 2.25; 19: 3;
20: 3; 21: 2.5; 22: 3. Total about 54.25 (the worktree-door plan adds 5.5 before it). Critical path 0 -> 3 -> 6b -> 13
-> 16 -> 16b -> 18 -> 19 -> 20 -> 21 -> 22: 2 + 0.75 + 2 + 2 + 2.25 + 2.5 + 2.25 + 3 + 3 + 2.5 + 3 = 25.25 lead-days
(21 grew by the 30 Execution Core files it now deletes; the 11 -> 11b chain ends in wave 4 and is not on it). No
phase ports more than 2 500 Node lines (P20; phase 00 counts on `f031ab0c8`: 16 = 2 264, 18 = 2 298, 11 = 1 528,
11b = 1 498).

External gates: the plan starts when S5 phases 11 and 12 and the worktree-door plan are on `main` (`blockedBy`). Plan
1045 phase 6 is a phase-level gate, not a plan-level `blockedBy`: phases 5, 11, 11b, 16b and 19 start only after 1045 P6 is
on `main` (D4; met: 1045 phases 1-18 `done` on `f031ab0c8`, P6 `47165e3bf`). 1045 P6 is a phase-level landing that does not wait for 1045 `ready` (1045 P3, P5, P8 landed while
that plan was `draft`), so there is no cycle: 1045 is blocked by 0947, 0947 by the worktree-door plan, and neither
waits on this plan.

**Waves.** 1: 0. 2: 2, 3, 5. 3: 6, 6b, 6c, 7, 8, 9, 10, 11, 12. 4: 7b, 8b, 11b, 13, 14. 5: 13b, 15, 16. 6: 16b, 17.
7: 18. 8: 19. 9: 20. 10: 21. 11: 22. Within wave 3, 10 lands after 9 (the account lock it takes); shared types are
fixed by the skeletons in 3.

**Contract check (by reading; script run recorded in the Validation log).** Every phase sits in a later wave than
each dependency. Same-wave footprints are disjoint: wave 2 (Node leaf moves vs `packages/execution/{engine,rust}`
skeleton files + root `Cargo.toml` vs `packages/run-supervisor/`); wave 3 (one module directory, test file, contracts
directory and recorder each); wave 4 (five engine module directories: `confinement/request`, `confinement/cleanup`, `transport_round`, `assignment`,
`settlement`+`steps`; 11b's `transport_round` is a sibling of 11's `transport`, so 11 and 11b are disjoint as well); wave 5 (`engine/src/{contract,planning}/` vs
doctor wiring, `apps/fgos/Cargo.toml` and registry); wave 6 (`engine/src/assignment_runner/` vs doctor wiring);
waves 7-11 one phase each. Phases 20 and 21 (waves 9, 10) split the Execution Core deletion by file: 20 holds the
23 files of `src/runner/execution/` and `src/run-supervisor/` that no Node dispatch file imports, 21 holds the
directories (the other 30) and `test/run-supervisor/**` except `attempt-steps.test.mjs` (20). `docs/architecture-manifest.json` has one writer per wave (2, 15, 17, 19, 20, 21, 22 in
waves 2, 5, 6, 8, 9, 10, 11).

### Parallel map

```text
wave 1:  [0 facts, census, corpus]
wave 2:  [2 tier-0 leaves]  [3 skeletons]  [5 supervisor controller (after 1045 P6)]
wave 3:  [6] [6b] [6c pure core]  [7 conf policy] [8 conf driver] [9 accounts] [10 credentials] [11 transport base] [12 run result]
wave 4:  [7b conf request]  [8b conf cleanup]  [11b transport round + run inspection]  [13 assignment]  [14 settlement + steps]
wave 5:  [13b contract]  [15 doctor: confinement (parity runner restored)]  [16 planning + bind facade]
wave 6:  [16b assignment runner]  [17 doctor: executor, accounts, supervisor, terminal; seat-binding-route to Rust]
wave 7:  [18 unit run core + peer protocol]
wave 8:  [19 fgos run native + internal routes + peer + Node seam file]
wave 9:  [20 Workflow and Work callers on the seam; 23 Execution Core files with no Node dispatch importer deleted]
wave 10: [21 dispatch subs native; src/runner/dispatch, src/verbs/dispatch, the rest of src/runner/execution and src/run-supervisor deleted]
wave 11: [22 close, canary, integration gate]
```

### Hot and generated files

Generated, regenerated on every rebase, never hand-merged, not counted as footprint overlap: `Cargo.lock`,
`packages/host-runtime/contracts/command-routes.json`, `command-manifest.json`, `packages/git/contracts/mutation-census.v1.json`,
`test/suite-baseline.json`, skill renders. Hand-edited hot files, one writer per wave (from the table): root
`Cargo.toml` (3), `apps/fgos/Cargo.toml` (15, 19), `apps/fgos/src/main.rs`, `routing.rs`, `cli_projector.rs`,
`apps/fgos/tests/cli_tests.rs`, `src/cli/command-registry.mjs` (19, 21), `bin/fgos.mjs` (2, 19, 20, 21),
`packages/git/node-addon/**` (20), `src/native/door.mjs` (2, 20), `doctor-registry.v1.json` (2, 15, 17),
`src/setup/registrations.mjs` (2, 15, 17, 20), `packages/execution/rust/src/lib.rs` and engine `lib.rs` (3 only; 3 also declares 11b's `transport_round` module),
`src/runner/execution/**` and `src/run-supervisor/**` (2 moves, 20 deletes its 23 named files, 21 deletes the rest),
`CHANGELOG.md` (22).

## Data flow

- Standalone `fgos run`: host argv -> `fgos-execution` unit build and validation -> bind (S5) -> engine `unit_run`
  (pattern loop) -> `assignment_runner` per seat (confinement, accounts lease, transport, supervisor handover via
  `fgos-run-supervisor` controller) -> `settlement` -> commit of declared writes (`fgos-git` ScopedCommit) -> provenance
  under `.fgos/assignments/<unitRunId>/` -> envelope. When the run asks the port (writes, `--case`, confined worker),
  the host starts `src/workflow/admission-peer.mjs` through `legacy_exec` and talks framed lines over its stdin/stdout.
- Workflow and Work -> Execution: caller -> `runUnitInHost(options, {caseAdmission, onCaseAdmitted, onUnitRunCreated})`
  (`src/native/execution-door.mjs`) -> async spawn of `fgos internal execution run-unit --protocol 1` -> request on the
  child's stdin -> the child asks the six operations as framed lines on its stdout; the door answers from the caller's
  port on stdin and fires the two events -> final framed result (or `errorClass`) -> same shape as `runUnit`. Child
  exit without `settle`: `{ unsettled }`, the reservation stays live for `releaseDeadReservations`.
- Workflow reads under the advance hold: `custodyHeld`/`unitRunFacts` -> addon `execution` namespace -> holder list,
  `unit.json`, lease inspection -> `fgos-execution::run_facts`.
- Custody/verify/sweep/cancel/launch-session: `executionOp` / `launchSessionInHost` -> `fgos internal execution <op>`.
- Doctor: host doctor engine -> `wiring/doctor/{confinement,execution,run_supervisor,terminal}.rs` -> engine /
  supervisor judgments -> row results.

## Test matrix

| Layer | Owning proof | Phase |
|---|---|---|
| Supervisor controller (lease, cwd lock, cancel registry, runtime dir, trust store, launch with `lanes`), `lease` feature build | `packages/run-supervisor/rust/tests/controller_*.rs` | 5 |
| Unit, run request, patterns, outcome, loops, seat checks, case paths, runner config, run facts | golden vectors under `packages/execution/contracts/core-*/`, run by `fgos-execution` tests; corpus replay | 6, 6b, 6c |
| Confinement, accounts, credentials, transport, transport round and run inspection, run result, assignment, contract, settlement, steps, planning, assignment runner, unit run | one golden or integration test file per engine module; readers replay the corpus | 7-18 |
| Peer protocol (six ops, two events, stray line ignored, peer dies, slow peer) | `engine/tests/unit_run.rs` | 18 |
| `fgos run`, internal routes, P5 peer start, confined-worker refusal | `cli_tests.rs` wiring cases (argv and envelope only) | 19 |
| Node seam (spawn, framing, errorClass, unsettled) | `test/native/execution-door.test.mjs` | 19 |
| Workflow peer wiring incl. child killed between admit and settle; Work call site | one test in `test/workflow/`, one in `test/runner/operation-choice.test.mjs` | 20 |
| Dispatch subs | `cli_tests.rs` one wiring case per sub | 21 |
| Moved doctor rows | Rust row tests per group; registry exact-set test; parity tables (integration only) | 15, 17 |
| Only the doors do the job | `test/architecture.test.mjs` `checkDoors` with seeded cases per new or changed row | each deleting phase, 22 |
| Census | `test/setup/git-mutation-census.test.mjs` | every code phase |
| Real machine, rollback readability | canary and reverse-read tables | 22 |
| Whole system | `cargo test --workspace`, one full `npm test` on the integration head; again on main | 22 |

Every Node test of a retired path is deleted, moved or switched in the phase that deletes the path (retire-with-path
rule); each phase report has a table "retired test -> owner now" (design principle 8). No behaviour gets a second
proof.

## Owner questions

None open. D1-D5 answered 2026-11-18. P1-P22 are decided from evidence.

- **P5 answered 2026-11-18 by the owner (via head:secretary-miu): option A.** A native standalone `fgos run` that asks
  for the Workflow port starts the Node peer entry (`src/workflow/admission-peer.mjs`) for Workflow admission until
  S6b. Workflow admission does **not** move into S6a; S6b retires the peer when Workflow is Rust. A run the port is
  never asked for spawns no Node. Implementation detail (P13, P17): the peer is started through the doctor bridge's
  launcher over stdin/stdout, and every standalone `--writes` run asks the port.

## Risks and rollback

| Risk | L x I | Mitigation |
|---|---|---|
| Port drift: a Rust module behaves differently from the Node it replaces (34k lines) | H x H | golden vectors from committed recorders; re-sync from main before each cut-over (P21); parity tables per cut-over verb and doctor row; canary (22); RUL104 keeps defects |
| Main keeps changing the deleted Node files (about 227 commits in 14 days) | H x H | re-sync rule before 15, 17, 19, 20, 21, 22; board line routing main fixes through the S6a lead from phase 19 |
| Host-Node channel fails on Windows | L x H | stdin/stdout pipes only (P13); msvc build of the adapter; no fd slots |
| Admission reservation mis-settled when the `run-unit` child dies | M x H | seam settles nothing; Workflow's existing dead-reservation proof decides (P16); wiring test in 20 |
| Peer deadlock or corruption | M x M | prefixed framing, stray lines ignored; both sides read concurrently; deadline per request; async spawn only |
| Every standalone `--writes` run starts Node until S6b | H x L | owner-accepted cost of P5 = A; CHANGELOG line |
| The `lease` feature split of `fgos-run-supervisor` does not separate cleanly | M x M | phase 05 proves `--no-default-features --features lease` builds; if it cannot, phase 05 stops and the plan lead takes P15 back to kongming with the evidence |
| Addon links the engine | L x H | `doors` row on `packages/git/node-addon/Cargo.toml` (22); `cargo tree -p fgos-node-addon` in 3 |
| Other projects upgrade with open Node-era runs and records | M x H | corpus replay in every reader (P21); CHANGELOG upgrade line (drain before `fgctl upgrade`) |
| Rollback after activation meets Rust-written records | M x H | records stay Node's bytes (18); reverse-read check (22) |
| Plans 1045, 0947, 1159 edit the same supervisor, session-host, doctor and routing files | H x M | collision table; later lander rebases |
| Node event loop blocked by a synchronous addon read | L x M | addon reads are file and lock reads only (P15); long work is async host spawn |

Collision table:

| Shared file or area | This plan | Other plan or lane | Mitigation |
|---|---|---|---|
| `packages/run-supervisor/**`, `src/run-supervisor/direct-launch.mjs`, `src/runner/dispatch/assignment-runner.mjs`, `envelope.v3.json` | 2, 5, 11, 16b, 19, 20 | 1045 P6 (lane pool), P10 (head-request) | D4 met: 1045 P6 on main (`47165e3bf`, lane-wait fix `2dbabb340`), P10 on main (`92570dd85`); S6a ports `lanes` from main; `head_request.rs` untouched (stays under the `supervise` feature) |
| `packages/run-supervisor/rust/**`, `src/session-host/**`, `src/session-rotation/**` | 5, 19, 20 | 0947 P5 | 0947 done (`37b345016`; rename `dbd26eae6`); S6a's `controller/` and `head_request.rs` stay disjoint; `rotate.mjs` already carries 0947's change, 20 edits it on top |
| `src/session-host/head-start.mjs` | 20 (call site and imports only) | 1045 P9, P10; 1159 P4 | all on main (`d0ca4eff7`, `92570dd85`, 1159 done `3ea56a6a7`); 20 edits on top |
| `src/runner/{loop,fanout-batch,claim-port}.mjs`, `src/setup/**`, `doctor-registry.v1.json` | 2, 15, 17, 20 | 1045 P17 | 1045 P17 on main (`3c89dbe87`, work-item slot count retired); S6a edits only the `runUnit`/`sweepAttempts` call sites and imports |
| `apps/fgos/src/wiring/doctor/mod.rs`, `doctor-registry.v1.json`, `main.rs`, `routing.rs`, `apps/fgos/Cargo.toml` | 15, 17, 19, 21 | 1045 P15, P16 | both on main (P16 `8ea404d62`); rebase and regenerate |
| `apps/fgos/src/{main,routing,cli_projector}.rs`, `wiring/mod.rs`, `wiring/doctor/bridge.rs` | 19, 21 | 1159 P4 (incl. `bridge.rs`), P6 (`routing.rs`, `src/setup/**`, `test/setup/**`) | 1159 done (`3ea56a6a7`; its `questions.rs` calls `NodeBridge::new()`); 19 moves `payload_launch` (`bridge.rs:186-199`) out of `bridge.rs` and keeps every `NodeBridge::new()` caller working |
| root `Cargo.toml`, `docs/architecture-manifest.json` | 3, 2, 15, 17, 19-22 | 1159 P3; every lane adding a door row | rebase, rerun the architecture test |
| `head-request.v1.json`, `src/session-host/head-request*.mjs`, `head-stop.mjs` | 20 (import lines of `head-request.mjs:25-28` and `head-stop.mjs:10` only) | 0947 P5, 1045 P10, 1159 P8 (all on main) | S6a never edits the contract or the request logic; the two import switches are forced by deleting their targets |
| `src/runner/dispatch/**`, `src/runner/merge.mjs`, `bin/fgos.mjs` | 2, 13-21 | 0947 P4 (identity stops reading `sessions.json`) | 0947 P4 on main (`b7486e847`; identity never reads `sessions.json`); S6a ports from main |
| `src/setup/**`, `doctor-registry.v1.json` | 2, 15, 17 | 0947 P1 (session rows), account lease (`aafe1b601`), foundation P6 (`351dd9cbc`) | all on main; rebase |
| `src/native/door.mjs`, `packages/git/node-addon/**` | 2, 20 | worktree-door plan P2, resource stack (`0b51fb44c` graph/write-scope) | both on main |
| `CHANGELOG.md`, `docs/backlog.md`, `docs/reading-map.md`, `docs/platform/component-boundary.md` | 22 | every lane; open now: 1045 P19 (CHANGELOG, backlog, reading-map), foundation 2048 P7 (component-boundary, backlog) | big lead serializes; both land long before 22 |

Integration and landing: every phase lands on `s6a-execution/integration`, cut from `main` after the worktree-door
plan landed; phase 22 runs the canary and the full gate there and the big lead lands it on main as one series.
Landing preconditions: no run in flight and no open mutating assignment (the run path changes process), activate,
`fgos doctor` through the installed shim, board line, owner-machine guide linked on the board.

Rollback: before activation the integration series reverts as a whole. After activation the fastest restore is
reactivating the previous release (`.fgos/installation/activation.json` `previousArtifactDigest`; packaging spec
`:42`), which reads the Rust-written records because they keep Node's bytes (reverse-read check, 22); then revert the
series, rebuild and reactivate with nothing in flight. Inside the integration branch, revert in reverse wave order
(22, 21, 20, 19, 18, ...); library phases (3, 5-14, 16, 16b, 18) revert alone until 15/17 wire them into the host
doctor; after that, revert 15/17 first (V17).

## Sibling edits (applied 2026-11-18 with this revision)

- Program plan `plans/261114-2051-rust-verb-migration-program/plan.md` row S6a names both plans; `fgos-runner` sits in
  row S7.
- Plan `plans/261118-0947-session-verb-for-agent-sessions/plan.md`: `blockedBy` names `261118-1455-s6a-worktree-door`
  instead of this plan; its phase 4 footprint keeps `packages/mailbox/rust/store/src/hook/resolve.rs` (D1).
- Plan 1045: no change (P6 lands first, P10 relies on stable `worktree create` argv).

## Unresolved questions

None. P11 was decided by the plan lead in phase 0 (2026-11-19): phase 17 moves `seat-binding-route` to Rust; phase 20
consumes that decision and keeps `src/seat-binding/client.mjs`.

## Validation log

- 2026-11-18 planner: plan written against `0981437d2`; status `draft` until S5 phases 11 and 12 land and phase 00 re-reads the census.
- 2026-11-18 planner: `scripts/plan-contract-check.mjs --plan` (main checkout's script with its staged addon env, plan path absolute) prints `ok`.
- 2026-11-18 planner: design forks P1-P4 checked with kongming counsel (one reply; adopted, with P5 added from `run-request.mjs:356`).
- 2026-11-18 lead:S6A-LAND: owner answered P5 = A (Owner questions); sibling edits applied to the program plan `261114-2051` rows S6a/S7 and to plan `261118-0947` (`blockedBy`, phase 4 footprint). Status stays `draft` until S5 phases 11 and 12 land.
- 2026-11-18 validate: applied all of V1-V21 ([report](../reports/validator-261118-1442-s6a-plan-validate.md)).
  V1: phase 00 §2 replaced by a resolving scanner (static, side-effect and dynamic imports, relative specifiers
  resolved) plus a string scan; counts on `b5b237534`: 197 hits in 60 non-test files, 188 test files (8 helpers);
  retire-with-path rule; missed importers in phase 20/21 footprints. V2: P14 (one Node seam, `run-unit` and
  `launch-session` routes, call-site-only Work edits). V3: P17. V4: P22 and lead rule; 15/17/19/20/21 edit `doors`.
  V5: P18 and phase 6c. V6: P19, phase 02. V7: collision table completed. V8: P6, worktree-door plan, 0947
  `blockedBy`, no cycle (External gates). V9: worktree-door phase 01. V10: 15 gains `apps/fgos/Cargo.toml`, 5 gains
  the supervisor `Cargo.toml`. V11: phase 05 and prior art. V12: 10 no longer depends on the checkout door. V13: worktree-door
  phase 02 (range `:219-402`, `refreshUnstartedBranch` moves, `resetDispatchWorktree` stays for S7, caller list
  fixed). V14: phase 02 tests and manifest `:1561`. V15: `fgos-node-addon` everywhere. V16: anchored scans in 20, 21.
  V17: rollback wording. V18: `caseAdmitted` event. V19: cli cases wiring only. V20: worktree-door W4 (no npm row).
  V21: AC1/AC4 commands.
- 2026-11-18 red-team: applied F1-F14 ([report](../reports/red-team-261118-1442-s6a-plan-red-team.md)). F1: P6
  (worktree door lands as one series with the Work wrappers). F2: worktree-door phase 01 record key and identity.
  F3, F10: P13 (stdin/stdout pipes through the bridge's launcher; no fd 3, no `bin/fgos.mjs` arm), so red-team
  question 1 (drop Windows Workflow) does not arise. F4: P17, phase 19 confined-worker case. F5: P16; the
  "settle from the record's own facts" part is rejected for S6a (it changes today's dead-reservation behaviour,
  RUL104) and filed as a backlog row by phase 20. F6: P15. F7: P21, re-sync rule. F8: P20 splits (also 7 and 8,
  which the report did not count). F9: worktree-door phase 02 lock scope and error class. F11: worktree-door phase 01
  exit codes and parity. F12: phase 22 canary in a scratch clone, reverse-read check, rollback by
  `previousArtifactDigest`. F13: corpus (phase 00) replayed by readers, CHANGELOG upgrade line. F14: P19
  (`src/native/stop-processes-inside.mjs`; no host needed by `npm test`). Red-team question 2 answered by the lead
  (phase 04 lands with phase 1).
- 2026-11-18 lead:S6A-LAND: S5 is `done` on main (586765804); this plan now waits only on `261118-1455-s6a-worktree-door` and stays `draft` until it lands.
- 2026-11-19 lead:S6A phase 00 part B: every phase file re-checked on `f031ab0c8` (S5, worktree door, session verb 0947,
  owner-question store 1159, supervisor 1045 phases 1-18, foundation 2048 phases 1-6, resource stack and door landed
  since the plan was written). Line citations, landed work, and footprints of phases 2, 15, 17, 20, 21 updated in the
  phase files and this table; bridge:S6a rows now 32. Details and evidence: [facts-part-b](reports/facts-part-b.md).
- 2026-11-19 lead:S6A phase 0: decisions applied from [facts](reports/facts.md) (index of parts A and B). (1) Deletion
  order: phase 20 deletes the 23 files of `src/runner/execution/` and `src/run-supervisor/` with no Node dispatch
  importer (named in phase 20); phase 21 deletes the other 30 with `src/runner/dispatch/**` and gains
  `src/runner/execution/**`, `src/run-supervisor/**`, `test/run-supervisor/**`, `test/helpers/**`. (2) Phase 11 split by
  file into 11 (transport base, 1 528 lines, wave 3) and 11b (transport round, session attempt, run inspection, 1 498,
  engine module `transport_round`, wave 4, depends on 11; the cut follows the Node imports, so it differs from part A's
  proposed launch/inspection cut, whose launch half imports the inspection half); 16b, 17, 21, 22 depend on 11b. (3) `bind.mjs` and `dry-bind.mjs` port in 16 (2 264) instead of
  18 (2 298). (4) Uncovered tests placed: `test/scripts/write-wrapper-script.test.mjs` -> 21; of the 14
  `test/run-supervisor/**` importers, 13 (imports die with phase 21's files) -> 21 and `attempt-steps.test.mjs` stays 20
  (its `attempt-step.mjs`, `settle-attempt.mjs` go in 20); `test/cli/{execution-outcome-exit-codes,fgos-manifest}` and
  `test/verbs/dispatch-recovery` leave 20's row (their targets go in 21); the other uncovered files were already placed by part B. (5) The
  `run-unit` result carries an error type tag (P14; phases 18, 19, 20); phase 19 gives
  `RunnerConfigError` and `CaseAdmissionRefusedError` their tier-0 home in the door (footprint +2 files) so one class
  identity exists. (6) P11 decided: phase 17 moves
  `seat-binding-route`, phase 20 consumes. (7) Waves, parallel map, effort (54.25, critical path 25.25), contract check
  and hot files updated; contract re-checked by script (wave order, same-wave disjointness, phase-file footprints vs
  this table).
