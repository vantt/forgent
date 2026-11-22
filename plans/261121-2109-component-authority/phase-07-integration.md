# Phase 7: Retire the manifest and integrate

This phase starts when phase 6 has landed. It does not wait for `261122-0118-heads-stable-and-able`. The earlier
wait (owner order 2026-11-22 23:19, option c) was replaced by the owner at 23:21 (Miu mail 9e491a48: "no waiting on
heads-stable at all; admit including the two shared files") and repeated at 00:06 ("heads-stable never gates
component-authority"). heads-stable dropped `docs/architecture-manifest.json` and
`docs/platform/packaging-distribution/contracts/setup-doctor-registry.md` from its footprint at 00:07 (9fc5261af)
and watches them instead, so step 1 below ports any change it still makes to the manifest.

## Inputs
- The landed branches of phases 1-6, and the `plan.md` acceptance criteria.
- `plans/261121-2109-component-authority/reports/`: the copy-point sha and `manifest-model-compare.mjs`, both from phase 2.
- `git log <copy point>..HEAD -- docs/architecture-manifest.json`: every manifest change that landed after the copy.
- `docs/platform/packaging-distribution/contracts/setup-doctor-registry.md:164`, the one row that names the manifest.

## Files it may write
docs/architecture-manifest.json (delete), docs/platform/packaging-distribution/contracts/setup-doctor-registry.md, packages/component-authority/model/ (only to port manifest changes that landed after the copy), the four live docs that still name the manifest (only to point that mention at the model): docs/knowledge/fgos-s-layered-architecture-is-a-live-tested-invariant-not-a/layered-architecture-invariant.md, docs/knowledge/why-fgos-checks-repo-invariants-at-return-and-merge-instead/why-fgos-checks-repo-invariants-at-return-and-merge-instead-of-the-full-test-suite.md, docs/knowledge/state-machine-module-file-names/state-machine-module-file-names.md, docs/platform/domainization/architecture/domainization.md, plans/261121-2109-component-authority/.
Any other gate failure is fixed in the owning phase's branch, never here.

## Steps
1. Reconcile. For each commit in `git log <copy point>..HEAD -- docs/architecture-manifest.json`, port the change
   into the model files (a door row goes to its `doors/<slug>.json`). Phases 3 and 6 reshaped `components.json`,
   `files.json` and `tiers.json`, so port the meaning of each change, not the raw diff. `manifest-model-compare.mjs`
   cannot vouch for those reshaped files any more, so run it on the doors, layers and rules only. List every
   ported change in `reports/`, or record that there were none.
2. Delete `docs/architecture-manifest.json`. In `setup-doctor-registry.md:164`, point the row at the model's
   `doctor-readiness-registry` and Node-bridge door files under `packages/component-authority/model/doors/`,
   changing nothing else in the file. Delete `reports/manifest-model-compare.mjs`.
3. On the combined tree, run `npm test` and `cargo test --workspace`.
4. Run `node scripts/component-authority-render.mjs --check`.
5. Run each acceptance-criterion command and record its output in `reports/`.
6. Run `node scripts/plan-contract-check.mjs --plan plans/261121-2109-component-authority`.
7. Set the plan status to `done`, and wake the sibling plan's planner or supervisor so it re-reads its blockers.

## Verify
- `test ! -e docs/architecture-manifest.json`.
- Every manifest change after the copy point appears in `reports/` as ported, or the list is recorded as empty.
- Every acceptance criterion's check passes, and `npm test` and `cargo test --workspace` are green.

## Rollback
Revert this phase's commit to bring the manifest and the registry row back. The model readers do not depend on
the manifest, so nothing else breaks. Then revert the earlier phases in reverse wave order if needed.
