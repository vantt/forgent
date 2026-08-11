# CONTEXT: add a Stage column to the herdr-plugin Work Items panel

## Feature boundary

The herdr-plugin TUI's left panel, literally titled **"Work items"**
(`herdr-plugin/src/ui.rs:349-352`, built by `tsk-64z`), renders a 7-column
table: `ID | Tier | Pri | Status | Blocked By | Blocks | Title`
(`herdr-plugin/src/ui.rs:295-296`). This item adds one more column, `Stage`,
placed next to `Status`. Scope is this one table only — no other panel
(In Process, `NEED ANSWER`, `MERGE LIST`, `AFTER DELIVER`) and no other
"work items" surface (`/fgOS:list`'s own markdown table already carries
`stage`, per `plugins/fgOS/skills/list/SKILL.md:77` — out of scope, already
done).

## Locked decisions

| ID | Decision |
|---|---|
| D1 | Scope is the herdr-plugin Work Items panel table only (`herdr-plugin/src/ui.rs:295-357`) — the same table `tsk-64z` built. No other panel/box changes. |
| D2 | The new `Stage` column is inserted immediately after `Status` (`Status`, `Stage`, `Blocked By`, ...) — the most literal reading of "kế bên status" (next to status), and it keeps the two state-describing columns (current status, current pipeline stage) adjacent. |
| D3 | The `Stage` column renders plain text, uncolored — matching every other non-`Status` column in this table today (`Tier`/`Pri`/`Blocked By`/`Blocks`/`Title` all render with the row's own `status_color`, never their own per-cell color); only `Status` itself is deliberately color-coded (`tsk-64z` D6, `docs/history/herdr-dashboard-layout-and-action-queues/palette.md`). No new color convention is introduced by this item. |

## Pinned terms

- **"Work Items table"** = the herdr-plugin TUI panel titled "Work items"
  (`herdr-plugin/src/ui.rs`), not `/fgOS:list`'s CLI markdown table.
- **"Stage"** = the item's own `stage` field (`clarify` / `discovery` /
  `exploring` / `decompose` / `executing` / `compound-learn`, defaults to
  `executing` when absent) — already deserialized on `TriageRow.stage`
  (`herdr-plugin/src/fgos.rs:21`), sourced from `fgos triage --json`'s
  `rankImpact` output (`src/state/impact.mjs`). Distinct from `status`
  (`todo`/`doing`/`blocked`/etc.).

## Scout evidence

- `herdr-plugin/src/fgos.rs:11-39` (`TriageRow`) — `stage: String` (line
  21) is already deserialized and already used elsewhere (the detail
  modal's Discover-button gate, per the comment at lines 17-20); it is
  simply never read by the table renderer. No data-layer change needed —
  this is a render-only change.
- `herdr-plugin/src/ui.rs:295-296` — header row array.
- `herdr-plugin/src/ui.rs:313-321` — per-row `Row::new([...])` array, built
  from the same `TriageRow` the header describes.
- `herdr-plugin/src/ui.rs:330-338` — `Constraint::Length(n)` array, one
  entry per column, same order/length as the header/row arrays — the
  implementer must extend all three arrays in lockstep or columns
  misalign.
- `herdr-plugin/src/ui.rs:722` (`work_items_panel_renders_four_tabs_todo_
  doing_review_done`) and sibling tests through line 927 — existing
  render-into-`Buffer`-and-assert-on-content test pattern for this same
  panel; the natural shape for a new test asserting the `Stage` header and
  a sample row's stage value both render.
- `docs/reference/herdr-dashboard-layout-and-action-queues.md:103` (and
  the historical `docs/history/herdr-dashboard-layout-and-action-queues/
  CONTEXT.md:103`) describe "the 7-column Work Items table" by name — the
  live `docs/reference/` doc becomes stale once this ships to 8 columns;
  updating it is in scope for whoever implements this (the historical
  `docs/history/` copy is a record of what `tsk-64z` decided at the time
  and is not touched).
- `fgos tool query --capability impact-analysis --status present` →
  GitNexus registered and `present` on this machine — **full** posture per
  `CLAUDE.md`'s gate: MUST run `impact()` before editing
  `render`/`work_items_header`/`TriageRow` (or whichever symbols the
  implementation touches) and report blast radius before editing.

## Canonical references

- `herdr-plugin/src/fgos.rs`, `herdr-plugin/src/ui.rs`, `herdr-plugin/src/app.rs`
- `docs/reference/herdr-dashboard-layout-and-action-queues.md`
- `docs/reference/triage-table-columns.md` (the *other* "work items" table,
  confirmed out of scope — already carries `stage`)

## Outstanding questions

None
