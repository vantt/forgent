---
phase: 2
title: "`git status|recover` native"
status: pending
effort: 1.5d
wave: B
step: S2
blockedBy: [0]
flipAfter: [1]
---

# Phase 02: `git status|recover` native

The cheapest S2 port: the Node layer is composition only over addon calls (`src/git/status.mjs`, 115 lines).
The composition moves into `fgos-git`, the host serves the verb, and `src/git/status.mjs` becomes a thin adapter
for its two remaining Node consumers (`fgos init` and doctor), which move with S4.

Phase-lead rules: [plan.md](plan.md). Branch `rust-verb-migration-program/s2-p02`. Report slug `s2-p02-git`.

## Context

- Registry `src/cli/command-registry.mjs:2509-2523`: subs `status`, `recover`; no per-sub flags; `store: 'none'`.
- Arm `bin/fgos.mjs:884-896`: root `mainCheckoutRootOf(flags)` (honours `--dir`, `main-checkout` policy);
  `status` -> `readGitStatus(root)`; `recover` -> `recoverGitOperations(root)` + `readMergeHead(root)`, adding
  `mergeInProgress` and `next: "fgos main-checkout-reset --sha X --confirm"` when a merge is pending.
- `src/git/status.mjs`: `gitFacts` :21, `listRetainedLand` :34, `readMergeHead` :37, `readGitStatus` :60,
  `recoverGitOperations` :97; addon calls `inspectGit` (`packages/git/node-addon/src/git.rs:291`),
  `inspectGitWorktreeRecovery` (`git/worktree.rs:171`), `GitRecovery.listPending|listRetainedLand|reconcile`
  (`git/recovery.rs:13`), `GitInspect.resolveCommit('MERGE_HEAD')`.
- Rust underneath: `packages/git/rust/src/recovery.rs` (`inspect_operation` 51, `list_pending` 82,
  `list_retained_land` 103, `reconcile_operation` 180), `driver.rs:372` `resolve_repo`, `inspect.rs:564`.
- Remaining Node consumers: `src/verbs/state/init.mjs:9, 73` (`recoverGitOperations`), `src/setup/git-checks.mjs:4, 38, 78, 95, 99` (`gitFacts`, `readMergeHead`).
- `recover` is a writer; its writes are already Rust's (`reconcile_operation`) under their own locks; only the
  composition moves, so migration doc §11's gates are met by the existing owner (state it in the report).

## Requirements

1. `packages/git/rust/src/incidents.rs`: `read_git_status(root) -> GitStatus` (repository, journal, pendingOperations,
   retainedLand, worktrees, nativeLocks, mergeInProgress; a part that fails answers `{ error }` in place, a non-repo
   answers `{ repository: { notARepository: true } }`) and `recover_git_operations(root) -> GitRecovered`
   (recovered, kept, message, and the merge-in-progress pointer), the same JSON keys and order as Node (00 F7).
   The `main-checkout` root rule comes from `fgos_git::invocation_root` (policy `MainCheckout`), not a new walk.
2. Addon: one entry each in `packages/git/node-addon/src/git.rs` returning the same objects; `src/git/status.mjs`
   keeps its exports (`gitFacts`, `readMergeHead`, `readGitStatus`, `recoverGitOperations`) as calls of those entries
   and nothing else, so `init.mjs` and `git-checks.mjs` are unchanged.
3. Host: operations `git.status` (read) and `git.recover` (write) in `catalog.rs`, provider in a `fgos-git`
   host-provider module or `apps/fgos/src/wiring` (follow the `fgos-config` pattern if the crate has a
   `host-provider` feature; else wiring), projector arm (no flags), `NATIVE_SUBCOMMANDS` entry, annotation
   `{ operation_id: "git.status", owner_path: "packages/git/rust", subcommands: true }`, `native: true`.
4. Parity table `test/rust-host/parity-cases/git.cases.mjs` (00's list): status in a clean repo, with a pending
   operation, a retained Land, a merge in progress, outside a repository; recover with nothing to do, with one
   interrupted Land (fresh fixture per entry, `fs-delta`), with a merge in progress; `--dir` to a linked worktree;
   unknown sub (Node's text `unknown git sub-verb "<x>". Usage: ...` becomes the host's generic one, an accepted
   change); `--json` and none.
5. Delete: the arm, the import at `bin/fgos.mjs:102` (no other arm uses it), its `ARM_STATIC_IMPORTS` line
   (`test/architecture.test.mjs:1665`), `test/cli/fgos-git.test.mjs` (4 cases) and its `suite-baseline.json` row (27).
6. `doors` row "compose Git status and recovery": patterns the two definitions in both languages
   (`export function (?:readGitStatus|recoverGitOperations)\b`, `fn (?:read_git_status|recover_git_operations)\b`);
   allowed `packages/git/rust/src/incidents.rs`, `packages/git/node-addon/src/git.rs` (reason: carries the door; its
   snake_case entries match the Rust pattern), `src/git/status.mjs` (reason: client for `init` and doctor, no logic),
   `retiredBy: "S4: init and doctor move to the host"`. The row catches definitions by name only (say so in the report). Negative case in the report: a copy of
   `readGitStatus` in a scratch file fails the row.

## Test owners after the move

| Behaviour | Old proof | Owner now |
|---|---|---|
| status reads every part and changes nothing | `test/cli/fgos-git.test.mjs` "status changes nothing", `test/git/status.test.mjs` (3) | `incidents.rs` unit tests (temp repos); `test/git/status.test.mjs` shrinks to one adapter wiring case |
| recover settles once; init recovers | `fgos-git.test.mjs` (2) | `incidents.rs`; `recovery.rs` owns settlement; init's case stays in its init test (wiring) |
| unknown sub refused | `fgos-git.test.mjs` | `routing.rs` sub-command fault tests (generic) |
| `test/git/recovery.test.mjs`, `worktree-recovery.test.mjs`, `commit-parent-death.test.mjs` | through `readGitStatus` | unchanged: they now prove the adapter path end to end; any case that only restates an `incidents.rs` case moves there (name each) |

## Files

- Create: `packages/git/rust/src/incidents.rs`, `test/rust-host/parity-cases/git.cases.mjs` (deleted by 11).
- Modify: `packages/git/rust/src/lib.rs`, `packages/git/node-addon/src/git.rs`, `src/git/status.mjs`,
  `packages/host-runtime/rust/src/catalog.rs`, `apps/fgos/src/{main.rs,cli_projector.rs,routing.rs}`,
  `command-route-annotations.json`, `src/cli/command-registry.mjs`, generated route files, `bin/fgos.mjs`,
  `test/architecture.test.mjs`, `test/git/status.test.mjs`, `docs/architecture-manifest.json`, `test/suite-baseline.json`
  (row 27), census, the integration branch's parity runner (`TABLES`).
- Delete: `test/cli/fgos-git.test.mjs`.

## Gates

- `cargo fmt --all --check`; `cargo clippy -p fgos-git -p fgos-node-addon -p fgos --all-targets -- -D warnings`;
  `cargo test -p fgos-git -p fgos`; msvc and darwin `cargo check -p fgos-git -p fgos-node-addon -p fgos`
- `node scripts/export-command-selectors.mjs --check`
- `node scripts/run-tests.mjs test/rust-host/verb-parity.test.mjs test/git/status.test.mjs test/git/recovery.test.mjs test/git/worktree-recovery.test.mjs test/git/commit-parent-death.test.mjs test/direct/merge-gate.test.mjs test/setup/git-checks.test.mjs test/verbs/init-without-event-store.test.mjs test/rust-host/command-routes.test.mjs test/cli/subcommand-flag-drift.test.mjs test/architecture.test.mjs test/setup/git-mutation-census.test.mjs`
  (rename any file 00 finds named differently)
- One-door scan: 0 undeclared, Git classes not above 00's baseline.

## Risk and rollback

- Key order or an `{ error }` shape differing from Node (M x M): parity `semantic-json` cases per part.
- `git recover` from a linked worktree resolving another root (L x H): parity case with `--dir` to a linked worktree.
- Rollback: revert the phase (the adapter returns to its Node composition).
