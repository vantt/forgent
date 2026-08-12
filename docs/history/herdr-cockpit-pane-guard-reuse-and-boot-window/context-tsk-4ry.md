# CONTEXT — tsk-4ry: herdr admin-lane loop relaunch guard

## Feature boundary

Third of tsk-40g's three defects (see the shared `RESEARCH.md`/`plan.md`
in this same directory for the full evidence on all three). Scope here is
narrow: `herdr-plugin/src/main.rs`'s admin-lane launcher
(`auto_launch_operation_panes`, `decide_auto_operation_tab_launches`) that
gates relaunching the merge/retro/cleanup loops on
`registry.has_labeled_pane("fgos-auto-merge"/"-retro"/"-cleanup")` —
labels nothing in the repo ever writes (confirmed by a whole-repo grep,
see `RESEARCH.md` Round 1). This item fixes that guard.

## Scout evidence (impact-analysis posture: full — GitNexus present,
checked this session)

- `src/state/worker-slots.mjs:39-59` — D9 (own file, already locked,
  cited verbatim): "the admin lane never claims a work item at all...
  there is nothing here to count, and nothing for a liveness filter to
  reclaim — the reservation is constant by definition." The engine
  deliberately does NOT track admin-lane occupancy. This rules out
  replicating defect 2's fix pattern (`discovery_worker_alive`, an
  engine-truth query) here — there is no engine signal to ask.
- `docs/history/orchestrator-worker-slots/DISCUSSION.md` D2 (labels are
  for humans, never read to decide) and the Round 6-8 arc (hard
  state-transition liveness, explicitly rejecting heuristics/guesses) —
  resolves EXECUTION-lane worker liveness only. Never covers a
  long-running ADMIN loop's relaunch-after-natural-exit question.
- `herdr-plugin/src/pane_scan.rs` — `PaneSnapshot` deliberately excludes
  `agent_status` (present in herdr's raw JSON, never parsed into
  `PaneRow`); reading it is forbidden outright by
  `docs/operator-runbook-herdr-cockpit.md`'s Hard rule (cited in
  `pane_scan.rs`'s own doc comment on `focused`). No liveness signal is
  available through the pane registry either.
- `docs/history/orchestrator-worker-slots/DISCUSSION.md` §6 line 482:
  "Lane admin — nhãn cố định theo slot (`fg:operation`), do adapter đặt
  một lần khi dựng tab, không đổi theo item" (admin lane — fixed slot
  label, set ONCE by the adapter when building the tab, never changes per
  item). This settles WHO writes the display label (the adapter, once,
  at tab-build time) but does not by itself answer whether that label may
  be READ to decide a relaunch — D2 says no, labels are never read to
  decide, full stop.
- `/fgOS:merge-loop`/`/fgOS:retro-loop`/`/fgOS:cleanup-loop` (plugin skill
  descriptions) confirm these loops have real, designed stop conditions
  ("until nothing is left or a safety condition trips" — pool empty is a
  NORMAL, frequent exit, not a crash).

## Candidate decision (NOT YET LOCKED — parked, see below)

**Should a merge/retro/cleanup admin loop auto-relaunch after it exits
naturally (pool empty, a normal and frequent event), or launch once per
toggle-flip (a one-shot latch that only relaunches after a person
manually turns the toggle off and back on)?**

This is material (changes real, operator-visible behavior of the
`autoMerge`/`autoRetro`/`autoCleanup` toggles), grounded (cites the two
locked decisions above that block both of the mechanically obvious
"just fix the read side" answers), and answerable (a person can pick one
of the two shapes below, or name a third). It is not something this
skill may guess: the only D2-consistent, engine-signal-free mechanism
identified — an adapter-local one-shot "already launched this toggle-on
period" latch — trades today's bug (relaunches every tick) for a
DIFFERENT behavior change (never relaunches after a natural pool-empty
exit) that nothing in the item's own description or the locked decisions
above confirms is actually wanted.

A second, related wrinkle worth deciding at the same time: any adapter-
local latch (in `App`, never persisted) is forgotten on a herdr-plugin
restart. For `pending_worker_panes`/`pending_discover_pane` (defects 1-2)
that is correct — those windows are ~10-60s, so a restart mid-window is
already an edge case the item doesn't need to protect against. An admin
loop can run for hours; a herdr-plugin restart mid-loop would forget the
latch immediately, so on the very next tick after a restart the guard
would permit a fresh relaunch into a pane whose loop process might still
be genuinely alive and running — the reused-pane class of bug defect 1
just fixed, recurring here in a different shape, with no `doing_item_ids()`
equivalent available to cross-check against.

Two concrete shapes to choose between (or name a third):

- **(a) One-shot latch, accept the restart gap.** Simplest, fully
  D2-consistent, matches every locked decision above literally. Costs:
  never auto-relaunches after a normal pool-empty exit (operator must
  toggle off/on by hand); a herdr-plugin restart mid-loop can still
  double-launch, same failure shape as defect 1 but with no available
  fix (no engine signal, no liveness read) — acceptable only if that
  restart case is rare/tolerable in practice.
- **(b) Something the person names** — e.g. accept relaunch-on-exit as
  the actual intended behavior of these toggles (closer to "keep this
  running" semantics) via a mechanism not yet identified in the repo, or
  accept the double-launch-after-restart risk as out of scope entirely
  and only fix the "relaunches every tick while still running" half of
  the bug.

## Outstanding questions

Parked via `fgos ask tsk-4ry` — see the item's own `awaiting-human`
question. Not `None`: this is the one decision this item cannot lock
without a person.
