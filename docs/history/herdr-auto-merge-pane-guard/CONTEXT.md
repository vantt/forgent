# CONTEXT.md — herdr-plugin auto-merge/retro/cleanup pane lifecycle (tsk-5d4)

## Feature boundary

herdr-plugin's `fg:operation` auto-launcher (tsk-57q) is supposed to: (1)
auto-launch `/fgOS:merge-loop`/`/fgOS:retro-loop`/`/fgOS:cleanup-loop` when
its own toggle is on and no such loop is already running, (2) never
double-launch while one is running, (3) close the pane for real once the
loop finishes cleanly, resetting the guard for a future launch. `RESEARCH.md`
(same directory) proved (2) is currently dead code for all three loops — no
pane is ever labeled `fgos-auto-merge`/`fgos-auto-retro`/`fgos-auto-cleanup`
anywhere in the crate, so `has_labeled_pane` can never observe `true` and
every 5s poll tick relaunches regardless of whether a loop is already
running. This item fixes the whole lifecycle for all three loop types.

## Locked decisions

| ID | Decision |
|----|----------|
| D1 | Fix all three auto-launch types in this one item — merge, retro, AND cleanup — not just merge as originally worded. Same root cause (`loop_run_argv`, `pick.rs:140-152`), same call site (`decide_auto_operation_tab_launches`, `main.rs:522-538`); fixing one and leaving the other two with the identical live bug is not an acceptable stopping point. |
| D2 | **Supersedes tsk-57q/tsk-5lr's fixed-2-pane-by-geometry design for `fg:operation`** (`docs/history/herdr-operation-tab-layout/CONTEXT.md` D1/D2: "left is always merge-loop slot, right always retro/cleanup slot, resolved by x-coordinate"). Panes inside `fg:operation` become **on-demand, per-active-loop** — the same pattern `tsk-2ja`'s auto-discover mechanism already uses successfully for `fg:agents-N`: label-before-spawn (`herdr pane rename` before `claude` is spawned, closing the same race `auto_discover_launch_argv_sequence`, `pick.rs:249-262`, already closes), one dynamically-split pane per active loop, no fixed left/right slot. The `fg:operation` TAB itself stays the one thing found-or-created by label (`ensure_operation_tab`'s existing tab-level logic is unaffected); only the pane-resolution-by-geometry part (`left_right_panes`) is retired. |
| D3 | Close mechanism reuses the existing `--autoClose` + `/fgOS:terminal-close` convention verbatim (`docs/history/fgos-terminal-close-autoclose/CONTEXT.md` D1/D2), extended to the 3 loop skills: `/fgOS:merge-loop`/`/fgOS:retro-loop`/`/fgOS:cleanup-loop` each gain the same optional trailing `--autoClose` token `/fgOS:pick`/`/fgOS:discover` already parse, threaded into the launch argv the same way `discover_run_argv` already carries it (`pick.rs:130`). Each loop skill calls `/fgOS:terminal-close` as the literal last action ONLY on its own genuine natural-finish stop (frontier empty — `merge-loop/SKILL.md` step 4's "frontier empty" bullet) — never on a block, Iron Law, no-progress, or same-id-blocked-twice stop, mirroring D2 of the terminal-close CONTEXT.md exactly (pane stays open on error so a person can debug). Because D2 above makes panes dynamic-per-loop (not a fixed shared slot), `terminal-close`'s real `herdr pane close` no longer conflicts with any fixed-pane invariant — the earlier-surfaced conflict (closing a fixed operation-tab pane would strand `ensure_operation_tab` in its own documented "tab exists, <2 panes" unsupported state) is resolved by D2 removing that invariant, not by avoiding `terminal-close`. |
| D4 | Retro and cleanup drop their current mutual exclusion. Today `choose_right_pane_loop`/`pick_right_pane_loop`/`RightPaneLoop` (`main.rs:480-538`) pick only ONE of retro/cleanup to run at a time, by priority, because both were forced to share the single fixed "right" slot (D2's target design). Once panes are on-demand per loop (D2), retro and cleanup each get their own independently-launched, independently-guarded (`fgos-auto-retro`/`fgos-auto-cleanup`) pane — both toggles being on simultaneously is now valid and expected, not arbitrated. `choose_right_pane_loop`/`pick_right_pane_loop`/`RightPaneLoop` become dead code to remove as part of this fix, not something to keep working around. |
| D5 | New hard-coded cap, analogous to `MAX_AGENT_TABS = 2` (tsk-5lr, scoped to `fg:agents-N`): `fg:operation` may hold **at most 4 concurrent panes**. A launch attempt beyond the cap is refused and swallowed the same way `place_new_agent_pane`'s existing cap-refusal already works for auto-discover (skip this tick, retry next tick, no error surfaced) — today's 3 loop types (merge/retro/cleanup) fit under this cap with headroom for 1 more; the exact constant is a locked product decision, not derived from the 3-loop count alone. |

## Pinned terms

- **`fg:operation` tab** — unchanged: the one fixed, find-or-create-by-label
  (`"fg:operation"`) tab holding every auto-launched merge/retro/cleanup
  pane. Still singular, still `ensure_operation_tab`'s job to find or
  create (tab-level logic only, per D2).
- **`fgos-auto-merge` / `fgos-auto-retro` / `fgos-auto-cleanup`** —
  unchanged reserved pane-label strings (already excluded from
  `pane_scan.rs`'s `extract_task_id`, per
  `docs/explanation/why-auto-launched-herdr-panes-must-be-labeled-before-
  spawning-claude.md`). What changes is WHEN they get written (now: before
  every dynamic launch, per D2) and WHEN they get cleared (now: pane
  genuinely closes via `terminal-close`, per D3 — no separate "clear
  label" step needed, since a closed pane no longer appears in `pane list`
  at all).
- **`--autoClose`** — same opt-in, never-a-default parameter
  `/fgOS:pick`/`/fgOS:discover` already carry (tsk-3v2 D1), now also
  accepted by `/fgOS:merge-loop`/`/fgOS:retro-loop`/`/fgOS:cleanup-loop`.

## Scout evidence

- `RESEARCH.md` (this directory) — full round-1 findings: confirmed no
  code path anywhere writes `fgos-auto-merge`/`-retro`/`-cleanup`
  (`pick.rs`, `layout.rs`, whole-crate `rg` check, cross-checked against
  the `fgw/tsk-3cs` worktree branch too); the guard-passing unit test
  (`main.rs:1642-1663`) manually fakes the label into its stub registry
  rather than exercising a real write path.
- `herdr-plugin/src/pick.rs:140-152` (`loop_run_argv`), `:209-227`
  (`run_merge_loop`/`run_retro_loop`/`run_cleanup_loop`), `:360-370`
  (`HerdrPaneAdapter` trait impls) — the launch path this item's fix
  touches.
- `herdr-plugin/src/layout.rs:408-474` (`find_operation_tab`,
  `left_right_panes`, `ensure_operation_tab`) — the fixed-2-pane
  resolution D2 retires; `left_right_panes`'s own doc comment already
  names "manually-edited `fg:operation` tab" with <2 panes as an
  unsupported/error state — the exact state D3's original `terminal-close`
  proposal would have driven the system into every time a loop finished,
  before D2 removed the invariant that made it an error.
- `herdr-plugin/src/pick.rs:249-296` (`auto_discover_launch_argv_sequence`,
  `open_auto_discover_pane`) — the label-before-spawn pattern D2 extends
  to `fg:operation`'s dynamic panes.
- `plugins/fgOS/skills/terminal-close/SKILL.md`,
  `plugins/fgOS/skills/discover/SKILL.md` (autoClose wiring, lines 37-46,
  148-163), `plugins/fgOS/skills/pick/SKILL.md` (autoClose wiring, lines
  22-32, 182-198) — the exact existing convention D3 extends to the 3 loop
  skills.
- `plugins/fgOS/skills/merge-loop/SKILL.md` (full read) — step 4's stop
  taxonomy (frontier empty / self-resolve no-progress / same-id-blocked-
  twice) is what D3's "only close on genuine natural-finish" branches on;
  `/fgOS:retro-loop`/`/fgOS:cleanup-loop` were not read in full this round
  (same `/loop`-wrapper shape per their own SKILL.md descriptions) —
  planning should confirm their own stop taxonomy matches before wiring
  `--autoClose` into them identically.
- `docs/history/herdr-operation-tab-layout/CONTEXT.md`,
  `docs/history/fgos-terminal-close-autoclose/CONTEXT.md` — the two
  decision records D2/D3 explicitly supersede or extend.
- `fgos tool query --capability impact-analysis --status present` →
  GitNexus `present` → **impact-analysis: full** per `CLAUDE.md`'s gate.
  GitNexus's own index counts (12247 symbols) are drawn from this JS/TS
  repo; `herdr-plugin` is a separate Rust crate whose own symbol coverage
  in that index was not verified this round — planning/implementation
  should run `impact` on the specific Rust symbols it touches
  (`loop_run_argv`, `left_right_panes`, `choose_right_pane_loop`, etc.) and
  treat a suspiciously-empty result as worth a manual `rg` cross-check
  first, per this repo's own capability-gate guidance, rather than trusting
  a clean scan blind.
- No prior `judgeDiscovery` verdicts existed before this item's own
  two rounds (`view.discovery["tsk-5d4"]`, both `clear: true`, recorded
  during the `clarify`/`discovery` stages that already ran for this item).

## Outstanding questions

None
