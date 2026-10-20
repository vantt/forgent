# Phase lead report: ak:cook in a worker (units 1-5)

## Outcome

All five units implemented on the worktree branch. Nothing merged or pushed.

| Unit | Change | Proof |
|---|---|---|
| 1 | `assembleSkills` prune removes only entries carrying fgOS's generated Markdown header (`carriesAssembledHeader` in `src/setup/skill-wrappers.mjs`); skills another tool installed stay | `test/setup/skill-wrappers.test.mjs`: third-party `ak-cook` survives, a stale assembled dir is still pruned. `npm run build:skills` left all 106 `ak-*` dirs in place |
| 2 | `createWorktreeUseCase` (`src/verbs/worktree/create.mjs`) calls `provisionDependencies` then `runWorktreeSetupCommands(path, repoRoot)` after the Git port returns | `test/verbs/worktree-create.test.mjs`: setup command runs inside the new checkout with `FGOS_REPO_ROOT` = main checkout; a failing command fails the verb |
| 3 | `.fgos/config.json` `worktreeSetup.commands[0]`: portable sh loop copying `ak-*` dirs from `$FGOS_REPO_ROOT/<rt>/skills` for `.claude .agents .omp .pi .grok`, only for runtime dirs that exist; ends in `true`. `.gitignore` gains `/.grok/` (the only runtime dir of the five that was not ignored) | Run against a real `fgos worktree create`d checkout: 106 `ak-*` dirs in `.claude/skills`, `git status` empty, second run idempotent |
| 4 | claude executor `supports.skills: ["ak:cook"]`; new doctor check `executor-skills-installed` (`checkExecutorSkillsInstalled` in `src/setup/model-pool-checks.mjs`). No existing check validated declared skills. Looks in the main checkout (`resolveMainCheckoutRoot`); claude reads `.claude/skills`, openai `.agents/skills`; other families are reported as not checked | `test/setup/model-pool-checks.test.mjs`: fails naming the path and remedy when missing, passes when installed; registry doc rows updated (`setup-doctor-registry.md`, `distribution.md`, how-to) |
| 5 | `core/skills/_shared/ak-cook-worker-contract.md` (--auto, only declared writes, no plan-status edits, no journal, no git, review is fgOS's) rendered by `npm run build:skills` into `.agents/skills/_shared` and `plugins/fgOS/skills/_shared` | build ran clean |

## Single door for provisioning

The Git port's `create` is called only from the use case; `fgos run --worktree` takes an existing worktree; the runner's own creators (`createWorktree`, merge ephemeral) already provision through `finishWorktreeSetup`. So the verb use case is the one missing door. Docs: Git spec (Worktree section and the "Git never imports a consumer" paragraph), runner spec ("Skills reach `bind()`"), CHANGELOG.

## Timing (reversal trigger)

`fgos worktree create <path> --detach` with this repo's `cargo build --release --workspace` setup command, cold cargo build in the new worktree: about 74 s end to end (about 6 s of that is the dev-host build). Measured twice with the same result: no cargo output directory was shared between runs. The 106-dir skills copy itself takes well under a second. Before this change the verb took about 1 s. That is a real slowdown for anyone using the verb; the plan's trigger ("noticeably slower") is met in the sense that the cargo build dominates. Options if the owner objects: split the skills copy from the build (two config entries cannot be selectively skipped today, so it would need a second config key), or share a cargo output directory. I did not add either (RUL104).

Note: the setup commands are read from the main checkout's `.fgos/config.json`, so the new skills-copy command only takes effect after this branch lands on main.

## Tests

- Focused: skill-wrappers (125 pass, 2 pre-existing failures identical on baseline: committed-render drift guard and projection invariants, caused by this worktree's ignored `.agents/skills`), worktree-create 3/3, architecture 29/29, model-pool-checks and checks pass, registrations 58/58 after adding the check id to the registry contract doc.
- Focused sweep of `test/setup/*`, `test/verbs/*`, architecture, runner worktree and merge tests with a host binary: 1208 pass, 1 fail (`active-release-drift-check`, passes alone, load-sensitive).
- Full `npm test` (session ids unset, private cargo dir, no FGOS_HOST_BIN set): 8408 pass, 90 fail. The failures are in the fgctl, lock-fence, dev-door, `run.test.mjs` and `help-routes.test.mjs` groups plus the doctor `--fix` e2e tests that need a host binary; the suite also ended with a dev-host leak message. The one failure that was mine (Data Dictionary #7 names every doctor check) is fixed. I did not re-run the whole suite after that fix.

## Unresolved

- Whether the 74 s per-verb cost is acceptable (see Timing).
- Owner steps in the plan (reinstall ak for codex/omp/pi/grok, then add `ak:cook` to those executors) remain open; the openai family has no `ak:cook` declared.
