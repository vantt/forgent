# Golden openings and agent files

What heads and agent files receive at start today, captured before any producer moves to the composer
(`docs/platform/agent-start-context/spec.md`). `record.mjs` writes them from fixed inputs by calling today's Node code
read-only (`src/session-host/head-start.mjs` `openingText`, `src/runner/agent-definitions.mjs`
`renderPersonaSection` and `renderOnWake`, `scripts/project-agents.mjs` `projectAgentMarkdown`); `cases.json` lists the
inputs and the base commit. `node packages/agent-start-context/goldens/record.mjs --check` rebuilds them in memory and
fails on any difference.

- `opening/<persona>-<variant>.txt`: one head opening per head persona (secretary, supervisor, shaper, planner, lead),
  plain and with a task, a handoff and a question.
- `agent-file/<persona>.md`: one `.claude/agents` file per persona definition.

Worker prompts are not here: they are rendered only inside the `fgos` binary; phase 5 captures them with a host test
as its first commit.

## The three changes the composer is allowed to make

Phase 5 must reproduce every golden byte for byte, except:

1. The empty `domains/<domain>` in a head's text is filled in with the domain of the head's bound item.
2. The preamble is worded for heads instead of workers.
3. The handoff appears once instead of twice (today it reaches a successor through the opening and through the
   SessionStart text).

Any other difference is a regression. A golden regenerated for one of these three names the change here.
