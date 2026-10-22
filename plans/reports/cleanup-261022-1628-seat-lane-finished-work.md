# Cleanup 2026-10-22: finished seat-binding lane work

## Disk

| | Used | Free |
|---|---|---|
| Before | 394G | 52G |
| After | 362G | 83G |

Freed about 32G (sum of the sizes below: 10G + 3.2G + 9.7G + 9.1G).

## Removed

Checks per worktree: tracked changes limited to the `mutation-census.v1.json` artifact, head an ancestor of `origin/main` (fetched first), no process with cwd in it.

| Item | Size | Result |
|---|---|---|
| `.claude/worktrees/agent-ad4eeaa4ee31b5d51` + branch `worktree-agent-ad4eeaa4ee31b5d51` (1c4b02157) | 10G | removed, `branch -d` ok |
| `.claude/worktrees/agent-afee74254bd27cec6` + branch `worktree-agent-afee74254bd27cec6` (20ad88daa) | 3.2G | removed, `branch -d` ok |
| `.fgos/runtime/seat-trim-verify/` (worktree `wt`, branch `seat-trim-verify` at 0243824a9, `cargo/`, logs, scripts) | 9.7G | whole directory removed, `branch -d` ok |
| `.fgos/runtime/landing-261022b/wt` (detached b7be8795c) | in the 9.1G below | removed |
| `.fgos/runtime/landing-261022b/` scratch: `cargo/ staged/ out/ npm-test.log cargo-test.log solo.* verify.sh verify-status.txt build.sh build.log inspect-op.mjs reconcile-op.mjs fgctl-install.log up.sh` | 9.1G total with `wt` | removed |

Lead Cargo dirs: those of items 1, 2 and 4 lived inside their worktree or `seat-trim-verify/cargo` and went with them. No other lead Cargo dir was identified as clearly the seat lane's.

## Kept

- `.fgos/runtime/landing-261022b/`: `distribution.json activation.json refspecs.txt hashes.txt global-config.json fgctl.prev upgrade.log verify.log` (rollback material, verified present after removal).
- The same folder in `~/projects/mdview` and `~/projects/mcp-skill-hub`: not touched.
- `.claude/worktrees/agent-a4882797023229b84` (a lead is working there), `landing-261022/`, `config-backup-*`, `.fgos/backups/`, release dirs, other sessions' worktrees, all `.fgos` state and configs.

## Skipped

- `.claude/worktrees/agent-a5f964ace627d3e0b` (3.1G, branch `worktree-agent-a5f964ace627d3e0b`, head 178e10b31): clean and merged, but two live processes (pids 3673271 and 4024670) have it as their cwd. They are sleeping zsh wait loops (`until rg -q "^# (pass|fail)" <test log>`) started from session 937399ff (parent pid 736995), so a test run is probably still being watched. Remove it once those loops end.

## Cleanup candidates for the owner (not removed)

Clean (no changes beyond the census artifact) and head merged into `origin/main`, under `.claude/worktrees/`. These belong to other sessions or leads, so none were touched.

| Worktree | Size | Note |
|---|---|---|
| agent-ac60c98ba60f57117 | 1011M | |
| agent-abf95b28ba6601193 | 1008M | locked |
| agent-a179219426b74ff4c | 1007M | |
| agent-a9867440237cda6bf | 1007M | |
| agent-a10d4f4b965b29c24 | 261M | |
| agent-a49edb90659389932 | 260M | |
| agent-a99a004133a8920f9 | 260M | |
| agent-ad99e1f6c09176eb4 | 260M | locked |
| agent-ada3fbf1ebfc8faab | 260M | |
| agent-af99e94338e03ac3a | 259M | |
| agent-a541d4b2f0b8ff3d2 | 187M | |
| agent-ab4b49495ae73cf02 | 187M | |
| agent-a46fef542844ec6b3 | 186M | |
| agent-ae919ddc3e1064e57 | 186M | |
| agent-a5f964ace627d3e0b | 3.1G | seat lane, blocked by live processes (see Skipped) |

Together about 9.9G (3.1G of it the skipped one). Not candidates: `agent-a4882797023229b84` (head not merged, locked, in use). Also unreviewed: `.fgos/runtime/verify-target-*`, `landing-r3/r4/r5`, `landing-git01-*`, `landing-git04`, `worktree-cleanup-261020`. `landing-r5/build-wt` is still registered as a worktree.
