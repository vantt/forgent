# Plan — herdr cockpit keyboard/mouse focus UX (tsk-4n7)

Mode: standard

Flags counted (fgos-routing Mode gate): 2 — **existing covered behavior**
(`switch_panel`/Tab-cycle tests already exist at `app.rs:780-824`; this
change touches that same state machine) and **weak proof around the
area** (mouse hit-testing outside `detail_modal` has zero existing test
coverage — `ui.rs:112-129` is the only mouse-handling code today). No
hard-gate flag (auth/data-loss/audit/external-provider/removed
validation) applies. Not a spike — the shape is well understood from
`CONTEXT.md`'s scout evidence, not a single yes/no unknown. → **standard**.

## Approach

`fgos graph --what-if tsk-4n7 --json` → `unblocksTransitive: 0`,
`newlyReady: []` — this item unblocks nothing else in the backlog, so
split ordering is decided by code coupling instead, not graph rank:

Mouse click-to-focus needs a canonical "which box is this" identity to
hit-test a click against (mirroring how `pick_button_rect`/
`discover_button_rect` already give the modal's two buttons a `Rect` each
— `ui.rs:112-129`). The keyboard piece is exactly what defines that
identity (widening `Panel`, or its replacement, to name all five boxes).
Building mouse click-to-focus first would invent its own box-identity
representation and then need to be reworked onto the keyboard piece's
enum once it lands — real rework, not parallelizable. **Keyboard piece
goes first; mouse piece depends on it.**

Impact-analysis posture (CLAUDE.md gate) — corrected during
`fgos-coding-validating` (tsk-4n7): `fgos tool query --capability impact-analysis
--status present` reports `status: present`, but that alone is not
freshness (CLAUDE.md's own warning). Cross-checked via `list_repos`:
forgentX's GitNexus index is **390 commits behind HEAD**
(`indexedAt: 2026-08-04`, `lastCommit: 251d0b5`). Live `impact()` calls
against both `toggle_focus` (the name this plan originally, wrongly,
cited) and the real name `switch_panel` (confirmed at `app.rs:377`) both
returned `Target not found` — GitNexus cannot currently resolve this
Rust symbol. Posture is **degraded**, not full: both pieces below
substitute a direct `rg`/grep cross-check of real call sites for the
blast-radius evidence a fresh GitNexus `impact()` would normally give
(already done for `switch_panel`/`Panel`/`Tab` — see Feasibility matrix
in `fgos-coding-validating`'s own pass), and still run `impact()`/
`detect_changes()` before/after each edit per CLAUDE.md's MUST-run rule,
but treat any GitNexus "not found"/empty result as inconclusive rather
than a clean bill of health, falling back to grep to confirm.

### Risk map

| Component | Risk | Proof point |
|---|---|---|
| `Panel`/focus-tracking widening (`app.rs`) | Medium — touches state a locked test suite already covers (`app.rs:780-824`) | `impact({target:"switch_panel", direction:"upstream"})` before editing (CLAUDE.md MUST-run rule; degraded posture — cross-check with `rg "switch_panel\(" herdr-plugin/src` if GitNexus returns not-found/empty, same as `fgos-coding-validating` already did); existing focus tests must still pass plus new ones added |
| Tab-enum rename (status columns → avoid Tab-key name clash) | Low — pure rename, `rename` MCP tool (never find-replace) per CLAUDE.md Never-Do | `detect_changes({scope:"compare", base_ref:"main"})` shows only the expected symbol renamed |
| Mouse hit-testing beyond `detail_modal` (`ui.rs`) | Medium-high — zero existing coverage, new `Rect` bookkeeping per box/row, easy to get row-Y math wrong | New unit tests asserting hit-test → correct `focused_panel`/`selected` index for known `Rect`/click-coordinate fixtures |
| On-screen hint text | Low — text-only | Manual read of the rendered hint against the full keybinding set (Tab/Shift+Tab, `]`/`[`, mouse) |

## Shape

Two sequential pieces (D1's "cân nhắc tách 2 task con" from `CONTEXT.md`,
now decided: split, sequential not parallel — see Approach above for why).
Each gets its own real verify command, matching the two test-name scopes
already locked into `tsk-4n7`'s own verify during `fgos-coding-exploring`
(`focus_cycle`, `mouse_click_to_focus`).

### Piece 1 — keyboard focus expansion

Widen keyboard focus to reach all five boxes (`WorkItems`, `InProcess`,
`NeedAnswer`, `MergeList`, `AfterDeliver`):

- Widen `Panel` (or its replacement) so `Tab`/`Shift+Tab`
  (`KeyCode::BackTab`, confirmed available in crossterm without any kitty
  enhancement flags — none are enabled in this codebase today) cycle
  forward/backward through all five, in the existing spatial order
  (left column WorkItems; right column top-to-bottom InProcess →
  NeedAnswer → MergeList → AfterDeliver — `ui.rs:169-290`, already
  confirmed to match, no reordering needed).
- Per **CONTEXT.md D1**: the three newly-reachable boxes get
  border-highlight-on-focus and Up/Down scroll (when their list overflows
  the box height) — no row-select state, no Enter action. `WorkItems`/
  `InProcess` keep their existing `selected`/`in_process_selected`
  behavior unchanged.
- Rename the existing `Tab` enum (status columns) to stop colliding in
  name with the `Tab` *key* (`CONTEXT.md`'s deferred-to-planning item) —
  use the GitNexus `rename` MCP tool, never find-and-replace (CLAUDE.md
  Never-Do). Confirm via `impact({target:"Tab", direction:"upstream"})`
  first (CLAUDE.md MUST-run rule) since `Tab` is a shared enum name.
- Update the on-screen hint (`ui.rs:318`'s single "In process — Tab to
  focus, Enter to jump" line) to list the full keybinding set: Tab/
  Shift+Tab, `]`/`[`, and (once Piece 2 lands) mouse.

Footprint: `herdr-plugin/src/app.rs`, `herdr-plugin/src/ui.rs`.

Verify: `cargo test --manifest-path herdr-plugin/Cargo.toml focus_cycle && cargo build --release --manifest-path herdr-plugin/Cargo.toml`

### Piece 2 — mouse click-to-focus (depends on Piece 1)

Extend mouse handling beyond `detail_modal`:

- Record a `Rect` per box each frame `draw()` renders (same pattern
  `pick_button_rect`/`discover_button_rect` already use for the modal's
  two buttons), keyed by Piece 1's box identity.
- A left-click inside a box's `Rect` (outside the modal) sets
  `focused_panel` to that box — same effect Tab already produces, per
  D1 no new action beyond focus for the three read-only boxes.
- For `WorkItems`/`InProcess` specifically, a click on a row additionally
  hit-tests the row's Y against the currently rendered `Table` to set
  `selected`/`in_process_selected` to that row — "click item = select"
  from the original ask.
- Existing modal click-handling (`ui.rs:112-129`) stays as-is; the new
  handling only applies when the modal is NOT open.

Footprint: `herdr-plugin/src/app.rs`, `herdr-plugin/src/ui.rs` (same two
files as Piece 1 — expected overlap since Piece 2 depends on Piece 1
landing first; this is sequential reuse, not a parallel-edit conflict).

Verify: `cargo test --manifest-path herdr-plugin/Cargo.toml mouse_click_to_focus && cargo build --release --manifest-path herdr-plugin/Cargo.toml`

## Assumptions

- `KeyCode::BackTab` arrives reliably through whatever terminal/
  multiplexer herdr panes actually run under (crossterm's standard
  Shift+Tab sequence, no enhancement flags needed) — unproven in this
  plan; Piece 1's own proof point should confirm it manually in a real
  herdr pane before considering the piece done, not just in a bare
  terminal.
- The `rename` MCP tool can safely rename the `Tab` enum without needing
  a broader multi-file migration beyond `app.rs`/`ui.rs` — confirmed by
  `impact` before the rename, per the risk map above.

## Open questions

None carried into `fgos-coding-validating` — `CONTEXT.md`'s only
deferred-to-planning items are resolved above (rename approach, hint
text scope, click hit-testing mechanics, Shift+Tab feasibility flagged
as an assumption to prove, not an open question).
