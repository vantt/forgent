---
phase: 6
title: "`worktree create|remove` native (only if the owner answers Q1 = a)"
status: pending
effort: "3d if Q1 = a; 0.25d if Q1 = c (hand-off note only)"
wave: B
step: S2
blockedBy: [0, Q1]
flipAfter: [1]
---

# Phase 06: `worktree create|remove`

**If Q1 = (c):** this phase only writes one line into the program plan's S6a row ("`worktree` verb, moved from S2 by
owner answer Q1") and one into its S2 row; nothing else. Effort 0.25d. The rest of this file applies to Q1 = (a).

The Git part is already Rust (Worktree port, `packages/git/rust/src/worktree.rs:689, 705, 983`, addon class
`GitWorktree`, `packages/git/node-addon/src/git/worktree.rs:13, 49`). What is Node: provisioning
(`provisionWorktree`, `removeProvisioned`, `src/runner/worktree.mjs:268, 370`; `npm ci`, skill-directory copies, the
`worktree-provisioning.v1` record under the state root) and the remove policy (`resolveDelivered` :8,
`worktreeTip` :17, the evidence digest; `src/verbs/worktree/remove.mjs`). The runner calls the same provisioning
(`src/runner/worktree.mjs:823, 1347, 1411`), so provisioning gets one Rust owner and the runner's functions become
addon adapters (no twin).

Phase-lead rules: [plan.md](plan.md). Branch `rust-verb-migration-program/s2-p06`. Report slug `s2-p06-worktree`.

## Context

- Registry `src/cli/command-registry.mjs:124-138`: `create <path> [--branch <name> | --detach] [--base <ref>]`,
  `remove <path> --delivered-to <ref> [--discard-ignored]`; `store: 'none'`.
- Arm `bin/fgos.mjs:3510-3531`: `process.cwd()` and `mainCheckoutRootAt(cwd)`; `--dir` ignored (keep: parity).
- Exit codes: 4 for arity, missing sub, bare `--branch`, missing `--delivered-to`; 1 for `--branch` with `--detach`,
  an undeliverable ref, an unregistered path and port refusals unless the addon error carries a category (00 F7).
- Git spec says provisioning is Execution's job, not Git's (`docs/platform/git/spec.md:81`): the Rust owner is not `fgos-git`.

## Requirements

1. Provisioning owner: a module in the Execution-side Rust crate 00 F12 names (candidate: `packages/run-supervisor/rust`,
   linked by the host; the addon does not link it today, so adding it is a crate edge: stop and ask the step lead
   with the Cargo diff before writing code). It owns `provision(worktree, repo_root, state_root, disposable)`,
   `set_aside` / `restore` / `discard`, the `worktree-provisioning.v1` record (unchanged format), `npm ci|install`
   through the process door, skill-root copies (links never followed, existing targets left alone).
2. Node `provisionWorktree`, `provisionDependencies`, `provisionSkillRoots`, `removeProvisioned` become addon calls
   with the same signatures; every runner caller unchanged.
3. Remove policy (`resolveDelivered`, `worktreeTip`, evidence digest) moves into the host operation `git.worktree`
   beside the port calls.
4. Host: operations `git.worktree.create` and `git.worktree.remove` (write), projector from `cli_args` only,
   `NATIVE_SUBCOMMANDS` `("worktree", ["create", "remove"])`, annotation, `native: true`.
5. Parity `worktree.cases.mjs` (fresh repo per entry, `fs-delta`): create named, detached, with `--base`; remove clean,
   dirty (refused), undelivered (refused), with `--discard-ignored`; arity and flag refusals; the flag-before-positional
   mis-parse of `--discard-ignored ../w` (Node reads `../w` as its value).
6. Delete: `src/verbs/worktree/*`, the arm, `test/verbs/worktree-create.test.mjs` and `worktree-remove.test.mjs`
   cases whose behaviour moved (owners below), the `worktree frobnicate` case of
   `test/observe/invocation-fault-log.test.mjs:137-141` (owner: `routing.rs` sub-command faults + `invocation_doors.rs` record).
7. `doors` rows: "provision a worker checkout" (patterns the Node definitions and `worktree-provisioning\.v1`;
   allowed the Rust module, the addon entry file, `src/runner/worktree.mjs` with reason "adapter",
   `retiredBy: "S6a: the runner moves"`); "resolve a remove's delivered ref and evidence" (allowed the host module).

## Test owners after the move

| Behaviour | Old proof | Owner now |
|---|---|---|
| create via port, CLI envelope, setup after port (3) | `test/verbs/worktree-create.test.mjs` | Rust module tests + one `cli_tests.rs` case |
| clean remove, dirty / undelivered refusal, provisioned bytes, `--discard-ignored` (7) | `worktree-remove.test.mjs` | Rust module tests; `packages/git/rust/tests/worktree.rs` keeps the port's own |
| runner provisioning paths | `test/runner/worktree-ports.test.mjs` (5) | unchanged (now through the adapter) |

## Files

- Create: the provisioning module (path from 00), `worktree.cases.mjs` (deleted by 11).
- Modify: the owning crate's `lib.rs`, its `Cargo.toml` and the addon's (after the step lead's yes), the addon entry file,
  `src/runner/worktree.mjs`, host files per the recipe, `bin/fgos.mjs`, `test/observe/invocation-fault-log.test.mjs`,
  `test/architecture.test.mjs`, `docs/architecture-manifest.json`, `test/suite-baseline.json` (586, 587), census.
- Delete: `src/verbs/worktree/{context,create,remove}.mjs`, the two verb test files (if every case has an owner).

## Gates

- Rust: fmt, clippy `-D warnings`, `cargo test` of the touched crates; msvc (`npm` is a `.cmd` shim on Windows: the
  process door must run it through the shell as Node does, `src/runner/worktree.mjs:124-128`) and darwin checks.
- `node scripts/run-tests.mjs test/rust-host/verb-parity.test.mjs test/runner/worktree-ports.test.mjs test/runner/worktree.test.mjs test/git/worktree.test.mjs test/observe/invocation-fault-log.test.mjs test/architecture.test.mjs test/setup/git-mutation-census.test.mjs`

## Risk and rollback

- `npm ci` behaviour through a Rust spawn differs (env, Windows shim) (M x M): msvc check, parity case on a repo with a lockfile.
- Runner hot path (claim, approve) now crosses the addon (L x M): runner tests unchanged and green.
- Rollback: revert the phase; the provisioning record format is unchanged.
