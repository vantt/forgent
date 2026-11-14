---
title: "Rust verb migration program (F0 through S7)"
description: "Move the legacy-Node CLI verbs onto the Rust host, foundations first, one layer at a time, retiring each Node path in the same change."
status: pending
priority: P1
effort: 19d (F0 only; S1-S7 sized when each starts)
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

## One-door guard (every step)

Only Git has a mechanical one-door guard today (`scripts/git-one-door-scan.mjs` and its census). F0
phase 01 adds a general one: a `doors` table in `docs/architecture-manifest.json`, checked by
`test/architecture.test.mjs` (no new tool). Each row names a job, the text patterns that do that job
(a function name, a file name, a literal), and the only product files allowed to contain them. The test
scans every product file in Node, Rust and scripts (`bin/`, `src/`, `scripts/`, `apps/`, `packages/`,
`.githooks/`; test files, `tests/` directories and fixtures excluded) and fails when a pattern appears
outside its allowed files (a second path, now or later) or when an allowed file no longer matches (a
stale row). A row with no allowed file marks a retired name. A row allowing a Node and a Rust file at
once (a twin kept during the migration) must carry its reason and the step that retires it.

**Exit criterion of every step F0-S7:** the step's jobs have `doors` rows that fail on any other path
in the repository, including the old Node path the step retired; Git jobs stay on the Git scan, whose
count must not rise. F0's concrete rows are written in phase 01 (the mechanism and its first row) and
phase 08 (the rest); phase 09 adds the retired help names.

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
| **F0** host foundations | Host owns help; route data names a native sub-verb; parity lane; the cross-cutting doors (invocation root, argument parse, store admission, fault record, Event Store maintain) have one Rust owner or a proven twin; one-door guard exists | none flipped (help door moves) | see "F0 file set" | this plan approved | see "F0 exit" | T9 `main()` doors settled (on main) | none |
| **S1** hook verdicts | `hook decision-question` and `hook main-checkout-delete-guard` run natively | `hook` kinds | `src/runner/hook.mjs`, `src/state/decision-question.mjs`, `scripts/main-checkout-delete-guard-hook.mjs`, `src/git/main-checkout-delete-guard.mjs` | F0 landed; **Q1 answered yes** | both kinds in the registry `native` list of `hook`; Node verdict code deleted; shared vector file read by Rust tests; `doors` rows for both verdicts | F0 | **Q1 asked here** |
| **S2** T0-T2 verbs | `lock`, `lock-status`, `git`, `worktree` native | 4 | `src/runner/lock-status.mjs`, `src/runner/lock-fence.mjs`, `src/git/status.mjs`, `src/verbs/worktree/*` | F0 landed | each verb native; Node arm, use case and their tests retired; the first store-touching native verb proves the F0 doors through the binary; `doors` rows per verb | F0 | none |
| **S3** T3 verbs | `events`, `session`, `gateway`, `agents` native | 4 | `src/verbs/events/*`, `src/runner/session.mjs`, `src/runner/gateway-control.mjs`, `src/runner/agent-listing.mjs` | F0 landed; runs beside S2 with a file split agreed in both plans | as S2 | F0 | none |
| **S4** packaging | retire `setup`; native `wire-agents`, `uninstall`, `init`, `doctor` | 5 | `src/setup/setup-use-case.mjs`, `src/setup/agent-wiring.mjs`, `src/setup/uninstall-project.mjs`, `src/verbs/state/init.mjs`, `src/setup/checks.mjs`, `src/setup/registrations.mjs`, `packages/distribution/rust/src/init.rs` | S2+S3 landed; **Q2, Q3 answered** | `setup` gone; the other four native or hybrid per Q3; `requires.node` per Q2 with its doctor row; `doors` rows (doctor row registry, init steps) | S2, S3 | **Q2, Q3 asked here** |
| **S5** Execution read door | `bind()` and the executor model in Rust; `dispatch decide`/`explain`, `hook dispatch-decide`, `tool` native | 3 | `src/runner/execution/bind.mjs`, `src/runner/dispatch/decide.mjs`, `src/runner/dispatch/config.mjs`, `src/state/tool-registry.mjs`, `src/runner/dispatch/hook.mjs` | S4 landed; executor-model contract written (Execution owns it) | one `bind()`; a `doors` row allowing only the Rust `bind` plus the remaining Node callers, named with S6a as their owner | S4 | none (S6 scope follows Q2) |
| **S6a** Execution | runner core, remaining `dispatch` subs, `run`, `fgos-runner` entry | 3 | `src/runner/execution/**`, `src/runner/dispatch/**`, `src/run-supervisor/**` (Node side) | S5 landed | tier-5 Node deleted; `doors` rows retire every tier-5 Node name | S5 | scope per Q2 |
| **S6b** Workflow | `workflow` | 1 | `src/workflow/**` | S6a landed | tier-6 Node deleted; `doors` rows | S6a | none |
| **S7** Work | Work core (replay first, writers with the §11 gates), about 52 Work and Knowledge arms, tier-7 rest of `src/runner` (`work-dispatch.mjs`, `fanout-batch.mjs`, `work-compat.mjs`, `merge.mjs`, ...), knowledge/docs verbs | ~52 | `src/state/**`, `src/intake/**`, `src/report/**`, `src/verbs/state/**`, `src/runner/*.mjs` tier 7 | S6b landed; Work council (decision 78) held | zero `legacy-cli` routes; migration doc §12 removal gates; every F0 twin row (argument parse, invocation fault) retired | S6b | Work council |

S1 is the one step allowed to run beside another: its files (`hook` registry entry, hook verdict
modules, a new host hook handler) do not overlap S2-S7. If S1 starts while F0's phase 08 is open, it
waits: both touch `apps/fgos/src/main.rs` and `routing.rs`.

## F0 phases

| # | Phase | Wave | Blocked by | Effort | File |
|---|---|---|---|---|---|
| 00 | Facts and baselines | A | - | 0.5d | [phase-00-facts-and-baselines.md](phase-00-facts-and-baselines.md) |
| 01 | Manifest artifact and one-door guard | A | - | 1d | [phase-01-manifest-artifact.md](phase-01-manifest-artifact.md) |
| 02 | Host help door | B | 00, 01; lands after 10 | 2d | [phase-02-host-help-door.md](phase-02-host-help-door.md) |
| 03 | Native and store declarations as data | B | 00, 01 | 1.5d | [phase-03-native-and-store-declarations.md](phase-03-native-and-store-declarations.md) |
| 04 | Worktree-tier doors: invocation root and store admission | B | 00 | 2.5d | [phase-04-store-admission-authority.md](phase-04-store-admission-authority.md) |
| 05 | Invocation-fault record: Rust writer, shared contract | B | 00 | 1d | [phase-05-invocation-fault-authority.md](phase-05-invocation-fault-authority.md) |
| 06 | Event Store maintain and config authority | B | 00 | 2.5d | [phase-06-event-store-lifecycle-authority.md](phase-06-event-store-lifecycle-authority.md) |
| 07 | Parity lane | B | 00, 01; lands after 03 | 1.5d | [phase-07-parity-lane.md](phase-07-parity-lane.md) |
| 10 | Rust argument parser, shared contract | B | 00 | 1d | [phase-10-rust-argument-parser.md](phase-10-rust-argument-parser.md) |
| 08 | Host routing, doors and F0 guard rows | C | 02, 03, 04, 05, 06, 10 | 3d | [phase-08-host-routing-and-doors.md](phase-08-host-routing-and-doors.md) |
| 09 | Node help retirement | D | 07, 08 | 1.5d | [phase-09-node-help-retirement.md](phase-09-node-help-retirement.md) |
| 11 | F0 close: docs, proof consolidation, gates | E | all | 1d | [phase-11-f0-close.md](phase-11-f0-close.md) |

Critical path: 01 -> 02 -> 08 -> 09 -> 11, about 8.5 lead-days. Total work about 19 lead-days (the
research said 11.5; the difference is that each door's authority moves instead of being copied, and the
root and argument-parse doors the research counted as shared are not equivalent yet).

### Parallel map

```text
Wave A:  [00 facts] [01 manifest + guard]                                        (start together)
Wave B:  [02 help] [03 decl] [04 root+admit] [05 fault] [06 maintain] [07 parity] [10 argv]
         (04/05/06/10 need only 00; 02/03/07 need 00+01; 02 lands after 10; 07 lands after 03)
Wave C:  [08 routing + doors + F0 guard rows]
Wave D:  [09 Node help retirement]
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
| `test/rust-host/command-routes.test.mjs` | 01 -> 03 -> 08 -> 09 |
| `bin/fgos.mjs` | 01 -> 03 -> 09 |
| `docs/architecture-manifest.json` | 01 -> 08 -> 09 |
| `test/architecture.test.mjs` | 01 -> 09 |
| `test/cli/fgos-manifest.test.mjs` | 01 -> 03 -> 09 |
| `test/rust-host/harness.mjs` | 07 -> 09 |
| `test/rust-host/help-routes.test.mjs` | 08 -> 09 |
| `test/cli/fgos-disconnected-worktree-guard.test.mjs` | 03 -> 11 |
| `packages/git/node-addon/src/*.rs` | `git.rs`: 04 only; `event_store.rs`, `config.rs`: 06 only |
| `packages/git/contracts/mutation-census.v1.json` (generated) | every phase regenerates its own; on rebase never hand-merge, rerun `node scripts/git-one-door-scan.mjs --root . --write-census` |

### Integration and landing

- Integration branch `rust-verb-migration-program/f0`, cut from `origin/main` when wave A starts.
  Each phase works in its own linked worktree on branch `rust-verb-migration-program/f0-pNN`, cut
  from the integration head when the phase starts, rebased onto it to land (fast-forward only).
- F0 lands on `main` as one series, after phase 11, by the big lead. Nothing of F0 reaches `main` alone:
  two transitional states exist only inside the branch (the route table carries both `native_kinds`
  and `native_subcommands` between 03 and 08; Node and the host both render help between 02 and 09).
- Each phase runs every test file that imports or reads a file it changes (`rg -l <symbol|file> test`),
  not only its owning test, so a break does not wait for phase 11's full suite.
- Phases never edit `CHANGELOG.md` or `Cargo.lock`. A phase that needs a new crate dependency edge
  stops and asks the F0 lead. Each phase report names the user-visible line it would add to
  `## [Unreleased]`; the big lead writes them at landing.

## Milestone: release v0.2.0-rc.9

Cut `v0.2.0-rc.9` after **both** F0 and the concurrent plan
`plans/261114-2051-capability-reads-one-door` have landed on `main` (in either order), and `npm test`,
`cargo test --workspace` and the release check are green on the merged head. The big lead confirms
no file of the "F0 file set" below is in the other plan's set before either lands; the "Collision
risk" section lists the files where a shared edit is possible.

## F0 file set (complete, for the overlap check)

Create:
- `apps/fgos/src/help.rs`, `apps/fgos/src/routing.rs`, `apps/fgos/src/invocation_doors.rs`
- `packages/host-runtime/rust/src/cli_args.rs`
- `packages/host-runtime/contracts/command-manifest.json` (generated)
- `packages/git/rust/src/store_admission.rs`, `packages/git/rust/src/invocation_root.rs`
- `packages/observe/rust/src/invocation_fault.rs`
- `packages/event-store/rust/src/lifecycle.rs` (and, if phase 06 moves the store constructor out of the addon, the crate module that receives it)
- `packages/config/rust/src/` event-store section reader (one module; phase 06 names it)
- `test/rust-host/parity-cases/help.cases.mjs`, `test/rust-host/verb-parity.test.mjs` (both deleted again in 09)
- `test/rust-host/fixtures/store-declaration-vectors.json`, `test/rust-host/fixtures/parse-args-vectors.json`, `test/rust-host/fixtures/invocation-fault-vectors.json`
- `test/cli/parse-args-vectors.test.mjs`
- reports under `plans/261114-2051-rust-verb-migration-program/reports/`

Modify:
- `apps/fgos/src/main.rs`, `apps/fgos/src/cli_projector.rs`, `apps/fgos/src/wiring/mailbox_hook.rs`, `apps/fgos/src/wiring/mailbox_config.rs`, `apps/fgos/tests/cli_tests.rs`, `apps/fgos/tests/mailbox_routes.rs`
- `packages/host-runtime/rust/src/lib.rs`, `packages/distribution/rust/src/lib.rs`
- `packages/git/rust/src/lib.rs`, `packages/git/node-addon/src/git.rs`, `packages/git/node-addon/src/event_store.rs`, `packages/git/node-addon/src/config.rs`
- `packages/observe/rust/src/lib.rs`, `packages/event-store/rust/src/lib.rs`, `packages/config/rust/src/lib.rs`
- `packages/host-runtime/contracts/command-routes.json` (generated), `packages/host-runtime/contracts/command-route-annotations.json`
- `packages/git/contracts/mutation-census.v1.json` (generated)
- `scripts/export-command-selectors.mjs`, `scripts/test-proof-inventory.mjs` (`cliCost` help probe), `scripts/explain-command-route.mjs` (only if phase 00 finds it reads the help selectors or `native_kinds`)
- `src/cli/command-registry.mjs`, `bin/fgos.mjs`, `docs/architecture-manifest.json`
- `src/runner/hook.mjs` (one constant), `src/runner/worktree.mjs` (`admitStoreAccess`, `isSessionWorktree`), `src/runner/paths.mjs` (`resolveInvocationRoot` becomes an adapter)
- `src/observe/invocation-fault-log.mjs` (only if a shared vector row shows Node disagrees)
- `src/event-store/maintenance.mjs`, `src/event-store/config.mjs`
- tests: `test/architecture.test.mjs`, `test/rust-host/command-routes.test.mjs`, `test/rust-host/help-routes.test.mjs`, `test/rust-host/harness.mjs`, `test/rust-host/harness.test.mjs`, `test/rust-host/internal-routes.test.mjs`, `test/rust-host/invocation-root-table.test.mjs`, `test/rust-host/fixtures/invocation-root-table.json` (rows for the policies), `test/cli/helpers/fgos-cli-harness.mjs`, `test/cli/fgos-manifest.test.mjs`, `test/cli/unknown-flag-rejection.test.mjs`, `test/cli/subcommand-flag-drift.test.mjs`, `test/cli/fgos-disconnected-worktree-guard.test.mjs`, `test/cli/dispatch-retired-doors.test.mjs` (only if the hook refusal text changes), `test/cli/fgos-claim-2.test.mjs`, `test/cli/fgos-gateway.test.mjs`, `test/cli/dispatch-operability.test.mjs`, `test/cli/run-verb.test.mjs`, `test/cli/command-registry.test.mjs` and `test/rust-host/release-tree.test.mjs` (only where they read help through Node), `test/runner/worktree.test.mjs`, `test/runner/session.test.mjs`, `test/event-store/triggers.test.mjs`, the Event Store config test phase 06 names, `test/observe/invocation-fault-log.test.mjs`, `test/suite-baseline.json` (rows of the two deleted test files)
- docs (phase 11 only): `docs/platform/host-invocation-routing/spec.md`, `.../contracts/command-route-descriptor.md`, `.../contracts/legacy-payload.md`, `docs/platform/agent-mailbox/spec.md`, `docs/platform/packaging-distribution/spec.md`, `docs/platform/observe/spec.md` and `docs/platform/observe/decisions/observe-component-architecture.md` (`nativeOnly` mentions), the Event Store, Observe, Config and Git area specs' decision-history sections, `AGENTS.md` (the "Legacy-Node CLI Ownership Boundary" paragraph only), `docs/reading-map.md` (line 144 and rows for the new source paths), `docs/platform/architecture-map.md` (one paragraph on the `doors` table), `scripts/check-decision-citation-drift.baseline.json` (only if the drift check asks)

Delete:
- `src/cli/deprecation.mjs` (its last reader is the Node help code)
- `test/cli/fgos-help.test.mjs`, `test/cli/fgos-verb-help-json.test.mjs` (owners named in phase 09)
- `test/rust-host/parity-cases/help.cases.mjs`, `test/rust-host/verb-parity.test.mjs` (created in 07, deleted in 09 with Node help; S2 re-adds the test file with its own table)

Read-only checks (not edited): `src/setup/registrations.mjs:467-472` and `src/setup/shell-rc.mjs:122`
(the doctor probe runs `fgos --help`, which keeps working through the Node forwarder of phase 09).

### Collision risk (with `plans/261114-2051-capability-reads-one-door`)

F0 touches **no file under `src/runner/execution/`, `src/runner/dispatch/` or `src/setup/`.**
Checked against `origin/plan/capability-reads-one-door` (its plan.md file-ownership table and phase
files). Shared or possibly shared files, each with the hunk F0 changes:

| File | F0 change | The other plan | Mitigation |
|---|---|---|---|
| `bin/fgos.mjs` | help code deleted (3817-4006, `main()` help branches) and replaced by a forwarder, `nativeOnly` refusal, `publicManifestEntries` import | its phase 05 ports the `plan-lint` arm (2358-2359, 2399) | different hunks; rebase |
| `test/architecture.test.mjs` | phase 01 adds the `doors` check; phase 09 drops `src/cli/deprecation.mjs` from `ARM_STATIC_IMPORTS` (1757) | its phase 06 adds a guard | different hunks; rebase |
| `docs/architecture-manifest.json` | `doors` key (01, 08, 09); drop the `src/cli/deprecation.mjs` row (09) | its phase 01 adds rows for new `.mjs` files, retiers `src/runner/operation-capability.mjs` | different keys and rows; rebase |
| `docs/reading-map.md` | phase 11 edits line 144 and adds rows for new source paths | its phase 06 edits line 158 | different rows; rebase |
| `src/runner/hook.mjs`, `src/runner/worktree.mjs`, `src/runner/paths.mjs` | one constant; the admission and root functions become adapters | not in its file set (none reads `runner.capabilities`) | none needed |
| `src/cli/command-registry.mjs` | `nativeOnly` -> `native`, predicates -> data, `HELP_SELECTORS` out, `publicManifest()` in | not in its file set; but descriptions at 1377, 2585, 2687 name `runner.capabilities` | if it later edits those strings, regenerate `command-manifest.json` |
| `packages/git/contracts/mutation-census.v1.json` | regenerated | regenerated by any product change | regenerate after the second landing |

## F0 exit criteria (measurable)

1. `fgos --help`, `fgos -h`, `fgos --help <verb> [<sub>]`, `fgos <verb> [<sub>] --help|-h [--json]`
   are answered by the host for all 80 selectors: a PATH `node` wrapper records zero Node starts over
   every help form (phase 02 test); output bytes equal the pre-F0 Node output for every case of the help
   table (phase 08 report); median wall time of `fgos --help --json` within 5 ms of `fgos config show --json`.
2. `bin/fgos.mjs` has no help renderer; a direct `node bin/fgos.mjs ... --help` is forwarded to the
   host found by `resolveHostBin`, or exits 4 with a pointer when there is none.
3. `command-routes.json` has no `native_kinds`, no `--help`/`-h` entries; the registry `native` field is
   the only source of "served natively" (no `nativeOnly`, no `NATIVE_HOOK_KINDS`).
4. Invocation root, store admission and the Event Store maintain policy and config each have one Rust
   owner that Node calls through the addon and the host calls in process. The argument parser and the
   invocation-fault writer are twins (one per language while both CLIs run), each proven equal by one
   shared vector file read by both languages, both retired at S7.
5. `run()` of the CLI test harness follows the route table; the help case table ran node-vs-host green
   before Node help was deleted.
6. `doors` rows exist for every F0 job and pass on the integration head; the check's own unit cases show
   that a pattern outside its allowed files, and a stale allowed file, both fail.
7. Gates green on the integration head: `npm test`, `cargo test --workspace`, clippy `-D warnings`,
   `cargo fmt --all --check`, msvc and darwin checks, doc-health, decision-citation drift; the Git
   one-door scan count is not above phase 00's baseline.
8. No selector changed `route_kind` other than the two help selectors leaving the table.

## Risks (program level)

| Risk | L x I | Mitigation |
|---|---|---|
| Help bytes drift between Rust and Node renderers | M x H | exact-bytes help table node-vs-host before Node deletion (07, 08) |
| Two lanes judging one invocation differently during the window | M x H | one Rust owner for root and admission; shared vectors for the parser and the store declarations |
| Parallel phases colliding on generated files | H x L | generated files are regenerated, never hand-merged (table above) |
| Doors wired in the host with no native consumer until S2 | M x M | module-level Rust proofs in 08; S2's first store verb adds the binary wiring proof |
| One door regressing after F0 | M x H | `doors` rows in `test/architecture.test.mjs`, extended by every step |
| F0 slips the rc.9 cut | M x M | rc.9 waits for both plans; F0 lands as one series |

Rollback: F0 lands as one series; revert the series. No data format changes: the fault log, Event
Store and `.fgos/` layouts are unchanged, so an older release reads everything F0 wrote.

## Red Team Review

### Session — 2026-11-14
**Findings:** 35 raw from 4 reviewers (Failure Mode, Assumption Destroyer, Scope and Complexity,
Security), merged to 15 (13 accepted, 2 rejected). **Severity:** 2 Critical, 10 High, 3 Medium.

| # | Finding | Severity | Disposition | Applied to |
|---|---|---|---|---|
| 1 | Host root walk is not Node's `resolveInvocationRoot` (policies, Git ceiling, `found`); no root door | Critical | Accept: the root decision moves into `fgos-git` beside admission | 04, 08 |
| 2 | Predicate shapes and help words depend on `parseArgs`; Rust has no equal parser; boolean `=== true` vs present | Critical | Accept: Rust parser twin + shared vectors; boolean/valued shape rule; `declared` tolerates missing flags | 10, 03, 02, 08 |
| 3 | Fault route incompatible with `invokeHost`; Node would lose the record of a host failure (`friction-client.mjs:36-50`) | High | Accept: no route; Node keeps its writer (it must record the host's absence), Rust writer for the host, one shared vector file; the old phase 10 replaced | 05, 08 |
| 4 | `spawn_detached` is unix-only; the Event Store runs on Linux only | High | Accept: triggers run only where the Event Store runs; no Windows spawn | 08 |
| 5 | Host-spawned sync child inherits `FGOS_RUST_HOST_RECURSION_GUARD` and dies silently | High | Accept: strip it from the child env, Rust test | 08 |
| 6 | `maintain` lacks the store-construction inputs; the Event Store config refusal rule would be copied | High | Accept: constructor and config reader move to their crates | 06, 08 |
| 7 | Existing host sync-due rule in the mailbox hook (third copy) | High | Accept: phase 00 finds it, phase 06 decides one owner or records why the jobs differ | 00, 06 |
| 8 | `isSessionWorktree` imported by `test/runner/session.test.mjs` | High | Accept: cases move to the Rust owner; file added | 04 |
| 9 | `fgos-manifest.test.mjs` drift guard anchors on `publicManifestEntries`; `ARM_STATIC_IMPORTS` lists `deprecation.mjs` | High | Accept | 01, 09 |
| 10 | Merged hook refusal changes exit 1 to 4 (`dispatch-retired-doors.test.mjs:157`) | High | Accept: two refusals behind one registry lookup | 03 |
| 11 | Node door order traced wrong; the fault-log target depends on it | High | Accept: corrected order and a parity vector | 08 |
| 12 | "No Node for help" unobservable (the shim has no `node`) | High | Accept: PATH `node` wrapper proof; `node` added to the shim | 02, 07 |
| 13 | Refusing help on the Node channel breaks shell tiers 1-3 and the doctor probe; `cliCost` would time the refusal | Medium | Accept: Node forwards help to the host; `cliCost` measures the host | 09 |
| 14 | Forged `.fgos` symlink diverts the fault log | Medium | Reject: every store write follows `.fgos` by design (session worktrees are symlinks, `worktree.mjs:519-530`); the log adds no reach. The caller-supplied path concern left with the removed route | - |
| 15 | Defer host door wiring to S2 (no native consumer in F0) | Medium | Reject: owner-approved F0 item (d) "done once"; S2 and S3 run in parallel and would both edit `main.rs`. Kept small: no route, twins named | - |

Also accepted without a row: lazy Git facts and enumerated symlink cases (04), unknown-flag message
redaction in the Rust record (05; the same leak in Node `flag-check.mjs:45-52` is listed below as a
separate item), direct help spawners listed by phase 00, docs consumers of removed names (11).

### Whole-Plan Consistency Sweep
- Files reread: plan.md, phase-00 to phase-11 (phase-10 is now the argument parser).
- Decision deltas checked: 9 (root door, parser twin, fault twin without route, Linux-only triggers,
  recursion guard, config owner, sync-due owner, help forwarder, `doors` guard).
- Reconciled stale references: the `invocation-fault` internal route, the `invokeHost` client and the
  old phase 10 removed everywhere; `spawn_detached` Windows text replaced; Node door order corrected.
- Unresolved contradictions: 0.

## Validation Log

### Verification Results
- Tier: Full (12 phases). Claims checked: 64 (reviewers 24 + 40 planner spot checks).
- Verified: 58 | Failed: 6, all fixed (`recordInvocationFault` at :89, `STORE_MISSING` at :531,
  `isMainWorktree` at :508, two test files that do not exist, the addon `resolveRepo` arm returns no
  `worktreeRoot`) | Unverified: none untagged (U1-U8 in phase 00).
- No owner interview: per the common rules the planner decides what evidence settles and batches the
  rest below. Decided here: Node help forwards instead of refusing; parser and fault writer are twins
  with shared vectors; the guard is a `doors` table in the architecture test.

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

## Items for the big lead (outside F0 scope)

- Node `src/cli/flag-check.mjs:45-52` puts a `--flag=value` token, value included, into the unknown-flag
  message, which `recordInvocationFault` stores; a secret passed that way reaches the fault log. Separate item.
- `src/util/capped-jsonl-log.mjs` keeps two non-F0 readers (`src/observe/approve-fault-log.mjs`,
  `src/runner/dispatch/provider-capacity.mjs`); they move with S7 and S6a.
