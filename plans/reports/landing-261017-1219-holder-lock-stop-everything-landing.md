# Holder-lock landing on main: stop-everything, activate, fence

Date 2026-10-17, 12:11–12:30. The owner approved the landing ("ok làm đi").

- **Plan:** [plan.md](../261016-1104-holder-lock-kernel-lock-foundation/plan.md), phase 12 section B.
- **Section A report:** `phase-lead-261017-1123-holder-lock-p12a-integration-and-full-suite.md`. It was written on the integration branch and is now on main.

## Result
- **main:** `fb3f4a4bd`, pushed. It is a fast-forward from `holder-lock/integration`, after origin/main was merged into integration. The 4 commits that came from origin/main changed only docs.
- **Release:** `sha256:af277e023d0112f06eb03525fe338adb1b7a3ab4523dc31e3540cb3d312f2597`, built from `fb3f4a4bd` with `cargo build --release --workspace` and `scripts/build-rust-distribution.mjs`.
- **fgctl:** the new `fgctl` is installed at `~/.local/bin/fgctl`. The previous binary is kept at `.fgos/runtime/tmp/landing-4.2/fgctl.prev`.
- **Activation:** `fgctl upgrade --from <tree>` activated the release in forgentX, mdview and mcp-skill-hub. The activation gate (probe plus borrow vectors) was green in all three.
- **Fences:**

| Workspace | Fences | How they were placed |
|---|---|---|
| mdview | 196 of 196 | by the `doctor --fix` that runs at the end of `fgctl upgrade` |
| mcp-skill-hub | 12 of 12 | by the `doctor --fix` that runs at the end of `fgctl upgrade` |
| forgentX | 2255 of 2255 | 2251 placed by hand, see "Two deviations" |

## Doctor through the shim, after fencing

| Check | forgentX | mdview | mcp-skill-hub |
|---|---|---|---|
| lock-kernel-semantics | pass | pass | pass |
| lock-borrow-vectors | pass | pass | pass |
| lock-holders | pass, 0 held | pass, 0 held | pass, 0 held |
| lock-fences | pass, 2255/2255 | pass, 196/196 | pass, 12/12 |
| state-root | pass | pass | pass |
| active-release-matches-checkout | pass, changed=0 | skipped (not a source checkout) | skipped (not a source checkout) |

## Two deviations in forgentX
1. **The stop scan reports any process whose cwd is in the workspace, not only fgOS processes.** It listed 10 processes:
   - 2 `mdview serve`;
   - 2 codex app-server daemons (tetcu72);
   - the gitnexus and mdview MCP children of the two Claude sessions;
   - the idle Claude session `forgentx-5f`, held read-only by message, and its shell.

   None of them had an fgOS lock file open, checked through `/proc/<pid>/fd`. The codex daemons hold only codex's own `.lock` files. Instead of killing the owner's processes, the fences were placed through `fixLockFences(root, {excludePids})`, with these 10 pids added to the own pid chain. The scan with that exclusion list came back clean.
2. **Four old `advance.lock` files blocked the placement with `v1-lock-present`.** They were under:
   - `wf-run-1791479133716-34d92648`
   - `wf-run-1791706617162-24fd2476`
   - `wf-run-1791978093009-f75132c6`
   - `wf-run-1792050621283-b8ccbcd1`

   They were left by crashed workflow runs between 10-09 and 10-15, and every recorded holder pid is dead. They were moved, not deleted, to `.fgos/runtime/tmp/landing-4.2/v1-locks-backup/`. The fix then placed 2251 fences; 4 were already there.

Earlier in the day, orphan pid 1042700 was killed with `kill -9`. It was a leaked gateway test fixture that ignores SIGTERM.

## Not done, or left as is
- **`config-not-stale: missing keys: lock`** in all three workspaces. The project config has no `lock` section. The global config has `lock.predecessorKillWaitMs: 2000`, and doctor reads it from there. The fix is `fgos setup` in each workspace. It was not run in the shared main checkout, because setup regenerates tracked render surfaces.
- **The other doctor failures are not caused by this landing:** expired provider quarantine, root drift, tool registry, doc registry, executor-profile warnings, xai `nano` tier in mdview and mcp-skill-hub, and codex trust for forgentX.
- **Step B6, rebasing open worktrees:** the open branches belong to other sessions and were not rebased. An old branch that runs its own code against the fences fails loudly by design. The doc-plan 260925 lead (`forgentx-5f`) was told to merge main before its next run.
- **`mdview--wt--dogfood-agents`** has no activation; it holds only an old `events.jsonl` from 10-04. Nothing was activated there.

## Rollback
- **Previous release:** `sha256:84cf340fae55cb2e80f3e70eb4560ae33beda8cf842ee44ef4e82288c3f26a19` in all three workspaces. The digests are recorded in `.fgos/runtime/tmp/landing-4.2/rollback-digests.txt`.
- **Steps:** follow the phase-12 rollback for after step B4: stop every writer, revert the merge, activate the previous release, then remove the fences.

## Follow-ups for 4.3
- Lock order is not checked across doors.
- `lock-holders` cannot see an orphaned borrowed daemon.
- The stop scan's cwd match counts non-fgOS processes (editors, MCP servers, other CLIs' daemons). A person then has to judge each one, and excluding a process works only through the module API, not the CLI. **Proposal:** keep the cwd match for fgOS payloads and the host, and list other cwd matches as information.
