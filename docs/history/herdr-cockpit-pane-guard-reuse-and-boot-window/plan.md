# Plan — tsk-40g: herdr cockpit pane-guard fixes (3 defects)

Mode: standard

## Bootstrap note

No `fgos-coding-exploring` round ran for this item — discovery verdict was
`clear` (see `RESEARCH.md`), which skips straight to `planning`. There is
no `CONTEXT.md`; the item's own `description` field (already precise,
line-anchored, with fix direction stated for defects 1-2) plus
`RESEARCH.md`'s live-code verification stand in as the locked scope for
this plan. No decision here reopens anything — there was nothing locked
yet to reopen.

Lane decided directly (fgos-routing was not invoked ahead of this session
— direct-entry fallback, `fgos-coding-planning` D1's own Bootstrap step
2). Flags counted against the item: **existing covered behavior** (the
fresh-split retirement test and the merge-loop end-to-end/never-double-
launch tests already cover the code paths being changed and must keep
passing) and **story-sized behavior** (three independently-diagnosed
defects in the same guard family, not one small edit). 2 flags →
**standard**.

`impact-analysis: full` — GitNexus registered and `present`
(`fgos tool query --capability impact-analysis --status present`, checked
2026-08-12). `impact()` will be run on every touched symbol before editing
it, per `CLAUDE.md`'s gate, at `fgos-coding-implement`.

## Approach

Three independent defects in the herdr-plugin pane-guard family, one crate,
one shared verify command already on the item
(`cargo test --manifest-path herdr-plugin/Cargo.toml && cargo build
--release --manifest-path herdr-plugin/Cargo.toml`) — kept as ONE item, not
split. Rationale: all three touch the same small footprint already
declared (`app.rs`, `main.rs`, `layout.rs`, `pane_scan.rs`), share one test
suite and one build, and none blocks or depends on either of the others —
splitting would just fragment one coherent "guard family" review into three
PRs reviewing the same handful of files with no unblocking benefit
(`fgos graph --what-if` was not run per-defect since there is nothing
downstream in the work graph to unblock differently between them — this
item has no children today, `deps: []`).

### Defect 1 — reused-pane retirement (app.rs:805-819)

Fix direction is already stated on the item verbatim: "retire only when
the label names an id the engine actually reports at doing, or when the
pane is gone." Concretely: `retire_settled_pending_panes` currently drops
a pane from `still_pending` the instant ANY label is found on it. Change
the filter so a labeled pane is only dropped when the label's task id is
present in `doing_item_ids()` (already exists, app.rs:825-831, just not
consulted here) — an unlabeled pane keeps today's behavior (drop when
gone from the scan), a pane labeled with an id that is NOT `doing` (a
stale reused-pane label) stays pending until either the label changes to
a real `doing` id or the pane itself disappears.

Risk: **low**. Pure function, already covered by an existing test for the
fresh-split case (must keep passing unmodified in behavior); the new
reused-pane case gets its own test. Proof point: a new unit test that
seeds `pending_worker_panes` with a pane already carrying a stale (not
`doing`) label and asserts it survives `retire_settled_pending_panes`,
plus the existing fresh-split test still green.

### Defect 2 — auto-discover boot-window guard (main.rs:494-501)

Fix direction is stated on the item at a design level, not a literal
diff: "the engine stays the source of truth but the adapter needs its own
already-launched-not-yet-landed term." `app.pending_worker_panes` already
exists and already gets the launched pane inserted the instant
`launch_worker` opens it (main.rs:263) — including for an auto-discover
launch, since `open_auto_discover_pane` goes through the same
`launch_worker`. The gap is that the auto-discover condition
(main.rs:494-496) never reads `pending_worker_panes` at all. Approach:
add a check — no pane is currently pending that was opened for
auto-discover specifically — to the launch condition, so the tick-after-
launch, pre-claim window stops re-firing. This needs `pending_worker_panes`
(or a new adjacent field) to distinguish "a discover launch is in flight"
from "an execution-lane launch is in flight" — today's set is undifferen-
tiated, and gating auto-discover on "any pending pane at all" would wrongly
block it behind an unrelated execution-lane launch.

Risk: **medium** — this needs a real design call between (a) reusing
`pending_worker_panes` with a per-purpose tag, or (b) a new dedicated
field (e.g. `pending_discover_pane: Option<String>`) mirroring the shape
`pending_worker_panes` already uses but scoped to exactly the one
auto-discover slot (`next_auto_discover_candidate` only ever picks one
candidate per tick, so a single `Option<String>` is enough — no need for
a set). (b) is simpler and does not touch the existing execution-lane
`pending_worker_panes` semantics at all, so it is the working assumption
for `fgos-coding-implement`, pinned as an ASSUMPTION below (not proven yet).
Proof point: a test that launches an auto-discover pane once, then asserts
a second tick (before `discovery_worker_alive` would ever become true)
does NOT launch again, then asserts a THIRD tick — after the pending pane
either resolves to a real `doing` claim or disappears from the scan —
launches correctly resume being possible.

### Defect 3 — admin-lane guard has no writer (main.rs:623-625)

The item names the bug precisely but does not prescribe a literal fix the
way defects 1-2 do beyond "violates D2 the same way" — this is the
plan's own least-settled point. Two candidate directions, recorded here
rather than picked blind:

- **(a) Adapter-local pending flag**, same shape as defect 2's fix:
  `App` tracks "this loop was launched at tick T, not yet confirmed" per
  loop (merge/retro/cleanup), independent of any chrome label.
- **(b) Have the launcher itself write the fixed label** at launch time
  (`herdr pane rename <pane_id> "fgos-auto-merge"` etc., issued in Rust
  right after `launch_merge_loop`/`launch_retro_loop`/`launch_cleanup_loop`
  return — the same `run_herdr`/rename-if-not-already shape
  `layout.rs::ensure_cockpit_label` already uses for the tab, adapted to
  a pane). Trade-off found during Approach: these three panes are FIXED
  pane ids (`panes.merge`/`.retro`/`.cleanup`, created once by
  `ensure_operation_tab`, never re-split) — so a label written once at
  launch stays on the pane forever, even after the loop process inside it
  exits or crashes, which would make `has_labeled_pane` permanently true
  and block any future relaunch after a crash. That failure mode is not
  in scope of what the item describes (today's failure is "relaunches
  every tick," not "never relaunches after a crash"), but a fix that
  trades one bug for the other is not an honest fix.

Risk: **high** (the one hard-gate-adjacent item here — this changes
"existing covered behavior" the `never_double_launches` test currently
locks in, per its own comment quoted in `RESEARCH.md` describing a false
premise about a real writer). Proof point, required before implementation
starts on this one specifically at `fgos-coding-validating`: read
`pane_scan.rs`/the `herdr` CLI surface for a liveness signal (a pane's
"is process still running" flag, if `herdr pane get`/`scan_panes` exposes
one) that could distinguish "labeled and the loop is still actually
running" from "labeled but the loop already exited" — if one exists, (b)
plus that liveness check is likely the more D2-consistent fix (a label a
real writer actually sets, cross-checked against real liveness, mirrors
how defect 1's own fix cross-checks a label against `doing_item_ids()`);
if no such signal exists anywhere in scope, fall back to (a). This
decision is explicitly deferred to `fgos-coding-validating`'s reality check,
not guessed here.

## Assumptions (unproven — `fgos-coding-validating` to confirm or reject)

- Defect 2: a new `pending_discover_pane: Option<String>` field
  (dedicated, not folded into `pending_worker_panes`) is the right shape;
  not yet checked against whatever `fgos-coding-validating` finds when it reads
  `pane_scan.rs`'s existing `PaneSnapshot`/`task_id_map` shapes to confirm
  no existing structure already covers this.
- Defect 3: no verdict yet between (a) and (b) — genuinely open, see risk
  map above.
- All three fixes ship in one commit under this one item (no split) —
  `fgos-coding-validating` should also sanity-check this against the actual diff
  size once each fix is drafted; if the diff turns out large enough to
  make one commit hard to review honestly, a split via `fgos add --parent`
  is still available at that point.

## Order

No `fgos graph --what-if` distinction applies (no children, no downstream
work to differentially unblock). Within the one item: defect 1 first (low
risk, fix direction fully specified, unblocks nothing but is the fastest
proof of the "guard cross-checks live doing-state" pattern the other two
reuse), then defect 2 (medium risk, same pattern, new field), then defect
3 last (high risk, still-open design call, benefits most from having the
other two landed and tested first as a working reference for what a
correct D2-consistent guard looks like in this codebase).

## Outstanding questions

None
