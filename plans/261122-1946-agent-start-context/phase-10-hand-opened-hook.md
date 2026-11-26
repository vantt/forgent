# Phase 10: SessionStart hook for hand-opened sessions

Slice 3, second half (ASC-D3). A session the owner opens by hand on claude, codex or agy gets its context from the
composer. There is one SessionStart verb for every case: a rotation successor, and a hand-opened session.

## Inputs

- The native verb `fgos hook session-rotation --event session-start` (`apps/fgos/src/wiring/session_rotation_hook.rs`
  after phase 7; described in `packages/host-runtime/contracts/command-manifest.json` around line 2005).
- The hook table, Rust only since `4259868c5` retired the Node table (`src/setup/agent-hooks.mjs` is gone):
  `packages/distribution/contracts/agent-hooks.v1.json` (rows exist only under `rowsMailboxOn`, for projects that
  opted into the mailbox; SessionStart rows today: claude `identity session --register` and `hook session-rotation`,
  codex and agy `identity session --register`), `packages/distribution/rust/src/agent_hooks.rs` and
  `packages/distribution/rust/tests/goldens/agent-hooks-vectors.json`. Hooks are installed by
  `fgos doctor --fix --only <cli>-hook-wired`. `test/setup/agent-hooks.test.mjs` runs the installed hook code.
- `scripts/fgos-session-start-hook.mjs` is not part of this: it injects canonical paths and is wired only by this
  repository's own `.claude/settings.json`, which this plan does not touch.
- The AGENTS.md install gate: a new config key goes into `core/config-standard` and `core/config-schema`, and nowhere
  else.

## Footprint

`apps/fgos/src/wiring/session_rotation_hook.rs`, `apps/fgos/src/wiring/start_context/**`,
`packages/host-runtime/contracts/command-manifest.json`, `packages/distribution/contracts/agent-hooks.v1.json`,
`packages/distribution/rust/src/agent_hooks.rs`, `packages/distribution/rust/tests/goldens/agent-hooks-vectors.json`,
`test/setup/agent-hooks.test.mjs`, `core/config-standard/startContext.yaml`,
`core/config-schema/startContext.schema.yaml`.

## Steps

1. Add the config key `startContext.entryPersona` (default `secretary`) and, if phase 3 made the per-delivery byte
   budgets configurable, those keys too. Each key goes in `core/config-standard/startContext.yaml` and
   `core/config-schema/startContext.schema.yaml`.
2. Extend the SessionStart verb:
   - When the session is a head (it has a head identity), compose with `kind=head` and its persona, as today.
   - Otherwise compose with `kind=hand-opened`, `cli` and `project`. The persona is the configured entry persona;
     no seat or grant is created, and the P13 UX flow is out of scope.
   - Deliver the result as `hook-context`. Update the verb's manifest description.
3. Register the hook for claude, codex and agy in the hook table, with golden vectors to match. omp and pi have no
   rows. Say in the commit whether the rows join `rowsMailboxOn` or get an opt-in of their own; a new opt-in is a
   config key under step 1.
4. A refusal or an unreadable config must not block the session. The hook prints nothing and records the refusal.

## Verify

- `cargo test -p fgos-distribution` passes, and so does `node scripts/run-tests.mjs test/setup/agent-hooks.test.mjs`.
- `echo '{}' | fgos hook session-rotation --event session-start` (or the verb's new name, as registered) prints the
  composed context in a plain directory with fgOS set up and the hook installed.

## Rollback

Revert the commit. The hook rows and the config key are removed, and the rotation-only behaviour stays.

## Result (2026-11-27, fg-server)

Done for Claude. The config key `startContext.entryPersona` (default `secretary`) has its standard and schema files
and is in the config bundle. The SessionStart verb is unchanged in name: in a session with no head identity, it
composes `{sessionType: hand-opened, agentCli: claude, project: <handle>, persona: <entryPersona>}` with delivery
`hook-context`, in process, through the door's own route. It prints the blocks as Claude's `additionalContext`,
and prints nothing when no rule is selected or on a refusal; the refusal goes to stderr.

Two differences from the steps above:
- The Claude row needed no change: it already calls that verb at SessionStart.
- Codex and agy got no row, because nothing in the repository shows how either CLI takes context from a SessionStart
  hook. That is backlog row `p-6tmbvyt2zx`.

Until phase 9 gives rules `when:` facts, a hand-opened session is selected nothing beyond AGENTS.md, so the hook
prints nothing. The composer places a rule with no `when:` only in the setup projection, never again in a start.

The wiring proof is the hand-opened case in `session_rotation_hook.rs`'s tests, run against this repository's own
`.fgos`. The config fixture `repo-differences.v1.json` also records `runner.supervisorScope`, which main added
without recording.

