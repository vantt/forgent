# Main checkout single door, state part (wave S): stop-everything landing

Date 2026-10-17, 21:15–21:25, on the owner's machine. The owner authorized the lane lead to run the lock lanes to the end, landings on this machine included, at 19:05 ("nếu không có gì quan trọng cần hỏi em được phép điều phối cho xong hết việc").

- **Plan:** [plan.md](../261016-1306-main-checkout-single-door-hot-lock/plan.md), block "CẮT LẠI 2026-10-17 18:50", wave S (S1–S5) and phase 10 section C cut to the state part.
- **Section A report:** `phase-lead-261017-2104-main-door-state-s05-integration-and-full-suite.md`, now on main.

## Result
- **main:** `c2cadb082`, a fast-forward from `main-door-state/integration` after main was merged into it, pushed. The merge conflicted in `docs/platform/event-store/spec.md` §13: both sides had corrected the `state` lock file name; main's wording (the event store session owns that spec) was kept. Then holder-lock, `holder-lock-checks`, state, architecture, `registrations` and `check-decision-citation-drift`: 1565 run, 1563 pass, 0 fail, 2 skipped.
- **Release:** `sha256:b31b7526293fc9e09bd6176c84e179d02a1e700f99752f2e2cef3fb5c9cbab31`, built from main with `cargo build --release --workspace` and `scripts/build-rust-distribution.mjs`; the payload carries `src/state/hot-lock.mjs`.
- **fgctl:** unchanged from the repo-lock landing (byte-identical build); `which -a` lists one path.
- **Activation:** `fgctl upgrade --from <tree>` in mdview, mcp-skill-hub, then forgentX, all exit 0. The `.fgos/distribution.json` pin that the upgrade wrote was restored to main's value (per-machine digest).

## Before the landing
- No lead session and no `fgos`/`fgctl` process was running; the two lead chains had finished.
- None of the three v1 files (`.fgos/events.lock`, `.fgos/runtime/claims.lock`, `.fgos/porting/events.lock`) existed in any workspace, so no v1 holder could be alive.

## Fences

| Workspace | Fences | How they were placed |
|---|---|---|
| mdview | 219 of 219 | by the `doctor --fix` at the end of `fgctl upgrade` |
| mcp-skill-hub | 20 of 20 | by the `doctor --fix` at the end of `fgctl upgrade` |
| forgentX | 2449 of 2449 | 29 placed through `fixLockFences(root, {excludePids})` |

The three state paths per workspace are now tombstone directories. forgentX's 29 also covered lock paths of unit runs and lead worktrees created since the last landing. The stop scan listed the same ten non-fgOS processes as the three earlier landings (two `mdview serve`, two codex app-server daemons, gitnexus and mdview MCP children, the idle session `forgentx-5f` and its shell); none had a file under `.fgos/` or the lock root open (`/proc/<pid>/fd`), so they were excluded instead of killed.

## Doctor through the shim, after fencing

| Check | forgentX | mdview | mcp-skill-hub |
|---|---|---|---|
| lock-kernel-semantics | pass | pass | pass |
| lock-borrow-vectors | pass | pass | pass |
| lock-holders | pass, 0 held | pass, 0 held | pass, 0 held |
| lock-fences | pass, 2449/2449 | pass, 219/219 | pass, 20/20 |
| lock-record-unreadable | pass, 2 hot records absent or judgeable | pass | pass |
| main-checkout-hook-wired | pass | not applicable | not applicable |
| active-release-matches-checkout | pass, changed=0 | skipped | skipped |

The other failing checks are the same set as before the landing (`config-not-stale` missing `lock`, tool and doc registry, `work-step-vocabulary`, `root-drift`, `main-checkout-guard-warnings`, `provider-capacity-state`, `executor-profile-warnings`, codex trust).

## Smoke
- `fgos lock-status`: `mainCheckout` free; every registry row free, `state` and `porting-events` included.
- `fgos list`: reads the Work view through the new path.
- Hand commit in main: this report's commit passed the hook.
- State writes on a real workspace were not run, because the owner's standing rule is not to create work items here. S5 ran every state verb (`add`, `edit`, `take`, `pick`, `return`, `approve`, `move`), a porting write, two `fgos run` units and a workflow step on a scratch clone with a release from this branch: no `exec-under-hot-lock`, `hot-lock-reentry` or `lock-order-violation`.

## Open worktrees
Branches created before this landing still carry the old `src/state/events.mjs`; their code meets the tombstones at `events.lock` and `runtime/claims.lock` by name. Merge main into each before its next run.

## Rollback
- **Previous release:** `sha256:e74cb03cf90c1d89ae7e4e28c466fbb1b9c5bb9c6e9e93e5cdaa69d71e840149` in all three workspaces (`.fgos/runtime/tmp/landing-4.3s/rollback-digests.txt`).
- **Steps:** stop every writer, revert the merge on main, activate the previous release in the three workspaces, remove the `events.lock`, `runtime/claims.lock` and `porting/events.lock` tombstone directories, and delete `.fgos/locks/state.hot` and `porting-events.hot` if present. The event log and claim files did not change format.

## Next
- The second machine lands wave S on its own.
- 6.2 P09 and the event store's Work cutover phase no longer wait on 4.3.

Component boundary: as recorded by S4 in [`component-boundary.md`](../../docs/platform/component-boundary.md) (the state store owns the `state` hot-mutex); no further change here.
