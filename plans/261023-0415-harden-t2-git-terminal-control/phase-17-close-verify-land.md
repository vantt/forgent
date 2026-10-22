---
phase: 17
title: "Close: independent verify, re-measure against R2, land on both machines (D8 census in the guide), rollback, closing report"
status: pending
depends_on: [09]
parallel: "none; last (after every conditional phase the owner said yes to before this phase starts)"
effort: ~1d plus the owner's landing slot
net_size: "Node 0 / Rust 0 / tests 0"
---

# Phase 17 — Close

## Context

Parent loop steps 6–9; owner decisions 1 (stop-everything landing) and 7 (the second machine self-lands in a quiet window; the owner machine follows a guide at a time the owner picks); memory rules for this machine (self-land own lanes once gates pass; pull and read the board first; record every hand-off; owner-machine guide in Vietnamese linked on the board). Format model: T1's [phase 7](../261022-0851-harden-t1-holder-lock-identity-door/phase-07-close-verify-land.md). [plan.md](plan.md) Rollback and D-T2-8.

## Requirements

### Independent verify

- Fresh clone of `harden/t2-git-terminal-control` at `/home/vantt/projects/forgent-worktrees/t2-verify`, `CARGO_TARGET_DIR=/home/vantt/projects/forgent-worktrees/t2-verify-target` (ext4), with `FGOS_SESSION_ID`, `CODEX_THREAD_ID`, `CLAUDE_CODE_SESSION_ID`, `FGOS_STATE_ROOT`, `FGOS_HOST_BIN` unset: `cargo build --locked --release --workspace`, `cargo test --workspace`, `cargo clippy --workspace --all-targets -- -D warnings`, `cargo fmt --check`, `npm test`. Every `run-tests: ERROR` line is grepped and pasted (leak and clone checks count); each failing file re-run alone with the one-file command; reds compared with the parent plan's known-red list and the census diff.
- The Git crash matrices green: `cargo test -p fgos-git --test land_crash_matrix --test recovery_matrix --test publication`, `wal.rs` crash and compaction cases.
- Gates 1–9 of the proposal re-checked by the big lead with a source each; every arbitration §3/§4 item mapped to fixed (owning proof named, green) / not reproduced (phase 1 evidence) / kept by evidence (phase 5 digest, phase 8 census, D-T2-9) in the closing report's table.
- Δ table, HARDEN commits only (`git log --numstat <merge-base>..harden/t2-git-terminal-control -- src bin scripts packages apps test`; Rust tests and inline test modules counted as tests; JSON contracts shown apart), next to each phase estimate, against the ceilings: Node ≤ −120, Rust ≤ 0, tests ≤ 0, layer ≤ −120. A missed ceiling blocks the close until a fold pays or the owner accepts (decision template).

### Re-measure (same machine and load class as the speed seat; `/proc/loadavg` beside each figure)

- Port worktree add p50 and per-add fsync and contained-child counts (speed seat `add-bench.mjs` shape on ext4 scratch; was 184 ms, 25 fsync, 19 children); expected children ≤ 14; fsync unchanged unless phase 10 ran.
- Read-only `inspectGit` on this checkout's WAL after compaction (was 28.5 ms at 322 chains).
- `fgos doctor --json` wall time on this checkout (was 72.8 s; most of it is T5's seat-binding rows — report the Git and terminal rows' window).
- One terminal `capabilities` op through the host (was 8.7 ms p50) and the herdr invocation count per op.
- `test/runner/worktree-admin-multiprocess.test.mjs` wall time (TEST W2 trigger, H29) → ping TEST (`forgent-f8`) with the figure.

### Landing

1. Pull and read the board's owner-machine lines; rebase the track branch on main; re-run the focused files of phases touching shared files (registrations, git-checks, scoped_commit, driver) if main moved; merge with one merge commit (the revert target); then, **only if both censuses allowed them**, merge phase 8's census-gated branch as a second merge commit (its own revert target, D-T2-8); `npm run build` → `fgctl stage`; record the digest. <!-- Updated: Red Team 2026-10-23 -->
2. **This machine** (self-land; quiet window): tell OPC (`forgent-35`), TEST (`forgent-f8`), WORK (`forgent-cd`) and any session holding a lane on this machine; confirm nothing fgOS runs and no file under `.fgos` or the state root is open; back up `.fgos/distribution.json`, both `config.json` files (global mode 600), refspecs and instruction hashes to `.fgos/runtime/tmp/landing-harden-t2-here/`; run the D8 census (phase 8 command) once more and paste it; run the current release's `fgos doctor` and save it; `fgctl upgrade`; restore `distribution.json`; `fgctl verify`; `fgos doctor --fix`; `fgos setup`; `fgos doctor` — expect: the 6 Git rows and 2 terminal rows (phase 7), `git-operation-journal` passing, no `terminal-config`/`git-transport-config`/`git-trust-topology`/`git-durability-capability`/`git-publication-refspecs`/`git-land-recovery` **check** ids, `terminal-control` passing its config rules (a sub-floor config is refused now: fix it before activation).
   Smoke: `fgos dispatch decide --for t2-smoke --needs-soul --has-live-task-access`; `fgos identity mint work --json` (no network); a read-only `fgos run`; a writing `fgos run` on a scratch linked worktree committed through ScopedCommit (worktree add, scoped commit, worktree remove → then confirm the WAL operations directory count did not grow past the recent tail); `git commit` in the main checkout through the hook; `fgos gateway start/status/stop`. Landing report at `fgos convention name --type landing --slug harden-t2-this-machine`.
3. **Owner machine** (three workspaces: forgentX, mdview, mcp-skill-hub): a guide **in Vietnamese** at `fgos convention name --type guide --slug harden-t2-owner-machine-landing`, modelled on [the T1 owner-machine guide](../reports/guide-261022-2003-harden-t1-owner-machine-landing.md), with as hard steps, per workspace, inside the quiet window and **before** activation:
   - (a) the **D8 census** (phase 8 command, read-only) re-run as a confirmation of the answer given before phase 8 merged, pasted; every printed WAL marked scratch or real; a real WAL with `legacyScopedOrSync` or `ledgerV1` or `unreadable` ≠ 0 **stops** the landing on that workspace and is reported to the big lead, who reverts only the census-gated merge commit and builds a new release;
   - (a2) an `ssh://user@host` origin whose Event Store mirror reports `remote URL changed; rerun setup`: run `fgos setup` once (CHANGELOG);
   - (b) the current release's `fgos doctor` row `terminal-config` must pass (a value it fails becomes a runtime refusal after T2);
   - (c) the note that building from main brings every lane merged after T2 (list the merges present at writing time);
   - (d) T0's canonical corpus check stays mandatory (owner decision 7 lineage);
   - then the same activation, doctor expectations and smoke as this machine, and a short report back. The guide is linked on the board's owner-machine line in the same turn.

### Rollback (both machines)

Stop everything; `fgctl upgrade --from ~/.local/state/fgos/releases/<previous digest>` (this machine today: `sha256:a424fc0f0c431ebd85b882c44dcb923184f814e64292a717e89fe718a95c691d`, re-read `.fgos/installation/activation.json` at landing time; owner machine: the digest the guide records); restore `.fgos/distribution.json` and both `config.json` files from the landing backup folder; on main `git revert -m 1 <T2 merge sha>` only before T3 merges (after that, roll forward); record the revert SHA on the board. On-disk effects the previous release must read (plan.md Rollback): compacted Worktree/Refs ledger v2 receipts (read since 10-19; a Refs same-id replay of a compacted id answers `operation-recovery-required`, fail-closed); no digest change unless byte-identical; terminal group hint files no longer written (old release writes, never reads them).

### Closing

- Closing report at `fgos convention name --type closing --slug harden-t2-git-terminal-control`: before/after table; Δ table and ceilings; arbitration items with owning proofs; doctor table 10+3 → 6+2; what was reused (Publication's remote door, `wal.compact`, `fgos_process::control::{spawn_with_fds,exit_descriptor}`, `fgos_durable_file::sync_directories`, `createDoctorRun` if used) and what was deleted; folds "not paid"; kept-on-purpose list; test-cost totals (`node scripts/test-proof-inventory.mjs --cli-cost`); conditional phases run / not run with the owner's answers.
- Updates the same turn: the D-T2-9 note to the owner (F-C3 kept by evidence) and the Process-door input (CF10 residual) on the board; parent plan phase 03 row and its "Received from other lanes"; hand-off ledger rows H25–H29 re-checked, plus the new T5 input (D-T2-7 grace rule) and the WORK follow-ups (checkpoint delete if not done in phase 5; `createDoctorRun` hand-through if phase 7 used the fallback); the board's HARDEN row and one `log.md` line; IDENT told (sequence home signature, CF08/CF09); DOC told (phase 9 files).
- T3's council opens only after this close.

## Files

**Create**: the landing report, the Vietnamese guide, the closing report (names from `fgos convention name`). **Modify**: `plans/261021-1118-harden-low-layers-bottom-up/{plan.md,phase-03-t2-git-terminal-control.md}`, `plans/261017-1313-fgos-platform-program-board/{plan.md,log.md}` (own row and one log line only), `.fgos/installation/activation.json` (by `fgctl`). **Delete**: none. **Tests to retire**: none.

## Steps

1. Verify; fix regressions on the track branch, never by weakening a test.
2. Re-measure; write the before/after table.
3. Merge; build; land here; landing report.
4. Guide; board and plan updates; closing report; messages to OPC, TEST, WORK, IDENT, DOC, MAIL.

## Verification (exact)

- `npm test` and `cargo test --workspace` green on the fresh clone with every `run-tests: ERROR` line accounted for.
- `fgos doctor --json` on the activated release here lists the 6 Git and 2 terminal rows; `fgos --version` names the new digest; `git commit` in this checkout succeeds through the hook; the scratch `fgos run --writes` round-trip succeeds.
- The closing report's Δ table meets the ceilings.

## Net size

0 / 0 / 0.

## Test-cost line

Suite totals before and after T2 from `node scripts/test-proof-inventory.mjs --cli-cost`, pasted in the closing report.

## Risks

| Risk | L × I | Mitigation |
|---|---|---|
| Another lane merges between verify and merge | M × M | Rebase right before the merge; focused re-runs |
| The owner machine holds a legacy chain the census finds | L × M | Guide stops; census-gated commits reverted; new release |
| A sub-floor terminal config on a workspace | L × M | Guide step (b) |
| A hidden `run-tests: ERROR` passes unread | M × M | Grep and paste every line |

## Rollback

The block above.

## Done when

Landed here with its report; the guide delivered and linked; the closing report linked from the parent phase 03 with the layer marked closed; ledger rows updated; T3 may open.
