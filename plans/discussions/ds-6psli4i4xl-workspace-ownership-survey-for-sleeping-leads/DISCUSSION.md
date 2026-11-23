---
id: ds-6psli4i4xl
title: "Which low-level component owns the workspace, worktree and git state of a run, an assignment and a session, and where a sleeping lead's workspace hold belongs"
status: open
source:
  - p-g6heszkdc7
  - p-6sd4fslxv7
created: 2026-11-23
---

discussion: open

## 1. Trạng thái hiện tại

Opened by Miu on the owner's order 2026-11-23: the owner suspects overlap even though plan `261122-0056-orchestration-skeleton` phase 6 already designs sleep and wake. Nothing is surveyed yet.

## 2. What the shaper must answer

1. Survey every low-level component that creates, tracks, protects, removes or hands over a workspace, a worktree or git state for a run, an assignment or a session: the worktree door, the git component, the run supervisor and `.fgos/assignments/<unitRunId>/`, the execution core, the session host and session-rotation records, the lead and planner worktrees of plans, and the land door's resource recovery. Use `packages/component-authority/model/components.json` as the map and read the code only to confirm what each really owns.
2. For each, say what it owns today and where two components decide or track the same thing (overlap, duplicate bookkeeping, a second remover of worktrees). Name the evidence by path and symbol.
3. Say which one component the sleeping-lead workspace hold of `p-g6heszkdc7` should extend (a sleep record names the lead's worktrees and unlanded changes; cleanup and `p-6sd4fslxv7` refuse them; waking hands them back). The sleep and wake itself stays in the orchestration skeleton plan (phase 6, `keeper.rs`); do not propose a second mechanism for it.
4. Say what is reused and what is missing (prior art rule in AGENTS.md: `git log -S` on the symbols and the executor names they had before renames), and list any overlap that deserves its own backlog row, separate from this topic.

## 3. Frame

Survey and design only: no code change, no plan. Outcome is a settled hand-off to a planner with the one owning component named, plus a list of overlaps found. Park owner questions in the question store.
