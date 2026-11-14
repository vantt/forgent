---
phase: 4
title: "Worktree-tier doors: invocation root and store admission"
status: pending
effort: 3d
wave: B
blockedBy: [0]
---

# Phase 04: Worktree-tier doors: invocation root and store admission

Two decisions every store-touching invocation makes before its verb runs move into `fgos-git` (tier 2:
worktree and project-root facts), the lowest layer that knows a linked worktree from the main checkout:
1. **Which project and `.fgos` an invocation acts on** (`resolveInvocationRoot`, four policies).
2. **Whether it may touch that store from here** (`admitStoreAccess`).

Node's functions become adapters over the addon; the host calls the same functions in phase 08 and
deletes its own walk (`cli_projector::resolve_target_root`). The third walk, `resolve_workspace_root` in
`packages/work-state/rust/src/lib.rs:55-66` (no home stop, no Git bound; door census leak rank 4), moves onto the
same function here. The authority moves; nothing is copied.

The other half of census leak rank 4, the global `~/.fgos` directory chosen in nine places, is Config's door, not the
root's: it goes to phase 06, which owns the Config crate and the addon's `config` namespace file (giving it to this phase
would put two wave-B phases on `packages/git/node-addon/src/config.rs`).

## Phase-lead rules (every F0 phase)

- Repo `/home/vantt/projects/forgent` on fg-server2. Read `AGENTS.md`, `docs/reading-map.md`, then this file.
- Worktree: `/usr/bin/git worktree add -b rust-verb-migration-program/f0-p04 /home/vantt/projects/forgent-worktrees/rvm-f0-p04 origin/rust-verb-migration-program/f0`. Assert it is in `git worktree list`.
- `export CARGO_TARGET_DIR=/home/vantt/projects/forgent-worktrees/rvm-f0-p04-target` (ext4, never `/tmp`). Delete it when the phase lands.
- Tests: `node scripts/run-tests.mjs <file.test.mjs> ...` (focused). Ask the F0 lead before `npm test` or `cargo test --workspace`. Also run every test that imports or reads a file you change (`rg -l "resolveInvocationRoot|admitStoreAccess|isSessionWorktree|paths.mjs|worktree.mjs" test`).
- No plan ids, phase numbers or finding codes in code, test names or commits. No env switch or test-only branch.
- Before each commit: `/usr/bin/git diff --cached --stat`; explain any large deletion. Stage explicit paths. Never `git stash`.
- Push the phase branch at least every 30 minutes. Never push to `main`. Do not edit `CHANGELOG.md` or `Cargo.lock` (a new dependency edge means stop and ask).
- Report: `fgos convention path --kind report --type phase --slug f0-p04-root-admission --plan 261114-2051-rust-verb-migration-program --json`. End with `Status / Summary / Concerns`.

## Context

- **Root.** `resolveInvocationRoot({cwd, dir, policy, home, facts, readFacts})` (`src/runner/paths.mjs:145-182`):
  `caller-tree` (nearest `.fgos` walking up, never above the Git top level, never the home `.fgos`; `found: false`
  gives the Git top or `cwd`), `main-checkout`, `main-checkout-only` (`--dir` must be the main root), `strict-cwd`
  (refused inside a repository below its top level); a `--dir` is validated, never walked (`--dir requires a non-empty
  path value`). Callers: `bin/fgos.mjs:133, 154, 4239`, `src/runner/gateway-control.mjs:359`, `src/runner/session.mjs:387`,
  `src/runner/loop.mjs:1788` (signature kept; none edited). Shared table: `test/rust-host/fixtures/invocation-root-table.json`
  read by `test/rust-host/invocation-root-table.test.mjs` and by `apps/fgos/src/cli_projector.rs:824`.
- The host walk `resolve_target_root` (`apps/fgos/src/cli_projector.rs:17-58`) has no policy, no Git ceiling and no
  `found` (phase 00, U8 lists the differences). Phase 08 replaces it with this phase's function.
- **Admission.** `admitStoreAccess({verb, store, mutates, dir, cwd, explicitDir})` (`src/runner/worktree.mjs:547-578`):
  `store-missing`, `disconnected-worktree-store`, `init-in-worktree`, the read-mode warning, and
  `worktree-identity-unreadable`. Git facts are read **lazily**, only inside `isMain()` (549-556), on three paths.
  `isMainWorktree` (508) stays (six other callers). `isSessionWorktree` (519-530) is used by `admitStoreAccess` and
  imported by `test/runner/session.test.mjs:19` (cases 174-216, including the forged symlink). `STORE_MISSING` at 531.
- Rust: `fgos-git` resolves the trusted main root and worktree root (`packages/git/rust/src/inspect.rs`). The addon's
  `resolveRepo` arm (`packages/git/node-addon/src/git.rs:143`) returns `commonDir`, `trustedMainRoot`, `objectFormat`;
  the Node wrapper that adds `worktreeRoot` and `notARepository` is in `src/git/inspect.mjs`.

## Requirements

1. `packages/git/rust/src/invocation_root.rs`: `resolve_invocation_root(cwd, dir: Option, policy, home) -> Result<{root, fgos_dir, found}, Refusal{fault_class: "dir-invalid", message}>`
   with all four policies and the exact Node messages. Its tests read `invocation-root-table.json`; add table rows for
   `strict-cwd`, `main-checkout-only`, an empty `--dir`, a nested repository under another project's tree, and the home `.fgos`.
2. `packages/git/rust/src/store_admission.rs`: `admit_store_access({store_mode: none|open|read|require, mutates, creates, explicit_dir, dir, cwd}) -> Admitted{warning} | Refused{fault_class, message}`.
   Git facts are read lazily, exactly on the paths Node reads them; `creates` replaces the `verb === 'init'` test
   (the caller computes it). Messages verbatim from Node, including `STORE_MISSING`.
3. Addon (`packages/git/node-addon/src/git.rs`, existing pattern, no new namespace or crate edge): expose both.
4. Node adapters keep their signatures and error mapping: `resolveInvocationRoot` maps a refusal to the same
   `validationError`; `admitStoreAccess` maps to `StoreError('validation', message, {faultClass})`. Delete from Node:
   `nearestStoreRoot`, `repoFactsOrRefuse` (if no other caller), `isSessionWorktree`, `STORE_MISSING`.
5. Same answers as today for every table row and every admission case, including the "must not refuse" cases.
6. `packages/work-state/rust/src/lib.rs`: delete `resolve_workspace_root` and call `fgos_git::invocation_root` with
   `caller-tree` at its caller (118); the crate already depends on `fgos-git` (`Cargo.toml:9`), so no new edge. The
   answer for the native `gate-bypass` verb now stops at the Git top level and skips the home `.fgos`, like every other
   verb; say so in the report (user-visible only for a cwd outside any project, which now gets the door's `found: false` answer).

## Files

- Create: `packages/git/rust/src/invocation_root.rs`, `packages/git/rust/src/store_admission.rs` (each with unit tests).
- Modify: `packages/git/rust/src/lib.rs`, `packages/git/node-addon/src/git.rs`, `src/runner/paths.mjs`,
  `packages/work-state/rust/src/lib.rs`,
  `src/runner/worktree.mjs`, `test/rust-host/fixtures/invocation-root-table.json`, `test/rust-host/invocation-root-table.test.mjs`,
  `test/runner/worktree.test.mjs`, `test/runner/session.test.mjs`.
- Delete: none (functions removed inside the two Node files).
- Admission unit cases (Rust): each refusal; explicit dir; lazy facts: a `read` verb with a store present, a `none`
  verb and an explicit-dir mutating call all succeed when Git facts are unreadable; init in a worktree; read warning;
  not a repository. Session-worktree cases: genuine link to main's `.fgos`; ad-hoc worktree with a real `.fgos` copy;
  dangling link; link to another repository's `.fgos`; link to main's `.fgos` through a chain of links; link to a
  non-`.fgos` directory; main root without `.fgos`.
- Tests retired: the `admit(...)` behaviour cases in `test/runner/worktree.test.mjs` (from 1500) and the three
  `isSessionWorktree` cases in `test/runner/session.test.mjs` (174-216). New owner: `store_admission.rs` unit tests
  (the forged-symlink case named as such). The root-table Node test becomes the wiring proof of the adapter.
  Keep one Node test per adapter (refusal mapped with its fault class; warning passed through).
- Net size: Node about -120, Rust about +400 (half tests).

## Gates

- `cargo fmt --all --check`; `cargo clippy -p fgos-git -p fgos-node-addon -p fgos-work-state --all-targets -- -D warnings`; `cargo test -p fgos-git -p fgos-work-state`
- `cargo check -p fgos-git -p fgos-node-addon -p fgos-work-state --target x86_64-pc-windows-msvc` and `--target aarch64-apple-darwin`
- `node scripts/run-tests.mjs test/runner/worktree.test.mjs test/runner/session.test.mjs test/rust-host/invocation-root-table.test.mjs test/cli/fgos-disconnected-worktree-guard.test.mjs test/cli/fgos-setup.test.mjs test/observe/invocation-fault-log.test.mjs test/architecture.test.mjs test/scripts/doc-health.test.mjs test/setup/git-mutation-census.test.mjs`
  plus every hit of `rg -l "init-in-worktree|store-missing|disconnected-worktree-store|resolveInvocationRoot" test`.
- One-door scan count not above baseline (the functions spawn no Git: facts come through the crate driver).

## Risk and rollback

- Eager Git reads adding refusals (M x H): the lazy rule is a requirement with its negative cases.
- Path normalisation on Windows/macOS (`\\?\`, `/private/var`) (M x M): reuse the crate's existing normalisation; msvc/darwin checks; the table runs on CI hosts.
- Message drift (M x M): full strings asserted in Rust; the CLI wiring tests match them.
- Rollback: revert the phase (Node regains its own decisions).
