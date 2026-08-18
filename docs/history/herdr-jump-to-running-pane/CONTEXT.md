# herdr jump-to-running-pane — decision record

Item: `tsk-1eu` — "Herdr plugin: click/enter vao item trong list task
dang chay ma da co pane active (theo bang theo doi pane tsk-4zo) se tu
dong chuyen focus terminal sang dung pane/tab do thay vi tao pane moi".

## Feature boundary

Selecting a row in the dashboard's "In process" list (the `in_process`
panel `tsk-4zo` already populates with `InProcessTask.pane: Option<PaneIdentity>`)
and pressing Enter, when that task's `pane` is `Some(...)`, switches herdr's
focus directly to that pane — never opening a new one. A task whose `pane`
is `None` (orphaned, per `tsk-4zo` D2's badge) has nothing to jump to; this
item does not define new behavior for that case.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | A new `Tab` key switches which panel has keyboard focus — "Work items" or "In process". `Up`/`Down`/`Enter` always apply to whichever panel currently has focus. Today only "Work items" has any selection state at all; this is the mechanism that makes a row in "In process" selectable in the first place. |
| D2 | Jumping to a pane uses `herdr pane zoom <pane_id> --on` — the only herdr CLI command proven (live, this session) to deterministically focus an arbitrary existing pane id regardless of which tab it lives in. This has a real side effect: the target pane becomes full-screen within its tab, hiding its sibling panes (e.g. the other 3 in a `fg:agents-N` grid) until the person un-zooms it themselves via herdr's own existing keybinding. This item does not add an automatic un-zoom action. |

## Pinned terms

- **"Jump to pane"** — `herdr pane zoom <pane_id> --on` (D2), never
  `herdr tab focus <tab_id>` alone (proven live this session to only
  restore whichever pane was last active in that tab, not necessarily the
  target task's own pane) and never a directional `pane focus --direction`
  (relative movement only, cannot target an arbitrary id reliably).

## Scout evidence

- `herdr-plugin/src/app.rs` (current, post-`tsk-4zo`/`tsk-1q3` merge) —
  `App.selected: Option<usize>` and `select_next`/`select_previous`/
  `selected_id` all operate on `work_items` only; `in_process` carries no
  selection state of any kind today (confirms D1's gap is real).
- `herdr pane list --workspace wS` (real, run this session) — `focused`
  field per pane, used to observe focus-state changes across the tests
  below.
- `herdr tab focus wS:tE` (real, run this session, tab with 4 panes) —
  switched to tab `wS:tE` and focus landed on `wS:p1M` (whatever was
  already focused there before), **not** a specific target pane — proves
  tab-level focus alone cannot pinpoint a pane.
- `herdr pane zoom wS:p1H --on` (real, run this session) — response:
  `"focus_changed":true,"focused_pane_id":"wS:p1H"`, and the same response
  sets `"zoomed":true` on the whole tab layout — proves this is the one
  command that reliably lands focus on an arbitrary pane id, and proves
  the fullscreen side effect is real, not hypothetical. Reverted
  immediately after capture (`pane zoom wS:p1H --off`, then restored
  original focus) — no lasting change to the operator's live session.
- `herdr pane --help` (real, run this session) — full pane subcommand
  list confirms no separate "focus this exact pane id, no zoom" command
  exists anywhere in the CLI surface.
- `docs/history/herdr-dashboard-pane-tracking/CONTEXT.md` D1/D2 —
  `InProcessTask.pane: Option<PaneIdentity>` (`{pane_id, tab_id}`) is
  exactly the data this item's jump action reads; `None` = orphaned
  (already badged `[pane missing]` by `tsk-4zo`), out of scope here.

## Deferred (out of scope, noted not absorbed)

- An explicit un-zoom action/keybinding — the person's existing herdr
  keybinding already handles it; D2 only decided this item doesn't need
  to build a second one.
- Exact `UiEvent` variant name(s) and how `Tab`/panel-focus state thread
  through `App`/`ui.rs`/`main.rs` — implementation detail, `fgos-coding-planning`'s
  call.
