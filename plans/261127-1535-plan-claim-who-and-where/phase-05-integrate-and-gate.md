# Phase 5: Integrate and gate

Capability: `code:test`. Runs after phases 1 to 4.

## Inputs

- The merged branches of phases 1 to 4; this plan's acceptance criteria.

## Files it may write

`CHANGELOG.md`, `plans/261127-1535-plan-claim-who-and-where/reports/**`.

## Steps

1. Merge the four branches onto one tree from current main.
2. Add one line under `## [Unreleased]` in `CHANGELOG.md`: plans may name a `host` machine; admission records the
   machine and admits only its own or unpinned plans; an admission or head write whose push is refused before
   sending no longer leaves a commit on local main.
3. Run `npm test` and `cargo test --workspace` on the merged tree; write the result (pass counts, any red with its
   output) to `reports/integration-gate.md`.
4. Walk acceptance criteria 1 to 7 and name, for each, the test or file that proves it.

## Verify

`npm test` and `cargo test --workspace` are green on the merged tree.

## Rollback

Revert the merge commits in reverse order: phase 5, then 3 and 4, then 1 and 2.
