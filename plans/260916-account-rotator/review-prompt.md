# Review prompt — Provider Capacity Rotator design

You are reviewing an fgOS design before implementation. Do not implement code.
Your job is to challenge the design for correctness, simplicity, and operational
fit.

## Context to read first

Read these files in order:

1. `AGENTS.md`
2. `docs/specs/reading-map.md`
3. `docs/specs/runner.md`
4. `docs/routing-handoff-contract.md`
5. `docs/distribution-vision.md`
6. `docs/specs/distribution.md`
7. `plans/260915-executor-policy-dispatch-seams/design.md`
8. `plans/260915-executor-policy-dispatch-seams/plan.md`
9. `plans/260916-account-rotator/design.md`
10. `plans/260916-account-rotator/plan.md`

Then inspect the current runner config and dispatch code only as needed:

- `.fgos/config.json`
- `src/runner/dispatch/config.mjs`
- `src/runner/dispatch/plan.mjs`
- `src/runner/dispatch/assignment-runner.mjs`
- `src/runner/dispatch/transport.mjs`
- `src/state/tool-registry.mjs`

## Design intent

fgOS currently leaks quota and bottlenecks dispatch because executor identity is
doing too many jobs: provider, account/profile/home, model/tier/effort,
runtime/adapter, confinement, role/persona, and tool policy.

The proposed design introduces Provider Capacity Rotator:

- executors remain runtime/invocation shapes;
- accounts live under providers;
- fallback is by fixed `modelTier`, not by capability name or executor id;
- tool/MCP-only executors such as `gitnexus` bypass provider capacity;
- account rotation must not change mutation authority, tools, approval,
  confinement, or recovery authority.

The design should stay simple enough to implement quickly for the current
operator, while avoiding coupling that would recreate `claude-reviewer` or
`codex-review-pool` style bottlenecks.

## Questions to answer

Lead with findings. For each finding, cite the exact file/section or code path.
Prioritize bugs, hidden coupling, over-complication, missing safety, and config
ambiguity.

Evaluate:

1. Does the design actually solve quota concentration for Codex/Claude/agy
   without introducing role/capability-named account pools?
2. Is the config shape simple enough?
   - `runner.providers`
   - `runner.providerFallback`
   - `runner.providerRuntimes`
   - fixed `modelTier` enum:
     `nano | mini | standard | advanced | flagship | frontier`
3. Is it clear that `EffectiveExecutionNeed` is internal code contract only,
   not user config?
4. Is the dependency direction correct?
   - capability/policy -> provider/modelTier/runtime need
   - provider/modelTier -> account/model
   - provider/runtimeClass -> executor
   - no direct executor -> account or account -> executor dependency
5. Does the design preserve tool executors?
   - `impact-analysis -> gitnexus`
   - `gitnexus` is `kind: "tool"` / `via: "mcp"`
   - provider capacity must bypass this path
6. Is fixed six-level `modelTier` enough and not too much?
   - are `nano`, `mini`, `standard`, `advanced`, `flagship`, `frontier`
     names clear for cross-provider fallback?
   - does the provider mapping table look operationally usable?
7. Is the selection policy sufficiently deterministic and concurrent-safe?
   - least-recently-used
   - sticky by assignment
   - lease TTL
   - lock/CAS state
8. Is quarantine safe and detectable?
   - quota/rate-limit -> long account quarantine
   - auth failure -> manual-clear quarantine
   - transient provider/network -> short cooldown only when high-confidence
   - executor/config failure -> no account quarantine
   - prompt/test/confinement failure -> no account quarantine
9. Is cross-provider fallback correctly opt-in and evidence-visible?
10. Does evidence/inspect expose enough to debug quota routing without leaking
    env values, home paths, tokens, or secrets?
11. Are setup/doctor responsibilities sufficient if this adds defaults, env
    overlays, state paths, or config validation?
12. Is the relationship with `executor-policy-dispatch-seams` clean, or should
    this plan be merged into that track?

## Output format

Use this structure:

1. **Findings**
   - Severity: blocker / high / medium / low.
   - File/section or code path.
   - Why it matters.
   - Minimal correction.
2. **Simplicity verdict**
   - Is the config still simple?
   - What should be removed or postponed?
3. **Implementation readiness**
   - Ready / ready with changes / not ready.
   - Smallest safe implementation slice.
4. **Open questions**
   - Only list questions that block implementation or materially reduce risk.

Do not propose a broad migration framework. Assume the product is still
unstable and the current priority is a fast, correct dogfood implementation.
