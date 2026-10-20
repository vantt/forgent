# Owner machine: AGENT-WF 05–09 + model pool B1 landing (with Git 05/06, ES 08 dormant)

Date 2026-10-20 08:50–09:12 (Asia/Saigon), session `forgentx-95`. Owner: "land rồi làm tiếp" (08:49). Followed [the Git 05 + ES 08 guide](guide-261019-2222-owner-machine-git-05-es-08-landing.md), whose steps are a superset of the Git 04 guide.

## What is active now

- Release `sha256:d7b89b24053a7455e65b3dfe2527a50709e750410ae20b965a588ad8d53b242e`, built from main `585044f19` in a clean detached worktree with its own Cargo dir; 782 staged files; native addon `linux-x64 8 [ 'git-wal-v1' ]`.
- Active in mdview, mcp-skill-hub and forgentX.
- New since `14439416…` (main `9a2d111b5`): AGENT-WF phases 05–09 (case model, admission port at both doors, N1, playbook auto-close, re-approval accepts changed content, coordination doctrine); model pool B1 phases 00–05 (`runner.tierFallback`, pool-keyed lease, declared account order, `pool/account` pin, `tier-cell-missing`, D-ADR0071); Git 05 and ES 08 (dormant), Git 06 and the typed-operation spawn reduction from lane GIT; B1–B7 fixes.
- `fgctl` reinstalled from the same tree (`a83ea22c…`); previous `.fgos/runtime/landing-r3/fgctl.prev`.
- Rollback target `14439416…` (still in the state root). Backups: `.fgos/runtime/landing-r3/backup/`.

## Steps as run

1. Quiesce: no fgOS process, no file open under `.fgos/` or the state root; peer `forgentx-5f` quiet. One retained pane `wS:p5Y4` of a settled, cancelled codex attempt (`unit-run-1792433414778-779b535e`, 01:10) closed.
2. Before the backup, owner 08:50: deepseek `nano`/`standard` → `deepseek/deepseek-v4.1-flash` in the mdview and mcp-skill-hub project configs (both untracked in their repos; backups in `.fgos/runtime/config-backup-261019-2315/`).
3. Old-release `doctor --fix`: none stuck, 0 held, no orphaned confinement; no predecessor records; decision index untouched this time.
4. Git identity: forgentX and mcp-skill-hub use the global identity only. mdview has a local `user.email` = the owner's GitHub noreply address, the same as every past mdview commit: deliberate, kept.
5. Build, `git-wal-v1` check, `fgctl stage`/`upgrade` in mdview → mcp-skill-hub → forgentX, `distribution.json` restored, config hashes unchanged, `fgctl verify` ok.
6. New-release `doctor --fix`, `fgos setup`: exit 0, no config keys added; fetch lines identical; `git fetch`/`git pull --ff-only` ok.
7. Doctor: every required Git, run, lock and state row passes in all three, plus `events-jsonl-not-truncated`, `decision-index-stale`, `tier-fallback`, `workflow-case-bindings`, `workflow-case-binding-sentinel`, `mutating-assignment-binding-snapshot`, and forgentX `active-release-matches-checkout`. `git-worktree-recovery` in forgentX lists only advisory issues (preserved dirty/stale checkouts, one `locked-by-live-process`) after the prune below. Other failing rows are the same owner-config set as before.
8. Dormancy: git operations dir holds only `setup` and `worktree` entries; `fgos events` is an unknown verb; `fgos list` works.
9. Smokes in forgentX, all **pass**:
   - a. claude read-only through herdr: `unit-run-1792462072592-1e6ca3f7`.
   - b. writing run in `fgos worktree create`d `.claude/worktrees/smoke-r3`: `unit-run-1792462121929-59f50590`, committed. Monitor: kernel lock held 09:08:41.9 → record (`linux-gate`) 09:08:42.6 before the agent worked → tip moved and lease released 09:08:55.5.
   - c. second writing run, same worktree: `unit-run-1792462135723-0684fa99`, admitted and committed.
   - d. Ctrl-C/resume: `unit-run-1792462160753-55530a47` SIGINT at 25 s → exit 130, `chờ resume`, attempt 01 `cancelled`; resume → `runs/02` pass, `supersedesRunId` = attempt 01; retained pane closed.
   - e. codex read-only through herdr: `unit-run-1792462272701-7b2d84f9`. The first try with `--account tetnu` was refused by the new contract ("a pinned account must be written pool/account"); `--account openai/tetnu` passed.
   - Cleanup: smoke worktree removed through the Worktree port (`removed: true`), branch deleted, build worktree removed non-force.

## Findings

- **Guide step 0 deleted three registered worktrees.** `find /tmp -maxdepth 1 -name 'fgos-*' -mmin +120 -exec rm -rf {} +` also matches `/tmp/fgos-wf-wt-*` checkouts that git still registers. Three of four (`VZJL0r`, `oswJFK`, `lO6aQi`) were gone before I stopped it; `CLeDN1` was kept. Their runs (`wf-run-1791978522232-8e97c648`, `wf-run-1792003927866-ceb23be6`, 10-15/10-16) had ended; their branches `wf/<run>/w-a|w-b` still hold the commits (1–2 ahead of main), so no commit is lost; uncommitted files in those three checkouts, if any, are lost. The three registrations were pruned with `git worktree prune` (branches kept). Fix for the guide (lane GIT): skip any path listed by `git worktree list` in every workspace, or clean only unregistered `fgos-*` dirs.
- **`--account` now needs `pool/account`.** Every brief, script and habit that pins an account by bare id must change (MP-B1 contract; message is clear).

## Next

- MP-B1 phase 06: config diff for owner approval; then 07 real rounds.
