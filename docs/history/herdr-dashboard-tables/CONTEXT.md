# herdr dashboard tables — decision record

Item: `tsk-4vo` — "Herdr plugin: 2 pane hien tai (task list, in-progress
list) hien theo dang table co header. Table-header dang fix (sticky),
khong troi khi danh sach dai. Bang task (chua pick) sort theo
triage/impact. Bang task dang lam (in-progress) sort theo status cang
sap ve dich thi cang len tren. Build tren cac port/adapter cua tsk-3t9,
khong doc thang tu underlying fgos data."

## Feature boundary

Both dashboard lists render as a real column table (ratatui's `Table`
widget, header row structurally separate from the scrollable body — no
custom sticky-header logic needed, that's the widget's own behavior) with
a fixed header. "Work items" keeps its existing impact sort (already
correct, unchanged). "In process" expands its own scope (D1) and gains a
concrete tier-sort (D2).

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | "In process" list scope expands from `status: doing` only (`docs/history/herdr-fgos-tui-plugin/CONTEXT.md` D4) to also include `status: awaiting-approval`. This is a deliberate amendment to D4, not a silent override — D4's own "never herdr's own `agent_status`" rule stays intact; only the fgOS-status filter set widens. |
| D2 | Concrete sort order (resolving the description's own mixed status/stage example): **Tier A** — `status: awaiting-approval` rows, first. **Tier B** — `status: doing` rows, sub-sorted by `stage` in pipeline order: `executing` first, `decompose` next, `clarify` last (closer to `compound-learn`/done sorts higher). |

## Pinned terms

- **"Table with header"** — ratatui's `Table` widget (`ratatui::widgets::Table`/`Row`/`Cell`), not the current `List` widget. The header row is a structurally separate part of `Table` from its scrollable body, so "sticky header" is the widget's own default behavior, not custom logic to build.
- **"In process"** (redefined, D1) — an fgOS item whose `status` is `doing` **or** `awaiting-approval`. Never herdr's own `agent_status` (D4's other half stays locked).

## Scout evidence

- `herdr-plugin/src/fgos.rs:80-91` (`parse_doing`) — filters `item.status == "doing"` from `fgos list --all --json`'s full `work` map today; `DoingRow` only carries `id`/`title`, no `status`/`stage` field (D4's own comment: "always doing by definition, so no separate status field is carried here" — no longer true after D1).
- `herdr-plugin/src/ui.rs` — both lists render via `ratatui::widgets::List` today, one line per row (`"[{goal_tier}] {id} — {title}"` / `"{badge}{id} — {title}"`), no column structure.
- `herdr-plugin/src/app.rs` (post-`tsk-3t9`) — `App.refresh_from_fgos`/`refresh_pane_state` already consume data exclusively through the `WorkItemSource`/`PaneRegistry` ports (`docs/history/herdr-fgos-hexagonal-architecture/CONTEXT.md`); this item's own "build tren cac port/adapter cua tsk-3t9" constraint is already satisfied by the existing architecture — no new port needed, `DoingRow`/`WorkItemSource::fetch_doing` just needs its query/shape widened per D1.
- fgOS's own work schema (`fgos list --all --json`'s `work` map entries) already carries both `status` and `stage` per item — the fields D1/D2 need are already present in the JSON `fgos.rs` already parses from, just not yet extracted into `DoingRow`.

## Deferred (out of scope, noted not absorbed)

- Exact `Table` column set per list (e.g. `Goal Tier | ID | Title` for work
  items, `ID | Title | Status` for in-process) — implementation detail,
  `fgos-coding-planning`'s call.
- Whether `awaiting-approval` rows get their own visual marker distinct
  from `doing` rows in the table — implementation/design detail for
  planning, not decided here.
