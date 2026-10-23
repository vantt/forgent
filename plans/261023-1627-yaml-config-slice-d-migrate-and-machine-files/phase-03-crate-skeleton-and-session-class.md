# Phase 03: Crate additions skeleton and the session-class seam (03b: the marker, owner gate G-D2)

Depends on 00. 03b depends on 02, on G-D2 and is the only part parked on the gate. Suggested executor: haiku for the skeleton, sonnet for the seam and 03b.

## Context

Slice B declared every module up front as a stub so later phases never edit `lib.rs` (Slice B D-structure, `packages/config/rust/src/lib.rs:23-40`). This phase does the same for Slice D, so the parallel tracks 04, 05, 06 and 07 touch disjoint files, and adds the one small function every write door and the accounts read need: the session class. The crate reads no environment (Slice B D3); callers pass a lookup.

## Files it may touch

`packages/config/rust/Cargo.toml` (dependency `fgos-canonical-json` path, optional `fgos-host-runtime` and `fgos-git`/`fgos-identity` default features behind a feature `host-provider`; no new third-party crate), `src/lib.rs` (module lines: `session`, `machine`, `relocate`, `docs`, `migrate`, `doctor`, `inspect`, and `provider` under `#[cfg(feature = "host-provider")]`, each file created as an empty stub), `src/session.rs`, `tests/session.rs`, `contracts/README` line only if the contracts directory lists files. 03b: one `--setenv` pair in `src/runner/dispatch/confinement/drivers/bwrap.mjs`, one assertion in phase 02's probe and a case in `dispatch-confinement-machine-private.test.mjs`.

## Design

- `session_class(lookup: impl Fn(&str) -> Option<String>) -> SessionClass` in `session.rs` (about 15 lines): `Confined` when the marker variable is present and equals `1`, otherwise `Unconfined`. The variable name is a constant in the crate and in the driver's one line; a test pins both equal (no second copy of the name).
- Threat model, written in the module comment and the spec: the marker is **not** a security boundary. A confined worker has a read-only root and the G6 mask; it can unset the variable, and then only the doors' politeness refusal and the `accounts: unavailable-confined` message are lost. No behaviour that protects data depends on it.
- **Before G-D2 is answered** (or if B is chosen): the function exists with the same signature and the marker line is not added to the driver; `Unconfined` results mean "no marker found". Acceptance 14 and the `config-accounts-unavailable-confined` end-to-end case are then recorded as Slice C's in the closeout.
- `Cargo.toml`: `fgos-canonical-json = { path = "../../canonical-json/rust" }` (used by phase 07). Feature `host-provider` mirrors `packages/identity/rust/Cargo.toml`: `default = []` here (the addon and the gateway must not pull the host runtime), `apps/fgos` turns it on in phase 09.

## Steps

1. Merge `origin/main`; create the stub files; `cargo build -p fgos-config --jobs 4` and `--features host-provider` compile; `cargo clippy -p fgos-config --jobs 4 -- -D warnings`.
2. `session.rs` and `tests/session.rs` (about 30 lines: marker `1` confined, absent unconfined, `0` and empty unconfined).
3. 03b after the gate and phase 02: driver adds the marker; the probe asserts a confined worker sees it; the constant-equality test.
4. Report the running source total in the commit message.

## Owning proof

`tests/session.rs` for the function; the probe assertion for the marker's presence in a confined worker (03b).

## Validation

`cargo test -p fgos-config --test session --jobs 4`; the existing `cargo test -p fgos-config --jobs 4` still green (stubs only).

## Risk

| Risk | L x I | Mitigation |
|---|---|---|
| Treating the marker as a boundary later | L x H | module comment, spec line, review checklist item in phases 10, 11 |
| `Cargo.toml` edit collides with another lane | L x L | merge first; one line |

## Rollback

Revert the commit: the stubs and the function go; nothing links them yet.
