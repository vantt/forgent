# Phase 02: Work checkout wrappers over the addon

Wave 2. Depends on: 01 (bases on its branch). Lands on `main` together with phase 01 as one series. Effort 2.5d.

## Context

D5: Work keeps calling `createWorktree`, `createClaimWorktree`, `createDispatchWorktree`, `createVerifyCheckout`,
`removeWorktree`, `removeDispatchWorktree`, `listLeftovers`, `reclaimOrphanedCheckout` by name; their bodies become
one call each into the Rust door through the combined addon. Branch, ref, trunk, dirty and path helpers
(`branchNameFor`, `detectTrunk`, `branchExists`, `compareCommits`, `resolveRefSha`, `isCheckoutDirty`, `pathsEqual`,
`realpathOrSelf`, ...) and `resetDispatchWorktree` (`worktree.mjs:72`, a Git safe-restore under custody used by
`src/runner/loop.mjs:87`, not checkout lifecycle) stay Node for S7 (V13). All current bodies are synchronous; a
synchronous addon call keeps that contract.

Callers outside the file (corrected per V13; re-check in step 1): `createClaimWorktree` (`src/runner/claim-port.mjs:293`,
passes a JS `LockScope` and `waitMs`), `createDispatchWorktree`/`removeDispatchWorktree` (`loop.mjs`), `createVerifyCheckout`
(`src/runner/merge.mjs`, `scripts/test-select-mutate.mjs`, `bin/fgos.mjs`), `removeWorktree`
(`src/workflow/unit-handoff.mjs`, `merge.mjs`, `loop.mjs`, `scripts/test-select-mutate.mjs`, `bin/fgos.mjs`),
`listLeftovers` (`loop.mjs`), `reclaimOrphanedCheckout` (`merge.mjs`, `bin/fgos.mjs`),
`provisionDependencies`/`runWorktreeSetupCommands` (`merge.mjs`). `createWorktree` has no outside caller (the hits at
`bin/fgos.mjs:2823`, `scripts/project-agents.mjs:9` are comments). `provider-credential-renewal.mjs:768` defines its
own local `listLeftovers` and is not a caller (V12).

## Requirements

- `fgos-checkout` gains: orphan reclaim and relocate (`worktree.mjs:607-782`), the creator variants (`finishWorktreeSetup`
  `:812`, `createWorktree:852` incl. `reattachableCheckout:959`, `createClaimWorktree:1213`, `refreshUnstartedBranch`
  `:1267` (needed: `createClaimWorktree` calls it at `:1235`, nothing outside the file does; its Node export goes),
  `createVerifyCheckout:1330` with a disposable record, `createDispatchWorktree:1366`), `removeDispatchWorktree:1371`,
  `removeWorktree:1392`, `listLeftovers:1429`, plus golden/integration tests for each.
- Addon namespace `checkout` (`packages/git/node-addon/src/checkout.rs`, `lib.rs` registration, `versions().checkout`),
  linking `fgos-checkout` only; addon package `fgos-node-addon` (`packages/git/node-addon/Cargo.toml:2`).
  `src/native/door.mjs` `combinedAbiMatches` requires `checkout`.
- Lock scope and error class across the addon boundary (F9): each wrapper that takes the worktree-admin lock calls
  `scope.assertCanAcquire(WORKTREE_ADMIN, 40)` before the addon call (as `src/runner/repo-locks.mjs:113` does today),
  passes `waitMs`, and rethrows an addon lock refusal as `HolderLockError` with the same `code`, so
  `bin/fgos.mjs:304-308` still maps `lock-held` to `lock-timeout` (exit 7). Other errors keep their class
  (`WorktreeError`, `errorClass`/`category` `worktree-fail`) and `code` values (step 1 lists what each caller reads).
- `src/runner/worktree.mjs`: each D5 function body is one addon call plus argument and error shape mapping; the
  provisioning bodies and record helpers (`provisionSkillRoots`, `provisioningStateRoot`, `provisionWorktree`,
  `removeProvisioned`, `:219-402`) and the resync bodies (`resyncWorktree`, `resyncClaimWorktree`, `:998-1212`) are
  deleted. `provisionDependencies` and `runWorktreeSetupCommands` keep their exported names as one-line addon wrappers
  because `src/runner/merge.mjs` (S7) calls them. Exported names and return shapes do not change; no caller file is
  edited.
- Doors (same series, V4 rule): new row "make, provision and remove a checkout" (allowed: `packages/execution/checkout/**`,
  `apps/fgos/src/wiring/worktree.rs`, `packages/git/node-addon/src/checkout.rs`; patterns anchored on the Git
  create/remove port calls and on `worktreeSetup`, every hit enumerated first, S5 D10), with seeded caught/passed
  cases in `test/architecture.test.mjs`. Rows "resolve the invocation root" and "admit store access" keep
  `src/runner/worktree.mjs` (its adapter parts stay); any `allowed`/`debt` entry naming a deleted symbol is edited here.

## Steps

1. Census (replaces the S6a phase 00 rows this phase needed): every caller of the D5 functions, the fields and error
   `code`/class each reads (`rg` plus GitNexus `impact` upstream on `createWorktree`, `createClaimWorktree`,
   `removeWorktree` when `fgos dispatch decide --for impact-analysis --json` says full; zero results cross-checked with
   `rg`). Table in the phase report.
2. Red: crate tests for each added function; one Node wiring test "the Work creators and removers reach the Rust
   checkout door, keep their error class, and refuse a held worktree-admin as a lock-held HolderLockError" in
   `test/runner/worktree.test.mjs`.
3. Port; add the addon namespace; rewrite the bodies; delete the provisioning and resync Node code; doors row.
4. Retire `test/runner/worktree.test.mjs` cases now owned by the crate (report table); keep
   `worktree-callsite-wrapper.test.mjs` only if it proves a caller contract the crate cannot see.
5. Measure one `createWorktree` call before and after (wall time); a regression over 20% is reported.
6. Series gate (plan.md "Landing"), then OPC MERGE of phases 01+02 to `main`.

## Validation

`cargo test -p fgos-checkout`; `node scripts/run-tests.mjs test/runner/worktree.test.mjs test/runner/loop*.test.mjs
test/runner/merge*.test.mjs test/runner/claim-port.test.mjs test/architecture.test.mjs` plus every test importing
`src/runner/worktree.mjs`; `rg -n "^export function (provisionWorktree|provisionSkillRoots|provisioningStateRoot|removeProvisioned|resyncWorktree|resyncClaimWorktree|refreshUnstartedBranch)\b" src/runner/worktree.mjs`
empty; `cargo tree -p fgos-node-addon` lists `fgos-checkout`; lead-rules gates.

## Risk and rollback

Risk: an error code, class or return field drifts and a Work caller misreads it. Mitigation: step 1 census, step 2
wiring test. Risk: the JS lock-order check is lost (F9): wrappers keep `assertCanAcquire`. Rollback: the series reverts
as a whole (plan.md).
