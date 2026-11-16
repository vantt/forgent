# plan-supervisor (prototype v0)

A way to drive plans with short sessions instead of one long one: a thin supervisor reads a plan index, a conductor
(`fgos-cook`) runs one plan, workers run slices through `fgos run`, and a no-LLM watchdog tells you when a run failed
or hung. Written as an experiment on the `pkm` project on 2026-11-16; the flow is **not fixed**. Design and the first
run's friction: `plans/reports/spec-261116-1042-plan-supervisor.md`, `plans/reports/review-261116-1313-plan-supervisor-pilot-friction.md`.
Hand-off for the fgOS refactor: `plans/reports/note-261116-1503-plan-supervisor-driver-for-refactor.md`.

## What is in here

| File | What |
|---|---|
| `SKILL.md` | the supervisor tick (a Claude skill); read it first |
| `scripts/plan-board.mjs` | plan index and everything a tick needs: `check`, `eligible`, `render`, `claim`, `release`, `lock`, `changed`, `queue`, `health`, `watch`, `verify`, `event`, `sessions`, `report`. Node only, no dependencies. 17 tests: `node --test scripts/plan-board.test.mjs` |
| `scripts/watchdog.sh` | runs `watch` on projects; alerts to `alerts.log`, the owner queue and an fgOS mailbox message |
| `systemd/` | user timer templates for the watchdog |
| `install.sh` | copy the skill to `~/.claude/skills/plan-supervisor`, optionally enable the timer for some projects |

## Use on another project

1. Initialise fgOS in the project (`fgctl init`), declare its whole-tree gate:
   `fgos config set 'runner.capabilities.code:implement.verify' '<command>' --reason "<why>"`.
2. `tools/plan-supervisor/install.sh --timer /path/to/project` (add `--dry-run` first to see what it does).
3. Plans are `ak:plan` plans (`plans/<id>/plan.md`). The index also reads two optional frontmatter fields **we added**:
   `footprint: [paths]` and `base: <commit>`; without them a plan cannot run beside another and drift is not detected.
4. In a Claude session in the project: "run one supervisor tick" (the skill). Ticks are manual in v0.
5. State lives outside the repo: `~/.local/state/plan-supervisor/<project>/`. Stop everything:
   `install.sh --uninstall`.

## What it measures (no tokens: fgOS records none)

`plan-board.mjs report` prints seven things from files only: completion (milestones), lead time split into worker /
failed runs / the conductor's verification / owner wait, interventions by kind and median wait, scope fidelity (paths
widened after the proposal, claims a re-run contradicted), plan defects found by validate, detection latency, and gates
at the first independent check read from git (unit test + e2e + guide in the commit). `sessions` records the size of
the conductor's transcript as a proxy for context growth. Blind spots are listed in `SKILL.md`; one pilot is not a sample.

## Limits of v0

Manual ticks; the leader is the session itself, not an automatic launcher (a top-level `claude -p` can call `fgos`, a
confined `fgos run` seat cannot dispatch); only the `solo` pattern was used (see the refactor note for why and what
that costs). Alerts reach the owner only through the mailbox and a file because the machine it was written on has no display.

## Note for the fgOS refactor session

Read `plans/reports/note-261116-1503-plan-supervisor-driver-for-refactor.md`. Short version: the driving here is a
hand-run loop on top of `fgos run --pattern solo`; once Workflow is the engine it should use the richer patterns and
let the platform own the loop, the ledger and the alerts.
