# HARDEN lead report: the `fgos` launcher runs only store releases; the host root walk stops below home

Urgent security fix under decision 80 (`plans/261021-1118-harden-low-layers-bottom-up/plan.md`), from the T9 red-team and correctness seats (`plans/reports/council-261109-1544-harden-t9-seat-redteam.md` launcher finding, `plans/reports/council-261109-1544-harden-t9-seat-correctness.md` home-walk finding).

## What was wrong

1. `~/.local/bin/fgos` (written by `src/setup/project-launcher.mjs`, commit `7242b8813`) walked up from the cwd and exec'd the first `.fgos/installation/bin/fgos`. Git keeps the exec bit, so a cloned repository that commits that file runs its own code on any `fgos` call, silently through agent hooks.
2. `resolve_target_root` (`apps/fgos/src/main.rs`) walked up to the nearest `.fgos`; from a checkout with no store it reached `$HOME` and used the global `~/.fgos` as the project store (friction, metrics, convention, config).

## What changed

- **Launcher** (sh and cmd bodies): walks to the nearest `.fgos/installation/activation.json`, reads only `status` and `artifactDigest`, requires `ready` and `sha256:` plus 64 lowercase hex, then execs `<stateRoot>/releases/<digest>/bin/fgos` (or the `sha256-<hex>` spelling), the same directory `fgctl verify` checks (`store.rs` `release_dir_path`). Nothing under the project is executed; `releasePath` is not used. Refusal: exit 126, file, reason, fix (`fgctl init`, then `fgctl verify`). Reused: the store layout and the state-root formula (`state_root_from`, mirrored in shell builtins because the launcher is what finds the host). No new file, record or mechanism. Marker line unchanged so an old launcher reads as ours and is replaced.
- **Host**: the resolver moved to `cli_projector.rs` and returns `Result`. The walk stops below the home directory (`fgos_config::machine::home_dir`, raw and canonical), `--dir` naming home is refused, no project refuses with `not inside an fgOS project` and the fix. Only observe, convention and config consume the root; identity, mailbox, version, gate-bypass run anywhere. Node `invokeHost` always passes `--dir`, so Node callers are unchanged.

## Proof

- Red first: `test/setup/project-launcher.test.mjs` "a committed .fgos/installation never runs..." failed on the old body (the planted shim ran, exit 0); `apps/fgos/tests/cli_tests.rs` "a native verb under home with no project is refused..." failed on the old host (`friction ping` answered with root = fake HOME).
- Owning proofs: launcher behaviour in `test/setup/project-launcher.test.mjs` (store release per project, hostile digests, state-root inputs, Windows cmd case for the Windows job); resolver in `cli_projector.rs` unit tests; one wiring test in `cli_tests.rs`.
- Smoke: the new body run against this machine's real activation and store from `docs/` of the main checkout: `fgos version --json` exit 0.

## Upgrade path for machines

`fgctl init` and `fgctl upgrade` end with `doctor --fix`, whose `project-fgos-launcher` fix replaces a stale launcher; nothing extra is needed. Without a reactivation: `fgos doctor --fix </dev/null` in an activated project once the new release is active. Owner guide: `plans/reports/guide-261109-1629-owner-machine-launcher-and-root-walk.md`. The recovery runbook (`docs/how-to/recover-main-checkout-after-ignored-files-wipe.md`) calls the workspace shim directly and needs no change.

## OPC review

First verdict CHANGES (16:33, via forgent-6a): a relative state root (empty or unset HOME, relative override) resolved inside the project, which can ship its own `releases/`. Fixed in `5e21c95fe`. The fix refuses a state root that is not absolute, exit 126. The red-first test failed on `538722f5c`. The host side was MERGE-ready as first sent. OPC MERGE on `538722f5c` + `5e21c95fe` at 17:14.

## Out of scope, recorded (backlog `p-ls4tuvflrd`, `p-wn7ss4iyab`, `p-qqcf5lqqtn`)

- `scripts/fgos-shell-integration.sh` (opt-in, sourced by hand in a source checkout) still runs the project's `.fgos/installation/bin/fgos` at tier 0 (`p-ls4tuvflrd`).
- Node `hostBinFromActivation` trusts `releasePath`; the host exports `FGOS_HOST_BIN` to its payload, so it is reached only outside the host (tests, checkout runs, the mailbox timer's tier 0, which is the red-team timer finding).
- The fgctl workspace shim (`shim.rs` `sh_body`) trusts `releasePath`; a hostile repo replaces that file anyway, and the launcher no longer runs it.
- A project still chooses which installed release runs (any digest in the store, including an old one).
