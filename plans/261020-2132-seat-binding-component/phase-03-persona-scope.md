# Phase 03: persona scope in the loader and agent-definitions

Owner: Sonnet lead in a worktree from the track. Size M (0.5d). After 02 merges (shared `run.mjs`, Convention contracts); parallel with 04 (disjoint files).

## Context

- Spec `docs/specs/seat-binding.md` §6.4 [G7], D9 (§15) [RT-16b].
- Today: `src/workflow/loader.mjs:72-98` scans flat files; `src/runner/agent-definitions.mjs:36-54` `agentTierDirs` merges every domain's `agents/` into one tier and reads `<name>.yaml`.
- Convention owns names/paths: `packages/convention/contracts/convention.rules.v1.json`.

## Requirements

- Loader discovers packaged workflows `<wf>/wf.<wf>.yaml` beside flat files and attaches `{sourcePath, workflowDir, owningDomain|null}`; `owningDomain` from location only. Packaged and flat with one id → load error naming both.
- `agent-definitions` lookup: workspace `fgos/agents` → `workflowDir` (`agent.<name>.yaml`) → owning domain `domains/<d>/agents` → core. A domain's personas are visible only to workflows owned by that domain. `resolveAgentDefinition(name, { projectRoot, workflow })` takes `{workflowDir, owningDomain}`.
- Resolution returns qualified identity `<layer>:<source>/<name>` and a content digest; callers persist both in the attempt record (Seat Binding reads them from 06).
- Persona files never carry `prefer` or `tier`: refused `persona-model-taste-not-allowed`, pointing to `capabilities.<cap>.personas.<name>`. Existing `rigor` field stays, read by no seat-choice code.
- Convention: add the `wf.<name>.yaml` / `agent.<name>.yaml` rule; `agent-definitions` asks Convention for names, keeps reading, order, pinning.
- [RT-16c] No change to `fgos agents` listing output (not in the spec); `agent-listing.mjs`/`agent-roster.mjs` change only if the new lookup signature forces a call-site edit.

## Files

- Modify: `src/workflow/loader.mjs`, `src/runner/agent-definitions.mjs`, `packages/convention/contracts/convention.rules.v1.json` (+ golden), `packages/convention/rust/src/rules.rs` if needed.
- Call sites passing workflow context (persona resolution call only): `src/runner/execution/run.mjs`, `src/workflow/case-start.mjs`, `src/runner/dispatch/assignment.mjs`; `bin/fgos.mjs`, `agent-listing.mjs`, `agent-roster.mjs` only for the signature.

## Steps

1. Convention rule + vectors.
2. Loader packaged discovery + metadata.
3. Layered lookup with domain scoping; qualified id + digest.
4. Refuse model taste in persona files.

## Tests (proof owned)

- Adjacent persona shadows only its own workflow; another domain's workflow resolves its own domain/core persona; a domain persona is invisible to other domains.
- Packaged workflow discovered with correct `owningDomain`.
- Persona file with `prefer` refused.
- `--seats "@name"` unchanged for workspace/core personas.

## Risks / rollback

- M×L cross-domain persona reliance; phase 00 lists any. Rollback: revert on the track.
