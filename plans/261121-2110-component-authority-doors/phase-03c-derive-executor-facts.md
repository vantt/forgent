# Phase 3c: Retire the Node executor-fact twins (door row `derive-executor-facts`)

## Waits
Phase 8 of `261122-2108-delete-dead-node-execution-closure`, which deletes the nine dispatch and execution twins of this row that only the dead closure reaches (`config-twin`, `provider-adapter`, `provider-capacity`, `mechanism`, `resolve`, `confinement/policies`, `confinement/backend-registry`, `llm-accounts`, `execution/seat-resolver`) and rewires the shared test helpers. The phase stays `draft` until that phase lands.

## Inputs
- Row `packages/component-authority/model/doors/derive-executor-facts.json`. Survivors: `packages/execution/rust/src/executor_model.rs`, `accounts.rs`, `runner_check.rs`. Debt left for this phase after the closure plan: `src/runner/capability-config.mjs` (only `capabilityConfinementOf`; the file stays for its live importers `src/workflow/propose.mjs`, `src/setup/seat-binding-checks.mjs`, `src/setup/registrations.mjs`, `bin/fgos.mjs`) and `src/runner/agent-listing.mjs` (`listAgents`, used by `scripts/agents-vectors.mjs`, `test/helpers/agents-vectors.helper.mjs`, `test/setup/packaged-definitions.test.mjs`).
- Any of the nine that the closure plan kept alive (frozen mailbox harness, S6b or S7 callers) is named in its `reports/closure.md`; that file waits for its owning step, and this phase reports it.

## Files it may write
src/runner/capability-config.mjs, test/runner/capability-config.test.mjs, src/runner/agent-listing.mjs, test/runner/agent-listing.test.mjs, scripts/agents-vectors.mjs, test/helpers/agents-vectors.helper.mjs, test/helpers/executor-model-vectors.helper.mjs, test/setup/packaged-definitions.test.mjs, test/suite-baseline.json, packages/git/contracts/mutation-census.v1.json, packages/component-authority/model/doors/derive-executor-facts.json

## Rules every retirement step follows
- No twin (CA-D2, discussion §3 row 3d): every caller moves to the survivor and the copy is deleted in the same commit. The commit message names the survivor, the deleted path and the last SHA that still had it. The owning area spec's "Lịch sử quyết định" line goes in the phase report for phase 11 to place.
- Before deleting, find the test that owns the behaviour the copy gave its callers. If none does, record vectors from the copy and replay them on the survivor, in the survivor's own test file (design principle 8; the 488d3ab28 pattern).
- A caller outside this phase's files: stop, write Status BLOCKED with the file named, and change nothing. Do not widen.
- Re-read the door row first. A running plan may already have removed some debt; a row with no `debt` left needs only the check below.

## Steps
1. Remove `capabilityConfinementOf` and its cases once no product caller is left; the executor-model vectors already replay it on `executor_model.rs`.
2. Move the release-tier judgement in `test/setup/packaged-definitions.test.mjs` and the vector recorder off `listAgents` onto the Rust judgement (the `agent-type-names-unique` doctor row), then delete `agent-listing.mjs`, its test, the recorder and its helper.
3. Remove every debt entry whose file is gone, regenerate the census, update `test/suite-baseline.json`.

## Verify
`node --test test/architecture.test.mjs test/setup/git-mutation-census.test.mjs test/runner/capability-config.test.mjs test/setup/packaged-definitions.test.mjs` green; `cargo test -p fgos-execution` green.

## Rollback
Revert the phase commit.
