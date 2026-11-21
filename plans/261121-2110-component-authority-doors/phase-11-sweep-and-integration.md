# Phase 11: Sweep and integration

## Inputs
The reports of phases 2-9 (decision-history lines they could not place); `plan.md` acceptance criteria; the remaining live mentions found by `rg -l architecture-manifest --glob '!archive/**' --glob '!docs/history/**' --glob '!plans/**' --glob '!**/verification/**' --glob '!docs/discussions/**'`.

## Files it may write
packages/convention/contracts/convention.rules.v1.json, docs/platform/packaging-distribution/spec.md, src/cli/command-registry.mjs (the line 7 comment only), CHANGELOG.md, docs/platform/component-authority/spec.md, plans/261121-2110-component-authority-doors/

## Steps
1. Replace convention rule `doc-architecture-manifest-1` with a placement rule for `packages/component-authority/model/**`, and run the convention golden tests.
2. Repoint the manifest mention in `docs/platform/packaging-distribution/spec.md` and the comment in `src/cli/command-registry.mjs:7`.
3. Place the decision-history lines that phases 2-9 left in their reports into the owning area specs, as far as they are inside this footprint. List any others in the plan log as owner-facing follow-ups for the secretary.
4. `CHANGELOG.md` `## [Unreleased]`: one line for `fgos authority locate|declare` and the Authority-map plan rule.
5. Set the component-authority spec's `Implementation:` field to `Implemented`.
6. On the combined tree, run `npm test` and `cargo test --workspace`, then every acceptance-criterion command. Record the output in `reports/`.

## Verify
Every acceptance criterion passes, `npm test` and `cargo test --workspace` are green, and the `rg` above lists only history.

## Rollback
Revert the phase commit. Revert earlier phases in reverse wave order if the integrated gate cannot be made green.
