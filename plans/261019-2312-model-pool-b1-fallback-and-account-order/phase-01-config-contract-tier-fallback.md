# Phase 01: `runner.tierFallback` contract, validator, doctor check

## Context

- [plan.md](plan.md) D8, owner decisions 1 and 2. Parallel with phase 02 (disjoint files).
- Model: `validateModelPoliciesShape` (`src/runner/dispatch/config.mjs:1468`), `MODEL_POLICY_TIERS` (`:577`), doctor `model-policy-pools` in `src/setup/model-pool-checks.mjs`.

## Requirements

- `runner.tierFallback` maps a tier to an ordered list of family names: `{ "advanced": ["gemini", "deepseek", "z-ai", "claude", "openai"] }`. Family = a `modelPolicies` key (GLM is `z-ai`).
- Shape errors throw `RunnerConfigError` at load, naming the key: a key outside `MODEL_POLICY_TIERS`, an empty list, a non-string, a repeated family. Semantic problems (family without a cell at that tier, unknown family) are doctor warnings, because at runtime such a family is skipped and recorded, never fatal.
- A tier with no list keeps today's walk (`prefer` order after the failed candidate). So a project without the key behaves exactly as before.
- Allowed in global and project config (project replaces a tier's list); phase 06 puts it in the project config only.
- One reader: `tierFallbackOf(runnerConfig, tier)` in `resolve.mjs` next to `resolveTierCandidates`, returns the list or `null`.

## Files

- Modify: `src/runner/dispatch/config.mjs` (shape check beside `:1468`), `src/runner/dispatch/resolve.mjs` (helper), `src/setup/model-pool-checks.mjs` (check), `src/setup/registrations.mjs` (one registry row for `tier-fallback`, small separate commit).
- Tests: `test/runner/dispatch-config.test.mjs` or the existing config shape test file (find with `rg -l validateModelPoliciesShape test`), `test/setup/model-pool-checks.test.mjs`.

## Steps

1. Add `validateTierFallbackShape` and call it where `validateModelPoliciesShape` is called.
2. Add `tierFallbackOf`.
3. Doctor `tier-fallback` (warn): a listed family with no `modelPolicies.<family>.<tier>`; a listed name no executor serves. The message names tier and family. Passing message counts the tiers declared.
4. Install/setup/doctor gate: the check is the registration; no new default, env var or file.

## Tests (decision 1 and 2 inputs)

- Valid list loads; each shape error throws with the key path.
- A config without the key loads and `tierFallbackOf` returns `null`.
- Doctor warns for a family missing a cell at that tier, passes otherwise.
- A config with the key loads under the previous release's loader (phase 00 fact 6, rerun here against the new fixture).

## Risk / rollback

Low x low. Old releases ignore the key. Revert the commit; configs without the key are unaffected.
