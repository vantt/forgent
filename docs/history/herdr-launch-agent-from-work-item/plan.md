# herdr launch-agent from unstarted work item — plan

Item: `tsk-67u`. Decisions: `docs/history/herdr-launch-agent-from-work-item/CONTEXT.md` (D1).

## Mode

**tiny.** 0 flags apply (no new code, no touched behavior beyond
confirming what already exists) — D1 already found the item's entire
described outcome delivered by `tsk-19y-3`+`tsk-1q3`.

## Approach

No implementation. Confirm the existing chain
(`main.rs`'s `Panel::WorkItems` → `pane_orchestrator.open_pick_pane` →
`pick::open_pick_pane` → `layout::place_new_agent_pane`) still compiles
and its tests still pass — the same proof surface every other item in
this family already uses.

## Split

None — nothing to split.

## Verify

```
cd herdr-plugin && cargo test
```
