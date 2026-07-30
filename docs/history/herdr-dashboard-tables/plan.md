# herdr dashboard tables — plan

Item: `tsk-4vo`. Decisions: `docs/history/herdr-dashboard-tables/CONTEXT.md` (D1/D2).

## Mode

**small.** Flags: existing covered behavior (extends `fgos.rs`'s
`DoingRow`/`parse_doing`, `app.rs`'s `InProcessTask`, `ui.rs`'s rendering)
= 1. No hard-gate flag, no external system, no auth/security. A few
files, no remaining gray area (D1/D2 already resolved the only real
ambiguity) — not `tiny` since it touches 3 files together, not
`standard` since there's no genuine multi-flag risk.

## Approach

- `fgos.rs`: `WorkItemRaw` gains a `stage: String` field (already present
  in `fgos list --all --json`'s per-item JSON, just not yet extracted).
  `DoingRow` gains `status: String`/`stage: String`. `parse_doing`'s
  filter widens to `status == "doing" || status == "awaiting-approval"`
  (D1) and sorts by D2's tier (`awaiting-approval` first; within
  `doing`, `executing` → `decompose` → `clarify`), replacing today's
  plain `id` sort.
- `app.rs`: `InProcessTask` gains `status`/`stage` fields (mirroring the
  row shape) so `ui.rs` can render them as table columns; `refresh_from_fgos`'s
  mapping closure carries the new fields through unchanged (`parse_doing`
  already did the sort — `app.rs` never re-sorts).
- `ui.rs`: both lists become `ratatui::widgets::Table` (header + rows)
  instead of `List` — `Table`'s header is structurally separate from the
  scrollable body, so "sticky header" needs no custom logic. Columns:
  "Work items" → Goal Tier | ID | Title (same info already shown, now in
  columns); "In process" → ID | Title | Status (surfaces D1's expanded
  status set directly, replacing the `[pane missing]` prefix-string badge
  with a real column — the badge's underlying info, `pane.is_none()`,
  moves to a small "Pane" column instead).

**Rejected alternative**: keep `List` and hand-format a header line as
the first list item — rejected because it wouldn't actually stay fixed
when the list scrolls past one screen (a real `List` has no separate
header region), failing the "sticky header" requirement D pinned term
explicitly asks for.

### Files touched (all in `herdr-plugin/`)

`src/fgos.rs`, `src/app.rs`, `src/ui.rs`.

### Order

`fgos graph --what-if tsk-4vo --json` → `unblocksTransitive: 0` (a leaf
item, nothing downstream to arbitrate). Order: `fgos.rs` (data shape +
sort) → `app.rs` (carries the new fields) → `ui.rs` (depends on both).

## Split

No split — one coherent UI change across 3 already-small files.

## Risk map

| Component | Risk | Proof |
|---|---|---|
| D2's tier sort (`awaiting-approval` first, then `doing` by stage) | Low — mechanical comparator, same shape as existing `rankImpact` tests | Unit tests for `parse_doing`'s new sort, covering all documented tier combinations |
| Existing 9-shape `fgos.rs`/render tests (`render_smoke.rs` uses `App::mock()`) | Low — must not regress; `App::mock()`'s hardcoded rows need the new fields too | Full `cargo test` |
| Switching `List`→`Table` in `ui.rs` | Low — same `render_stateful_widget` pattern, `ratatui::widgets::Table` API already used elsewhere in the ratatui ecosystem docs | `tests/render_smoke.rs` keeps passing (draw() signature unchanged) |

## Verify

```
cd herdr-plugin && cargo test
```
