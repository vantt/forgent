# HARDEN T9 P13: one shim-or-refuse command builder

Branch `harden/t9-p13-command-builder`; commits `fbed6b6ba` (red tests), `bda9c2712` (builder). Status: DONE_WITH_CONCERNS.

## API for P14

`herdr_fgos_common::fgos::fgos_command(root: &Path, args: &[&str]) -> io::Result<std::process::Command>`

- Program is the workspace shim `<root>/.fgos/installation/bin/fgos`; args are `args`, then `--dir <root>`; `current_dir(root)`; stdin null.
- Shim missing, not executable or symlinked outside the installation root: `Err(NotFound)` whose text names the path and says "run `fgctl init`". Never a node command.
- The gateway maps that `Err` to 503 with the `fgctl init` hint. It can set its own stdout/stderr and spawn cap on the returned `Command`.
- `resolve_fgos` stays `pub` and now returns the same refusal (no node fallback); `is_tier_zero` stays `pub`. `gateway.rs` is untouched and still compiles (`unwrap_or_else(|_| root.join("bin/fgos.mjs"))` still builds). P14 switches `build_fgos_command` to `fgos_command` and then deletes `is_tier_zero` and makes `resolve_fgos` private (they have no other caller).

## Done

- `fgos.rs`: `fgos_command` added; `resolve_fgos` refuses instead of `Ok(<root>/bin/fgos.mjs)`; `run_fgos` shrinks to one builder call; node branch deleted.
- `herdr-dashboard/src/main.rs`: `fetch_worker_slots` uses `fgos_command`; node branch and the `Command` import deleted. A refusal there stays fail-open (`None` = no ceiling known), as before.
- Tests: three fallback tests (absent, not executable, symlink escape) retired: behaviour (a node fallback) removed. New owners in `fgos.rs`: `fgos_command_runs_the_shim_with_dir_and_project_cwd`, `..._refuses_naming_fgctl_init_when_no_shim`, `..._refuses_a_shim_that_is_not_executable`, `..._refuses_a_shim_symlinked_outside_the_install_root`. `resolve_fgos_resolves_tier_0_when_present_and_executable` kept.
- Red evidence: the four tests failed to compile (`fgos_command` not found) before the builder.
- CHANGELOG line added.

## Evidence (all ran)

- `cargo test -p herdr-fgos-common` 26 pass; `herdr-dashboard` (own manifest, excluded from the workspace) 88+36+1 pass; `apps/fgos-gateway` `cargo check --all-targets` ok.
- `cargo fmt --all --check` ok; clippy `-D warnings` on herdr-fgos-common ok; `cargo check -p herdr-fgos-common` for x86_64-pc-windows-msvc and aarch64-apple-darwin ok.
- Node: architecture, doc-health, citation-drift, git-mutation-census: 85 pass. Census regenerated with `--write-census`, 0 undeclared sites.
- Full `npm test` (log `/dev/shm/p13-full-*.log`): fail 2, no ERROR lines. (1) known red V7n addendum. (2) `test/setup/active-release-drift-check.test.mjs` "real builder selection...": "Compiled fgctl not found ... target/release/fgctl", a fresh worktree with no release build; the file is untouched by this change, and it fails the same way alone. Not proven red on main; flagged.
- Headless dashboard smoke: none exists.
- `rg "bin/fgos.mjs" herdr-dashboard/src packages/herdr-fgos-common/rust/src`: one comment only.

## Size

Branch diff vs origin/main: +109/-118 = -9 lines over 4 files (fgos.rs, dashboard main.rs, census, CHANGELOG); dashboard alone -29. Plan estimate -100 not met: the gateway's node branch (-30) and the `resolve_fgos`/`is_tier_zero` exports go in P14, and four new tests (+90) replace three old ones.

## Concerns

- `herdr-dashboard` clippy `-D warnings` fails on 3 existing lints in `src/layout.rs` (not my file; the crate is outside the workspace gate). Left alone.
- Behaviour change: `fgos_command` sets `current_dir(root)`, so `run_fgos` fetches now run in the project root (the gateway already did).

## Authority

Which `fgos` binary a Rust adapter runs is decided once in `fgos_command`; the gateway still holds its own copy until P14 deletes it.

## Lessons

- `rustfmt` on a file never formatted by `cargo fmt` (dashboard is excluded from the workspace) rewrote 470 lines; format only workspace members.
- The commit hook's census check fires on any Rust edit; run `--write-census` before the first commit.
- Standalone crates (dashboard, gateway) are `-p`-invisible; test them by `cd` into their manifest.
