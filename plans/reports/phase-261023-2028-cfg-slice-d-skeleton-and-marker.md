# Config Slice D, phase 03 (skeleton, session class) and 03b (confined marker), plus two phase-02 cleanups

Branch `cfg/slice-d`, worktree `/home/vantt/projects/forgent-worktrees/cfg-slice-d`. Not pushed, not merged.

## Result

- **03 skeleton** (commit `866acc891`): `lib.rs` declares `doctor`, `docs`, `inspect`, `machine`, `migrate`, `relocate`, `session` and `provider` (`#[cfg(feature = "host-provider")]`), each file an empty doc-comment stub except `session.rs`. `Cargo.toml`: path dependency `fgos-canonical-json`; optional `fgos-host-runtime` and `fgos-git`; feature `host-provider = [dep:fgos-host-runtime, dep:fgos-git, fgos-identity/provider]`, `default = []`. No third-party crate. `Cargo.lock` gains the three edges only.
- **`session_class(lookup)`** in `session.rs` (23 lines, cap 40): `Confined` only when `FGOS_CONFINED` equals `1`. Owning proof `tests/session.rs` (1 test: `1` confined; absent, `0`, empty, `true`, ` 1` unconfined; the lookup is asked for the marker only).
- **03b marker** (G-D2 answered): bwrap driver adds `--setenv FGOS_CONFINED 1` right after `--as-pid-1` for every confined launch. `CONFINED_MARKER_ENV` exported from `drivers/bwrap.mjs`; the Rust `CONFINED_MARKER` names the same string, pinned equal by a case in `dispatch-confinement-machine-private.test.mjs` (reads `session.rs`). The probe `machine-private-hidden` now has the real worker print the variable and fails unless it is `1` (falsifier unchanged). Module comment, driver comment and both specs (Confinement Authority 9.3 bullet, Config spec accounts line) say it is information for the session, not a security boundary; no test-only switch, tests use the variable as real input.
- `BWRAP_DRIVER_VERSION` unbumped, as decided.
- **Cleanup 1 (DRY)**: `blindRefusals` and `machinePrivateRefusals` now share `hiddenWorkspaceRefusals(candidates, roots, code, describe)` and `hiddenRootTargets`. Codes, messages and tests unchanged.
- **Cleanup 2 (hermetic pins)**: `dispatch-confinement-blind.test.mjs` points assess/prepare at a fixture HOME (`withFixtureHome`); its non-blind argv pin gains the marker pair. `dispatch-confinement-backend-p03.test.mjs` R2 passes `homeDir` (it was the one list-comparing test that went red with a `~/.fgos/private` present).

## Evidence

- Crate: `cargo build` and `clippy -D warnings` with and without `--features host-provider`, `cargo fmt --check` clean, `cargo test -p fgos-config --jobs 4` all green (own target dir `cfg-slice-d-target`).
- Node, 15 files (the 9 confinement files plus bwrap-driver, effect-guarantee, per-cli credential sources, credential renewal, confinement label, architecture) via `runSelectedTests`, `CARGO_BUILD_JOBS=4`: 346/346, 0 failed, 0 skipped.
- Hermeticity check: the same 15 files with HOME pointing at a fixture holding `.fgos/private` and a copy of `.gitconfig`: first run found R2 red (fixed above), second run 346/346. So creating `~/.fgos/private` on a developer machine no longer changes these results.
- No `npm test`, no `cargo test --workspace`.

## Caps

Rust source delta +40 lines (session 23, stubs 7, lib.rs 10); counted set total 4,506 lines. Node source: `bwrap.mjs` +45/-34 net +11, harness +3/-1 (running Node total with phase 02: about 192 of 260 for confinement).

## Concerns

- Impact analysis inactive; callers checked with `rg` (refusal helpers are file-local; `prepareBwrapSync` argv head is read by the pinned tests only).
- `fgos-git` is declared optional in the feature but nothing uses it yet (phase 09 owns that; drop it there if unneeded).
- Docs edits in two specs (one bullet, one sentence) fall outside the ownership rows of 03 but are the spec text the coordinator asked for.
- `docs/specs/reading-map.md:31` "8 probes" still pending for the docs closeout (from phase 02).
