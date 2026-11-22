# Phase 10: SessionStart hook for hand-opened sessions

Slice 3, second half (ASC-D3). A session the owner opens by hand on claude, codex or agy gets its context from the
composer. There is one SessionStart verb for every case: a rotation successor, and a hand-opened session.

## Inputs

- `apps/fgos/src/wiring/session_rotation_hook.rs` after phase 7.
- The hook table: `packages/distribution/contracts/agent-hooks.v1.json`, `packages/distribution/rust/src/agent_hooks.rs`
  and `src/setup/agent-hooks.mjs`. The hook script: `scripts/fgos-session-start-hook.mjs`.
- The AGENTS.md install gate: a new config key goes into `core/config-standard` and `core/config-schema`, and nowhere
  else.

## Footprint

`apps/fgos/src/wiring/session_rotation_hook.rs`, `apps/fgos/src/wiring/start_context/**`,
`packages/distribution/contracts/agent-hooks.v1.json`, `packages/distribution/rust/src/agent_hooks.rs`,
`packages/distribution/rust/tests/goldens/agent-hooks-vectors.json`, `src/setup/agent-hooks.mjs`,
`test/setup/agent-hooks.test.mjs`, `scripts/fgos-session-start-hook.mjs`, `core/config-standard/startContext.yaml`,
`core/config-schema/**`.

## Steps

1. Add the config key `startContext.entryPersona` (default `secretary`) and, if phase 3 made the per-delivery byte
   budgets configurable, those keys too. Each key goes in `core/config-standard/startContext.yaml` and its schema.
2. Extend the SessionStart verb:
   - When the session is a head (it has a head identity), compose with `kind=head` and its persona, as today.
   - Otherwise compose with `kind=hand-opened`, `cli` and `project`. The persona is the configured entry persona;
     no seat or grant is created, and the P13 UX flow is out of scope.
   - Deliver the result as `hook-context`.
3. Register the hook for claude, codex and agy in the hook table, with golden vectors to match. omp and pi have no
   rows.
4. A refusal or an unreadable config must not block the session. The hook prints nothing and records the refusal.

## Verify

- `cargo test -p fgos-distribution` passes, and so does `node scripts/run-tests.mjs test/setup/agent-hooks.test.mjs`.
- `echo '{}' | fgos internal session-start ...` (the verb's real invocation, as registered) prints the composed
  context for a plain directory with fgOS set up.

## Rollback

Revert the commit. The hook rows and the config key are removed, and the rotation-only behaviour stays.
