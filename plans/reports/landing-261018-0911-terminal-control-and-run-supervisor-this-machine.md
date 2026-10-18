# terminal-control (6.5) and run supervisor (6.2): landing on the second machine (`~/projects/forgent`)

Date 2026-10-18, 08:45–09:11. The owner asked for it ("pull và landing 6.2 và 6.5"). It follows the owner-machine landings [6.5](landing-261018-0438-terminal-control-stop-everything-landing.md) and [6.2](landing-261018-0833-run-supervisor-direct-mode-stop-everything-landing.md). Both lanes land as one release, because main carries both.

## Result

- **Workspace:** only `/home/vantt/projects/forgent` on this machine runs fgOS.
- **Source:** `main` at `92af7c8d6` (fast-forward from `46ae4d668`), containing `119823fc6` (6.5) and `13199adb4` (6.2). Built in a clean detached worktree outside the checkout, removed afterwards.
- **Release:** `sha256:f88afb1769b78b06f3b4c4d7c6bf8b1ec4bcc848ced5828453f546dc4eb60374`, 723 files (`cargo build --release --workspace`, then `scripts/build-rust-distribution.mjs --out <tree>`). It differs from the owner machine's `e95c130d…` only by docs commits made on main after `13199adb4`.
- **fgctl:** reinstalled with `cargo install --locked --path apps/fgctl --root ~/.local` from the same worktree; previous binary kept at `.fgos/runtime/tmp/landing-6.5-6.2-this-machine/fgctl.prev`.
- **Activation:** `fgctl stage` and `fgctl upgrade --from <tree>` exited 0. Active `f88afb17…`, previous `4b90becb…` (`rollback-digest.txt` in the same directory). The pin in `.fgos/distribution.json` was restored to main's value. `fgos setup` exited 0. The uncommitted files of other sessions (`AGENTS.md`, `.claude/settings.json`, `CLAUDE.md`, `.fgos/config.json`) have identical hashes before and after.
- **Fences:** 17 placed, 257 already there; `lock-fences` reports 277 of 277. Placed by `fixLockFences(root, {excludePids, hostBin})` from the new release's payload, run from `/tmp`. The excluded pids were the eight idle processes whose cwd is in the repository (resumed Claude sessions and their shells, this one included).

## Stop check

No `fgos`, `fgctl` or gateway process was running, and no process had a file open under `.fgos/` or the state root (`/proc/<pid>/fd` of every process), before the build and again right before the activation.

## Doctor through the shim

Pass: `lock-kernel-semantics`, `lock-borrow-vectors`, `lock-holders` (32 files of 18 locks, 0 held), `lock-fences` 277/277, `lock-record-unreadable`, `lock-predecessor-kill-wait`, `state-root`, `main-checkout-hook-wired`, the hook checks, `process-containment` (`bwrap-pidns`, level kernel), `run-supervisor-route`, `runtime-socket-dir`, `run-attempts-stuck` (217 open, none stuck), `gate-kill-grace`, `terminal-control` (herdr, 12 capabilities), `terminal-config`, `terminal-allocations`.

Fail, same families as before this landing: `active-release-matches-checkout` (changed=0, 4 files missing in release, all under the git-ignored `.agents/skills/instruction-audit/`), `model-policy-tier-coverage`, `tool-registry-configured`, `work-step-vocabulary`, `doc-current-path-missing`, `doc-source-conservation`, `executor-profile-warnings`, `agent-cli-project-trusted`.

## Smoke

- `fgos dispatch explain --for execute` answers through the new release; `fgos lock-status` runs.
- No `fgos run` and no state write on this workspace, per the owner's rule not to create work items here.

## Finding

`fgos setup` and `fgos doctor` regenerate `docs/decisions/index.md` from this machine's own event log, which does not hold D-ADR0056 (recorded on the owner machine). The regenerated file loses that row. It was restored with `git checkout` after each run; do not commit the regenerated file until the decision events are shared.

## Still open

- Workspaces under `/tmp`: direct mode ends `gate-lost` (follow-up on the board).
- `hot-lock-host-judge` red on main; `skill-wrappers` fails only where the untracked wrapper is missing.
- Plan 6.5 criterion 6 (one full round per CLI in a trusted folder) unrun.
- No workspace is activated on Windows.

## Rollback

Stop every writer; copy `fgctl.prev` back; activate `sha256:4b90becb…` (`fgctl repair` or from the machine store). Before deactivating, run `fgos internal adopt --protocol 1 --scan` over `.fgos/assignments/*/*/*/runs/*` until `run-attempts-stuck` is clean; v2 attempt homes are kept by the old release.
