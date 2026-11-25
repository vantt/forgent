# Phase 4: Golden openings and before-bytes from today's code

This phase captures what heads and agent files receive today, before anything moves. Phase 5 must reproduce this
text, except for the three named fixes. These goldens are the owning proof for start text (design principle 8).
It writes only new files. It starts after ACE phase 1 has landed (owner, 2026-11-25 20:4x: ACE phase 1 runs
first and alone), and needs nothing from ACE.

Worker prompts are not captured here: they are rendered only inside the `fgos` binary (`apps/fgos` has no library
target; `persona.rs` and `HostPrompt` are private to it), and no host op renders a prompt without running a unit
(`execution-routes.v1.json` operations: `run-unit`, `launch-session`, `custody`, `verify`, `sweep-attempts`,
`cancel`, `stale-runs`, `purpose-seat`, `tool-abilities`). Phase 5 captures them with a host test as its first
commit, before any producer moves.

## Inputs

- Head opening: `src/session-host/head-start.mjs` (`defaultOpening` line 99, `FIRST_STEPS` line 104, `taskBriefOf`
  line 111, `openingText` line 114), and `src/runner/agent-definitions.mjs` (`renderOnWake` line 291,
  `renderPersonaSection` line 310).
- Personas: `core/agents/*.yaml` (14 files; `lead`, `planner` and `supervisor` carry `on_wake`).
- Agent files: `scripts/project-agents.mjs` (`projectAgentMarkdown` line 111) and its output in `.claude/agents/`.
- Always-loaded text: `AGENTS.md`, `CLAUDE.md`, and the main checkout's AgentKit `.claude/rules/*.md` (ignored by
  git, `.gitignore:64`, so absent from a linked worktree: measure it in the main checkout, read-only).

## Footprint

`packages/agent-start-context/goldens/**`, `plans/261122-1946-agent-start-context/reports/before-bytes.md`.

## Steps

1. Write a small recorder script at `packages/agent-start-context/goldens/record.mjs`. It calls today's Node code
   paths, read-only, with fixed inputs: one head opening per persona that a head runs as today (at least secretary,
   shaper, planner, supervisor, lead), with and without a task, handoff and question; one agent file per projected
   agent. It records the base commit in `cases.json`.
2. Write each output to `packages/agent-start-context/goldens/<delivery>/<case>.txt`, plus `cases.json` with the
   inputs. Record in `NOTES.md` the three fixes phase 5 is allowed to make:
   - the empty `domains/<domain>` gets filled in;
   - the preamble is worded for heads instead of workers;
   - the handoff appears once instead of twice.
3. Write `reports/before-bytes.md`: the bytes and the approximate tokens (bytes/4) of each golden, plus the
   always-loaded AGENTS.md (split into fgOS-owned sections, the instruction projection, and the external GitNexus,
   MDView and AgentKit blocks), CLAUDE.md and `.claude/rules` bytes, measured the same way as the discussion's
   `#ambient`.

## Verify

- Running `node packages/agent-start-context/goldens/record.mjs --check` twice on the same tree gives identical
  files.
- `reports/before-bytes.md` has one row per golden case and one row per always-loaded part.

## Rollback

Revert the commit. Only new files are added.
