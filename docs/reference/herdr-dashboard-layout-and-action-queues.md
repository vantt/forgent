# herdr-plugin dashboard layout: work-items panel + action-queue boxes

`tsk-1d5` redesigned herdr-plugin's TUI (`herdr-plugin/src/ui.rs`) from a
2-pane Work-items/In-process split into a left "browse all work" panel
plus a right "action queues" panel of 3 separate boxes. This is the
locked layout spec for that redesign.

## Left panel: Work Items

- **Tabs**: `TODO` / `DOING` / `REVIEW` / `DONE` — filtered client-side
  over one `fgos triage --json --all` response; no separate CLI call per
  tab.
- **Columns**, in order: `ID`, `Tier`, `Priority`, `Status`,
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

## Mouse support

Real mouse handling added: `EnableMouseCapture`/`DisableMouseCapture` on
terminal init/teardown, plus `Event::Mouse` handling inside `poll_event`
(previously `poll_event` matched only `Event::Key` — `ui.rs:71` silently
dropped every mouse event). Button hit-testing needs each frame's
rendered `Rect`s for Pick/Discover stored on `App`, since `draw()` was a
pure render function with no persisted layout before this item.

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
table, D1/D2/D7/D8 above) added Status-column color-coding as *guidance*,
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

## Left deliberately open (implementer's call, not locked here)

- Exact key bindings for switching Work Items tabs and cycling focus
  between the left panel and the 3 right boxes (5 focusable regions
  total, up from the prior 2).
- Column width/truncation strategy for the 7-column Work Items table on
  a narrow pane.

Full decision record, scout evidence, and the related `tsk-jo1` palette
item's own decision: `docs/history/herdr-dashboard-layout-and-action-queues/CONTEXT.md`.
