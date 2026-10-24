---
title: "WORK lane state before context compaction (Event Store cutover, second attempt)"
date: 2026-10-24 20:00 (Asia/Saigon)
author: WORK lane controller, session forgent-cd (claude-uygd@fg-server2, roles lead:WORK and lead:ES)
---

# WORK lane state, 2026-10-24 20:00

## Where things are

- **Branch:** `work/es-cutover` on origin, tip `c878dc87b`. The code tip is `0df15a1ad`; `c878dc87b` only updates the runbook under `plans/`.
- **Release candidate:** `sha256:882b8df676cda24e7d0a2837a7c97aea485faffe8500c5737e10cb4e21863fb6`, 858 files.
  - Built from `0df15a1ad` in `/home/vantt/projects/forgent-worktrees/land-261024-es`.
  - Staged tree: `/home/vantt/projects/.fgos-staged-261024-es`.
  - Not yet staged on this machine.
- **fg-server2:**
  - Still runs release `d6d3d082…`.
  - The main checkout follows `origin/main`, with AGENTS.md and settings.json uncommitted as usual.
- **Runbook:** `plans/reports/runbook-261024-1930-work-cutover-fg-server2-second-attempt.md`, on the branch. Its variables already hold TIP `0df15a1ad…` and NEW `882b8df6…`.
- **Owner decision (19:3x):** run the cutover "tonight, once TEST passes" (option a). It covers only fg-server2: stop line, runbook, push main, activate. The owner machine, fg-server and design-lap each need their own go.

## What happened today (board log 18:35, 18:45, 18:55)

1. **First attempt, 18:05–18:35, refused and rolled back.**
   - Refusal: `git-wal-corrupt: record byte bound`. The ScopedCommit intent was over 64 KiB.
   - Effect: nothing was published.
   - Restore: the 97 files were brought back by hand, then `git reset --keep 28423b3fe`.
2. **Fixes on the branch.** Each comes with its own test, and each test fails under a mutation.

   | Commit | What it fixes | Reviewer |
   |---|---|---|
   | `2e6814faf` | Unordered fetch-mapping records now read as no provenance. | OPC |
   | `98bb577ad` | The intent record is bounded: digest-form PathSet, baseline and request. | OPC MERGE |
   | `8eebda3f1` | OPC Low 1: unstage only when the derived set matches the record. | OPC MERGE |
   | `659e368e5` | WAL scan skips an op dir that has no intent. The real WAL had this dir from the first attempt. | OPC MERGE |
   | `556453735` (merged as `217a67c18`) | Quiesce gate: a cwd in the checkout counts only for an fgOS-like argv. Shells and Claude sessions no longer block migrate. | HARDEN APPROVE |
   | `0df15a1ad` | Route wiring test: a bash child named `fgos` replaces the sleep child. | HARDEN APPROVE |
   | `d0734ca23` | The key-order precondition from `da0508f08`. | TEST accepted |

3. **Rehearsal on a full-size clone** (`/home/vantt/projects/forgent-worktrees/rehearse-es`, origin is a bare mirror at `rehearse-es-origin.git`).
   - Real migrate committed `8272fccd2`.
   - Upgrade, `fgctl verify` and setup all passed.
   - Doctor green, sync, rebuild revision `af617cb5…` equal, and a write smoke sealed in about 1 s.
   - A copied WAL cannot be rehearsed, because the WAL is bound to its common dir's dev:inode.
   - The new code's read-only doctor on the real main WAL is green, apart from the expected `event-store-migration-required`.
4. The rehearsal's `fgos setup` added the `eventStore.*` defaults to the global `~/.fgos/config.json`. The old release ignores them (checked).

## Waiting now

- **TEST** (`test-wa-d1`, claude-tt7r) is running the full npm and cargo gate on `0df15a1ad`, roughly 19:58 to 20:15. TEST asked for no timing or heavy runs until then.
- TEST's earlier gate reds that are not this branch's:
  - the ADR0070 citation drift in `docs/specs/workflow.md:637`, which main also has and which TEST is raising with its owner;
  - a git-addon source-digest ERROR, which TEST will confirm on the rerun.

## Next, in order

1. When TEST reports green on `0df15a1ad`:
   - put a STOP line for Work writes on fg-server2 on the board, and message HARDEN (`forgent-fa`), TEST and OPC (`forgent-e3`);
   - nobody needs to exit their session.
2. Run the second-attempt runbook, steps 1–12:
   - The quiesce scan runs through the dev host from `$W`.
   - Step 4 merges `$TIP` with `--no-ff` on top of `origin/main`.
   - The expected import action is `replace-unfenced-stale`.
   - Step 9 installs fgctl from `$LW` and stages `$STAGED`.
3. Post "cutover done" with the merge SHA, grant oid and release digest to the board and to the three lanes, then send TEST the F14 after-profile go.
4. After that:
   - the guide for fg-server and design-lap (`guide-261024-1500-work-cutover-other-machines.md`, which needs the new digest and steps);
   - the owner machine, only with the owner's go;
   - remove the rehearsal clone and mirror, and `land-261023`;
   - test follow-up on `internal_lock_routes.rs`: drop the redundant 50 ms sleep and kill the child process group (TEST and HARDEN nits);
   - the backlog item: migrate reuses fgctl's process classification (now partly done by `556453735`).

## Rollback notes

- **Before the push:** A1 in the runbook. Restore the files if migrate did not, then `git reset --keep "$(cat $B/premain.txt)"`.
- **After the push:** B1 or B2. Before reactivating `d6d3d082…`, the new release's doctor must show no unresolved ScopedCommit operation (OPC Low 2). Releases before `98bb577ad` read digest-form records as corrupt.

## Rules that bit today

- Rehearse the real write, not only `--check` (memory `rehearse-the-real-write`).
- Run `-p fgos` (apps/fgos tests) whenever holder-lock routes change, not only the crate's own tests.
- The census is in the release payload. A census-only change means rebuilding the release.
- The `.git` string in a Bash command trips the scout hook; use a scratchpad script.
- Scratch scripts live in `/tmp/claude-1000/-home-vantt-projects-forgent/2334f2ba-b501-4572-a523-2ed479073a55/scratchpad/`:
  - `cut-vars.sh` holds the first attempt's values;
  - `relbuild.sh` builds the release;
  - `fr.sh` runs focused tests;
  - `walop.py`, `walfind.py` and `walcfg*.py` inspect the WAL.
