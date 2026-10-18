# terminal-control (plan 6.5): stop-everything landing

Date 2026-10-18, 04:15–04:45, on the owner's machine. The owner told the lane lead on 10-18 to coordinate the lanes to the end and land on his own ("em tự điều phối để các lane làm việc cho tới khi xong nhé. cần land thì em tự land").

- **Plan:** [plan.md](../261016-1306-terminal-control-rust-core-herdr-driver/plan.md); phase 09 section A: [report](phase-lead-261018-0410-terminal-control-p09a-integration-and-real-herdr.md).
- **Phase reports:** P02–P08 on `terminal-control/integration` (`phase-lead-261018-*-terminal-control-*`).

## Fix landed with it
`fgos run` never chose a herdr invocation, on main as well: `executeAssignment` and `executeExecutorCli` merged the default `runner.executor` over `executors.claude` and dropped its `invocations`. Fixed on main first (`f3dbc5e1d`): one helper `withDefaultExecutor` (`src/runner/dispatch/config.mjs`) keeps the registered entry when the default runs the same program and replaces it when it runs another one. Tests: `test/runner/default-executor-merge.test.mjs` 6/6; dispatch, herdr, provider-adapter, assignment-dispatch, execution, spawn-worker, architecture 1614 run, 0 fail.

## Result
- **main:** `119823fc6`, a fast-forward from `terminal-control/integration` after main (with the fix and 5 docs commits of the second machine) was merged into it.
- **Full `npm test`** on the integration tip with a host built from it (private target, quiet machine for the rerun): 8217 tests, 8106 pass, 6 fail in the loaded run; the four failing files rerun alone: 247 of 249 pass. The two left fail without this plan as well:
  - `test/state/hot-lock-host-judge.test.mjs` "a host that cannot be run": fails the same in the main checkout (the host fallback finds a binary); a follow-up of the 4.4b landing.
  - `test/setup/skill-wrappers.test.mjs`: the generated `.claude/skills/instruction-audit` wrapper exists only untracked in the main checkout, so every worktree lacks it.
- **Release:** `sha256:6208cb3ed91cd4bfcfcf08072aa3d80f7360f0c9d50931e5c751249fbb7e30f4` (`cargo build --release --workspace`, `scripts/build-rust-distribution.mjs`; the host binary carries the `terminal-control` route).
- **fgctl:** unchanged (byte-identical to the installed one).
- **Activation:** `fgctl upgrade --from <tree>` in mdview, mcp-skill-hub, forgentX, all exit 0; `.fgos/distribution.json` restored to main's value. `fgos setup` in each, exit 0.
- **Fences:** mdview 219/219 and mcp-skill-hub 20/20 unchanged; forgentX 2473/2473 after placing 31 new unit-run lock paths through `fixLockFences(root, {excludePids})` (the same ten non-fgOS processes as earlier landings plus this session's own process chain; none had a file under `.fgos/` open).

## Doctor through the shim

| Check | forgentX | mdview | mcp-skill-hub |
|---|---|---|---|
| terminal-control | pass, herdr, 12 capabilities | pass | pass |
| terminal-config | pass | pass | pass |
| terminal-allocations | pass | pass | pass |
| lock-fences / lock-holders | pass, 2473/2473, 0 held | pass | pass |
| active-release-matches-checkout | pass, changed=0 | skipped | skipped |

The other failing checks are the same set as before (forgentX drops `config-not-stale`, which now passes).

## Smoke
- `fgos dispatch explain --for execute` in forgentX: executor `claude`, invocation `claude-herdr-bwrap`, transport herdr.
- One read-only `fgos run --provider claude` in a scratch clone of mdview carrying forgentX's config (no state written in the real workspaces): adapter `herdr-spawn`, pane allocated through terminal-control in workspace `wS`, outcome `blocked` with the named reason "the agent is showing a dialog that needs an answer" (Claude's trust dialog for a new folder), pane released, no tab left. The same run with mdview's own config used `cli-spawn`, because mdview's `executors.claude` declares no herdr invocation.
- Open: one round settled end to end per CLI in a trusted folder (plan criterion 6) is still unrun; P09A drove allocate, launch, read, inspect and release through the route on real herdr for claude, omp and pi.

## Rollback
Stop writers, revert the merge on main (keep `f3dbc5e1d`), activate `sha256:0c43eb1d…` in the three workspaces (`.fgos/runtime/tmp/landing-6.5/rollback-digests.txt`). `stateRoot/terminal/` can stay.

## Next
- Plan 6.2 resumes (P09, then P12 section A) and lands the same way.
- 6.3 waits for 6.2.
- The second machine lands this release on its own.

Component boundary: as recorded by P08 in [`component-boundary.md`](../../docs/platform/component-boundary.md) (Terminal-control row); no further change here.
