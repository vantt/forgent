# herdr shared launch-agent function — plan

Item: `tsk-1q3`. Decisions: `docs/history/herdr-shared-launch-agent/CONTEXT.md` (D1-D3).

## Mode

**high-risk.**

Flags counted:

- **audit/security** — yes, a hard-gate flag on its own. D1 makes
  `--dangerously-skip-permissions` the default for every agent this
  function launches, including future unattended auto-dispatcher calls
  with no person reviewing each launch. That alone forces `high-risk`
  regardless of the rest of the count.
- **external systems** — yes. New herdr CLI surface never called from this
  crate before: `tab list`/`tab create`/`tab rename`/`pane layout`.
- **existing covered behavior** — yes. Extends `pick.rs`'s
  `open_pick_pane`/`run_argv` (6 existing tests) and `main.rs`'s
  `UiEvent::Pick` handler (tested indirectly via `tests/render_smoke.rs`
  and `main.rs`'s own unit tests).
- auth, authorization, data model, public contracts, cross-platform,
  multi-domain — no.

3 flags plus the audit/security hard gate → **high-risk**: not because the
file count is huge, but because a wrong default here means every future
unattended agent launch runs with zero permission gating, and the layout
algorithm below is genuinely new, untested territory this session had to
prove live rather than assume.

## Real evidence gathered this session

```
$ herdr tab list --workspace wS
{"result":{"tabs":[{"label":"workers-3","pane_count":3,"tab_id":"wS:t8"}, ...]}}

$ herdr pane layout --current
{"result":{"layout":{"area":{"height":71,"width":234,"x":36,"y":1},
  "panes":[
    {"pane_id":"wS:p1H","rect":{"height":71,"width":117,"x":36,"y":1}},
    {"pane_id":"wS:p1G","rect":{"height":71,"width":117,"x":153,"y":1}}
  ],
  "splits":[{"direction":"right","ratio":0.5, ...}]
}}}
```

Confirms: `pane layout --pane <any-pane-in-tab>` (works with any pane id
in the target tab, not just `--current`) returns a **flat list of every
pane in that tab with its own `rect`** (`height`/`width`/`x`/`y`) — no BSP
tree walk needed. A pane whose `rect.height == layout.area.height` has not
been split top/bottom yet; that is exactly the target for the next
`--direction down` split.

## Approach

### 2×2 grid algorithm (the genuinely new piece)

Given a target `fg:agents-N` tab with 1–3 existing panes:

1. `pane_count == 1` (freshly `tab create`d) → split that one pane
   `--direction right` (2 panes, left/right).
2. `pane_count == 2` or `3` → call `pane layout --pane <any pane already
   known in that tab>`, scan `layout.panes` for one whose `rect.height ==
   layout.area.height` (still full-height, never split top/bottom), split
   *that* pane `--direction down`. `pane_count == 2` yields 3 (one side
   still full-height after the other got a down-split — order between
   left/right doesn't matter, both eventually get a down-split); `count ==
   3` yields 4, the completed 2×2.

**Rejected alternative**: walk `splits`' BSP tree to decide the next
target — rejected because the flat `panes[].rect` comparison above is
simpler and already proven against the real captured shape; the `splits`
field carries the same information redundantly for this item's needs.

### Files touched (all in `herdr-plugin/`)

| File | Change |
|---|---|
| `src/layout.rs` (new) | `find_agents_tab_with_room` (parses `tab list`, filters `fg:agents-<N>` labels, returns the lowest N with `pane_count < 4`, else calls `tab create --label fg:agents-<N+1>`); `next_split_target` (the grid algorithm above, via `pane layout`); `ensure_cockpit_label` (D2 — `tab rename <tab_id> fg:cockpit` if not already so labeled). |
| `src/pick.rs` | `run_argv`/`open_pick_pane` (or their successor, per CONTEXT.md's "shared function" pinned term) reads `FGOS_HERDR_SKIP_PERMISSIONS` (unset or anything other than `"0"`/`"false"` → default **on**, D1) and conditionally appends `--dangerously-skip-permissions` to the `claude` invocation; targets the pane/tab `layout::find_agents_tab_with_room` + `next_split_target` resolve, instead of always `pane split --current`. |
| `src/main.rs` | At startup, resolves its own `HERDR_TAB_ID` (same injection pattern as `HERDR_WORKSPACE_ID`, `docs/distillery/deep-dives/how-to-use-herdr.md:382`) and calls `layout::ensure_cockpit_label` (D2) — absent outside a real herdr pane, same degrade-gracefully shape the existing `HERDR_WORKSPACE_ID` handling already uses. |

### Order

`fgos graph --what-if tsk-1q3 --json` → `unblocksTransitive: 5`,
`newlyReady: ["tsk-67u", "tsk-3t9-2"]` (real leverage; nothing to
arbitrate between since this is a single dependency chain, not competing
starting points).

1. `layout.rs` — self-contained, testable against the real captured
   fixtures above without touching `pick.rs`/`main.rs` at all.
2. `pick.rs` — depends on `layout.rs`'s public functions; the
   skip-permissions env toggle (D1) is independent of the layout half and
   could technically go first, but is small enough to land in the same
   piece as the tab-targeting change since both touch the same function.
3. `main.rs` — depends on `layout.rs`'s `ensure_cockpit_label`; smallest,
   lowest-risk, goes last.

## Split

Three child items — this is not honestly one piece given the
audit/security hard gate plus the genuinely new layout algorithm; bundling
all three concerns into a single diff would make the security-relevant
change (skip-permissions default) harder to review in isolation from the
layout plumbing.

| Item | Scope | Verify |
|---|---|---|
| Layout manager: find/create `fg:agents-N` tab with a free slot, compute next 2×2 split target | `src/layout.rs` per the table above | `cd herdr-plugin && cargo test layout_manager` |
| Shared launch-agent: skip-permissions env toggle (D1) + target the layout manager's tab/pane instead of `--current` | `src/pick.rs` extension, depends on the layout item | `cd herdr-plugin && cargo test launch_agent` |
| Dashboard self-labels its own tab `fg:cockpit` at startup (D2) | `src/main.rs` startup wiring, depends on the layout item's `ensure_cockpit_label` | `cd herdr-plugin && cargo test cockpit_label` |

## Risk map

| Component | Risk | Proof (→ `fgos-coding-validating`) |
|---|---|---|
| `FGOS_HERDR_SKIP_PERMISSIONS` default-on behavior (D1, audit/security hard gate) | High — a wrong default means every unattended future launch bypasses all permission checks silently | Unit tests: env unset → flag present; env=`"0"` → flag absent; must be exercised explicitly, never inferred |
| 2×2 split-target algorithm | Was the plan's weak-proof risk; resolved this session via real `pane layout`/`tab list` capture above | Unit tests against the captured fixtures for `pane_count` 1, 2, 3 |
| `layout.rs`'s herdr CLI calls (`tab list`/`tab create`/`tab rename`/`pane layout`) | Low — same `Command::new(herdr_bin)` + JSON-parse shape `fgos.rs`/`pick.rs`/`pane_scan.rs` already use successfully | Unit tests against real captured JSON, same pattern as `pane_scan.rs`'s `pane_registry_parses_real_captured_pane_list_shape` |
| `pick.rs`/`main.rs` existing covered behavior | Low — additive changes, existing 6+2 tests must keep passing | Full `cargo test` |

## Verify (parent)

```
cd herdr-plugin && cargo test
```
All existing tests plus each split item's own tests must pass.
