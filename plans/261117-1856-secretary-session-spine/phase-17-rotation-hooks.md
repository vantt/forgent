# Phase 17: Rotation hooks, doctor row and install wiring

Status `draft`: the hook calls the head verb (owner question 1, phase 15).

## Inputs (read first)
- Phase 8 (`measure`, `decide`), phase 14 (`requestRotation`, `rotateHeadSession`), phase 12 (SessionStart hook).
- `reports/spike-rotation.md` (sidecar or transcript; the hook must not use `decision: block`).
- `src/setup/agent-hooks.mjs`, `packages/distribution/contracts/agent-hooks.v1.json`, `.claude/settings.json` (Stop and
  SessionStart entries), `packages/distribution/contracts/doctor-registry.v1.json` (row keys `id, description, owner`;
  `fixes` separate), `docs/platform/packaging-distribution/contracts/setup-doctor-registry.md` §3.

## Files this phase may write
`scripts/fgos-session-rotation-hook.mjs` (new), `scripts/fgos-session-start-hook.mjs`, `src/setup/agent-hooks.mjs`,
`packages/distribution/contracts/agent-hooks.v1.json`, `packages/distribution/contracts/doctor-registry.v1.json`,
`test/setup/agent-hooks.test.mjs`, `.claude/settings.json`.

## Steps
1. Stop hook `fgos-session-rotation-hook.mjs`: only when `FGOS_HEAD_ROLE` is set; read the Stop payload, measure, decide;
   on soft/hard call `requestRotation` and exit 0 at once; never block, never print to the conversation; any error exits 0.
2. SessionStart loader (extend the phase 12 hook): when `FGOS_HEAD_ROLE` is set and a `latest.json` exists for the
   lineage, return its handoff as `additionalContext` (under 10,000 chars, else a pointer plus the verbatim pending
   question) so a manually started session also sees it.
3. Register both through the agent-hooks contract (the install door) and mirror them in this repo's `.claude/settings.json`.
4. Doctor: one row for the rotation hook wiring (owner per the registry's form), read-only, warns when a head session's
   hooks are missing; no repair beyond the setup door.
5. Extend `test/setup/agent-hooks.test.mjs` by the two hook cases and the doctor-registry contract test if one exists
   (`rg -l "doctor-registry" test`); the decision logic stays owned by phase 8's tests.

## Verify
- `node --test test/setup/agent-hooks.test.mjs` and the doctor-registry contract test.
- `echo '{}' | node scripts/fgos-session-rotation-hook.mjs; echo $?` prints 0 and nothing else.

## Rollback
`git revert` the phase commit.
