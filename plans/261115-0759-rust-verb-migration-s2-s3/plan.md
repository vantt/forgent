---
title: "Rust verb migration S2 (lock, lock-status, git, worktree) and S3 (events, session, gateway, agents)"
description: "Move eight legacy-Node verbs onto the Rust host in two parallel steps, one Rust owner per job, Node arms and their tests retired in the same change."
status: pending
priority: P1
effort: 21.5d (Q1 = c); 27.5d (Q1 = a)
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

## Outcome

`lock`, `lock-status`, `git` (S2) and `events`, `session`, `gateway` (S3) run in the Rust host with no Node
process; `worktree` (S2) and `agents` (S3) do too if the owner answers Q1 = (a), else they move to S6a and S5.
Each port moves a whole use case into its Rust owner, deletes the Node arm, the Node use case and the tests whose
behaviour now has a Rust owner, and ends with a `doors` row that fails on any second path.

Non-goals (program): no new verb, flag or behaviour (RUL104); no dual-run of a write (migration doc §11:
`docs/platform/host-invocation-routing/architecture/node-to-rust-migration.md:367-382`); no change to the
`fgos.v1` envelope or the exit-code table; no change to any on-disk format (`sessions.json`, `gateway.json`,
hot records, the beacon, Event Store) that an older release could not read.

Accepted behaviour changes (decided here, each in the phase that makes it and in `CHANGELOG.md` at landing):
- a missing or unknown sub-command of a ported verb is refused with the host's one text
  (`<verb> requires a subcommand. Available: ...`, `apps/fgos/src/routing.rs:248-292`), exit 4 and fault class
  `arg-parse` as before; Node's per-verb texts (`bin/fgos.mjs:291-294` and the `events` text) go;
- a ported verb's malformed call is recorded in `.fgos/logs/invocation-faults.jsonl`, as F0 did for today's
  native verbs;
- `.fgos/sessions.json` is written atomically (Durable File) instead of `writeFileSync` (`src/runner/session.mjs:164-167`).

## Phase-lead rules (every phase)

- Repo `/home/vantt/projects/forgent` on fg-server2. Read `AGENTS.md`, `docs/reading-map.md`, this plan, then the phase file.
- Branches: shared phases `rust-verb-migration-program/s23-pNN`; S2 phases `rust-verb-migration-program/s2-pNN` cut from the
  integration branch `rust-verb-migration-program/s2`; S3 phases `.../s3-pNN` from `.../s3`. Worktree
  `/home/vantt/projects/forgent-worktrees/rvm-<s23|s2|s3>-pNN` created with `/usr/bin/git worktree add -b <branch> <path> <base>`;
  assert the path is in `git worktree list` before any destructive step.
- `export CARGO_TARGET_DIR=/home/vantt/projects/forgent-worktrees/rvm-<id>-target` (ext4, never `/tmp`); delete it when the phase lands.
- Tests: `node scripts/run-tests.mjs <files>` (focused). Ask the step lead before `npm test` or `cargo test --workspace`.
  Run every test that imports or reads a file you change (`rg -l <symbol|file> test apps packages`).
- No plan ids, phase numbers or finding codes in code, test names or commits. No env switch or test-only branch.
- Before each commit `/usr/bin/git diff --cached --stat`; explain any large deletion; stage explicit paths; never `git stash`.
- Push at least every 30 minutes. Never push to `main`. Do not edit `CHANGELOG.md` or `Cargo.lock`; a new crate
  dependency edge means stop and ask the step lead.
- Every Rust change: `cargo fmt --all`, then regenerate the census (`node scripts/git-one-door-scan.mjs --root . --write-census`), never hand-merge it.
- Report path: `fgos convention path --kind report --type phase --slug <s2|s3|s23>-pNN-<slug> --plan 261115-0759-rust-verb-migration-s2-s3 --json`
  (run from the main checkout). End with `Status / Summary / Concerns`, the proposed `## [Unreleased]` line, and
  the table "retired test -> owner now".

## Port recipe (every verb phase)

1. Rust owner: the use case moves into the crate that owns the job (named per phase), with unit tests at the lowest layer.
2. Host wiring: one operation descriptor in `packages/host-runtime/rust/src/catalog.rs` (`CATALOG`, line 17), the
   provider registered in `apps/fgos/src/main.rs` (`COMPOSITION_PROVIDERS` 101 and the registration block 228-276),
   a projector arm in `apps/fgos/src/cli_projector.rs` (`project_cli_invocation` 14) that reads **only** the shared
   parser's output (`fgos_host_runtime::cli_args`), the sub-command table in `routing.rs` `NATIVE_SUBCOMMANDS` (80),
   the annotation in `packages/host-runtime/contracts/command-route-annotations.json`, `native: true` in
   `src/cli/command-registry.mjs`; regenerate `command-routes.json` and `command-manifest.json`
   (`node scripts/export-command-selectors.mjs`).
3. Parity: the verb's table `test/rust-host/parity-cases/<verb>.cases.mjs` runs green against the step's base
   release (phase 01's mechanism) before the Node code is deleted; the counts go in the report.
4. Delete in the same phase: the `bin/fgos.mjs` arm, its static imports (and their `ARM_STATIC_IMPORTS` lines,
   `test/architecture.test.mjs:1660`), the Node use case, and every Node test whose behaviour now has a Rust
   owner; a Node module other verbs still need becomes a thin adapter over the addon (F0 precedent:
   `src/runner/worktree.mjs` `admitStoreAccess`). Rows of deleted test files leave `test/suite-baseline.json`.
5. Exit: the phase's `doors` row(s) in `docs/architecture-manifest.json` pass, the retired names are in the step's
   "retired Node verb code" row (allowed: none), and no entry is added to the `parse CLI arguments (twin)` row's
   debt (a ported verb reads its call only through `cli_args`; the row's `starts_with("--")` pattern fails any
   private parser). A ported verb never joins `LENIENT_ROOT_VERBS` (`apps/fgos/src/invocation_doors.rs:26-35`;
   the guard test at 781 fails if it does).

## Order and landing

```text
00 facts (S2+S3) ─┐
01 shared seam ───┴─> lands on main alone (small series), then:
S2: 02 git ─────────────────────────────────┐
    03 hot record ─> 04 lock-status ─> 05 lock fence ─┼─> 11 S2 close ─> S2 lands on main
    06 worktree (Q1 = a only) ───────────────┘
S3: 07 events ─────────┐
    08 session ────────┤
    09 gateway ────────┼─> 12 S3 close ─> (S2 landed) S3 rebases on main ─> 13 flag spelling (Q2) ─> S3 lands
    10 agents (Q1 = a) ┘
```

- Integration branches `rust-verb-migration-program/s2` and `.../s3` are cut from `main` after phase 01 lands.
  Each phase rebases onto its integration head to land (fast-forward only). S2 lands on `main` first (it carries
  the first store-touching wiring proof, program risk row "Doors wired in the host with no native consumer");
  S3 then rebases onto `main`, regenerates the generated files, reruns its gates and lands. Nothing of a step
  reaches `main` alone.
- Each phase report names its `## [Unreleased]` line; the step lead writes them at landing.

## Phases

| # | Phase | Step | Wave | Blocked by | Effort | File |
|---|---|---|---|---|---|---|
| 00 | Facts and baselines | S2+S3 | A | - | 1d | [phase-00-facts-and-baselines.md](phase-00-facts-and-baselines.md) |
| 01 | Shared host seam: parity against the base release, new verbs read only the shared parser, Event Store child faults | S2+S3 | A | 00 report before landing | 1.5d | [phase-01-shared-host-seam.md](phase-01-shared-host-seam.md) |
| 02 | `git status|recover` native | S2 | B | 00, 01 landed | 1.5d | [phase-02-git-status-recover.md](phase-02-git-status-recover.md) |
| 03 | Hot record door in holder-lock | S2 | B | 00 | 2d | [phase-03-hot-record-door.md](phase-03-hot-record-door.md) |
| 04 | `lock-status` native (first store-touching wiring proof) | S2 | C | 01, 03 | 2.5d | [phase-04-lock-status.md](phase-04-lock-status.md) |
| 05 | `lock fence` native | S2 | C | 01, 03; lands after 04 | 2d | [phase-05-lock-fence.md](phase-05-lock-fence.md) |
| 06 | `worktree create|remove` native (only if Q1 = a) | S2 | B | 00, 01, Q1 | 3d | [phase-06-worktree.md](phase-06-worktree.md) |
| 07 | `events sync|status|seal|export` native | S3 | B | 00, 01 | 2.5d | [phase-07-events.md](phase-07-events.md) |
| 08 | `session start|end|list|gc` native | S3 | B | 00, 01 | 3d | [phase-08-session.md](phase-08-session.md) |
| 09 | `gateway start|stop|status` native | S3 | B | 00, 01 | 2d | [phase-09-gateway.md](phase-09-gateway.md) |
| 10 | `agents list` native (only if Q1 = a) | S3 | B | 00, 01, Q1 | 3d | [phase-10-agents.md](phase-10-agents.md) |
| 11 | S2 close: docs, proof consolidation, parity re-run, gates | S2 | D | 02-05 (06) | 1d | [phase-11-s2-close.md](phase-11-s2-close.md) |
| 12 | S3 close: docs, proof consolidation, parity re-run, gates | S3 | D | 07-09 (10) | 1d | [phase-12-s3-close.md](phase-12-s3-close.md) |
| 13 | One `--flag=value` rule for every native verb (Q2) | S3 | E | 12, Q2, S2 landed | 1.5d | [phase-13-flag-spelling.md](phase-13-flag-spelling.md) |

Critical path: 00 -> 03 -> 04 -> 05 -> 11 (S2 lands) -> S3 rebase -> 13, about 10 lead-days
(1 + 2 + 2.5 + 2 + 1 + 0.5 + 1.5). S3's own longest chain (00 -> 08 -> 12) is 5 days and finishes inside it.

### Parallel map

```text
Wave A: [00 facts] [01 shared seam]                       (start together; 01 lands only after 00's report)
Wave B: S2 [02 git] [03 hot record] [06 worktree*]   ||   S3 [07 events] [08 session] [09 gateway] [10 agents*]
        (all need 00; their flip commits need 01 on main; * only if Q1 = a)
Wave C: S2 [04 lock-status] [05 lock fence]                (need 03; 05 lands after 04)
Wave D: [11 S2 close]   ||   [12 S3 close]
Wave E: S2 lands on main -> S3 rebases on main -> [13 flag spelling, on S3] -> S3 lands
```

### Hot files (one writer at a time, in this order; generated files are regenerated, never hand-merged)

| File | Writers in order |
|---|---|
| `apps/fgos/src/invocation_doors.rs` | 01 -> 13 (no verb phase edits it) |
| `apps/fgos/src/routing.rs` | 01 -> S2: 02, 04, 05, 06 (one `NATIVE_SUBCOMMANDS` line each, landing order) -> S3: 07, 08, 09, 10 -> 13 |
| `apps/fgos/src/main.rs`, `apps/fgos/src/cli_projector.rs`, `apps/fgos/src/cli_presenter.rs`, `packages/host-runtime/rust/src/catalog.rs` | S2 phases in landing order; S3 phases in landing order; S3 rebases after S2 lands (additive list lines) |
| `packages/host-runtime/contracts/command-route-annotations.json`, `src/cli/command-registry.mjs` | as above; 13 last |
| `packages/host-runtime/contracts/command-routes.json`, `command-manifest.json` (generated) | every flip regenerates; on rebase rerun `node scripts/export-command-selectors.mjs` |
| `bin/fgos.mjs` | every verb phase deletes its own arm and imports (different hunks); 07 also edits nothing else here |
| `test/architecture.test.mjs` (`ARM_STATIC_IMPORTS` 1660-1700) | 02, 04, 05, 06 (S2) ; 07, 08, 09, 10 (S3); the list only shrinks |
| `docs/architecture-manifest.json` | every phase adds its rows; 11 and 12 add the per-step "retired Node verb code" rows; 13 edits the `parse CLI arguments (twin)` row |
| `test/rust-host/verb-parity.test.mjs` (step branches only, never on `main`) | step lead adds it as the first commit of each integration branch; each verb phase adds its table name; 11 and 12 rerun every table and delete runner and tables |
| `apps/fgos/tests/cli_tests.rs` | 04 (wiring proof) -> 05 -> 07 -> 08 -> 09 (one case each) |
| `packages/holder-lock/rust/src/lib.rs` | 03 -> 04 -> 05 |
| `packages/git/rust/src/lib.rs` | 02 (S2) ; 08 (S3); one `pub mod` line each |
| `packages/git/node-addon/src/git.rs` | 02 only; `holder_lock.rs`: 03 only; `lib.rs`: 08 (new `session.rs`), then 10 |
| `src/event-store/maintenance.mjs`, `src/util/spawn-detached-fgos.mjs` | 07 only (08 and 09 delete callers, not lines here) |
| `test/suite-baseline.json` | every phase that deletes a test file removes its row |
| `packages/git/contracts/mutation-census.v1.json` (generated) | every phase regenerates its own |

## File set (complete, for the overlap check)

Create:
- Rust: `packages/git/rust/src/incidents.rs` (02), `packages/holder-lock/rust/src/hot_record.rs` (03), `packages/holder-lock/rust/src/status.rs` (04),
  `packages/holder-lock/rust/src/fence.rs` (05), `packages/git/rust/src/session_checkout.rs` (08), `packages/git/node-addon/src/session.rs` (08),
  `apps/fgos/src/wiring/events.rs` (07), `apps/fgos/src/wiring/session.rs` (08, the host half: shutdown seal),
  `apps/fgos/src/wiring/gateway_control.rs` (09); Q1 = a only: the provisioning module (06) and the agent definitions module (10), names fixed by 00
- Contracts and vectors: `packages/holder-lock/contracts/main-checkout-activity.v1.json` (04, beacon shape), `test/rust-host/fixtures/session-registry-vectors.json` (08) where 00 finds no existing contract
- Tests (transitional, never reach `main`): `test/rust-host/verb-parity.test.mjs` (first commit of each integration branch), `test/rust-host/parity-cases/{git,lock-status,lock,events,session,gateway}.cases.mjs` (+ `worktree`, `agents` if Q1 = a); all deleted by 11/12
- Reports under `plans/261115-0759-rust-verb-migration-s2-s3/reports/`

Modify:
- Host: `apps/fgos/src/main.rs`, `routing.rs`, `invocation_doors.rs`, `cli_projector.rs`, `cli_presenter.rs`, `apps/fgos/src/wiring/mod.rs`, `apps/fgos/tests/cli_tests.rs`
- Kernel and crates: `packages/host-runtime/rust/src/catalog.rs`, `packages/holder-lock/rust/src/lib.rs`, `packages/git/rust/src/lib.rs`, `packages/git/node-addon/src/{git.rs,holder_lock.rs,lib.rs}`, `packages/event-store/rust/src/lib.rs` (07, only if an op needs a public entry 00 finds missing)
- Contracts: `command-route-annotations.json`, `command-routes.json` and `command-manifest.json` (generated), census (generated), `packages/holder-lock/contracts/hot-lock.v1.json` (03, only if 00 finds a field the Rust reader needs undocumented)
- Node: `bin/fgos.mjs`, `src/cli/command-registry.mjs`, `src/git/status.mjs` (02, adapter), `src/state/hot-lock.mjs` (03, read/judge/clear become adapters), `src/event-store/maintenance.mjs` and `src/util/spawn-detached-fgos.mjs` (07), `src/runner/session.mjs` (08, adapter for `listSessions`), `scripts/run-tests.mjs` (01, one `TEST_ENV_KEYS` entry)
- Tests: `test/rust-host/harness.mjs` and `harness.test.mjs` (01), `test/architecture.test.mjs`, `test/suite-baseline.json`, `test/cli/helpers/fgos-cli-harness.mjs` (08: its `createSession` import), `test/setup/checks.test.mjs` (08), `test/setup/event-store-checks.test.mjs` (07: `syncUseCase` import), `test/event-store/triggers.test.mjs` (07), `test/cli/fgos-claim-2.test.mjs` and `test/cli/fgos-claim.test.mjs` (04: lock-status cases), `test/cli/fgos-lock-fence.test.mjs` (05 keeps only the `main-checkout-reset` case), `test/rust-host/command-routes.test.mjs` and `test/cli/subcommand-flag-drift.test.mjs` (only if their counts or verb lists name these verbs), `test/observe/invocation-fault-log.test.mjs` (06: `worktree frobnicate` case)
- Docs (closes): `docs/platform/holder-lock/spec.md` (§13, §15, §17, §20), `docs/platform/git/spec.md` (§20 and the session paragraph), `docs/platform/event-store/spec.md` (child spawn paragraph near 454, decision history), `docs/platform/runner/spec.md` (session), `docs/explanation/fgos-gateway-lifecycle-verb.md`, `docs/platform/herdr-web-dashboard/spec.md` (78, 239: unchanged verb, native host), `docs/platform/host-invocation-routing/spec.md` (§2 counts, §9), `contracts/command-route-descriptor.md` (recount), `docs/reading-map.md` (rows 174, 189, 190 and new source paths), `AGENTS.md` ("Legacy-Node CLI Ownership Boundary" paragraph only, if the lock-verb sentence changes), `core/skills/fgos-lock-fence/SKILL.md` (only if its text names the Node channel), `scripts/check-decision-citation-drift.baseline.json` (only if the drift check asks)

Delete:
- `src/runner/lock-status.mjs`, `src/runner/lock-fence.mjs`, `src/verbs/events/{sync,status,seal,export}.mjs`, `src/runner/gateway-control.mjs`; Q1 = a: `src/verbs/worktree/*`, `src/runner/agent-listing.mjs` only if 10 moves doctor's two calls
- Tests: `test/runner/lock-status.test.mjs`, `test/cli/fgos-git.test.mjs`, `test/runner/gateway-control.test.mjs`, `test/cli/fgos-gateway.test.mjs`; others shrink (owners named per phase)
- The transitional parity runner and tables (11, 12)

## Collision watch (HARDEN's request)

Checked against `origin/capability-reads-one-door` `3ec1a7812` (phases 01-05 landed there, 06-08 open) and
`plans/261114-2215-one-door-debt` on `main` (phases 05 and 16 open; every other phase landed). Neither plan's
open phases touch `apps/`, `packages/`, `src/runner/{lock-*,session,gateway-control,agent-listing}.mjs`,
`src/verbs/**`, `src/git/**`, `src/event-store/**` or `src/state/hot-lock.mjs`.

| Shared file | S2/S3 change | Other plan's change | Mitigation |
|---|---|---|---|
| `bin/fgos.mjs` | S2: static imports 102-105, arms 884-896, 3510-3531, 3774-3794; S3: 2632-2652, 3546-3572, 3579-3600, 3635-3641 | capability 07: `case 'tool'` 3642-3677 and static import 47 | the `agents` arm (3635-3641) is the hunk next to `tool`: whoever lands second rebases by hand; every other hunk is far apart |
| `src/cli/command-registry.mjs` | `native: true` in eight entries (124, 1733, 2190, 2236, 2330, 2465, 2494, 2510) | capability 07: deletes `tool` (2294-2328) | `agents` (2330) sits right after `tool`; rebase; regenerate both generated files after the second landing |
| `command-routes.json`, `command-manifest.json` | regenerated | capability 07 regenerates | never hand-merge; rerun `node scripts/export-command-selectors.mjs` after the second landing |
| `docs/architecture-manifest.json` | new `doors` rows; 13 edits the parse row | capability 06 (file row), 07 (deletes `tool-registry` row), 08 (`doors` rows); one-door-debt 05, 16 (remove debt entries) | additive rows; second lander rebases and reruns `test/architecture.test.mjs`; a stale debt entry fails by name |
| `test/architecture.test.mjs` | `ARM_STATIC_IMPORTS` lines out (lock-status, lock-fence, git/status, session) | capability 07: one `ARM_STATIC_IMPORTS` line (`tool-registry`) | lines removed from one shrinking list; rebase |
| `test/suite-baseline.json` | rows of deleted test files out | capability 07: rows of its three deleted tests | different rows; rebase |
| `AGENTS.md` | closes: the "Legacy-Node CLI Ownership Boundary" sentence on lock verbs, only if it changes | capability 07: 228-262 (dispatch section) | different section; rebase |
| `docs/reading-map.md` | rows 174, 189, 190 and new paths (closes) | capability 06 edits 158 | different rows; rebase |
| `src/setup/registrations.mjs` | **not edited** (02 keeps `src/git/status.mjs` exports, so `src/setup/git-checks.mjs` and doctor are unchanged; 10 keeps `listAgents`/`agentRenderWarnings` reachable) | capability 07 (line 99, row 990-1025); one-door-debt 16 (personas 809-863, 517, activation reads) | none needed; if Q1 = a and 10 must touch doctor's agent calls, 10 starts after one-door-debt 16 lands |
| `doors` row "agent definition tier directories" | 10 (Q1 = a) moves `allowed` to the Rust owner | one-door-debt 16 removes its `registrations.mjs` debt entry | same JSON object: 10 rebases after 16; the check names any stale entry |
| `test/runner/agent-definitions.test.mjs` | 10 (Q1 = a) moves its cases to the Rust owner | one-door-debt 16 names it as owning test | 10 starts after 16 lands; with Q1 = c no collision |
| `src/runner/execution/seat-policy.mjs`, `src/setup/bin-discovery.mjs`, `src/runner/dispatch/**`, `src/runner/execution/**` | not edited (04 only drops `lock-status.mjs`'s imports of `dispatch/assignment-layout.mjs` and `execution/case-run-paths.mjs` by deleting it) | one-door-debt 05, 16; capability 06 | none |
| `packages/git/contracts/mutation-census.v1.json` | regenerated | regenerated by every product change | regenerate after each landing |

S2 against S3 (shared files, both steps): `apps/fgos/src/{main.rs,routing.rs,cli_projector.rs,cli_presenter.rs}`,
`apps/fgos/tests/cli_tests.rs`, `packages/host-runtime/rust/src/catalog.rs`, `command-route-annotations.json`,
`src/cli/command-registry.mjs`, the two generated route files, `bin/fgos.mjs`, `test/architecture.test.mjs`,
`docs/architecture-manifest.json`, `test/suite-baseline.json`, the census, `packages/git/rust/src/lib.rs`,
`docs/platform/git/spec.md`, `docs/reading-map.md`. All edits are additive
lines in lists or deletions of separate hunks; mitigation is the fixed landing order (S2 first, S3 rebases) and
regeneration of generated files. Disjoint by construction: S2 owns `packages/holder-lock/**`, `src/state/hot-lock.mjs`,
`src/git/status.mjs`, `packages/git/node-addon/src/{git.rs,holder_lock.rs}`; S3 owns `src/event-store/**`,
`src/util/spawn-detached-fgos.mjs`, `src/runner/session.mjs`, `packages/git/node-addon/src/{session.rs,lib.rs}`,
`apps/fgos/src/wiring/{events,session,gateway_control}.rs`. Each step's parity tables are separate files.

## Exit criteria (measurable)

1. `command-routes.json`: `lock`, `lock-status`, `git`, `events`, `session`, `gateway` (and `worktree`, `agents` if
   Q1 = a) have `route_kind: native` and an `operation_id`; counts 80 routes, native 8 -> 14 (16), legacy-cli 72 -> 66 (64).
2. No Node process for any flipped verb: the harness PATH shim records zero `node` children for every parity case
   on the host entry (`test/rust-host/harness.mjs:37`, `node` is shimmed), and one `cli_tests.rs` case per step runs
   a flipped verb with a PATH `node` wrapper that fails if started.
3. Parity: every table ran green host-vs-base-release on the step's integration head before the close phase deleted
   it; case counts per verb in the close reports. Accepted differences are only the three listed under Outcome.
4. The Node arms, use cases and named tests are gone; each step's "retired Node verb code" row (allowed none) passes;
   every new `doors` row passes and would fail on a second path (each row's own negative case in the report).
5. The `parse CLI arguments (twin)` row gains no debt entry; `LENIENT_ROOT_VERBS` still lists exactly the eight
   pre-F0 native verbs; after 13 the row's debt and `named_dir` are as Q2's answer says.
6. The first store-touching native verb (`lock-status`, 04) proves the F0 doors through the binary: from a linked
   worktree with a frozen `.fgos`, a `store: read` call passes admission with its warning; a call with `--dir`
   naming a non-project is refused `dir-invalid` with one fault record in the caller's store; on Linux the end
   trigger runs (an Event Store fault record or a seal visible), off Linux none.
7. Event Store children survive the move: a Node-run store verb's seal and publish children start the host, proved
   by `test/event-store/triggers.test.mjs` (child exit recorded, events sealed).
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
| A Node process spawns a flipped verb through `bin/fgos.mjs` and is refused (lost Event Store seal/publish child) | H x H | 07 moves `spawnDetachedCli`'s events children to the host binary; 00 lists every Node spawn of the eight verbs; triggers test proves it (exit criterion 7) |
| Node readers of a moved writer's file (`listSessions` in merge/approve/postland-drift; `readHotRecord` in `withStateTx`) read a shape the Rust writer changed | M x H | Rust owner + Node adapter over the addon (one reader); shared vector files; format unchanged |
| Parity impossible in-tree (Node refuses a `native` verb, `bin/fgos.mjs:4066-4071`) | certain | compare the host with the step's base release (phase 01), not with this tree's Node |
| `lock fence` confirmation needs a person; a native provider never blocks (migration doc §9) | certain | provider returns `parked` with the holder list; the CLI host asks on a TTY and reinvokes with the confirmation; no TTY = Node's refusal |
| Gateway REST `/v1/sessions` parses `fgos session start|end --json` (`apps/fgos-gateway/src/gateway.rs:1091, 1115`) | M x H | session parity cases are exact on `data`; `cargo test -p fgos-gateway` in 08's gates |
| Writes compared in parity (no dual-run, §11) | M x M | each write case runs on its own fresh fixture per entry (`fs-delta`), never on shared state |
| S2 and S3 both editing host list files | H x L | fixed landing order, additive lines, regeneration |
| Pulling tier-5 modules (provisioning, agent definitions) into S2/S3 | M x M | Q1 |
| Two `--flag=value` rules live after S3 | certain until Q2 | Q2 batched; phase 13 applies the answer |

Rollback: each phase reverts on its integration branch; a landed step reverts as one series. Rollback of a
native verb in the field is a release rollback through `fgctl` (migration doc §13): the previous release still
has the Node arm. No on-disk format changes, so an older release reads everything S2/S3 wrote (`sessions.json`
keeps its shape; only its write becomes atomic).

## Red Team Review

Filled in below after the review round (see "Red Team Review — session 2026-11-15").

## Validation Log

Filled in below.

## Owner questions (batch)

Asked once, together, when this plan is approved. Neither blocks wave A, phase 01 or the other verb phases:
Q1 gates only 06 and 10; Q2 gates only 13.

### Q1: `worktree` and `agents` — port now, or move them to the step that moves their shared module?

- **What is happening:** two of the eight verbs are thin faces over Node modules that the runner (tier 5) also
  uses. `worktree create|remove` provisions the checkout (`provisionWorktree`, `removeProvisioned`,
  `src/runner/worktree.mjs:268, 370`: `npm ci`, skill-directory copies, the `worktree-provisioning.v1` record) and
  the runner calls the same functions (`src/runner/worktree.mjs:823, 1347, 1411`). `agents list` reads persona
  definitions through `src/runner/agent-definitions.mjs`, which eight runner, workflow and doctor modules import
  (`unit-run-start.mjs:22`, `run-request.mjs:11`, `dispatch/assignment.mjs:49`, `agent-roster.mjs:13`,
  `setup/registrations.mjs:39`, `workflow/case-start.mjs:19`, `agent-listing.mjs:13`, `scripts/project-agents.mjs:37`).
  No Rust code reads persona definitions or provisions a checkout.
- **Cause:** the program put verbs into steps by the verb's tier; these two verbs' use cases live one layer up.
  A native verb may not call back into Node (host spec §5), so porting the verb means porting the module.
- **Options:**
  - (a) Port the modules now: Rust owner (provisioning; agent definitions) with the Node modules as adapters over
    the addon, every runner caller unchanged. About +6 lead-days (phases 06, 10), new crate modules and addon
    entries, runner hot paths (claim, approve, persona resolution) switch to the addon early; 10 must wait for
    one-door-debt 16. Gain: S5 (`bind()` needs personas) and S6a (provisioning) find them done.
  - (b) Twin now: Rust copies with shared vectors, Node keeps its own until S5/S6a. About +4 days now and a second
    path in two places until then (against design principle 1).
  - (c) Move the verbs: `agents` joins S5 (with `bind()` and the persona model), `worktree` joins S6a (with the
    runner's provisioning). No cost now; S2 and S3 finish about 6 days sooner; the verbs keep their Node latency
    (about 100 ms) until then; nothing a user sees changes.
- **Recommendation:** (c). It keeps the layers in order (the program's own rule "layers serial"), avoids a second
  path, and the per-call gain of these two verbs is small next to `npm ci` or a panel run.
- **Scope of the answer:** where `worktree` and `agents` are ported (S2/S3 vs S6a/S5). It does not change the
  program's step order or any other verb; under (c) the program's S5 and S6a rows gain one verb each.

### Q2: `--flag=value` — one rule for every native verb

- **What is happening:** after S2/S3, 14-16 verbs are native. The eight that were native before F0 read their
  own spellings: `--flag=value`, `--dir=<path>` (`named_dir`, `apps/fgos/src/invocation_doors.rs:404-414`), and the
  sub-command as the first non-flag token (`routing.rs:162`). Every verb ported in S2/S3 reads only the shared
  parser, which, like Node's (`src/cli/parse-args.mjs:8-27`), has no `=` form: `--dir=/x` is a flag named `dir=/x`,
  and `--json show` makes `show` the value of `--json`. This is the open question of F0 phase 08 and of the host
  spec §9; the program row says the last verb's step answers it.
- **Cause:** the pre-F0 native verbs were written with their own parsers (debt entries `cli_projector.rs`,
  `wiring/mailbox_verbs.rs`, `packages/observe/rust/src/flags.rs` in the `parse CLI arguments (twin)` row); the
  shared parser was written to equal Node's.
- **Options:**
  - (a) `=` goes away everywhere: the eight verbs move onto the shared parser; `named_dir` and the three debt
    entries go; `fgos config show --path=a.b`, `--dir=/x` and `fgos config --json show` stop working (refused with
    the unknown-flag or missing-sub text, exit 4). About 1.5 days, mostly deletion; phase 00 counts every `=` use in
    shipped skills, hooks and docs, and 13 rewrites each one in the same change.
  - (b) `=` accepted everywhere: both parser twins learn `--k=v` (one vector file); every Node verb accepts it too;
    then the eight verbs move onto the shared parser. About 2 days; a new spelling for 66 legacy verbs (a behaviour
    added, RUL104 asks to avoid that).
  - (c) Keep both rules until S7. No cost now; two spellings live, the debt stays visible.
- **Recommendation:** (a), provided phase 00 finds no use that a skill or a project script cannot be rewritten
  for; it leaves one rule (Node's), deletes code, and adds nothing.
- **Scope of the answer:** how native verbs read `--flag=value`, `--dir=` and the sub-command word. Not root
  leniency (`LENIENT_ROOT_VERBS` stays: the mailbox behaviours it protects are separate), not the Node CLI's own
  rules under (a) or (c).
