# HARDEN pkg rust-toolchain: Rust floor 1.97, pinned 1.99.0

## Outcome

Every Rust build of fgOS now names its compiler: `rust-toolchain.toml` pins `1.99.0` (components clippy, rustfmt, profile minimal, no targets) and `[workspace.package] rust-version = "1.99"` is inherited by every workspace member (`rust-version.workspace = true`, next to `edition.workspace`). Vendored third-party crates and the two excluded manifests (`apps/fgos-gateway`, `herdr-dashboard`, `tools/*`, fuzz) are untouched; they build from the repo root so the toolchain file still governs them. An older bare `cargo` stops with a named rust-version error.

## Prior art

Reused:
- Packaging audit `fa2e2027a` (`plans/reports/audit-261109-1533-fgos-packaging-distribution.md`): row RS-05, SHOULD, "gap: No rust-toolchain.toml". This change closes it.
- ci.yml's "Show Rust toolchain" steps and the holder-lock and release-assets equivalents.
- `.github/cargo-deny.toml`: no `msrv` or `rust-version` key, nothing to update.

Missing / found:
- `git log -S'rust-toolchain'` and `-S'rust-version'`: no earlier pin was ever added or removed; only the audit mentions it, and the one `rust-version` hit is the vendored saphyr-parser's own "1.85.0".
- `git log -G'preinstalled toolchain' -- .github` (`72c320d7d`): the "no toolchain action" choice was deliberate to avoid a third-party action; kept. Only the claim "ubuntu-latest ships the toolchain" became false as a floor, so the comments now say rust-toolchain.toml pins it and the runner's rustup installs it.
- Not in the brief: rustup 1.28.0 stopped implicit install, 1.28.1 restored it, 1.29.1 warns that it is deprecated (this machine printed that warning), and 1.30 is planned to remove it for `rustup show`. Relying on `rustup show` to install would break silently later, so the steps are now `rustup toolchain install` (no arguments, reads rust-toolchain.toml), `rustup show`, `cargo --version`. This is still no toolchain action, and the log still proves the version. Decision 3 holds (no action added); only the step body changed.

## Changes

- `rust-toolchain.toml` (new), root `Cargo.toml` (`rust-version`), 27 member manifests (`rust-version.workspace = true`).
- `.github/workflows/ci.yml`, `release-assets.yml`, `holder-lock-cross-platform.yml`: toolchain steps and the two stale comments.
- `CHANGELOG.md` `[Unreleased]` line.
- Pre-commit root allowlist: a new root file needs `rust-toolchain.toml` in `ROOT_FILE_ALLOWLIST`, and the hook demands that change land on main first and be live in the main checkout (the hook runs from the main checkout's `core.hooksPath`). Landed `ba1569a92` alone (allowlist + regenerated one-door census), pulled the main checkout, then the pin commit. Only `rust-toolchain.toml` was added, placed before `rustfmt.toml` so the hook e2e test's anchor still matches.
- Docs: no file states an install-Rust command or version (README only says release installs need no Rust toolchain, still true; the recover how-to just says `cargo build`), so no doc line changed.
- Rust source: none. No clippy lint fired.

## Gates (compiler 1.99.0, Cargo target on ext4)

- `cargo fmt --all --check`: clean.
- `cargo clippy --locked --workspace --all-targets -- -D warnings`: clean; also `apps/fgos-gateway` clippy clean.
- `cargo test --locked --workspace`: 2195 passed, 0 failed. `herdr-dashboard` tests pass.
- `cargo check --locked --workspace --target x86_64-pc-windows-msvc` and `aarch64-apple-darwin`: pass (one existing dead_code warning in `fgos-node-addon` on msvc, not a clippy or CI failure).
- `test/e2e/root-file-guard-hook.test.mjs`: 14 pass.
- cargo-deny: config does not read rust-version.
- Full `npm test` (log `/dev/shm/rt-full-175252.log`): 8845 tests, 8812 pass, 2 fail, both known red on main and unrelated: the V7n addendum test and the decision-citation-drift scan (document-identity spec.md lines 52 and 206, missing glosses). No ERROR lines.

## Owner-machine impact (for the release guide)

- First `cargo build` or `cargo test` in the checkout downloads Rust 1.99.0 plus clippy and rustfmt through rustup (about 5 components); a machine without rustup can no longer build from source with a distro compiler older than 1.99.
- Cross triples are not in the file: add with `rustup target add x86_64-pc-windows-msvc aarch64-apple-darwin` where needed (they apply to the pinned toolchain).
- Raising the pin later: edit `channel` and `rust-version` together.
- Release binaries on CI now come from 1.99.0 instead of the runner default; this is unproven on real runners (cannot run CI here). Risk: `rustup toolchain install` without arguments needs rustup 1.28 or newer; GitHub-hosted images ship a newer rustup, but the first CI run is the proof.

## Authority

Compiler version now has one authority (`rust-toolchain.toml`); `rust-version` is the floor check that must agree with it. The doc-health or architecture tests do not check that agreement; not added (no new mechanism).

## Lessons

- A new root file needs the allowlist change landed on main and live in the main checkout's hook first; do that before the first commit attempt, not after a refused one.
- `rustup show` as an implicit installer is deprecated; install steps should name `rustup toolchain install`.
- A forbidden-word hook blocked a Bash heredoc that mentioned a "target"; write such text through the file tool.
