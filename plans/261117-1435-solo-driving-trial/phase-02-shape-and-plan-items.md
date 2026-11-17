---
phase: 2
title: "Shape and plan the items"
status: blocked
blockedBy: [phase-1b, owner-Q1]
effort: 1.5h
owner: owner (shaper) + planner subagent
---

# Phase 2: shape and plan the items

## Owner question Q1: which 1-2 items

- **What is happening:** the trial needs 1-2 small real items to drive end to end.
- **Cause:** one item is one sample; the role model must be measured on real work, not a toy.
- **Options and cost:**
  - A. `p-2r54ft6njh` only (default): eight production + three test copies of the Windows verbatim-path strip folded
    onto `fgos_process::path`, one-door guard row. Rust, mechanical, 2-4 slices, needs OPC review. Fixes a real bug
    (`agent_hooks.rs` UNC case).
  - B. A plus `p-d3vxsgz6to` items 2-4 (refresh-ahead log noise, leftover probe assignment dirs, missing reason code
    on a failing leg). Second sample, different area (runner); adds about 2h and a second landing.
  - C. Another item the owner names.
- **Recommendation:** A first; B only if A lands cleanly, run one after the other so the second item benefits from
  the first's lessons.
- **Scope of the answer:** only which items enter this trial; it does not set their priority in the backlog.

## Steps (per item)

1. **Shaper** (owner session): `fgos-coding-shaping` on the item, writing `docs/history/<feature>/DISCUSSION.md` on a
   branch `trial/<item-slug>` in a linked worktree from `origin/main`. Stop when §6 (design) and §7 (tasks) are stable
   ("plan-ready"). Skip the skill's Work-layer steps (`fgos edit --refs`, `fgos decision --id <item>`, the `fgw/<id>`
   branch, the terminal handoff into exploring/planning); record each skip as one friction
   (`fgos friction record --subject <backlog-id> --layer skill --error-class <class> --disposition <d> --producer shaper`,
   values per `fgos friction record --help`). Note session start/end times.
2. **Planner** (brief: `planner-brief-template.md`, which requires the plan contract and `plan-contract-check.mjs --plan <dir>` before `ready`; one short subagent, or `fgos run "<brief>" --pattern solo --writes <plan dir> --worktree <wt>`):
   input `DISCUSSION.md#task-*`; path from `fgos convention path --kind plan --slug <item-slug>`; `ak-plan` fast mode;
   frontmatter includes `footprint: [paths]` (code + tests + docs/CHANGELOG the repo rules require) and `base: <full
   sha>`; `status: ready` is the last edit. Commit on `trial/<item-slug>`.
3. **Supervisor check** (HARDEN): `plan-board.mjs check` against the item plan; any error returns it to the planner
   (count as a plan defect, kind `underspecified`).
4. Record in the item's `reports/measures.md` (copied from the template): shaper and planner minutes, rounds, frictions.

## Validation

- Per item: `DISCUSSION.md` §6/§7 present; item `plan.md` with `status: ready`, `footprint`, `base`; both committed
  on `trial/<item-slug>`; zero Work-layer writes (`git diff` shows no `.fgos/` work-item change).

## Risk

| Risk | L x I | Mitigation |
|---|---|---|
| shaping is overkill for a mechanical item | H x L | that is a measure, not a failure: record minutes, stop at one round if converged |
| footprint misses tests/docs (pilot: 2 of 3 slices widened) | M x M | planner lists tests, `CHANGELOG.md`, one-door census row explicitly |
| shaping skill writes Work state by habit | L x M | brief names the skipped steps; HARDEN checks the diff |

## Rollback

Delete branch `trial/<item-slug>` and its worktree; nothing landed yet.
