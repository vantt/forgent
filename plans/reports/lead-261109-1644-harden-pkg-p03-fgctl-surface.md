# HARDEN packaging P03: fgctl command surface

Branch `harden/pkg-p03-fgctl-surface` on origin/main `6471dafd5`. Plan: `plans/261109-1617-harden-packaging-distribution/phase-03-fgctl-command-surface.md`.

## What changed

- `fgctl --version`, `fgctl version [--json]`: `fgctl <version> (<commit12>, <date>)`, JSON `{name, version, commit, commitTime}`.
- `fgctl --help`, `help [verb]`, `<verb> --help|-h`: stdout, exit 0. Each verb help has changes on disk, prerequisites, options with defaults, examples, exit codes, next command.
- No arguments: task-ordered "Get started" plus the agent line, exit 0 (was usage, exit 1).
- Usage errors (unknown verb or option, stray argument, missing value, missing `--from` for `stage`) exit 2 with a did-you-mean; failures keep exit 1. `fgos` keeps 4 (plan question Q-A default).
- `--flag=value` accepted.
- `help.rs` holds the verb table that drives help, parsing and suggestions; `main.rs` keeps dispatch (311 to 237 lines).
- `fgctl upgrade` refresh progress lines go to stderr.
- `build.rs` stamps commit and date from `FGOS_BUILD_COMMIT` / `GITHUB_SHA` and `SOURCE_DATE_EPOCH`; no `git` spawn.

## Facts found

- Nothing embedded a commit for fgctl before; `fgos version`'s `gitCommit` comes from reading the checkout at runtime, so it is null in a release. The fgctl stamp therefore needs the release workflow to export the two variables (phase 11 owns `release.yml`; handed to the big lead).
- `test/rust-host/fgctl-stage.test.mjs` R1 did assert the old usage text and exit; the plan said no test did. Retired; `apps/fgctl/tests/cli_surface.rs` owns it.
- No script, workflow or installer depends on fgctl usage exit 1 (grepped `scripts`, `.github`, `install.sh`, `docs`).
- In-flight branches (`harden/t9-shim-root`, `harden/global-agent-wiring`) touch no `apps/fgctl` file.

## Gates

- `cargo clippy -p fgctl --all-targets -- -D warnings`, `cargo fmt --all --check`, msvc and aarch64-apple-darwin `cargo check -p fgctl`: clean.
- `cargo test -p fgctl`: 6 surface tests, 2 help-table unit tests, 3 existing gate tests pass.
- Focused node set (fgctl-*, release-packaging, proof inventory, ownership, project-launcher): 109 tests, 0 fail. Architecture, doc-health, citation-drift, install-sh tests pass in the first focused run.
- One-door scan: 0 undeclared sites; census regenerated (two new fgctl source files, one new test file).
- Full `npm test`: 8616 tests, 1 fail (the known V7n addendum), no run-tests ERROR line.

## Net size

Rust source +290, Rust tests +152, Node 0 (one assertion moved to stderr, one test retired). Estimate was Rust +130, tests +60: the per-verb help text (about 250 lines) and the build script account for it.

## Lessons

- A focused `run-tests.mjs <files>` does not build the release binaries the fgctl node tests read; build them first (`cargo build --locked --release -p fgos -p fgctl -p fgos-node-addon`) or every case fails with "fgctl binary must exist". Worth one line in the brief.
- A cargo command run without `CARGO_TARGET_DIR` leaves a `target/` in the worktree; export it in every shell call (the shell does not persist it).
- The census gate refuses a commit that adds a test file spawning a binary until the census is regenerated; do it with the first red-test commit.
