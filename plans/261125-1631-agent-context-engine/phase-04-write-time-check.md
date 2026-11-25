# Phase 4: Refuse a bad rule when it is written

ACE-D5 (2): ACE refuses a bad rule when it is written, never at agent start. ACE-D6: the nearest-rule search uses
pkm. The P2 report shows why checks by id are not enough: almost every conflict sits between rules that share no id
and no wording.

## Context

- The crate, the store adapter and the `check` op from phase 3; `reports/pkm-fit.md` for the threshold and the draft
  query method.
- The pre-commit hook `.githooks/pre-commit` (775 lines; one shared root-file allowlist and data-loss guards).
- The doctor rows `doc-locate-model` and `doc-locate-model-fetch` (`packages/distribution/contracts/doctor-registry.v1.json`),
  which already fetch the embedding model that pkm search uses.

## Requirements

- Structural checks (always): schema, owner, `when:` keys and values, duplicate id (R16), replacement completeness
  (R12), cardinality (R15), dependency in force, `conflicts_with` between two in-force rules, a narrower rule
  overriding a `law`.
- Nearest-rule check (for each added or edited unit): query the in-force set with the unit's text; a hit above the
  threshold refuses the unit until the unit declares a relation to that rule: `superseded_by` on the old one,
  `refines`, `depends_on`, `conflicts_with` (which then fails structurally until one side is retired), or `related`
  meaning "checked, distinct". No new edge type is added for this.
- Each refusal names the rule, the nearest rule with its score, and the fix.
- Behaviour without the model follows owner question 2 in plan.md (recommended: refuse with `rule-search-unavailable` and the
  `doc-locate-model-fetch` fix).

## Files

`packages/agent-context-engine/rust/src/check/**`, `packages/agent-context-engine/rust/tests/check*.rs`,
`apps/fgos/src/wiring/context_engine/**`, `apps/fgos/tests/context_engine.rs`, `.githooks/pre-commit`.

## Steps

1. Implement the nearest-rule check in the crate behind the `NearestRules` port, with the pkm search adapter in the
   store module. Use the threshold the probe chose, as a constant in the pack profile (`audit.implicit.min`), not a
   new config key.
2. Extend `check` to take a list of changed unit paths, so the hook checks only staged units and the build checks all.
3. Add one block to `.githooks/pre-commit`: when staged paths match the three unit roots, call
   `fgos internal context-engine check --paths <staged>` and refuse the commit on a refusal. Keep it inside the
   existing structure; no new hook file.
4. Tests: one per refusal at the crate level (owning proofs), with pkm's deterministic test embedder; one wiring
   proof at the door.

## Validation

- `cargo test -p fgos-agent-context-engine --all-features` covers every refusal, including a paraphrase pair taken
  from cluster 1 of the P2 report that must be refused, and a distinct rule that must pass.
- A scratch commit of a unit that restates `AGENTS.md:216` in other words is refused by the hook; adding
  `related` to the existing rule lets it through.

## Risk

Medium. False positives block authors; the `related` edge is the escape, and it stays visible in review. Threshold
drift is controlled by pkm's `tune-implicit-threshold` playbook. The hook must stay fast: it checks only staged
units against a warm index.

## Rollback

Revert the commit. Structural checks from phase 3 still run at compile; only the write-time gate goes.
