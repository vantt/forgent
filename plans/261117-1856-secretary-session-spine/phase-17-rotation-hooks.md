# Phase 17: Rotation hooks, doctor row and install wiring

<!-- Updated: Validation Session 1 - one installed hook kind through the shim instead of repo scripts; status draft -->
Status `draft` until the ready plans `261117-1553` and `261117-1524` are `done` (it adds a hook kind to the shared command
registry, manifest and `bin/fgos.mjs`).

The head verb is `fgos head` (owner 2026-11-17); this phase starts once phase 15 has landed.

## Inputs (read first)
- Phase 8 (`measure`, `decide`), phase 14 (`requestRotation`, `rotateHeadSession`), phase 12 (SessionStart hook).
- `reports/spike-rotation.md` (sidecar or transcript; the hook must not use `decision: block`).
- The install door: `packages/distribution/rust/src/agent_hooks.rs` (rows, `HOOK_KINDS`), golden vectors
  `packages/distribution/rust/tests/goldens/agent-hooks-vectors.json`, the Node mirror `src/setup/agent-hooks.mjs`
  (`HOOK_KINDS` l.24), `packages/distribution/contracts/agent-hooks.v1.json`. Hooks reach every project only as
  `fgos hook <kind>` through the project shim; a Node kind is served by `bin/fgos.mjs` and listed in the `hook` entry of
  `src/cli/command-registry.mjs:865` (the host's native kinds are `apps/fgos/src/routing.rs:104`; this one is Node).
  `.claude/settings.json` (this repo's copy, written by the setup door), `packages/distribution/contracts/doctor-registry.v1.json` (row keys `id, description, owner`;
  `fixes` separate), `docs/platform/packaging-distribution/contracts/setup-doctor-registry.md` §3.

## Files this phase may write
`src/session-rotation/hook.mjs` (new), `bin/fgos.mjs`, `src/cli/command-registry.mjs`,
`packages/host-runtime/contracts/command-manifest.json`, `packages/host-runtime/contracts/command-routes.json`,
`packages/distribution/rust/src/agent_hooks.rs`, `packages/distribution/rust/tests/goldens/agent-hooks-vectors.json`,
`src/setup/agent-hooks.mjs`, `packages/distribution/contracts/agent-hooks.v1.json`,
`packages/distribution/contracts/doctor-registry.v1.json`, `test/setup/agent-hooks.test.mjs`, `.claude/settings.json`.

## Steps
1. One hook kind `session-rotation` (`fgos hook session-rotation --event stop|session-start`), handler in
   `src/session-rotation/hook.mjs`, doing nothing unless `FGOS_HEAD_ROLE` is set. On `stop`: if `FGOS_HEAD_GEN` names a
   pending successor that has not answered yet, call `markSuccessorAnswered` and take the role (phase 14); then measure,
   decide, and on soft/hard call `requestRotation` and exit 0 at once; never block, never print to the conversation; any
   error exits 0.
2. On `session-start`: when a `latest.json` exists for the lineage, print its handoff as `additionalContext` (under
   10,000 chars, else a pointer plus the verbatim pending question) so a manually started session also sees it.
3. Rows for both events in the Rust table, the Node mirror and the golden vectors (Claude first, SM-D13; other CLIs
   only where their recorded hook events allow), the `hook` registry enum, regenerated command manifest and routes, and
   this repo's `.claude/settings.json` through the setup door.
4. Doctor: one row for the rotation hook wiring (owner per the registry's form), read-only, warns when a head session's
   hooks are missing; no repair beyond the setup door.
5. Extend `test/setup/agent-hooks.test.mjs` by the two hook cases and the doctor-registry contract test if one exists
   (`rg -l "doctor-registry" test`); the decision logic stays owned by phase 8's tests.

## Verify
- `node --test test/setup/agent-hooks.test.mjs` and the doctor-registry contract test.
- `echo '{}' | npm run --silent fgos:dev -- hook session-rotation --event stop; echo $?` prints 0 and nothing else;
  `cargo test -p fgos-distribution` (crate name per its Cargo.toml) passes.

## Rollback
`git revert` the phase commit.
