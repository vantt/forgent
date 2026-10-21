# Landing: Git durability fixes with HARDEN T0, second machine

Landed 2026-10-22 00:21 (Asia/Saigon) in workspace `/home/vantt/projects/forgent`. This was a coordinator self-landing under the owner's standing approval. TEST (`forgent-f8`) and HARDEN (`forgent-a8`) held their runs for the window.

## Outcome

Release `sha256:9e4c2630f82082ec7baa0e3e5c5060dae82fd3b871c13bbddbc506ab253fd351` is active since 00:21:35. It was built from main `9670da5ff`, 816 files, with `git-wal-v1` present. The previous release `sha256:613dfa84…` (HARDEN T0, active since 22:06) stays installed for rollback, through `land-0530/rollback.sh`.

What it adds over `613dfa84…`:
- The `git-land-recovery` doctor row works again (`406a81f98`). It now passes with "no retained Land candidate".
- ScopedCommit stages its objects with `core.fsync=loose-object`. Empty or corrupt objects that already exist are healed, or refused with `object-file-corrupt` (`4aa17103c`).
- Event Store errors carry Git's exit status and stderr (`43f3b9993`).
- The test-harness lock waits (`9dd82f35c`) and the private mount namespace for the root fixtures (`b36a8e6ad`) are not runtime changes.

E1 held on this code family: see [verification](verification-261021-2336-git-e1-publication-and-scoped-commit.md). The clean E3 rerun is in [this report](verification-261022-0005-git-e3-clean-rerun.md).

## Steps and checks

1. **Build and stage.**
   - Clean detached worktree `land-0530/wt` at `9670da5ff`, private Cargo target on ext4.
   - `cargo build --release --workspace`, then the distribution build.
   - `fgctl` reinstalled; the previous one is kept as `fgctl.prev`.
   - `fgctl stage`.
2. **Activation.**
   - The quiet window opened at 00:19:45, when the stop check found no fgOS process and no open file under `.fgos` or the state root.
   - Backup to `.fgos/runtime/tmp/landing-261022-git-durability-t0/`.
   - `fgctl upgrade` ran from 00:19:50 to 00:21:35.
   - `.fgos/distribution.json` was restored.
   - The hashes of `AGENTS.md`, `.claude/settings.json`, `CLAUDE.md` and both configs are unchanged.
3. **Setup and doctor.**
   - `fgos doctor --fix`: exit 0.
   - `fgos setup`: no keys added, and the fetch refspecs are unchanged.
   - `fgos doctor`: 145 checks, 11 not passed. All 11 are configuration rows or rows that failed before this landing (model tiers, skills for the codex CLI, tool registry, one old stuck attempt, docs, executor profile, accounts, codex trust). `active-release-matches-checkout` reports 2 changed payload files, because the main checkout is not pulled; it holds another session's edits.
   - Every `git-*` and `lock-*` row passes, including `process-containment` (bwrap-pidns), `git-operation-journal` (pendingCount 0), `git-land-recovery` and `git-mutation-one-door` (945 files).
4. **Smoke.**
   - Gateway `start`, `status` and `stop`: reachable, and the record now carries the identity tuple.
   - `lock fence gateway --yes`: free, nothing signalled.
   - A writing `fgos run` (claude, rigor low) in a scratch worktree committed `docs/smoke-land.txt` through ScopedCommit (`committed`). The worktree and branch were removed.
   - Two smoke attempts before it failed, both outside this release's changes:
     - **Gemini:** the executor was stopped with `terminal:foreground-not-agent` before any Git step. Reported to HARDEN to check against T0's terminal and process judgement.
     - **Root-level file:** the pre-commit hook's root allowlist refused it, as intended. ScopedCommit answered `commit-rejected` and HEAD was unchanged.

## Open

- **Gemini smoke failure.** `terminal:foreground-not-agent` needs an owner: HARDEN, or the terminal lane.
- **E3 push variance.** A debugger is investigating; see [the E3 rerun](verification-261022-0005-git-e3-clean-rerun.md).
