# Main door state part (4.3-S) and Windows driver (4.4b): landing on the second machine (`~/projects/forgent`)

Date 2026-10-18, 00:30–00:39. The owner asked for it ("sau khi không còn tiến trình nào ghi thì em làm việc này nhé: landing 4.3-S và 4.4b"). This follows the owner-machine landings [4.3-S](landing-261017-2123-main-door-state-wave-stop-everything-landing.md) and [4.4b](landing-261018-0021-windows-driver-linux-workspaces-landing.md); 4.4a and 4.3-R were already landed here. Both lanes land as one release, because main carries both.

## Result

- **Workspace:** only `/home/vantt/projects/forgent` on this machine runs fgOS.
- **Source:** `main` at `47f961186`, which contains the 4.3-S landing `c2cadb082` and the 4.4b landing `d9d527ad6`. Built in a clean detached worktree outside the checkout, so no uncommitted file of another session entered the payload.
- **Release:** `sha256:4b90becbcae2eaa249fe3299f46d65aacce01af569575683a652cc889230ef73`, 709 files (`cargo build --release --workspace`, then `scripts/build-rust-distribution.mjs`). It differs from the owner machine's `0c43eb1d…` only by docs commits made on main after `d9d527ad6`.
- **fgctl:** reinstalled with `cargo install --locked --path apps/fgctl --root ~/.local` from the same worktree; previous binary kept at `.fgos/runtime/tmp/landing-4.3s-4.4b-this-machine/fgctl.prev`.
- **Activation:** `fgctl stage` and `fgctl upgrade --from <tree>` exited 0. Active `4b90becb…`, previous `df7a1a04…` (saved in `.fgos/runtime/tmp/landing-4.3s-4.4b-this-machine/rollback-digest.txt`). The pin in `.fgos/distribution.json` was restored to main's value. The other sessions' uncommitted files (`AGENTS.md`, `.claude/settings.json`, `CLAUDE.md`, `.fgos/config.json`) have identical hashes before and after.
- **Fences:** 45 placed, 213 already there; `lock-fences` reports 261 of 261. Among them the three 4.3-S tombstones (`.fgos/events.lock`, `.fgos/runtime/claims.lock`, `.fgos/porting/events.lock`) and dispatch-cwd paths created since the last landing. Placed by `fixLockFences(root, {excludePids, hostBin})` from the new release's payload, run from `/tmp`, not by `fgos doctor --fix`.

## Stop check

No `fgos`, `fgctl` or gateway process was running, and no process had a file open under `.fgos/` or the state root (`/proc/<pid>/fd` checked for every process) before the activation and again before fencing. None of the three v1 state lock files existed before the landing. Six idle processes matched the repository by cwd only (resumed Claude sessions and their shells, this session included); they were excluded rather than stopped, as in the earlier landings. The council and proof runs of the Git G0 work had all settled before the activation.

## Doctor through the shim, after fencing

| Check | Result |
|---|---|
| lock-kernel-semantics | pass |
| lock-borrow-vectors | pass (4 vectors and sibling check, git 2.53.0) |
| lock-holders | pass, 25 lock files of 18 locks, 0 held |
| lock-fences | pass, 261/261 |
| lock-record-unreadable | pass, 2 hot records absent or judgeable |
| lock-predecessor-kill-wait | pass (2000 ms, global) |
| main-checkout-hook-wired | pass |
| state-root | pass |
| active-release-matches-checkout | fail, not caused by this landing: changed=0, 4 files missing in release, all under `.agents/skills/instruction-audit/` (git-ignored by `/.agents/skills/*`, created 2026-10-17 14:11 by another session). It turns green when that skill is either rendered from source or removed |

The other failing checks are the same set as before the earlier landings here: `config-not-stale`, `model-policy-tier-coverage`, `tool-registry-configured`, `work-step-vocabulary`, `doc-current-path-missing`, `doc-source-conservation`, `executor-profile-warnings`, `agent-cli-project-trusted`.

## Smoke

- `fgos lock-status`: `mainCheckout` free, no holders.
- `fgos list --json`: 269 items, read through the new state path.
- State writes were not run on this workspace, per the owner's rule not to create work items here; S5 covered every state verb on a scratch clone.

## Open worktrees

Branches created before this landing still carry the old `src/state/events.mjs` and meet the tombstones at `events.lock` and `runtime/claims.lock`. Merge main into each before its next run.

## Rollback

Stop every writer; copy `fgctl.prev` back; activate `df7a1a04…` (`fgctl repair` or from the machine store); remove the three state tombstone directories and `.fgos/locks/state.hot` / `porting-events.hot` if present. The event log and claim files did not change format.
