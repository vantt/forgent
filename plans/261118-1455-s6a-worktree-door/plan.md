---
contract: plan-v1
title: "S6a worktree door: one checkout door in Rust (fgos worktree, resync-worktree, Work's create/remove as addon wrappers), landed on main as one series"
status: ready
priority: P1
blockedBy: []
footprint:
  - plans/261118-1455-s6a-worktree-door/**
  - Cargo.toml
  - Cargo.lock
  - packages/execution/checkout/**
  - packages/git/node-addon/**
  - packages/git/contracts/mutation-census.v1.json
  - packages/host-runtime/rust/src/catalog.rs
  - packages/host-runtime/contracts/**
  - apps/fgos/Cargo.toml
  - apps/fgos/src/main.rs
  - apps/fgos/src/routing.rs
  - apps/fgos/src/cli_projector.rs
  - apps/fgos/src/wiring/mod.rs
  - apps/fgos/src/wiring/worktree.rs
  - apps/fgos/tests/cli_tests.rs
  - src/cli/command-registry.mjs
  - src/native/door.mjs
  - src/runner/worktree.mjs
  - src/verbs/worktree/**
  - bin/fgos.mjs
  - test/verbs/worktree-create.test.mjs
  - test/verbs/worktree-remove.test.mjs
  - test/e2e/resync-worktree-bare-invocation.test.mjs
  - test/runner/worktree.test.mjs
  - test/runner/worktree-callsite-wrapper.test.mjs
  - test/rust-host/command-routes.test.mjs
  - test/architecture.test.mjs
  - test/suite-baseline.json
  - docs/architecture-manifest.json
  - docs/platform/git/spec.md
  - packages/git/rust/src/refs.rs
  - packages/git/rust/src/land.rs
  - packages/git/rust/src/remote.rs
  - packages/git/rust/src/lib.rs
  - src/runner/merge.mjs
  - test/runner/merge-target-slot-multiprocess.test.mjs
  - docs/reading-map.md
  - scripts/lib/git-one-door-declarations.v1.json
  - test/cli/fgos-workflow-propose.test.mjs
  - test/cli/subcommand-flag-drift.test.mjs
  - CHANGELOG.md
base: b5b23753415a5cfd04822ab47b55d11b12e25a2e
source:
  - docs/discussions/rust-verb-migration-s6a/DISCUSSION.md
  - plans/261118-1341-s6a-execution-tier-rust/plan.md
  - plans/reports/validator-261118-1442-s6a-plan-validate.md
  - plans/reports/red-team-261118-1442-s6a-plan-red-team.md
  - plans/reports/planner-261118-1347-s6a-facts-and-design.md
created: 2026-11-18
---

# S6a worktree door

Split out of the S6a plan ([261118-1341-s6a-execution-tier-rust](../261118-1341-s6a-execution-tier-rust/plan.md)) on
2026-11-18 after validation V8/V9 and red-team F1. Binding owner decisions D1, D2, D5 of
[DISCUSSION.md](../../docs/discussions/rust-verb-migration-s6a/DISCUSSION.md); design decision P1 of the S6a plan
(crate `fgos-checkout`). Rules for both phases: [phase-lead-rules.md](phase-lead-rules.md).

## Outcome

`fgos worktree create|remove` and `fgos resync-worktree` run in the Rust host over one crate, `fgos-checkout`
(create, provisioning by default, `--bare` for none, remove with set-aside, resync, leftovers, orphan reclaim, the
claim/dispatch/verify creators). Work's `create*`/`remove*`/`listLeftovers`/`reclaimOrphanedCheckout` in
`src/runner/worktree.mjs` are one addon call each (D5). Node provisioning is deleted in the same series, so `main`
never carries two provisioning doors. Plan 0947 starts when this plan is `done`.

## Acceptance criteria

1. Routes `worktree` and `resync-worktree` native. Check: `node -e 'const r=require("./packages/host-runtime/contracts/command-routes.json");for(const k of ["worktree","resync-worktree"])if(r[k].route_kind!=="native")process.exit(1)'`.
2. `src/verbs/worktree` gone; the lifecycle part of `src/runner/worktree.mjs` gone. Check: `ls src/verbs/worktree`
   fails; `rg -n "^export function (provisionWorktree|provisionSkillRoots|provisioningStateRoot|removeProvisioned|resyncWorktree|resyncClaimWorktree|refreshUnstartedBranch)\b" src/runner/worktree.mjs`
   empty; every kept D5 export (`createWorktree`, `createClaimWorktree`, `createDispatchWorktree`,
   `createVerifyCheckout`, `removeWorktree`, `removeDispatchWorktree`, `listLeftovers`, `reclaimOrphanedCheckout`,
   `provisionDependencies`, `runWorktreeSetupCommands`) is one addon call (phase 02 report table).
3. A session-style checkout works through `fgos worktree create --bare` and `remove`, so plan 0947 can delete
   `session.rs`. Check: `apps/fgos/tests/cli_tests.rs` case "a detached checkout without provisioning is created and
   removed through the worktree verb".
4. `fgos worktree create` keeps name, argv and exit codes; `--bare` exists with a `## [Unreleased]` line in
   `CHANGELOG.md`. Check: phase 01 `cli_tests.rs` exit-code cases; parity table in the phase 01 report.
5. `test/architecture.test.mjs` green with the new "make, provision and remove a checkout" row and its seeded cases.
6. `node scripts/git-one-door-scan.mjs --root .` count not above the base.
7. `npm test` and `cargo test --workspace` green on the series head, then on `main`.

## Non-goals

Everything else of S6a (run, dispatch subs, run supervisor Node side, doctor rows); the branch, ref, trunk, dirty and
path helpers and `resetDispatchWorktree` of `src/runner/worktree.mjs` (S7); `fgos worktree list|gc` (0947 SV-1);
`session.rs` (plan 0947 P3); any new verb, flag or behaviour beyond `--bare` (RUL104).

## Decisions taken from evidence (no owner question)

| ID | Decision | Evidence |
|---|---|---|
| W1 | This plan is the S6a plan's old phases 01 and 04, split out and landed on `main` together as one series | V8: 0947's `blockedBy` named the whole S6a plan (about 49 lead-days); F1: phase 1 alone put a Rust provisioner beside Node's on `main` for weeks, prior art S2 phase 06 converted callers in the same change (`plans/261115-0759-rust-verb-migration-s2-s3/phase-06-worktree.md:25-27`); design principle 1, L10 |
| W2 | No other S6a phase is a prerequisite: payload-root (S6a 02) only changes an import line of `src/native/door.mjs`, the engine skeleton (S6a 03) is not used by `fgos-checkout`; the old S6a phase 00 rows this plan needed (D5 callers, error fields) move into phase 02 step 1 | S6a phase files 02, 03; old phase 04 Risk line |
| W3 | `blockedBy` is empty. S5's open phases (`261115-2328` 11 doctor rows, 12 doors/docs) touch no file here except `docs/architecture-manifest.json` (`doors`, none naming a worktree file); that is a rebase, not a wait | `plans/261115-2328-execution-read-door/plan.md` rows 11, 12; `node -e` over `doors` (no row names `src/verbs/worktree` or a D5 symbol) |
| W4 | npm gets no doctor row (V20) | phase 01 Requirements |

Prior art reused: Git Worktree port and provisioning record (`git/spec.md:551`); S2 phase 06's port design, exit
codes and parity cases (never landed); the combined addon door (`src/native/door.mjs`).

## Phases

| id | title | depends-on | footprint | wave | status |
|---|---|---|---|---|---|
| 1 | [One worktree door in Rust](phase-01-worktree-door.md) | - | packages/execution/checkout/**, Cargo.toml, apps/fgos/src/wiring/worktree.rs, apps/fgos/src/wiring/mod.rs, apps/fgos/src/main.rs, apps/fgos/src/routing.rs, apps/fgos/src/cli_projector.rs, apps/fgos/Cargo.toml, apps/fgos/tests/cli_tests.rs, packages/host-runtime/rust/src/catalog.rs, src/cli/command-registry.mjs, bin/fgos.mjs, src/verbs/worktree/**, test/verbs/worktree-create.test.mjs, test/verbs/worktree-remove.test.mjs, test/e2e/resync-worktree-bare-invocation.test.mjs, test/rust-host/command-routes.test.mjs, docs/architecture-manifest.json, docs/platform/git/spec.md, CHANGELOG.md | 1 | draft |
| 2 | [Work checkout wrappers over the addon](phase-02-work-checkout-wrappers.md) | 1 | packages/execution/checkout/**, packages/git/node-addon/**, src/native/door.mjs, src/runner/worktree.mjs, test/runner/worktree.test.mjs, test/runner/worktree-callsite-wrapper.test.mjs, test/architecture.test.mjs, docs/architecture-manifest.json | 2 | draft |

Effort (lead-days): 1: 3; 2: 2.5. Total 5.5, serial.

## Data flow

- `fgos worktree create <path> [--branch|--detach] [--base] [--bare] [--json]`: host argv -> invocation root and store
  admission (F0 doors) -> `fgos-checkout::create` -> `GitDriver::create_worktree|create_detached_worktree` (worktree-admin
  lock, `.fgos` strip) -> lock released -> unless `--bare`: dependency install, `worktreeSetup.commands` with
  `FGOS_REPO_ROOT`, skill roots, provisioning record under the state root (Node's path, key and shape) -> `fgos.v1`
  envelope. `remove`: set aside recorded bytes -> `GitDriver::remove_worktree` (delivery evidence digest) -> put back on
  refusal, delete record on success.
- Work wrapper: `createClaimWorktree(repoRoot, id, {scope, waitMs, ...})` -> `scope.assertCanAcquire` -> addon
  `checkout.createClaim` (synchronous, as today) -> same crate -> lock refusal rethrown as `HolderLockError`.

## Test matrix

| Layer | Owning proof | Phase |
|---|---|---|
| Create/provision/bare/remove/set-aside/resync, no Git lock during setup, Node-era record read, record key and identity (Windows prefix, ino > 2^53) | `packages/execution/checkout/tests/*.rs` on real temp repos | 1 |
| Leftovers, orphan reclaim/relocate, claim/dispatch/verify creators | same crate tests | 2 |
| Worktree verbs end to end (argv, exit codes, `--bare`, session-style checkout, bare resync) | `apps/fgos/tests/cli_tests.rs`, wiring only | 1 |
| Parity with the base release | phase 01 report table (never on `main`) | 1 |
| Work wrappers keep contract, error class, lock refusal exit 7 | one wiring test in `test/runner/worktree.test.mjs` | 2 |
| Only the checkout door provisions | `test/architecture.test.mjs` seeded cases | 2 |

## Owner questions

None. D1, D2, D5 settled; W1-W4 decided from evidence.

## Risks and rollback

| Risk | L x I | Mitigation |
|---|---|---|
| Record key or identity drift: Node-provisioned checkout unremovable, `--discard-ignored` deletes its bytes | M x H | F2 vectors; Node-written fixture; both directions proven before the Node reader is deleted |
| Windows remove unproven (CI only `cargo check` msvc) | M x M | vectors cover key and identity arithmetic; stated in phase 01 report |
| Lock-order check or `lock-timeout` exit 7 lost across the addon | M x M | phase 02 wrapper rules and wiring test |
| A Work caller reads a drifted error field | M x M | phase 02 step 1 census, wiring test |
| 1045 P10 forwards `worktree create` argv | L x H | argv kept; exit-code cases |
| Node event loop blocked by synchronous addon dependency install | M x M | same synchronous contract as today; phase 02 measures |

Collision table:

| Shared file | This plan | Other plan | Mitigation |
|---|---|---|---|
| `apps/fgos/src/{main,routing,cli_projector}.rs`, `wiring/mod.rs`, `catalog.rs`, `command-registry.mjs`, `bin/fgos.mjs`, generated routes | 1 | 1045 P16, 1159 P4/P6/P8, S5 P11/P12 | later lander rebases and regenerates |
| `docs/architecture-manifest.json`, `test/architecture.test.mjs` | 1, 2 | S5 P12, 1045 P17, 1159 P3/P4 | rebase, rerun the architecture test |
| `apps/fgos/Cargo.toml`, root `Cargo.toml` | 1 | 1045 P16, 1159 P3/P4 | rebase; `Cargo.lock` regenerated |
| `CHANGELOG.md` | 1 | every lane | rebase |

Landing: phase 01 bases on `origin/main` (branch `s6a-worktree/p01`); phase 02 bases on phase 01's branch
(`s6a-worktree/p02`). The series head runs `cargo test --workspace` and one full `npm test` (ask the big lead), then
OPC MERGE lands both phases on `main` as one series; build, stage, activate with no run in flight; `fgos doctor`
through the installed shim; board line naming plan 0947 unblocked.

Rollback: revert the series on `main` (both phases together), rebuild and reactivate; the Node verb and Node
provisioning return together. If plan 0947 phase 3 already deleted `session.rs`, revert 0947 phase 3 first (session
checkouts need a door). After activation the fastest restore is reactivating the previous release
(`.fgos/installation/activation.json` `previousArtifactDigest`), then revert; the previous release reads the records
Rust wrote because phase 01 keeps Node's record path, key and shape.

## Validation log

- 2026-11-18 planner: plan split from `261118-1341-s6a-execution-tier-rust` (old phases 01 and 04, `git mv`), applying
  validation V8, V9, V12, V13, V15, V20 ([report](../reports/validator-261118-1442-s6a-plan-validate.md)) and red-team
  F1, F2, F9, F11 ([report](../reports/red-team-261118-1442-s6a-plan-red-team.md)).
- 2026-11-18 lead:S6A-LAND: S5 (`261115-2328`) is `done` on main (586765804). Status stays `draft`: plan-contract-check refuses `ready` while the footprint overlaps the active plan `261118-0936-ops-metrics`; turn `ready` when ops-metrics closes or the overlap is cleared.
- 2026-11-18 lead:WORKTREE-DOOR: footprint widened to `packages/git/rust/src/refs.rs` and `land.rs` (callers only), approved by lead:OPC as Git reviewer: `acquire_worktree_admin(repo, held, wait)` becomes the one public worktree-admin door; `fgos-checkout` calls it instead of seeding its own scope. Also widened for gate consequences of the deletion: `docs/reading-map.md`, `scripts/lib/git-one-door-declarations.v1.json` (two configured setup-command shell sites), `test/cli/fgos-workflow-propose.test.mjs`, `test/cli/subcommand-flag-drift.test.mjs`.
- 2026-11-18 lead:WORKTREE-DOOR: footprint widened again with lead:OPC approval: `remote.rs` and `lib.rs` of fgos-git (one more admin-door caller, the re-export), `src/runner/merge.mjs` and `test/runner/merge-target-slot-multiprocess.test.mjs` (the Git door names a busy worktree admin `worktree-admin-held`; merge maps it to lock-held).
