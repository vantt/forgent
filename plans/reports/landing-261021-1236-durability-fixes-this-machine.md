# Landing: Git durability fixes on the second machine

2026-10-21 12:36 (Asia/Saigon), second machine, workspace `/home/vantt/projects/forgent`. Coordinator self-landing (owner standing approval); the HARDEN session `forgent-a8` on the same machine was told before and after.

## Outcome

Release `sha256:ffe662884ca4cef59bce1368dfc6d354537ffbd1dd33efe6674852167c7ae3bd`, built from main `6d4c48a47`, active since 12:21:58. Previous release `sha256:491091a4…` (Git 07-08) stays installed for rollback (`land-0530/rollback.sh`).

What it adds over Git 07-08: Publication writes trees through the fsynced `hash-object -w` door (`a8a306a35`; `git mktree` never fsynced them) and resumes an interrupted pin release (`5d5a0de33`). Both were found and then proven by the power-cut runs ([verification](verification-261021-1202-git-e1-and-event-store-power-loss.md)). Lock protocol unchanged (2).

## Steps

1. Clean detached worktree `land-0530/wt` at `6d4c48a47`, private Cargo target, release staged (815 files, `git-wal-v1`); `fgctl` reinstalled (previous kept as `fgctl.prev`).
2. Quiet window 12:20:11 (after the TEST lead's suite run), backup to `.fgos/runtime/tmp/landing-durability-this-machine/`, `fgctl upgrade` 12:20:16-12:21:58, `.fgos/distribution.json` restored, hashes of `AGENTS.md`, `.claude/settings.json`, `CLAUDE.md` and both configs unchanged.
3. `fgos setup`: no keys added; fetch refspecs unchanged. `fgos doctor --fix`, then doctor: 145 checks, 11 not passed, all configuration or pre-existing rows (same set as the 06:06 landing, minus one); every `git-*` and `lock-*` row passes, `git-mutation-one-door` scans 939 files, `git-operation-journal` pendingCount 0.
4. Smoke: a writing `fgos run` (claude, rigor low) in a scratch worktree committed its file in 20 s; scratch worktree and branch removed.

## Note

The committed census on main was stale after the two fixes (HARDEN noticed); regenerated in `534f0fd7a`. The release build regenerates it from the payload, so the staged release was not affected.
