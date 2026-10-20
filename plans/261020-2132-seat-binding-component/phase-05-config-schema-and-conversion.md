# Phase 05: config schema, cells, `$comment`, fence sentinel, pure conversion function

Owner: Sonnet lead in a worktree from the track. Size M (1d). After 04; may run beside 03.

## Context

- Spec `docs/specs/seat-binding.md` §5.1 (`$comment`), §5.3 (cells), §6.2 (schema), §6.3 rules, §9 steps 2, 4, 5, 7 [RT-16b].
- Today: capability key allowlist `config.mjs:1364`; `patterns` allowlist `:1389-1393` (strict); `rigorToTier` required :1710-1715; `REASONING_EFFORT_VALUES` :519; `MODEL_POLICY_TIERS` :577; `parseTierCell` `tier-cell.mjs:25-40`; global merge `config.mjs:359` with `sanitizeGlobal: sanitizeGlobalModelPolicies` (:300).
- Global `~/.fgos/config.json` (both machines) carries `rigorToTier` and bare-verb capabilities `advise`, `execute`, `review` [RT-1].

## Requirements

- Loader accepts (validation only; read from 06): `runner.defaults.tier`, capability `tier`, `maxTier`, `roles.<role>.{tier,prefer}`, `personas.<name>.{tier,prefer}`, `seats.<seat>.{tier,prefer}`; five-role keys only; tier values against the vocabulary; `prefer: []` = load error.
- `$comment` keys ignored at every level, stripped before validation and before the semantic config hash.
- [RT-3] **Fence sentinel**: the schema marker is `runner.patterns.seatBinding = { "schema": 1 }`. The pre-wave validator rejects any unknown key inside `patterns` (`config.mjs:1389-1393`), so **every** converted file, including mdview and mcp-skill-hub (no capability rigor), fails on an old release even after the global merge supplies `rigorToTier`. (Phase 00 confirmed it; if not, the lead uses the strict map phase 00 names.) This phase only accepts the key; 06 requires it on the project layer.
- Cells: `parseTierCell` accepts `"<model>[@<pool>]"`, `{model, pool?, effort?}`, non-empty arrays; effort in `REASONING_EFFORT_VALUES` only; string cells unchanged; all three consumers read the parsed form.
- New keys are project-only (spec §9 step 5): the loader refuses them in the global layer, naming project config.
- Pure conversion `src/setup/seat-binding-conversion.mjs` `convertRunnerConfig(projectRunner, { globalRunner, registeredCapabilities, ladder }) -> { runner, changes[], reports[] }`, deterministic, idempotent, **writes the project layer only**:
  - [RT-2] trigger: `rigorToTier` present in the project layer **or** `patterns.seatBinding.schema` absent; never the marker alone;
  - delete project `rigorToTier`; `defaults.tier` = effective `rigorToTier.standard` (project, else global, else `standard`);
  - [RT-16d] **capability rigor only**: per capability with `rigor`, `tier = rigorToTier[rigor]` when ≠ `defaults.tier`; `maxTier` = that tier when above global `maxTier`. Unit rigor no longer raises tier (D2): `reports[]` lists every workflow unit with `rigor`, every guide `rigorFloor` and every capability where a `--rigor` would have raised tier today (phase 00 list), so the printed diff shows what changes;
  - [RT-1, P00-C15] bare verbs, simplified: phase 00 measured that no `<prefix>:v` capability in any of the three workspaces takes `prefer` from a bare verb, and the global bare entries (`advise`, `execute`, `review`) carry only setup's `DEFAULT_CAPABILITY_SLOTS` keys (`description`, `confinement`, `serves`). The only key that can change behaviour when the bare-verb fallback goes is `confinement` (a safety policy). So: for each registered `<prefix>:v` with no project entry of its own whose merged bare-verb entry `v` has a `confinement`, copy **only `confinement`** into a new project entry; every other inherited key (`prefer`, `persona`, `minCheckers`, `rigor`) is listed in `reports[]`, never copied (expected empty on all three workspaces). `description`/`serves` are catalog text and are not copied. The global bare entries stay as exact keys for capabilities literally named `v`;
  - add `mini` to `tierFallback` (copy of `nano`, else `standard`), recorded;
  - keep string cells, `prefer` key and shape;
  - write `$comment` beside `modelPolicies`, `tierFallback`, `maxTier` from `ladder`;
  - set `patterns.seatBinding.schema = 1`.
  Second run returns `changes: []`.

## Files

- Modify: `src/runner/dispatch/config.mjs`, `src/runner/dispatch/tier-cell.mjs`, `src/runner/dispatch/resolve.mjs`, `src/setup/model-pool-checks.mjs` (parsed cells only), `docs/architecture-manifest.json` (new module).
- Create: `src/setup/seat-binding-conversion.mjs`, `test/setup/seat-binding-conversion.test.mjs`.
- Tests: `test/runner/tier-cell.test.mjs`, `test/runner/tier-fallback-config.test.mjs`, `test/setup/checks-doctor-config.test.mjs`.

## Steps

1. Schema keys, `$comment` stripping, sentinel acceptance + tests.
2. Cell forms + tests.
3. Conversion with fixtures: forgentX `.fgos/config.json` (read, not changed), a minimal project with no capability rigor (mdview-like), a project with bare-verb entries, and a **real global file carrying `rigorToTier` and `review`/`execute`/`advise`** [RT-1]; idempotency test.

## Tests

- Each new key validates; invalid values fail with the key path; new keys in the global layer refused.
- `$comment` anywhere does not change the hash.
- Conversion idempotent; triggered again when `rigorToTier` reappears in the project file.
- For the forgentX config, every capability's converted tier equals today's `resolveSeatTier` (`bind.mjs:141`) at unit rigor `standard`.

## Risks / rollback

- M×M conversion picks a tier different from today's capability tier → the equality test above. Rollback: revert on the track (accepting keys changes no behaviour).
