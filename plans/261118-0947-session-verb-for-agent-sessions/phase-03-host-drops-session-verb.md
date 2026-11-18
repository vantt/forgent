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
