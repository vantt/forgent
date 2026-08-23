# RESEARCH.md — herdr-plugin auto-merge pane guard/close lifecycle (tsk-5d4)

## Round 1 (2026-08-11)

**Asked:** goal text (tsk-5d4) — ensure herdr-plugin's auto-merge launcher
(fg:operation tab) (1) auto-launches merge-loop when items need merging and
no merge pane is running, (2) never double-launches while one is running,
(3) auto-closes the pane once merge-loop finishes so the guard resets for a
future launch.

**Checked (repo, `rg`/direct reads — all findings cited with `file:line`):**

- `herdr-plugin/src/main.rs:552-576` (`auto_launch_operation_panes`) — the
  real dispatch: reads `autoMerge` toggle (`settings.rs`), calls
  `registry.has_labeled_pane("fgos-auto-merge")` to decide
  `merge_already_running`, launches `launch_merge_loop` only when the
  toggle is on AND the label is not live.
- `herdr-plugin/src/pick.rs:140-152` (`loop_run_argv`) — the argv builder
  `run_merge_loop`/`run_retro_loop`/`run_cleanup_loop` (`pick.rs:209-227`)
  all call. Returns exactly ONE argv entry: `["pane", "run", <pane_id>,
  "claude --dangerously-skip-permissions '/fgOS:merge-loop'"]`. Comment at
  `pick.rs:116`: *"Never carries `--autoClose` (tsk-358 D1 is
  discover-only)"*.
- `herdr-plugin/src/pick.rs:360-370` (`HerdrPaneAdapter::launch_merge_loop`/
  `launch_retro_loop`/`launch_cleanup_loop`) — thin wrappers straight onto
  `run_merge_loop`/`run_retro_loop`/`run_cleanup_loop`. No rename call
  anywhere in this path.
- `herdr-plugin/src/layout.rs:447-474` (`ensure_operation_tab`) — resolves
  the `fg:operation` tab's 2 fixed panes by geometry (`left_right_panes`,
  smallest `x` = left/merge slot). Creates the tab/panes if missing. Never
  renames either pane.
- **Whole-crate check** (`rg '"rename"|pane rename' herdr-plugin/src/*.rs`):
  the ONLY two `pane rename` call sites in the entire crate are
  `layout.rs:369` (`tab rename … "fg:cockpit"`, a TAB rename, unrelated)
  and `pick.rs:254-259`
  (`auto_discover_launch_argv_sequence`, which renames a pane to
  `fgos-auto-discover-<id>` — the `/fgOS:discover` auto-launch path only).
  **No code path anywhere renames a pane to `fgos-auto-merge`,
  `fgos-auto-retro`, or `fgos-auto-cleanup`.**
- Confirmed the same absence holds on the more recent `fgw/tsk-3cs` branch
  worktree too (`.claude/worktrees/tsk-3cs-PHd3yA/herdr-plugin/src/pick.rs`)
  — not something already fixed and unmerged elsewhere.
- `herdr-plugin/src/main.rs:1642-1663` (test
  `auto_launch_operation_panes_never_double_launches_merge` or similar) —
  the test's OWN comment at `main.rs:1648-1649` says *"Tick 2: the fixed
  title is now live (the real launch from tick 1 having registered)"* and
  manually inserts `"fgos-auto-merge"` into the stub registry's
  `live_labels` set to simulate that. This is an assumption baked into the
  test fixture, not something the production code actually does — the test
  passes because it fakes the label being live, not because any real code
  path writes it.
- `docs/history/fgos-terminal-close-autoclose/CONTEXT.md` D1 (tsk-3v2) —
  locked decision: `autoClose` ships ONLY for `/fgOS:pick`/`/fgOS:discover`
  (`open_pick_pane`/`open_discover_pane`). Explicitly out of scope there:
  `/fgOS:decompose`, `/fgOS:retro-next`, `/fgOS:cleanup-next` — the
  merge/retro/cleanup-loop launch path was not even in scope for that
  item's `autoClose` wiring, confirming it never got one later either.
- `docs/explanation/why-auto-launched-herdr-panes-must-be-labeled-before-
  spawning-claude.md` (tsk-2ja/tsk-57q) — explicitly documents the
  label-before-spawn *pattern* (why the auto-discover path renames before
  spawning `claude`, to close a race) and states tsk-57q's launcher needed
  "new trait methods... for the fixed-pane launch and fixed-title guard" —
  but the doc never actually shows tsk-57q's own label-write call, and the
  code confirms none exists.
- `plugins/fgOS/skills/merge-loop/SKILL.md` (full read) — `/fgOS:merge-loop`
  wraps `/loop` around `/fgOS:merge-next` until frontier-empty/iron-law/
  same-id-blocked-twice. It is oblivious to herdr entirely: no pane
  rename, no pane close, no exit signal of any kind back to herdr. It ends
  by printing a chat report inside its own Claude Code session — the
  underlying `claude` process/session does not necessarily terminate,
  and even if it did, nothing in herdr-plugin is watching for that to
  clear the (never-set) label.

## Findings

1. **Confirmed bug, not speculation: the "already running" guard is dead
   for merge/retro/cleanup.** `has_labeled_pane("fgos-auto-merge")` can
   never observe `true` in production because no code ever calls `pane
   rename <pane> fgos-auto-merge`. Consequence: with `autoMerge: true`,
   every 5s poll tick (`POLL_INTERVAL`, `main.rs:20`) that finds the
   toggle on will call `launch_merge_loop` again — i.e. `herdr pane run
   <fixed-left-pane> "claude --dangerously-skip-permissions
   '/fgOS:merge-loop'"` gets re-issued into the SAME fixed pane roughly
   every 5 seconds for as long as `autoMerge` stays on, regardless of
   whether a `/fgOS:merge-loop` session is already running inside it. This
   is a superset of the user's original "doesn't auto-close" concern: the
   guard doesn't even correctly detect "still running", so "auto-close on
   finish" alone would not fix the launcher — the label needs to be
   written on launch AND cleared on finish for the guard to work at all.
2. **`--autoClose` cannot be reused as-is.** It is wired only through
   `run_argv_for_command`/`discover_run_argv` (`pick.rs:116-130`), which
   are per-id verbs (`/fgOS:pick <id>`, `/fgOS:discover <id> --autoClose`).
   `loop_run_argv` (the merge/retro/cleanup path) is a structurally
   different, no-id builder (`pick.rs:140-152`) that never threads any
   flag into the launched command — extending "auto-close on finish" to
   the loop skills needs either a new flag `/fgOS:merge-loop` itself
   understands and acts on at its own stop point (step 6 of its `SKILL.md`,
   "Report on stop"), or a herdr-side mechanism that isn't tied to the
   launched Claude session self-reporting completion at all (e.g.
   `herdr-plugin` polling whether the pane's process is still alive/
   `agent_status` from `pane list`, since `pane_scan.rs`'s own fixture
   (`main.rs`/`pane_scan.rs:173-182`) shows each pane row already carries
   an `agent_status` field ("idle"/"working") separate from `label`).
3. **A fix must cover both ends of the same pane's lifecycle, not just
   the close.** Write side: rename the fixed left/right `fg:operation`
   panes to `fgos-auto-merge`/`fgos-auto-retro`/`fgos-auto-cleanup`
   *before* `pane run` spawns `claude` — the exact same race-closing
   pattern `auto_discover_launch_argv_sequence` (`pick.rs:249-262`)
   already proves for the per-id path, just needing the equivalent
   sequence built for the no-id fixed-pane path (`loop_run_argv` currently
   returns only 1 argv; needs to become `[rename_argv, run_argv]` like
   `auto_discover_launch_argv_sequence` does). Close/reset side: something
   has to clear that label (or otherwise make `has_labeled_pane` return
   `false` again) once `/fgOS:merge-loop` actually stops — candidates are
   (a) teach `/fgOS:merge-loop`'s own "Report on stop" step (SKILL.md
   step 6) to rename the pane back / to a neutral label via a
   herdr-only helper, mirroring `/fgOS:terminal`/`/fgOS:terminal-close`'s
   existing herdr-only-chrome contract, or (b) have herdr-plugin itself
   poll `agent_status`/idle-ness of the fixed pane instead of a static
   label, and treat idle as "not running" — a design choice for planning,
   not this research step.
4. **Retro/cleanup share the exact same gap** (`registry_tick_2`-style
   labels `"fgos-auto-retro"`/`"fgos-auto-cleanup"` never written either,
   same `loop_run_argv` call site) — any fix should cover all three, not
   just merge, since they are the same mechanism (`decide_auto_operation_
   tab_launches`, `main.rs:522-538`).

## Still open (for planning, not this step)

- Which of finding 3's two candidate mechanisms (loop-skill self-close vs.
  herdr-side idle polling) to build — a real design decision, not a
  research question; both are technically viable from the evidence above.
- Whether `/fgOS:retro-loop`/`/fgOS:cleanup-loop` need the identical fix
  in the same item or a follow-up (finding 4 says same root cause; scope
  call is planning's).
