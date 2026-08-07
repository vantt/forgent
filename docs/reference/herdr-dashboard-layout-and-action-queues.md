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

## Left deliberately open (implementer's call, not locked here)

- Exact key bindings for switching Work Items tabs and cycling focus
  between the left panel and the 3 right boxes (5 focusable regions
  total, up from the prior 2).
- Column width/truncation strategy for the 7-column Work Items table on
  a narrow pane.
- Whether `NEED ANSWER`'s two sub-reasons (`system-error` vs
  `human-question`) get visually distinct tags/colors within the one box,
  or just distinct row text.

Full decision record, scout evidence, and the related `tsk-jo1` palette
item's own decision: `docs/history/herdr-dashboard-layout-and-action-queues/CONTEXT.md`.
