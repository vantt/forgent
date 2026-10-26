---
phase: 1
title: "Preconditions and the mailbox lock row"
status: completed
depends_on: [V3 closed]
---

# Phase 1: Preconditions and the `mailbox` lock row

## Context

- Plan: [plan.md](plan.md) (decisions 2 and 11, the HARDEN and branch rules).
- Spec (branch copy): §6.4 "Mutual exclusion", §14 "Prerequisites ... V2: the `mailbox` row of the holder-lock registry and its line in that spec".
- Precedents: `git show b34e4060e` (Event Store rows: registry, schema owner enum, spec, contract test in one commit) and `git show d1d4ec7ee` (GIT `repo-config`).
- Readers of the registry, all checked on the branch at `7fb7c4f4b`:
  - Rust: `packages/holder-lock/rust/src/scope.rs:36-55` embeds the file (`include_str!`) and resolves `v3Path` in `LockScope::acquire` (`:120-170`); `packages/event-store/rust/tests/registry_rows.rs` asserts only its own two rows.
  - Node: `src/holder-lock/registry.mjs` (`resolveLock` fills `<fgosDir>`); `src/holder-lock/fences.mjs:39` `CUTOVER_OWNERS = ['4.2','4.3','4.4']`, so a row owned by `mailbox` produces no fence target; `src/setup/holder-lock-checks.mjs:392` `cutOverLockFiles` enumerates only cut-over rows, so no `LOCK_FILES` entry is needed (the `repo-config` entry there is unused by that path; do not copy it).
  - Contract: `packages/holder-lock/contracts/lock-registry.schema.v1.json` (`$defs.lock.properties.owner.enum`), `test/holder-lock/registry-contract.test.mjs` (schema validation, unique names, rank table fits kind, the 4.2 count stays 10, the 4.4 rows, the event-store and repo-config pins).
  - Spec: `docs/platform/holder-lock/spec.md:131` (kinds table), `:144` (owner list, which also lacks `git` today), `:160` (rank 80 leaves), `:172` (the `repo-config` sentence; the mailbox sentence goes after it).

## Preconditions (stop if any fails)

1. Sync first: `git fetch origin && git merge --no-edit origin/main` in the worktree (mailbox plans close on main, so the branch learns V3's status only through this merge). Write the branch HEAD after the merge into this file's "Base" line.
2. V3 closed: `git -C /home/vantt/projects/forgent show origin/main:plans/261022-0007-mailbox-v3-hook-payload-contract/plan.md | head -5` shows `status: completed`, and `git status --short` in the worktree is clean. If not, report `BLOCKED: V3 open` to the controller. <!-- Updated: Red Team -->
3. HARDEN drift: `git log --oneline 2f2c17a5e..origin/main -- packages/holder-lock packages/durable-file packages/process src/holder-lock`. For every commit, check whether `LockScope::acquire`, `ScopeError`, `Acquire`, `Wait`, `replace_durably_observed`, `ReplacePoint`, `install_once`, `sync_directory`, `judge_here`, `Record`, `Verdict` changed signature; write the result in this file under "API drift" (even "none").
4. Nobody else holds the registry: `git log --oneline -5 origin/main -- packages/holder-lock/contracts/lock-registry.v1.json` and the board's "File chung dễ va" section (controller confirms).

## Requirements

- The registry has one new row exactly as plan decision 2 states.
- The schema accepts owner `mailbox` and still rejects an unknown owner.
- The rank-80 `note` in the registry's `ranks` table names `mailbox` among the leaves.
- The holder-lock spec lists the row (kinds table, owner list with `git` and `mailbox`, rank-80 leaves, one sentence after `repo-config`: "Mailbox adds `mailbox`, a repo mutex at rank 80, `<fgosDir>/locks/mailbox.lock`, with no legacy path. It serializes every mutation of the agent mailbox's snapshot (docs/platform/agent-mailbox/spec.md §6.4); held briefly, never across an emit, and only Rust takes it.").
- `limits.v1.json` gains `mailbox.hook.lockWaitMs` (default 100, unit milliseconds, reader `hook`, meaning "longest wait for the mailbox lock before a hook skips its drain", source "spec §12", status "placeholder, unmeasured"), and `HookLimits` reads it (plan decision 11).

## Tests first (red, then green)

| # | Test (file :: name) | Asserts | Red before |
|---|---|---|---|
| 1 | `test/holder-lock/registry-contract.test.mjs` :: `the mailbox mutex is a repo leaf at rank 80 owned by the mailbox` | `deepEqual(row, {name:'mailbox', kind:'mutex', scope:'repo', rank:80, v3Path:'<fgosDir>/locks/mailbox.lock', v1Shape:null, v1Path:null, fence:'none', owner:'mailbox'})`; the row validates against `schema.$defs.lock`; owner `unknown` does not | row missing |
| 2 | same file, existing `registry validates against its schema` | stays green after the schema enum change | schema enum lacks `mailbox` |
| 3 | `packages/mailbox/rust/store/tests/limits_contract.rs` (V3's existing test, unchanged) | it already drops every `reader: hook` key in turn (`tests/limits_contract.rs:12-30`), so adding the key to the contract turns it red until `HookLimits` reads it; no new case | field missing |

The behaviour "the store takes the lock through this row" is proven in phase 2 by the first hold; no Rust test re-reads the row's literal path (the path is written once, in the registry).

## Steps

1. Write test 1 and run `node --test test/holder-lock/registry-contract.test.mjs` (red).
2. Add the row (append after `repo-config`), the schema owner enum value, the rank-80 note. Green.
3. Edit the holder-lock spec lines above.
4. Add the contract key (test 3 goes red), then the `HookLimits` field (green).
5. Run `cargo test -p fgos-holder-lock` (the embedded registry still parses; `LockScope` unit tests green) and `node --test test/holder-lock/registry-contract.test.mjs test/setup/holder-lock-checks.test.mjs test/holder-lock/fences-rust-locks.test.mjs`.
6. Commit: `feat(holder-lock): register the mailbox snapshot mutex`, then a second commit for the hook key if the census differs (`node scripts/git-one-door-scan.mjs --write-census` with each code commit).

## Gates (end of phase)

- `git fetch origin && git merge --no-edit origin/main`, then rerun step 5 and `cargo test -p fgos-mailbox`.
- `cargo clippy -p fgos-mailbox --all-targets -- -D warnings`; `cargo fmt -p fgos-mailbox --check`.
- `fgos convention check --all --json`: no violation names a file this phase added (none expected).
- `git push origin mailbox/v1-v3`.

## Done when

The row is on the branch, its Node contract test and the existing holder-lock suites are green on a fresh main merge, and the spec line exists.

## Risk and rollback

- Risk: a HARDEN commit changes the registry in parallel. Merge, keep both rows, rerun the contract test. Rollback: revert the commit; nothing else reads the row yet.

## Base

Branch `mailbox/v1-v3` at `b48330080` after merging main `978fa28e7` (2026-10-22, start of phase 1). V3 reads `status: completed` on `origin/main`; the worktree was clean.

## API drift

None. `git log --oneline 2f2c17a5e..origin/main -- packages/holder-lock packages/durable-file packages/process src/holder-lock src/runner/dispatch/confinement` is empty at `978fa28e7`. The registry's last change on main is `266b46b0f`; no other lane holds it.

## Deviations

- The rank-80 `note` and the holder-lock spec's kinds and ranks tables also name `repo-config`, which the GIT lane added as a rank-80 leaf without listing it there; the same lines gain `mailbox`.
- The new hook key lands in `HookLimits` as `hook: LockWaitLimits { lock_wait_ms }`, the nested shape the dotted key `mailbox.hook.lockWaitMs` folds into; the type is exported from `hook`.
- Convention gate: the owner's form `fgos convention check --dir . -- <files>` replaces the plan's `--all` form (the explicit-path form without `--dir` is item `tsk-5n3`).
- Node gate: `test/setup/holder-lock-checks.test.mjs` and `test/holder-lock/fences-rust-locks.test.mjs` need the host the test runner stages (`FGOS_HOST_BIN`, the door manifest), and `scripts/run-tests.mjs` forwards extra arguments as `node --test` flags, so it cannot select files. The proof is therefore the whole `npm test`: 8853 tests, 8737 passed, 20 failed. All three registry and holder-lock files pass. The failures are in `fgctl-upgrade` (15), `fgctl-init-download-sources` (2), `dispatch` (1), the V3 closing report's known set, plus `check-decision-citation-drift` (1, item `tsk-2mo`) and one load-timed case of `run-provider-failover` ("two checkers whose leases conflict", 4.98 s under the full suite). None of them reads the lock registry.
