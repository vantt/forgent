# Phase 4: Golden openings and before-bytes from today's code

This phase captures what agents receive today, before anything moves. Phase 5 must reproduce this text, except for
the three named fixes. These goldens are the owning proof for start text (design principle 8).

## Inputs

- Head opening: `src/session-host/head-start.mjs` (`openingText`, `FIRST_STEPS`, `taskBriefOf`), and
  `src/runner/agent-definitions.mjs` (`renderPersonaSection`, `renderOnWake`).
- Personas: `core/agents/*.yaml`.
- Worker prompt: `packages/execution/engine/src/assignment/builder.rs` (`render_assignment_prompt`),
  `packages/execution/engine/src/assignment/brief.rs` (`render_brief`) and
  `apps/fgos/src/wiring/unit_run_host/persona.rs`. Worker operations: the role tasks in the execution engine's
  `role_tasks_data.rs`.
- Agent files: `scripts/project-agents.mjs` and its output in `.claude/agents/`.

## Footprint

`packages/agent-start-context/goldens/**`, `plans/261122-1946-agent-start-context/reports/before-bytes.md`.

## Steps

1. Write a small recorder script under `packages/agent-start-context/goldens/record.mjs`. It calls today's code
   paths, read-only, with fixed inputs: one head opening per persona that a head runs as today (at least secretary,
   shaper, planner, supervisor, lead), with and without a task, handoff and question; one worker prompt per role task,
   in both `-p` and terminal-brief form; one agent file per projected agent.
2. Write each output to `packages/agent-start-context/goldens/<delivery>/<case>.txt`, plus `cases.json` with the
   inputs. Record in `NOTES.md` the three fixes phase 5 is allowed to make:
   - the empty `domains/<domain>` gets filled in;
   - the preamble is worded for heads instead of workers;
   - the handoff appears once instead of twice.
3. Write `reports/before-bytes.md`: the bytes and the approximate tokens (bytes/4) of each golden, plus the
   always-loaded AGENTS.md and CLAUDE.md bytes for this repo, measured the same way as the discussion's `#ambient`.

## Verify

- Running `node packages/agent-start-context/goldens/record.mjs --check` twice on the same tree gives identical
  files.
- `reports/before-bytes.md` has one row per golden case.

## Rollback

Revert the commit. Only new files are added.
