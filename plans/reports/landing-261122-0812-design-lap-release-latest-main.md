# Landing: latest main as the active release on design-lap

Landed 2026-11-22 08:44 (Asia/Saigon) in the main checkout `/home/vantt/projects/forgentX`. The owner authorized it ("land mới nhất", 2026-11-22 08:11). The recipe is [the design-lap landing handoff](handoff-261025-2105-design-lap-release-landing.md), with the 11-22 updates from the lead.

## Result

- **Release:** `e93ccc3f` (sha256:e93ccc3f0d07…), built from origin/main `746097053`. It is active in the workspace, and `fgctl verify` exits 0.
- **Previous release (rollback target):** `b85058ea` (source `e09051e7`).
- **fgctl:** `fgctl upgrade` installed the release's own fgctl at `~/.local/bin/fgctl` (4645b157). It kept the old binary as `~/.local/bin/fgctl.prev`.

## Backups

All of these were taken before anything was installed. They are in `~/.fgos/private/upgrade-74609705/`, mode 700.

| File | sha256 prefix |
|---|---|
| `activation.json` | 77c86674 |
| `distribution.json` | 34ab0b5a |
| `fgctl.prev` | 4bf8e66d |

To roll back, restore these three files.

## Local main

Local main had diverged: 4 commits ahead and 1451 behind origin/main.

- Commit `6f9f07cd1` (AgentKit subagent refresh) is kept on branch `keep/agentkit-refresh-6f9f07cd1`. It is not pushed: the owner decided AgentKit files should not be tracked, and that is a separate item.
- Main was moved with `git reset --keep origin/main`. No tracked changes were lost, and no untracked or ignored files were touched.

## Verification

| Check | Result |
|---|---|
| `fgos config check` | exit 0 |
| `fgos dispatch decide --for execute` | out-of-process (executor gemini) |
| `fgos doctor --json` | 103 ok, 10 warn, 3 fail. The fails are `work-step-vocabulary` (tsk-5db), `root-drift` and `provider-capacity-state` (openrouter quarantine), the same as the 11-18 baseline. No regression. |
| `active-release-matches-checkout` | ok (changed=0, missing=0, extra=0) |
| `activation-matches-pin` | warn: active e93ccc3f0d07 != pin abe41ad0e564. The upgrade rewrote the tracked `.fgos/distribution.json`, and it was restored per the handoff, so the committed pin did not move. |
| `fgos gateway start` | fails as on 11-18: `--locked` cannot update `apps/fgos-gateway/Cargo.lock`. The tracked lockfile was not modified. |
| `git status` (tracked) | clean |

## Traps seen

- The upgrade rewrote the tracked `.fgos/distribution.json`. It was restored from git.
- The upgrade's `doctor --fix` added four `# @fgos:` comment lines to the tracked `.fgos/config.yaml`. They sit on `runner.personas.shaper` and `runner.personas.planner` (`tier`, `prefer`). These are comments only, with no value change. Config files are never committed from a landing, so the file was restored from git. The next `doctor --fix` will add them again until main carries them.
- The upgrade exits 2 ("not ready") because of the 3 baseline fails. Activation still completes.

## Open items

- **`tsk-cw6daofbff`:** the gateway lockfile on main still cannot be built with `--locked`. It is not fixed.
- **config.yaml comments:** main's `.fgos/config.yaml` lacks the `# @fgos:` comments for `runner.personas.shaper` and `runner.personas.planner`, so every `doctor --fix` dirties the main checkout. Someone who may change that config should add them on main through the config door.
- **Pin drift:** the committed pin (`abe41ad0`) names neither the old nor the new release. Moving it is an official-release step and is not done here.
- **Stuck run attempt:** `run-attempts-stuck` warns that 1 attempt has no holder. The next `fgos run` adopts it.
- **Commit `6f9f07cd1`:** kept on `keep/agentkit-refresh-6f9f07cd1`. It is not pushed, per the owner.
- **Suite:** not run. Everything landed came through main's own gates.

## Cleanup

- The build worktree and its target and staged dirs were removed.
- Logs are kept in `.fgos/runtime/land-74609705/`.
- No other worktree was touched.
