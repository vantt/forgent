# Windows native release (v0.2.0-rc.2): implementation report

Branch `feat/windows-release` (from main 4a1cb41ac), pushed to origin; nothing else pushed, no PR, no tag, no release.

## Prior art (git log -S on install.ps1, msvc, windows-latest, .cmd)

- `archive/plans/260924-1550-windows-ci-hardening` (phases 00-05): the Rust workspace already builds on windows-latest; release-tree staging copies `fgos.exe` next to `bin/fgos`; release store dirs are colon-free (`sha256-<hex>`); archive entry validation already refuses drive-letter paths. **Reused as is.**
- 9c4fac8b9 wrote `fgos.cmd`/`fgos-runner.cmd` as `@sh "%~dp0fgos" %*` and ran the post-activation tail through `sh`. That needs Git for Windows on PATH, so it was **replaced** by launchers that parse `activation.json` themselves.
- `install.ps1`, any `x86_64-pc-windows-msvc` asset and any Windows consumer proof never existed (only mentions in docs/distillery text). New.

## What changed

- **Rust (`packages/distribution/rust`)**: `fetch.rs` has a `host_target`/`detect_target_for` table (linux + windows msvc) and uses `NUL` for curl's discard on Windows. New `shim.rs` owns all four launchers (sh pair + `.cmd` pair, CRLF, no `sh`), `write_workspace_shims`, `check_workspace_shims`, `tail_shim_path`. `init.rs`: publish writes all four (also on `repair`, which goes through publish); the tail runs `fgos.cmd` on Windows; `fgctl verify` checks the host's launchers exist and equal what fgctl writes (missing/edited => "run fgctl repair", release is NOT quarantined); `resolve_node_path` also tries `node.exe`.
- **cmd launcher design**: `findstr` picks the `"status"` / `"releasePath"` lines of the serde-pretty `activation.json`; delayed expansion (enabled only after reading, so `!` in a path survives) strips key/quotes/comma, collapses `\\`, strips a `\\?\` prefix; the path is handed out through `endlocal` so user arguments never undergo delayed expansion; `fgos.exe` is exec'd directly, `fgos-runner.cmd` via `call`; exit 3 for not-ready/missing, as the sh shim.
- **Release tree** (`scripts/build-rust-distribution.mjs`): Windows tree gets `bin/fgos-runner.cmd`, manifest `target` is `{os: windows, arch: x64}` (no libc). New `src/util/release-targets.mjs` is the single table (build script, packaging, doctor, asset server). Hosts with no published release (macOS dev machines) still declare the Linux target as before.
- **Doctor**: `rust-host-target-supported` now approves both triples (Data Dictionary row unchanged: no new check id). `curl-available` text mentions `curl.exe`. No new tool dependency exists: `install.ps1` uses `tar.exe`/`Invoke-WebRequest` only before fgOS exists, `fgctl` uses `curl` as before. I did not add a launcher doctor check: `fgctl verify` covers it (open question below).
- **Installer**: `scripts/install.ps1` (PowerShell 5.1+, same env vars/semantics as install.sh, mandatory SHA256, symlink refusal, timeouts, no admin: refuses an elevated session unless `FGCTL_ALLOW_ROOT=1`, never edits PATH, prints the exact commands, file:// base supported, tag charset validated, `exit` only when run as a file so `irm | iex` does not close the terminal). `install.sh` now tells MINGW/MSYS/CYGWIN users to use install.ps1.
- **Release pipeline**: `.github/workflows/release-assets.yml` (reusable, `workflow_call`, matrix `ubuntu-22.04` / `windows-latest`, builds, glibc gate on Linux, packages, consumer proof, uploads artifacts, publishes nothing). `release.yml` = check-version -> assets -> publish (publish downloads both artifacts, builds one SHA256SUMS, `sha256sum --check`s it, refuses differing installers, then `gh release create`). `release-assets-check.yml` runs the reusable workflow plus a focused-tests job on push to `feat/windows-release`. `ci.yml` external-consumer job now uses the same packaging script and `ubuntu-22.04`. `scripts/package-release-assets.mjs` is the one place that names assets, tars (System32 bsdtar on Windows, relative paths) and writes SHA256SUMS. `scripts/check-glibc-ceiling.sh` (objdump -T, ceiling GLIBC_2.35, default overridable by `GLIBC_CEILING`).
- **Docs**: `docs/specs/distribution.md` (RUL16 + decision-history entry, targets line, curl line), mirrored in `docs/platform/packaging-distribution/spec.md`; CHANGELOG `[Unreleased]`; README Install Windows block (keeps the "latest NON-prerelease, pre-release needs FGCTL_VERSION" note); how-to target lines. Citation-drift, locked-decision-heading and registrations tests pass.

## Decisions I made that you may want to veto

1. **`install.ps1` lives at `scripts/install.ps1`, not the repo root.** `.githooks/pre-commit` refuses new root files outside its allowlist, and an allowlist change must land on main first (not authorized here). The release asset is still named `install.ps1`. If you prefer the root, land the allowlist change on main and `git mv` it (update `scripts/package-release-assets.mjs`, the test path, two doc mentions).
2. Launchers (sh + cmd) are written on every host, not only Windows (the dir is gitignored; a checkout shared by WSL and PowerShell needs both). `verify` requires only the host's set (sh pair everywhere, cmd pair also on Windows) so an rc.1-era Linux workspace is not flagged.
3. Windows tree keeps both `bin/fgos` and `bin/fgos.exe` (existing convention from the CI-hardening track; preflight pins `entries.fgos = bin/fgos`).
4. `ci.yml`'s `external consumer proof` job keeps its name (branch-protection safe) but is now ubuntu-22.04 + shared script; I did NOT add Windows to ci.yml.

## A defect found and fixed that blocked every Windows checkout

`packages/observe/rust/src/sources/claude_transcripts.rs:1-40` (a 1 KB stray snippet committed in 120af6b3d) is an invalid file name on Windows, so `actions/checkout` failed on windows-latest (git exit 128). Main's Windows CI therefore cannot have been checking out. Removed it in 3cacd6550 (not referenced anywhere; the real `claude_transcripts.rs` is untouched). Also fixed a Windows-only test fixture bug in `extract.rs` (temp dir name contained `:`), and made the `fgctl-init` download tests Windows-correct (host target, `pathToFileURL`, relative tar output; a GNU tar earlier on PATH reads `C:` as a host).

## CI runs (all on vantt/forgent, branch feat/windows-release)

| Run | Result | Notes |
| --- | --- | --- |
| 38285331152 | linux ok, windows FAIL | windows: checkout failed on the stray `:1-40` file |
| 38285495528 | linux ok, windows FAIL | windows got through install.ps1, `fgctl init` (download), activated `fgos` from PowerShell and cmd, doctor; failed only on my proof script (`fgos workflow status` stderr + `$ErrorActionPreference=Stop`) |
| 38285789813 | linux ok, windows ok | Windows proof green under Windows PowerShell 5.1 and PowerShell 7; glibc gate: fgos and fgctl need at most GLIBC_2.34 on ubuntu-22.04 |
| 38286296784 | assets ok/ok, focused FAIL both | added focused-tests job; ubuntu: shallow clone broke a convention check (needs fetch-depth 0) |
| 38286647284 | focused ubuntu ok, windows FAIL | Windows-only pre-existing test bugs: extract fixture dir name, download tests (tar `C:`, `file://C:\`), workflow-text regexes vs CRLF |
| **38288487386** | **all four jobs green** | assets linux ok, assets windows ok, focused tests ubuntu-22.04 ok, focused tests windows-latest ok (77 tests, 75 pass, 0 fail, 2 skipped by design) |

## Tests run locally (Linux, `unset CLAUDE_CODE_SESSION_ID`)

- `cargo test -p fgos-distribution`: 83 passed (new: 8 shim, 2 fetch target tests). `cargo clippy -p fgos-distribution --all-targets -D warnings`: clean. (Workspace-wide clippy/fmt have findings in unrelated crates on this toolchain; I did not touch them, and reverted an accidental `cargo fmt --all` of unrelated files.)
- `test/rust-host/fgctl-init|stage|upgrade`: 60 -> 62 tests (2 new), all pass; `release-targets` (5) + `release-tree` pass.
- `test/install/*.test.mjs` + `test/scripts/*.test.mjs`: 526 pass (includes new `release-packaging`, 9 tests; `install-ps1` e2e suite skips locally because there is no pwsh on this machine).
- `test/setup/*.test.mjs`: 782 pass.
- `scripts/ci-external-consumer.sh` end to end against locally packaged Linux assets: passes (now also runs `fgctl verify`). Simulated release.yml "Assemble release assets" shell on synthetic two-target artifacts: passes.

## Proven only by CI vs unproven

Proven on real windows-latest (runs 38285789813, 38288487386): install.ps1 (latest-tag resolution, file://, checksum refusal, unsupported target, no leftovers), `fgctl init` download of the msvc asset with checksum + tag pin, tampered-download refusal by installer AND `fgctl init`, `fgos` resolving to `fgos.cmd` from PowerShell 5.1 and 7 via PATHEXT, `fgos` from `cmd.exe`, same digest from both, not-ready launcher exits 3, upgrade no-op, `verify` naming a deleted `fgos.cmd`, `repair` regenerating it, `fgos-runner` launcher reaching Node, post-activation tail through `fgos.cmd`, Windows bsdtar packaging, `cargo test -p fgos-distribution` natively.

Unproven: (a) the **publish job** and the tag trigger (only the shell was simulated locally; `gh release create` was never run, by design); (b) the **full `npm test`** on Windows (ci.yml does not run on a branch push; I did not open a PR); (c) install.ps1 on a machine without `System32\tar.exe` (Windows < 10 1803) or under a restricted ExecutionPolicy/AppLocker; (d) the "elevated session refused" branch (CI runs as admin with `FGCTL_ALLOW_ROOT=1`); (e) `irm | iex` piping (tested as a file with `-File`); (f) cmd launcher with a release path containing `!` or `%` (handled by design, not exercised; paths with spaces/parentheses are not exercised either, the CI paths contain none); (g) Windows ARM64 and macOS (out of scope, no asset).

## Unresolved questions

1. Root vs `scripts/install.ps1` (decision 1 above).
2. The Windows machine release store is `%USERPROFILE%\.local\state\fgos` (existing `HOME`/`USERPROFILE` fallback in `store.rs`); relocating to `%LOCALAPPDATA%` is a separate decision, noted as "Not covered" in RUL16.
3. Should `release-assets-check.yml` stay after merge (it triggers on a branch name) or be deleted / retargeted to `pull_request` paths? Should Windows be added to `ci.yml` (`release-assets.yml` can be called from it unchanged)?
4. A dedicated doctor check for missing launchers was not added (verify covers it); say if you want one registered.
5. v0.1.0 `fgos doctor --fix` exit 1 in an empty project: untouched, as instructed.

Status: DONE_WITH_CONCERNS
