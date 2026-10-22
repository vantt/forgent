---
phase: 03
title: "Fence deletion, Node part: fences.mjs, the lock-fences row and fix, the registry's fence columns, the five fence test files"
status: pending
depends_on: [02]
parallel: "with phase 04 (disjoint files; both add one CHANGELOG line, the later lander rebases that hunk)"
effort: ~1d
net_size: "Node −600 / Rust −3 (contracts −65) / tests −1 250 (estimate)"
---

# Phase 03 — Fence deletion (Node part only)

## Context

[plan.md](plan.md) Facts ("The fences") and D-T1-6, D-T1-9; owner decision 1 (fences live one release, then go; old data needs one read path); arbitration D4's five corrections and H16 (done: `git-operation-journal` fails with `git-fence-missing`, `src/setup/git-checks.mjs:48`, wiring proof `test/setup/git-checks.test.mjs:50`); H18 (`checkStopped`/`workspaceListing` move beside `src/verbs/events/migrate.mjs`; GIT/ES reviews that diff); red-team §4 unsafe deletions 2–5. The Rust WAL tombstone (`packages/distribution/rust/src/{init.rs,git_gate.rs}`, `packages/git/rust/src/wal.rs`) and the on-disk `TOMBSTONE` directories are **not touched**.

## Requirements

- **Safety, answered from code and data (D-T1-9).** No code on `e94b1618d` reads a v1 lock path; every activation on both machines since the 4.4 cutover is a release that takes every lock at its v3 path; this workspace has 0 old lock files present and 0 controller fences missing, and its 55 unfenced targets are worktrees (22), branches (32) and one run created after the cutover, which no release since then can read. The precondition for the owner machine is the line in plan.md D-T1-9, carried by phase 7's guide. Nothing here removes a tombstone from disk.
- **`src/holder-lock/fences.mjs` is deleted.** What moves out first: `checkStopped`, `scanWorkspace`, `hostError`, `SCAN_PROTOCOL`, `SCAN_TIMEOUT_MS` (`:65-66, 429-502`, ≈ 95 lines) go into `src/verbs/events/migrate.mjs` beside their only caller (`:70`), **with their two dependencies**: the `resolveHostBin` import (`src/util/host-bin.mjs`, `fences.mjs:31`, used at `:483`) and the default `excludePids = ownPidChain()` (`:478`), which becomes the `selfChain`-based export of `src/runner/dispatch/process-identity.mjs` (phase 2); `migrate.mjs` already imports `holder-lock/state-root.mjs` and `setup/holder-lock-checks.mjs`, so no import cycle is added (the red-team checked). `workspaceListing` moves from `src/setup/holder-lock-checks.mjs:576-588` (its only other caller was `checkLockFences`) with its `createGitInspect`/`gitPortOptions` import; `test/event-store/migrate-cutover-grant.test.mjs:14` imports `checkStopped` from `migrate.mjs`. Everything else in the file (`CUTOVER_*`, `isCutOverLock`, `fenceBy`, `defaultProviderRuntimeDir`, `isPidAlive`, `dispatchCwds`, `accountLockDirs`, `mergeSlotCandidates`, `ENUMERATED_V1_PATHS`, `v1PathsOf`, `fenceTargets`, the tombstone and generation writers, `fenceStatus`, `placeFences`, `fenceCutover`) is the mechanism and goes.
- **The doctor row and fix.** `src/setup/registrations.mjs:2156-2159` (`lock-fences` row) and `:2224` (the fix), the import of `checkLockFences`/`fixLockFences` at `:150`, and the comment at `:2134-2140`. `src/setup/holder-lock-checks.mjs`: delete `:567-720` (`workspaceListing` moved, `checkLockFences`, `fixableTargets`, `activatedHolderLockRelease`, `fixLockFences`), the imports at `:24` (`isCutOverLock`, `fenceStatus`, `fenceCutover`, `defaultProviderRuntimeDir`), `:25` (`createGitInspect`, `gitPortOptions`) and `REGISTRY_IN_PAYLOAD` (`:45`). `cutOverLockFiles` (`:392-399`) filters rows by `lock.name in LOCK_FILES` (never by `v3Path`, which crashes on `attempt`, `event-seal`, `event-append`); so `repo-config` (rank 80, `LOCK_FILES:379`) joins the `lock-holders` scan, closing the silent gap simplicity named. The header comment `:1-12` loses the fence sentences.
- **The registry.** `packages/holder-lock/contracts/lock-registry.v1.json` loses `fence`, `fenceNote`, `v1Path`, `v1Shape` on every row; `lock-registry.schema.v1.json:40-63` loses them from `required` and `properties` and the whole `if owner == 4.2 then …` rule (`:57-63`). **DOC collision (board D8, log 09:20):** DOC adds the row `documentation-cutover` (rank 10, `fence: "none"`, `v1Shape`/`v1Path` null) and the `owner` enum value `"documentation"` (`schema:52`) through the public acquire API, possibly before this phase lands. This phase keeps that row (dropping only its fence columns like every other row) and keeps `"documentation"` in the `owner` enum; it never narrows the enum (the `4.2`, `4.3`, `4.4` values stay too: they are the rows' owners, not fence data). If DOC lands first, rebase and re-apply the column deletion to the new row; if T1 lands first, DOC's row carries no fence columns. Rank 10 is below every existing rank (`registry-contract.test.mjs:94-113` keeps proving the rank table); `packages/event-store/rust/tests/registry_rows.rs:28-30` loses its three asserts in the same commit (the smaller of D4's two options; ES's file, told on the board). `src/holder-lock/registry.mjs`: `resolveLock` returns `{ name, kind, scope, rank, v3Path, lockDir }` (`:76-102`); `fillTemplate` loses its `strict` flag and the non-strict branch (`:61-73`); `placeholderValue` loses `os.tmpdir()` and `encodeURIComponent(cwd)` (`:52-55`) and the `~/` expansion (`:71`), all `v1Path`-only (RT-M8); the `os` import goes. The Rust side reads `name` and `rank` from the registry (`packages/holder-lock/rust/src/scope.rs:43-52`) and never the fence columns, so `scope_rank.rs:135` (`registry_matches_node_for_every_row`) still passes.
- **`test/setup/git-checks.test.mjs`**: delete the `checkLockFences` import (`:10`) and the case at `:34-48` ("an unused controller fence does not turn a channel without activation red"); its surviving behaviour, "the journal row fails with `git-fence-missing` when the fence is gone", is owned by `:50`.
- **`docs/architecture-manifest.json:168`** loses the `src/holder-lock/fences.mjs` row (`test/architecture.test.mjs:157` fails on a row without a file).
- **`test/process/one-door.test.mjs:23`** loses the `fences.mjs` row (its `/proc` reader went in phase 2 with `ownPidChain`; the file is now deleted).
- The spec text for the fences (holder-lock spec §12 prose, §13 row, §18) is phase 5's; this phase's commit message says the mechanism was removed under owner decision 1 and names GIT's row for `git-fence-missing`.

## Files

**Create**: none. **Modify**: `src/verbs/events/migrate.mjs` (+108), `src/setup/holder-lock-checks.mjs` (−165), `src/setup/registrations.mjs` (−12), `src/holder-lock/registry.mjs` (−30), `packages/holder-lock/contracts/lock-registry.v1.json` (−50), `packages/holder-lock/contracts/lock-registry.schema.v1.json` (−15), `packages/event-store/rust/tests/registry_rows.rs` (−3), `docs/architecture-manifest.json` (−1), `test/process/one-door.test.mjs` (−1), `test/setup/git-checks.test.mjs` (−10), `test/event-store/migrate-cutover-grant.test.mjs` (import path), `test/holder-lock/registry-contract.test.mjs`, `test/setup/holder-lock-checks.test.mjs`, `packages/git/contracts/mutation-census.v1.json` (regenerated), `test/suite-baseline.json`, `CHANGELOG.md`. **Delete**: `src/holder-lock/fences.mjs` (−514), `test/holder-lock/fences-main-door.test.mjs` (177), `fences-rust-locks.test.mjs` (177), `fences-stop-check.test.mjs` (250), `fences-v1-ledger.test.mjs` (223), `fences-v1-tombstone.test.mjs` (211).

**Tests to retire, each with the owner of its behaviour:**

| Retired | Lines | Owner now |
|---|---|---|
| `fences-main-door.test.mjs` (v1-code vectors `:78, :104, :161`, placement) | 177 | behaviour removed (the mechanism) |
| `fences-rust-locks.test.mjs` (`:116` "fgctl activates behind the fences", `:132` doctor warns on a foreign holder of the Rust-caller locks, `:170` time wait) | 177 | `:116` → `packages/distribution/rust/tests/activation_lock_multiprocess.rs:93` and `install_lock_multiprocess.rs`; `:132` → `test/setup/holder-lock-checks.test.mjs` `lock-holders` wiring case (phase 2); the rest removed |
| `fences-stop-check.test.mjs` (`:28, :71` time waits; `:134, :143, :217, :230` quiesce-scan route proofs) | 250 | `:134` and `:143` have twins in `test/event-store/migrate-cutover-grant.test.mjs:42, :61, :81, :110, :116` (clean, a process in the root, a process in a linked worktree); **`:217`, `:230` and the unreadable-entry case have none** (the red-team compared both files): those three move into `migrate-cutover-grant.test.mjs` as `checkStopped` cases (+30), without their time waits; the route itself is owned by `packages/holder-lock/rust/src/route.rs:744` (`workspace_dirs_are_the_root_and_the_listed_worktrees_only`) and `apps/fgos/tests/internal_lock_routes.rs:384` |
| `fences-v1-ledger.test.mjs` (`:66` v1-code vector) | 223 | behaviour removed |
| `fences-v1-tombstone.test.mjs` (`:112` v1-code vector) | 211 | behaviour removed |
| `test/setup/holder-lock-checks.test.mjs:365-438` (three fence cases) | ≈ 75 | behaviour removed |
| `test/holder-lock/registry-contract.test.mjs:83-87, 115-125, 127-135, 186-200` (fence halves), `:202-224` (fence halves; the rank/scope/v3Path halves stay), `:305-323` (`placeFences`/`fenceStatus` on the controller fence; the first three assertions on `repo-config` stay) | ≈ 85 | deleted data; the fgctl fence's "held controller file is never replaced by Node" behaviour is owned by `apps/fgctl/tests/git_wal_activation_gate.rs:255-264` |
| `test/setup/git-checks.test.mjs:34-48` | 15 | `test/setup/git-checks.test.mjs:50` |

Not retired: `test/holder-lock/registry-contract.test.mjs:161, :169, :181` (the judge-vector checks). The first draft retired them; the red-team found `judge_vectors.rs` does not check what they check and the arbitration's size-debt row does not name them, so they stay (TEST's own labels decide them later).

## Steps

1. Move `checkStopped` + helpers and `workspaceListing` into `migrate.mjs` with their imports; add the three missing `checkStopped` cases to `test/event-store/migrate-cutover-grant.test.mjs`; run it; post the diff for GIT/ES review (H18) on the board row.
2. Delete `fences.mjs`, the row and fix, the check bodies; fix `cutOverLockFiles`; registry columns, schema, `registry_rows.rs`; `registry.mjs`.
3. Retire the tests with their owners; `architecture-manifest.json`; `one-door.test.mjs`; the baseline; the census; the CHANGELOG line ("Removed the `fgos doctor` row `lock-fences` and the cutover fence step of `fgos setup`: every supported release takes its locks at the kernel-lock paths, and GIT's `git-operation-journal` row carries the one remaining fence condition, `git-fence-missing`").
4. Report with the Δ table, the test-cost line, and the measured fence state of this workspace at landing time (`fenceStatus` no longer exists: use `fgos doctor` of the previous release before the switch, as the guide says).

## Verification (exact)

- One-file runs: `test/event-store/migrate-cutover-grant.test.mjs test/setup/holder-lock-checks.test.mjs test/setup/git-checks.test.mjs test/holder-lock/registry-contract.test.mjs test/process/one-door.test.mjs test/architecture.test.mjs test/cli/fgos-lock-fence.test.mjs test/runner/lock-status.test.mjs`.
- `cargo test -p fgos-event-store --test registry_rows` and `cargo test -p fgos-holder-lock --test scope_rank` green.
- `rg -n "fences\.mjs|checkLockFences|fixLockFences|lock-fences|isCutOverLock|fenceStatus|placeFences|v1Path|v1Shape|\"fence\"" src bin test packages/holder-lock packages/event-store docs/architecture-manifest.json` → nothing.
- `fgos doctor` (dev host, `npm run fgos:dev -- doctor`) lists no `lock-fences` row and `lock-holders` scans `repo-config` (its message counts one more lock).

## Net size

Node −600 (`fences.mjs` −514, `holder-lock-checks.mjs` −165, `migrate.mjs` +112, `registry.mjs` −30, `registrations.mjs` −12, `one-door`/manifest ±0). Rust −3 (`registry_rows.rs`); contracts −65. Tests −1 195 (five files −1 038, `holder-lock-checks.test` −75, `registry-contract` −85, `git-checks.test` −15, `migrate-cutover-grant` +30, the three moved cases counted there).

## Test-cost line

Added 3 (moved `checkStopped` cases), retired 5 files + 5 cases. Host spawns removed: the five fence files each spawned the host and real git repositories (`fences-stop-check` 4 quiesce-scans, `fences-rust-locks` an `fgctl` activation); `holder-lock-checks.test:365-438` spawned the host for `fixLockFences`. New spawns: none. CLI-call cost before/after pasted.

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| A quiesce-scan behaviour was only proved by `fences-stop-check` | L × M | Step 3 names a twin in `migrate-cutover-grant` or the Rust route test for each of the four cases before retiring; a missing twin is added there (≤ 20 lines), not kept in a fence file. |
| ES edits `migrate.mjs` or `registry_rows.rs` in the same window | M × M | H18: GIT/ES reviews the diff; the board row names the files; later lander rebases. |
| `registry.mjs` losing the `~/` expansion breaks a v3 template | L × H | No v3 template starts with `~` (all begin with `<fgosDir>`, `<lockRoot>`, `<runDir>`, `<workflowRunDir>`, `<eventOpenRoot>`; read from the registry file); `registry-contract.test.mjs:186-224` pin the repo, machine and Rust-owned rows' `v3Path` values and `scope_rank.rs:135` compares the Node and Rust registry views row by row. |
| Both phases 3 and 4 regenerate the census and refresh the baseline | M × L | plan.md's generated-artifact rule: the later lander rebases and re-runs both generators. |

## Rollback

Revert the phase's commits; the row, the fix and the fence files return. The on-disk tombstones were never touched.

## Done when

The greps are clean; every retired test names its owner in the commit; GIT/ES has reviewed the `migrate.mjs` diff; `registry_rows.rs` is green; the Δ table is in the report.
