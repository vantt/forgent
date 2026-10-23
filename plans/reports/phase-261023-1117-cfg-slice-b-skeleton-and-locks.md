# Phase report: CFG Slice B phases 00-02 (facts, crate skeleton, lock rows)

Branch `cfg/slice-b`, worktree `/home/vantt/projects/forgent-worktrees/cfg-slice-b`. Not pushed, not merged.

## Phase 00 facts (re-verified 2026-10-23)

- `readPredecessorKillWaitMs|predecessorKillWaitMs` in src, packages, apps, test: no hit (key is dead).
- `grep -c "^registerConfigDefault(" src/setup/registrations.mjs` = 14 (lines 2359 2671 2693 2725 2784 2790 2832 2898 2969 3368 3406 3695 4490 6351), as planned.
- `sectionOf`: only `src/terminal-control/config.mjs:40` (used at :58-59); the spec sentence about copies is stale (phase 14).
- No JSON Schema validator in any Cargo.toml (`rg jsonschema`: none).
- yaml-doc `parse` at `document.rs:106`, `merge` at `merge.rs:90`; holder-lock rank rule `scope.rs:95-103`; line numbers match the plan, none stale.
- D4 trace: `run_tail` (`packages/distribution/rust/src/init.rs:556`) runs the launcher as a child (`Command::new(launcher)`); the parent holds `activation` through plain `fgos_holder_lock::acquire`, the child takes its own scope. No Rust file writes config (`config.json|config.yaml` appear only in seat-binding rank, herdr settings, work-state, gateway reads). Verdict: rank 80 stands, no rank 85. Node write sites (init, doctor --fix, setup) were not traced for held leaves; that is Slice C's cutover check.
- Impact analysis: `fgos tool query --capability impact-analysis --status present` returns 0 providers = inactive. Callers checked with rg instead (below).
- Memory: `free -g` 30 total, 3-4 free, 21 available. All cargo runs used `--jobs 4`.
- Board: start line added at top of `plans/261017-1313-fgos-platform-program-board/log.md` (names the shared files). The worktree and branch already existed; plan-activation script not run (no `ak` need).

## Phase 01

Commit `dfbd805d2`. Crate `fgos-config` (`#![forbid(unsafe_code)]`), `ConfigRefusal` (no value ever printed), 13 stub modules, `failure-codes.v1.json` (7 spec ids, 5 chosen, `schema-` reserved prefix, `config-addon-missing` under not-produced-here), `annotations.v1.json` (9 annotations), `fixtures/README.md`, `tests/fixture_shape.rs` (2 tests).
- `fgos-identity` taken with `default-features = false`: `cargo tree` shows no host-runtime, git or convention edge. `libc` omitted (no unsafe here; the no-follow open lives in Durable File). `thiserror` omitted (manual Display).
- `Cargo.lock` gains only the `fgos-config` package entry. `cargo test --workspace --no-run --jobs 4` builds.
- Deviation from phase text: lib.rs uses `forbid(unsafe_code)` (D17 supersedes the "one allowed module" sentence).

## Phase 02

Commit `541251f93`, after merging `origin/main` immediately before editing. Registry: rows `project-config` (repo) and `global-config` (machine), rank 80, mutex, owner `config`; schema owner enum gains `config`. `src/locks.rs` constants + `scope_params`. `tests/lock_rows.rs` (3 tests: rows pin, params, nesting under main-checkout allowed / under a held leaf refused). `docs/platform/holder-lock/spec.md`: rank-80 leaves line and one history line (newest first).
- Existing Node test `test/holder-lock/registry-contract.test.mjs`: 19 pass, no hand-enumerated owner list, unchanged.
- Callers of the registry checked with rg: `src/holder-lock/registry.mjs`, `packages/holder-lock/rust/src/scope.rs`, `packages/event-store/rust/tests/registry_rows.rs`, tests under `test/holder-lock/`, `test/run-supervisor/contracts.test.mjs`, `test/install-packaging.test.mjs`, `test/rust-host/release-tree.test.mjs`. None counts rows or enumerates owners; only the schema test ran (per the rules).
- Lanes to know: HARDEN T1, DOC (documentation-cutover row, own owner value), IDENT; stated in the commit message and the board log line.

## Tests run

- `cargo test -p fgos-config --jobs 4`: 5 pass (2 fixture_shape, 3 lock_rows).
- `cargo test -p fgos-holder-lock --jobs 4`: all pass.
- `cargo clippy -p fgos-config --all-targets --jobs 4 -- -D warnings` and `cargo fmt --check -p fgos-config`: clean.
- `node --test test/holder-lock/registry-contract.test.mjs`: 19 pass.

## Budget

Rust source in `packages/config/rust/src`: **120 lines** of 1,500 (tests: 186 lines across `fixture_shape.rs` and `lock_rows.rs`).

## Open points

- Phase 14 should fix the stale `sectionOf` sentence and the lock-registry `ranks."80".note` leaves list (not edited here: keeps the shared-file diff to two rows plus the enum).
- `src/setup/holder-lock-checks.mjs` has no `LOCK_FILES` entry for the new rows (Slice C follow-up, file shared with HARDEN T1).
