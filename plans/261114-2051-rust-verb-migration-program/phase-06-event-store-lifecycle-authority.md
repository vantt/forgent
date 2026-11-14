---
phase: 6
title: "Event Store lifecycle authority"
status: pending
effort: 1.5d
wave: B
blockedBy: [0]
---

# Phase 06: Event Store lifecycle authority

The maintain policy of Event Store spec §16 (seal what is due, seal all on shutdown, decide whether a
publish is due) moves into `fgos-event-store` (tier 3). Node's `maintainEventStore` delegates to it
through the addon; the host calls it in phase 08. The per-command wrapper that decides *when* the
triggers run stays where each process runs its verb (Node's `runWithEventStoreLifecycle`, the host's
door in phase 08): it is three booleans and a callback, owned per lane until the last Node verb with a
store leaves (S7).

## Phase-lead rules (every F0 phase)

- Repo `/home/vantt/projects/forgent` on fg-server2. Read `AGENTS.md`, `docs/reading-map.md`, then this file.
- Worktree: `/usr/bin/git worktree add -b rust-verb-migration-program/f0-p06 /home/vantt/projects/forgent-worktrees/rvm-f0-p06 origin/rust-verb-migration-program/f0`. Assert it is in `git worktree list`.
- `export CARGO_TARGET_DIR=/home/vantt/projects/forgent-worktrees/rvm-f0-p06-target` (ext4, never `/tmp`). Delete it when the phase lands.
- Tests: `node scripts/run-tests.mjs <file.test.mjs> ...` (focused). Ask the F0 lead before `npm test` or `cargo test --workspace`.
- No plan ids, phase numbers or finding codes in code, test names or commits. No env switch or test-only branch.
- Before each commit: `/usr/bin/git diff --cached --stat`; explain any large deletion. Stage explicit paths. Never `git stash`.
- Push the phase branch at least every 30 minutes. Never push to `main`. Do not edit `CHANGELOG.md` or `Cargo.lock` (a new dependency edge means stop and ask).
- Report: `fgos convention path --kind report --type phase --slug f0-p06-lifecycle --plan 261114-2051-rust-verb-migration-program --json`. End with `Status / Summary / Concerns`.

## Context

- Node policy today: `maintainEventStore(cwd, {trustedMain, shutdown, end, dispatched})` in
  `src/event-store/maintenance.mjs:38-58`: resolve main, read config (`readEventStoreConfig`), `prepareStore`,
  read `maintenance` facts, `sealAll` on shutdown else `sealIfDue` per stream with `seal.intervalSec`,
  then on `end && !dispatched` a publish when `syncDue` (12-15: interval > 0 and no attempt, another
  remote, or the last attempt older than the interval), handed to a detached `fgos events sync --opportunistic`
  child. Every step is attempted; the first error is returned as `{error}`; nothing throws.
- Callers keep the signature: `src/event-store/maintenance.mjs:85` (the wrapper), `src/runner/gateway-control.mjs`,
  `src/runner/loop.mjs`, `src/runner/session.mjs` (not edited here).
- Rust primitives: `packages/event-store/rust/src/diagnostics.rs:56` (`maintenance`), `seal.rs:554` (`seal_all`),
  `seal.rs:596` (`seal_if_due`). Addon namespace `eventStore`: `packages/git/node-addon/src/event_store.rs`.
- Phase 00 answers U1 (seal coalescer), U2 (what `prepareStore` adds), U6 (config values in Rust).
- Behaviour tests: `test/event-store/triggers.test.mjs` (11), `test/event-store/lifecycle.test.mjs` (7, the wrapper).

## Requirements

1. `packages/event-store/rust/src/lifecycle.rs`: `maintain(cwd, trusted_main, config {seal_interval_sec,
   sync_interval_sec, remote}, policy {shutdown, end, dispatched}, now) -> MaintainOutcome { error: Option<String>, sync_due: bool }`.
   Same step order, the same "attempt each step, keep the first error" rule, the same sync-due rule;
   `sync_due` is true only when `end && !dispatched` and a publish is due. The caller spawns the child.
2. Addon: expose `maintain` in `packages/git/node-addon/src/event_store.rs` (existing namespace).
3. Node: `maintainEventStore` keeps its signature and return; it reads the config as today, calls the addon,
   and spawns the sync child (`spawnDetachedCli`) when `sync_due`. Delete `syncDue` and the seal loop from Node.
4. The wrapper `runWithEventStoreLifecycle` is unchanged.

## Files

- Create: `packages/event-store/rust/src/lifecycle.rs` (+ unit tests: seal only streams older than the interval;
  shutdown seals all; sync due/not due/other remote/interval 0; a dispatched worker never gets `sync_due`;
  an unreadable store is an error code, never a panic; a failing step does not stop the next).
- Modify: `packages/event-store/rust/src/lib.rs`, `packages/git/node-addon/src/event_store.rs`,
  `src/event-store/maintenance.mjs`, `test/event-store/triggers.test.mjs`.
- Delete: none.
- Tests retired: in `test/event-store/triggers.test.mjs`, "a trigger seals only streams older than the seal
  interval and everything on shutdown" (47) and "a store that cannot be opened is reported as a code" (133)
  move to `lifecycle.rs` unit tests. The rest stay as Node wiring proofs (child hand-off, no second child in
  flight, CLI records, Land sweep). `test/event-store/lifecycle.test.mjs` is untouched.
- Net size: Node about -25, Rust about +200 (half tests).

## Gates

- `cargo fmt --all --check`; `cargo clippy -p fgos-event-store -p fgos-node-addon --all-targets -- -D warnings`; `cargo test -p fgos-event-store`
- `cargo check -p fgos-event-store -p fgos-node-addon --target x86_64-pc-windows-msvc` and `--target aarch64-apple-darwin`
- `node scripts/run-tests.mjs test/event-store/triggers.test.mjs test/event-store/lifecycle.test.mjs test/cli/fgos-events.test.mjs test/architecture.test.mjs test/setup/git-mutation-census.test.mjs`
  (also every hit of `rg -l "maintainEventStore|runWithEventStoreLifecycle" test`).
- One-door scan count not above baseline.

## Risk and rollback

- A sync-due difference publishes twice or never (M x H): table-driven Rust tests on the rule; the Node
  "no second child in flight" case stays.
- Rollback: revert the phase.
