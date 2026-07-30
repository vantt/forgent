# herdr jump-to-running-pane — plan

Item: `tsk-1eu`. Decisions: `docs/history/herdr-jump-to-running-pane/CONTEXT.md` (D1/D2).

## Mode

**standard.** Flags: external systems (new `pane zoom` call), existing
covered behavior (extends `app.rs`/`ui.rs`/`main.rs`'s tested event loop
and `PaneOrchestrator` port) = 2. No hard-gate flag. Not `small` — this
touches the event loop's dispatch logic (which panel Enter/Up/Down apply
to), not a single isolated file.

## Approach

- `ports.rs`: `PaneOrchestrator` gains `focus_pane(&self, pane_id: &str) -> io::Result<()>`
  (D2: shells `pane zoom <pane_id> --on`) alongside the existing
  `open_pick_pane`. `UiEvent` gains `SwitchPanel` (D1: `Tab`).
- `app.rs`: new `Panel { WorkItems, InProcess }` enum; `App` gains
  `focused_panel: Panel` (default `WorkItems`) and
  `in_process_selected: Option<usize>` (mirrors `selected`, D1's second
  selection state). New methods: `select_next_in_process`/
  `select_previous_in_process` (same wrap-around shape as the existing
  work-items pair), `selected_in_process_pane_id() -> Option<&str>`
  (`Some` only when the selected task's own `pane` is `Some`, D2 — an
  orphaned row has nothing to jump to), `switch_panel()` (toggles
  `focused_panel`).
- `pick.rs`: `HerdrPaneAdapter` implements the new `focus_pane` (same
  `Command::new(herdr_bin)` shape `open_pick_pane` already uses).
- `ui.rs`: `poll_event` maps `KeyCode::Tab` → `UiEvent::SwitchPanel`;
  `draw` gives the currently-focused panel's block a distinct border
  style (existing `Style::default().add_modifier(Modifier::BOLD)` title
  stays, add a border color/style keyed off `app.focused_panel`) and
  renders `in_process`'s own `ListState` from `in_process_selected`.
- `main.rs`: `run()`'s `UiEvent` match dispatches `Up`/`Down` to whichever
  panel is focused; `Enter` (today always the "Pick" action) branches:
  `WorkItems` focused → today's existing `open_pick_pane` call unchanged;
  `InProcess` focused → `selected_in_process_pane_id()` then
  `pane_orchestrator.focus_pane(id)` if `Some`, else a "no pane to jump to"
  status message (mirrors the existing "no row selected" shape). `Tab` →
  `app.switch_panel()`.

**Rejected alternative**: a single shared "selected index" for both
panels — rejected because the two lists genuinely need independent cursor
positions (switching panels should not lose your place in the other one).

### Files touched (all in `herdr-plugin/`)

`src/ports.rs`, `src/app.rs`, `src/pick.rs`, `src/ui.rs`, `src/main.rs`.

### Order

`fgos graph --what-if tsk-1eu --json` → `unblocksTransitive: 3`, no
`newlyReady` (single dependency chain, nothing to arbitrate). Order:
`ports.rs` (new trait method + event variant) → `app.rs` (domain, depends
only on the port signatures) → `pick.rs` (adapter, depends on `ports.rs`)
→ `ui.rs` (depends on `app.rs`'s new fields) → `main.rs` (composition,
depends on all four).

## Split

No split — one coherent cross-cutting change (event-loop dispatch logic
touches all 5 files together; splitting would leave intermediate states
that don't compile).

## Risk map

| Component | Risk | Proof |
|---|---|---|
| `Enter`'s dispatch now branches on `focused_panel` | Medium — must not regress the existing `WorkItems`→Pick behavior (existing tests: `launch_agent_*`, render smoke) | Existing tests keep passing unchanged; new tests cover `InProcess`+`Some(pane)` → `focus_pane` called, `InProcess`+`None` → no call, status message set |
| `focus_pane`'s `pane zoom <id> --on` argv | Low — same `Command::new(herdr_bin)` shelling pattern already proven in `open_pick_pane`/`pane_scan.rs`/`layout.rs` | Unit test on the argv shape, same style as `pick.rs`'s existing `run_argv` tests |
| Two independent selection states (`selected`, `in_process_selected`) | Low — mechanical, same wrap-around shape already tested for `selected` | Unit tests for `select_next_in_process`/`select_previous_in_process` mirroring existing `select_next`/`select_previous` tests |

## Verify

```
cd herdr-plugin && cargo test
```
