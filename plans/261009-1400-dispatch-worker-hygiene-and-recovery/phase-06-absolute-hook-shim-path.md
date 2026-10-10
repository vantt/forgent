---
phase: 6
title: "Absolute shim path in codex and agy hook commands"
status: pending
budget: "<= 40 added src lines; 0 new files; no durable state"
stop: 2026-10-14
---

# Phase 06: absolute shim path in codex and agy hook commands

## Context

- [plan.md](plan.md); installer `src/setup/agent-hooks.mjs` (codex hooks ~L202-295, agy groups ~L296-390); generated files `.codex/hooks.json`, `.agents/hooks.json` are gitignored, written per machine.
- Proven 2026-10-10 on mcp-skill-hub: the hook command `.fgos/installation/bin/fgos hook dispatch-decide --format=agy` is cwd-relative. Inside the worker's bwrap sandbox (`--ro-bind / /`, nothing hidden) it exits 0 from the project dir and 127 from `/` or `/tmp`. agy runs hooks outside the project dir, so every tool call fails (`sh: 1: .fgos/installation/bin/fgos: not found`).
- codex runs hooks with the session cwd (`codex-rs/hooks/src/engine/command_runner.rs`: `current_dir(cwd)`) and exports no project-dir variable; relative works only when the session starts at the project root. claude's installer already uses `"${CLAUDE_PROJECT_DIR}/..."`.
- A generic project-dir variable does not exist outside claude; fgOS can set one only for workers it launches, so a hand-started session would expand it to nothing. An absolute path works everywhere.

## Decision

Generate the codex and agy hook commands from the repo root: a single-quoted absolute path to `<repoRoot>/.fgos/installation/bin/fgos`. claude keeps `${CLAUDE_PROJECT_DIR}`. Old relative entries are rewritten by the existing replace logic (no alias, no legacy form). Moving a project means rerunning `fgos setup`; `fgos doctor` already reports a hook that is not canonical.

## Requirements

- One helper builds the command (quoting safe for paths with spaces/quotes); both codex and agy specs derive from it.
- install and check use the same spec for the same root; an old relative entry is reported by doctor as non-canonical and replaced by install.
- Codex hook trust hashes change with the command (a person's earlier review shows "modified" once). State this in the changelog line.

## Files

- Modify: `src/setup/agent-hooks.mjs`.
- Tests: `test/setup/agent-hooks.test.mjs` (absolute command written; old relative entry replaced; check flags a relative entry; a path with a space/quote is quoted).
- Docs: `docs/specs/distribution.md` doctor/setup row if it names the command; `CHANGELOG.md` `## [Unreleased]`.

## Steps

1. Impact (capability gate): callers of `installCodexHook`, `installAgyHook`, `checkCodexHook`, `checkAgyHook`.
2. Helper + specs from root; keep claude untouched.
3. Tests, then `npm test`.
4. Independent review (shared setup code, every project). Merge. Re-run `fgos setup` in mcp-skill-hub is the owner's call (it edits that project's ignored files); verify with the gemini probe.

## Done

Gemini probe seat in mcp-skill-hub (hooks regenerated) runs its first tool call without exit 127.

## Risks / rollback

- Absolute path breaks if the project directory is renamed: doctor flags it, setup repairs it.
- Rollback: revert the commit; rerun setup.
