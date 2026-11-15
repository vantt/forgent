---
title: "Rust verb migration S2 (lock, lock-status, git) and S3 (events, session, gateway)"
description: "Move eight legacy-Node verbs onto the Rust host in two parallel steps, one Rust owner per job, Node arms and their tests retired in the same change."
status: pending
priority: P1
effort: 23d
branch: cook/s2s3-plan
tags: [refactor, infra, host, rust, migration]
blockedBy: []
blocks: []
created: 2026-11-15
---

# Rust verb migration S2 and S3

Detailed plan for steps S2 and S3 of the program
[`plans/261114-2051-rust-verb-migration-program/plan.md`](../261114-2051-rust-verb-migration-program/plan.md)
(rows S2, S3; Outcome, One-door guard, Order). F0 is on `main` at `8d2968b3c`; every `file:line` below was
re-read on `origin/main` `e6b78d1d1`. Shape copied from F0: a facts phase first, file-disjoint phases with a
parallel map, a `doors` row as every port's exit, the Node path and its tests deleted in the same change.
Owner questions are labelled `S23-Qn` so they never read as the program's Q1-Q3.

## Outcome

`lock`, `lock-status`, `git` (S2) and `events`, `session`, `gateway` (S3) run in the Rust host with no Node
process; `worktree` and `agents` are not in S2/S3: the owner answered S23-Q1 = (b), so they move to S6a and S5.
Each port moves a whole use case into its Rust owner, deletes the Node arm, the Node use case and the tests whose
behaviour now has a Rust owner, and ends with a `doors` row that fails on any second path.

Non-goals (program): no new verb, flag or behaviour (RUL104); no dual-run of a write (migration doc §11:
`docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md:367-382`); no change to the
`fgos.v1` envelope or the exit-code table; no change to any on-disk format (`sessions.json`, `gateway.json`,
hot records, the beacon, Event Store) that an older release could not read.

Accepted behaviour changes (decided here, each in the phase that makes it and in `CHANGELOG.md` at landing):
- a missing or unknown sub-command of a ported verb is refused with the host's one text
  (`<verb> requires a subcommand. Available: ...`, `apps/fgos/src/routing.rs:248-292`), exit 4; Node's per-verb
  texts (`bin/fgos.mjs:291-294`, the `events`, `git`, `session` texts) go;
- a malformed call of a ported verb (unknown flag, missing or unknown sub-command, a refused root, an admission
  refusal) is recorded in `.fgos/logs/invocation-faults.jsonl`, as F0 did for today's native verbs; a verb's own
  refusal is not recorded (as in Node);
- `.fgos/sessions.json` is written atomically (Durable File) instead of `writeFileSync` (`src/runner/session.mjs:164-167`);
- whatever the owner picks in S23-Q3 (`lock fence` confirmation); `gateway start` is refused off Unix (S23-Q4, decided by evidence).

## Decisions taken in this plan (evidence in the phase named)

| # | Decision | Why | Phase |
|---|---|---|---|
| D1 | Parity compares the host with the step's **base release**, never with this tree's Node; the runner and tables live only on step branches | after a flip Node refuses the verb (`bin/fgos.mjs:4068-4071`); a runner with no table on `main` would be a test with no case | 01, 11, 12 |
| D2 | Ported verbs read their call only through the shared parser; the eight pre-F0 native verbs keep their own reading through one list, `PRE_DOOR_NATIVE_VERBS` (exact-set test) | keeps each ported verb equal to Node; makes the pre-door debt one visible list | 01, 13 |
| D3 | One categorised refusal outcome in the host (category -> `exit_codes`, text `fgos: <msg>`) | today every provider error exits 1 with `fgos: error:` (`apps/fgos/src/cli_presenter.rs:57-76`); Node exits 2/3/4/7 | 01 |
| D4 | A root decision never creates the state root | `read_repo_facts` -> `GitDriver::topology_at` -> `GitDriver::new` creates it (`packages/git/rust/src/driver.rs:266-273, 359-365`); Git spec §20 forbids it for a detached child | 01 |
| D5 | Hot record read and compare-and-clear get one owner, the holder-lock crate; Node's functions call it | holder-lock spec §15 owns the hot mutex and `hot-lock.v1.json`: a lower-layer contract, unlike the Execution modules S23-Q1 moved out | 03 |
| D6 | `lock-status`'s run-scoped instances are listed by the host (it links the Execution-side crates) and passed into `holder-lock::status`; a twin of the three Node listers with one fixture, debt `retiredBy` S6a | holder-lock may not know Execution layouts; `fgos-run-supervisor` depends on holder-lock, so the reverse call is a cycle | 04 |
| D7 | The session registry's owner is a host module; Node's `listSessions` becomes a client of the host verb (`invokeHost`); identity stays an allowed read-only reader | the registry is runner state, not a Git fact (`docs/platform/git/spec.md:66, 70`); `invokeHost` is the established Node-to-native pattern (`src/convention/convention-client.mjs:21`) | 08 |
| D8 | Gateway control is a host module (the recursion-guard fix is made outside the port, `cook/gateway-guard-fix`) | only the host uses it after the flip; a guarded child cannot call legacy verbs (`apps/fgos/src/legacy_exec.rs:249`, `main.rs:283`) | 09 |
| D9 | Event Store children start the host binary from both lifecycle wrappers; Node's `event-store-child` branch goes with `events` | Node would refuse a native `events` child | 07 |
| D10 | Crate edges approved with this plan: `apps/fgos` -> `fgos-durable-file` (08, 09); `self_chain` moves from the addon into `fgos-process` (05, no new edge). The step lead commits each `Cargo.lock` change alone | the plan's own "new edge = stop" rule, settled once | 05, 08, 09 |
| D11 | S2 lands on `main` before S3 | S2 carries the first store-touching wiring proof (program risk row) | landing |

## Phase-lead rules (every phase)

- Repo `/home/vantt/projects/forgent` on fg-server2. Read `AGENTS.md`, `docs/reading-map.md`, this plan, then the phase file.
- Branches: shared phases `rust-verb-migration-program/s23-pNN`; S2 phases `rust-verb-migration-program/s2-pNN` cut from the
  integration branch `rust-verb-migration-program/s2`; S3 phases `.../s3-pNN` from `.../s3`. Worktree
  `/home/vantt/projects/forgent-worktrees/rvm-<s23|s2|s3>-pNN` created with `/usr/bin/git worktree add -b <branch> <path> <base>`;
  assert the path is in `git worktree list` before any destructive step.
- `export CARGO_TARGET_DIR=/home/vantt/projects/forgent-worktrees/rvm-<id>-target` (ext4, never `/tmp`); delete it when the phase lands.
  The parity base build of a step uses its own target, `rvm-<s2|s3>-base-target`, never a phase's (a shared target broke
  the F0 close review: E0061 and `git-addon-not-shipped`); the close phase deletes it.
- Tests: `node scripts/run-tests.mjs <files>` (focused). Ask the step lead before `npm test` or `cargo test --workspace`.
  Run every test that imports or reads a file you change (`rg -l <symbol|file> test apps packages`).
- No plan ids, phase numbers or finding codes in code, test names or commits. No env switch or test-only branch.
- Before each commit `/usr/bin/git diff --cached --stat`; explain any large deletion; stage explicit paths; never `git stash`.
- Push at least every 30 minutes. Never push to `main`. Do not edit `CHANGELOG.md` or `Cargo.lock`; a crate edge not in
  D10 means stop and ask the step lead.
- Every Rust change: `cargo fmt --all`, then regenerate the census (`node scripts/git-one-door-scan.mjs --root . --write-census`), never hand-merge it.
- Report path: `fgos convention path --kind report --type phase --slug <s2|s3|s23>-pNN-<slug> --plan 261115-0759-rust-verb-migration-s2-s3 --json`
  (run from the main checkout). End with `Status / Summary / Concerns`, the proposed `## [Unreleased]` line, and
  the table "retired test -> owner now".

## Port recipe (every verb phase)

1. Rust owner: the use case moves into the module that owns the job (named per phase), with unit tests at the lowest layer.
2. Host wiring: one operation descriptor in `packages/host-runtime/rust/src/catalog.rs` (`CATALOG`, line 17), the
   provider registered in `apps/fgos/src/main.rs` (`COMPOSITION_PROVIDERS` 101 and the registration block 228-274),
   a projector arm in `apps/fgos/src/cli_projector.rs` (`project_cli_invocation` 14) that reads **only** the shared
   parser's output (`fgos_host_runtime::cli_args`), the sub-command table in `routing.rs` `NATIVE_SUBCOMMANDS` (80),
   the annotation in `packages/host-runtime/contracts/command-route-annotations.json`, `native: true` in
   `src/cli/command-registry.mjs`; regenerate `command-routes.json` and `command-manifest.json`
   (`node scripts/export-command-selectors.mjs`). Refusals use D3's outcome with Node's category and text.
   An unknown flag is refused with Node's exact text: the host takes each sub-verb's flag list from the registry
   annotation it already ships and reuses Node's message grammar (including the `--k=v` "write --k <value>" hint).
   No user-visible change, no CHANGELOG line.
3. Parity: the verb's table `test/rust-host/parity-cases/<verb>.cases.mjs` (every `requireField`/`optionalField`
   refusal of the arm included, 00 F16) runs green against the step's base release before the Node code is deleted.
   A verb phase uses the `node:<base>/bin/fgos.mjs` entry with the staged env (about 0.34 s a case, not 2.7 s through
   the staged host). The unknown-flag case is compared on exit code and exact stderr bytes like every other refusal.
4. Delete in the same phase: the `bin/fgos.mjs` arm, its static imports that no other arm uses (and their
   `ARM_STATIC_IMPORTS` lines, `test/architecture.test.mjs:1660`), the Node use case, its `files` entry in
   `docs/architecture-manifest.json` (the architecture test compares files on disk with `manifest.files`), and every
   Node test whose behaviour now has a Rust owner; a Node module other code still needs becomes a thin client
   (addon call, or `invokeHost` of the native verb). Rows of deleted test files leave `test/suite-baseline.json`.
   Every test or doc that names a deleted test as an owner is updated (`rg -l <deleted test file> test docs`).
5. Exit: the phase's `doors` row(s) pass and each has a negative case in the report (a second path in a scratch
   file fails the row); the retired names join the step's "retired Node verb code" row (allowed: none); no entry is
   added to the `parse CLI arguments (twin)` row's debt (its `starts_with("--")` pattern fails any private parser);
   a ported verb never joins `PRE_DOOR_NATIVE_VERBS` (exact-set test from 01).

## Order and landing

```text
00 facts (S2+S3) ─┐
01 shared seam ───┴─> lands on main alone (small series), then:
S2: 02 git ─────────────────────────────────┐
    03 hot record ─> 04 lock-status ─> 05 lock fence ─┼─> 11 S2 close ─> S2 lands on main
    06 worktree (dropped, S23-Q1 = b) ───────┘
S3: 07 events ─────────┐
    08 session ────────┤
    09 gateway ────────┼─> 12 S3 close ─> (S2 landed) S3 rebases on main ─> 13 flag spelling (S23-Q2) ─> S3 lands
    10 agents (dropped, S23-Q1 = b) ┘
```

- Integration branches `rust-verb-migration-program/s2` and `.../s3` are cut from `main` after phase 01 lands.
  Each phase rebases onto its integration head to land (fast-forward only). S2 lands first (D11); S3 then rebases
  onto `main`, regenerates the generated files, recomputes (never merges) the route counts in the docs, reruns its
  gates, runs 13 and lands. Nothing of a step reaches `main` alone.
- Each phase report names its `## [Unreleased]` line; the step lead writes them at landing.

## Phases

| # | Phase | Step | Wave | Blocked by | Effort | File |
|---|---|---|---|---|---|---|
| 00 | Facts and baselines | S2+S3 | A | - | 1d | [phase-00-facts-and-baselines.md](phase-00-facts-and-baselines.md) |
| 01 | Shared host seam: parity entry, parser-only reading, categorised refusal, child faults, no state root from a root read | S2+S3 | A | 00 report before landing | 2.5d | [phase-01-shared-host-seam.md](phase-01-shared-host-seam.md) |
| 02 | `git status|recover` native | S2 | B | 00, 01 landed | 1.5d | [phase-02-git-status-recover.md](phase-02-git-status-recover.md) |
| 03 | Hot record door in holder-lock | S2 | B | 00 | 2d | [phase-03-hot-record-door.md](phase-03-hot-record-door.md) |
| 04 | `lock-status` native (first store-touching wiring proof) | S2 | C | 01, 03 | 3d | [phase-04-lock-status.md](phase-04-lock-status.md) |
| 05 | `lock fence` native (S23-Q3 = b) | S2 | C | 01, 03; lands after 04 | 1.5d | [phase-05-lock-fence.md](phase-05-lock-fence.md) |
| 06 | ~~`worktree create|remove` native~~ dropped: moves to S6a (S23-Q1 = b) | - | - | - | 0d | [phase-06-worktree.md](phase-06-worktree.md) |
| 07 | `events sync|status|seal|export` native | S3 | B | 00, 01 | 2.5d | [phase-07-events.md](phase-07-events.md) |
| 08 | `session start|end|list|gc` native | S3 | B | 00, 01 | 3d | [phase-08-session.md](phase-08-session.md) |
| 09 | `gateway start|stop|status` native | S3 | B | 00, 01 | 2d | [phase-09-gateway.md](phase-09-gateway.md) |
| 10 | ~~`agents list` native~~ dropped: moves to S5 (S23-Q1 = b) | - | - | - | 0d | [phase-10-agents.md](phase-10-agents.md) |
| 11 | S2 close: docs, proof consolidation, parity re-run, gates | S2 | D | 02-05 | 1d | [phase-11-s2-close.md](phase-11-s2-close.md) |
| 12 | S3 close: docs, proof consolidation, parity re-run, gates | S3 | D | 07-09 | 1d | [phase-12-s3-close.md](phase-12-s3-close.md) |
| 13 | One `--flag=value` rule for every native verb (S23-Q2 = a) | S3 | E | 12, S2 landed | 1.5d | [phase-13-flag-spelling.md](phase-13-flag-spelling.md) |

Critical path: 00 -> 03 -> 04 -> 05 -> 11 (S2 lands) -> S3 rebase -> 13, about 10.5 lead-days
(1 + 2 + 3 + 1.5 + 1 + 0.5 + 1.5); 01 (2.5 days from day 0) lands before 04's flip needs it. S3's own longest
chain (00 -> 08 -> 12) is 5 days and finishes inside it.

### Parallel map

```text
Wave A: [00 facts] [01 shared seam]                       (start together; 01 lands only after 00's report)
Wave B: S2 [02 git] [03 hot record] [06 dropped]   ||   S3 [07 events] [08 session] [09 gateway] [10 dropped]
        (all need 00; their flip commits need 01 on main)
Wave C: S2 [04 lock-status] [05 lock fence]                (need 03; 05 lands after 04)
Wave D: [11 S2 close]   ||   [12 S3 close]
Wave E: S2 lands on main -> S3 rebases on main -> [13 flag spelling, on S3] -> S3 lands
```

### Hot files (one writer at a time, in this order; generated files are regenerated, never hand-merged)

| File | Writers in order |
|---|---|
| `apps/fgos/src/invocation_doors.rs`, `packages/git/rust/src/{invocation_root.rs,driver.rs}` | 01 -> 13 (no verb phase edits them; 08 and 09 call `EventStoreLifecycle::trigger`) |
| `apps/fgos/src/routing.rs` | 01 -> S2: 02, 04, 05 (one `NATIVE_SUBCOMMANDS` line each, landing order) -> S3: 07, 08, 09 -> 13 |
| `apps/fgos/src/main.rs`, `cli_projector.rs`, `cli_presenter.rs`, `packages/host-runtime/rust/src/catalog.rs`, `packages/host-runtime/rust/src/contracts.rs` | 01 first (D3; `run_native` reads the categorised outcome); then S2 phases in landing order; S3 phases in landing order; S3 rebases after S2 lands (additive list lines) |
| `apps/fgos/Cargo.toml` (D10) | 08 or 09, whichever lands first on S3; `Cargo.lock` by the step lead |
| `packages/host-runtime/contracts/command-route-annotations.json`, `src/cli/command-registry.mjs` | as `main.rs`; 13 last |
| `command-routes.json`, `command-manifest.json` (generated) | every flip regenerates; on rebase rerun `node scripts/export-command-selectors.mjs` |
| `bin/fgos.mjs` | every verb phase deletes its own arm and imports (different hunks); 07 also deletes the `eventStoreChild` branch (4054-4134) |
| `test/architecture.test.mjs` (`ARM_STATIC_IMPORTS` 1660-1700) | 02, 04, 05 (S2); S3 none (`session.mjs` stays imported for `listSessions`; `events`, `gateway` are dynamic imports); the list only shrinks |
| `docs/architecture-manifest.json` | every phase adds its rows and removes its deleted `files` entries; 11 and 12 add the per-step "retired Node verb code" rows; 13 edits the parse row |
| `test/rust-host/verb-parity.test.mjs` (step branches only, never on `main`) | step lead adds it as the first commit of each integration branch; each verb phase adds its table name; 11 and 12 rerun every table and delete runner and tables |
| `apps/fgos/tests/cli_tests.rs` | 04 (wiring proof) -> 05 -> 07 -> 08 -> 09 (one case each) |
| `packages/holder-lock/rust/src/lib.rs` | 03 -> 04 -> 05 |
| `packages/process/rust/src/control.rs` | 05 only (`self_chain` moves in); `lib.rs`, `mapped.rs`: no phase touches them (S23-Q4 = b) |
| `packages/git/rust/src/lib.rs` | 02 only |
| `packages/git/node-addon/src/git.rs` | 02 only; `holder_lock.rs`: 03 only; `process.rs`: 05 only |
| `src/event-store/maintenance.mjs`, `src/util/spawn-detached-fgos.mjs` | 07 only (08 and 09 delete callers, not lines here) |
| `test/suite-baseline.json` | every phase that deletes a test file removes its row(s) |
| `packages/git/contracts/mutation-census.v1.json` (generated) | every phase regenerates its own |

## File set (complete, for the overlap check)

Create:
- Rust: `packages/git/rust/src/incidents.rs` (02), `packages/holder-lock/rust/src/hot_record.rs` (03),
  `packages/holder-lock/rust/src/status.rs` (04), `apps/fgos/src/wiring/run_dirs.rs` (04, the host's run-directory
  listers, D6), `packages/holder-lock/rust/src/fence.rs` (05), `apps/fgos/src/wiring/events.rs` (07),
  `apps/fgos/src/wiring/session.rs` (08), `apps/fgos/src/wiring/gateway_control.rs` (09)
- Contracts and fixtures: `packages/holder-lock/contracts/main-checkout-activity.v1.json` (04, beacon; or beside its
  writer if 00 F5 says so), `test/rust-host/fixtures/run-dirs-vectors.json` (04, the three run layouts)
- Tests (transitional, never reach `main`): `test/rust-host/verb-parity.test.mjs` (first commit of each integration
  branch), `test/rust-host/parity-cases/{git,lock-status,lock,events,session,gateway}.cases.mjs` ; all deleted by 11/12
- Reports under `plans/261115-0759-rust-verb-migration-s2-s3/reports/`

Modify:
- Host: `apps/fgos/src/main.rs`, `routing.rs`, `invocation_doors.rs`, `cli_projector.rs`, `cli_presenter.rs`,
  `apps/fgos/src/wiring/mod.rs`, `apps/fgos/Cargo.toml`, `apps/fgos/tests/cli_tests.rs`
- Kernel and crates: `packages/host-runtime/rust/src/{catalog.rs,contracts.rs}` (01: categorised refusal),
  `packages/git/rust/src/{invocation_root.rs,driver.rs,lib.rs}` (01, 02), `packages/holder-lock/rust/src/lib.rs`,
  `packages/process/rust/src/control.rs` (05),
  `packages/git/node-addon/src/{git.rs,holder_lock.rs,process.rs}`,
  `packages/identity/rust` tests and `packages/identity/contracts/identity.writer.v1.json` (08, the registry row shape),
  `packages/event-store/rust/src/lib.rs` (07, only if an op needs a public entry 00 finds missing)
- Contracts: `command-route-annotations.json`, the two generated route files, census, `packages/holder-lock/contracts/hot-lock.v1.json` (03)
- Node: `bin/fgos.mjs`, `src/cli/command-registry.mjs`, `src/git/status.mjs` (02, client), `src/state/hot-lock.mjs`
  (03), `src/runner/main-checkout-activity.mjs` (04, only the beacon vector), `src/event-store/maintenance.mjs` and
  `src/util/spawn-detached-fgos.mjs` (07), `src/runner/session.mjs` (08, client)
- Tests: `test/rust-host/harness.mjs` and `harness.test.mjs` (01), `test/architecture.test.mjs`, `test/suite-baseline.json`,
  `test/holder-lock/hot-lock-contract.test.mjs`, `test/state/hot-lock-tx.test.mjs`, `hot-lock-guard.test.mjs` (03),
  `test/cli/fgos-claim-2.test.mjs`, `test/cli/fgos-claim.test.mjs`, `test/runner/main-checkout-activity.test.mjs`,
  `test/setup/holder-lock-checks.test.mjs` (04: its owner pointer at 100), `test/cli/fgos-lock-fence.test.mjs` (05),
  `test/git/status.test.mjs` (02), `test/event-store/{triggers,background-seal,verbs}.test.mjs`,
  `test/setup/event-store-checks.test.mjs` (07), `test/cli/helpers/fgos-cli-harness.mjs`, `test/setup/checks.test.mjs`,
  `test/runner/session.test.mjs` (08), `test/rust-host/command-routes.test.mjs`
  and `test/cli/subcommand-flag-drift.test.mjs` (only where they name these verbs)
- Docs (closes): `docs/platform/holder-lock/spec.md` (§13, §14, §15, §17, §20), `docs/platform/git/spec.md` (§20),
  `docs/platform/event-store/spec.md` (child paragraph near 454, decision history), `docs/platform/runner/spec.md`
  (session), `docs/platform/identity/spec.md` (177: the registry's owner moved), `docs/explanation/fgos-gateway-lifecycle-verb.md`,
  `docs/platform/herdr-web-dashboard/spec.md` (78, 239), `docs/platform/host-invocation-routing/spec.md` (§2 counts,
  §9), `contracts/command-route-descriptor.md` (recount), `docs/reading-map.md` (rows 174, 189, 190 and new source
  paths), `AGENTS.md` ("Legacy-Node CLI Ownership Boundary" only if the lock-verb sentence changes),
  `core/skills/fgos-lock-fence/SKILL.md` (05/11, per S23-Q3), `scripts/check-decision-citation-drift.baseline.json` (only if asked)

Delete:
- `src/runner/lock-status.mjs`, `src/runner/lock-fence.mjs`, `src/verbs/events/{sync,status,seal,export}.mjs`,
  `src/runner/gateway-control.mjs`
- Tests: `test/runner/lock-status.test.mjs`, `test/cli/fgos-git.test.mjs`, `test/runner/gateway-control.test.mjs`,
  `test/cli/fgos-gateway.test.mjs`; others shrink (owners named per phase)
- The transitional parity runner and tables (11, 12)

## Collision watch (HARDEN's request)

Checked against `origin/capability-reads-one-door` `3ec1a7812` (phases 01-05 landed there, 06-08 open) and
`plans/261114-2215-one-door-debt` on `main` (phases 05 and 16 open; every other phase landed). Neither plan's
open phases touch `apps/`, `packages/`, `src/runner/{lock-*,session,gateway-control,agent-listing}.mjs`,
`src/verbs/**`, `src/git/**`, `src/event-store/**` or `src/state/hot-lock.mjs`; `test/test-ownership.mjs` and
`scripts/check-decision-codes.baseline.json` (capability 07) carry no row for S2/S3 files.

| Shared file | S2/S3 change | Other plan's change | Mitigation |
|---|---|---|---|
| `bin/fgos.mjs` | S2: static imports 102, 104, 105, arms 884-896, 3510-3531, 3774-3794; S3: 2632-2652, 3546-3572, 3579-3600, 3635-3641, `eventStoreChild` branch 4054-4134 | capability 07: `case 'tool'` 3642-3677 and static import 47 | the `agents` arm (3635-3641) is the hunk next to `tool`: whoever lands second rebases by hand; every other hunk is far apart |
| `src/cli/command-registry.mjs` | `native: true` in eight entries (125, 1733, 2190, 2236, 2330, 2465, 2494, 2510) | capability 07: deletes `tool` (2294-2328) | `agents` (2330) sits right after `tool`; rebase; regenerate both generated files after the second landing |
| `command-routes.json`, `command-manifest.json` | regenerated | capability 07 regenerates | never hand-merge; rerun `node scripts/export-command-selectors.mjs` after the second landing |
| `docs/architecture-manifest.json` | new `doors` rows, deleted `files` entries; 13 edits the parse row | capability 06 (file row), 07 (deletes `tool-registry` row), 08 (`doors` rows); one-door-debt 05, 16 (remove debt entries) | additive rows; second lander rebases and reruns `test/architecture.test.mjs`; a stale debt entry fails by name |
| `test/architecture.test.mjs` | `ARM_STATIC_IMPORTS` lines out (lock-status, lock-fence, git/status) | capability 07: one `ARM_STATIC_IMPORTS` line (`tool-registry`) | lines removed from one shrinking list; rebase |
| `test/suite-baseline.json` | rows of deleted test files out (26, 27, 325, 334, ...) | capability 07: rows of its three deleted tests | different rows; rebase |
| `AGENTS.md` | closes: the "Legacy-Node CLI Ownership Boundary" sentence on lock verbs, only if it changes | capability 07: 228-262 (dispatch section) | different section; rebase |
| `docs/reading-map.md` | rows 174, 189, 190 and new paths (closes) | capability 06 edits 158 | different rows; rebase |
| `src/setup/registrations.mjs` | **not edited** (02 keeps `src/git/status.mjs` exports, so `src/setup/git-checks.mjs` and doctor are unchanged) | capability 07 (line 99, row 990-1025); one-door-debt 16 (personas 809-863, 517, activation reads) | none needed |
| `doors` row "agent definition tier directories" | not edited here: phase 10 dropped (S23-Q1 = b), `agents` moves to S5 | one-door-debt 16 removes its `registrations.mjs` debt entry | none |
| `test/runner/agent-definitions.test.mjs` | not edited here: phase 10 dropped (S23-Q1 = b) | one-door-debt 16 names it as owning test | none |
| `src/runner/execution/seat-policy.mjs`, `src/setup/bin-discovery.mjs`, `src/runner/dispatch/**`, `src/runner/execution/**` | not edited (04 only stops importing `dispatch/assignment-layout.mjs` and `execution/case-run-paths.mjs` by deleting `lock-status.mjs`) | one-door-debt 05, 16; capability 06 | none |
| `packages/git/contracts/mutation-census.v1.json` | regenerated | regenerated by every product change | regenerate after each landing |

S2 against S3 (files both steps edit): `apps/fgos/src/{main.rs,routing.rs,cli_projector.rs,cli_presenter.rs}`,
`apps/fgos/tests/cli_tests.rs`, `packages/host-runtime/rust/src/catalog.rs`, `command-route-annotations.json`,
`src/cli/command-registry.mjs`, the two generated route files, `bin/fgos.mjs`, `test/architecture.test.mjs` (S2 only
in practice), `docs/architecture-manifest.json`, `test/suite-baseline.json`, the census, `docs/platform/git/spec.md`,
`docs/platform/host-invocation-routing/spec.md` and `contracts/command-route-descriptor.md` (route counts: recomputed
after the rebase, never merged), `docs/reading-map.md`. All edits are additive list lines or deletions of separate
hunks; mitigation is D11's landing order and regeneration. Disjoint by construction: S2 owns `packages/holder-lock/**`,
`packages/process/rust/src/control.rs`, `src/state/hot-lock.mjs`, `src/git/status.mjs`, `packages/git/node-addon/src/{git.rs,holder_lock.rs,process.rs}`,
`apps/fgos/src/wiring/run_dirs.rs`; S3 owns `src/event-store/**`, `src/util/spawn-detached-fgos.mjs`,
`src/runner/session.mjs`, `packages/identity/**` (tests and contract), `apps/fgos/Cargo.toml`,
`apps/fgos/src/wiring/{events,session,gateway_control}.rs`. Each step's parity tables are separate files.

## Exit criteria (measurable)

1. `command-routes.json`: `lock`, `lock-status`, `git`, `events`, `session`, `gateway` have `route_kind: native` and an `operation_id`; counts 80 routes, native 8 -> 14, legacy-cli 72 -> 66.
2. No Node process for any flipped verb: the harness PATH shim records zero `node` children for every parity case
   on the host entry (`test/rust-host/harness.mjs:37`, `node` is shimmed; the host starts Node through PATH,
   `apps/fgos/src/legacy_exec.rs:246`), and one `cli_tests.rs` case per step runs a flipped verb with a PATH `node`
   wrapper that fails if started.
3. Parity: every table ran green host-vs-base-release on the step's integration head before the close phase deleted
   it; case counts per verb in the close reports; accepted differences only those under Outcome.
4. The Node arms, use cases and named tests are gone; each step's "retired Node verb code" row (allowed none) passes;
   every new `doors` row passes and its negative case fails as expected (report).
5. The `parse CLI arguments (twin)` row gains no debt entry; `PRE_DOOR_NATIVE_VERBS` equals exactly the eight pre-F0
   native verbs (exact-set test); after 13 the row's three pre-door entries and `named_dir` are as S23-Q2's answer says.
6. The first store-touching native verb (`lock-status`, 04) proves the F0 doors through the binary: from a linked
   worktree with no `.fgos`, a `store: read` call passes admission with its warning (`store_admission.rs:149-157`);
   `--dir ""` is refused `dir-invalid` with one record in the caller's store; with a refused `eventStore` config
   section, on Linux one `event-store-end-trigger` record (and with `FGOS_DISPATCH_DEPTH=1` one
   `event-store-start-trigger` record), off Linux none.
7. Event Store children survive the move: a Node-run store verb's seal and publish children start the host, proved
   by `test/event-store/triggers.test.mjs` and `background-seal.test.mjs` (child ran, events sealed, a failed child
   recorded `event-store-child` with its message); a child never recreates a removed state root (01 unit case).
8. Gates green on each step's integration head and again on S3 after rebase: `npm test`, `cargo test --workspace`,
   `cargo fmt --all --check`, `cargo clippy --workspace --all-targets -- -D warnings`, `cargo check` of the touched
   crates for `x86_64-pc-windows-msvc` and `aarch64-apple-darwin`, doc-health, decision-citation drift,
   `node scripts/export-command-selectors.mjs --check`, the one-door scan with 0 undeclared and the Git classes
   (`git-driver`, `sandbox-door`) not above phase 00's numbers.
9. Latency (release host, 30 runs, median): each flipped verb's cheapest read (`lock-status`, `git status`,
   `events status`, `session list`, `gateway status`) is below its phase 00 Node median; numbers in the close reports.

## Risks

| Risk | L x I | Mitigation |
|---|---|---|
| A Node process spawns a flipped verb through `bin/fgos.mjs` and is refused (lost Event Store seal/publish child) | H x H | D9: 07 moves `spawnDetachedCli`'s events children to the host binary in the flip commit; 00 F2 lists every spawn; exit criterion 7 |
| A native child recreates a removed state root (the root door builds `GitDriver::new`) | H x M | D4 in 01, before 07 flips `events` |
| Ported verbs exit 1 where Node exits 2/4/7 | certain without D3 | D3 in 01; every refusal is a parity case (00 F16) |
| Node readers of a moved writer's file read another shape | M x H | one reader each (D5, D7); vector rows in the existing contracts; formats unchanged |
| Parity impossible in-tree | certain | D1; the base build in its own Cargo target |
| `lock fence` signals a holder nobody confirmed | M x H | S23-Q3 = b: without `--yes` the verb lists the holders and refuses, so nothing is signalled unconfirmed |
| The gateway child inherits the recursion guard (legacy verb calls from the gateway die; possibly true today) | M x H | D8; 00 F11 confirms the current behaviour live; item for the big lead if it is broken today |
| Gateway REST `/v1/sessions` parses `fgos session start|end --json` (`apps/fgos-gateway/src/gateway.rs:1091, 1115`) | M x H | exact `data` parity; `cargo test -p fgos-gateway` in 08 |
| Writes compared in parity (no dual-run, §11) | M x M | each write case runs on its own fresh fixture per entry (`fs-delta`), never on shared state |
| S2 and S3 both editing host list files | H x L | D11, additive lines, regeneration |
| Pulling tier-5 modules (provisioning, agent definitions) into S2/S3 | M x M | not taken: S23-Q1 = b, phases 06 and 10 dropped |
| Two `--flag=value` rules live after S3 | certain until 13 | phase 13 applies S23-Q2 = a |

Rollback: each phase reverts on its integration branch; a landed step reverts as one series. Rollback of a
native verb in the field is a release rollback through `fgctl` (migration doc §13): the previous release still
has the Node arm. No on-disk format changes, so an older release reads everything S2/S3 wrote (`sessions.json`
keeps its shape; only its write becomes atomic). Phase 01's state-root rule and categorised refusal revert with it.

## Red Team Review

### Session — 2026-11-15
**Reviewers:** 3 (Failure Mode, Assumption Destroyer with 38 claims checked, Scope / One-door / Collisions), plus
the planner's own trace (D4). **Findings:** 41 raw, merged to 24 (21 accepted, 2 accepted in part, 1 rejected).
**Severity:** 2 Critical, 9 High, 13 Medium.

| # | Finding | Severity | Disposition | Applied to |
|---|---|---|---|---|
| 1 | No categorised refusal from a native verb: every provider error exits 1 as `fgos: error:` | Critical | Accept: D3 | 01, recipe |
| 2 | `lock fence` park-and-reinvoke: `Parked` exits 0, carries no holders, no reinvoke path, would signal unconfirmed holders; §9 says the work lifecycle reinvokes | Critical | Accept: owner question S23-Q3; option (a) carries confirmed identities, loop in `run_native` | 05, Q |
| 3 | Run-scoped lock roots: run-supervisor call is a cycle; registry roots invert layers | High | Accept: D6 | 00 F3, 04 |
| 4 | `sessions.json` already has a Rust reader and a contract (identity `resolve.rs:22`, `identity.writer.v1.json`) | High | Accept: allowed reader, contract extended | 08 |
| 5 | Fourth `listSessions` reader (`return` arm, `bin/fgos.mjs:3253`): import and ARM line stay | High | Accept | 08, hot files |
| 6 | Session registry is runner state, not Git's | High | Accept: D7 (host owner, `invokeHost` client) | 08 |
| 7 | Wiring proof: a frozen `.fgos` worktree is refused not warned; a non-project `--dir` is admitted | High | Accept: no-`.fgos` worktree and `--dir ""` | exit 6, 04 |
| 8 | Parity base build sharing the phase's Cargo target (broke F0's close review) | High | Accept | rules, 00 F1, 01 |
| 9 | Root door creates an absent state root; a native child would recreate it (planner trace) | High | Accept: D4 | 00 F15, 01 |
| 10 | Exit-code drift and missing-positional refusals not in parity | High | Accept: 00 F16 | 00, recipe |
| 11 | Hot record: `judgeHotRecord` is already the process door; reclaim only on contention; `LockScope` refuses hot-mutex rows; `.hot` pattern dead; `.reclaim.lock` matches `lock-status.mjs` until 04; contract exists | High | Accept: read and compare-and-clear only; direct `acquire`; contended timing; extend `hot-lock.v1.json`; debt entry until 04 | 03 |
| 12 | `self_chain` lives only in the addon | Medium | Accept: D10, moves into `fgos-process` | 05 |
| 13 | Host lacks `fgos-durable-file` | Medium | Accept: D10 | 08, 09 |
| 14 | Torn (non-UTF-8) hot records never compare equal through a JS string | Medium | Accept: opaque token, invalid-UTF-8 row | 03 |
| 15 | `session end` must not start a publish child; seal also on failure | Medium | Accept: `Policy { shutdown: true }` only, finally-equivalent, no-child assertion | 08, 09 |
| 16 | Event Store tests spawn `node bin/fgos.mjs events` directly; `leave` needs the error message | Medium | Accept | 01, 07 |
| 17 | Gateway child inherits the recursion guard | Medium | Fixed outside the port on `cook/gateway-guard-fix` | 09 |
| 18 | `gateway start` off Unix: `spawn_detached` is `cfg(unix)` | Medium | Accept: S23-Q4 decided by evidence (b): refused off Unix, 00 F11 found it never worked on Windows | 09, Q |
| 19 | Session self-checks use the caller's cwd; `gc` from inside a session could remove a live one | Medium | Accept: provider takes the caller's cwd; parity cases inside a session worktree and a subdirectory | 08 |
| 20 | `doors` row defects: 02 addon entry, 09 `--bin` pattern and stale registry entry, 08 registry text, 07 `event-store-child` twin unguarded | Medium | Accept | 02, 07, 08, 09 |
| 21 | File-set gaps: `manifest.files` entries, recount after rebase, `cli_tests.rs` in 07/08, `holder-lock-checks.test.mjs:100`, baseline rows 26/27, `lock-fence-signal-refused`, gateway `cargo` cwd and `readMachineConfig` port, `TEST_ENV_KEYS` (use the `FGOS_TEST_` prefix) | Medium | Accept | recipe, 01, 02, 04, 05, 09 |
| 22 | S23-Q2 facts wrong (`config --json show` already refused; sub word is the token right after the verb; the parse row has ten debt entries, three of them pre-door) | Medium | Accept: question rewritten | Q, 13 |
| 23 | Beacon: Node also reads it (commit gate); contract owner | Medium | Accept in part: two readers named, one vector; contract stays with holder-lock §14 (main checkout one door) unless 00 F5 finds the writer's owner elsewhere | 04 |
| 24 | RUL11: fold the `return`/`approve` "cwd inside a session" checks into the admission door | Medium | Reject for this plan: those arms are Work-tier and move in S7; filed as an item for the big lead (different signal: registry vs `.fgos` symlink) | items |

Also accepted without a row: question labels `S23-Qn`; S23-Q1's twin option dropped (it broke design principle 1 by
construction); 01's envelope requirement removed (the host already prints the pretty envelope without `--json`);
the `LENIENT_ROOT_VERBS` guard gets an exact-set assertion; phase 03 states why it is not an S23-Q1-class question.

### Whole-Plan Consistency Sweep
- Files reread: plan.md, phase-00 to phase-13.
- Decision deltas checked: 11 (D1-D11) plus S23-Q1..Q4.
- Reconciled stale references: the session owner (`fgos-git` module and addon entry removed everywhere), the parity
  runner on `main` (removed), `TEST_ENV_KEYS` edit (removed), `LENIENT_ROOT_VERBS` name in the exit criteria, the
  wiring-proof fixture, Q labels, effort and critical path.
- Unresolved contradictions: 0.

## Validation Log

### Owner answers (2026-11-15 08:41, via HARDEN)
- S23-Q1 = (b): `worktree` to S6a, `agents` to S5; phases 06 and 10 dropped; effort 23d; program S5 and S6a rows updated.
- S23-Q2 = (a): `=` removed everywhere; phase 13 runs the (a) branch.
- S23-Q3 = (b): `lock fence` without `--yes` lists and refuses (`lock-fence-not-confirmed`, exit 2).
- S23-Q4 = (b), decided by evidence (see the 2026-11-15 phase 00 entry below).

### Verification results
- Tier: Full (14 phases). Claims checked: 78 (38 by the assumption reviewer, 40 planner spot checks with `sed`/`rg`
  on `e6b78d1d1`).
- Verified: 64 | Wrong, all fixed: 14 (judge already Rust; reclaim only on contention; `LockScope` refuses hot
  rows; run-supervisor cycle; `self_chain` location; no durable-file edge; `Parked` shape and exit 0; presenter cannot
  reinvoke; no categorised refusal; `sub_word` rule; `config --json show` already refused; `TEST_ENV_KEYS` line;
  frozen-worktree warning and non-project `--dir`; gateway `cargo` cwd) | Open, owned by 00: F1-F16.
- Decided by the planner (priority 2: the analysis picked one): D1-D11. Batched for the owner: S23-Q1..Q4.

### Phase 00 decisions (2026-11-15, HARDEN, inside the approved frame)
- (a) The gateway recursion-guard bug and the `--locked` cargo build are fixed outside the port, on branch
  `cook/gateway-guard-fix`. Phase 09 must not carry them; its text drops the guard fix.
- (b) Phase 07 gets a positive case: root removed gives `skipped`, and the root stays absent.
- (c) Parity entry A is `node <base>/bin/fgos.mjs` plus the staged env (about 0.34 s a case against 2.7 s through the
  staged host, output byte-equal on six cases). Phase 01 already landed, so only the Port recipe carries a note.
- (d) Phase 04 pins the three run-lister rules and the unreachable `lock-not-node-owned` as cases (facts report section 8).
- (e) `git recover` outside a repository printing `--sha [object Object]` is fixed in the port, not copied: an
  accepted change with a CHANGELOG line, written by phase 02.
- (f) Unknown-flag text: the host takes each sub-verb's flag list from the registry annotation it already ships and
  reuses Node's message grammar (including the `=` hint), so the stderr refusal stays exact-bytes with Node; one source
  of truth, no user-visible change, no CHANGELOG line (phase 13 flag-spelling and the Port recipe).
  Superseded (2026-11-15, same day): "the host's one per-verb text is the accepted change; parity compares exit code
  and refusal id, not bytes", dropped because it kept two sources of truth for the same refusal.
- 2026-11-15, HARDEN, after OPC's review: switched decision (f) to OPC's version above.
- S23-Q4 decided (b), see the question below.

## Owner questions (batch)

Asked once, together, when this plan is approved. None blocks wave A, phase 01 or the other verb phases:
S23-Q1 gated only 06 and 10, S23-Q2 only 13, S23-Q3 only 05, S23-Q4 only 09's `start` off Unix.
Status (2026-11-15): Q1-Q3 answered by the owner (via HARDEN); Q4 decided by evidence (b).

### S23-Q1: `worktree` and `agents` — port now, or move them to the step that moves their shared module?

- **What is happening:** two of the eight verbs are thin faces over Node modules that the runner (tier 5) also
  uses. `worktree create|remove` provisions the checkout (`provisionWorktree`, `removeProvisioned`,
  `src/runner/worktree.mjs:268, 370`: `npm ci`, skill-directory copies, the `worktree-provisioning.v1` record) and
  the runner calls the same functions (`src/runner/worktree.mjs:823, 1347, 1411`). `agents list` reads persona
  definitions through `src/runner/agent-definitions.mjs`, which eight runner, workflow and doctor modules import
  (`unit-run-start.mjs:22`, `run-request.mjs:11`, `dispatch/assignment.mjs:49`, `agent-roster.mjs:13`,
  `setup/registrations.mjs:39`, `workflow/case-start.mjs:19`, `agent-listing.mjs:23`, `scripts/project-agents.mjs:37`).
  No Rust code reads persona definitions or provisions a checkout.
- **Cause:** the program put verbs into steps by the verb's tier; these two verbs' use cases live one layer up.
  A native verb may not call back into Node (host spec §5), so porting the verb means porting the module.
- **Options:**
  - (a) Port the modules now: Rust owner (provisioning; agent definitions) with the Node modules as clients, every
    runner caller unchanged. About +5.5 lead-days (phases 06, 10), new crate modules, addon entries and crate edges
    (stop-and-ask items), runner hot paths (claim, approve, persona resolution) switch to Rust early; 10 waits for
    one-door-debt 16. Gain: S5 (`bind()` needs personas) and S6a (provisioning) find them done.
  - (b) Move the verbs: `agents` joins S5 (with `bind()` and the persona model), `worktree` joins S6a (with the
    runner's provisioning). No cost now; S2 and S3 finish about 5.5 days sooner; the two verbs keep their Node latency
    (about 100 ms) until then; nothing a user sees changes.
- **Recommendation:** (b). It keeps the layers in order (the program's rule "layers serial") and adds no second path;
  the per-call gain of these two verbs is small next to `npm ci` or a panel run.
- **Scope of the answer:** where `worktree` and `agents` are ported (S2/S3 or S6a/S5). It does not change the
  program's step order or any other verb; under (b) the program's S5 and S6a rows gain one verb each.
- **Answer (2026-11-15 08:41, owner via HARDEN): (b).** `worktree` moves to S6a and `agents` to S5, next to the modules they depend on. Phases 06 and 10 are dropped; the program's S5 and S6a rows gain one verb each. Plan effort is about 23 lead-days.

### S23-Q2: `--flag=value` — one rule for every native verb

- **What is happening:** after S2/S3, 14-16 verbs are native. The eight that were native before F0 keep their own
  reading: `--flag=value` and `--dir=<path>` are accepted (`named_dir`, `apps/fgos/src/invocation_doors.rs:404-414`;
  the `=` cut in `routing.rs:307`), and their projectors parse their own flags (three of the ten debt entries of the
  `parse CLI arguments (twin)` row: `cli_projector.rs`, `wiring/mailbox_verbs.rs`, `packages/observe/rust/src/flags.rs`).
  Every verb ported in S2/S3 reads only the shared parser, which, like Node's (`src/cli/parse-args.mjs:8-27`), has no
  `=` form. This is the open question of F0 phase 08 and of the host spec §9; the program row says the last verb's
  step answers it.
- **Cause:** the pre-F0 native verbs were written with their own parsers; the shared parser was written to equal Node's.
- **Options:**
  - (a) `=` goes away everywhere: the eight verbs move onto the shared parser; `named_dir` and the three entries go.
    `--path=a.b`, `--dir=/x` and similar stop working (exit 4, unknown flag); `fgos config --dir /x show` starts working
    (sub-command from the parsed positional, as Node). Shipped uses found: one, `docs/how-to/compare-discussion-setups-with-metrics-eval.md:185`
    (`metrics eval list --harness=... --question=...`), rewritten in the same change. About 1.5 days, mostly deletion.
  - (b) `=` accepted everywhere: both parser twins learn `--k=v` (one vector file); every Node verb accepts it too;
    then the eight verbs move onto the shared parser. About 2 days; a new spelling for 66 legacy verbs (a behaviour
    added, which RUL104 asks to avoid).
  - (c) Keep both rules until S7. No cost now; two spellings live, the debt stays visible.
- **Recommendation:** (a): one rule (Node's), code deleted, nothing added; one doc line to rewrite.
- **Scope of the answer:** how native verbs read `--flag=value`, `--dir=` and the sub-command word. Not root
  leniency (`PRE_DOOR_NATIVE_VERBS` keeps that use: the mailbox behaviours it protects are separate); not the Node
  CLI's rules under (a) or (c).
- **Answer (2026-11-15 08:41, owner via HARDEN): (a).** `=` goes away everywhere. The eight verbs move onto the shared parser; `named_dir` and the three twin debt entries go; the one doc use (metrics eval) is rewritten in the same change. CHANGELOG line (phase 13): `--flag=value` and `--dir=<path>` are no longer accepted; use `--flag value`.

### S23-Q3: `lock fence` without `--yes` — keep the terminal question?

- **What is happening:** today, on a terminal, `fgos lock fence <name>` lists the holders and asks
  `Stop these processes? [y/N]`; without a terminal it lists them and signals nothing (`bin/fgos.mjs:330-340`). Agents
  always run without a terminal, so they already list first and pass `--yes` (`core/skills/fgos-lock-fence/SKILL.md`, flow step 3).
- **Cause:** a native provider never waits for a person (migration doc §9: a parked operation "is re-invoked by the work
  lifecycle"); the host has no ask-and-reinvoke path (`Parked` exits 0, `apps/fgos/src/cli_presenter.rs:266-269`;
  `run_native` invokes once, `main.rs:318-388`), and a naive reinvoke would signal holders the person never saw.
- **Options:**
  - (a) Keep the question: the provider answers "needs confirmation" with the holders' identities (pid + start time);
    `run_native` asks on a terminal and reinvokes with exactly those identities; `fence.rs` signals only holders that
    are still holding and were confirmed, and asks again for a new one. About +0.5 day; one generic confirmation loop in the CLI host.
  - (b) No question in the native verb: without `--yes` it always lists the holders and refuses
    (`lock-fence-not-confirmed`, exit 2), on a terminal too; a person reruns with `--yes`. No new mechanism; a
    person at a terminal types one more command.
  - (c) `lock fence` stays Node until a work-lifecycle reinvoke exists (S6/S7); `lock-status` still moves.
- **Recommendation:** (b). It is what every agent already does, it adds nothing to the host, and the confirmation
  the person gives is the same decision made one command later.
- **Scope of the answer:** `lock fence`'s confirmation only; no other verb gets a confirmation loop.
- **Answer (2026-11-15 08:41, owner via HARDEN): (b).** `lock fence` without `--yes` lists the holders and refuses with `lock-fence-not-confirmed` (exit 2), on a terminal too. `core/skills/fgos-lock-fence/SKILL.md` is updated if its text needs it (phases 05, 11).

### S23-Q4: Windows detached spawn

- **What is happening:** Node starts the gateway detached on every platform (`src/runner/gateway-control.mjs:233-238`);
  the host's detached spawn exists only on Unix (`packages/process/rust/src/lib.rs:15-16`, `mapped.rs:194`).
- **Cause:** the process crate was built for the Event Store's children, which run on Linux only.
- **Options:**
  - (a) Add the Windows half of `spawn_detached` to the process crate (detached process group, no console), one door
    for every host child. About 0.5-1 day; one more platform path in the process crate.
  - (b) `gateway start` refuses off Unix with a clear message; `stop` and `status` work everywhere. No cost; a Windows
    user loses `gateway start`.
- **Recommendation:** (a) if any Windows project uses the gateway today (00 F11 checks), else (b).
- **Scope of the answer:** the gateway's start on Windows and the process crate's detached spawn; nothing else.
- **Decided by evidence (2026-11-15, HARDEN, inside the approved frame): (b)** `gateway start` is refused off Unix with a clear message. Phase 00 proved it cannot work on Windows today (no `.exe` in `releaseBinaryPath`), so refusing loses nothing.
- CHANGELOG line owed by phase 09: "`fgos gateway start` is refused off Unix with a message saying so; it never worked there."

## Items for the big lead (outside this plan)

- The `return` arm (`bin/fgos.mjs:3253`) and `approve` (`src/verbs/merge/approve.mjs:232`) decide "is this cwd inside
  a registered session" from the registry, a second signal next to admission's `.fgos`-symlink rule
  (`store_admission.rs:166`); they move with S7 (RUL11: own item).
- If 00 F15 confirms it, F0's root door recreates a removed state root for a Node `events` child today (regression of
  Git spec §20); D4 fixes it in 01, but it is live on `main` until then.
- If 00 F11 confirms it, the gateway started by Node inherits `FGOS_RUST_HOST_RECURSION_GUARD`, so its calls to legacy
  verbs fail today; `cook/gateway-guard-fix` fixes it outside the port.
