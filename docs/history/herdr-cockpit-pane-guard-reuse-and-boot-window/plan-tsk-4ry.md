# Plan — tsk-4ry: admin-lane (merge/retro/cleanup) loop relaunch guard

Mode: standard. 2 flags: **existing covered behavior** (the
`auto_operation_tab_launcher_never_double_launches_merge_across_two_ticks`
test in `herdr-plugin/src/main.rs` currently passes only because it stubs
`has_labeled_pane` as the occupancy signal — the exact mechanism this item
replaces, so the test's own premise changes, not just its assertions) +
**weak proof around the area** (no engine or pane-liveness signal for the
admin lane exists yet anywhere in the repo; `docs/history/
herdr-cockpit-pane-guard-reuse-and-boot-window/plan.md`'s own reality-gate
round called this "the one hard-gate-adjacent item" in the family and
required a person's decision before any fix could be shaped — which
`CONTEXT.md` D1-D3 now supplies). No hard-gate flag (auth/data-loss/
audit/external-provider/removing-validation) applies, so this stays
standard rather than high-risk now that the product decision is locked.

No `fgos graph --what-if` distinction applies: `tsk-4ry` has no
dependencies and no children of its own (`fgos graph --json`, checked this
session: it does not appear on the current critical path, `topUnblock` is
empty for it — a standalone leaf, nothing downstream to differentially
unblock).

`impact-analysis: full` — GitNexus registered and `present` (`fgos tool
query --capability impact-analysis --status present`, checked
2026-08-13). `impact()` will be run on every touched symbol before editing
it, per `CLAUDE.md`'s gate, at `fgos-coding-implement`.

## Bootstrap

`docsRef` → `docs/history/herdr-cockpit-pane-guard-reuse-and-boot-window/`.
This item's own `CONTEXT.md` is `context-tsk-4ry.md` in that directory
(the family's established per-child naming — see the sibling
`context-tsk-3q8z` equivalent, actually named inline in `plan-tsk-3q8z.md`
since that child skipped `exploring`). Locked decisions D1-D3 there are
the only source of truth for this plan; nothing here reopens them.

Lane decided directly (`fgos-routing`'s Orient step was not invoked ahead
of this session — direct-entry fallback, this skill's own Bootstrap step
1 D2). Flags counted per `fgos-routing`'s own Mode-gate list, above.

## Approach

CONTEXT.md D1 replaces WHICH skill herdr launches for the three admin
toggles; D2 replaces the relaunch guard's whole shape; D3 pins the scope
to Rust wiring only. Concretely, three change sites, all inside
`herdr-plugin`:

### 1. Swap the launch target (`herdr-plugin/src/pick.rs`)

`MERGE_LOOP_SLASH_COMMAND`/`RETRO_LOOP_SLASH_COMMAND`/
`CLEANUP_LOOP_SLASH_COMMAND` (pick.rs:36-38) and the three functions that
use them, `run_merge_loop`/`run_retro_loop`/`run_cleanup_loop`
(pick.rs:280-309), currently launch `/fgOS:merge-loop`/`retro-loop`/
`cleanup-loop`. Per D1, these become (new or renamed) constants/functions
launching `/fgOS:merge-next`/`retro-next`/`cleanup-next` instead — same
`loop_run_argv`-shaped plumbing, only the slash-command string and
function name change. `HerdrPaneAdapter::launch_merge_loop`/
`launch_retro_loop`/`launch_cleanup_loop` (pick.rs:431-439) and the
`PaneOrchestrator` trait itself (ports.rs:76-86) keep their existing
method names per D3 (Rust-side wiring only, no reason to rename the
trait's public surface) — only their doc comments and bodies change to
name the new `-next` target; the perpetual `-loop` skills stay unchanged
and callable manually (D3).

### 2. Per-tick "in-flight" bookkeeping (`herdr-plugin/src/app.rs`)

Per the `CONTEXT.md` scout finding: unlike `/fgOS:discover-next`,
`/fgOS:merge-next`/`retro-next`/`cleanup-next` hold no lingering claimed
work-item status for their run's duration (`fgos merge next` is one CLI
call, not a claim-and-hold), so `discovery_worker_alive`'s exact mechanism
(read `status: doing` off `app.work_items`) cannot be reused literally.
The available signal is the same one `pending_discover_pane`/
`pending_worker_panes` already use for the boot-window problem: is the
specific pane herdr itself launched still present in the herdr pane scan.
Add `pending_merge_pane`/`pending_retro_pane`/`pending_cleanup_pane:
Option<String>` to `App` (mirroring `pending_discover_pane`, app.rs:310),
set when `auto_launch_operation_panes` actually fires a launch, and retire
each the same way `retire_settled_pending_discover_pane` does
(app.rs:864-869) — cleared once the pane id is no longer present in a
scan. `pending_worker_panes`'s existing "gone from scan" half of its own
rule (app.rs:840-852) already generalizes to any pane id, so this can
likely reuse `retire_settled_pending_panes`'s scan-membership check
directly rather than duplicating it three times — a mechanism detail for
`fgos-coding-implement` to resolve while reading the existing code fresh, not
designed further here.

### 3. Rewire the guard (`herdr-plugin/src/main.rs`)

`decide_auto_operation_tab_launches` (main.rs:591-601) and
`auto_launch_operation_panes` (main.rs:626-652) currently compute
`merge_already_running`/etc. from `registry.has_labeled_pane(...)`. Per
D2, each becomes a two-part check: (a) the corresponding
`pending_*_pane` from step 2 is `None` (no in-flight run), AND (b) a
ready-candidate exists for that lane. For (b), mirror
`next_auto_discover_candidate`'s shape (main.rs:138-140: filters
`app.work_items`, which the poll tick already fetches via `fgos triage
--json`, so no extra call) — merge candidates are ranked
`awaiting-approval` items (`/fgOS:merge-list`'s own ranking: dependency-
wait clear, no footprint conflict), retro candidates are `delivered`
items, cleanup candidates are `retrospective` items past their TTL
(`src/state/cleanup-pool.mjs`'s own pre-filter). **Not yet confirmed**:
whether `app.work_items`'/`WorkItem`'s existing fields carry enough to
compute the cleanup TTL check client-side, or whether that needs its own
data source — flagged in Assumptions below for `fgos-coding-validating`.
`registry.has_labeled_pane` stops being called for these three lanes
entirely once this lands (its only other caller, if any, is unaffected
per D3's scope).

## Risk map

| Area | Risk | Proof point |
|---|---|---|
| `pick.rs` launch-target swap | low | existing `never_double_launches`-style test (rewritten per below) asserts the launched command string is `/fgOS:merge-next`, not `/fgOS:merge-loop` |
| `app.rs` new `pending_*_pane` fields + retirement | medium (new state, mirrors a proven pattern but not yet written for 3 lanes at once) | a test that launches an admin pane once, asserts a second tick (pane still in scan) does not relaunch, then asserts a third tick (pane gone from scan) allows a relaunch — same shape as defect 2's own auto-discover boot-window test in the sibling item |
| `main.rs` guard rewire (drop `has_labeled_pane`, add pool-nonempty) | medium | a test with toggle on, no pending pane, but an EMPTY pool asserts no launch fires (the other half of D2, distinct from the in-flight half) |
| `auto_operation_tab_launcher_never_double_launches_merge_across_two_ticks` (main.rs:1680) | **must be rewritten, not just kept green** | this test's current tick-2 assertion works by stubbing the registry to report `fgos-auto-merge` as already labeled — the exact D2-violating mechanism being removed. Its replacement must simulate the new pending-pane state instead of a labeled registry, or it will silently stop testing anything real once `has_labeled_pane` is no longer read for this decision |
| cleanup TTL data availability for the pool-nonempty check | unconfirmed | `fgos-coding-validating` reads `WorkItem`'s current fields against `src/state/cleanup-pool.mjs`'s TTL logic to confirm whether a client-side check is possible or a new fetch is needed |

## Assumptions (unproven — `fgos-coding-validating` to confirm or reject)

- `pending_merge_pane`/`pending_retro_pane`/`pending_cleanup_pane` as three
  dedicated `Option<String>` fields (mirroring `pending_discover_pane`) is
  the right shape, rather than one generalized map/set — not yet checked
  against whether `retire_settled_pending_panes`'s existing logic can be
  reused as-is or needs a shared helper extracted first.
- The cleanup lane's pool-nonempty check can reuse data already present in
  `app.work_items` (TTL-elapsed status per `cleanup-pool.mjs`) without a
  new per-tick fetch — unconfirmed, see risk map.
- All three lanes' guard rewiring, plus the new bookkeeping fields, ship
  in one commit under this one item (no split) — same footprint family
  (`herdr-plugin/src/main.rs`, `pick.rs`, `ports.rs`, `app.rs`), one shared
  verify command already on the item. If the diff turns out too large to
  review honestly as one commit, `fgos add --parent tsk-4ry` remains
  available.

## Order

1. Add the `pending_*_pane` fields and their retirement logic to `app.rs`
   (new state, no behavior change yet — same order the sibling item used
   for its own new field).
2. Swap `pick.rs`'s launch targets from `-loop` to `-next`.
3. Rewire `main.rs`'s guard to consult the new fields plus each lane's
   pool-nonempty check, dropping `has_labeled_pane` for these three call
   sites.
4. Rewrite `never_double_launches` (and add the pool-empty/pane-still-
   pending proof points from the risk map) last, once the real mechanism
   it needs to assert against exists.

## Outstanding questions

None
