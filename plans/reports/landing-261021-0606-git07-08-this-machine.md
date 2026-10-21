# Landing: Git 07–08 on the second machine

2026-10-21 06:06 (Asia/Saigon), second machine, workspace `/home/vantt/projects/forgent`. Coordinator self-landing under the owner's standing approval (2026-10-20 20:12).

## Outcome

Release `sha256:491091a4b0e00debbe83af34ea20f192d0db72cd8ce1525ded6c754d870c05c7`, built from main `cef8b532e`, is active since 06:03. The previous release `sha256:fde9e4e1…` (pane close, main `0cef3e4c7`) stays installed for rollback. Every Git doctor row passes through the shim, the one-door row scans 939 payload files with no writer outside the fgos-git driver, and the smokes pass.

## What reached main

Git phases 07 and 08 (branch `git/p07-switch`, fast-forwarded into main as `62af972cf`, then `cef8b532e`):

- Every Git mutation in product code goes through the typed ports of the fgos-git driver; `integrate.mjs` and the parallel cores are deleted. The mutation census is empty and doctor `git-mutation-one-door` checks it against the shipped payload.
- Holder-lock route protocol 2 (an older release or a stale global npm `fgos merge` is refused with `host-version-mismatch`).
- Review fixes: an approve retried after a pre-Land refusal now delivers; an interrupted Land is recovered by `fgos doctor --fix` (`git-land-recovery`); runner and verify checkouts set their provisioned dependencies aside on removal.
- Host-gate fixes: the distribution build stages the `.node` addon and reads the checkout in one child; the Git writer identity is text; ScopedCommit watches for hook escapees under every containment driver; borrowed Git runs capture hook stderr up to 64 MiB again; the run supervisor's doctor probe speaks its own protocol; a failed round's files are snapshotted through SafeRestore before its checkout is removed.
- The npm/GitHub channel has no native addon, so in an unactivated project it refuses with "onboard this project with `fgctl init`" (docs/specs/distribution.md, CHANGELOG).
- A workflow whose units declare no `writes` runs outside a repository (plan Q1, owner decision).

## Gates

- Host gate on `876ea737f`: NO-GO (340 branch-only failures). Rerun on `79e04c570`: NO-GO (91). After units 24–26, full `npm test` on the merged tip `62af972cf`: 8781 tests, 8683 pass, 1 fail (`hot-lock fast path` ratio, a known flake also seen on main; 3/3 solo passes). Suite wall 483 s.
- Landing found one more defect: a release built from a clean checkout outside an activated workspace failed (`lock-driver-unavailable: no fgos host binary found`) because the build's addon-read child had no host. Fixed in `cef8b532e` (the child gets the host the build just compiled); the release-tree proof now builds with an unusable inherited host and was red before the fix. Full suite with the fix: 8683 pass, 1 fail (`loop.test` "real concurrency" wall-time overlap under load; 2/2 solo passes with the npm environment).
- Cargo workspace tests and clippy clean (unit 26 and the gate reruns); P-RELEASE six rows pass under umask 022; E3 smoke runs every row, but the host CPU governor is `powersave`, so no E3 number here is budget evidence.

## Steps as run

1. Clean detached worktree `land-0530/wt` at `cef8b532e`, private `CARGO_TARGET_DIR`; release staged with 815 files and `git-wal-v1` in capabilities.
2. `fgctl` reinstalled from the worktree (previous `b5efb57f…` kept as `fgctl.prev`, new `133ac8bc…`); release staged.
3. Quiet window at 06:00:22 (no fgOS process, no open file under `.fgos` or the state root). Backup to `.fgos/runtime/tmp/landing-git07-this-machine/`; `fgctl upgrade` 06:00:39–06:03:18; `.fgos/distribution.json` restored; hashes of `AGENTS.md`, `.claude/settings.json`, `CLAUDE.md` and both configs unchanged (the other session's uncommitted edits are intact).
4. `fgos setup`: no config keys added; fetch refspecs unchanged; `git fetch origin` ok.
5. Doctor through the shim: 145 checks, 12 not passed. Every `git-*` and `lock-*` row passes (`lock-fences` passes with a warning for 12 unfenced workflow-run legacy paths). The 12 are configuration or pre-existing rows (model-policy tiers for openai, ak skills for codex, tool registry never checked, `tsk-5db` step vocabulary, one stuck attempt from a removed release, `fgos-cook` missing from the plugin skills, doc rows, executor-profile warnings, pi credential source, codex project trust) plus `active-release-matches-checkout`, which compares the main checkout's working tree; that checkout is behind main and carries another session's edits, and it is not pulled by this landing.
6. Smokes: `fgos worktree create … --detach --base origin/main` and `remove --delivered-to refs/remotes/origin/main` (3.2 s / 1.0 s); a writing `fgos run` (claude, rigor low) in a scratch worktree committed its one file through ScopedCommit in 23 s and its pane closed; scratch worktree and branch removed.

## Follow-ups

- `fgos worktree create --base origin/main` accepts the short remote name, `remove --delivered-to origin/main` refuses it ("does not name an existing branch, full ref or object id"). One ref grammar for both.
- `npm test` and the distribution build rewrite `packages/git/contracts/mutation-census.v1.json` in the checkout, because its "outside the declared product" counts change with every new plan file. The counts make the tracked census churn.
- The leftover `fgos-direct-repo-*` temp-dir check failed in three of six full runs during unit 26; cause not isolated.
- Suite wall 483 s against the 202 s baseline in `test/suite-baseline.json` (main on this host ran about 380 s); TEST lane.
- Review M3 and L2–L4, E4 residual gaps, Q1(b) (unit 24 report).
- E3 under a `performance` governor needs the owner (sudo).

## Rollback

Stop everything, then `fgctl upgrade --from ~/.local/state/fgos/releases/sha256:fde9e4e12b09f62b713a1fd67c542c0e86eda6f6b5b4223b764b1c3068270ea3`, restore `.fgos/distribution.json` and the configs from the backup directory, and check the hashes (`land-0530/rollback.sh`). The old release speaks lock protocol 1, so nothing of the new release may run during or after the rollback.
