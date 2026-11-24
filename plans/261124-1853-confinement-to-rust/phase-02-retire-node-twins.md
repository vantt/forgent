# Phase 2: Port and delete the Node confinement twins

Capability: `code:implement`. Starts only after `261122-2108-delete-dead-node-execution-closure` is `done`.

## Inputs

- `src/runner/dispatch/confinement/workspace-paths.mjs` (55 lines), `resources.mjs` (890), `drivers/bwrap.mjs` (764).
- Their Rust twins: `packages/execution/engine/src/confinement/policy/workspace_paths.rs`, `policy/resolver.rs`,
  `driver/bwrap.rs`, and their tests `packages/execution/engine/tests/confinement_*.rs`.
- The inventory of these files: `plans/discussions/ds-wham5txfkv-node-rust-port-inventory/DISCUSSION.md` §6.
- `packages/component-authority/model/doors/process-facts-proc.yaml` (allows `drivers/bwrap.mjs` twice).
- References by path: `packages/execution/contracts/confinement-driver/bwrap.v1.json`,
  `packages/git/contracts/mutation-census.v1.json`.

## Footprint

`src/runner/dispatch/confinement/` (whole directory), `src/runner/dispatch/session-attempt.mjs`,
`src/runner/dispatch/effective-execution-contract.mjs`, `test/runner/dispatch-confinement-*.test.mjs`,
`test/runner/confinement-registry-fixture.helper.mjs`, `packages/execution/engine/src/confinement/` (whole
directory), `packages/execution/engine/tests/confinement_policy.rs`,
`packages/execution/engine/tests/confinement_driver.rs`, `packages/execution/engine/tests/confinement_request.rs`,
`packages/execution/contracts/confinement-driver/bwrap.v1.json`,
`packages/component-authority/model/doors/process-facts-proc.yaml`, `packages/git/contracts/mutation-census.v1.json`,
`plans/261124-1853-confinement-to-rust/reports/node-twins.md`.

## Decisions taken in this phase (planner's)

- **Survivor is the Rust twin.** The head launch already runs it (`launchSessionInHost`); the Node files are not
  extended, only read for what they hold that Rust lacks.
- **No twin left behind (L10, design principle 1).** A remaining Node caller is moved to the Rust door it needs (an
  addon or execution-door call that exists today) or, if 2108 left it dead, deleted with it.

## Steps

1. List the callers of the three files on the post-2108 tree
   (`rg -l "confinement/(workspace-paths|resources|drivers/bwrap)" src bin apps packages test`). If any caller lies
   outside this footprint, stop and ask the supervisor.
2. Compare Node and Rust behaviour function by function; write the table in `reports/node-twins.md`. Port into the
   Rust twin each behaviour only Node holds, with its owning proof in the matching `tests/confinement_*.rs`.
3. Move every caller found in step 1, then delete the three files and every `test/runner/dispatch-confinement-*` test
   that tests only them. For each deleted test, name in the report and the commit the Rust test that now owns its
   behaviour, or say the behaviour is gone.
4. Remove the `drivers/bwrap.mjs` allowance from `process-facts-proc.yaml` and update the path references in
   `bwrap.v1.json` and `mutation-census.v1.json`.

## Verify

```bash
cargo test -p fgos-execution-engine --test confinement_policy --test confinement_driver --test confinement_request
node --test test/architecture.test.mjs
git ls-files src/runner/dispatch/confinement/workspace-paths.mjs src/runner/dispatch/confinement/resources.mjs src/runner/dispatch/confinement/drivers/bwrap.mjs
```

Pass: tests green; the last command prints nothing; the report names an owner for every deleted test.

## Rollback

`git revert` the phase's commits; the Node files, their tests and the door allowance come back together.
