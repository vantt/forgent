# Golden openings and agent files

What heads and agent files received at start before the producers moved to the composer
(`docs/platform/agent-start-context/spec.md`). They were recorded from the Node producers of that time (the head
opening in `src/session-host/head-start.mjs`, the persona and on-wake renderers in `src/runner/agent-definitions.mjs`,
`projectAgentMarkdown` in `scripts/project-agents.mjs`), which are deleted; `cases.json` lists the inputs and the base
commit. The owning proof is now `packages/agent-start-context/rust/tests/goldens.rs`: it composes every case through
`compose` and compares it byte for byte. A golden changes only by hand, for one of the changes below, named here.

- `opening/<persona>-<variant>.txt`: one head opening per head persona (secretary, supervisor, shaper, planner, lead),
  plain and with a task, a handoff and a question.
- `agent-file/<persona>.md`: one `.claude/agents` file per persona definition.

Worker prompts are not here. Their persona block is owned by the host's `section_tests`
(`apps/fgos/src/wiring/unit_run_host/persona.rs`, the seven cases that owned the Node renderer), and the rest of a
worker prompt and brief by the execution vectors (`packages/execution/engine/tests/assignment.rs`).

## The three changes the composer is allowed to make

Phase 5 must reproduce every golden byte for byte, except:

1. The empty `domains/<domain>` in a head's text is filled in with the domain of the head's bound item.
2. The preamble is worded for heads instead of workers.
3. The handoff appears once instead of twice (today it reaches a successor through the opening and through the
   SessionStart text).

Any other difference is a regression. A golden regenerated for one of these three names the change here.

## Recaptured

- 2026-11-27: the four `lead` openings, because `core/agents/lead.yaml`'s `on_wake` changed in `ecc52ee39` (a park is
  raised as an event, never a commit). Captured again from today's producers before any producer moved.
- 2026-11-27: the five `<persona>-handoff` openings, for change 3. The handoff text (the fixture in `cases.json`) is now
  the last section of the opening, from the `rotation-handoff` contributor. The ritual's first line says so and keeps
  the file path, and the SessionStart hook no longer prints the handoff.
- 2026-11-27: `shaper-task-coding`, new, for change 1: the `shaper-task` opening of a shaper whose discussion names
  `domain: coding`, with `domains/<domain>/` filled in. No other byte differs.
- 2026-11-27: the secretary, supervisor and shaper agent files and their openings (16 goldens), because
  `core/agents/{secretary,supervisor,shaper}.yaml` replaced the decision boundary "Anything outside the approved frame
  (scope and budget set at approval)" with "A change to an approved goal: outcome, acceptance, a standing constraint, or
  an owner order" (the when-to-ask rule in `core/skills/_shared/decision-question.md`). Only that line differs.
