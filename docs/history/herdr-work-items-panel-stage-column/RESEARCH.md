# RESEARCH: add a Stage column to the herdr-plugin Work Items panel

## Round 1 (tsk-4cxl, stage discovery)

**Goal:** "điều chỉnh table Work Items để thêm column stage kế bên status"
(add a `stage` column to the Work Items table, next to `status`).

**Checked:** `herdr-plugin/src/fgos.rs` (`TriageRow`, `parse_triage`),
`herdr-plugin/src/ui.rs` (Work Items panel table render),
`herdr-plugin/src/app.rs` (`visible_work_items`), `fgos show tsk-64z --json`
(the item that originally built this table),
`docs/reference/herdr-dashboard-layout-and-action-queues.md`,
`docs/reference/triage-table-columns.md`.

**Found — which "Work Items" table this is:** two different tables carry
"work items" language in this repo:
- `/fgOS:list`'s own markdown table (`plugins/fgOS/skills/list/SKILL.md:77`)
  already lists `status`, `stage`, `goalTier`, `priority`, `title` — stage
  is already present there, so it is not this table.
- The herdr-plugin TUI's left panel, literally titled **"Work items"**
  (`herdr-plugin/src/ui.rs:349-352`), built by `tsk-64z` ("herdr-plugin:
  Work Items panel tabs TODO/DOING/REVIEW/DONE + 7-col table") — **this is
  the target**: it renders 7 columns (ID/Tier/Pri/Status/Blocked By/
  Blocks/Title) and has no Stage column today.

**Found — the data is already available, only the render is missing:**
`TriageRow` (`herdr-plugin/src/fgos.rs:11-39`) already deserializes a
`stage: String` field (line 21, sourced from `fgos triage --json`'s
`rankImpact` output, `src/state/impact.mjs`) — it is already used
elsewhere (the detail modal's Discover-button-enabled check, per the
comment at fgos.rs:17-20) but is never read by the table renderer.

**Found — exact render site to change:**
- Header row: `herdr-plugin/src/ui.rs:295-296` —
  `Row::new(["ID", "Tier", "Pri", "Status", "Blocked By", "Blocks", "Title"])`.
- Row construction: `herdr-plugin/src/ui.rs:313-321` — builds each `Row`
  from `TriageRow` fields (`item.id`, `item.goal_tier`, `priority`,
  `item.status`, `blocked_by`, `item.blocks`, `item.title`); `item.stage`
  is available on the same struct but not read here.
- Column width constraints: `herdr-plugin/src/ui.rs:330-338` — one
  `Constraint::Length(n)` per column, in the same order as the header/row
  arrays; a new column needs both the header/row arrays AND this
  constraints array extended in lockstep (mismatched lengths would
  misalign every column, not just the new one).
- "next to status" reads as inserting the new `Stage` cell/constraint
  immediately after the existing `Status` column (index 3) and before
  `Blocked By` — the plan/implementation step decides the exact
  insertion index and column width, not this research round.

**Found — doc that will need a matching update:**
`docs/reference/herdr-dashboard-layout-and-action-queues.md:103` and
`docs/history/herdr-dashboard-layout-and-action-queues/CONTEXT.md:103`
both describe "the 7-column Work Items table" by name — becomes 8-column
once this ships. (Docs already checked into `docs/history/...` for the
prior item are historical record, not live spec — only the live
`docs/reference/` doc is a real update candidate; the implementer decides
scope.)

**Found — existing test convention to extend:** `herdr-plugin/src/ui.rs`
has an existing `#[test] fn work_items_panel_renders_four_tabs_todo_doing_
review_done()` (line 722) and several sibling tests for this same panel
(lines 739-927) asserting on rendered buffer content — the same pattern
(render into a test `Buffer`, assert the `Stage` header text and a sample
row's stage value both appear) is the natural shape for a new test here,
matching how `tsk-64z`'s own verify command was phrased (`grep -q "fn
<test_name>" ... && cargo test --manifest-path herdr-plugin/Cargo.toml`).

**Verdict:** `{clear: true, verify: "cargo test --manifest-path herdr-plugin/Cargo.toml"}`
