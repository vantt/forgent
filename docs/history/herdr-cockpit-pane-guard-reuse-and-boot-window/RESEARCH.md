# RESEARCH — tsk-40g

## Round 1 (2026-08-12) — Defect 1: reused-pane retirement keys on ANY label, not the live claimant

Goal: verify `herdr-plugin/src/app.rs` retires a reused pane from
`pending_worker_panes` off the previous occupant's stale label.

Checked: `herdr-plugin/src/app.rs:786-836` (`refresh_pane_state`,
`retire_settled_pending_panes`, `doing_item_ids`, `pending_pane_ids`).

Found:
- `retire_settled_pending_panes` (app.rs:805-819) keeps a pane in
  `still_pending` only if it (a) still appears in the fresh scan, and (b)
  its pane_id is NOT present among `labeled.values()` — where `labeled =
  task_id_map(panes)`, i.e. "does this pane carry ANY id-shaped label at
  all". It never cross-checks the label's task id against
  `doing_item_ids()` (app.rs:825-831), which reads the engine's live
  `status: doing` set and already exists in this same impl block for
  exactly that purpose elsewhere (feeds `WorkerLaneView` in
  `launch_worker`, main.rs:254-259) but is not consulted here.
- Doc comment at app.rs:800-804 states the retirement rationale
  explicitly: "that write only happens from inside the launched session
  ... so seeing it is proof the worker booted and claimed" — true only
  for a freshly-split, previously-unlabeled pane. A reused pane already
  carries the PREVIOUS occupant's label before the new worker boots, so
  the very first scan after reuse satisfies the "carries a label" check
  and retires the pane immediately, before the new worker exists.
- No test covers the reused-pane case. Searched `#[cfg(test)]` block in
  app.rs for `retire_settled_pending_panes`/pending-pane tests — the
  fixtures constructing `PaneSnapshot`/labels only exercise an
  unlabeled-then-labeled transition (fresh split), consistent with the
  item's claim.

Verdict for this point: **clear**, defect confirmed as described, current
line numbers match (805-819).

## Round 1 (2026-08-12) — Defect 2: auto-discover has no boot-window guard

Goal: verify `herdr-plugin/src/main.rs` auto-discover launch condition
(~494-501) has no guard against re-launching during the claim/boot window.

Checked: `herdr-plugin/src/main.rs:138-268` (`next_auto_discover_candidate`,
`discovery_worker_alive`, `launch_worker`), `main.rs:462-513` (poll-tick
launch site).

Found:
- Launch condition (main.rs:494-496): `app.orchestrator_settings.auto_discover
  && !discovery_worker_alive(&app.work_items) && next_auto_discover_candidate(&app.work_items).is_some()`.
- `discovery_worker_alive` (main.rs:163-167) is purely engine-state-derived:
  `status == "doing" && item.in_discover_stage()`. It only becomes true
  once the launched session actually runs `fgos take`/`fgos discover`
  against the item — i.e. after boot + claim, not at launch time.
- `next_auto_discover_candidate` (main.rs:138-142) matches `status ==
  "todo"`, which the target item still is until claimed.
- `app.pending_worker_panes` (populated by `launch_worker`, main.rs:263,
  the instant a pane is opened) is NOT consulted anywhere in the
  auto-discover gate above — it is only read via `pending_pane_ids()` to
  build `WorkerLaneView` for the execution lane's own slot arithmetic
  (main.rs:254-259), a separate call path.
- Doc comment at main.rs:486-489 confirms the historical label-mutex was
  removed as a D2 violation ("the engine's own answer" replacing "an
  exact-match probe for a pane label this adapter had planted itself")
  and states no per-tick retry/backoff exists ("never retried within the
  same tick... a fresh read next tick is the only retry").
- Net effect: every tick between launch and claim landing (boot +
  `fgos take` — item's own estimate: ~10-60s), both conjuncts of the
  launch condition stay true, so `launch_worker` fires again each tick.
  `launch_worker` itself only gates on the engine's `fgos slots
  --json` room check (main.rs:245-268), which is also derived from
  `status: doing` and therefore has the identical blind spot during this
  same window.

Verdict for this point: **clear**, defect confirmed as described, current
line numbers match (494-501; `discovery_worker_alive` at 163-167).

## Round 1 (2026-08-12) — Defect 3: admin-lane guard label has no writer

Goal: verify `herdr-plugin/src/main.rs` merge/retro/cleanup loop guards
(~623-625) gate on pane labels that nothing in the repo ever writes.

Checked: `main.rs:552-625` (`decide_auto_operation_tab_launches`,
`auto_launch_operation_panes`), whole-repo grep for the three literal
label strings, `plugins/fgOS/skills/terminal/rename.sh` (the only
pane-labeling call site under `plugins/`/`src/`), `layout.rs:448-463`.

Found:
- main.rs:623-625: `registry.has_labeled_pane("fgos-auto-merge")` /
  `"fgos-auto-retro"` / `"fgos-auto-cleanup"`, each `.unwrap_or(true)`
  (fail-closed toward "treat as already running", per the doc comment at
  main.rs:603).
- Whole-repo grep (excluding `target/`, `node_modules/`) for
  `fgos-auto-merge`, `fgos-auto-retro`, `fgos-auto-cleanup` returns ZERO
  hits outside `main.rs` itself (the three read sites) and its own
  `#[cfg(test)]` stub fixtures (`StubOperationRegistry`,
  `RecordingPickOrchestrator` test setup, ~line 1615+). No production
  code path ever calls a rename/label-write with these exact strings.
- `plugins/fgOS/skills/terminal/rename.sh:88-91` is the only real
  pane-label writer found. Its label shape (rename.sh:87-90): `label =
  "$task_id"`, then optionally ` | fg.ssid:<v>` and ` | a.ssid:<v>`
  appended — always task-id-first, never one of the three fixed slot
  strings above.
- `layout.rs:461`: `run_herdr(herdr_bin, &["tab", "rename", tab_id,
  "fg:cockpit"])` inside `ensure_cockpit_label` (layout.rs:451-463) — a
  `herdr tab rename` call, operating on a tab id, not a `pane rename`
  call. Confirms the claim that this is a tab rename, not a pane rename,
  and therefore not a candidate writer for the admin-lane pane guard
  either.
- The "never-double-launches" test
  (`auto_operation_tab_launcher_never_double_launches_merge_across_two_ticks`,
  main.rs:1669+) uses `StubOperationRegistry::has_labeled_pane` backed by
  a `live_labels: HashSet<&'static str>` the test populates directly —
  its own comment claims tick 2 reports the label live "as a real herdr
  scan would once tick 1's launch registers", but no real code registers
  that label, so the premise the comment states is false in production.
  The test proves `decide_auto_operation_tab_launches`'s pure decision
  logic only; it never proves the real guard becomes true after a real
  launch, because nothing makes it true.
- Config confirms the toggles are off by default today
  (`read_herdr_orchestrator_toggles`, main.rs:532-550, defaults every
  field to `false` on any missing/malformed config) — consistent with
  the item's "latent, armed the moment one is flipped" framing.

Verdict for this point: **clear**, defect confirmed as described, current
line numbers match (623-625; writer at rename.sh:91; layout.rs:461).

## Overall

All three defects verified against live code, not stale. No open
questions remain — proceeding to discovery verdict `clear`.
