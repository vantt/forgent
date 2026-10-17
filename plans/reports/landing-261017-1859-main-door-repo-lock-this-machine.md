# Main checkout single door, repo-lock part: landing on the second machine (`~/projects/forgent`)

Date 2026-10-17, 18:54–19:00. The owner asked for it ("pull code để land 4.3", then "pull lại xem có gì để land chưa"). This follows the landing on the owner's machine, [landing-261017-1827-main-door-repo-lock-stop-everything-landing.md](landing-261017-1827-main-door-repo-lock-stop-everything-landing.md), and uses the same steps as the 4.4a landing here, [landing-261017-1643-rust-callers-holder-lock-this-machine.md](landing-261017-1643-rust-callers-holder-lock-this-machine.md).

## Result

- **Workspace:** only `/home/vantt/projects/forgent` on this machine runs fgOS.
- **Source:** `main` at `0ce859c7a`, which contains the 4.3-R landing commit `56f87bf5b`. The uncommitted files of other sessions in the main checkout (`AGENTS.md`, `.claude/settings.json`) are not in the payload; `active-release-matches-checkout` reports changed=0 after activation.
- **Release:** `sha256:df7a1a043a5c7325ca5d87ab30e05934e35a1d7c56f1a3d13ef03201fc212759`, 709 files, built with `cargo build --release --workspace` and `scripts/build-rust-distribution.mjs`. It differs from the owner machine's `e74cb03c…` only by the docs commits made on main after `56f87bf5b`.
- **fgctl:** reinstalled with `cargo install --locked --path apps/fgctl --root ~/.local`; `which -a fgctl` lists one file. The previous binary is kept at `.fgos/runtime/tmp/landing-4.3r-this-machine/fgctl.prev`.
- **Activation:** `fgctl stage` and `fgctl upgrade --from <tree>` exited 0. Active `df7a1a04…`, previous `2895ff70…` (saved in `.fgos/runtime/tmp/landing-4.3r-this-machine/rollback-digest.txt`). The upgrade did not change the other sessions' uncommitted files (`AGENTS.md`, `.claude/settings.json`, `CLAUDE.md`, `.fgos/config.json` hashes identical before and after); it rewrote the pin `.fgos/distribution.json` to `df7a1a04…`.
- **Fences:** 2 placed, 214 already there, 216 of 216 in all. The 2 were the 4.3-R tombstones `.fgos/main-checkout.lock` and `.fgos/merge-slot--main.lock`. They were placed by `fixLockFences(root, {excludePids, hostBin})` from the new release's payload, run from `/tmp`, not by `fgos doctor --fix`, which would also run the render fixes in a checkout holding other sessions' work.

## Stop check

No fgOS or `fgctl` process was running. No v1 `.fgos/main-checkout.lock` lease was present, so nothing had to be moved aside (unlike the owner machine). The stop scan matched by cwd only: idle Claude sessions and their shells, including this session's. None had a file under `.fgos/` or the lock root open (`/proc/<pid>/fd` checked for each); they were excluded instead of stopped.

## Doctor through the shim, after fencing

| Check | Result |
|---|---|
| lock-kernel-semantics | pass (flock, kernel exclusion and borrow, two-process probe green, workspace and machine) |
| lock-borrow-vectors | pass (4 vectors and sibling check, git 2.53.0) |
| lock-holders | pass, 16 lock files of 16 locks, 0 held |
| lock-fences | pass, 216/216 |
| main-checkout-hook-wired | pass (`core.hooksPath = .githooks`) |
| state-root | pass (`~/.local/state/fgos`, pinned) |
| active-release-matches-checkout | pass, changed=0 |

`fgos lock-status`: `mainCheckout` free, no holders. A smoke read (`fgos list --json`) works on the new release. The 8 failing checks are the same as before the 4.4a landing here and are not caused by this one: `config-not-stale`, `model-policy-tier-coverage`, `tool-registry-configured`, `work-step-vocabulary`, `doc-current-path-missing`, `doc-source-conservation`, `executor-profile-warnings`, `agent-cli-project-trusted`.

## Smoke

This report's commit goes through the new hook in the main checkout.

## Release pin

`.fgos/distribution.json` on main named `2895ff70…` (the 4.4a release built here). It now names `df7a1a04…`, built from main with 4.3-R. As before, the pin is digest-only; the owner machine runs `e74cb03c…`.

## Rollback

Stop every writer; activate `2895ff70…` (or `fgctl repair`); copy `fgctl.prev` back to `~/.local/bin/fgctl`; remove the `main-checkout` and `merge-slot` tombstone directories listed by `fenceStatus`. Lock files only; the event log and claim files did not change format.

No component-boundary change.
