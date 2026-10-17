# Holder-lock landing on the second machine (`~/projects/forgent`)

Date 2026-10-17, 14:01–14:07. The owner approved the landing after every other session on this machine stopped writing ("em land đi, các phiên xong hết, không còn ghi"). This follows the first landing on the other machine, [landing-261017-1219-holder-lock-stop-everything-landing.md](landing-261017-1219-holder-lock-stop-everything-landing.md).

## Result

- **Workspace:** only `/home/vantt/projects/forgent` on this machine runs fgOS. `~/projects/mdview` here has no `.fgos/installation` (never activated), so it was not touched.
- **Source:** `main` at `b675d43ff`, fast-forwarded from origin. The uncommitted work of other sessions in the main checkout (`.fgos/config.json`, `AGENTS.md`, `.claude/settings.json`, two docs, the `model-pool-config-additive-slice` phase-00 file, two tests) was stashed for the fast-forward and restored unchanged; it was not committed and is not in the release.
- **Release:** `sha256:e5e7c2f988b1ce252ecfa6d1de8174db22c1c07fb11f5578cb85705290c96b4f`, 696 files, built in a clean detached worktree at `b675d43ff` (`cargo build --release --workspace`, then `scripts/build-rust-distribution.mjs --repo-root <worktree> --out <dir outside the checkout>`), so no uncommitted file entered the payload. The build worktree and the staged tree were removed afterwards; the release stays in the machine store.
- **fgctl:** reinstalled with `cargo install --path apps/fgctl --root ~/.local` from the same worktree. The previous binary is kept at `.fgos/runtime/tmp/landing-4.2-this-machine/fgctl.prev`.
- **Activation:** `fgctl upgrade --from <staged tree>` exited 0; the activation gate (probe plus borrow vectors) passed. Active `e5e7c2f9…`, previous `9a2b27f0…` (recorded in `.fgos/runtime/tmp/landing-4.2-this-machine/activation.prev.json`).
- **Fences:** 192 of 192 placed by `fixLockFences(root, {excludePids, hostBin})` from the new release's payload, not by `fgos doctor --fix` (that would run every registered fix, including render regeneration in a checkout holding other sessions' work).

## Stop check

The new host's `fgos internal quiesce-scan` matched 11 processes, all by cwd only: idle Claude sessions (four resumed, one fresh, this session and its pty host) and their shells, plus the scan's own pipeline. None had a file under `.fgos/` or the lock root open (`/proc/<pid>/fd` checked for each). They were added to `excludePids`; the placement was run from outside the checkout so the placing process itself did not match. Same deviation as the first landing; its proposal (match cwd only for fgOS payloads and the host, list other matches as information) still stands.

## Doctor through the shim, after fencing

| Check | Result |
|---|---|
| lock-kernel-semantics | pass (flock, kernel exclusion and borrow, two-process probe green) |
| lock-borrow-vectors | pass (4 vectors and sibling check, git 2.53.0) |
| lock-holders | pass, 0 held |
| lock-fences | pass, 192/192 |
| lock-predecessor-kill-wait | pass (2000 ms, global) |
| state-root | pass (`~/.local/state/fgos`, pinned) |
| active-release-matches-checkout | fail as expected: changed 2, missing 4; the working tree holds other sessions' uncommitted files that the clean release does not contain. It turns green once that work is committed and a release is built from it |

Other failing checks existed before the landing and are not caused by it: `config-not-stale`, `model-policy-tier-coverage`, `tool-registry-configured`, `work-step-vocabulary`, `doc-current-path-missing`, `doc-source-conservation`, `executor-profile-warnings`, `agent-cli-project-trusted`.

A smoke read (`fgos list --json`, 269 items) works on the new release.

## Before the landing, on this machine

An untracked `.fgos/locks/sessions.lock` (13:37) existed before the activation, so some process had already run the new lock code against this workspace while the old release was active. No process held it at landing time. Nothing else from the mixed period was found.

## Rollback

Stop every writer; `fgctl repair` (or activate `9a2b27f0…` from the machine store); restore `fgctl.prev`; remove the 192 fences listed by `fenceStatus`. No data needs to move back.
