# herdr-operation-tab-layout — plan.md

tsk-5lr. Mode: small

Flags counted (per `fgos-routing`'s Mode gate, applied directly — no lane
was handed off before this skill loaded, since this session reached
`fgos-coding-planning` via `/fgOS:pick` → `fgos-coding-driving` rather than
`fgos-routing`'s own Orient step): **existing covered behavior**
(`find_agents_tab_with_room` and `Rect`, both in `herdr-plugin/src/
layout.rs`, are pinned by `layout.rs`'s own `#[cfg(test)]` module —
`layout_manager_parses_real_tab_list_and_picks_lowest_index_with_room`,
`next_split_target_picks_right_for_a_single_pane_tab`, etc.). No other
flag applies — no auth/authorization/data-model/audit/external-system/
cross-platform/multi-domain concern, and (per the Approach below) this
plan's own design choice keeps the `PaneOrchestrator` trait itself
untouched, so it is not counted as a **public contracts** flag. 1 flag,
no hard-gate flag → **small**.

## Approach

**Design decision (implementation choice, deferred to this skill per
CONTEXT.md's own "Deferred to planning" list — the exact `LayoutError`/
`pick_status` shape for "no room"): reuse the existing `io::Result<()>`
error channel `open_pick_pane`/`open_discover_pane` already use, never
extend the `PaneOrchestrator` trait's method signatures.**

`impact({target: "PaneOrchestrator", direction: "upstream"})` returned
**CRITICAL** risk — 15 impacted symbols, 4 direct trait implementers
(`HerdrPaneAdapter` in `pick.rs`; `NoopPaneOrchestrator`,
`RecordingPaneOrchestrator`, `RecordingPickOrchestrator` in `main.rs`),
`main()`'s own startup wiring, and 6 UI-interaction tests in `main.rs`
(`mouse_click_inside_pick_button_rect_fires_pick`,
`discover_button_fires_pane_open_when_item_is_at_clarify_stage`, etc.).
Reading `main.rs`'s existing `UiEvent::Pick` handler
(`app.pick_status = Some(match pane_orchestrator.open_pick_pane(id) {
Ok(()) => ..., Err(err) => format!("pick failed for {id}: {err}") })`)
shows the "no room" string CONTEXT.md's feature boundary asks for
already has a live path to the screen with **zero** trait/adapter/
call-site changes: `find_agents_tab_with_room` (`layout.rs:176`) already
returns `Result<_, LayoutError>`, `place_new_agent_pane` already maps
that `Err` through `io::Error::other(...)`, and `open_pick_pane`/
`open_discover_pane` (`pick.rs`) already propagate it as-is. Adding one
new `LayoutError` variant and one new "both tabs full" branch inside
`find_agents_tab_with_room` is enough — the CRITICAL blast radius on
`PaneOrchestrator` is avoided entirely by never touching it. `impact()`
on `find_agents_tab_with_room` itself (the function this plan actually
edits) confirmed **LOW** risk, 5 impacted symbols, no direct test
breakage at depth 1.

Alternative rejected: adding a `PickStatus`/`no_room` variant to the
`PaneOrchestrator` trait's return type. Rejected because it would force
every implementer (2 production, 2 test doubles) and `main.rs`'s match
arms to change for a signal the existing `io::Result<()>` + formatted
`Err` string already carries end-to-end — pure added blast radius for no
behavioral gain.

### Piece 1 — cap `fg:agents-N` at `MAX_AGENT_TABS = 2` (CONTEXT.md
feature-boundary item 1)

- `herdr-plugin/src/layout.rs`: add `const MAX_AGENT_TABS: usize = 2;`
  next to the existing `MAX_PANES_PER_TAB`.
- Add a `LayoutError::NoRoomForAgentTabs` variant (`Display`: something
  like `"no room: fg:agents-1..fg:agents-{MAX_AGENT_TABS} are full"`).
- In `find_agents_tab_with_room`, after the existing "tab with room"
  search comes up empty, check `agent_tabs.len() >= MAX_AGENT_TABS`
  *before* the current unconditional `tab create` branch. When true,
  return `Err(LayoutError::NoRoomForAgentTabs)` instead of creating
  `fg:agents-(N+1)`. When false, fall through to today's create-next-tab
  behavior unchanged (so a single `fg:agents-1` tab, or `fg:agents-1`
  full with no `fg:agents-2` yet, still creates the second tab exactly
  as today — the cap only bites once both are simultaneously full).
- No change needed in `pick.rs`, `ports.rs`, or `main.rs` — the existing
  `Err` → `io::Error::other` → `pick_status` format string chain
  (traced above) already surfaces this once `find_agents_tab_with_room`
  starts returning it.

Proof point (low risk — `impact()` on `find_agents_tab_with_room`: LOW,
5 impacted, no depth-1 test breakage; impact-analysis: full, gitnexus
`present`, checked this session): a new `#[cfg(test)]` case in
`layout.rs` asserting `find_agents_tab_with_room` returns
`Err(LayoutError::NoRoomForAgentTabs)` against a fixture where both
`fg:agents-1` and `fg:agents-2` report `pane_count == MAX_PANES_PER_TAB`
(4) — same fixture shape as the existing `TAB_LIST_FIXTURE`, just both
tabs full instead of one — plus the full `cargo test`/`cargo build
--release` verify already named on the item.

### Piece 2 — fixed `fg:operation` tab with left/right pane slots
(CONTEXT.md feature-boundary item 2, D1/D2)

- `herdr-plugin/src/layout.rs`: extend the `Rect` struct (today only
  `height: u32`) with `x: u32` (D2 names `x` and `width`; `width` is
  parsed too for `Deserialize` completeness even though only `x` is read
  by this item's own left/right decision). **No fixture changes
  needed** — `PANE_LAYOUT_TWO_FIXTURE`/`PANE_LAYOUT_THREE_FIXTURE`
  already carry real `x`/`width` values in their JSON; only the struct
  was under-parsing them.
- Add `pub fn ensure_operation_tab(herdr_bin: &str, workspace_id: &str,
  project_root: &Path) -> Result<(String, String), LayoutError>`
  (returns `(left_pane_id, right_pane_id)`), following the same
  find-or-create-by-label shape `ensure_cockpit_tab`/
  `find_other_cockpit_tab` already establish (D1): `tab list`, look for
  a tab already labeled `fg:operation`; if found, read its 2-pane
  layout via the existing `pane list`/`pane layout` calls
  (`find_any_pane_in_tab` / the `PaneLayoutEnvelope` parse
  `next_split_target` already uses) and sort its 2 panes by `rect.x`
  (smallest = left/merge slot, per D2); if not found, `tab create` it
  (project_root as `--cwd`, same as `tab_create_argv`), then split its
  one root pane once (`pane split --direction right`, mirroring
  `pane_split_argv`) to get exactly 2 panes, and read their `x` the same
  way. The pinned assumption in CONTEXT.md (an `fg:operation` tab that
  exists with a pane count other than 2 is an unsupported/error state)
  maps to: any layout read that does not resolve to exactly 2 panes
  returns `Err(LayoutError::NoUsablePaneInResponse(..))` (the existing
  variant, no new one needed for this case).
- `herdr-plugin/src/main.rs`: call `layout::ensure_operation_tab(...)`
  from `main()` right after the existing `layout::ensure_cockpit_tab`
  call (same `HERDR_WORKSPACE_ID`/`HERDR_TAB_ID`-guarded block,
  `project_root` from the already-resolved `root` a few lines below —
  reordering that one `let root = ...` line above this new call, since
  today it is computed after the cockpit-tab check). Degrade the same
  way `cockpit_error` already does: on `Err`, append to `app.last_error`
  instead of failing startup. On `Ok((left, right))`, store both ids as
  new `pub` fields on `App` (`operation_left_pane_id: Option<String>`,
  `operation_right_pane_id: Option<String>`) — a plain data carrier, no
  new behavior wired to them yet (per CONTEXT.md's explicit "does not
  decide which loop launches where — tsk-2xt" boundary).

Proof point (medium risk — new struct field + new startup call, but
`impact()` on `ensure_cockpit_tab` itself: LOW, 1 impacted (`main`);
`Rect` has 0 upstream impact today since only 1 field is read anywhere;
impact-analysis: full): new `#[cfg(test)]` cases in `layout.rs` for
`ensure_operation_tab`'s pure decision logic (label-matching and
left/right-by-`x` sort, using fixtures shaped like the existing
`TAB_LIST_WITH_COCKPIT_FIXTURE`/`PANE_LAYOUT_TWO_FIXTURE`, factored the
same way `find_other_cockpit_tab` is kept separate from the live herdr
calls for unit-testability), plus the item's own `cargo test`/`cargo
build --release` verify.

### Order

`fgos graph --what-if tsk-5lr --json` reports `unblocksTransitive: 1`
(tsk-2xt, the dependent item CONTEXT.md names) and no other candidate
pieces to compare — this item is not splitting into children (see Split
below), so there is no cross-item ordering question. Within the one
item, Piece 1 and Piece 2 touch disjoint code paths (the tab-room search
vs. a new eager-startup function) and have no dependency on each other;
Piece 1 first is preferred only because it is the smaller, already-fully
covered edit, giving an earlier green `cargo test` checkpoint before
Piece 2's new function is added.

## Assumptions

- `App`'s two new pane-id fields (`operation_left_pane_id`/
  `operation_right_pane_id`) are a plain data carrier for tsk-2xt to
  consume later — not material to this item's own verify, since nothing
  in this item's scope reads them back. Pinned here rather than asked,
  per CONTEXT.md's own explicit scoping-out of "which loop launches
  where."
- `ensure_operation_tab`'s split-once-to-get-2-panes step assumes herdr's
  `pane split --direction right` on a freshly created tab's single root
  pane always yields exactly 2 panes with distinct `x` — the same
  assumption `next_split_target`'s existing `pane_count <= 1` branch
  already makes for `fg:agents-N` tabs, not a new one introduced here.

## Split

None. One item, two independent pieces, executed together — CONTEXT.md
already drew the tab/pane-mechanism boundary tightly enough (rendering
and launch-decision logic both explicitly out of scope, in tsk-417 and
tsk-2xt respectively) that splitting this item further would only add
coordination overhead without unlocking separate workability.

## Outstanding questions

None
