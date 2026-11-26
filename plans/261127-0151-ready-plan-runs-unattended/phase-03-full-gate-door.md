# Phase 3: Full-gate door for the lead

Capability: `code:implement`, then `code:review`.

## Inputs

- Discussion `ds-que32ftgg6` D5 and §7 "Full-gate door": run the project's `release.checks` on a named worktree,
  unconfined, no release step; the lead may call it; `release run` unchanged.
- Prior art: commit `1bcb5a4283` ("release run applies the project's release recipe from the head window"). Copy its
  file set for a new window frame: `packages/session-host/rust/src/release.rs` (+ tests),
  `packages/run-supervisor/rust/src/head_request.rs` (+ tests), `packages/run-supervisor/contracts/head-request.v1.json`,
  `packages/session-host/contracts/head-permissions.v1.json`, `apps/fgos/src/routing.rs`. Then add what the drift
  checks name for a new subcommand: `packages/host-runtime/contracts/command-manifest.json`,
  `src/cli/command-registry.mjs` (both already list `release run`).
- Plan 261127-0143 lands first (this plan is `blockedBy` it) and edits the same permission table, head-request
  contract, manifest and registry: re-read them before editing.
- `docs/platform/run-supervisor/spec.md`: the section that documents `release run` from the window.

## Footprint

`packages/session-host/rust/src/release.rs`, `packages/session-host/rust/tests/release.rs`,
`packages/run-supervisor/rust/src/head_request.rs`, `packages/run-supervisor/rust/tests/head_request.rs`,
`packages/run-supervisor/contracts/head-request.v1.json`, `packages/session-host/contracts/head-permissions.v1.json`,
`apps/fgos/src/routing.rs`, `packages/host-runtime/contracts/command-manifest.json`, `src/cli/command-registry.mjs`,
`docs/platform/run-supervisor/spec.md`.

## Steps

1. In `release.rs`, add the checks-only rule next to the release rule: given a `Recipe` and a worktree path, run each
   `checks` argv with no shell, cwd = the worktree, and return each argv with its exit code and an overall green/red.
   It never calls apply, probe, rollback, the merge slot read or the release record (no port for them is passed).
   An empty `checks` list answers green with a note that the project declares no checks.
2. In `head_request.rs`, add the `release check --worktree <path>` frame beside `release run`: read the recipe the same
   way, refuse a path that is not a registered linked worktree of this project (`git worktree list`), refuse any other
   flag, run unconfined, return the result. A red result is a normal answer with a non-zero exit, not an error.
3. Contracts and routing: add the frame to `head-request.v1.json`; in `routing.rs` route `("release", Some("check"))`
   from a head socket the way `release run` is routed, with its argument check; add the subcommand to
   `command-manifest.json` and `command-registry.mjs`.
4. Permission table: in the `lead` row of `head-permissions.v1.json`, add `{ "prefix": "release check", "decision":
   "allow", "policy": "native" }`; add `release check` as `deny` in the base `head` row beside `release run`, so only the
   lead gets it (D5).
5. Tests (extend the owning files, principle 8): in `packages/session-host/rust/tests/release.rs` — green, red, cwd is
   the worktree, no apply/probe/rollback/record port touched; in `packages/run-supervisor/rust/tests/head_request.rs` —
   refused path outside the project's worktrees, refused extra flag, lead allowed and a non-lead head denied by the
   table; extend the routing test beside `release_run_is_a_frame_of_its_own_...`.
6. Spec: document the door in `docs/platform/run-supervisor/spec.md` next to `release run` (what it runs, where, who
   may call it, that it changes nothing on main).

## Verify

- `cargo test -p <session-host crate> --test release` and `cargo test -p <run-supervisor crate> --test head_request`
  green (crate names from each `Cargo.toml`).
- `cargo test -p fgos routing` (the routing unit tests) green.
- The drift checks the prior-art commit ran for the manifest and registry (`node scripts/export-command-selectors.mjs
  --check`, `node --test test/rust-host/command-routes.test.mjs`) green.

Pass: all green and the reviewer confirms no release port is reachable from the new frame.

## Rollback

Revert the phase commit. Reverting removes the lead's permission row at once; nothing stores state.
