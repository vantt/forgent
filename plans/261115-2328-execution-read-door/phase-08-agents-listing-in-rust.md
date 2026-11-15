# Phase 08: the agent-definition listing in Rust

Start after: 04 landed. Wave 3, parallel with 06 and 07. Rules: [phase-lead-rules.md](phase-lead-rules.md). Facts: F2.
Worktree `erd-p08`, report slug `erd-p08-agents`. Effort: 1.5d.

## Context

`fgos agents list` reads every persona a seat lookup can find (`agent-listing.mjs:88 listAgents` over
`agent-definitions.mjs` tiers :39-51): workspace `fgos/agents`, each domain's `agents/` of the running payload, core
`core/agents`; per persona the description, shape problems, render warnings, shadows; plus masked, duplicates,
ignored. `agent-listing.mjs` keeps one Node caller after S5: the doctor row `agent-type-names-unique`
(`registrations.mjs:922,931`, `bridge:S6a`), so the Node module stays as a declared twin until S6a (D7).

## Requirements

1. `src/agents.rs`: `pub fn list(tiers: &[TierFiles]) -> Listing`, where the host gives each tier's files as
   `(name, rel, bytes|unreadable)` in lookup order; YAML parsed with `fgos-yaml-doc`; shape problem
   (`shapeProblemOf`, incl. the persona-model-taste refusal with 03's message), render warnings
   (`agentRenderWarnings` :32), description (`agentDescription` :52, whitespace folded), shadows, masked, duplicates,
   ignored (`.yml`). Pure.
2. `packages/execution/contracts/agents.v1.json`: vectors (a tier set in, the listing out), recorded from Node.
3. `tests/golden_agents.rs` over the vectors; Node twin proof: `test/runner/agent-listing.test.mjs` is reduced to one
   test that runs the same vectors through `listAgents` (its other cases move to the Rust golden; each retired case
   named in the report).

## Files

- Create: `packages/execution/rust/src/agents.rs`, `packages/execution/contracts/agents.v1.json`,
  `packages/execution/rust/tests/golden_agents.rs`.
- Modify: `packages/execution/rust/src/lib.rs`, `test/runner/agent-listing.test.mjs`, `test/suite-baseline.json`
  (regenerated if the test count changes), mutation census.
- Delete: none. Tests retired: the listing cases of `agent-listing.test.mjs`, owner `golden_agents.rs`.
- Net size: about +350 Rust, +300 vector lines, -150 Node test lines.

## Acceptance

- Vectors pass in Rust and through `listAgents`.

## Risks / rollback

- YAML read differences between the Node door and `fgos-yaml-doc` (L x M): the Node door is the same crate through the
  addon (`src/util/yaml.mjs`), so parsing is one implementation. Revert: one commit.
