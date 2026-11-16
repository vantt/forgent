---
name: plan-supervisor
description: >-
  Run one supervisor tick over a project's ak:plan plans: read the plan index, find plans ready to run, check running
  leaders, hold drifted or blocked plans, and tell the owner what to start or decide. Use when the owner says "chạy một
  lượt supervisor", "đẩy plan", "plan nào chạy được", or asks for the plan board. ALSO use it when the owner asks to
  run, cook or deliver one plan ("chạy plan <path>", "run this plan"): then you are the conductor and follow
  RUNBOOK.md section C exactly (read it first, run `plan-board.mjs doctor` before anything else, stop on a TODO line).
  Prototype v0: nothing starts by itself; it never edits plan content, merges or tags.
---

# plan-supervisor (prototype v0)

Design: `plans/reports/spec-261116-1042-plan-supervisor.md` in the fgOS repo; how to set a project up and run a plan:
`RUNBOOK.md` next to this file (installed with it). This is an experiment: the flow is not
fixed, so measure every tick (section Measure) and keep the choices below easy to change.

You are a **thin, stateless tick**. Your memory is the files, never the chat: plan frontmatter (planner writes),
`state.json` (you write the leader per plan), `fgos workflow status` (fgOS writes progress). Do not read plan bodies
or code except where a step says so. Do not do the leaders' or workers' work.

Tool: `node ~/.claude/skills/plan-supervisor/scripts/plan-board.mjs <cmd> [--root plans]` (run from the project root).
Commands: `check`, `eligible [--json]`, `render [--write]`, `claim <plan> <leader-id>`, `release <plan>`, `lock acquire|release [--ttl-min N]`, `log <note> k=v`.
Mechanical pre-check, no LLM: `changed` (exit 10 = nothing changed since the last finished tick, do not start a session; run `changed --mark` at the end of a tick). Owner queue: `queue add <plan> <text>`, `queue list`, `queue done <id>`; step 6 writes here instead of only listing.
Start every tick with `lock acquire` (exit 3 = another tick runs: stop) and end it with `lock release`; a lock older than its ttl (default 30 min) is taken over.
State lives in `~/.local/state/plan-supervisor/<project>/`, outside the repo. `--max-running` defaults to 1: plans run one
at a time unless their footprints are declared and disjoint. Per-project cap: `plan-board.mjs config set maxRunning N` (the pilot project used 2; raise to 4 only after
seeing disk and CPU use: each worktree builds its own `target`, 13 GB for the pilot; claude-only shares one account's quota).
Within one case, writing slices are serial (fgos-cook); parallelism is only across cases with disjoint footprints.

## Project setup (once per project)

1. `fgctl init` in the project (pin the same release as the platform repo, e.g. `FGCTL_VERSION=v0.2.0-rc.10`). It adds
   `.fgos/`, `.agents/`, `.claude/settings.json` (fgOS hooks that run in **every** Claude session of the project),
   `.codex/`, `.omp/`, `.pi/`, all untracked; decide with the owner what to commit or ignore.
2. Declare the whole-tree gate, or `fgos workflow propose` refuses with `gate-command-missing`:
   `fgos config set 'runner.capabilities.code:implement.verify' '<command>' --reason "<why>"`
   (the key is under `runner.`, not top level).
3. Plans need ak:plan frontmatter (`status`, `priority`, `blockedBy`/`blocks`); this skill also reads two optional
   fields **we added, not ak:plan's**: `footprint: [paths]` and `base: <commit>`. Without them a plan cannot run beside
   another and drift cannot be detected.

## One tick

1. `check`. Any `error:` line: stop and report it; do not continue on a broken index. Warnings (no footprint, no base
   commit) go into the report.
2. **Running plans** (`eligible --json` lists `running`). For each, first run `health --case <caseId>`: exit 4 means a unit run
   failed (execution-failure / infrastructure); queue it for the owner and report it first, do not wait for the leader to
   finish. Then read `fgos workflow status <leader> --json`:
   - alive and moving: nothing to do;
   - leader gone or no progress since the last tick: report as stuck; a replacement leader resumes from `status` plus
     the cook notebook, so propose starting one (do not start it yourself);
   - case closed **and** the plan's branch merged into the target: this is the only edit you make to a plan — change
     `status:` to `completed` in its frontmatter, then `release <plan>`.
3. **Drift**: for each eligible plan with a `base:` commit, `git rev-list --count <base>..HEAD -- <footprint paths>`.
   More than zero commits on its paths: hold it and report "plan drifted, return to planner".
4. **Weight** of each remaining eligible plan: light only when every footprint path is docs or data and no public API
   changes; anything under `crates/`, a contract, or a lockfile is heavy. Heavy runs under `fgos-cook`; light may use
   `fgos workflow start --units`. When `fgos workflow propose` is available it overrides this guess.
5. **Start** (up to the running limit): print, for the owner, the exact launch recipe, because opening a leader session
   is not automated yet:
   - the plan path, its weight, and the first line to give a new Claude session: `Chạy plan <path> bằng fgos-cook,
     báo cáo ngắn, không merge`;
   - then, once the owner says the leader started, `claim <plan> <leader-id>` and
     `fgos metrics case open <plan-id> --harness cook-plan` (or `fgos` for the light path).
6. **Owner queue**: collect what only the owner can decide (parked leader questions, consent gates, a frame that must
   widen, drifted plans, plans missing footprint) into one list, each with what is happening, options, a recommendation.
7. `render --write` if the board changed, then `log "<one-line summary>" eligible=N started=N held=N stuck=N`.
8. Report in Vietnamese, at most ten lines: what runs, what is ready, what is held and why, what you need from the owner.

## Workers inside a heavy plan: ak:cook is an option

The machine config declares `skills: ["ak:cook"]` for several executors, so a leader may give a slice to `ak:cook` as the
worker (Unit with `skills: [ak:cook]`, brief per `_shared/cook-worker-contract.md`: automatic mode, only the declared
`writes`, no plan-status edits, no git, no journal, review left to fgOS). It is never the leader: it has no case, frame
or ledger. Treat "ak:cook worker vs default worker" as a measured choice (quality, interventions, tokens), not a default.
For a small low-risk plan, `ak:cook` straight in a session is possible but leaves the fgOS ledger.

## Never

- Edit plan content, tick checkboxes, change priority or dependencies (the planner does).
- Merge, approve, tag, drop a plan, or widen a frame.
- Start a second leader for a plan that already has one (`claim` is idempotent; trust it).
- Keep notes in chat: anything worth keeping goes through `log` or the report.

## Measure: seven measures, no tokens (tokens dropped until there is an infrastructure for them)

`plan-board.mjs report [--case ID] [--json]` prints, from files only: (1) completion = milestones achieved of 7, plus
session length via `sessions`; (2) lead time from hand-over to the last passing independent check, split into worker run,
failed runs, my verification, owner wait, other; (3) interventions by kind and median owner wait (queue); (4) scope fidelity
(widened paths, needsWrites, worker claims my re-run contradicted, brief deviations); (5) plan defects found by validate, by
kind; (6) detection latency (failure to alert; owner-found failures count too); (7) gates at the first independent check and
whether unit + e2e + guide are in the commit, read from git.
What you must record, because fgOS does not: after each slice you verify,
`verify <case> <slice> pass|fail "<what you re-ran>" gates=fmt+clippy+test widened=N deviation=N mismatch=N --commit SHA --repo DIR`;
when validate shows the plan was wrong, `verify <case> plan fail "<why>" kind=premise|underspecified|missing-dep`;
when the owner hands work over, `event <case> assigned "<what>" [--at ISO]`; every owner question,
`queue add <plan> "<text>" --kind gate|design|failure|housekeeping`, and `queue done <id>` stamps the answer time;
at milestones, `sessions --label "<where>" --project <dir>` stores the size of the conductor session's transcript.
Blind spots to repeat whenever you quote numbers: admission refusals such as `deviation-limit-reached` and killed
orphan runs leave no unit summary and are not counted; the pilot backfill used approximate times for two owner answers
(frame approval about 04:17:38Z) and mtimes of my own log files for verification times; one case is not a sample.

## Measure (this is half of the point)

Each tick writes one `log` line. Also, once per real plan, at its end:
`fgos metrics case close <plan-id> --interventions <N> --verdict usable|fixed|discarded` and three to five lines of
retro in the plan's report: what worked, the friction (`fgos friction record` for each), what to change.
Record per tick if known: tokens and minutes of this tick, whether it did anything beyond reading (a tick that found
nothing to do is the cheap case the design depends on), leaders replaced, owner questions waiting and for how long.
Under three real plans the numbers are observation only; do not redesign from them.

## Watchdog (installed 2026-11-16, no LLM)

`scripts/watchdog.sh <project>` runs every 3 min from the systemd user timer `plan-supervisor-watchdog.timer`
(units in `~/.config/systemd/user/`). It runs `plan-board.mjs watch`: any unit run under `.fgos/assignments` that ended
`execution-failure` / `policy-refusal` / `provider-limit` / `blocked` (or reports infrastructure failure), or whose files
have not changed for 20 min while still live, is alerted once. Alerts go to `alerts.log` and the owner queue in the state
dir, and as an fgOS mailbox message to the first live agent head of the project, which the Claude session shows through
its hook (mail is "from another agent": never an approval). The machine has no display, so `notify-send` is not used.
Add a project: `install.sh --add DIR` (additive; it also runs `plan-board.mjs doctor` and sets the baseline). Stop it: `systemctl --user disable --now plan-supervisor-watchdog.timer`.
Checked on the pilot project's real data: it flags the three 2026-11-16 failures (the `infra-exec-failed` validate, the orphan killed
with its leader, the `independence-unsatisfiable` refusal) and nothing for passing runs.

## Lesson from the first pilot run (2026-11-16)

A headless leader started with `claude -p` printed nothing until it exited, a validate-plan run failed
(`infra-exec-failed`) and the leader retried; nothing told the owner until the owner asked. A plain "wait for the process"
watcher is not supervision. Rules that follow: while a leader runs, tick on a timer with `health` (not only at exit);
a failed unit run goes to the owner queue at once; the leader brief must say that an infrastructure failure is reported
(friction + queue) before any retry, which `fgos-cook` already requires ("stop and report, do not loop"). Also read the
executor each seat was bound to: the machine config may send repo content to a third-party provider.

## Known gaps (v0)

- Leader launch. `fgos run` opens only confined sessions (bwrap), so it fits the supervisor tick but not a leader. Spike
  2026-11-16: a top-level `claude -p "<brief>" --allowedTools "Bash(fgos:*)" --max-turns N` run from a script inside the
  project started in about 6 s and called `fgos` normally, so a leader can be launched that way. Not yet tried with a
  real leader brief (it needs wider tools: git, cargo, the fgos doors) and not wired into the tick; until then the owner
  starts the leader from the recipe. Unattended use needs a long-lived token: `claude` warned that the current sign-in
  ends between 2026-11-17 and 2026-11-20 (`claude setup-token` for unattended jobs).
- No scheduler: ticks are manual until the numbers say a schedule is worth it.
- `fgos-coding-shaping` exit mode ("stop at DISCUSSION.md, hand to planner", spec section 9) is not built; shapers still run as they are.
- The pre-check exists (`changed`) but nothing calls it on a schedule yet; wire it to a timer only after the manual ticks
  show how often a tick finds nothing.
