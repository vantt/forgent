# Phase 04: Work checkout wrappers over the addon

Wave 2. Depends on: 1. Effort 2d.

## Context

D5: Work keeps calling `createWorktree`, `createClaimWorktree`, `createDispatchWorktree`, `createVerifyCheckout`,
`removeWorktree`, `removeDispatchWorktree`, `listLeftovers`, `reclaimOrphanedCheckout` by name; their bodies become
one call each into the Rust door through the combined addon. Branch, ref, trunk, dirty and path helpers
(`branchNameFor`, `detectTrunk`, `branchExists`, `compareCommits`, `resolveRefSha`, `isCheckoutDirty`, `pathsEqual`,
...) stay Node for S7. Callers (scan §3): `src/runner/{loop,claim-port,merge}.mjs`, `src/workflow/unit-handoff.mjs`,
`scripts/{project-agents,test-select-mutate}.mjs`, `bin/fgos.mjs`, `src/runner/dispatch/provider-credential-renewal.mjs`.
All current bodies are synchronous; a synchronous addon call keeps that contract.

## Requirements

- `fgos-checkout` gains: orphan reclaim and relocate (`worktree.mjs:607-782`), the creator variants (`finishWorktreeSetup`
  `:812`, `createWorktree:852` incl. `reattachableCheckout:959`, `createClaimWorktree:1213`, `refreshUnstartedBranch`
  `:1267` only if the creators need it, else it stays Node for S7, `createVerifyCheckout:1330` with a disposable record,
  `createDispatchWorktree:1366`), `removeDispatchWorktree:1371`, `removeWorktree:1392`, `listLeftovers:1429`, plus
  golden/integration tests for each.
- Addon namespace `checkout` (`packages/git/node-addon/src/checkout.rs`, `lib.rs` registration, `versions().checkout`),
  linking `fgos-checkout` only. `src/native/door.mjs` `combinedAbiMatches` requires `checkout`.
- `src/runner/worktree.mjs`: each D5 function body is one addon call plus argument and error shape mapping; the
  provisioning bodies and record helpers (`provisionSkillRoots`, `provisioningStateRoot`, `provisionWorktree`,
  `removeProvisioned`, `:223-392`) and the resync bodies (`resyncWorktree`, `resyncClaimWorktree`, `:998-1212`; the
  verb moved in phase 01; a Work-internal caller, if phase 00 finds one, calls the addon) are deleted. `provisionDependencies` and `runWorktreeSetupCommands` keep their
  exported names as one-line addon wrappers because `src/runner/merge.mjs` (S7, not in this footprint) calls them.
  Exported names and return shapes do not change; no caller file is edited.
- Errors keep their `code` values (callers branch on them; phase 00 census lists them).

## Steps

1. Red: crate tests for each added function; one Node wiring test "the Work creators and removers reach the Rust
   checkout door" in `test/runner/worktree.test.mjs`.
2. Port; add the addon namespace; rewrite the bodies; delete the provisioning Node code.
3. Retire `test/runner/worktree.test.mjs` cases now owned by the crate (report table); keep
   `worktree-callsite-wrapper.test.mjs` only if it proves a caller contract the crate cannot see.
4. Measure one `createWorktree` call before and after (wall time) and record it; a regression over 20% is reported.

## Validation

`cargo test -p fgos-checkout`; `node scripts/run-tests.mjs test/runner/worktree.test.mjs test/runner/loop*.test.mjs
test/runner/merge*.test.mjs` plus every test importing `src/runner/worktree.mjs`; acceptance check 2 grep of plan.md
returns nothing; lead-rules gates.

## Risk and rollback

Risk: an error code or return field drifts and a Work caller misreads it. Mitigation: step 1 wiring test asserts the
shapes; phase 00 census lists the fields each caller reads. Rollback: revert the series (the verbs of phase 01 do not
depend on it).
