---
title: "WORK lane facts: trial merge of the parked Event Store phase 09 work against main 8a4df0f8e"
date: 2026-10-22 10:42 (Asia/Saigon)
author: WORK lane lead (this machine), facts only, no product code edited
base: origin/main 8a4df0f8e
inputs: plan-refresh-261021-1215-work-lane-es-09-11.md, review-261020-1110-es-p09-write-path.md and review-261020-1110-es-p09-readers-triggers.md (both only on origin/es/p09-cutover)
---

# WORK lane facts: trial merge against main 8a4df0f8e

The parked work has two branches, not one. The plan refresh of 10-21 already started the per-family port on a local branch, and that branch merges with today's main with one conflict. The write-path defect H1 (three machines break every Work command) is still open on both branches.

## 1. Two branches hold the parked work

| Branch | Tip | Base | Content | On origin? |
|---|---|---|---|---|
| `es/p09-cutover` | `03c5186c7` | `83ad16aca` (10-20) | Full phase 09: 9 commits, 163 files, +4718/−6772. The tip `03c5186c7` holds partial review-A fixes and both review reports. | yes |
| `work/es-cutover` | `cbd6c92de` | `6d4c48a47` (10-21) | The plan refresh (`2341502d3`) plus a WIP port of unit U1 (Work gate core): 57 files, +1776/−1154. Worktree `.claude/worktrees/work-es`. | **no, local only** |

## 2. Trial merges (no worktree touched, `git merge-tree --write-tree`)

- **`es/p09-cutover` against main: 41 conflicted files** (38 on 10-21). The three new ones are `src/state/store.mjs`, `test/state/runtime-coordination.test.mjs` and `test/state/hot-lock-known-exec-sites.test.mjs`; main changed them for the process-facts door (`8339c7259`, `205f8a584`) and SEAT. The other conflicts are the same families as in the plan refresh §1.1: Git 07's `merge.mjs`/`driver.rs`, the store layer that main re-implemented, the four modify/delete pairs of the truncation-guard and compaction modules and their tests, and setup tests.
- **`work/es-cutover` against main: 1 conflicted file**, `test/state/hot-lock-known-exec-sites.test.mjs`. Since its base, main changed only two of its files: `src/state/hot-lock.mjs` (+22/−73, HARDEN's process-facts door) and `src/runner/loop.mjs` (+10/−5, SEAT). Both auto-merge, but `hot-lock.mjs` overlaps the U1 staging hunks in meaning (the mutex liveness code moved to the native door), so the merge needs a semantic check, not only a clean text merge.

**Decision (inside the approved frame): continue from `work/es-cutover`.** Rebase it onto main, resolve the one conflict, check `hot-lock.mjs` by hand, then finish U1 and go on with U2–U8 as the plan refresh orders them. Re-porting `es/p09-cutover` again would redo the U1 work and reopen 41 conflicts whose store-layer halves main already superseded. Reverse this only if the semantic check shows the U1 staging depends on hot-lock code that main deleted.

## 3. What main now supersedes (do not replay)

The plan refresh §1.1 table still holds (narrow maintenance facts, cursor reuse, `branchKey()`, the hook's ACRT rule, the door scanner, store latency, store proof items, `project:<name>`, the npm `fgos init` refusal). New since 10-21:

- **Process facts and durable files** live in one native in-process door (`8339c7259`, `205f8a584`). Anything the p09 branch does with `/proc`, liveness or atomic writes inside `hot-lock.mjs` or `store.mjs` must use that door.
- **SEAT config format** (`3133ed474`, `c79818ff2`). The runner config shape changed, so any p09 test fixture that writes a runner config must use the SEAT shape.
- **Git durability and T0** (Git 07–08 landed on both machines; H16 `git-fence-missing` on main `96dd8fb29`). U6's Git-side deletion of `legacyEvents` targets that code.
- **H18 is not done yet.** `checkStopped` and `workspaceListing` still live in `src/holder-lock/fences.mjs`; HARDEN moves them next to `src/verbs/events/migrate.mjs` when T1 deletes the fence module. WORK checks the result then.

## 4. H1 status: open

- **Defect** (review A H1, `src/state/replay.mjs`): the reducer throws `work-replay-precondition` when a precondition fails against an event the writer had seen. With three origins, a late unseen event can change whether a seen event applied, so a legitimate history throws, and because the fold is deterministic every Work verb on every clone fails.
- **`work/es-cutover`:** carries the pre-review reducer; the throw is unchanged.
- **`es/p09-cutover` tip `03c5186c7`:** a partial fix that throws only when every origin seen so far equals the event's own origin, and otherwise records a conflict. There is no 3-origin vector test yet, and the fix also strips `precondition` from folded payloads (review A M3, half done).
- **Plan:** U2 lands the fix with the 3-origin cascade vector in `test/event-store/work-conflicts.test.mjs` as its owning proof, identical on three clones.

## 5. Open items carried into the lane

- **Q-W1 (npm addon) is superseded.** The owner put "retire the npm install channel (M10)" into ES 11. With no npm channel there is no npm addon to wait for; spec §23.2 item 9 gets a dated note that the npm clause was removed with the channel. Recorded here as decided inside the frame.
- **Q-W2 (porting view tracked or not) is still open.** It blocks U3. Sent to the owner.
- **M3 automatic release sweep** (doctor reports retained Land candidates; the sweep needs Work's acknowledgement reader `work-decision:<id>:<seq>`). A new mechanism, so it goes to the owner as a proposal once the acknowledgement reader exists on the branch (after U4), before any code.
- **H22 and H23 from HARDEN T1** sit in the WORK row: H22 (the hot mutex writes its own record once per process) is a feature idea and stays in the owner list; H23 (three lines in `withStateTx`'s `finally` so `hot-lock-release-stuck` does not overwrite the callback's result) is a defect fix and goes into U2.
- **Impact analysis:** to rerun per unit (`fgos tool query --capability impact-analysis --status present`).

## Unresolved

- Q-W2, as above.
- The quiet window for the first full gate run on the rebased branch (ask TEST and HARDEN).
