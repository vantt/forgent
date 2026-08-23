# Plan: add a Stage column to the herdr-plugin Work Items panel

Mode: tiny

**Flag count:** 1 (existing covered behavior — `herdr-plugin/src/ui.rs`'s
Work Items table already has render tests, lines 722-927). No auth,
authorization, data model, audit/security, external systems, public
contracts, cross-platform, weak-proof, or multi-domain flags apply. One
direct task, two files touched (plus a doc). `impact-analysis: degraded`
(corrected at `fgos-coding-validating`, tsk-4cxl: `fgos tool query --capability
impact-analysis --status present` shows GitNexus registered and
`present`, but `mcp__gitnexus__list_repos` shows the `forgentX` index is
426 commits behind HEAD — `present` only means installed, not fresh,
per `CLAUDE.md`'s gate). Cross-checked anyway: `impact({target: "draw",
direction: "upstream", file_path: "herdr-plugin/src/ui.rs"})` →
`Function:herdr-plugin/src/ui.rs:draw` (the function containing this
table's render code) has exactly 5 upstream callers, all existing tests
in the same file (`work_items_panel_renders_four_tabs_todo_doing_review_
done` and 4 siblings) — matches the direct `grep`/`Read` findings in
`RESEARCH.md`/`CONTEXT.md` exactly, despite the stale index. No
production caller outside this file depends on `draw` — blast radius is
contained to `herdr-plugin/src/ui.rs`'s own test suite, already covered
by the item's `verify` command.

## Approach

No alternatives considered — the data (`TriageRow.stage`,
`herdr-plugin/src/fgos.rs:21`) already exists; this is purely a render-side
addition, honoring **D1** (scope: this one table) and **D2**/**D3** (column
position and styling) from `CONTEXT.md`. No `fgos graph --what-if` split
comparison needed — the item has no deps and produces exactly one piece
(see "Decide the split" below).

Files touched, in order:
1. `herdr-plugin/src/ui.rs:295-296` — add `"Stage"` to the header
   `Row::new([...])` array, positioned right after `"Status"` (D2).
2. `herdr-plugin/src/ui.rs:313-321` — add `item.stage.clone()` to the row
   `Row::new([...])` array, same position, uncolored (D3 — no new
   `.style()` call on this cell; the row's existing `row_style` already
   applies to the whole row per `status_color`).
3. `herdr-plugin/src/ui.rs:330-338` — add one `Constraint::Length(n)` to
   the constraints array, same position, `n` sized for the longest stage
   name (`"compound-learn"`, 14 chars) or a shorter truncating length
   consistent with the panel's existing width budget (`fgos-coding-implement`
   picks the exact number against the real terminal-width constraints
   already governing this table).
4. `herdr-plugin/src/ui.rs` (near line 927, alongside the existing sibling
   tests) — one new `#[test]` asserting the `Stage` header text and a
   sample row's stage value both render, following the existing
   render-into-`Buffer`-and-assert pattern already used by
   `work_items_panel_renders_four_tabs_todo_doing_review_done` (line 722)
   and its siblings.
5. `docs/reference/herdr-dashboard-layout-and-action-queues.md:103` (and
   any other "7-column" mention in that same live reference doc) — update
   to reflect the new 8-column table.

## Risk map

| Component | Risk | Proof point |
|---|---|---|
| Header/row/constraint array lengths staying in lockstep | low — a length mismatch is a `ratatui` panic or silent column misalignment, not silent data loss | the new test (file 4 above) + `cargo test --manifest-path herdr-plugin/Cargo.toml` catches a panic; a visual check via `cargo run` (or the project's own `run` skill) catches misalignment `cargo test` alone would miss |
| Column width budget on a narrow terminal | low — cosmetic only, no functional impact | none needed beyond the existing render test; explicitly out of scope per D3 (no new styling/behavior beyond adding the column) |

No medium/high risk identified — nothing here needs a separate
`fgos-coding-validating` proof point beyond the verify command itself.

## Decide the split

One honest piece — no split. The item proceeds as itself; no child items
created.

## Proof surface

`cargo test --manifest-path herdr-plugin/Cargo.toml` (already the item's
own `verify`, set at the discovery round in `RESEARCH.md`) — covers the
new render test plus every existing `herdr-plugin` test, so a regression
in the existing 7-column behavior fails the same command.

## Outstanding questions

None
