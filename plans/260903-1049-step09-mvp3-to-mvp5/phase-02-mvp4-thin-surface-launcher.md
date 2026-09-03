# Phase 02 - MVP4 Thin Surface Launcher

## Objective

Expose a thin user-facing way to start the declared Master Coordination fixture
without putting group-thinking logic into the surface.

## Requirements

- **R1 Surface shape.** Prefer a command/request-file helper first. A skill or
  slash launcher may wrap that command later, but only as a thin caller. The
  surface accepts a plan/artifact path and creates a validated coordination
  request for `standalone-master-coordination-loop`.
- **R2 Runtime authority.** The launcher calls the coordination runtime and then
  reads the session/evidence surface. It does not choose hidden actors,
  authorize undeclared operations, synthesize final truth, or bypass
  FlowDefinition/session validation.
- **R3 No prompt runtime.** The launcher must not paste or load the Master
  Prompt as product runtime logic.
- **R4 Request validation.** Bad file path, unknown fixture id/version, Work
  fields, missing objective, invalid bounds, or forbidden context ref fails with
  an actionable error.
- **R5 Resume/show path.** The surface should show or return the coordination id
  and the next user-relevant action without depending on chat history.
- **R6 Setup/doctor discipline.** If the launcher introduces a new config
  default, env var, runtime-read file location, or infrastructure assumption,
  register it with setup/doctor in the same phase.

## Files

Expected source/test/docs depend on the chosen surface:

- `src/verbs/coordination/run.mjs`
- `src/verbs/coordination/show.mjs`
- `src/verbs/coordination/schema.mjs`
- CLI registration files for `fgos coordination ...` if a new subcommand is
  needed
- authored skill/slash source only if the accepted surface requires one; prefer
  deferring this until the command path is proven
- `test/verbs/coordination*.test.mjs`
- `docs/architect/agent-coordination/contracts/coordination-session.md`
- `docs/specs/runner.md` or relevant user-facing spec if CLI behavior changes
- `CHANGELOG.md` if user-visible command behavior changes

Do not implement dynamic group-thinking logic in a skill.

## Tests First

Add failing tests for:

- launcher builds the same normalized request as a hand-authored request file;
- launcher refuses unknown fixture id/version;
- launcher refuses Work/profile/git mutation fields;
- launcher cannot dispatch a driver-authorized operation directly;
- launcher output includes coordination id and show/resume instruction;
- `coordination show` displays disposition/recheck state needed by a user.

Focused command:

```bash
FGOS_DISABLE_OPPORTUNISTIC_CHECKS=1 node --test 'test/verbs/coordination*.test.mjs'
```

Run setup/doctor tests if config or command registration changes require them.
Run the full test command before closing this phase.

## Proofs And Exit

- A user can invoke the fixture without manually constructing every request
  field.
- The request still enters the same runtime authorization/evidence path.
- The surface has no private truth or private actor logic.

## Risks / Rollback

Risk: creating a prompt wrapper instead of a runtime launcher, or implementing a
skill before the command path is proven. Keep the surface mechanical: fixture
id, objective, input refs, bounds, run/show. If a skill is added, it remains a
thin launcher and can be removed without changing runtime behavior.
