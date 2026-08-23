# herdr-cockpit-dashboard-own-tab — plan

Item: `tsk-3i3`. Decisions: `docs/history/herdr-cockpit-dashboard-own-tab/CONTEXT.md` (D1-D3).

## Mode gate

Flags counted:
- **external systems** — herdr CLI + the `herdr-plugin.toml` manifest contract (`placement` value) are an external tool's own surface, not owned by this repo.
- **existing covered behavior** — touches `main.rs`/`layout.rs`, both already exercised by `herdr-plugin`'s existing `cargo test` suite (9 tests in `layout.rs` alone); the full suite must stay green.
- **weak proof around area** — `ensure_cockpit_label` itself has no direct unit test today (only its parse/argv helpers do), and the new reuse/dedupe path introduces two herdr CLI calls (`tab focus`, `tab close`) this codebase has never called before.

3 flags → **standard** mode. No hard-gate flag (no auth/data-loss/audit/external-provider-write/removed-validation) — not high-risk.

## Approach

**Chosen path** (honors D1-D3):

1. `herdr-plugin/herdr-plugin.toml`: change `placement = "overlay"` → `placement = "tab"`. herdr's placement vocabulary (`docs/distillery/deep-dives/how-to-use-herdr.md:459,478` — `overlay | popup | split | tab | zoomed`) already supports this; a `tab`-placed plugin pane always gets a brand-new dedicated tab from herdr on open, instead of overlaying whatever tab the operator currently has focused. This alone is what makes D2/D3 possible: today's `HERDR_TAB_ID` (read in `main.rs:62`) is the operator's *current* tab (because overlay renders on top of it); after this change it is always the plugin's *own* fresh tab.
2. `herdr-plugin/src/layout.rs`: replace the unconditional rename in `ensure_cockpit_label` (`:317-325`) with a find-or-reuse function (name TBD by implementer, e.g. `ensure_cockpit_tab`) that, given `herdr_bin` + `workspace_id` + `own_tab_id`:
   - Lists tabs in the workspace (reuse `parse_tab_list`/`TabRow`, the same primitives `layout_manager_parses_real_tab_list_and_picks_lowest_index_with_room` already exercises for the `fg:agents-N` grid).
   - If a tab **other than `own_tab_id`** already carries label `fg:cockpit` (D3's identity rule): `herdr tab focus <that_tab_id>`, then `herdr tab close <own_tab_id>` (this instance's own now-redundant fresh tab), then exit before rendering the dashboard a second time (D2: never a second cockpit tab, never touch the operator's other tabs).
   - Otherwise: keep today's behavior — rename `own_tab_id` to `fg:cockpit` (now safe, since `own_tab_id` is always the plugin's own fresh tab per the placement change, never the operator's).
3. `herdr-plugin/src/main.rs:59-65`: pass `HERDR_WORKSPACE_ID` alongside `HERDR_TAB_ID` into the new function instead of calling `ensure_cockpit_label` directly.

**Alternatives rejected:**
- Keep `placement = "overlay"` and try to detect "is this the operator's real tab" from inside the plugin some other way — rejected. Overlay placement renders on top of whatever tab is currently focused by definition; there is no signal available to the plugin process to distinguish "my own dedicated tab" from "the operator's real working tab" under overlay. The structural fix is to stop asking overlay placement to behave like a persistent dedicated tab (this was CONTEXT.md's deferred question; resolved here).
- Prevent the duplicate tab from ever being created, upstream of the plugin process (e.g. a pre-check wrapped around the launch keybinding) — rejected/not reachable. The keybinding that opens the cockpit is a static `herdr-plugin.toml` declaration calling `herdr plugin pane open` directly; there is no scriptable pre-check hook in that path. Dedupe has to happen from inside the plugin process, after herdr has already created the new tab — hence the focus-then-close-own-tab shape above.

**Risk map:**

| component | risk | proof point |
|---|---|---|
| `placement` config change (`herdr-plugin.toml`) | low | manual: open cockpit from a tab that isn't already `fg:cockpit`; confirm that tab is untouched and a new one appears |
| reuse/dedupe logic (`layout.rs`) | medium — new CLI calls (`tab focus`, `tab close`) not used elsewhere in this codebase; self-closing one's own tab while running is a new pattern here | fixture-based unit test (same shape as existing `TAB_LIST_FIXTURE`/`TAB_GET_FIXTURE` tests) for the "another `fg:cockpit` tab already exists → focus it, close own tab" branch; manual: open cockpit twice, confirm the second launch ends up focused on the *first* cockpit tab and no duplicate `fg:cockpit`-labeled tab remains |
| existing suite regression | low | `cargo test` (herdr-plugin) stays green — none of the 9 existing `layout.rs` tests reference `ensure_cockpit_label` directly, so their fixtures/behavior are unaffected by the rename |

**Files touched:** `herdr-plugin/herdr-plugin.toml`, `herdr-plugin/src/main.rs`, `herdr-plugin/src/layout.rs`.

**Order:** (1) manifest placement change — cheap, independently manually verifiable — before (2) the layout.rs dedupe function + its unit tests, before (3) wiring main.rs to call it. `fgos graph --json` shows `tsk-3i3` as an isolated size-1 component (no deps, nothing depends on it) — ordering is internal to this one item, not cross-item.

## Shape

Single item, no split — one honest piece of work, one PR-sized change confined to `herdr-plugin/`.

Cases to prove at `fgos-coding-validating`/execution:
- No `fg:cockpit` tab exists yet in the workspace → new tab created and labeled, operator's current tab untouched.
- A `fg:cockpit` tab already exists → opening cockpit again focuses it, closes the redundant new tab, never leaves two `fg:cockpit`-labeled tabs.
- Non-herdr environment (`HERDR_WORKSPACE_ID`/`HERDR_TAB_ID` absent, e.g. local dev/test) → degrades gracefully, same as today's `if let Ok(tab_id) = ...` shape; never panics.
- Existing `layout.rs` test suite (9 tests) stays green — none of them touch the code paths being changed.

**Verify:** `cd herdr-plugin && cargo test` (full suite green, plus new unit test(s) covering the reuse/dedupe branch above).
