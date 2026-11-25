# Phase 1: Area spec and v1 contracts

The spec comes before the code (L5 question 2). This phase writes only new files. Registering the component, the
generated views, the reading-map row and the RUL102 successor are phase 3, because they sit in files a running plan
holds.

## Context

- ACE-D1 to ACE-D6 in [ds-e26zcar63f](../discussions/ds-e26zcar63f-agent-context-engine/DISCUSSION.md), and ASC-D8,
  ASC-D9 in [ds-2d55ty37zz](../discussions/ds-2d55ty37zz-agent-start-door-and-context-seam/DISCUSSION.md).
- The composition semantics to carry over: [instruction-composition-and-projection.md](../../docs/platform/packaging-distribution/contracts/instruction-composition-and-projection.md)
  §4-9 (roots, unit fields, rule force, order, override and conflict rules, effective set).
- Today's unit frontmatter and checks: `src/setup/instruction-registry.mjs:27-83` (kinds, modes, scopes,
  specificity), `:120` (law supersession evidence), `:186` `compileInstructionUnit`.
- pkm's model, read on `d488fe0`: lifecycle classes `crates/pkm-core/src/schema.rs:427-470`, roles (`lifecycle`,
  `valid_from`, `valid_to`, `replaced_by`, `amends`, `id`, `group`), pack files with custom node types and edges
  (README "Type riêng của vault"), validate rules R12, R14, R15, R16.
- Contract pattern: `packages/questions/contracts/` (input schema plus `refusals.v1.json`); spec pattern:
  `docs/platform/agent-protocol/spec.md`.
- `fgos authority locate` on 2026-11-25 ("agent context engine", "agent rule store", "instruction composition"):
  no component row; the only direct match is the contract row
  `docs.packaging-distribution/instruction-composition-and-projection`. The id `agent-context-engine` is free.

## Requirements

- The spec states the three roles (ACE-D2), the contract with ASC (ACE-D5) and pkm as the engine (ACE-D6), each with
  its decision id, and that ACE never depends on ASC or the documentation component.
- `when-keys.v1.json` is ACE's registry of keys a rule may use (ACE-D5 (3)). It declares, per key, the value type
  and the live source of allowed values. Which keys a start kind must supply is not here; that is ASC's
  `start-request.v1.json`.
- `effective-rules.v1.json` is the hand-off to ASC: a schema version, the `when-keys` version it was checked
  against, a digest, and the in-force rules in composition order, each with id, owner, kind, scope, specificity,
  body, sources and `when:`.

## Files

Create only:
- `docs/platform/agent-context-engine/spec.md`
- `packages/agent-context-engine/contracts/rule-unit.v1.json`
- `packages/agent-context-engine/contracts/when-keys.v1.json`
- `packages/agent-context-engine/contracts/effective-rules.v1.json`
- `packages/agent-context-engine/contracts/refusals.v1.json`
- `packages/agent-context-engine/contracts/vectors/**`

## Steps

1. Write the spec. It covers purpose and scope (fgOS-owned rule text, ASC-D2); owner and tier 3 with allowed
   dependencies (tier 3 or below, plus pkm); the ports `RuleStore` (pkm adapter: index, in force, validate),
   `NearestRules` (pkm search, write time only), `OwnerRegistry` (component authority model) and `ValueSource` (live
   values for `when:` keys); the rule schema; the write-time checks; the compile step and its digest; the read path
   (a JSON file, no pkm, no model); the mapping of today's fields (`supersedes` becomes `superseded_by` on the old
   rule, `conflictsWith`, `dependsOn`, `refines` become ACE pack edges, `appliesTo` and `scope` become `when:` keys);
   and a "Lịch sử quyết định" section carrying ACE-D1 to ACE-D6 and RUL102 with dates and links.
2. Write `rule-unit.v1.json`: the frontmatter of a rule unit, as the pkm pack file will declare it (type `rule`,
   roles `id` with `id_scope: vault`, lifecycle classes, `valid_from`, `valid_to`, `superseded_by`, and the edges
   `refines`, `depends_on`, `conflicts_with`, `related`), plus the fgOS fields `owner`, `kind`, `mode`, `scope`,
   `specificity` and `when`.
3. Write `when-keys.v1.json` with the rows `kind`, `cli`, `project`, `persona`, `role`, `domain`, `workflow`,
   `stage`, each with its value type and value source. Decide in the spec whether today's component-scoped unit
   (`components/packaging-distribution/instructions/verification.md`) needs a `component` key or maps onto an
   existing one, and keep today's repo projection byte-identical either way.
4. Write `effective-rules.v1.json` and `refusals.v1.json`. Refusals, at least: `rule-when-key-unknown`,
   `rule-when-value-invalid`, `rule-owner-unknown`, `rule-id-duplicate`, `rule-replacement-incomplete`,
   `rule-dependency-not-in-force`, `rule-conflict-in-force`, `rule-law-overridden`, `rule-near-duplicate`,
   `rule-search-unavailable`, and for readers `rule-set-digest-mismatch`, `rule-set-version-unsupported`.
5. Add vectors: one valid unit, one per refusal, and one effective set with its digest.

## Validation

- `node -e` parses every schema and vector file.
- `node scripts/doc-health.mjs docs/platform/agent-context-engine/spec.md` passes.
- The spec names an owner and a tier, and every refusal in `refusals.v1.json` appears in it.

## Risk

Low. New files only. The schema may change after phase 2's probe; phase 3 updates it in the same commit as the code
that reads it.

## Rollback

Revert the commit.
