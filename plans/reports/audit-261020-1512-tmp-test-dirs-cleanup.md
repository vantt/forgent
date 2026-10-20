# Audit: leftover test directories in /tmp (2026-10-20)

## 1. Result

| | Before | After |
|---|---|---|
| `df -i /tmp` IUsed | 7,254,181 (24%) | 6,656,907 (22%) |
| `/tmp/fgos-*` dirs older than 120 min | 9,050 | 4 |

- Removed: 9,050 top-level `/tmp/fgos-*` directories, about 597k inodes freed (sampled estimate 609k).
- Protected set: built from `git worktree list --porcelain` and `.git/worktrees/*/gitdir` for every repo under `/home/vantt/projects/*`, plus cwd/open fds of visible processes. It contained no `/tmp/fgos-*` path, so nothing was spared on that basis. Sandboxed bash sees few host processes, so the process check is weak; the worktree check is the real guard.
- Kept:
  - `/tmp/fgos-cred-doctor-CpdGCG`: contains `source-home/auth.json`, a read-only file; `rm` failed with permission denied (no sudo, recorded and skipped).
  - `/tmp/fgos-cm-ZC7ljQ`, `-jqAwEh`, `-rwE1Vj` (13:10 to 13:12): not in the candidate list; they crossed the 120-minute mark only while the cleanup ran, so possibly live. Left alone.
  - 19 `fgos-*` entries younger than 120 min.

## 2. Groups by leaked inodes (sampled, 5 dirs per group)

All sampled dirs were git repos.

| Group | Dirs | Avg inodes/dir | Est. inodes |
|---|---|---|---|
| fgos-cli | 2614 | 79 | 206k |
| fgos-merge-test-repo | 848 | 67 | 56k |
| fgos-op-choice-test | 401 | 99 | 40k |
| fgos-dispatch-test | 691 | 50 | 35k |
| fgos-loop-test-repo | 372 | 92 | 34k |
| fgos-asgn-runresult-test | 299 | 102 | 30k |
| fgos-worktree-test-repo | 423 | 60 | 25k |
| fgos-main-checkout-lock-test | 526 | 45 | 24k |
| fgos-claim-port-test | 382 | 60 | 23k |
| fgos-cleanup-harness-test | 322 | 55 | 18k |
| fgos-tsk-sir-repro-main | 154 | 84 | 13k |
| fgos-drift-test-repo | 194 | 54 | 10k |

Total estimated about 609k inodes across about 60 prefixes. `fgos-cli-*` alone is a third; the top 5 groups are about 60%.

## 3. Follow-up

- Fix the leak at the source: the tests behind `fgos-cli-*`, `fgos-merge-test-repo-*`, `fgos-op-choice-test-*`, `fgos-dispatch-test-*` and `fgos-loop-test-repo-*` should remove their mkdtemp dirs in `after()`.
- Tests that write read-only files (cred-doctor `auth.json`) must chmod before cleanup.
- The 7.2M IUsed total is far above these 609k, so most inode use lies elsewhere (not investigated).
