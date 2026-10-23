---
title: "WORK lane state before context compaction (Event Store 09-11)"
date: 2026-10-23 11:18 (Asia/Saigon)
author: WORK lane controller, session forgent-cd on fg-server2
---

# WORK lane state, 2026-10-23 11:18

## Where things are

- **Branch:** `work/es-cutover` on origin, tip `00c065295` before wave 1.
- **Worktree:** `/home/vantt/projects/forgent/.claude/worktrees/work-es`.
- **Other worktrees:**
  - `/home/vantt/projects/forgent-worktrees/work-es-u4`, a second worktree for parallel leads. The branches it has held (`work/es-u4`, `work/es-revb`, `work/es-gitfix`) are all merged.
  - `/home/vantt/projects/forgent-worktrees/work-board`, a detached worktree for board commits to main. Run `git checkout --detach origin/main` before each edit.
  - `/home/vantt/projects/forgent-worktrees/land-261023` is the build worktree of the 10-23 landing. Its removal was refused (ignored bytes); it is safe to delete.
- **Cargo target:** `/home/vantt/projects/forgent-worktrees/work-es-target`.
- **Scratch scripts:** `/tmp/claude-1000/-home-vantt-projects-forgent/2334f2ba-b501-4572-a523-2ed479073a55/scratchpad/`.
  - `cb.sh` builds the release.
  - `fr.sh`/`fr.mjs` run focused tests and refuse an empty list.
  - `diag-*.sh` count git spawns.
- **This machine:** `fg-server2`, which runs release `c91242ea…` (main `199d85223`) since 2026-10-23 08:57. The landing report is `landing-261023-0847-main-release-fg-server2.md`.

## Done on the branch

| Item | State |
|---|---|
| Phase 09 units: gate core, review fixes incl. 3-machine H1, porting stream, readers, triggers and Land, Land release sweep, porting duplicate add, legacy-duty deletion, removals and `events` verbs | done |
| Main with T1 merged | `c8ec81e23` |
| Two opus reviews | write path, and readers/triggers/removals; all findings fixed (`ae23ac134`) |
| Git-area diffs | OPC approved all: `790616298`, `4e566bc6d`, `feeafe643`, `64f9163b3`, `711107171` |
| Branch proofs | V-AUTH-01 4/4, settle 2/2, `cargo test --workspace` 1312/0, door green |

Unit reports are `plans/reports/phase-lead-26102{2,3}-*-work-*.md`. The reviews are `review-261022-2033-*`, the proofs `verification-261022-2203-*` and the diagnosis `debug-261022-2316-*`, all on the branch.

## Running now

- **Wave 1, batched Event Store reads.** A sonnet lead, agent id `aad77bde4e1ebb2ed`, works in the `work-es` worktree.
  - It first merges origin/main.
  - Then it makes one `cat-file --batch` per walk page in `packages/git/rust/src/driver.rs` `read_paths_at`.
  - It drops `cat-file -t` and memoises the HEAD/fence probe in `packages/event-store/rust/src/{walk,fence,read}.rs`.
  - Its owning test: a walk uses a bounded number of git processes.
  - It must not touch the driver error ladders at ~:860, :2151, :2202, :2430, :2450 or :3414, or `list_refs`, because HARDEN's T2 is changing them.
  - Its report goes to `plans/reports/phase-lead-261023-1112-work-event-store-batched-reads.md`. The Git-side commit goes to OPC for review.

## Next, in order

1. **Wave 2.** A verified cross-process checkpoint per spec §15: a rebuildable cache, so a command reads only sealed commits after it. With it, move the inline seal off `move`'s hot path and make opportunistic sync only try the seal lock. Update spec §15. OPC reviews the Git and store parts.
2. **Full gate again.** Run it in a quiet slot agreed with HARDEN, TEST and OPC. `loop.test.mjs` must fit 600 s, so `npm test` is green. Rerun the part (a) bench. Read the mutex hold, p95 65–77 ms, against the 50 ms target.
3. **Phase 10 proof gate.**
   - Spec §23.2 items 1–13.
   - The mandatory equivalence check on real data of forgent, mdview and mcp-skill-hub: Work state, dep-graph, frontier and dashboards identical before and after migrate.
   - The `holder-lock-cross-platform` workflow green.
   - Docs: `docs/specs/work-state.md`. That includes the conflict handling: no resolve verb; `fgos show` and doctor `work-recorded-conflicts`, and people redo the change with existing verbs.
   - Spec item 9 gets a dated note that the npm channel is retired.
4. **Phase 11 cutover.** On fg-server2, agree the slot with HARDEN (see below). The owner machine needs the owner's go. Retire the npm channel (M10).
5. **Before landing,** merge main again and regenerate the census and suite baseline with the tools, per TEST.

## Owner decisions recorded (board log and plan refresh report)

- Q-W2 (b): the porting view is untracked.
- Q-W1 is superseded, since the npm channel is retired.
- M3 Land release sweep runs only at the end of the 4 Land verbs.
- `porting.add` duplicate: the fold keeps the first add.
- OPC reviews other lanes' Git diffs.
- Conflicts get no resolve verb.
- Read cost: option (b), WORK does the store part in two waves.
- WORK and HARDEN set landing times on fg-server2 themselves:
  - T2 lands when ready and gives a ~20 min window notice;
  - WORK's cutover may go first if ready before T2;
  - the owner machine needs the owner.
- Idea list (not scheduled): H22, full porting conflicts, a conflict resolve verb.

## Rules that bit

- Never touch the main checkout `~/projects/forgent`.
  - Its `AGENTS.md` got a 367-line AGENTKIT-OMP block at 10-23 03:46, not from WORK; reported to the owner.
- No full suite without a quiet window.
- Leads use sonnet. No kongming/opus unless the plan says so; the two U8 reviews were opus.
- Census and suite baseline are regenerated with the tools, never by hand.
- Peers on this machine:
  - HARDEN `forgent-a8`, message it at `uds:/run/user/1000/cc-socks/2329277.sock`;
  - TEST `forgent-f8`;
  - OPC `forgent-35`, the Git reviewer.
