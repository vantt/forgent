# herdr-plugin layout manager: fg:agents-N cap + fg:operation tab

**Item:** tsk-5lr (parent tsk-19y, depends on tsk-417 — status `retrospective`,
satisfied)

## Feature boundary

Two additions to `herdr-plugin/src/layout.rs`'s existing layout manager
(tsk-1q3), both scoped to tab/pane mechanism only — never the logic that
decides *when* to launch which loop into which pane (that belongs to the
separate, dependent item tsk-2xt):

1. **Cap `fg:agents-N` tabs at `MAX_AGENT_TABS = 2`.** Today
   `find_agents_tab_with_room` (`layout.rs:176`) has no cap — it always
   creates the next `fg:agents-(N+1)` tab once the current one hits
   `MAX_PANES_PER_TAB = 4`. This item adds the second constant and, once
   both `fg:agents-1`/`fg:agents-2` are full (8 panes total), makes
   `open_pick_pane`/`PaneOrchestrator` return "no room" via `pick_status`/
   an error instead of silently creating a 3rd tab or queuing.
2. **Add one fixed `fg:operation` tab** with exactly 2 fixed panes
   (left/right), never counted against the `fg:agents-N` cap. Left pane is
   always the merge-loop slot (highest priority per merge-list priority);
   right pane alternates between retro-loop and cleanup-loop by priority
   (cleanup always ordered after retro, per AGENTS.md Polish-Sau-DoD).
   Pane *content* (merge-list/retro-list/cleanup-list, sorted by that
   action's own priority) reuses the `fgos.rs` data source tsk-417 already
   built (`fetch_merge_list_mirrors_fgos_merge_list_json` and its
   retro/cleanup equivalents) — this item only creates/finds the tab and
   locates the left/right pane ids, it does not render content.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | `fg:operation` tab is created eagerly, at herdr-plugin startup — found-or-created by label the same way `main.rs:30` already calls `layout::ensure_cockpit_tab` unconditionally at startup for the `fg:cockpit` tab. Not lazy on first loop-launch attempt (unlike `find_agents_tab_with_room`'s own lazy `fg:agents-N` creation, which is a different mechanism for a different, multi-instance tab). |
| D2 | Left/right pane identity inside `fg:operation` is determined by geometry, not creation order or array position. `layout.rs`'s existing `Rect` struct (`layout.rs:144-147`) only carries `height` today — extend it with `x` (and `width`) fields, parsed from the same pane-layout call `next_split_target` already reads. The pane with the smallest `x` is the left/merge-loop slot; the other is the right/retro-cleanup slot. |

## Pinned assumption (not asked — scoped out, not material to this item)

If `fg:operation` already exists (from a prior herdr session) but does not
have exactly 2 panes — an operator closed one, or split further manually —
this mechanism treats it as an unsupported/error state. It does not attempt
to reconcile pane count back to 2. Not in the item's description, and
robustness for an operator-caused manual edge case is not core scope;
revisit only if it's hit in practice.

## Pinned terms

- **`fg:agents-N`** — existing term (tsk-1q3), unchanged: numbered agent
  tab, 4-pane 2×2 grid cap per tab.
- **`fg:operation`** — new, singular, un-numbered (never `fg:operation-2`)
  fixed tab holding the 2 flexible loop-launch slots.
- **"no room"** — the `pick_status`/error value `open_pick_pane`/
  `PaneOrchestrator` returns once both `fg:agents-N` tabs are full; not a
  queue, not an auto-created 3rd tab.

## Scout evidence

- `herdr-plugin/src/layout.rs:176-206` (`find_agents_tab_with_room`) —
  confirmed no existing cap; always creates the next tab on room-not-found.
  No `LayoutError` variant yet for "no room" (`layout.rs:12-18`).
- `herdr-plugin/src/layout.rs:337-349` (`ensure_cockpit_tab`) and
  `herdr-plugin/src/main.rs:30` — precedent for a fixed, find-or-create,
  label-matched single tab, called eagerly at startup. Basis for D1.
- `herdr-plugin/src/layout.rs:144-147` (`Rect`) — only `height` parsed
  today; no `x`/`width`. Basis for D2 needing a real struct extension, not
  just reading an already-available field.
- `herdr-plugin/src/ports.rs:31-39` (`PaneOrchestrator` trait) — no "no
  room" signal exists on this trait today.
- `fgos tool query --capability impact-analysis --status present` →
  GitNexus `present`. `impact-analysis: full` — planning/implementation
  should run `impact` before editing `find_agents_tab_with_room`/
  `ensure_cockpit_tab`/`PaneOrchestrator` per CLAUDE.md's gate.
- Dependency `tsk-417` ("herdr-plugin: right-side action queues... MERGE
  LIST") is at `status: retrospective` — delivered, satisfied.

## Deferred to planning / out of scope

- Exact `LayoutError`/`pick_status` shape for "no room" — implementation
  choice, not a product decision.
- Which loop launches into which pane and when — tsk-2xt, a separate,
  dependent item.
- Rendering pane content from the `fgos.rs` data source — tsk-417's own
  scope, already delivered; this item only locates the panes.
