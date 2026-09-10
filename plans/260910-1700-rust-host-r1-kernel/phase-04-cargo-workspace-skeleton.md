# Phase 04 — Cargo Workspace Skeleton

Depends on: Phase 00 merged.

## Objective

Stand up the three-crate Cargo workspace (`fgos`, `fgos-host-runtime`,
`fgos-distribution`) at the repo root with lint/format config, CI, a dev-host
launcher, and the Rust build-dir `.gitignore` entry — while `herdr-plugin`
keeps building alone, untouched, outside the workspace. Crates hold only
usage-stub content; kernel types (Phase 05), the invocation pipeline
(Phase 06), the legacy exec lane (Phase 07), and the native provider
(Phase 08) all land later. This phase only proves the skeleton compiles,
lints, and is wired for those phases to add code into.

## Requirements

- R1: Root `Cargo.toml` declares `[workspace] members = ["apps/fgos",
  "packages/host-runtime/rust", "packages/distribution/rust"]`,
  `exclude = ["herdr-plugin", "upstreams"]`, `resolver = "2"`, a
  `[workspace.package] edition = "2021"`, and `[workspace.dependencies]`
  pinned to exact versions: `tokio` (features limited to `rt`, `macros`,
  `time` — the minimum the Phase 06 async pipeline needs; no `full`), `serde`
  (`derive`), `serde_json`, `thiserror`. No other dependency is added at the
  workspace level.
- R2: `apps/fgos`'s `Cargo.toml` declares path dependencies on
  `fgos-host-runtime` and `fgos-distribution` now, so Phases 05–08 only add
  code, never manifest wiring.
- R3: Root `Cargo.lock` is committed after `cargo build --workspace`; it
  covers only the three new crates and their pinned dependencies.
  `herdr-plugin/Cargo.lock` is untouched (herdr-plugin is excluded, not a
  workspace member).
- R4: Root `rustfmt.toml` and `clippy.toml` exist with the smallest config
  that satisfies R6's clippy gate; any non-default option carries a one-line
  comment saying why.
- R5: `.gitignore` gains a root-level Rust build-dir entry (workspace builds
  produce `/target/` at repo root, distinct from the already-ignored
  `/herdr-plugin/target/`).
- R6: `.github/workflows/ci.yml` gains one new job beside the existing
  `herdr-plugin` job (never edit that job's body): `ubuntu-latest` only,
  running `cargo fmt --all -- --check`, `cargo clippy --workspace
  --all-targets -- -D warnings`, `cargo test --workspace` at repo root
  (matches the Decisions-table target matrix: `x86_64-unknown-linux-gnu` +
  `ubuntu-latest` CI only in R1).
- R7: `apps/fgos` is a binary crate `fgos`; with no argv it writes a usage
  line to stderr and exits `2`. No selector parsing, no legacy exec, no
  kernel call yet (Phase 07).
- R8: `packages/host-runtime/rust` is a lib crate `fgos-host-runtime` with an
  empty stub `lib.rs` (a doc comment naming its future modules is fine; no
  types yet — Phase 05 owns `contracts.rs`/`catalog.rs`/`registry.rs`/
  `operation_provider_router.rs`).
- R9: `packages/distribution/rust` is a lib crate `fgos-distribution` with an
  empty stub `lib.rs` (Phase 08 owns its content).
- R10: `scripts/run-rust-dev-host.mjs` runs `cargo build` (debug profile),
  writes a dev manifest JSON (`root: "."`, `entry: "bin/fgos.mjs"`,
  `entries.fgos: "target/debug/fgos"`) to a scratch path under `target/`,
  sets `FGOS_ACTIVE_RELEASE_PATH` to the checkout root and
  `FGOS_ACTIVE_MANIFEST_PATH` to that generated file, then execs
  `target/debug/fgos` with every argument forwarded unchanged. These two env
  var names are the contract Phase 07's `legacy_exec.rs` reads from.

## Files

Likely touch:

- `Cargo.toml`, `Cargo.lock`, `rustfmt.toml`, `clippy.toml`
- `.gitignore`
- `.github/workflows/ci.yml`
- `scripts/run-rust-dev-host.mjs`
- `apps/fgos/Cargo.toml`, `apps/fgos/src/main.rs`
- `packages/host-runtime/rust/Cargo.toml`, `packages/host-runtime/rust/src/lib.rs`
- `packages/distribution/rust/Cargo.toml`, `packages/distribution/rust/src/lib.rs`

Do not touch:

- `herdr-plugin/**` (must keep building standalone, lockfile untouched)
- `src/**`, `bin/**`, `test/**`
- Any file under `packages/host-runtime/rust/src/` other than the stub
  `lib.rs` (Phase 05/06 lease)
- Any file under `apps/fgos/src/` other than the stub `main.rs` (Phase 07
  lease: `cli_projector.rs`, `cli_presenter.rs`, `legacy_exec.rs`)
- `packages/distribution/rust/src/` beyond the stub `lib.rs` (Phase 08 lease)

## Verification

```sh
cargo fmt --all -- --check
cargo clippy --workspace --all-targets -- -D warnings
cargo test --workspace
```

- `cargo metadata --no-deps --format-version 1 | jq '.workspace_members'`
  lists exactly the three intended crates; `herdr-plugin` is absent.
- `cargo run -p fgos`; `echo $?` prints `2` and stderr carries a usage line.
- `cargo test --manifest-path herdr-plugin/Cargo.toml` still passes; `git
  diff --stat herdr-plugin/Cargo.lock` is empty.
- `node scripts/run-rust-dev-host.mjs`; `echo $?` prints `2` (the stub
  binary's usage exit, proving the script builds and execs it); the
  generated manifest file it wrote has `root: "."`, `entry: "bin/fgos.mjs"`,
  `entries.fgos: "target/debug/fgos"`.
- The alias-ban grep from `plan.md`'s Constraints (the fixed list of
  disallowed kernel-name aliases), run over `apps/fgos`,
  `packages/host-runtime/rust`, and `packages/distribution/rust`, returns
  nothing.

Capability annotation for this cell: `code:implement`.
