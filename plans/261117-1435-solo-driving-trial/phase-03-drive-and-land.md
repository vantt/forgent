---
phase: 3
title: "Drive and land"
status: pending
blockedBy: [phase-2, owner-Q2]
effort: 3h
owner: HARDEN (supervisor, lands) + leader subagent per item
---

# Phase 3: drive and land

## Owner question Q2: the whole-tree gate

- **What is happening:** `fgos workflow propose` refuses `gate-command-missing` while
  `runner.capabilities.code:implement.verify` is unset here (`current: null`).
- **Cause:** the case's last step runs this command on the whole tree; this repo never declared one.
- **Options and cost:**
  - A. `cargo test --workspace` (default for Rust-only items): minutes, matches `p-2r54ft6njh`.
  - B. `npm test && cargo test --workspace`: the full L5 proof, long and heavy; duplicates HARDEN's land gate.
  - C. Set it per item and unset after the trial.
- **Recommendation:** A, set at project level with `--reason "solo driving trial"`; HARDEN's land gate stays the full
  suite. Unset after the trial unless the owner keeps it.
- **Scope of the answer:** this project's gate key only; global config untouched.

## Steps (per item, in order)

1. **Supervisor tick** (HARDEN, level 0, by hand): read the item plan frontmatter; drift check
   `git rev-list --count <base>..origin/main -- <footprint>`; > 0 returns it to the planner. Otherwise give the leader
   its brief. `fgos metrics case open <item-slug> --harness cook-plan`. Note the hand-over time (lead-time start).
2. **Leader** (one short subagent, `fgos-cook`, brief: plan path, "propose, start, one solo run per slice, verify,
   report, no merge, no plan-status edits"):
   - slice list, `fgos workflow propose --slices S.json --plan <item plan.md> --worktree <wt> --branch
     trial/<item-slug>-impl --base <full sha of the plan commit> --json`; the printed question goes to the owner via
     HARDEN (frame approval = one intervention, kind gate);
   - run the printed commands from their JSON `argv`: `worktree create`, `workflow start`, `judge`, `validate`;
   - one `fgos run --case <id> --activity <a> --pattern solo [--reason ...] [--provider <family>]` per slice; spread
     slices over claude, openai (pi or codex) and gemini (agy) where the frame allows, so each family is sampled;
   - after each slice re-run its verify and diff against declared `writes` in the case worktree; then `workflow gate`;
   - report: per slice attempts, resumes, outcome class, reason code, widened paths, contradicted claims.
3. **Watcher**: during each run, `watchdog.sh` by hand (or `fgos workflow status <case> --json`) every few minutes;
   record failure time vs detection time (detection latency).
4. **Review and land**: OPC reviews the diff (`p-2r54ft6njh` requires it; intervention kind review). HARDEN runs its
   land gate on the branch and lands it. `fgos workflow close <case>`;
   `fgos metrics case close <item-slug> --interventions <N> --verdict usable|fixed|discarded`.
5. **Record**: fill the item's `reports/measures.md` (seven measures, seat table, interventions with wait, friction
   ids); one `fgos friction record --layer <layer> ...` per friction as it happens, not at the end.

## Validation

- Item commit on main, its sha in the measure sheet; case closed; metrics case closed.
- Measure sheet has no empty measure (unknown values written as "not observable" with the reason).

## Risk

| Risk | L x I | Mitigation |
|---|---|---|
| seat hangs on a trust/hook dialog (codex, `p-24dxhwq7zr`) | M x M | watcher every few minutes; record attempts; resume via `fgos run --resume`, never a fresh seat silently |
| `deviation-limit-reached` (solo counts as deviation, 2 per case) | M x M | <= 2 slices per case or one case per phase (RUNBOOK C2); record as friction |
| worker cannot write tests/docs outside footprint | M x M | leader widens through a new proposal, counted as widened path |
| heavy cargo builds in several worktrees | L x M | items run one after the other; shared target off tmpfs |
| leader subagent dies mid-case | L x M | new leader resumes from `fgos workflow status` + cook notebook; counts as a resume |

## Rollback

Before land: `fgos worktree remove` the case worktree, delete the branch, close the case. After land: `git revert`
of the item commit through HARDEN. Gate key: `fgos config unset 'runner.capabilities.code:implement.verify'`.
