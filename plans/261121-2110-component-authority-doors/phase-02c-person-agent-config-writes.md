# Phase 2c: Retire the wire-agents settings wording in the Node registry (door row `person-agent-config-writes`)

## Inputs
- Row `packages/component-authority/model/doors/person-agent-config-writes.yaml`. Survivors: `packages/distribution/rust/src/agent_config.rs`, `apps/fgos/src/wiring/wire_agents.rs`. Debt: `src/cli/command-registry.mjs`, whose wire-agents description names settings the verb never sets.
- The same description is mirrored in `packages/host-runtime/contracts/command-manifest.json` (entry `wire-agents`), exported by `scripts/export-command-selectors.mjs`.

## Files it may write
src/cli/command-registry.mjs, packages/host-runtime/contracts/command-manifest.json, packages/component-authority/model/doors/person-agent-config-writes.yaml

## Rules every retirement step follows
- No twin (CA-D2, discussion §3 row 3d): every caller moves to the survivor and the copy is deleted in the same commit. The commit message names the survivor, the deleted path and the last SHA that still had it. The owning area spec's "Lịch sử quyết định" line goes in the phase report for phase 11 to place.
- Before deleting, find the test that owns the behaviour the copy gave its callers. If none does, record vectors from the copy and replay them on the survivor, in the survivor's own test file (design principle 8; the 488d3ab28 pattern).
- A caller outside this phase's files: stop, write Status BLOCKED with the file named, and change nothing. Do not widen.
- Re-read the door row first. A running plan may already have removed some debt; a row with no `debt` left needs only the check below.

## Execution
Every writing unit runs with `--provider claude` (owner order, D6 step 0). If claude is unavailable the unit parks and reports. It never falls back to another provider.

## Steps
1. Reword the wire-agents description in `src/cli/command-registry.mjs` so it names no setting the verb does not write; the Rust plan in `agent_config.rs` is the reference.
2. Regenerate or edit the manifest entry so the two agree; run `node --test test/cli/fgos-manifest.test.mjs`.
3. Remove the debt entry.

## Verify
`node --test test/architecture.test.mjs` green, no `debt` in the row; `node --test test/cli/fgos-manifest.test.mjs` green.

## Rollback
Revert the phase commit.
