# ak:cook worker contract

How to brief a worker that runs its slice with `ak:cook`, AgentKit's own implementation skill (a
third-party tool: fgOS uses it, never edits it). Put these rules into the Unit's prompt; the Unit
itself names `skills: ["ak:cook"]` so `bind()` only picks an executor whose `supports.skills` lists
it (`docs/specs/runner.md`, "Skills reach `bind()`").

`ak:cook` calls no fgos or Work command and knows nothing of fgOS's lifecycle, so everything it would
normally do beyond editing code is switched off by the brief, not left to its defaults.

## What the brief tells the worker

1. **Run non-interactively.** Invoke `ak:cook` with `--auto`. A worker has no person to answer a
   question; a stage that would ask must take its documented default and keep going.
2. **Write only the declared `writes`.** The Unit's `writes` paths are the whole write surface. Do
   not create plan files, a plan directory, a report, a journal entry or any scratch file inside the
   worktree; keep working notes in the final answer instead.
3. **No plan-status edits.** Do not tick checkboxes or change status fields in any plan or phase file,
   even one the slice came from. fgOS records progress; the worker only edits the declared files.
4. **No journal.** Skip `ak:cook`'s journal step entirely.
5. **No git.** Never run `git add`, `git commit`, `git push`, branch or worktree commands. When
   `ak:cook` reaches a step that asks before committing, answer no. The runner commits only the
   declared `writes` after a passing round.
6. **Review is fgOS's job.** Skip `ak:cook`'s own review, test-report and finalize phases beyond
   running the checks the slice names; the independent review fgOS dispatches is the review. Report
   the result of the checks you ran, and anything you could not run, in the final answer.

## What the Lead still does

Choosing the executor (`fgos dispatch decide`), running the Unit (`fgos run`), verifying the result
independently and landing it. A worker's own claim of success is evidence to check, never proof. Do
not use this fragment for a checker or panel role: those are chosen on independence alone and are
never asked for skills.

## Where the skill comes from

A linked worktree has no `ak-*` skill directories (the runtime skill directories are untracked).
`worktreeSetup.commands` copies them from the main checkout when `fgos worktree create` provisions
the worktree, and `fgos doctor` check `executor-skills-installed` confirms that each skill an
executor declares exists in its runtime's skill directory of the main checkout.
