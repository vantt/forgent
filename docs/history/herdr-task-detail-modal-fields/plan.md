# Plan: herdr-plugin task detail modal shows more fields

Item: tsk-2x9
Mode: small
Flags counted (per fgos-routing's Mode gate): existing covered behavior = 1
(`draw_detail_modal` is exercised, via `draw()`, by several existing
snapshot-style tests in `herdr-plugin/src/ui.rs`). No auth, no data-model
change, no audit/security, no external systems, no public-contract change,
no cross-platform concern, no multi-domain, no weak-proof area. 1 flag →
small (a couple of files, no gray areas — no larger lane honestly fits).

No `CONTEXT.md` exists for this item: it took the `clarify -> decompose`
direct edge (no `fgos-coding-exploring` pass), a registered edge in
`src/state/workflow-stage-graphs.mjs`'s `DOMAINS.coding.transitions`. There
is no locked decision to cite here; this plan's only source is the item's
own (rewritten) title/description.

## Approach

**Goal** (item text): the herdr-plugin task detail modal
(`draw_detail_modal`, `herdr-plugin/src/ui.rs`) currently renders only
`ID`, `Title`, `Goal tier`, `Stage` — show more of the item's real detail.

**What's chosen**: render the fields `WorkItem` (`herdr-plugin/src/app.rs`)
already carries but the modal never displays — `status`, `priority`,
`blocked_by`, `blocks`. These are already fetched from `fgos triage --json`
(`TriageRow`, `herdr-plugin/src/fgos.rs`) and already flow into every
`WorkItem` the app holds (`refresh_from_fgos`) — this is a pure
render-layer change, zero new data plumbing.

**Rejected alternative**: also show `description`/`kind`/`risk`/`verify`.
Rejected because `TriageRow`/`fgos triage --json` does not carry those
fields at all — adding them would mean widening the CLI data source
(`WorkItemSource::fetch_triage`, a second `fgos` call or a shape change to
`triage`'s own JSON contract), a materially bigger and riskier change than
"show more info" honestly asks for. Pinned as an **assumption** below
rather than a question back to a person, per the material/grounded/
answerable filter — the item's own text doesn't ask for those specific
fields, and the chosen fields already satisfy "more info than title +
tier" without touching anything outside `herdr-plugin/src/ui.rs`.

**Files touched**: `herdr-plugin/src/ui.rs` only (`draw_detail_modal`'s
`Paragraph::new(vec![...])` line list; a new/extended `#[test]` in the
same file's existing `mod tests`).

**Order**: single change, no ordering dependency — one function, one file.
`fgos graph --json`'s `criticalPath`/`topUnblock` were not consulted since
there is nothing to sequence (no split, see below).

## Risk map

| Component | How risky | Proof point |
|---|---|---|
| `draw_detail_modal` layout (`herdr-plugin/src/ui.rs`) | Low, but flagged CRITICAL by GitNexus impact analysis (see below) | `cargo test --manifest-path herdr-plugin/Cargo.toml` green after the change |

`impact-analysis: full` (GitNexus present, `fgos tool query --capability
impact-analysis --status present` returned it registered and present).
Ran `impact({target: "draw_detail_modal", direction: "upstream"})`:
returned `risk: CRITICAL`, 9 impacted symbols, `affected_modules` =
`Tests` (6 hits) + `Cluster_83` (3 hits).

Read closely, this is a graph-shape artifact, not 9 real behavioral
couplings: `draw_detail_modal` is called by `draw()`
(depth 1), and `draw()` is in turn called by many of `ui.rs`'s own
snapshot-style `#[test]` functions (depth 2) simply because they render a
full frame — `mouse_click_to_focus_*`, `work_items_panel_renders_four_
tabs_todo_doing_review_done`, `process_status_renders_three_separate_
boxes`. None of those assert anything about the detail modal's content;
they exercise unrelated panels and happen to reach `draw_detail_modal`
transitively through the one shared render entrypoint. Only two impacted
symbols genuinely assert on this function's output —
`detail_modal_renders_pick_and_discover_buttons` and
`discover_button_disabled_when_stage_not_clarify` — and both assert via
`content.contains(...)` substring checks / a specific cell's `fg` color,
never an exact full-buffer match, and the button row sits in a
`Constraint::Length(3)` fixed slot while the new detail lines only grow
the `Constraint::Min(0)` slot above it — so adding lines cannot shift or
truncate either button. Per `CLAUDE.md`'s **MUST warn the user if impact
analysis returns HIGH or CRITICAL risk** rule: flagging this plainly in
the gate below, together with why the real risk reads low once the graph
shape is accounted for — this is not being silently downgraded.

## Shape

Extend `draw_detail_modal`'s `Paragraph::new(vec![...])` (currently 4
`Line::from(format!(...))` entries) with 4 more, sourced from `item`
fields already in scope:

- `Status: {item.status}`
- `Priority: {item.priority.map(|p| p.to_string()).unwrap_or_else(|| "-".into())}`
- `Blocked by: {if item.blocked_by.is_empty() { "-".into() } else { item.blocked_by.join(", ") }}`
- `Blocks: {item.blocks}`

Add one test asserting the new lines render (parallel to the existing
`detail_modal_renders_pick_and_discover_buttons` shape): construct a
`WorkItem` with non-default `status`/`priority`/`blocked_by`/`blocks`,
render via the existing `render_modal_buffer` helper (extend its
signature or add a sibling helper if `render_modal_buffer` can't carry
those fields without changing its existing callers), and assert the
buffer content contains each new value.

Concrete cases worth covering, matched to `small`'s depth:
- empty `blocked_by` (today's default, `Vec::new()`) renders `-`, not an
  empty string or a stray comma
- `priority: None` (an item that never had `computePriority` run, e.g.
  still `todo` pre-`discover`) renders `-`, not `None`/a panic
- existing two modal tests (`detail_modal_renders_pick_and_discover_
  buttons`, `discover_button_disabled_when_stage_not_clarify`) still pass
  unmodified — proves the button row is untouched

### Assumptions

- "more info" = the four already-fetched-but-unused `WorkItem` fields
  (`status`, `priority`, `blocked_by`, `blocks`), not a new data field
  requiring a wider `fgos triage` contract. See "Rejected alternative"
  above. Unproven until a person confirms it's what they meant — flagged
  here per `fgos-coding-validating`'s own assumption check, not asked as a
  question (fails the material/grounded/answerable filter's "answerable"
  leg: a reasonable, low-risk default already exists from the data on
  hand).

## No split

One honest, small piece of work — the item proceeds as itself, no
`--parent` children created.

## Outstanding questions

None
