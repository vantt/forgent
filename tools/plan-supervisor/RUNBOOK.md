# Runbook: set a project up, then run a plan

Everything below was exercised on a real project (pkm, three plan phases) and on a fresh throwaway one; where a step
comes from a failure, the failure is named. Commands assume this package is installed (`install.sh`).

## A. Once per machine
- Linux with a systemd user session (the timer; the rest works without it), `node` (24 tested), `git`, Claude Code, and
  fgOS (`fgctl`). Install: `tools/plan-supervisor/install.sh` (skill and scripts go to `~/.claude/skills/plan-supervisor`).

## B. Once per project (`plan-board.mjs doctor` prints this as a checklist)
1. **A git repo, not under `/tmp`.** Seats are confined (bwrap) and see a fresh `/tmp`; a project there looked empty
   to the judge ("contains only .fgos"). Keep it under your home.
2. **`fgctl init`**, alone in its shell invocation (chained after `git` commands in the same shell it refused with
   `git-predecessor-writer-live`). It writes `.fgos/ .agents/ .claude/ .codex/ .omp/ .pi/` and `.claude/settings.json`
   hooks that run in **every** Claude session of the project (they also enforce the five-part decision-question
   template on `AskUserQuestion`). Add the six paths to `.gitignore`.
3. **Trust the folder.** Run `claude` once in the project and accept the trust prompt. A seat that runs in a pane stalls
   on that prompt (`terminal:delivery-unknown`, run ends `execution-failure / infra-exec-failed`). This is your decision;
   nothing here does it for you. `doctor` checks it.
4. **Declare the whole-tree gate** (the command the case's last step runs): `fgos config set
   'runner.capabilities.code:implement.verify' '<command>' --reason '<why>'`. Without it `propose` refuses
   `gate-command-missing`. The key is under `runner.`.
5. **Choose providers.** The machine config sends capabilities to several families (repo content leaves for them, and a
   family can be out of quota). To keep one family: `scripts/claude-only.sh [DIR]`. Cost: `reviewed` is then refused
   (`independence-unsatisfiable`), so activities run `--pattern solo --reason ...`, and a case allows only 2 such
   deviations (`deviation-limit-reached`), so one case per small phase.
6. **Plans** from `ak:plan` (`plans/<id>/plan.md`). Add `footprint: [paths]` and `base: <commit>` to the frontmatter.
   Footprints must include the tests, README and docs your project's rules require with a behaviour change, or the
   worker cannot write them and the conductor has to widen the slice (it happened in 2 of 3 pilot slices).
7. **Register the watchdog:** `install.sh --add DIR [--max-lanes N] [--stall-min N]` (additive; shows `doctor`).

## C. Run a plan (the conductor's loop; the session you are in is the conductor)
1. Read the whole plan and its phase files; compare with the code; list what only the owner can decide.
2. Write the slice list (JSON: `id`, `objective`, `writes`, `verify`, `dependsOn`, `inputs`). One narrow `verify` per
   slice. Two slices that write the same path cannot share a proposal (`write-overlap`): merge them, or propose and run
   them one after the other.
3. `fgos workflow propose --slices S.json --plan plan.md [--worktree W --branch B] --json` (read-only). Show the owner
   the question it prints (five parts) and get the frame approved once. Never size a frame yourself.
4. Run the printed commands in order: `worktree create`, `workflow start` (gives the case id), `judge`, `validate`,
   one `run` per slice, `gate`. Run them from the JSON `argv` (replace `$CASE`), not through `eval` (the fgOS delete
   guard blocks it). Run a long slice in the background and wait for its real end, not for the launcher's exit.
5. Anything the judge or validate says contradicts the code is an **owner question**, not something the slice guesses.
6. After every slice, verify yourself in the case worktree: the project's own gates (format, lint, tests), the diff
   against the declared writes, the facts in git. Record it: `plan-board.mjs verify <case> <slice> pass|fail "<what you
   re-ran>" gates=fmt+clippy+test widened=N deviation=N --commit SHA --repo DIR`. A worker's summary is a claim.
7. You never edit product code, merge, edit plan status or write consent; every change is a slice through a door.
8. At the end: `plan-board.mjs report`, `fgos metrics case close`, a commit body that says what was checked, where, and
   what was **not** run, then hand the branch to the owner. Merge is theirs.

Verified end to end on a fresh project (2026-11-16, after the trust step): propose, judge, validate, one slice, the
gate and the independent check all passed, milestones reached `integrated`, 3 of 7 dispatches left of the frame.
Note for the report: measure 7 ("unit + e2e + guide in the commit") encodes the pilot project's own rule; for a project
with other rules read it as "which of these three the commit lacks", not as a verdict.

## C2. Several phases of one plan at once (measured, 2026-11-16)
`ak:plan --parallel` already gives what is needed: phases with strictly disjoint **file ownership** and a dependency
column. fgos-cook runs writing slices one after another inside a case, but cases are independent, so run **one case per
independent phase** and let each case have its own worktree:
1. One case for the whole plan: `judge` and `validate` once (as in C), then `fgos workflow close` it.
2. For each independent phase, a slice list of that phase only, `fgos workflow propose` with its own
   `--worktree`/`--branch`. `propose` finds the closed case (same plan, same base commit) and **continues it**: the
   `start` line carries `--inherit` and the judge and validate lines are gone. Use a full commit hash for `--base`
   (an abbreviated one failed).
3. Start every case, then dispatch the slices **together**. Two slices on a fresh project started in the same second,
   ran 12 s each, wall 12 s against 24 s one after the other; no lock, refusal or reservation clash. Each case's gate
   passed and reached `integrated` on its own. A one-family project uses `solo`, 2 deviations per case: one slice per case.
4. A phase that depends on others waits, and starts from the merged result (new base, so a new case).
5. Land the branches one after the other at the approve door, or merge them in an integration worktree. **Re-run the full
   gate on the combined tree**: a branch that passes alone does not prove the merge. The project's single gate must also
   hold on a tree that has only some phases (a gate that needs all files fails every partial case).
The lanes cap of `plan-board.mjs` counts these concurrent dispatches. Not yet measured: a real project's cases
competing for CPU (cargo builds), the quota of one account under several seats, and cases whose footprints turn out to
overlap after all.

## D. Supervisor tick
In a Claude session: "run one supervisor tick" (`SKILL.md`). It never starts a leader by itself in v0.

## E. Known pitfalls
| Symptom | Cause | Do |
|---|---|---|
| judge says the workspace "contains only .fgos" | project under `/tmp` | move it under home |
| run ends `infra-exec-failed`, pane shows "Press Enter to continue" | folder not trusted by Claude Code | trust it once (B3) |
| `independence-unsatisfiable` | one provider family | `solo` with a reason (B5) |
| `deviation-limit-reached` | more than 2 deviations in one case | open a new case per phase |
| `write-overlap` | two slices share a path | merge, or propose separately |
| `gate-command-missing` | no gate declared | B4 |
| `git-predecessor-writer-live` on `fgctl init` | init chained after git in one shell | run it alone |
| a run failed and nobody knew | headless runs are silent | the watchdog (B7) |
| `worktree create --base <short hash>` fails | abbreviated hash not accepted | use the full 40-character hash |
| `closed` case still `running`, orphan reservation | fgOS gap, no clean-up verb | report it; do not rely on it |
