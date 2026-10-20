# Phase 03: persona scope in the loader and agent-definitions

Owner: Sonnet lead in a worktree from the track. Size M (0.5d). Starts after 02 merges (shared `run.mjs`); parallel with 04 (disjoint files).

## Context

- Spec §5.4 [G7], D9.
- Today: `src/workflow/loader.mjs:72-98` scans flat `domains/<d>/workflows/*.{yaml,yml,json}` (and core/workspace tiers above it); `src/runner/agent-definitions.mjs:36-54` `agentTierDirs` merges every domain's `agents/` into one tier and reads `<name>.yaml`.
- Convention owns names/paths: `packages/convention/contracts/convention.rules.v1.json`.

## Requirements

- Loader discovers packaged workflows `<wf>/wf.<wf>.yaml` beside flat files and attaches `{sourcePath, workflowDir, owningDomain|null}` to each loaded workflow; `owningDomain` from file location only, never from the capability prefix. Packaged and flat with the same id → load error naming both.
- `agent-definitions` lookup: workspace `fgos/agents` → `workflowDir` (`agent.<name>.yaml`) → owning domain `domains/<d>/agents` → core. A domain's personas are visible only to workflows owned by that domain; no global domain tier. `resolveAgentDefinition(name, { projectRoot, workflow })` takes the workflow's `{workflowDir, owningDomain}`.
- Resolution returns the qualified identity `<layer>:<source>/<name>` and a content digest; callers (`run.mjs`, `case-start.mjs`, `dispatch/assignment.mjs`) persist both in the binding/attempt record (field added here; Seat Binding reads it in 06).
- Persona files never carry `prefer` or `tier`: the reader refuses them by name (`persona-model-taste-not-allowed`, pointing to `capabilities.<cap>.personas.<name>`). Existing `rigor` field stays and is read by no seat-choice code.
- Convention: add the `wf.<name>.yaml` / `agent.<name>.yaml` naming rule to the rules contract; `agent-definitions` asks Convention for the names, keeps reading, order and pinning.
- `fgos agents`/listing (`agent-listing.mjs`, `agent-roster.mjs`) show the layer and scope.

## Files

- Modify: `src/workflow/loader.mjs`, `src/runner/agent-definitions.mjs`, `src/runner/agent-listing.mjs`, `src/runner/agent-roster.mjs`, `packages/convention/contracts/convention.rules.v1.json` (+ golden), `packages/convention/rust/src/rules.rs` if the rule needs code.
- Callers passing workflow context: `src/runner/execution/run.mjs` (one call site), `src/workflow/case-start.mjs`, `src/runner/dispatch/assignment.mjs`, `bin/fgos.mjs` (agents verb). 03 changes only the persona resolution call in each.

## Steps

1. Convention rule + vectors.
2. Loader packaged discovery + metadata.
3. Layered lookup with domain scoping; qualified id + digest.
4. Refuse model taste in persona files.

## Tests (proof owned)

- Adjacent persona (`agent.<name>.yaml` beside workflow A) shadows only A; workflow B in another domain resolves the domain/core persona; a domain persona is invisible to another domain's workflow.
- Packaged workflow discovered with correct `owningDomain`.
- Persona file with `prefer` refused.
- Existing `--seats "@name"` behaviour unchanged for workspace/core personas.

## Risks / rollback

- M×L: a project relies on a persona from another domain. Phase 00 lists cross-domain persona uses in shipped workflows; none expected.
- Rollback: revert the merge on the track.
