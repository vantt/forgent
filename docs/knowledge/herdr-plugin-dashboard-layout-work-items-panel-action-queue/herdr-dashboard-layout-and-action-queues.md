---
framework: diataxis
mode: reference
---
# herdr-plugin dashboard layout: work-items panel + action-queue boxes

`tsk-1d5` redesigned herdr-plugin's TUI (`herdr-plugin/src/ui.rs`) from a
2-pane Work-items/In-process split into a left "browse all work" panel
plus a right "action queues" panel of 3 separate boxes. This is the
locked layout spec for that redesign.

## Left panel: Work Items

- **Tabs**: `TODO` / `DOING` / `REVIEW` / `DONE` — filtered client-side
  over one `fgos triage --json --all` response; no separate CLI call per
  tab.
- **Columns**, in order: `ID`, `Tier`, `Priority`, `Status`, `Stage`,
  `Blocked By`, `Blocks`, `Title`.
- **Row order**: `priority` field, ascending — smaller number is higher
  priority (`priority-formula.mjs`'s inverted scale, `computePriority` =
  `impact × weight(urgency) / effort × risk-discount`, wired at
  `resolveDiscovery`/`resolveDecompose`). This replaces `rankImpact`'s
  own default order (tier → blocks desc → component size) for display
  purposes.
- **`DONE` tab** also includes `wontfix` (canceled) items, not just the
  `delivered`/`retrospective`/`cleanup`/`done` tail chain.
- **Filter/search**: `/` key activates a one-line search that expands at
  the bottom, overlaying the status bar; `Esc` cancels, `Enter` applies;
  hidden by default. Applies to the Work Items panel only — it never
  filters the 3 right-side boxes.

## Right panel: 3 separate action-queue boxes

Never merged into one table — always 3 distinct bordered boxes:

| Box | Membership | Source |
|---|---|---|
| `NEED ANSWER` | `status: blocked` (`parkReason: system-error`) ∪ `status: awaiting-human` (`parkReason: human-question`) | `fgos list --all --json`, filtered by literal `status` — the tail chain has no `statusCategory` entry |
| `MERGE LIST` | exact result shape of `fgos merge list --json` (`ready`/`waiting`/`conflicts`/`mergeSets`/`blockedOnSync`/`mergeTier`/`supersededOut`) | mapped straight through, no separately-invented filter |
| `AFTER DELIVER` | `status: retrospective` ∪ `status: cleanup` | the two actionable steps of the `delivered`→`retrospective`→`cleanup`→`done` chain |

`parse_doing` (`herdr-plugin/src/fgos.rs:116-132`, prior to this item)
only kept items with `parkReason` absent/`natural-finish` AND
`statusCategory` in-progress/review — i.e. only `doing` +
`awaiting-approval`. It excluded `blocked`/`awaiting-human`/
`retrospective`/`cleanup` entirely, which is why `NEED ANSWER` and
`AFTER DELIVER` needed new fetch/filter logic rather than reusing
`parse_doing`.

## Detail modal

Exactly 2 fixed action buttons: **Pick**, **Discover**. `Discover` is
disabled/dimmed — never hidden, so the layout never shifts — when the
selected item's `stage != clarify`.

### Implementation (`tsk-1e3`): dim, not hidden

`Pick` keeps the existing `Reversed` style convention already used for
an active button (`ui.rs:230`). `Discover` uses that same style when
enabled, and switches to dim/gray (`Style::default().add_modifier(
Modifier::DIM)` or `Color::DarkGray`) when the selected item's stage
isn't `clarify` — a color change only, never a layout change or hiding
the button, matching D4's "disabled, never hidden" rule exactly.
Confirmed shipped as real code:
`detail_modal_renders_pick_and_discover_buttons` and
`discover_button_disabled_when_stage_not_clarify`
(`herdr-plugin/src/ui.rs`).

## Mouse support

Real mouse handling added: `EnableMouseCapture`/`DisableMouseCapture` on
terminal init/teardown, plus `Event::Mouse` handling inside `poll_event`
(previously `poll_event` matched only `Event::Key` — `ui.rs:71` silently
dropped every mouse event). Button hit-testing needs each frame's
rendered `Rect`s for Pick/Discover stored on `App`, since `draw()` was a
pure render function with no persisted layout before this item.

### Implementation (`tsk-40t`): mouse wiring, no new color/style

Confirmed feasible against the actual pinned dependency
(`crossterm 0.29.0`, `Cargo.lock`) before implementation: `event.rs:318`
has a real `EnableMouseCapture`, `event.rs:558` a real
`Event::Mouse(MouseEvent)`, and `event.rs:777-786` a real
`MouseEvent { kind, column, row, modifiers }` — not a hoped-for API.
Depended on `tsk-1e3` (the Pick/Discover buttons had to exist first for
their `Rect`s to be hit-testable). Pure interaction wiring — no new
color or style introduced here. Confirmed shipped as real code: a real
`mouse_click_inside_pick_button_rect_fires_pick` test
(`herdr-plugin/src/main.rs`), plus `EnableMouseCapture` and
`Event::Mouse` both present in `herdr-plugin/src/ui.rs`.

## Pane-jump behavior

`Enter` → live herdr pane (the existing jump-to-pane behavior) applies to
`DOING`-tab rows in the left panel. `NEED ANSWER` box rows open the
detail view only — no direct pane jump, even though a
`blocked`/`awaiting-human` item may still have a live pane running.

## Framework choice: stay on ratatui

Explicitly evaluated and rejected migrating to `frankentui`
(`Dicklesworthstone/frankentui`: 258 stars, single author, ~6 months old,
pre-1.0, `license: NOASSERTION` — checked via `gh api`). Visual/color
reference instead comes from real, active ratatui-ecosystem apps:
`beads_viewer`, `taskwarrior-tui`, `gitui`, `bottom`.

## Palette (child item `tsk-jo1`)

ANSI-16 named `ratatui::style::Color` variants only (`Cyan`/`Red`/
`Green`/`Yellow`/`Magenta`/`DarkGray`/etc.) — no `Color::Rgb` truecolor.
Every existing color use in `herdr-plugin/src/ui.rs` before this item was
already a named ANSI variant, never `Color::Rgb`, so there was no
truecolor precedent to extend. Reason: portability — `Color::Rgb`
truecolor is not guaranteed to render correctly over every path this
plugin runs on, including `herdr --remote`'s SSH thin-client path, where
the terminal doing the actual rendering may be further from the process
than a direct local session. ANSI-16 degrades safely everywhere;
truecolor does not.

## Implementation (`tsk-64z`): Work Items panel color-coding, guidance not hard-lock

The child item that actually built the Work Items panel (tabs + 7-column
table, D1/D2/D7/D8 above — a `Stage` column was added later, `tsk-4cxl`)
added Status-column color-coding as *guidance*,
explicitly not a hard-locked spec the way the layout decisions above are:

| Status | Color |
|---|---|
| `todo` | default (no special color) |
| `doing` | yellow — reuses the existing convention already in `herdr-plugin/src/ui.rs:155`, not a new color choice |
| `blocked` / `awaiting-human` | dark red |
| `awaiting-approval` | green |
| `delivered` / `retrospective` / `cleanup` / `done` / `wontfix` | dim/gray |

Still ANSI-16 only, per the palette rule above (`tsk-jo1`). Confirmed
shipped as real code, not just decided: `herdr-plugin/src/fgos.rs`
(`triage_row_carries_status_stage_blocked_by_blocks_priority`),
`herdr-plugin/src/app.rs` (`work_items_sorted_by_priority_ascending`),
and `herdr-plugin/src/ui.rs`
(`work_items_panel_renders_four_tabs_todo_doing_review_done`) — real,
named `cargo test` functions, not just a design note.

## Implementation (`tsk-417`): right-side box tags

The child item that built the 3 right-side boxes (D3/D9 above) resolved
the "left deliberately open" question below about `NEED ANSWER`'s two
sub-reasons — they get distinct bracketed text tags, not just distinct
row text:

| Box | Tag | Color | Meaning |
|---|---|---|---|
| `NEED ANSWER` | `[ERR]` | dark red | `status: blocked`, `parkReason: system-error` |
| `NEED ANSWER` | `[ASK]` | magenta | `status: awaiting-human`, `parkReason: human-question` |
| `MERGE LIST` | `[MRG]` | green | no sub-tag needed — one meaning per row |
| `AFTER DELIVER` | `[RTR]` | cyan | `status: retrospective` |
| `AFTER DELIVER` | `[POL]` | dim/gray | `status: cleanup` — deliberately the lowest-priority visual weight, matching `AGENTS.md`'s own Polish-Sau-DoD product-priority ordering (`docs/decisions/0025`) |

Tags use square-bracket text (`[ERR]`, `[ASK]`, etc.), never emoji —
terminal column width for emoji isn't consistent across terminals, which
would break table alignment.

Confirmed shipped as real code: `herdr-plugin/src/fgos.rs`
(`fetch_need_answer_includes_blocked_and_awaiting_human`,
`fetch_merge_list_mirrors_fgos_merge_list_json`,
`fetch_after_deliver_includes_retrospective_and_cleanup`) and
`herdr-plugin/src/ui.rs` (`process_status_renders_three_separate_boxes`)
— real, named `cargo test` functions.

## Bug fix (`tsk-1pg`): `NEED ANSWER`/`AFTER DELIVER` boxes were always empty on real data

Found against real data, not a synthetic case: `WorkItemRaw.stage`
(`herdr-plugin/src/fgos.rs`) was a required field, but real items exist
without a `stage` field at all (e.g. `tsk-mvp-test-1`, `status:
wontfix`) — parsing the full `fgos list --all --json` output crashed on
any such item, which silently emptied both `NEED ANSWER` and
`AFTER DELIVER`. A second, compounding bug: `refresh_from_fgos` fetches
each box's data in sequence and overwrites a single shared `last_error`
field — since `fetch_merge_list` runs last, a successful `MERGE LIST`
fetch silently wiped out any error `parse_need_answer`/
`parse_after_deliver` had already recorded, so even the crash above left
no visible error in the status bar.

Fixed: `stage` changed to `Option<String>` in `WorkItemRaw`, defaulting
the same way the JS engine already does (`item.stage ?? 'executing'`).
`refresh_from_fgos` changed so a later successful source can no longer
overwrite an earlier source's already-recorded `last_error` — first
error wins, not last fetch. Verified against real data: `node
bin/fgos.mjs list --all --json --dir .` confirmed `tsk-mvp-test-1` has
no `stage` field and that `parse_need_answer`/`parse_after_deliver` were
returning `Err missing field stage` before the fix. Confirmed shipped as
real code: `need_answer_survives_missing_stage` and
`last_error_first_error_wins` (`herdr-plugin/src/fgos.rs`), plus a real
`cargo build --release`.

## Origin (`tsk-4n7`): the bug report behind `tsk-3wl`/`tsk-bvh`

The keyboard/mouse work below (`tsk-3wl`, `tsk-bvh`) traces back to one
bug report naming three separate real problems: `Tab` only toggled
between the Work Items/In Process panels while the 3 right-side boxes had
no focusable variant at all; the status-column `Tab` enum
(`TODO`/`DOING`/`REVIEW`/`DONE`, rotated by `]`/`[`) shared a name with
the `Tab` key despite using different keys, causing confusion; and mouse
handling was scoped to `detail_modal` only, so the pre-existing on-screen
hint claiming "mouse works" was misleading outside the modal:

> "Tab chỉ toggle giữa 2 panel (WorkItems/InProcess), 3 box khác
> (need-answer, merge-list, after-deliver) không có Panel variant nên
> không focus được bằng bàn phím. Tab enum (cột trạng thái
> TODO/DOING/REVIEW/DONE) rotate bằng phím ']'/'[' chứ không phải phím
> Tab — trùng tên gây nhầm lẫn. Mouse chỉ bắt sự kiện trong detail_modal
> ... ngoài modal click vô hiệu."
> — real work item description, id `tsk-4n7`

The report itself proposed splitting into two child pieces during
planning — `tsk-3wl` (keyboard-focus-expansion) and `tsk-bvh`
(mouse-click-to-focus) below are exactly that split, not an independent
design choice made later.

The discovery gate's own second-pass verify check (see
`docs/explanation/judge-verdict-second-pass-semantic-check.md`) disputed
this item's first two proposed `verify` commands before accepting a
third — the first was undetermined ("chưa xác định"), the second merely
asserted the existing suite stayed green without targeting the claimed
UX change at all:

> "Lệnh `cargo test --manifest-path herdr-plugin/Cargo.toml` chỉ verify
> test hiện tại pass, không nhắm keyboard/mouse UX thay đổi mà item mô tả
> ... verify 'code compile + existing test green', không verify 'UX
> interaction hoạt động đúng theo claim item'."
> — real second-pass dispute, id `tsk-4n7`

The accepted third round pinned the exact test names both children's
implementations below were later confirmed against
(`focus_cycle`, `mouse_click_to_focus`) — the specific assertions each
name had to cover were spelled out at this same round, not left for the
implementer to invent:

> "Implementation phải thêm unit test tên chứa 'focus_cycle' (assert
> Tab/Shift+Tab đi qua đủ 5 box + wrap, ]/[ vẫn rotate Tab enum không
> đổi) và tên chứa 'mouse_click_to_focus' (assert click vào box area set
> đúng focused panel, click item trong WorkItems/InProcess set đúng
> selected index, click trong 3 box còn lại không set selection theo D1)."
> — real human answer resolving the verify dispute, id `tsk-4n7`

## Implementation (`tsk-3wl`): keyboard/mouse focus across all 5 boxes

Resolves the key-binding question left open below. `Tab`/`Shift+Tab`
cycle focus through all 5 boxes (Work Items, In Process, `NEED ANSWER`,
`MERGE LIST`, `AFTER DELIVER`) in the existing spatial order. The 3
newly-focusable right-side boxes only accept border-highlight +
Up/Down scroll once focused — no row-select/Enter action on them (D1),
distinguishing "look at this box" from "act on a row inside it," which
stays exclusive to the Work Items panel's own tabs.

Because `Tab` was claimed as the focus-cycle key, the existing status-
column `Tab` enum (`TODO`/`DOING`/`REVIEW`/`DONE`) had to be renamed to
avoid colliding with it — done via GitNexus's `rename` tool, with
`impact()` run first per this repo's own Always-Do rule, rather than a
find-and-replace. `]`/`[` remain the existing shortcuts (unaffected by
this rename); the on-screen hint line was updated to list all of
`Tab`/`Shift+Tab`, `]`/`[`, and mouse together.

Confirmed shipped as real code: a real `cargo test --manifest-path
herdr-plugin/Cargo.toml focus_cycle` test plus a real `cargo build
--release`.

## Implementation (`tsk-bvh`): mouse click-to-focus/click-to-select across all 5 boxes

Extends mouse handling beyond the detail modal (the original scope from
`tsk-1d5`'s own D5): every box's `Rect` gets recorded on each `draw()`
frame, the same pattern already used for the Pick/Discover button
`Rect`s. Clicking inside a box's `Rect` sets it as the focused panel;
clicking a row inside Work Items or In Process additionally hit-tests
the Y coordinate to set the row selection. The other 3 boxes stay
focus-only on click too (D1, consistent with keyboard focus above) — no
click-to-select-a-row action on `NEED ANSWER`/`MERGE LIST`/
`AFTER DELIVER`.

Depended on `tsk-3wl` (the keyboard-focus widening above): mouse
click-to-focus needs the same 5-box identity concept `tsk-3wl` already
established for `Tab`/`Shift+Tab` cycling, so mouse handling could reuse
it rather than defining its own separate notion of "which box is this."

Confirmed shipped as real code: a real `cargo test --manifest-path
herdr-plugin/Cargo.toml mouse_click_to_focus` test plus a real `cargo
build --release`.

## Left deliberately open (implementer's call, not locked here)

- Column width/truncation strategy for the 8-column Work Items table on
  a narrow pane.

Full decision record, scout evidence, and the related `tsk-jo1` palette
item's own decision: `docs/history/herdr-dashboard-layout-and-action-queues/CONTEXT.md`.
