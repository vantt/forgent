# herdr cockpit — keyboard/mouse focus UX (tsk-4n7)

Parent: tsk-19y (herdr-plugin cockpit). Kind: bug. Risk: light.

## Feature boundary

Fix keyboard and mouse navigation across all five boxes the herdr-plugin
cockpit TUI (`herdr-plugin/src/ui.rs`, `src/app.rs`) renders — `WorkItems`,
`InProcess`, `NeedAnswer`, `MergeList`, `AfterDeliver` — so a user can reach
every box, not just the two `Panel` currently covers, and can use the
mouse to focus a box (today mouse only works inside `detail_modal`).

Out of scope: adding real actions (merge trigger, pick, discover) to the
three currently read-only boxes — see D1.

## Scout evidence

- `Panel` enum (`app.rs:120`) has exactly two variants: `WorkItems`,
  `InProcess`. `Tab` key → `UiEvent::SwitchPanel` → `toggle_focus`
  (`app.rs:378-380`) only flips between these two.
- Separate `Tab` enum (`app.rs:64`, status columns TODO/DOING/REVIEW/DONE
  inside the WorkItems box) rotates via `]`/`[` (`ui.rs:161-162`), not the
  Tab key — same name, different keybinding, source of user confusion.
- `draw_need_answer_box`, `draw_merge_list_box`, `draw_after_deliver_box`
  (`ui.rs:367-468`) render static `Paragraph`s from `app.need_answer` /
  `app.merge_list` / `app.after_deliver`. None of these three have a
  selection-index field — only `App.selected` (WorkItems, `app.rs:143`)
  and `App.in_process_selected` (InProcess, `app.rs:147`) exist. No Enter
  action, no click handling for any of the three today.
- Mouse handling (`ui.rs:112-129`) only fires when `Event::Mouse` is a
  left-click AND `app.detail_modal_open` is true, hit-testing
  `pick_button_rect`/`discover_button_rect`. Any click outside that
  condition is a no-op — clicking a box border, a row, anywhere else on
  the cockpit does nothing.
- On-screen hint text: exactly one line exists today, "In process — Tab
  to focus, Enter to jump" (`ui.rs:318`). No hint mentions `]`/`[`, no
  hint states the other three boxes are unreachable by keyboard, no hint
  mentions mouse.
- Spatial layout (`ui.rs:169-290`): left column = WorkItems (60% width);
  right column, top to bottom = InProcess, NeedAnswer, MergeList,
  AfterDeliver (30/24/23/23%). This top-to-bottom, left-to-right order
  already matches the natural Tab-cycle order — no separate ordering
  decision needed.
- Impact-analysis posture (CLAUDE.md gate): `fgos tool query
  --capability impact-analysis --status present` → gitnexus registered,
  `status: present`, freshly checked this session → **full**. Planning's
  verify/test scope should run real `impact`/`detect_changes` checks
  against `toggle_focus`, `Panel`, and the new mouse click-handling code.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | NeedAnswer/MergeList/AfterDeliver, once reachable via Tab/Shift+Tab or mouse click, get border-highlight-on-focus and Up/Down scroll only (when their list overflows the box height). No row-select state, no Enter action, no click-on-item action is added to these three boxes in this item's scope — they stay view-only. Rationale: none of the three carries any selection state today, and adding a real action (especially on a MergeList `ready` row) risks a keypress/click accidentally triggering something that reads as a merge trigger. User confirmed this scope explicitly over the two richer alternatives (jump-on-select like InProcess, or reusing detail_modal) as the safer, smaller cut. |

## Pinned terms

- **Box** = one of the five bordered TUI panes: WorkItems, InProcess,
  NeedAnswer, MergeList, AfterDeliver.
- **Focus** = which box currently receives Up/Down/Enter keyboard input
  and shows the bold-cyan highlighted border (`focused_border_style`,
  `ui.rs:182`).
- **Panel** (code term, `app.rs:120` enum) — scope of this item's keyboard
  work is to widen this enum (or its equivalent) to cover all five boxes;
  the exact enum shape (new variants vs. restructuring) is planning's call.

## Deferred to planning (implementation-only, not product decisions)

- Whether to literally add 3 new `Panel` variants or restructure focus
  tracking (e.g. an index into a fixed box list) — implementation shape.
- Renaming the existing `Tab` enum (status columns) to something else (e.g.
  `Column`) to stop colliding in name with the Tab *key* — naming choice,
  no product-visible behavior change beyond fixing the on-screen hint text
  (which IS in scope, see feature boundary).
- Shift+Tab feasibility: crossterm exposes `KeyCode::BackTab` for the
  standard terminal Shift+Tab sequence; no kitty-protocol enhancement flags
  are enabled in this codebase today (`rg BackTab|kitty` found nothing) —
  planning should confirm `BackTab` arrives reliably through whatever
  terminal/multiplexer herdr panes actually run under before committing to
  it as the reverse-cycle key.
- Exact click hit-testing mechanics for "click box = focus" (per-box `Rect`
  bookkeeping, mirroring how `pick_button_rect`/`discover_button_rect`
  already work) and "click item = select" for WorkItems/InProcess (hit-test
  row Y against the box's currently rendered `Table` rows) — implementation.
- On-screen hint text content/placement for the expanded keybinding set
  (Tab/Shift+Tab, `]`/`[`, mouse) — wording is planning/implementation, but
  the requirement that it must list all of these (not just the current
  single "In process" line) is locked as part of this item's feature
  boundary above.

## Outstanding questions

None — scope is locked. No open questions deferred to planning beyond the
implementation-shape items listed above.
