---
title: "Rust verb migration program (F0 through S7)"
description: "Move the legacy-Node CLI verbs onto the Rust host, foundations first, one layer at a time, retiring each Node path in the same change."
status: pending
priority: P1
effort: 16d (F0 only; S1-S7 sized when each starts)
branch: plan/rust-verb-migration-program
tags: [refactor, infra, host, rust, migration]
blockedBy: []
blocks: []
created: 2026-11-14
---

# Rust verb migration program

Program index. The research that defines the steps is
`git show origin/research/rust-verb-migration:plans/reports/research-261114-1142-rust-verb-migration-assessment.md`
(read from `origin/main` `4f76cb385`; this plan re-read every named symbol on `origin/main` `781537524`).

**Only F0 has phase files.** S1-S7 each get their own detailed plan (facts phase, file-disjoint phases,
parallel map) when they start, written against the code as it is then. The step rows below fix scope,
order, entry and exit, and where the owner questions fall.

## Outcome

Every `fgos` verb runs in the Rust host with no Node process, one step at a time, foundations first.
Each step moves a whole use-case boundary, retires the Node arm, its Node tests and its registry
special-casing in the same change (L10, design principle 8), and lands green on its own.

Non-goals: no new verbs, flags or behaviours (RUL104); no dual-run of a write (migration doc §11);
no change to the `fgos.v1` envelope or the exit-code table; no Windows-without-Node commitment
before Q2 is answered at S4.

## Order (owner-approved, do not reorder)

```text
F0 host foundations
 -> S2 (lock, lock-status, git, worktree)  ||  S3 (events, session, gateway, agents)
 -> S4 packaging (retire setup; port wire-agents, uninstall, init, doctor)
 -> S5 bind / dispatch decide / tool
 -> S6a Execution (tier 5) -> S6b Workflow (tier 6) -> S7 Work (tier 7)
S1 hooks (delete guard, decision-question): any time after F0 and Q1, file-disjoint, may run beside any step
```

Layers stay serial. Inside one step every file-disjoint phase starts at once. Packaging (S4) comes
once the layers it reads are Rust, so `doctor`/`init` never call back into Node for a layer that has
already moved.

## Steps

| Step | Goal | Verbs | Main files (today) | Entry | Exit | Depends on | Owner question |
|---|---|---|---|---|---|---|---|
| **F0** host foundations | Host owns help, the route data can name a native sub-verb, the parity lane exists, the cross-cutting doors have one Rust owner | none flipped (help door moves) | see "F0 file set" | this plan approved | see "F0 exit" | T9 `main()` doors settled (on main) | none |
| **S1** hook verdicts | `hook decision-question` and `hook main-checkout-delete-guard` run natively | `hook` kinds | `src/runner/hook.mjs`, `src/state/decision-question.mjs`, `scripts/main-checkout-delete-guard-hook.mjs`, `src/git/main-checkout-delete-guard.mjs` | F0 landed; **Q1 answered yes** | both kinds in the registry `native` list of `hook`, Node verdict code deleted, shared vector file read by Rust tests | F0 | **Q1 asked here** |
| **S2** T0-T2 verbs | `lock`, `lock-status`, `git`, `worktree` native | 4 | `src/runner/lock-status.mjs`, `src/runner/lock-fence.mjs`, `src/git/status.mjs`, `src/verbs/worktree/*` | F0 landed | each verb native, Node arm + use case + its tests retired, first store-touching native verb proves the F0 doors through the binary | F0 | none |
| **S3** T3 verbs | `events`, `session`, `gateway`, `agents` native | 4 | `src/verbs/events/*`, `src/runner/session.mjs`, `src/runner/gateway-control.mjs`, `src/runner/agent-listing.mjs` | F0 landed; runs beside S2 with a file split agreed in both plans | as S2 | F0 | none |
| **S4** packaging | retire `setup`; native `wire-agents`, `uninstall`, `init`, `doctor` | 5 | `src/setup/setup-use-case.mjs`, `src/setup/agent-wiring.mjs`, `src/setup/uninstall-project.mjs`, `src/verbs/state/init.mjs`, `src/setup/checks.mjs`, `src/setup/registrations.mjs`, `packages/distribution/rust/src/init.rs` | S2+S3 landed; **Q2, Q3 answered** | `setup` gone; the other four native or hybrid per Q3; `requires.node` per Q2 with its doctor row | S2, S3 | **Q2, Q3 asked here** |
| **S5** Execution read door | `bind()` and the executor model in Rust; `dispatch decide`/`explain`, `hook dispatch-decide`, `tool` native | 3 | `src/runner/execution/bind.mjs`, `src/runner/dispatch/decide.mjs`, `src/runner/dispatch/config.mjs`, `src/state/tool-registry.mjs`, `src/runner/dispatch/hook.mjs` | S4 landed; executor-model contract written (Execution owns it) | one `bind()` (Rust), Node `bind()` callers moved or the remaining ones named with S6a as owner | S4 | none (S6 scope follows Q2) |
| **S6a** Execution | runner core, remaining `dispatch` subs, `run`, `fgos-runner` entry | 3 | `src/runner/execution/**`, `src/runner/dispatch/**`, `src/run-supervisor/**` (Node side) | S5 landed | tier-5 Node deleted | S5 | scope per Q2 |
| **S6b** Workflow | `workflow` | 1 | `src/workflow/**` | S6a landed | tier-6 Node deleted | S6a | none |
| **S7** Work | Work core (replay first, writers with the §11 gates), about 52 Work and Knowledge arms, tier-7 rest of `src/runner` (`work-dispatch.mjs`, `fanout-batch.mjs`, `work-compat.mjs`, `merge.mjs`, ...), knowledge/docs verbs | ~52 | `src/state/**`, `src/intake/**`, `src/report/**`, `src/verbs/state/**`, `src/runner/*.mjs` tier 7 | S6b landed; Work council (decision 78) held | zero `legacy-cli` routes; migration doc §12 removal gates | S6b | Work council |

S1 is the one step allowed to run beside another: its files (`hook` registry entry, hook verdict
modules, a new host hook handler) do not overlap S2-S7. If S1 starts while F0's P08 is open, it waits:
both touch `apps/fgos/src/main.rs` and `routing.rs`.

## F0 phases

| # | Phase | Wave | Blocked by | Effort | File |
|---|---|---|---|---|---|
| 00 | Facts and baselines | A | - | 0.5d | [phase-00-facts-and-baselines.md](phase-00-facts-and-baselines.md) |
| 01 | Manifest artifact | A | - | 0.5d | [phase-01-manifest-artifact.md](phase-01-manifest-artifact.md) |
| 02 | Host help door | B | 00, 01 | 2d | [phase-02-host-help-door.md](phase-02-host-help-door.md) |
| 03 | Native and store declarations as data | B | 00, 01 | 1.5d | [phase-03-native-and-store-declarations.md](phase-03-native-and-store-declarations.md) |
| 04 | Store admission authority | B | 00 | 1.5d | [phase-04-store-admission-authority.md](phase-04-store-admission-authority.md) |
| 05 | Invocation-fault authority | B | 00 | 1d | [phase-05-invocation-fault-authority.md](phase-05-invocation-fault-authority.md) |
| 06 | Event Store lifecycle authority | B | 00 | 1.5d | [phase-06-event-store-lifecycle-authority.md](phase-06-event-store-lifecycle-authority.md) |
| 07 | Parity lane | B | 00, 01; lands after 03 | 1.5d | [phase-07-parity-lane.md](phase-07-parity-lane.md) |
| 08 | Host routing and doors | C | 02, 03, 04, 05, 06 | 2.5d | [phase-08-host-routing-and-doors.md](phase-08-host-routing-and-doors.md) |
| 09 | Node help retirement | D | 07, 08 | 1.5d | [phase-09-node-help-retirement.md](phase-09-node-help-retirement.md) |
| 10 | Node fault-record client | D | 08 | 0.5d | [phase-10-node-fault-client.md](phase-10-node-fault-client.md) |
| 11 | F0 close: docs, proof consolidation, gates | E | all | 1d | [phase-11-f0-close.md](phase-11-f0-close.md) |

Critical path: 01 -> 02 -> 08 -> 09 -> 11, about 7.5 lead-days. Total work about 16 lead-days
(the research said 11.5; the difference is that F0d moves each door's authority instead of copying it).

### Parallel map

```text
Wave A:  [00 facts] [01 manifest]                         (start together)
Wave B:  [02 help] [03 decl] [04 admit] [05 fault] [06 lifecycle] [07 parity]   (after 00 + 01; 04/05/06 need only 00)
Wave C:  [08 routing + doors]                              (after 02,03,04,05,06)
Wave D:  [09 Node help retire] [10 Node fault client]      (09 after 07+08; 10 after 08)
Wave E:  [11 close]
```

Hot files, one writer at a time, in this order:

| File | Writers in order |
|---|---|
| `apps/fgos/src/main.rs` | 02 -> 08 |
| `apps/fgos/tests/cli_tests.rs` | 02 -> 08 |
| `scripts/export-command-selectors.mjs` | 01 -> 03 -> 08 |
| `src/cli/command-registry.mjs` | 01 -> 03 -> 08 |
| `packages/host-runtime/contracts/command-routes.json` (generated) | 03 -> 08 |
| `packages/host-runtime/contracts/command-manifest.json` (generated, new) | 01 (03 and 08 regenerate; bytes must not change) |
| `test/rust-host/command-routes.test.mjs` | 01 -> 03 -> 08 |
| `bin/fgos.mjs` | 01 -> 03 -> 09 |
| `test/rust-host/harness.mjs` | 07 -> 09 |
| `test/rust-host/help-routes.test.mjs` | 08 -> 09 |
| `test/cli/fgos-manifest.test.mjs` | 03 -> 09 |
| `test/cli/fgos-disconnected-worktree-guard.test.mjs` | 03 -> 11 |
| `packages/git/contracts/mutation-census.v1.json` (generated) | every phase regenerates its own; on rebase never hand-merge, rerun `node scripts/git-one-door-scan.mjs --root . --write-census` |

### Integration and landing

- Integration branch `rust-verb-migration-program/f0`, cut from `origin/main` when wave A starts.
  Each phase works in its own linked worktree on branch `rust-verb-migration-program/f0-pNN`, cut
  from the integration head when the phase starts, and is rebased onto it to land (fast-forward only).
- F0 lands on `main` as one series, after phase 11, by the big lead. Nothing of F0 reaches `main` alone:
  two transitional states exist only inside the branch (the route table carries both `native_kinds`
  and `native_subcommands` between 03 and 08; Node and the host both serve help between 02 and 09).
- Phases never edit `CHANGELOG.md` or `Cargo.lock`. A phase that finds it needs a new crate dependency
  edge (which changes `Cargo.lock`) stops and asks the F0 lead. Each phase report names the
  user-visible line it would add to `## [Unreleased]`; the big lead writes them at landing.

## Milestone: release v0.2.0-rc.9

Cut `v0.2.0-rc.9` after **both** F0 and the concurrent plan
`plans/261114-2051-capability-reads-one-door` have landed on `main` (in either order), and `npm test`,
`cargo test --workspace` and the release check are green on the merged head. The big lead confirms
no file of the "F0 file set" below is in the other plan's set before either lands; the "Collision
risk" section lists the files where a shared edit is possible.

## F0 file set (complete, for the overlap check)

Create:
- `apps/fgos/src/help.rs`, `apps/fgos/src/routing.rs`, `apps/fgos/src/invocation_doors.rs`
- `packages/host-runtime/contracts/command-manifest.json` (generated)
- `packages/git/rust/src/store_admission.rs`
- `packages/observe/rust/src/invocation_fault.rs`
- `packages/event-store/rust/src/lifecycle.rs`
- `test/rust-host/parity-cases/help.cases.mjs`, `test/rust-host/verb-parity.test.mjs`
- `test/rust-host/fixtures/store-declaration-vectors.json`
- reports under `plans/261114-2051-rust-verb-migration-program/reports/`

Modify:
- `apps/fgos/src/main.rs`, `apps/fgos/tests/cli_tests.rs`, `apps/fgos/tests/mailbox_routes.rs`
- `packages/distribution/rust/src/lib.rs`
- `packages/git/rust/src/lib.rs`, `packages/git/node-addon/src/git.rs`, `packages/git/node-addon/src/event_store.rs`
- `packages/observe/rust/src/lib.rs`, `packages/event-store/rust/src/lib.rs`
- `packages/process/rust/src/` (only if phase 08 must add a Windows detached-spawn door beside `mapped::spawn_detached`)
- `packages/host-runtime/contracts/command-routes.json` (generated), `packages/host-runtime/contracts/command-route-annotations.json`
- `packages/git/contracts/mutation-census.v1.json` (generated)
- `scripts/export-command-selectors.mjs`, `scripts/explain-command-route.mjs` (only if phase 08 finds it reads the help selectors or `native_kinds`)
- `src/cli/command-registry.mjs`, `bin/fgos.mjs`, `docs/architecture-manifest.json` (phase 09: drop the `src/cli/deprecation.mjs` row)
- `src/runner/hook.mjs` (delete one constant), `src/runner/worktree.mjs` (`admitStoreAccess`, `isSessionWorktree`)
- `src/observe/invocation-fault-log.mjs`, `src/state/fgos-file-registry.mjs` (only if the fault-log path loses its last Node reader)
- `src/event-store/maintenance.mjs`
- tests: `test/rust-host/command-routes.test.mjs`, `test/rust-host/help-routes.test.mjs`, `test/rust-host/harness.mjs`, `test/rust-host/harness.test.mjs`, `test/rust-host/internal-routes.test.mjs`, `test/cli/helpers/fgos-cli-harness.mjs`, `test/cli/fgos-manifest.test.mjs`, `test/cli/unknown-flag-rejection.test.mjs`, `test/cli/subcommand-flag-drift.test.mjs`, `test/cli/fgos-disconnected-worktree-guard.test.mjs`, `test/cli/fgos-claim-2.test.mjs`, `test/cli/fgos-gateway.test.mjs`, `test/cli/dispatch-operability.test.mjs`, `test/cli/run-verb.test.mjs`, `test/runner/worktree.test.mjs`, `test/event-store/triggers.test.mjs`, `test/event-store/lifecycle.test.mjs`, `test/observe/invocation-fault-log.test.mjs`, `test/state/fgos-logs-bucket.test.mjs` (only with the registry entry above), `test/suite-baseline.json` (rows of the two deleted test files), `test/event-store/background-seal.test.mjs` (run, edit only if it reads the moved policy)
- docs (phase 11 only): `docs/platform/host-invocation-routing/spec.md`, `.../contracts/command-route-descriptor.md`, `.../contracts/legacy-payload.md`, `docs/platform/agent-mailbox/spec.md`, `docs/platform/packaging-distribution/spec.md`, the Event Store, Observe and Git area specs' decision-history sections, `AGENTS.md` (the "Legacy-Node CLI Ownership Boundary" paragraph only), `docs/reading-map.md` (line 144), `scripts/check-decision-citation-drift.baseline.json` (only if the drift check asks)

Delete:
- `src/cli/deprecation.mjs` (its last reader is the Node help code)
- `test/cli/fgos-help.test.mjs`, `test/cli/fgos-verb-help-json.test.mjs` (owners named in phase 09)
- `test/rust-host/parity-cases/help.cases.mjs`, `test/rust-host/verb-parity.test.mjs` (created in 07, deleted in 09 with Node help; S2 re-adds the test file with its own table)

### Collision risk (with `plans/261114-2051-capability-reads-one-door`)

F0 touches **no file under `src/runner/execution/`, `src/runner/dispatch/` or `src/setup/`.**
Possible shared files, each with the hunk F0 changes:

| File | F0 change | Why the other plan might touch it | Mitigation |
|---|---|---|---|
| `src/runner/hook.mjs` | delete `NATIVE_HOOK_KINDS` (line 19) and its use | under `src/runner/`; it does not read `runner.capabilities` today | different hunk; rebase |
| `src/runner/worktree.mjs` | `admitStoreAccess` (547-578) becomes an adapter, `isSessionWorktree` (519-530) deleted | under `src/runner/`; does not read capabilities | different hunk; rebase |
| `src/cli/command-registry.mjs` | `nativeOnly` -> `native`, predicate fields -> data, `HELP_SELECTORS` removed, `publicManifest()` added | `plan-lint`, `workflow propose` and `workflow gate` descriptions name `runner.capabilities` (lines 1377, 2585, 2687) | different hunks; after either lands, regenerate `command-manifest.json` (its bytes carry those descriptions) |
| `bin/fgos.mjs` | help code deleted (3817-4006, main() help branches), `nativeOnly` refusal, `publicManifestEntries` import | its phase 05 ports the `plan-lint` arm (2358-2359, 2399) | different hunks; rebase |
| `docs/architecture-manifest.json` | phase 09 deletes the `src/cli/deprecation.mjs` row (line 225) | its phase 01 adds rows for new `.mjs` files and retiers `src/runner/operation-capability.mjs` | different rows; rebase |
| `docs/reading-map.md` | phase 11 edits the `command-registry.mjs` row (line 144) | its phase 06 edits the seat-binding row (line 158) | different rows; rebase |
| `packages/git/contracts/mutation-census.v1.json` | regenerated | regenerated by any product-file change | regenerate after the second landing |

Checked against `origin/plan/capability-reads-one-door` (its plan.md file-ownership table and phase files):
its only F0-shared code file is `bin/fgos.mjs` (`plan-lint` arm, lines 2358-2359 and 2399); it does not
touch `src/cli/command-registry.mjs`, `src/runner/worktree.mjs` or `src/runner/hook.mjs`. It edits
`test/architecture.test.mjs`, which F0 only runs.

## F0 exit criteria (measurable)

1. `fgos --help`, `fgos -h`, `fgos --help <verb> [<sub>]`, `fgos <verb> [<sub>] --help|-h [--json]`
   are answered by the host for all 80 selectors with no Node process (child spy shows none); output
   bytes equal the pre-F0 Node output for every case of the help table (evidence in phase 08's report);
   median wall time of `fgos --help --json` through the dev host within 5 ms of `fgos config show --json`.
2. `bin/fgos.mjs` has no help renderer; a direct `node bin/fgos.mjs ... --help` exits 4 with a pointer.
3. `command-routes.json` has no `native_kinds`, no `--help`/`-h` entries; the registry `native` field is
   the only source of "served natively" (no `nativeOnly`, no `NATIVE_HOOK_KINDS`).
4. Store admission, the invocation-fault record and the Event Store maintain policy each have one
   Rust owner; Node calls it; the host native lane calls it.
5. `run()` of the CLI test harness follows the route table; the help case table ran node-vs-host green
   before Node help was deleted.
6. Gates green on the integration head: `npm test`, `cargo test --workspace`, clippy `-D warnings`,
   `cargo fmt --all --check`, msvc and darwin checks, doc-health, decision-citation drift; the one-door
   scan count is not above phase 00's baseline.
7. No selector changed `route_kind` other than the two help selectors leaving the table.

## Risks (program level)

| Risk | L x I | Mitigation |
|---|---|---|
| Help bytes drift between Rust and Node renderers | M x H | exact-bytes help table node-vs-host before Node deletion (07, 08) |
| Two lanes judging one invocation differently during the window | M x H | shared vector fixtures read by both languages (invocation root exists; store declarations added in 03) |
| Parallel phases colliding on generated files | H x L | generated files are regenerated, never hand-merged (table above) |
| Doors wired in the host with no native consumer until S2 | M x M | module-level Rust proofs in 08; S2's first store verb adds the binary wiring proof |
| F0 slips the rc.9 cut | M x M | rc.9 waits for both plans; F0 lands as one series |

Rollback: F0 lands as one series; revert the series. No data format changes: the fault log, Event
Store and `.fgos/` layouts are unchanged, so an older release reads everything F0 wrote.

## Owner questions (batch)

None blocks F0. Each is asked when its step starts, in the decision-question template.

### Q1 (asked at S1 entry): native Rust hooks — supersede decision 76(b)?

- **What is happening:** the delete guard (`hook main-checkout-delete-guard`) and `hook decision-question`
  run in Node through the host: about 116-133 ms per call. The guard fires on about 30 % of agent Bash
  calls (9,210 of 31,000 in 22 sessions, about 17 minutes of agent wait).
- **Cause:** HARDEN decision 76(b) (2026-11-09) says "no native Rust hook unless a CLI cannot carry it".
  It predates this program. The verdicts are pure (`src/state/decision-question.mjs` 160 lines,
  `src/git/main-checkout-delete-guard.mjs` 505 lines) and the native hook lane already exists (`hook mailbox`).
- **Options:**
  - (a) Supersede 76(b) for this program: S1 ports both verdicts, about 5 lead-days; the guard's judge gets one shared vector file. Gain about 110 ms on each guarded call in every project.
  - (b) Keep 76(b): hooks stay in Node; cost stays per call; the in-process fix lowers it to about 55-70 ms at best.
- **Recommendation:** (a). Pure verdicts, existing lane, largest measured per-call saving.
- **Scope of the answer:** the two hook kinds now; `dispatch-decide` follows when S5 lands. Not other hooks.

### Q2 (asked at S4 entry): how far does "Windows without Node" go?

- **What is happening:** after F0+S4 a Node-free install, diagnose and hook set is reachable. A
  Node-free product needs S6 (runner and workflow), because skills and users call `run`, `workflow`, `dispatch`.
- **Cause:** the runner (about 43k Node lines) sits under `run`, `workflow` and most of `dispatch`; the
  release manifest's `requires.node` makes `fgctl init` refuse without Node today
  (`packages/distribution/rust/src/init.rs`, `check_node_requirement`).
- **Options:**
  - (a) Node-free install/diagnose/hooks only: make `requires.node` per route (contract 4), host refuses a legacy route by name when Node is absent, plus a doctor row. About 2 days; projects still need Node to run tasks.
  - (b) Keep Node required everywhere until S6. No cost now; no Windows benefit before S6.
  - (c) Commit S6 now as Node-free product scope: 60-120 lead-days after S5.
- **Recommendation:** (b) now; decide (c) with S5's measured port pace. (a) alone ships an install that cannot run a task.
- **Scope of the answer:** program scope and the `requires.node` packaging contract. The order is unchanged.

### Q3 (asked at S4 entry): hybrid native `init`/`doctor` with one Node sub-step?

- **What is happening:** `init` (Work store rebuild) and `doctor` (rows that judge Node-owned
  components) cannot be fully native until S7, but they sit on the install path.
- **Cause:** host spec §5 forbids routing legacy work through the native kernel; the only named bridge
  (migration doc §7.4) is for the gateway.
- **Options:**
  - (a) One "Node semantic bridge" contract (structured output, never parsed `fgos.v1`), deleted with its last user. About 2 days inside S4; two paths live during the window.
  - (b) No bridge: `init`/`doctor` stay legacy until their components move (after S7).
- **Recommendation:** (a) only if Q2 is (a) or (c); with Q2 = (b) take (b).
- **Scope of the answer:** `init` and `doctor` only; no other verb gets a bridge before S6.

## Unresolved (for the F0 lead, settled by phase 00)

Listed in phase 00 as U1-U7; none changes the phase split.
