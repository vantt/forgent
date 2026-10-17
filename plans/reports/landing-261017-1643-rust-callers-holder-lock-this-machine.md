# Rust callers on holder-lock: landing on the second machine (`~/projects/forgent`)

Date 2026-10-17, 16:38–16:43. The owner asked for the landing ("ok, giờ landing phần B của 4.4a luôn"). This follows the landing on the other machine, [landing-261017-1625-rust-callers-holder-lock-stop-everything-landing.md](landing-261017-1625-rust-callers-holder-lock-stop-everything-landing.md), which also holds the section B evidence (old `fgctl` and old observe fail loudly against the fences, neither hangs).

## Result

- **Workspace:** only `/home/vantt/projects/forgent` on this machine runs fgOS (the same as at the 4.2 landing here; `~/projects/mdview` has no activation).
- **Source:** `main` at `be76f5237`, which contains the 4.4a merge `09f824ea0`. The uncommitted files of other sessions in the main checkout (`AGENTS.md`, `.claude/settings.json`) are not in the payload; `active-release-matches-checkout` reports changed=0 after activation.
- **Release:** `sha256:2895ff703a5a80d0bb1809d1c4b0b2aa7fc83f3089891260b5185ef3542d86b8`, 705 files, built with `cargo build --release --workspace` and `scripts/build-rust-distribution.mjs`. It differs from the other machine's `79ead131…` only by the docs commits made on main after `09f824ea0`.
- **fgctl:** reinstalled with `cargo install --locked --path apps/fgctl --root ~/.local`. `which -a fgctl` lists one file (`~/.local/bin/fgctl`, repeated by duplicate PATH entries). The previous binary is kept at `.fgos/runtime/tmp/landing-4.4a-this-machine/fgctl.prev`.
- **Activation:** the new `fgctl stage` and `fgctl upgrade --from <tree>` exited 0; the activation gate (probe plus borrow vectors) passed. Active `2895ff70…`, previous `227abc99…`.
- **Fences:** 23 placed, 191 already there, 214 of 214 in all. The 23 were the three Rust-caller locks (activation, install, observe) and `advance.lock` paths of workflow runs created after the 4.2 landing. They were placed by `fixLockFences(root, {excludePids, hostBin})` from the new release's payload, run from `/tmp`, not by `fgos doctor --fix`, which would also run the render fixes in a checkout holding other sessions' work.

## Stop check

No fgOS or `fgctl` process was running. The stop scan matched by cwd only: four idle Claude sessions and their shells, one background session with its pty host, and this session's shell. None had a file under `.fgos/` or the lock root open (`/proc/<pid>/fd` checked for each); they were excluded instead of stopped. Outside the workspace ran three codex app-server daemons and `herdr server`, neither an fgOS process. One placement attempt was refused because the log writer (`tee`) itself carried the workspace path in its command line; the retry wrote the log elsewhere. Same deviation as the two earlier landings; their proposal (match cwd only for fgOS payloads and the host, list other matches as information) still stands.

## Doctor through the shim, after fencing

| Check | Result |
|---|---|
| lock-kernel-semantics | pass (flock, kernel exclusion and borrow, two-process probe green, workspace and machine) |
| lock-borrow-vectors | pass (4 vectors and sibling check, git 2.53.0) |
| lock-holders | pass, 15 lock files of 13 locks, 0 held |
| lock-fences | pass, 214/214 |
| state-root | pass (`~/.local/state/fgos`, pinned) |
| active-release-matches-checkout | pass, changed=0 |

Failing checks that were red before this landing and are not caused by it: `config-not-stale`, `model-policy-tier-coverage` (global `openai` tiers), `tool-registry-configured`, `work-step-vocabulary`, `doc-current-path-missing`, `doc-source-conservation`, `executor-profile-warnings`, `agent-cli-project-trusted`. A smoke read (`fgos list --json`) works on the new release.

## Release pin

Before this landing, `.fgos/distribution.json` on main pinned `227abc99…` (`b319d4b1d`). That release was built from `1ccfbf5f1`, before the 4.4a merge, not from `09f824ea0` as the other machine's report assumed; it lacks the Rust-caller code. The pin now names `2895ff70…`, built from main with 4.4a.

## Rollback

Stop every writer; activate `227abc99…` (or `fgctl repair`); copy `fgctl.prev` back to `~/.local/bin/fgctl`; remove the tombstone directories listed by `fenceStatus` (activation and observe in this workspace, install under the state root). No data needs to move back.

No component-boundary change.
