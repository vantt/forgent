---
status: in-progress
created: 2026-10-20
---

# COOK P4: ak:cook in a worker

Roadmap P4 ([roadmap](../reports/roadmap-261016-2212-fgos-cook-and-git-component.md)): a worker that has ak:cook (AgentKit's skill, not ours: we only use it) runs its slice with ak:cook. Owner 2026-10-20 11:51: "em làm tiếp nhé".

## Facts (manual probe 2026-10-20 11:45, board log 11:55)

- ak:cook calls no fgos/Work command.
- A worktree made by `fgos worktree create` has no ak skill: `/.claude/skills/*`, `/.agents/skills/*`, `/.omp/`, `/.pi/` are gitignored. With the 106 `ak-*` dirs copied in, a claude worker (herdr, read-only, `unit-run-1792471245358-028191dc`) saw ak:cook. `--auto` is its non-interactive flag; its Finalize step writes plan files, report and journal, and asks before git commit.
- The ak copies for codex/omp/pi the owner installed 2026-10-16 are gone. `.agents/skills` lost them because `assembleSkills` step 5 (`src/setup/skill-wrappers.mjs`) deletes every dir that is not a canonical fgOS skill; `.claude/skills` prune only removes dirs carrying the generated-wrapper marker. `.omp`/`.pi`: cause unknown.
- `worktreeSetup.commands` (`runWorktreeSetupCommands`, `src/runner/worktree.mjs`) runs only in Work claim/loop worktrees and the merge ephemeral worktree; not after `fgos worktree create`, not for `fgos run --worktree`. Git spec §75: Execution provisions after worktree-create returns, outside every Git lock; Git never runs it.
- P3 already landed: `unit.skills` + executor `supports.skills` filter in `bind()` (`src/runner/execution/bind.mjs`, reason `skills-unavailable`).

## Units

| # | Unit | Done when |
|---|---|---|
| 1 | Skill prune keeps what fgOS did not write: step 5 removes only dirs it can prove it assembled (generated header in their SKILL.md, same idea as the `.claude/skills` marker) | test: a third-party `.agents/skills/ak-cook` survives `assembleSkills({prune:true})`; a stale fgOS-assembled dir is still pruned |
| 2 | `fgos worktree create` provisions after the Git port returns, through the existing Execution helpers (`provisionDependencies`, `runWorktreeSetupCommands`), outside Git locks; check whether workflow-created write worktrees need the same (one door, no second copy) | test + doc line in `docs/platform/git/spec.md`/runner spec where the verb is described; CHANGELOG line |
| 3 | Config: `worktreeSetup.commands` gains one portable command copying `ak-*` skill dirs from `$FGOS_REPO_ROOT` into the worktree for each runtime dir that exists (`.claude/skills`, `.agents/skills`, `.omp/skills`, `.pi/skills`, `.grok/skills`) | new worktree has the skills; `git status` clean |
| 4 | Executor skill declaration: `supports.skills` lists `ak:cook` only for executors whose runtime really has it now (claude); doctor row that a declared skill exists in the runtime's skill dir of the main checkout (reuse an existing check if one exists) | doctor row passes for claude, fails with a named remedy when the dir is missing |
| 5 | Brief contract for an ak:cook worker as a shared fragment for P5 (`core/skills/_shared/`): `--auto`, no journal, no plan-status edits, no git, write only declared `writes`, review is fgOS's job | fragment rendered by `npm run build:skills`; guards green |

Live proof (big lead): one writing `fgos run --unit` with `skills: ["ak:cook"]` on claude in a fresh `fgos worktree create`d worktree; only declared writes committed; no journal/plan writes.

## Owner steps

- After unit 1 is on main and active: reinstall ak for codex, omp, pi (and grok) in forgentX; then add `ak:cook` to those executors' `supports.skills`.

## Reversal trigger

- If provisioning at `fgos worktree create` makes landing smokes or leads noticeably slower (cargo build per worktree), split skills copy from heavy build setup.
