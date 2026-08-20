# task-spec: fgos-fanout

domain: core | role: orchestrator | capability: wave-dispatch | requires-skill: fgos-fanout

## Input
- `parentId` — already-decomposed parent item ID.
- `candidateIds` — candidate child item IDs (or milestone targets).

## Output
- Wave schedule calculated via `computeSchedule(view, candidateIds)`.
- Dispatched Agents running `/fgOS:pick <id>` (up to 5 per batch, slot-gated via `fgos slots`).
- Auto-approved leaf items (`fgos approve <id>`) that reach `awaiting-approval` (except those tripping risk-keyword floor `HEAVY_KEYWORDS`).
- Final status report of all candidate child items.

## Gates
- Soft: Batch size trimmed to `min(5, execution.free)` (or `min(5, batch.length)` when `execution.free` is `null`). Candidate dispatch protocol consult (`decide --work <id>`) before dispatch. Skill-layer self-recovery on worktree-isolation races via `EnterWorktree`.
- Hard: Auto-approves leaves only; parent item gate (`parentId`) is NEVER auto-approved by fanout. Leaves tripping risk keywords escalate to human.

## Verify-template
- Every child item's own `verify` command must run green during its pick/return cycle.

## Collaboration

| Trigger | Call | To | Reason | Bóng về mang |
|---|---|---|---|---|
| Candidate ready for in-process dispatch | dispatch-agent (sync) | worker agent | pick-task | returned leaf item state |
| Leaf reaches awaiting-approval & trips risk keywords | escalate (async) | human | risk-review | approval decision |
| Leaf reaches awaiting-approval & clean | auto-approve (sync) | merge engine | approve | merged branch |
| No trigger matches | — dispatch next ready wave — | | | |
