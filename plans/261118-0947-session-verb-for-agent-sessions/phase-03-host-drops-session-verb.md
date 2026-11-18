# Phase 3: Host drops the session worktree verb

Decisions: SV-1, SV-5. Depends on phases 1 and 2 (no caller left). Evidence: scan report §1, §6.

## Inputs (read first)
- `apps/fgos/src/wiring/session.rs` (whole module), `apps/fgos/src/main.rs` (~126-129, ~341), `apps/fgos/src/routing.rs:90`,
  `apps/fgos/tests/cli_tests.rs` (session cases), `packages/host-runtime/rust/src/catalog.rs` (`session.*`, ~305-345) and
  any request/outcome contract files for `session.*` (`rg -n "session\.(start|end|list|gc)" packages apps`).
- `src/cli/command-registry.mjs` `session` entry (~2214); generated `packages/host-runtime/contracts/command-{manifest,routes,route-annotations}.json` and their generator (`rg -n "command-manifest" scripts package.json`).
- `packages/holder-lock/contracts/lock-registry.v1.json` (`sessions`, rank 80) and `docs/platform/holder-lock/spec.md`.
- `packages/git/rust/src/store_admission.rs` (`is_session_worktree` ~161, the admission branch ~122-133, tests ~296), `packages/git/contracts/mutation-census.v1.json`, `docs/platform/git/spec.md` G-191 (~850, ~1308).
- `test/rust-host/help-routes.test.mjs`, `test/util/host-bin.test.mjs`, `test/rust-host/fixtures/store-declaration-vectors.json`.

## Facts re-checked on origin/main 0d3179d92 (lead, 2026-11-18)
- `main.rs` descriptors :149-152, :375-380; `routing.rs:90`; catalog `session.*` :292-331 (test assert :490-493); no
  separate `session.*` contract files. `cli_tests.rs` session cases: `test_session_verbs_start_no_node` (:3005),
  `test_session_verbs_outside_a_project_are_refused_and_create_nothing` (:3084).
- `apps/fgos/src/cli_projector.rs:111-116,231` imports `wiring::session::*_OPERATION_ID` and `project_session_args`:
  remove those (the `identity session` projection ~:474 stays for phase 4).
- Registry `session` entry `command-registry.mjs:2280`; generator `scripts/export-command-selectors.mjs`.
- The `sessions` lock (rank 80) is taken only by `session.rs` (`lock_sessions`): retire it.
- `store_admission.rs`: `is_session_worktree` :166, call :128, tests :297, :339, :427, :522, :594. Census `session.rs`
  rows :144, :2027, :2034 (regenerate). G-191 `docs/platform/git/spec.md:853,1312`.
- Fixtures: `store-declaration-vectors.json:34-39` (six `session` vectors, also read by `test/cli/fgos-manifest.test.mjs`),
  `help-routes.test.mjs:187,195`, `host-bin.test.mjs:185-186` (`session list`: replace with another read-only verb).
- Head code (`src/session-host`, `src/session-rotation`, `packages/run-supervisor`) calls no `session` host verb.

## Files this phase may write
See the phase table footprint in plan.md.

## Steps
0. Re-grep: `rg -n "sessions\.json|fgos-sessions|session\.(start|end|list|gc)|is_session_worktree|\"sessions\"" apps packages src bin test scripts`. Every hit is retired here or listed as a stop.
1. Delete `session.rs`, its descriptors and registration in `main.rs`, the routing row, the `session.*` catalog descriptors and their contracts.
2. Delete the `session` registry entry; regenerate manifest, routes and annotations.
3. Retire the `sessions` holder-lock (registry row, spec rank table) unless another holder still takes it (step 0 decides).
4. Store admission: remove the symlinked-session admission and its tests; the refusal message no longer names `fgos session start`. G-191 in the git spec gets a superseded note (frozen catalogue text stays, per the spec's own rule); census rows for `session.rs` go.
5. Remove the session cases from `cli_tests.rs`, help-route and host-bin tests and fixtures.

## Verify
- `cargo test --workspace` and `cargo clippy --workspace -- -D warnings`; `cargo check --target x86_64-pc-windows-msvc -p fgos` and `aarch64-apple-darwin` per the land-gate rules.
- Focused: `test/cli/fgos-manifest.test.mjs`, `test/rust-host/**`, `test/util/host-bin.test.mjs`.
- Acceptance grep 3 of plan.md, excluding identity (phase 4).

## Rollback
`git revert` the phase commit set; regenerate manifest and routes.
