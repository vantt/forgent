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

## Additional scout evidence (this session, post-answer)

- `herdr-plugin/src/pick.rs:406-438` (`HerdrPaneAdapter`) — today
  `launch_merge_loop`/`launch_retro_loop`/`launch_cleanup_loop` each run
  `run_merge_loop`/`run_retro_loop`/`run_cleanup_loop`, which launch the
  perpetual `/fgOS:merge-loop`/`/fgOS:retro-loop`/`/fgOS:cleanup-loop`
  skills into the fixed `fg:operation` slot panes
  (`herdr-plugin/src/ports.rs:76-86`, `PaneOrchestrator` trait doc
  comments, confirm the mapping explicitly).
- The `/fgOS:merge-loop`/`retro-loop`/`cleanup-loop` skills (plugin skill
  index) are themselves already `/loop` wrapped around
  `/fgOS:merge-next`/`retro-next`/`cleanup-next` — one real item at a
  time, with pool-empty as one of their own documented stop conditions.
  So today's admin loop is not a raw infinite shell loop; it is a
  self-pacing session that keeps re-invoking its own `-next` skill until
  the pool empties, then the whole pane invocation ends on its own. The
  bug (`tsk-40g`) is that herdr's poll-tick guard cannot tell that pane is
  now idle again, so it stacks a fresh `/fgOS:merge-loop` launch into it
  on every tick regardless.
- `herdr-plugin/src/main.rs:138-172` + `herdr-plugin/src/app.rs:840-868`
  — the sibling fix for defect 2 (auto-discover) already solves an
  adjacent version of this exact problem for the WORKER lane:
  `discovery_worker_alive` reads real engine truth (an item claimed at
  `status: doing` in a discovery-tracked stage) because `/fgOS:discover-next`
  holds that claim for its entire run; `pending_discover_pane` is a
  purely adapter-local (never persisted) bookkeeping field that closes the
  ~10-60s boot window before that claim lands, and clears itself via
  `retire_settled_pending_discover_pane` once the launched pane is no
  longer in `pending_worker_panes` (i.e. the pane scan shows it gone, or
  the claim has landed).
- Unlike `/fgOS:discover-next`, `/fgOS:merge-next`/`retro-next`/
  `cleanup-next` (`plugins/fgOS/skills/merge-next/SKILL.md`) do not hold
  any lingering claimed-item state for the run's duration — `fgos merge
  next` is one CLI call with no intermediate "doing" status window. So
  the discover lane's exact mechanism (`status: doing` as ground truth)
  cannot be replicated literally here, same conclusion `worker-slots.mjs`
  D9 already reached for the admin lane in general — but the **adapter-
  local pane-liveness half** of that fix (`pending_discover_pane`-style
  bookkeeping, cleared once herdr's own pane scan shows the launched pane
  is no longer running) has no such obstacle: it never depended on the
  item claim in the first place, it only ever tracked "is the pane I
  launched still alive." This is left for `fgos-coding-planning` to
  design concretely — it is a mechanism choice, not a product decision.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | herdr's admin-lane auto-launch stops invoking the perpetual `/fgOS:merge-loop`/`/fgOS:retro-loop`/`/fgOS:cleanup-loop` skills. It invokes the single-item `/fgOS:merge-next`/`/fgOS:retro-next`/`/fgOS:cleanup-next` skills instead — one ready item per pane-launch, not a self-repeating sweep. |
| D2 | Each toggle's (`autoMerge`/`autoRetro`/`autoCleanup`) relaunch guard becomes a two-part, per-tick check: (a) no `x-next` run of that kind is currently in-flight in its pane, AND (b) the corresponding ready pool (`merge`/`retro`/`cleanup` candidates) still has at least one item. Both re-checked fresh every poll tick — never a one-shot latch, never inferred from a stale loop-start snapshot. |
| D3 | The `/fgOS:merge-loop`/`retro-loop`/`cleanup-loop` skills themselves are unchanged and stay callable for manual/interactive use — this item only changes which skill herdr's own auto-launch path invokes, per its stated footprint (`herdr-plugin/src/main.rs`, `herdr-plugin/src/pane_scan.rs`; any adapter-bookkeeping addition needed for D2 lands in `herdr-plugin/src/pick.rs`/`app.rs` alongside the existing `pending_discover_pane` precedent, not in the `-next`/`-loop` skill files). Pinned as an assumption (not asked): scope stays Rust-side wiring only, matching what the item already declared before this decision. |

Rationale for D1/D2 (recorded via `fgos decision`): a person-supplied
product decision replacing the original two-option ask — see
`docs/history/herdr-cockpit-pane-guard-reuse-and-boot-window/CONTEXT.md`
tsk-4ry `gates.answer` for the verbatim answer.

## Pinned terms

- **"in-flight" (D2)** — a pane that herdr itself launched to run one
  `/fgOS:merge-next` (or `retro-next`/`cleanup-next`) invocation, whose
  session has not yet finished/exited. Not an item-level status (these
  `-next` skills hold no lingering claim) and never read from a pane
  label's content (D2 of the parent research doc still holds: labels are
  for humans, occupancy is engine/adapter state).

## Outstanding questions

None
