# Main checkout single door, repo-lock part: stop-everything landing

Date 2026-10-17, 18:22–18:28. The owner approved the landing ("ok land đi em").

- **Plan:** [plan.md](../261016-1306-main-checkout-single-door-hot-lock/plan.md), phase 10 section C, cut to the repo-lock part. Owner fence F10 held: no state part (`stateTx`, hot-lock, `events.lock`/`claims.lock` merge, claim ceiling), no tombstone for `events.lock`, `claims.lock` or porting.
- **Section A report:** `phase-lead-261017-1649-main-door-p10a-integration-and-full-suite.md`, now on main.

## Result
- **main:** `56f87bf5b`, a fast-forward from `main-door/integration` after main (docs-only commits) was merged into it; holder-lock, `holder-lock-checks` and `registrations` tests then 154 pass, 0 fail, 2 skipped.
- **Release:** `sha256:e74cb03cf90c1d89ae7e4e28c466fbb1b9c5bb9c6e9e93e5cdaa69d71e840149` (709 files), built from main with `cargo build --release --workspace` and `scripts/build-rust-distribution.mjs`.
- **fgctl:** reinstalled at `~/.local/bin/fgctl` (the build without the v1 main-checkout read); `which -a` lists one path. The previous binary (the Rust-callers build) is kept at `.fgos/runtime/tmp/landing-4.3r/fgctl.prev`.
- **Activation:** `fgctl upgrade --from <tree>` in mdview, mcp-skill-hub, then forgentX, all exit 0 with the probe and borrow-vector gate.

## Fences

| Workspace | Fences | How they were placed |
|---|---|---|
| mdview | 216 of 216 | by the `doctor --fix` at the end of `fgctl upgrade` |
| mcp-skill-hub | 17 of 17 | by the `doctor --fix` at the end of `fgctl upgrade` |
| forgentX | 2420 of 2420 | 149 placed through `fixLockFences(root, {excludePids})` |

forgentX's 149 were `main-checkout`, one `merge-slot` per local branch, and dispatch-cwd locks of recent worktrees. Two things had to be handled first:
1. **The stop scan** listed the same ten non-fgOS processes as the two earlier landings (two `mdview serve`, two codex app-server daemons, gitnexus and mdview MCP children of the Claude sessions, the idle session `forgentx-5f` and its shell). None had a file under `.fgos/` or the lock root open (`/proc/<pid>/fd`), so they were excluded instead of killed.
2. **A v1 `.fgos/main-checkout.lock`** blocked placement with `v1-lock-present`. It was a v1 lease record written 2026-10-15 21:49 (`{"pid":"bbe6155f-…","ts":1792075755362}`, a session id, not a live process; v1 leases are file content, not kernel locks). It was moved, not deleted, to `.fgos/runtime/tmp/landing-4.3r/v1-locks-backup/`. The first pre-check missed it because a failing zsh glob for `merge-slot--*.lock` aborted the whole `ls`.

## Doctor through the shim, after fencing

| Check | forgentX | mdview | mcp-skill-hub |
|---|---|---|---|
| lock-kernel-semantics | pass | pass | pass |
| lock-borrow-vectors | pass | pass | pass |
| lock-holders | pass, 0 held | pass, 0 held | pass, 0 held |
| lock-fences | pass, 2420/2420 | pass, 216/216 | pass, 17/17 |
| main-checkout-hook-wired | pass (`core.hooksPath = .githooks`) | not applicable (no `.githooks/`) | not applicable |
| state-root | pass | pass | pass |
| active-release-matches-checkout | pass, changed=0 | skipped (not a source checkout) | skipped (not a source checkout) |

`fgos lock-status` in forgentX: `mainCheckout` free, every registry lock free. The other failing checks are the same as before the landing (`config-not-stale` missing `lock`, `executor-family-unique`, `model-policy-tier-coverage`, `provider-capacity-state`, `executor-profile-warnings`, tool and doc registry checks, `work-step-vocabulary`, `root-drift`, `main-checkout-guard-warnings`, codex trust).

## Smoke
- **Hand commit in main:** this report's commit went through the new hook in the main checkout.
- **`take`/`return` on a real item:** not run in the real workspaces, because the owner's standing rule is not to create work items here. The P10A smoke ran `take`, `pick`, `return`, `approve` (three times), `lock-status`, `lock fence` and a hand commit on a scratch clone activated with a release from the integration branch: no `lock-order-violation`, no unexpected refusal.

## Open worktrees
Branches created before this landing carry the old hook and `src/`: a commit into main from them is refused by the new hook, and their own code meets the tombstones by name. Merge main into each before its next run. Branches created after this step get no merge-slot tombstone; rerun `fgos doctor --fix` after a new local branch while an old release could still run there.

## Rollback
- **Previous release:** `sha256:79ead131ccab9751639751ac3cc0abd947fe05f88384be08a472cb52bb1c1e56` in all three workspaces (`.fgos/runtime/tmp/landing-4.3r/rollback-digests.txt`).
- **Steps:** stop every writer, revert the merge on main, copy `fgctl.prev` back, activate the previous release in the three workspaces, remove the `main-checkout` and `merge-slot` tombstone directories listed by `fenceStatus`. Lock files only; the event log and claim files did not change format.

## Next
- The second machine needs the same landing.
- 4.4b (Windows driver) no longer waits on 4.3-R.

No component-boundary change.
