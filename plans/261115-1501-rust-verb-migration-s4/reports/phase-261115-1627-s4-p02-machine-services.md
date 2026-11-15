# S4 phase 02 report: machine services and the fgctl root

Branch `rust-verb-migration-program/s4-p02`, based on the integration head `118df7065`.

## Delivered

- `packages/process/rust/src/spawn.rs` (new): `run_bounded` (full-replacement env, cwd, stdin input, timeout, distinct `Outcome::TimedOut`) and `resolve_program` (PATH and PATHEXT lookup). Std `Command`, so Windows `.cmd` runs. Doors row "run a bounded child and find a program on the search path".
- `timer.rs`: schedules, systemd and launchd render, scheduler lookup, check, fix, remove, activated-host lookup, config read through `fgos-config`. Byte vectors from Node in `tests/goldens/managed-timer-units.json`.
- `rc_lines.rs`: read-only detection, no writer; differential table against the Node patterns.
- `coexistence.rs`: manifest bytes equal Node's (md5 checked), written through Durable File, `agentsMdReadError` kept.
- `skill_stamp.rs` + `packages/distribution/contracts/skill-stamp.v1.json` (23 project vectors, 2 payload vectors, expectations produced by the Node render's own functions); read by the Rust reader and by `test/setup/skill-wrappers.test.mjs`.
- D13: `workspace.rs` asks `fgos_git::invocation_root` (policy `main-checkout-only`, no `--dir`); the function is renamed `workspace_root_of` (the old name matched the door pattern); its debt entry left the "resolve the invocation root" row; four policy rows added to `invocation-root-table.json` before the switch.
- Doors rows: managed timer, skill generated stamp, shell rc fgOS lines, coexistence manifest, bounded child; `timer.rs` added to the installation-shim row's allowed list (it names the project shim and the activated host).

## Behaviour changes

- `fgctl` no longer spawns Git children to find its root (disk-only topology); no state root is created as a side effect of the lookup. A repository Git cannot trust is `GitCommand` carrying the door's text instead of the driver cause.

## Proposed `## [Unreleased]` line

None for this phase on its own (no verb flips). Optional: "fgctl reads its project root without starting Git."

## OPC review flags

- `fgos-process`: new pub items `run_bounded`, `Outcome`, `resolve_program` in a new file, `pub mod spawn;` in lib.rs; no change to existing items.
- New crate edges `fgos-distribution -> fgos-process` and `-> fgos-config` (D15); two Cargo.lock lines (committed, authorized for the process line; the config line is the same kind of edge).
- No new pub item in `fgos-git`.

## Retired test -> owner now

None retired in this phase (the Node modules go in 09, 10, 11). Owners created: managed timer bytes and lifecycle -> `timer.rs` tests (Node `test/setup/managed-timer.test.mjs` keeps its cases until 09 deletes the module); rc detection -> `rc_lines.rs`; stamp -> contract vectors read by `skill_stamp.rs` and `skill-wrappers.test.mjs`.

## Gates run

- cargo fmt --check, clippy -D warnings (fgos-distribution, fgos-process, fgctl, all targets): clean.
- cargo test -p fgos-distribution -p fgctl, -p fgos-process --lib spawn, -p fgos-git --lib invocation_root, -p fgos-identity --test project: green.
- msvc and darwin `cargo check` for fgos-distribution, fgctl, fgos-process: clean.
- Node (release artifacts built into the phase target): skill-wrappers, managed-timer, fgctl-init*, fgctl-upgrade, fgctl-stage, fgctl-init-download*, architecture, invocation-root-table, git/one-door, runner/paths, instruction-registry, propose-classify, distribution/native-addon, setup/{doctor-strict-exit,doctor-fresh-run,pin-drift-check,uninstall-project,project-launcher}, install-packaging, cli/first-run-guide, install/install-sh: 353 tests, 0 fail.
- Census regenerated after each Rust change; 0 undeclared sites.
- Door negative cases: the bounded-child row was seeded once per pattern (`pub fn run_bounded`, `pub fn resolve_program`, `fn first_on_path`), each in its own file; each failed the architecture test by name and the file was removed. The four machine-service rows were seeded together in one file.
- Unit tests use a scratch directory removed on drop (`test_scratch.rs`, test-only); no test leaves files in the OS temp dir.

## Could be affected beyond the focused set

Any test running `fgctl init` or `uninstall` end to end (series gate), `test/e2e/*` that stage a release, Windows `.ps1` consumer proof (the root lookup changed path; msvc compile checked only).

## Decisions and deviations

- Owned-name reader does not re-check portable names or duplicates (the render enforces both before it writes); uninstall only needs the set.
- `activated_host_bin` in `timer.rs` is a Rust reader of the activation record next to the existing allowed readers; phases 07 and 10 need the same lookup and should move it to a shared home when they land.
- No parity-runner cases: this phase flips no verb.
