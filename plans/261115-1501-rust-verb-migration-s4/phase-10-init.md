---
phase: 10
title: "`init` native (Work-store step through the bridge)"
status: pending
effort: 2d
wave: B
blockedBy: [2, 3]
landsAfter: [4]
q3: "(a)"
---

# Phase 10: `init` native

`fgos init` moves to the host as a composition of Rust owners, in Node's order and with Node's fail-safe rules
(D10). Its one Node-owned step, the Work-store rebuild, runs through the bridge's `work-store-init` operation until
S7. `fgctl init`'s tail keeps calling `init` through the shim (`init.rs:857`).

Phase-lead rules: [plan.md](plan.md). Branch `rust-verb-migration-program/s4-p10`. Report slug `s4-p10-init`.

## Context

- Registry `command-registry.mjs:439-459` (`store: 'open'`, `touchesState: true`; exits 0 ready, 4 refused, 1
  failed); arm `bin/fgos.mjs:847-850` (dynamic import of `src/verbs/state/init.mjs`); root policy `strict-cwd`
  (`bin/fgos.mjs:3874`).
- `initStoreUseCase` (`src/verbs/state/init.mjs:43-90`), in order: `mintMachineId` (identity crate through
  `src/util/identity-mint.mjs:16-19`); `settleLegacyConfig` (`src/verbs/state/settle-legacy-config.mjs`: config door
  check and fix, then `invokeHost(['config','migrate', ...])` three times, 14, 31-58); on Linux only
  (`eventStorePlatformSupported`, `src/event-store/native.mjs:11`) `fixEventStoreLockDirs` and `initStore(dir)` =
  `rebuild` (`src/state/store.mjs:62-64, 1985-1989`, tier 7); `writeCoexistenceManifest` (fail-safe); config files
  (`initConfigFile` project and global, a refusal returned as `warning`); HEAD probe (`inspectGit`); last,
  `recoverGitOperations` (`src/git/status.mjs:54`, fail-safe, `gitRecoveryWarning` names `fgos git recover`).
  Elsewhere `workStore: 'unsupported-platform'` and its note (13, 84).
- Tests: `test/verbs/init-without-event-store.test.mjs`, `test/verbs/settle-legacy-config.test.mjs`,
  `test/state/init-config-files.test.mjs`, `test/git/status.test.mjs` (`gitRecovery`), `test/e2e/coexistence-canary.test.mjs`,
  `test/install/coexist.test.mjs` (if present, F19), `test/rust-host/fgctl-init-*.test.mjs`.

## Requirements

1. `apps/fgos/src/wiring/init.rs`: the same steps and order; machine id through `fgos-identity`; the legacy settle
   through `fgos-config`'s check, fix and migrate functions in process (the same step names `copy`, `finish`,
   `convert-global`, `convert-project`, the same `config-migrate-destination-differs` refusal and the same
   write-refusal warning); lock dirs through the Event Store crate; the Work step through the bridge
   (`work-store-init`, D5) on Linux only; coexistence through `coexistence.rs` (02); config files through
   `fgos-config`'s create-only init; HEAD and recovery through `fgos-git` (`incidents.rs`). Only the first three steps
   refuse; the rest are fail-safe, as today. `data` keys exactly as F6 lists. The legacy settle calls the same use
   case the host's `config migrate` provider calls (its locks and fault records included), not lower crate functions;
   where the config door is unavailable (`config-platform-unsupported`, Windows today) it returns its steps and no
   refusal, as `settle-legacy-config.mjs:31-36` does, so the Windows `fgctl init` tail keeps its answer. The host
   admits the call (`store: open`) before the bridge's `work-store-init` runs, and forwards a signal to the bridge
   child (D5).
2. Host wiring per the recipe, `strict-cwd` root policy (F5), `store: open` declaration with F0's admission.
3. Parity `init.cases.mjs` (fresh fixture per entry, `fs-delta` of the project, the state root and HOME): fresh
   project; repeat run; legacy JSON config (global and project); a destination that differs (refusal); a read-only
   home (warning); a repository with zero commits (`gitHeadless`); an interrupted Git operation (recovered); a
   non-repository (refused); `--dir` forms; a linked worktree (init's own worktree guard, F5); off Linux the
   `unsupported-platform` answer (a unit case plus the msvc check). The comparison also covers the Event Store refs
   and the number of detached children the end trigger starts (F6), and the invocation-fault log.
4. Delete (D12, D14; 04 has removed the doctor's users): the arm, `src/verbs/state/init.mjs`,
   `settle-legacy-config.mjs`, `src/install/coexist.mjs`, `src/git/status.mjs` (and its `allowed` entry in the
   `compose Git status and recovery` row), `src/setup/event-store-fixes.mjs`, `src/util/identity-mint.mjs`'s
   `mintMachineId` if no other user; the Node tests whose behaviour moved.
5. `doors`: "init steps" (patterns for the step functions' Node names and `initStoreUseCase`; allowed `wiring/init.rs`);
   the "coexistence manifest" row's debt leaves.

## Test owners after the move

| Behaviour | Old proof | Owner now |
|---|---|---|
| init order, refusals, fail-safe steps, `data` keys | `init-without-event-store.test.mjs`, `init-config-files.test.mjs` | `wiring/init.rs` tests (temp projects) |
| legacy config settle | `settle-legacy-config.test.mjs` | `fgos-config` migrate tests (facts) + one `init.rs` case per step |
| Git recovery on init | `test/git/status.test.mjs` init cases | `incidents.rs` tests + one `init.rs` case |
| coexistence manifest | `coexistence-canary.test.mjs`, coexist tests | `coexistence.rs` tests; the canary keeps its end-to-end case on the host |
| Work store created on Linux | `init-without-event-store.test.mjs` | the bridge's `work-store-init` case + one `init.rs` case |
| Event Store lock dirs fix (also the doctor fix `event-store-lock-dirs`) | `test/setup/event-store-fixes.test.mjs` | the Event Store crate's lock-dir test + one `init.rs` case |
| Git status and recovery through the Node client | `test/git/{recovery,worktree-recovery,commit-parent-death}.test.mjs`, `test/direct/merge-gate.test.mjs:441` (import `src/git/status.mjs`) | each case either drives the host (`fgos git status|recover`, native since S2) or is already owned by `incidents.rs` tests; the report names the owner per case |
| npm channel `init` refusal text | `test/install-packaging.test.mjs:162-167` | the same test, expecting Node's "only available in the native fgOS host" refusal for a native verb (`bin/fgos.mjs:3876-3878`) |

## Files

- Create: `apps/fgos/src/wiring/init.rs`, `test/rust-host/parity-cases/init.cases.mjs` (deleted by 12).
- Modify: `test/install-packaging.test.mjs`, `test/git/{recovery,worktree-recovery,commit-parent-death,status}.test.mjs`,
  `test/direct/merge-gate.test.mjs`, host files per the recipe, `apps/fgos/src/wiring/doctor/bridge.rs` (the second operation),
  `src/setup/doctor-bridge.mjs` (the `work-store-init` operation calls `initStore(dir)` and nothing else), `bin/fgos.mjs`, `src/cli/command-registry.mjs`, tests, baseline, manifest, census.
- Delete: as requirement 4.

## Gates

- fmt; clippy `-D warnings` on `fgos`, `fgos-config`, `fgos-identity`, `fgos-git`, `fgos-event-store`, `fgos-distribution`;
  `cargo test` on them; msvc and darwin.
- `node scripts/run-tests.mjs test/rust-host/verb-parity.test.mjs test/rust-host/fgctl-init-preflight-tail.test.mjs test/rust-host/fgctl-upgrade.test.mjs test/e2e/coexistence-canary.test.mjs test/cli/fgos-disconnected-worktree-guard.test.mjs test/rust-host/command-routes.test.mjs test/architecture.test.mjs test/setup/git-mutation-census.test.mjs`.

## Risk and rollback

- The legacy settle runs in a different order or twice (M x H): the step list is computed from the config door's own
  check after each step, as Node does; parity on both legacy layouts.
- `fgctl init` on an upgraded machine reads a different `init` answer (M x H): `init_notes` reads `legacyConfigNote`
  as today (`init.rs`); `fgctl-init-*` tests.
- Rollback: revert the phase; the Node arm returns; init writes the same files.
