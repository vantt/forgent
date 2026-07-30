# herdr launch-agent from unstarted work item — decision record

Item: `tsk-67u` — "Herdr plugin: click/enter vao task item ben danh sach
task (left panel, task chua co pane chay) se goi chuc nang bat-agent dung
chung tsk-1q3 ... dat pane vao dung tab/slot theo layout manager".

## Feature boundary

Already fully delivered by the combination of two already-merged items —
no new code needed.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | This item's entire described behavior already exists: `main.rs`'s `UiEvent::Pick` handler for `Panel::WorkItems` (`herdr-plugin/src/main.rs`, the `Panel::WorkItems => { ... pane_orchestrator.open_pick_pane(id) ... }` arm) already calls the shared launch-agent function `tsk-1q3` built (`pick::open_pick_pane`, via the `PaneOrchestrator` port) — new pane, `--dangerously-skip-permissions` by default, `/fgOS:pick <task-id>` prompt, layout-manager tab/slot placement (`layout::place_new_agent_pane`). No refactor or new wiring is required. |

## Scout evidence

- `herdr-plugin/src/main.rs` — `Panel::WorkItems` branch of the `Pick`
  event arm calls `pane_orchestrator.open_pick_pane(id)` (built by
  `tsk-19y-3`, upgraded in place by `tsk-1q3` to the shared, layout-aware
  shape) — the exact call chain this item asks for.
- `herdr-plugin/src/pick.rs::open_pick_pane` — confirmed (via
  `docs/history/herdr-shared-launch-agent/CONTEXT.md`/`plan.md`, `tsk-1q3`)
  to default `--dangerously-skip-permissions` on and place the new pane
  through `layout::place_new_agent_pane`'s `fg:agents-N` tab/slot logic.
- `docs/history/herdr-jump-to-running-pane/CONTEXT.md` (`tsk-1eu`) —
  confirms `Panel::WorkItems` is exactly the "task chưa có pane chạy"
  (left panel, not-yet-running task) panel this item names; the
  already-running case is `tsk-1eu`'s own, separate scope.

## Deferred (out of scope, noted not absorbed)

- None — this item's own scope is fully covered by existing, already-done
  work; nothing is deferred because nothing new is being built.
