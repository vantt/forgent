# Lead report: HARDEN ci runner-env

Branch `harden/ci-runner-env` (draft PR 9, closed after landing), lead on fg-server2. Four of the five root causes COOK found for the red CI on rc.6, plus the reds that each fix unmasked. The Windows `fgos-distribution` unit tests belong to another lead.

## What each cause was and what changed

| # | Failing step | Cause (measured) | Change |
|---|---|---|---|
| 1 | focused tests, "cargo test (session identity crate)" | The crate was renamed `fgos-session-identity` to `fgos-identity` (9fdaac9ba); the step was never updated. The step lives in `release-assets-check.yml`, not `ci.yml`. | Step kept and pointed at `fgos-identity` (its tests are not covered by another step on Windows). Unmasked: the identity facade and installer node tests need the staged addon and host, so both node steps now run through `node scripts/run-tests.mjs`. |
| 2 | external consumer proof (Linux) | No `bwrap` on the runner, so doctor rows `bwrap-available`, `confinement-bwrap-platform`, `confinement-probe-freshness` fail. Our docs said only `apt install bubblewrap`; nothing on Ubuntu 24.04 user namespaces. | Install guide section 4.4.1 (apt, plus `kernel.apparmor_restrict_unprivileged_userns=0` where the key exists). `scripts/ci-setup-bwrap.sh` runs exactly those commands; `release-assets.yml` and `ci.yml` (same proof, second place) call it. Doctor unchanged, no row excluded. Proven on the runner: the proof step passes in both workflows. |
| 3 | cargo deny | RUSTSEC-2026-0486, `rustix` 1.1.4. | `rustix` 1.1.6 in `Cargo.lock`, `herdr-dashboard/Cargo.lock`, `apps/fgos-gateway/Cargo.lock`, and the exact pin in `packages/durable-file/rust/Cargo.toml` (`=1.1.6`). `cargo deny check` ok, `cargo test --workspace` ok, msvc and darwin check ok. See the pin note below. |
| 4 | Windows "Package release assets" | Not the git version: Git for Windows 2.56.0.windows.4 is above the 2.53.0 floor. The floor probe `no-lazy-fetch` failed (verdict printed from the runner: three probes true, this one false) because the probe wrote `core.sshCommand` with a backslash path and `sh` drops backslashes, so the lazy-enabled control never ran its transport. | `packages/git/rust/src/driver.rs`: transport and marker paths go to the shell with forward slashes on Windows (`sh_path`), the value is single-quoted so a user name with a space works, test with a space in the state root calls `probe_floor()` directly. OPC MERGE on all three commits. |

## Reds unmasked by the above (each fixed, each read from its log first)

- `cargo test` stops at the first failing crate, so rc.6 hid later failures once the mailbox test was fixed. `fgos-git` lib test `a_main_checkout_lists_its_transport_policy_once_per_config_stamp` failed on the runner (and on main CI): the runner's `/etc/gitconfig` carries `filter.lfs.*`, a command key, so config validation spends one extra scope listing per stamp. Reproduced red locally with a HOME gitconfig holding those keys; the test now counts from a baseline. OPC MERGE (board line b1b81f6ee).
- `fgos-git` `tests/publication.rs` needs a git author on a bare runner: the cargo workspace job now configures one like the full-suite job does.
- `herdr-dashboard/Cargo.lock` was stale against main (`windows-sys`), so `cargo test --locked` there failed; lock refreshed.
- `scripts/ci-external-consumer.ps1` asserted `fgctl init` while `install.ps1` names `fgctl.exe init`; assertion accepts both.

## rustix pin

`=1.1.4` came in with the first use of `rustix` in `fgos-durable-file` (8debed9c6); its comment says only "already in Cargo.lock (via xattr)", `fs` feature only. No reviewed-unsafe-surface or durability reason is recorded, so the pin matches the version the lock had. Kept in the exact form at `=1.1.6`; not loosened to a range. The gateway lock was not in CI's `--locked` set and was also behind main's manifests; only `rustix` was bumped there.

## Proof (runs on the branch)

- Release assets check, Ubuntu focused tests, Linux assets (including the external consumer proof with bwrap) and `audit locked dependencies`: green, run https://github.com/vantt/forgent/actions/runs/43237585511 (head 21295d6eb). Toolchain printed `cargo 1.99.0` on Ubuntu and Windows jobs.
- CI (PR): `cargo (workspace)`, `cargo test --locked (herdr-dashboard)`, `external consumer proof`, both `addon reproducibility` Linux jobs and the deny audit green, run https://github.com/vantt/forgent/actions/runs/43241644435 (head 0da1ca803).
- Local: full `npm test` on the branch before the final rebase: only the known reds (V7n addendum, document-identity citation drift); `fgos-return` once failed on a worktree add under load and passed alone. Focused gate after the rebase: architecture, doc-health, citation drift, census tests (citation drift is the known red).

## Still red, not landed here

1. **Windows packaging read path (rc.7 blocker)**, branch `harden/ci-windows-git-paths` (OPC MERGE on 899ac40a4). This is a regression since rc.5 (2026-10-14, shipped Windows assets): packaging began reading the checkout through the Git addon in 3564cafd5 (2026-10-21). Walls found in order, each with its log line:
   - `git-floor-unsupported` (fixed above).
   - `git-command-failed` exit 128 `fatal: not a git repository: '\\?\D:\a\forgent\forgent\.git'` (run 43225125332 area): `fs::canonicalize` returns a verbatim drive path and Git rejects it. Fixed by stripping the prefix only where the child command is built (`text_path`, `child_path`), a source guard test keeps path arguments on that boundary.
   - `EISDIR: illegal operation on a directory, lstat 'D:'` at `scripts/lib/git-dir-layout.mjs:81` (run 43229007880): the facts the addon returns to Node (`resolveRepo` commonDir, gitDir, worktreeRoot, trustedMainRoot) also carry the verbatim spelling. Needs the same strip on the way out; the two-iteration cap was reached, awaiting the lead's go.
   - Past packaging, the PowerShell consumer proof was never reached before; its first assertion is fixed here, later ones are unproven.
2. **Windows write proof**: no real proof exists on either side. The `wal::` lib tests and `tests/worktree` are unix-gated (0 tests run on Windows) and 28 of 29 `worktree` node tests skip on win32 on the branch and on a baseline off main alike. Backlog row (board line) names the gap, plus OPC's known gap: caller-supplied path arguments in `worktree.rs` (`worktree add <path>`, `remove`, `move`, built from canonicalize) still go out verbatim; the fix belongs in the same door (`worktree.rs` `text()` calling the driver `text_path`).
3. Windows `fgos-distribution` unit tests (other lead) and `holder-lock-cross-platform` windows and macos crates jobs (red on main as well, not one of the four).
4. Full `test (ubuntu-latest)` job in CI carries the known reds (V7n addendum, citation drift); not mine.

## Authority

- The Git path spelling decision (internal verbatim, plain at the child boundary) now lives in `driver.rs` `text_path`/`child_path`; `worktree.rs` still has its own `text()` twin, to be moved to the same door.
- The bwrap setup is held once, in `scripts/ci-setup-bwrap.sh`, and the install guide 4.4.1; both workflows call it.

## Lessons

- `cargo test --workspace` stops at the first failing crate: a green fix upstream surfaced two more reds in the Git crate. Run `--no-fail-fast` with a bare HOME that has the runner's lfs filters and no author before pushing a CI fix; I only found the second red that way after a 40 minute CI cycle.
- A shared CI runner pool made each proof cycle 25 to 40 minutes; cancel superseded runs at once and batch fixes per cycle.
- A PR with a merge conflict gets no `pull_request` runs at all (UNKNOWN or CONFLICTING mergeability); every census conflict on a rebase needs the census regenerated, not merged.
- The stack of walls behind a failing Windows job is only visible one at a time; a throwaway workflow on a `harden/ci-windows-*` branch that runs the suspect piece on its own gave the verdict in two minutes instead of a full packaging run.
