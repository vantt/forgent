---
phase: 2
title: "Agent definitions are found only through the agent-definitions door"
status: pending
effort: 1d
leak: "census rank 2 (three of four choosers; the doctor chooser is phase 16)"
startAfter: ["F0 wave A on main"]
landAfter: []
---

# Phase 02: Agent definitions only through their door

Rules: `phase-lead-rules.md`. pNN = `p02`; report slug `odd-p02-persona-tiers`; no Rust. Facts: `phase-00-facts.md` "Leak 2".

## Outcome

`src/runner/agent-definitions.mjs` is the only module that knows the tier directories and their order. The assignment
renderer, the Work roster and the `.claude/agents` generator ask it. The doctor chooser in `src/setup/registrations.mjs`
stays as one visible debt entry until phase 16 (the capability plan rewrites that file first).

## Requirements

1. `src/runner/dispatch/assignment.mjs` `renderPersonaSection` (:631-689): when no text is pinned, read the persona with
   `resolveAgentDefinition(ref, { projectRoot: root })` (its `installRoot` default) instead of building `<root>/core/agents/<ref>.yaml`.
   Keep today's output when the persona is missing (`AgentNotFoundError` -> the same section text as a missing file today) and
   when it does not parse (the same parse-failure line). The lookup now also sees the workspace and domain tiers: that is the fix.
2. `src/runner/agent-roster.mjs` `loadAgentRoster`: build the roster from `scanAgentTiers({ projectRoot: cwd })` in the door's
   order (first tier wins, as `listAgents` does), reading each file with `readAgentDefinition`. Drop the legacy `cwd/agents`
   scan and the core-first order (phase 00: undocumented, and an agent the door cannot resolve cannot run). Keep the exported
   shape `work-dispatch.mjs:76` reads.
3. `scripts/project-agents.mjs` `findAgentYamlFiles` (~:100-137): enumerate through `scanAgentTiers` (drop its own core/domains/legacy
   walk; keep its validation). The generated `.claude/agents/**` must not change: run the generator and require an empty diff;
   if the workspace tier adds files in this repo, stop and ask the big lead.
4. Same file, its YAML writer (:170-175, census 4.2 small second writer): after building each agent's frontmatter text, parse it
   back with `parseYaml` and compare with the values it meant to write; refuse (exit non-zero naming the agent and field) on a
   mismatch. No emitter is added (plan.md ideas); this makes the hand-joined text provably YAML.
5. `doors` row (new, `kind: door`):
   `{ job: "agent definition tier directories", patterns: ["['\"]core['\"],\\s*['\"]agents['\"]", "['\"]fgos['\"],\\s*['\"]agents['\"]", "core/agents/\\$\\{"], allowed: ["src/runner/agent-definitions.mjs"], debt: [{ path: "src/setup/registrations.mjs", reason: "doctor claims/skills walk (allAgentYamlFiles, readAgentSkills) re-walks the tiers and reads the project's own domains/; moved after the capability plan rewrites the file" }], reason: "one module knows the tier directories and their order" }`.
   Re-run the patterns: every other match must be gone or be a different job (then narrow the pattern and say why). If
   `src/runner/agent-listing.mjs` matches, it must not: it reads through the door.

## Files

- Modify: `src/runner/dispatch/assignment.mjs` (`renderPersonaSection` only), `src/runner/agent-roster.mjs`, `scripts/project-agents.mjs`,
  `docs/architecture-manifest.json` (the row).
- Tests: extend `test/runner/assignment.test.mjs` (:160-200): an unpinned persona present only in the workspace tier renders its
  text (new behaviour; why new: no test covers tier lookup in the renderer); a missing persona keeps today's text.
  `test/runner/agent-roster.test.mjs`: cases that assert core-first order or the legacy `agents/` directory are retired
  (behaviour removed); one case that a workspace definition shadows core (owner: the door's order, proven in
  `test/runner/agent-definitions.test.mjs`; the roster keeps one wiring case). `test/scripts/project-agents.test.mjs`: one case
  for the round-trip refusal.
- Delete: none.
- Net size: src about -40, tests about +30 -40.

## Gates

`node scripts/run-tests.mjs test/runner/assignment.test.mjs test/runner/agent-roster.test.mjs test/runner/agent-definitions.test.mjs test/runner/agent-listing.test.mjs test/scripts/project-agents.test.mjs test/architecture.test.mjs test/scripts/doc-health.test.mjs test/setup/git-mutation-census.test.mjs`
plus `rg -l "agent-roster|renderPersonaSection|work-dispatch" test`; `node scripts/project-agents.mjs` (or its npm script) gives no diff.

## Risk and rollback

- Eligibility changes for a project that relied on `agents/` or core-first shadowing (L x M): such an agent already failed at
  dispatch resolve; record in the report and propose the `## [Unreleased]` line.
- Rollback: revert the phase.
