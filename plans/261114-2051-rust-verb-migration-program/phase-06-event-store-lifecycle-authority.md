---
phase: 6
title: "Event Store maintain, config authority and the global directory"
status: pending
effort: 3.5d
wave: B
blockedBy: [0]
---

# Phase 06: Event Store maintain, config authority and the global directory

The maintain policy of Event Store spec §16 (seal what is due, seal all on shutdown, decide whether a
publish is due), the store construction it needs, and the `eventStore` config reading with its refusal
rule each get one Rust owner: `fgos-event-store` (tier 3) for maintain and construction, `fgos-config`
(tier 1) for the config section. Node's `maintainEventStore` and `readEventStoreConfig` become adapters;
the addon and the host call the same functions. The per-command wrapper that decides *when* triggers run
stays per process (Node `runWithEventStoreLifecycle`, host door in phase 08): three booleans and a callback.

It also takes the global-directory half of door-census leak rank 4: where `~/.fgos` is, decided once by Config
(`packages/config/rust/src/machine.rs`, `docs/platform/config/spec.md`) and reached from Node through the addon's
`config` namespace, which this phase already owns.

## Phase-lead rules (every F0 phase)

- Repo `/home/vantt/projects/forgent` on fg-server2. Read `AGENTS.md`, `docs/reading-map.md`, then this file.
- Worktree: `/usr/bin/git worktree add -b rust-verb-migration-program/f0-p06 /home/vantt/projects/forgent-worktrees/rvm-f0-p06 origin/rust-verb-migration-program/f0`. Assert it is in `git worktree list`.
- `export CARGO_TARGET_DIR=/home/vantt/projects/forgent-worktrees/rvm-f0-p06-target` (ext4, never `/tmp`). Delete it when the phase lands.
- Tests: `node scripts/run-tests.mjs <file.test.mjs> ...` (focused). Ask the F0 lead before `npm test` or `cargo test --workspace`. Also run every test that imports or reads a file you change (`rg -l "maintainEventStore|readEventStoreConfig|eventStoreConfig|prepareStore" test`).
- No plan ids, phase numbers or finding codes in code, test names or commits. No env switch or test-only branch.
- Before each commit: `/usr/bin/git diff --cached --stat`; explain any large deletion. Stage explicit paths. Never `git stash`.
- Push the phase branch at least every 30 minutes. Never push to `main`. Do not edit `CHANGELOG.md` or `Cargo.lock` (a new dependency edge means stop and ask).
- Report: `fgos convention path --kind report --type phase --slug f0-p06-maintain --plan 261114-2051-rust-verb-migration-program --json`. End with `Status / Summary / Concerns`.

## Context

- Node policy: `maintainEventStore(cwd, {trustedMain, shutdown, end, dispatched})` (`src/event-store/maintenance.mjs:38-58`):
  main root, config, `prepareStore`, `maintenance` facts, `sealAll` on shutdown else `sealIfDue` per stream with
  `seal.intervalSec`, then on `end && !dispatched` a publish when `syncDue` (12-15), handed to a detached
  `fgos events sync --opportunistic` child. Every step is attempted; the first error is returned; nothing throws.
  Callers keep the signature: the wrapper (85), `src/runner/gateway-control.mjs:359`, `src/runner/session.mjs:387`,
  `src/runner/loop.mjs:1788` (they pass `trustedMain` as a value or a function; the adapter resolves it before calling Rust).
- Store construction lives in the addon today: `driver_for`, repo resolution, machine id, state root, `detached`, held
  ranks and hot-lock depth (`packages/git/node-addon/src/event_store.rs:183-209, 308-345`; Node `src/event-store/native.mjs:12, 52-72, 121-127`).
  `sealIfDue` has a second, Work-side caller: `src/state/consumer-event-gate.mjs:85` (not changed here).
- Config: Node `eventStoreConfig`/`readEventStoreConfig` (`src/event-store/config.mjs:8-47`) apply minimums and a refusal
  rule (a refused config not naming `eventStore` gives `sync.intervalSec = 0`; one naming an `eventStore` value throws).
  The host reads one raw value in `apps/fgos/src/wiring/mailbox_config.rs:104-118` (phase 08 switches it).
  Standard defaults: `core/config-standard/eventStore.yaml`.
- Platform: the Event Store runs on Linux only (`eventStorePlatformSupported`, `src/event-store/native.mjs`).
- Phase 00 answers U1 (seal coalescer), U2 (`prepareStore`), U6 (config in Rust) and whether the mailbox sync child's
  stamp rule (`apps/fgos/src/wiring/mailbox_hook.rs:186-224`) is the same job as `syncDue`.
- Behaviour tests: `test/event-store/triggers.test.mjs` (11), `test/event-store/lifecycle.test.mjs` (7, the wrapper).

## Requirements

1. `fgos-config`: one module reading the `eventStore` section into a typed value with Node's minimums and refusal rule;
   exposed through the addon's existing `config` namespace (`packages/git/node-addon/src/config.rs`). Node
   `readEventStoreConfig`/`eventStoreConfig` become adapters with the same signatures and errors.
2. `fgos-event-store`: the store constructor (driver, repo, machine id, state root, `detached`) moves from the addon into
   the crate; the addon calls it. No new crate edge (the crate already depends on `fgos-git`, `fgos-identity`, `fgos-holder-lock`).
3. `packages/event-store/rust/src/lifecycle.rs`: `maintain(cwd, trusted_main, config, policy {shutdown, end, dispatched}, held_ranks, now) -> { error: Option<String>, sync_due: bool }`
   with Node's step order, "attempt each step, keep the first error", and the sync-due rule; `sync_due` only when
   `end && !dispatched`. The caller spawns the child. Plus `platform_supported()` as the one answer to "does the Event Store run here".
4. Sync-due ownership: if phase 00 found the mailbox stamp rule is the same job, make `lifecycle` the one owner and record
   the switch for phase 08; if it is a different job (mail take vs event publish), write the evidence into the report and
   into the `doors` row reason phase 08 adds.
5. **Global directory.** `fgos-config` answers "where is the global fgOS directory" in one function next to
   `machine::home_dir` (101), and the addon `config` namespace exposes it. Node gets one door,
   `globalFgosDir()` exported from `src/config/facade.mjs`, which asks the addon (it reads `HOME` at call time, as
   the facade's own comment at 34 requires); the facade's default at 36 uses it. Move these Node choosers onto it:
   `src/setup/bin-discovery.mjs:85`, `src/setup/runner-config-conversion.mjs:290`,
   `src/runner/dispatch/confinement/backend-registry.mjs:190`, `src/runner/dispatch/confinement/resources.mjs:636`,
   `src/runner/dispatch/provider-capacity.mjs:41` (each keeps its own env override, for example
   `FGOS_CONFINEMENT_BACKEND_REGISTRY_PATH`, and the file name under the directory). Two stay as recorded debt in the
   phase 08 row, with reasons: `src/setup/registrations.mjs:517` (the concurrent capability-reads plan edits that file;
   whichever lands second moves it) and `packages/distribution/rust/src/uninstall.rs:445` (`fgos-distribution` does not
   depend on `fgos-config`, an edge would change `Cargo.lock`; it moves with `uninstall` in S4).
6. Node `maintainEventStore` keeps signature and return; it calls the addon and spawns `spawnDetachedCli` when `sync_due`.
   Delete `syncDue` and the seal loop from Node. The wrapper `runWithEventStoreLifecycle` is unchanged.

## Files

- Create: `packages/event-store/rust/src/lifecycle.rs` (+ the constructor module if it is not placed in `lifecycle.rs`),
  one `fgos-config` module for the `eventStore` section (name it in the report).
- Modify: `packages/event-store/rust/src/lib.rs`, `packages/config/rust/src/lib.rs`, `packages/config/rust/src/machine.rs`,
  `packages/git/node-addon/src/event_store.rs`, `packages/git/node-addon/src/config.rs`, `src/event-store/maintenance.mjs`,
  `src/event-store/config.mjs`, `src/config/facade.mjs`, `src/setup/bin-discovery.mjs`, `src/setup/runner-config-conversion.mjs`,
  `src/runner/dispatch/confinement/backend-registry.mjs`, `src/runner/dispatch/confinement/resources.mjs`,
  `src/runner/dispatch/provider-capacity.mjs` (none of these seven Node files is in the capability-reads plan's set at `023b35130`),
  `test/event-store/triggers.test.mjs`, the Node test that owns `eventStoreConfig` today (find with `rg -l eventStoreConfig test`).
- Delete: none.
- Unit tests (Rust): seal only streams older than the interval; shutdown seals all; sync due / not due / other remote /
  interval 0 / dispatched never; unreadable store is an error code; a failing step does not stop the next; config minimums
  and both refusal outcomes.
- Tests retired: in `triggers.test.mjs`, "seals only streams older than the seal interval and everything on shutdown" (47)
  and "a store that cannot be opened is reported as a code" (133) → `lifecycle.rs`; the Node config-rule cases → the
  `fgos-config` module tests. The rest stay as Node wiring proofs (child hand-off, no second child in flight, CLI records, Land sweep).
- Net size: Node about -70, Rust about +430 (half tests).

## Gates

- `cargo fmt --all --check`; `cargo clippy -p fgos-event-store -p fgos-config -p fgos-node-addon --all-targets -- -D warnings`; `cargo test -p fgos-event-store -p fgos-config`
- `cargo check -p fgos-event-store -p fgos-config -p fgos-node-addon --target x86_64-pc-windows-msvc` and `--target aarch64-apple-darwin`
- `node scripts/run-tests.mjs test/event-store/triggers.test.mjs test/event-store/lifecycle.test.mjs test/event-store/background-seal.test.mjs test/architecture.test.mjs test/setup/git-mutation-census.test.mjs` plus every hit of the `rg` in the rules above and of `rg -l "facade.mjs|bin-discovery|runner-config-conversion|backend-registry|confinement/resources|provider-capacity" test`.
- One-door scan count not above baseline.

## Risk and rollback

- A sync-due difference publishes twice or never (M x H): table-driven Rust tests; the Node "no second child in flight" case stays.
- Moving the constructor changes lock ranks or hot-lock depth handling (M x H): the addon passes them through unchanged; `consumer-event-gate` keeps its call.
- Rollback: revert the phase.
