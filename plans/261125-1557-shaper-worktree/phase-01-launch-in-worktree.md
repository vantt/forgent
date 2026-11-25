# Phase 1: Launch a head inside a linked worktree

Capability: `code:implement`.

## Inputs

- `apps/fgos/src/wiring/unit_run_host/session_attempt.rs` (the launch-session request, `HostSessionDriver`, `open_attempt`, `acquire_locks`, `prepare_seat`).
- `packages/execution/engine/src/confinement/policy/resolver.rs` section 2b (`workspace-paths` resolves under `context.repoRoot` or `context.cwd`); read only.
- `packages/execution/contracts/execution-routes/execution-routes.v1.json` (the launch-session request shape).
- `docs/platform/session-host/spec.md` section on `placeHead` and confinement; read only.

## Footprint

- `apps/fgos/src/wiring/unit_run_host/session_attempt.rs`
- `apps/fgos/src/wiring/unit_run_host/tests/session_attempt.rs`
- `packages/execution/contracts/execution-routes/execution-routes.v1.json`

## Steps

1. Facts first: list every use of `request.project_root` in `session_attempt.rs` and sort each into "the working
   checkout" (attempt cwd, sandbox context root, seat launch cwd) or "the project" (`.fgos` dir, runner config, launch
   settings, account lease `repo_root`, attempt locks' assignment dir). Write the list into the phase report
   (`plans/261125-1557-shaper-worktree/reports/phase-01-facts.md`).
2. Add an optional `workdir` to the launch-session request (absolute path). Absent means the project root, so every
   existing caller is unchanged.
3. Validate it before anything is opened: it must be a registered linked worktree of the project (its `.git` is a
   file whose common dir is the project's), not the project root; otherwise refuse `workdir-not-linked` with the path.
   Reuse the existing Git inspect door for the check; do not parse `.git` by hand if a door answers it.
4. Use `workdir` for the "working checkout" uses from step 1 only. `.fgos`, config, lease and Identity keep the
   project root.
5. Add the optional field to `execution-routes.v1.json`.
6. Extend the owning test file with: a launch with `workdir` opens its attempt with cwd and sandbox root in the
   worktree and `.fgos` in the project root; a `workdir` that is not a linked worktree is refused by name.

## Verify

`cargo test -p fgos session_attempt` passes, with the two new cases named in plain words.

## Rollback

Revert the phase's squash commit; no caller sets `workdir` until phase 4.
