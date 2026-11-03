# CI red since 2026-10-14: scope of the work to make `ci.yml` a gate again

Read-only investigation. Sources: `gh run list`/`gh api .../jobs` for workflow `ci.yml`, `gh run view --log-failed` for runs 41571905107 (latest), 38586017745 (first red) and 39221018890, and local `cargo fmt --check` runs with throwaway target dir.

## Summary

The last green run was 38523813726 (head f59ba9701, 2026-10-14 06:42Z). The first red run was 38586017745 (head e7e4bf896, 2026-10-14 15:03Z), and every run since then is red. There are four separate causes, not one. (1) `cargo fmt` went red the same day through one unformatted assert in `packages/distribution/rust/src/lib.rs`, and drift then grew unchecked to 4422 hunks in 295 files because fmt is the first step and nothing downstream ever ran. (2) `npm test` went red the same day on 12 real test failures from drift between tests and the dispatch and account-pin changes. From 2026-10-19 on, it fails mainly because the hardened Git driver refuses any repository whose effective config has a `filter.*.clean/smudge/process` key, and the runner's git config has `filter.lfs.clean` (git-lfs is preinstalled). This is a real product-vs-environment contract problem, not a flaky test. (3) The three packaging jobs (external consumer proof, linux assets, windows assets) all fail because the one-door scan used by `scripts/build-rust-distribution.mjs` goes through the same Git driver and dies with the same lfs refusal. (4) The Windows jobs additionally had a separate compile error (`libc` in `worktree.rs`) from 2026-10-19 that has since been fixed. Fixing the lfs refusal alone would likely turn three packaging jobs green and remove roughly 2589 of 2606 failing test cases; fmt is an independent mechanical fix.

## Per-job table

| Job | First red run (UTC) and cause commit | Root cause | Environment-only or real | Rough fix size |
|---|---|---|---|---|
| cargo (workspace) [cargo fmt] | 38586017745, 2026-10-14 15:03Z; line from 3a479738c (2026-10-14 21:40 +0700) | One unformatted `assert_eq!` at `packages/distribution/rust/src/lib.rs:414` at first; since then 4422 hunks. Clippy and `cargo test` have not run in CI since 10-14. | Real (code not formatted) | Mechanical: one `cargo fmt --all`, big diff (295 files), plus a land of it onto every active lane branch |
| test (ubuntu-latest) [npm test] | 38586017745, 2026-10-14 15:03Z for the first 12 failures; the lfs failure mode from 2026-10-19 (run for d2442cfb4, 39221018890) | Early: 12 tests out of sync with 5cf4fd52f (dispatch execute removed), 2c9620b6c and 55015ee74 (account pin): `account-pin.test.mjs`, `dispatch-retired-doors.test.mjs`, a "Workflow capability with no prefer pool" test, one re-briefing cap test. Late (run 41571905107): 2606 failed of 8713, 6070 pass, 37 skipped. 2589 error lines are `repository-config-untrusted: filter.lfs.clean` from `packages/git/rust/src/driver.rs` (rule introduced in dc6c91249, 2026-10-18; enforced on config read from system, global and local scope). Many others (162 "fgos init failed to bootstrap .fgos/", 155 "fgos run must run inside a git repository", 67 `worktree-fail`) look like downstream effects of the same refusal. | Early 12: real. Late: environment-triggered but a real contract gap (driver refuses a normal GitHub runner). Not "no herdr / no bwrap / no activated release". | Medium for the lfs rule (decision needed, see options); the 12 early tests were fixed by later commits (they no longer appear in the latest log) |
| external consumer proof [Build and package distribution assets] | 62af972cf, 2026-10-20 22:40Z; cause 3564cafd5 (2026-10-21 01:22 +0700) which made `build-rust-distribution.mjs` call `scan()` from `git-one-door-scan.mjs` (6840fd81c lacks it and was green, 62af972cf has it) | Exact error: `Error: {"code":"refused","cause":"repository-config-untrusted: filter.lfs.clean",...}` thrown from `src/git/inspect.mjs:16` via `scripts/lib/git-dir-layout.mjs:57 repositoryFiles` <- `scripts/git-one-door-scan.mjs:66 listFiles` <- `scan` (line 2450). | Environment-triggered (lfs filter on runner), real driver contract | Small once the lfs rule is settled |
| addon reproducibility / assets (x86_64-unknown-linux-gnu) [Package release assets] | Between 2026-10-20T19:00Z and 2026-10-21T09:52Z, same window as the line above; same cause 3564cafd5 | Same exact error and stack as above, in the packaging step. | Same as above | Same fix as above |
| addon reproducibility / assets (x86_64-pc-windows-msvc) [Package release assets] | Red since 2026-10-19 08:11Z (run 39221018890, head d2442cfb4) but for a different reason: `Build workspace (release)` failed with `error[E0433]: cannot find module or crate libc` at `packages/git/rust/src/worktree.rs:336` (`libc::geteuid()`), from 8a8362712 (2026-10-19 10:31 +0700). That is fixed; the failing step is now Package release assets | Same lfs refusal; the log shows it from `D:\a\forgent\forgent\scripts\lib\git-dir-layout.mjs:57` ("Packaging failed", Node 20.20.2, Git for Windows 2.56, which also ships an lfs filter in its system config). | Same as above | Same fix as above |

Also red at various times but not in the latest run: `independent addon (windows)` (same libc error, since fixed), `audit locked dependencies` and `cargo test --locked (herdr-dashboard)` (red in samples from 10-23 to 10-25 only).

## fmt drift numbers

With the committed `rustfmt.toml` (edition only): `cargo fmt --all --check` reports 4422 `Diff in` hunks across 295 of 670 tracked `.rs` files. It is spread over almost every Rust package, not concentrated in one lane. Files with drift, by owner: packages/git 45, packages/run-supervisor 42, packages/process 29, packages/observe 24, packages/holder-lock 23, packages/identity 21, apps/fgos 21, packages/mailbox 16, packages/terminal-control 15, packages/event-store 15, packages/config 9, packages/seat-binding 8, packages/distribution 6, packages/agent-protocol 5, work-state 3, run-result 3, host-runtime 3, apps/fgctl 3, durable-file 2, convention 2. Heavy packages with little drift relative to size: yaml-doc (53 files, 0 drifted), secrets (12, 0). Mailbox, event-store and config are only about 20 to 25 percent drifted, git and run-supervisor are nearly entirely drifted.

Would a wider `max_width` help? No, it makes things worse, because the code was written wider than the default 100 columns and widening changes other rules too:

| max_width | hunks | files with diff |
|---|---|---|
| 100 (default, current) | 4422 | 295 |
| 110 | 6107 | 514 |
| 120 | 6785 | 540 |
| 140 | 7574 | 560 |

So no rustfmt option shrinks the diff; the shortest path is to run `cargo fmt --all` once. At the first red run only one hunk existed, which shows the drift is accumulated agent output with no local fmt gate, not a style disagreement.

## Options to make CI a working gate again

1. Format once, then keep fmt honest (cost: one large mechanical commit of 295 files; conflict risk for every open lane branch, so announce a window on the board; add `cargo fmt --check` to the pre-commit or the run-tests gate so drift cannot return). This is independent of the other causes and unblocks clippy and `cargo test`, which have not run in CI for three weeks, so expect new red there to be triaged afterwards (cost unknown until run).
2. Settle the lfs rule in the Git driver (cost: a design decision plus Rust change and tests). The driver treats any `filter.<name>.clean/smudge/process` as an untrusted repository config. Options: (a) ignore filters whose values are the stock `git-lfs` commands when they come from system or global scope; (b) only refuse filters from local or worktree scope, since system and global are the operator's own config; (c) set `GIT_CONFIG_NOSYSTEM=1` and a clean `GIT_CONFIG_GLOBAL` inside CI only. (a) or (b) fixes real users who have git-lfs installed, so it is the product-correct answer; (c) is cheap but hides the problem for users and for the packaging scripts users run. Needs an owner call because it touches a security law of the Git lane.
3. Quick CI-only unblock (cost: a few lines in `ci.yml`, no product change): run `git lfs uninstall --system` and `--global` (or export `GIT_CONFIG_NOSYSTEM=1` plus an empty `GIT_CONFIG_GLOBAL`) before the test and packaging steps. Likely turns the three packaging jobs green and clears the 2589 lfs-error test cases in one push; remaining real failures then surface. Risk: it papers over option 2 and must be removed once option 2 lands (L10: no alongside paths).
4. Triage what is left after options 1 and 3 (cost: unknown; the log hides the non-lfs failures behind the refusal, so a fresh run is the only way to size it). Use `fgos`/`run-tests` locally to see the same failures first; local runs do not hit lfs because `/etc/gitconfig` is absent here.
5. Short-term policy: mark the red jobs non-required in branch protection while options 1 to 4 land (cost: none, but loses the gate; only acceptable if explicit on the board).

Suggested order: 3 (same day, restores signal), 1 (announced window), then 2 and 4 as owned items. This investigation did not edit, commit, push or re-run CI.

## Unverified points

- I could not read the runner's git config; that `filter.lfs.clean` comes from the preinstalled git-lfs system config is inferred from the logs (repo has no `.gitattributes` lfs rules and `grep lfs ci.yml` is empty) and from this machine having no `/etc/gitconfig`.
- The 12 early test failures were not bisected to a single commit; the range is f59ba9701..e7e4bf896 (117 commits), likely 5cf4fd52f, 2c9620b6c, 55015ee74.
- The first-red date of linux `Package release assets` is bracketed by sampling, not by looking at every run (about 760 runs in the window).

## Reproduction on fg-server2 (lead:HARDEN, 2026-11-03 12:2x)

With a temporary `HOME` whose `.gitconfig` holds only the block `git lfs install` writes (`filter.lfs.clean`, `.smudge`, `.process`, `.required`), `node scripts/git-one-door-scan.mjs --root .` throws `{"code":"refused","cause":"repository-config-untrusted: filter.lfs.clean"}` from `src/git/inspect.mjs:16`; with the real `HOME` (no `filter.*` key) it passes. So the refusal is not CI-only: every Git-port call refuses on any machine where the user ran `git lfs install`. `check_config` (`packages/git/rust/src/driver.rs:763-772`) refuses a command key from any scope, while `untrusted_transport_config` (`:748-753`) already exempts the `global`, `system` and `command` scopes. Handed to lead:OPC (Git crate owner and reviewer).
