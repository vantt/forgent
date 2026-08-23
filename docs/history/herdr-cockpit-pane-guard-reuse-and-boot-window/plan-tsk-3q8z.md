# Plan — tsk-3q8z: reused-pane retirement + auto-discover boot-window guard

Mode: standard (child of tsk-40g, inherits the parent's already-locked
scope — no `fgos-coding-exploring` round needed; see the parent's own
`plan.md` Bootstrap note for why there is no `CONTEXT.md`). 2 flags:
existing covered behavior (both fixes touch functions with passing tests
that must keep passing unmodified in their currently-covered case) +
story-sized behavior (two related fixes, one crate).

`impact-analysis: full` (GitNexus present, checked at the parent's own
planning round, same session, same repo state).

This item's own scope is exactly the parent `plan.md`'s "Defect 1" and
"Defect 2" sections (`docs/history/herdr-cockpit-pane-guard-reuse-and-boot-window/plan.md`)
— reproduced here only as a pointer, not restated, per "never reopen a
decision already locked": both fix directions, risk levels (low / medium),
and proof points are already written there and apply unchanged to this
item.

## Approach (pointer)

- Defect 1 (app.rs:805-819): cross-check the label's task id against
  `doing_item_ids()` before retiring a pending pane. Risk: low.
- Defect 2 (main.rs:494-501): add `pending_discover_pane: Option<String>`,
  set on auto-discover launch, consulted in the launch gate, cleared once
  the pane disappears or resolves to a real `doing` claim. Risk: medium.

Order: defect 1 first (simpler, same cross-check pattern the reader will
recognize before meeting defect 2's new field), then defect 2.

## Assumptions

- `pending_discover_pane` as a dedicated field (not reusing
  `pending_worker_panes`) is the right shape — carried over from the
  parent plan's own Assumptions list, still unproven until written; if
  `fgos-coding-implement` finds a cleaner existing seam while reading
  `app.rs`/`main.rs` fresh, it may use it instead as long as the same
  test-visible behavior (no relaunch during the boot window, relaunch
  resumes once the window closes) holds.

## Outstanding questions

None
