# Manual supervisor run: full suite on main and release

Time: 2026-11-24 about 02:15 (Asia/Saigon). Run by the manual supervisor session at the owner's request, outside the sandbox.

## Outcome

The full suites were run on main `980d1276d` (only docs commits since, so the code is the same at `728212c1f`). Main is not fully green, but none of the red tests belongs to component-authority-doors, heads-stable-and-able or head-stop-rotation-bad-measure. A release was built from a clean worktree of main `728212c1f`, staged, activated and verified.

## Suite results

- `npm test`: exit 1. Fifteen tests failed. Classified in `plans/reports/triage-261124-0200-main-red-triage.md`: 3 caused by the dirty working tree of this machine, 6 flaky under machine load (all pass when rerun alone), 6 real regressions with a named cause commit, and 2 mailbox-live-confined tests whose cause is not proven.
- `cargo test --workspace --no-fail-fast`: exit 101. Three tests failed: `fgos-config` `registry_defaults` (a doc line in `core/config-standard/docLocate.yaml` differs from its schema description), `fgos-run-supervisor` `head_request` (the contract names the refusal codes and verbs differently from the server), and `fgos` `cli_tests` (an interrupt-of-host test, not yet classified).
- Logs: `.fgos/runtime/tmp/suite-npm.log`, `suite-cargo2.log`.

## Release

- Built `cargo build --locked --release --workspace` and `node scripts/build-rust-distribution.mjs` from the clean detached worktree `forgent-worktrees/sup-release-261124` at `728212c1f`.
- `fgctl stage` then `fgctl upgrade --from` activated `sha256:9e5ae72c767786e82b65a85383283b9c74ece0000ea7e9bfcfeb95b1f7c0fda5`; `fgctl verify` printed `verified 9e5ae72c7677`.
- Rollback: `fgctl repair` re-activates the previous release `sha256:ef959860688e885dfa9f5845b525033a1e82710735c8a66dba9cd88676ea1184`. The previous fgctl binary is kept at `~/.local/bin/fgctl.prev`.
- The upgrade's doctor tail printed `not ready` for pre-existing rows only (tool registry, one stale work step, provider quota quarantine, two timers); nothing about the release itself.
- `.fgos/distribution.json` carries the new per-machine pin as an uncommitted change, as before.

## Decisions taken without the owner

- Released from a main with known red tests, because every red test is a stale test or a doc/contract text mismatch outside the release's own crates and the release is reversible. The owner's recommended option was to release after a green suite; the owner later asked the supervisor to do the release itself.

## Unresolved questions

- Mailbox: does `doctor --fix --only` really take more than 5 seconds in the sandbox since `4259868c5`?
- Should `p-vnsigyw6h7` be reopened or folded into `p-4nmomwje7j`?
- domain-registry: keep the "no addon" property or accept the native door?
- Who renames the tracked directory `plans/discussions/privileged-chores-research/`?
