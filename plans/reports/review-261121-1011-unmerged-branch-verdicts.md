# Unmerged branch verdicts (2026-11-21)

Read-only review of the 88 branches `git branch --no-merged origin/main` lists (origin/main `2f611b98c`). Nothing was deleted or moved. Source list: `plans/reports/secretary-261121-1010-unmerged-branches.md`. Evidence for group A is `git cherry origin/main <branch>` (patch-id match) plus a `git log --grep` subject match where the patch differs; groups B-D were read by diff, `git log -S`/`--grep` and the board log.

Limits: the listed 88 do not include `doors/p03` or `review/unmerged-branches` (both merged or current, nothing to rule). `opc/scan-lows` was judged from its first 40 commits, the board log and the plan outcome, not patch by patch.


## Group A: already on main

| branch | last date | verdict | evidence | note |
|---|---|---|---|---|
| al/p01 | 2026-11-18 | already on main | git cherry: all 3 listed commit(s) patch-equivalent on main; e.g. 559404bb6 |  |
| al/p05-close | 2026-11-18 | already on main | git cherry: all 1 listed commit(s) patch-equivalent on main; e.g. e297409f8 |  |
| ci/cache-and-cancel | 2026-11-15 | already on main | git cherry: all 2 listed commit(s) patch-equivalent on main; e.g. ccd8a2c43 |  |
| cook/guide-rc8 | 2026-11-13 | already on main | git cherry: all 3 listed commit(s) patch-equivalent on main; e.g. 20385be0c |  |
| fix/codex-hook-trust | 2026-11-17 | already on main | 280abf684 same subject on main | rebased copy. |
| fix/main-red-1117b | 2026-11-17 | already on main | git cherry: all 2 listed commit(s) patch-equivalent on main; e.g. 98e4a5bf5 |  |
| fix/main-red-after-s4 | 2026-11-17 | already on main | git cherry: all 1 listed commit(s) patch-equivalent on main; e.g. 948d36169 |  |
| fix/reconcile-import-graph | 2026-11-17 | already on main | git cherry: all 2 listed commit(s) patch-equivalent on main; e.g. 6e846ee58 |  |
| fix/test-env-guards | 2026-11-15 | already on main | git cherry: all 2 listed commit(s) patch-equivalent on main; e.g. e610f871b |  |
| harden/ci-gc-control | 2026-11-14 | already on main | 0 commit(s) patch-equivalent; 1 reworded copy on main: 7af398194 | rebased or reworded copy; subject match, not a patch-id match |
| harden/lessons-261115 | 2026-11-15 | already on main | git cherry: all 1 listed commit(s) patch-equivalent on main; e.g. d4d59e3e9 |  |
| harden/t8-p05-source-doctrine | 2026-11-09 | already on main | 0 commit(s) patch-equivalent; 1 reworded copy on main: adb9cc204 | rebased or reworded copy; subject match, not a patch-id match |
| harden/t8-p09-distill | 2026-11-09 | already on main | 0 commit(s) patch-equivalent; 2 reworded copy on main: 63a861af4, c8325c203 | rebased or reworded copy; subject match, not a patch-id match |
| lead/secretary-caps | 2026-11-19 | already on main | git cherry: all 1 listed commit(s) patch-equivalent on main; e.g. 99b7e3e06 |  |
| mail/v8-contract | 2026-10-28 | already on main | git cherry: all 1 listed commit(s) patch-equivalent on main; e.g. 89743bb9e |  |
| mail/v9-accept-row | 2026-10-31 | already on main | 0 commit(s) patch-equivalent; 2 reworded copy on main: 9d1c80e34, d9ef03fb5 | rebased or reworded copy; subject match, not a patch-id match |
| plan/secretary-session-spine | 2026-11-17 | already on main | git cherry: all 5 listed commit(s) patch-equivalent on main; e.g. 894e3947b |  |
| plan/solo-driving-trial | 2026-11-17 | already on main | git cherry: all 1 listed commit(s) patch-equivalent on main; e.g.  |  |
| research/agent-sandbox-survey | 2026-11-13 | already on main | git cherry: all 1 listed commit(s) patch-equivalent on main; e.g. c28cf7ad3 |  |
| research/windows-runtime-support | 2026-11-13 | already on main | git cherry: all 2 listed commit(s) patch-equivalent on main; e.g. c12b72b7e |  |
| s6/fix-refresh-live-token | 2026-11-19 | already on main | 0 commit(s) patch-equivalent; 1 reworded copy on main: 0a0ac5fb7 | rebased or reworded copy; subject match, not a patch-id match |
| s6/p00 | 2026-11-19 | already on main | git cherry: all 1 listed commit(s) patch-equivalent on main; e.g. c690e0ae0 |  |
| s6/p03 | 2026-11-19 | already on main | git cherry: all 5 listed commit(s) patch-equivalent on main; e.g. 0c44e4bd7 |  |
| s6/p06b | 2026-11-19 | already on main | 2 commit(s) patch-equivalent; 1 reworded copy on main: 7bf6c94e2 | rebased or reworded copy; subject match, not a patch-id match; census regeneration, regenerated again since |
| s6/p10-sqlite | 2026-11-19 | already on main | git cherry: all 2 listed commit(s) patch-equivalent on main; e.g. bd1979504 |  |
| s6/p11b | 2026-11-19 | already on main | 5 commit(s) patch-equivalent; 1 reworded copy on main: 7bf6c94e2 | rebased or reworded copy; subject match, not a patch-id match; census regeneration, regenerated again since |
| s6/p12 | 2026-11-19 | already on main | git cherry: all 7 listed commit(s) patch-equivalent on main; e.g. 8194277c0 |  |
| shape/secretary-supervisor-powers | 2026-11-19 | already on main | docs/discussions/secretary-supervisor-powers/DISCUSSION.md identical on main; landed as squash 33b3d040e | 18 patches squashed into one commit. |
| shape/supervisor-review-2 | 2026-11-19 | already on main | docs/discussions/supervisor-review/ identical on main (SR-D6..SR-D10 present); squash d0fcd1ee2 | 13 patches squashed. |
| shape/work-data-model | 2026-11-19 | already on main | docs/discussions/work-data-model/DISCUSSION.md matches main (1-line diff); decision landed 9aaf712f8; backlog 0b4656861 | D-ADR0082 landed. |
| sv/fix-asker-restart-timer-drift | 2026-11-19 | already on main | git cherry: all 1 listed commit(s) patch-equivalent on main; e.g. b91c1436e |  |
| sv/fix-confined-ritual | 2026-11-19 | already on main | git cherry: all 2 listed commit(s) patch-equivalent on main; e.g. ab7b42088 |  |
| sv/fix-dead-writer-recover | 2026-11-19 | already on main | 1 commit(s) patch-equivalent; 1 reworded copy on main: 9d8e1c241 | rebased or reworded copy; subject match, not a patch-id match |
| sv/fix-land-cleanup | 2026-11-19 | already on main | git cherry: all 2 listed commit(s) patch-equivalent on main; e.g. 5d9e0b27a |  |
| sv/fix-land-dirty | 2026-11-19 | already on main | 0 commit(s) patch-equivalent; 1 reworded copy on main: 2a4da5a87 | rebased or reworded copy; subject match, not a patch-id match |
| sv/fix-land-regenerate-reader | 2026-11-19 | already on main | git cherry: all 1 listed commit(s) patch-equivalent on main; e.g. e2d37914a |  |
| sv/fix-lanewait | 2026-11-19 | already on main | git cherry: all 1 listed commit(s) patch-equivalent on main; e.g. 2dbabb340 |  |
| sv/fix-lead-worktree | 2026-11-19 | already on main | 0 commit(s) patch-equivalent; 1 reworded copy on main: a0ea47319 | rebased or reworded copy; subject match, not a patch-id match |
| sv/fix-question-answered-ts | 2026-11-19 | already on main | git cherry: all 2 listed commit(s) patch-equivalent on main; e.g. fc1133eb7 |  |
| sv/fix-retained-chains | 2026-11-19 | already on main | 1 commit(s) patch-equivalent; 1 reworded copy on main: dac00201a | rebased or reworded copy; subject match, not a patch-id match |
| sv/fix-run-argv | 2026-11-19 | already on main | git cherry: all 1 listed commit(s) patch-equivalent on main; e.g. 530050e8e |  |
| sv/fix-supervisor-done | 2026-11-19 | already on main | git cherry: all 3 listed commit(s) patch-equivalent on main; e.g. c9712e7ef |  |
| sv/fix-supervisor-reads | 2026-11-19 | already on main | git cherry: all 2 listed commit(s) patch-equivalent on main; e.g. e2e514341 |  |
| sv/fix-ticket-detail | 2026-11-19 | already on main | 0 commit(s) patch-equivalent; 1 reworded copy on main: 1f481e8e2 | rebased or reworded copy; subject match, not a patch-id match |
| sv/fix-woken-head-opening | 2026-11-19 | already on main | git cherry: all 1 listed commit(s) patch-equivalent on main; e.g. 9aa914260 |  |
| sv/fix-write-stale-base | 2026-11-19 | already on main | git cherry: all 1 listed commit(s) patch-equivalent on main; e.g. 47f875427 |  |
| sv/p01 | 2026-11-18 | already on main | git cherry: all 3 listed commit(s) patch-equivalent on main; e.g. be413c27f |  |
| sv/p02 | 2026-11-18 | already on main | git cherry: all 2 listed commit(s) patch-equivalent on main; e.g. a27331b10 |  |
| sv/p03 | 2026-11-18 | already on main | 1 commit(s) patch-equivalent; 2 reworded copy on main: 1da20c583, cbfd2d83a | rebased or reworded copy; subject match, not a patch-id match |
| sv/p04 | 2026-11-18 | already on main | 0 commit(s) patch-equivalent; 1 reworded copy on main: a750637d3 | rebased or reworded copy; subject match, not a patch-id match |
| sv/p05 | 2026-11-18 | already on main | 0 commit(s) patch-equivalent; 1 reworded copy on main: bdc9e4251 | rebased or reworded copy; subject match, not a patch-id match; census regeneration, regenerated again since |
| sv/p06 | 2026-11-18 | already on main | 1 commit(s) patch-equivalent; 1 reworded copy on main: e030632ca | rebased or reworded copy; subject match, not a patch-id match |
| sv/p06b | 2026-11-18 | already on main | 0 commit(s) patch-equivalent; 1 reworded copy on main: 52af20744 | rebased or reworded copy; subject match, not a patch-id match |
| sv/p07 | 2026-11-18 | already on main | git cherry: all 5 listed commit(s) patch-equivalent on main; e.g. 10d4fde14 |  |
| sv/p07a | 2026-11-18 | already on main | 1 commit(s) patch-equivalent; 1 reworded copy on main: 5f6992daa | rebased or reworded copy; subject match, not a patch-id match |
| sv/p07a2 | 2026-11-18 | already on main | 0 commit(s) patch-equivalent; 2 reworded copy on main: 5b302e61c, e66ae4488 | rebased or reworded copy; subject match, not a patch-id match |
| sv/p07c | 2026-11-18 | already on main | git cherry: all 1 listed commit(s) patch-equivalent on main; e.g. 60259e989 |  |
| sv/p08 | 2026-11-18 | already on main | git cherry: all 2 listed commit(s) patch-equivalent on main; e.g. 374e18eb3 |  |
| sv/p09 | 2026-11-19 | already on main | git cherry: all 3 listed commit(s) patch-equivalent on main; e.g. 6e4047a93 |  |
| sv/p10 | 2026-11-19 | already on main | 4 commit(s) patch-equivalent; 1 reworded copy on main: 92570dd85 | rebased or reworded copy; subject match, not a patch-id match; census regeneration, regenerated again since |
| sv/p11 | 2026-11-18 | already on main | git cherry: all 2 listed commit(s) patch-equivalent on main; e.g. 4c0336ae8 |  |
| sv/p11b | 2026-11-18 | already on main | git cherry: all 1 listed commit(s) patch-equivalent on main; e.g. f1c4b12c2 |  |
| sv/p12 | 2026-11-19 | already on main | git cherry: all 3 listed commit(s) patch-equivalent on main; e.g. 6c4d3d265 |  |
| sv/p13 | 2026-11-18 | already on main | git cherry: all 2 listed commit(s) patch-equivalent on main; e.g. 527a3951a |  |
| sv/p13b | 2026-11-18 | already on main | git cherry: all 2 listed commit(s) patch-equivalent on main; e.g. da797e9a5 |  |
| sv/p14 | 2026-11-18 | already on main | git cherry: all 5 listed commit(s) patch-equivalent on main; e.g. 6e2d6fa74 |  |
| sv/p14a | 2026-11-18 | already on main | 1 commit(s) patch-equivalent; 1 reworded copy on main: 5a77a9a50 | rebased or reworded copy; subject match, not a patch-id match; census regeneration, regenerated again since |
| sv/p15 | 2026-11-18 | already on main | 2 commit(s) patch-equivalent; 3 reworded copy on main: 138a77ef1, 23a719399, 9ce96ea39 | rebased or reworded copy; subject match, not a patch-id match |
| sv/p19 | 2026-11-19 | already on main | git cherry: all 2 listed commit(s) patch-equivalent on main; e.g. 2367372d2 |  |
| test/es-seal-cuts | 2026-11-06 | already on main | git cherry: all 1 listed commit(s) patch-equivalent on main; e.g. dbcb6cc74 |  |
| trial/plan-contract | 2026-11-17 | already on main | git cherry: all 3 listed commit(s) patch-equivalent on main; e.g. ab8ebdfd5 |  |
| trial/shaper-workfree | 2026-11-17 | already on main | 0 commit(s) patch-equivalent; 3 reworded copy on main: 3fdcedd82, 6d90c52f6, a6f22e0f6 | rebased or reworded copy; subject match, not a patch-id match |
| v7-invocation-names-fix | 2026-11-17 | already on main | 4 commit(s) patch-equivalent; 1 reworded copy on main: 7d744361c | rebased or reworded copy; subject match, not a patch-id match |

## Group B: superseded

| branch | last date | verdict | evidence | note |
|---|---|---|---|---|
| backup/main-checkout-20261118 | 2026-11-18 | superseded | docs files identical to main (account-lease-secretary DISCUSSION/QUESTIONS, handoff ledger, lessons); T9 plan is on main (plans/261118-1818-harden-t9-leftovers); config binding replaced by main .fgos/config.yaml (secretary tier standard + pool claude-miu, owner 2026-11-21) | A backup ref of the main checkout. The 7 'unique' patches are the same content rebased or replaced; nothing found missing. |
| cook/zombie-land | 2026-11-14 | superseded | same two fixes as mail/live-confined-zombie (c8f9d23 = 27b40f5, 3dcebbc = 063ec30); diff of the test file is smaller | Land mail/live-confined-zombie instead; this branch is the earlier copy. |
| execution-read-door/parity-runner | 2026-11-17 | superseded | main carries the protocol 2 route (227eedcfe, 500df8421); parity table removed again by f77056065 ('leaves main again'); branch name says the runner lives on a side branch | 8 unique patches incl. protocol 2 route are replaced by the main route commits; parity runner was deliberately kept off main. |
| opc/scan-lows | 2026-10-26 | superseded | board log 1099: readConfig scanner Low landed efb42baec; main scripts/git-one-door-scan.mjs has the template-literal handling; the documentation-unification program closed on main (f2e99b64e, 9d62b93a1) | 1444 commits on a stale 2026-10-26 base; the 1321 'unique' patches are squash-landed history (first 40 sampled: unification phase 00-02 docs and fixes). Not read patch by patch; judged by log and plan outcome. |
| work/es-ab-head | 2026-10-23 | superseded | board log 1519: throwaway A/B measurement branch (B) against harden/head-in-tip-listing (A, merged 12c76f572) | Measurement draft with a census regen; the census is regenerated on main since. |
| work/es-ab-t2 | 2026-10-23 | superseded | board log 1548: draft A/B branch (es-dedupe + T2 + es-cutover), 542 s vs track T2 292 s; zero unique patches | Experiment finished; its patches are on main. |

## Group C: real work to land

| branch | last date | verdict | evidence | note |
|---|---|---|---|---|
| mail/frame-reword-remeasure-plan | 2026-11-17 | real work to land | commit 7b335fc67 adds plan.md + 2 phase files; main has no plans/261117-0831-* | Plan is status pending. The three files are copied onto this change unchanged. Delivery work (zombie fix, frame reword) is still open. |
| mail/live-confined-zombie | 2026-11-14 | real work to land | 27b40f563 + 063ec3059 not on main: grep of origin/main scripts/lib/mailbox-live-confined.mjs finds no zombie skip in processesOfRun; board log line 461 says MERGE but cherry shows both patches unique | Belongs to plan 261117-0831-mail-frame-reword-remeasure phase 01 (harness door, zombie stage A). Risk: harness/test only (4 files, census line). Superset of cook/zombie-land (more test). |
| research/rust-verb-migration | 2026-11-14 | real work to land | commit 442388dc9; report absent on main; board log 216/359 treat the Rust verb migration as the S-program | Finished research report, copied onto this change unchanged. No code risk. |
| research/three-layer-vision-gap | 2026-11-14 | real work to land | commit 68551ddc1; report absent on main; board log line 464 records the three-layer direction | Finished research report, copied onto this change unchanged. No code risk. |

## Group D: keep (open reason)

| branch | last date | verdict | evidence | note |
|---|---|---|---|---|
| harden/t2-p08-census-slices | 2026-11-09 | keep | board log 680: prepared, NOT merged; merges only after owner machine and fg-server both read census zero (guide plans/reports/guide-261109-0943-owner-machine-t2-census-slices.md) | Open reason: owner-machine census reading. Drops the legacy compact-receipt reader (wal.rs v1) which main still has (wal.rs:1413 Compacted). Risk: data-loss if any repo still holds ledger v1. |

## Group E: live lanes (no verdict)

| branch | last date | verdict | evidence | note |
|---|---|---|---|---|
| s6/p19c-2 | 2026-11-21 | live lane | live lane: 9 commits, Rust run route flip (plan 261118-1341-s6a-execution-tier-rust) | left alone |
| s6/p19c-run | 2026-11-21 | live lane | live lane: feat(run) route to the host | left alone |
| s6/p19c-win | 2026-11-21 | live lane | live lane: Windows cwd lease channel | left alone |
| work-data-model/p03b | 2026-11-21 | live lane | live lane: work-data-model phase 3b (plan parked on owner questions, HEAD 2f611b98c) | left alone |

## Counts

- Group A: already on main: 73
- Group B: superseded: 6
- Group C: real work to land: 4
- Group D: keep (open reason): 1
- Group E: live lanes (no verdict): 4
- Total: 88
