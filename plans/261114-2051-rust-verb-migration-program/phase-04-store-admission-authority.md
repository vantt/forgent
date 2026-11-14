---
phase: 4
title: "Store admission authority"
status: pending
effort: 1.5d
wave: B
blockedBy: [0]
---

# Phase 04: Store admission authority

The decision "may this invocation touch the `.fgos/` store from here" moves into `fgos-git` (tier 2,
worktree and project-root facts), the lowest layer that knows a linked worktree from the main checkout.
Node's `admitStoreAccess` becomes an adapter over the addon; the host calls the same function in phase 08.
The authority moves; nothing is copied.

## Phase-lead rules (every F0 phase)

- Repo `/home/vantt/projects/forgent` on fg-server2. Read `AGENTS.md`, `docs/reading-map.md`, then this file.
- Worktree: `/usr/bin/git worktree add -b rust-verb-migration-program/f0-p04 /home/vantt/projects/forgent-worktrees/rvm-f0-p04 origin/rust-verb-migration-program/f0`. Assert it is in `git worktree list`.
- `export CARGO_TARGET_DIR=/home/vantt/projects/forgent-worktrees/rvm-f0-p04-target` (ext4, never `/tmp`). Delete it when the phase lands.
- Tests: `node scripts/run-tests.mjs <file.test.mjs> ...` (focused). Ask the F0 lead before `npm test` or `cargo test --workspace`.
- No plan ids, phase numbers or finding codes in code, test names or commits. No env switch or test-only branch.
- Before each commit: `/usr/bin/git diff --cached --stat`; explain any large deletion. Stage explicit paths. Never `git stash`.
- Push the phase branch at least every 30 minutes. Never push to `main`. Do not edit `CHANGELOG.md` or `Cargo.lock` (a new dependency edge means stop and ask).
- Report: `fgos convention path --kind report --type phase --slug f0-p04-admission --plan 261114-2051-rust-verb-migration-program --json`. End with `Status / Summary / Concerns`.

## Context

- Node today: `admitStoreAccess({verb, store, mutates, dir, cwd, explicitDir})` (`src/runner/worktree.mjs:547-578`):
  `store-missing` (require and no `.fgos/`), `disconnected-worktree-store` (mutates, not `--dir`, store exists,
  not main, not a session worktree), `init-in-worktree`, a read-mode warning line, and
  `worktree-identity-unreadable` when Git facts cannot be read. It reads facts once
  (`inspectGit(cwd).resolveRepo()`), `isMainWorktree` (509) and `isSessionWorktree` (519-530: `.fgos` is a
  symlink whose realpath is the trusted main's `.fgos`). Messages, including `STORE_MISSING` (532-533), are user-visible.
- Only caller: `bin/fgos.mjs:4247-4249`. `isSessionWorktree` has no other caller; `isMainWorktree` has six
  (`bin/fgos.mjs:3247`, `src/runner/promote-engine.mjs:51`, `src/runner/main-checkout-reset-guard.mjs:111`,
  `src/verbs/merge/approve.mjs:253`, `promote-to-component.mjs:24`, `sync-root.mjs:45`) and stays.
- Rust: `fgos-git` resolves the trusted main root and worktree root (`packages/git/rust/src/inspect.rs`); the
  addon exposes `GitInspect` with a JSON method dispatch (`packages/git/node-addon/src/git.rs:143`, `resolveRepo`).
- Behaviour tests: `test/runner/worktree.test.mjs` from 1500 (`admit(...)` cases); CLI wiring in
  `test/cli/fgos-disconnected-worktree-guard.test.mjs` (owned by phase 03 then 11; do not edit it here).

## Requirements

1. `packages/git/rust/src/store_admission.rs`: one public function taking
   `{store_mode: none|open|read|require, mutates: bool, creates: bool, explicit_dir: bool, dir, cwd}` and
   returning `Admitted { warning: Option<String> }` or `Refused { fault_class, message }`. It reads Git facts
   once through the crate's own inspect, checks dir existence and the session-worktree symlink rule, and
   carries the exact message texts from Node. `creates` replaces the `verb === 'init'` test inside the
   decision (the caller computes it).
2. Addon: expose it from `packages/git/node-addon/src/git.rs` following the existing method pattern
   (no new namespace, no new crate dependency).
3. Node: `admitStoreAccess` keeps its signature and its `StoreError('validation', message, {faultClass})`
   mapping; it passes `creates: verb === 'init'` and returns `{ warning }`. Delete `isSessionWorktree` and
   `STORE_MISSING` from `worktree.mjs`.
4. Same answers for every case the Node tests cover today, including the unreadable-facts refusal.

## Files

- Create: `packages/git/rust/src/store_admission.rs` (+ unit tests: each refusal, explicit dir, session
  worktree real vs forged symlink, init in worktree, read warning, not a repository, unreadable facts).
- Modify: `packages/git/rust/src/lib.rs`, `packages/git/node-addon/src/git.rs`, `src/runner/worktree.mjs`,
  `test/runner/worktree.test.mjs`.
- Delete: none (functions removed inside `worktree.mjs`).
- Tests retired: the `admit(...)` behaviour cases in `test/runner/worktree.test.mjs` (from 1500). New owner:
  `store_admission.rs` unit tests. Keep one Node test proving the adapter maps a refusal to `StoreError`
  with its `faultClass` and passes a warning through.
- Net size: Node about -50, Rust about +180 (half tests).

## Gates

- `cargo fmt --all --check`; `cargo clippy -p fgos-git -p fgos-node-addon --all-targets -- -D warnings`; `cargo test -p fgos-git`
- `cargo check -p fgos-git -p fgos-node-addon --target x86_64-pc-windows-msvc` and `--target aarch64-apple-darwin`
- `node scripts/run-tests.mjs test/runner/worktree.test.mjs test/cli/fgos-disconnected-worktree-guard.test.mjs test/cli/fgos-init-worktree-guard.test.mjs test/observe/invocation-fault-log.test.mjs test/architecture.test.mjs test/scripts/doc-health.test.mjs test/setup/git-mutation-census.test.mjs`
  (drop any file that does not exist; grep `rg -l "init-in-worktree|store-missing|disconnected-worktree-store" test` and run every hit).
- One-door scan count not above baseline (the function spawns no Git: facts come through the crate driver).

## Risk and rollback

- Message text drift (M x M): assert full message strings in Rust tests; the CLI wiring tests match them.
- Symlink realpath differences on Windows/macOS (M x M): use the crate's existing path normalisation; msvc/darwin checks.
- Rollback: revert the phase (Node regains its own decision).
