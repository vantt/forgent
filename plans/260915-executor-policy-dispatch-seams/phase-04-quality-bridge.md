# Phase 04 — quality split and legacy tier bridge

## Cell goal

Split the current mixed tier vocabulary into canonical quality
`{minRigor, mode}` while keeping legacy `minTier`/tier inputs accepted through a
compatibility bridge.

This is a full-suite gate because it touches central policy monotonicity.

## Direct implementation contract

Implement this phase as a self-contained change in a dedicated
`executor-policy-dispatch-seams--phase-04` branch/worktree. Do not use
`fgos-plan-loop`, `fgos-code-panel`, executor dispatch, skills, or another
coordination harness. Do not implement Phase 03, PlacementPolicy, account
rotation, fallback, or model-tier migration as part of this phase.

Before editing, read `AGENTS.md`, `docs/specs/reading-map.md`,
`docs/specs/runner.md`, `docs/routing-handoff-contract.md`, this phase file,
the parent `plan.md`, and `design.md`. Record the base SHA and inspect existing
dirty changes without reverting them.

## Parallelization

Do not run in parallel with other mutating code cells. This phase may start
after Phase 00 and the required main-to-track sync. It does not require Phase
01--03 to be merged first: Phase 03's final effort-default behavior depends on
this phase's canonical `minRigor` contract. Phase 06 doc-only work may continue
separately, but validator/config changes should wait.

## Likely files

- `src/runner/definitions/schema.mjs`
- `src/runner/dispatch/assignment-policy.mjs`
- `src/runner/dispatch/resolve.mjs`
- `src/runner/coordination/session-engine.mjs`
- `src/verbs/coordination/run.mjs`
- tests for FlowDefinition schema, session-engine policy stack, and dispatch
  policy resolution

The likely-file list is a starting point, not permission to refactor unrelated
dispatch code. Follow existing policy/provenance helpers and keep the change
inside the quality resolution/evidence boundary.

## Implementation steps

1. Trace the current tier flow from work/assignment input through policy-stack
   merge, assignment policy resolution, model lookup, DispatchPlan, and
   effective execution evidence. Identify the existing semantic work tier and
   the existing calibration lookup tier before changing either.
2. Preserve the existing raise-only composition of semantic tier sources. Add
   the canonical bridge only after semantic tier composition has completed.
   Derive `quality.minRigor` from `semanticTier`; never derive it from
   executor/capability `rigorOverrides`.
3. Keep `lookupPolicyTier` independent. `rigorOverrides` may change only the
   legacy model lookup key and must be recorded with source kind
   `calibration`. It must not change `semanticTier` or canonical `minRigor`.
4. Implement mode provenance with the existing precedence:
   `explicit > implied-by-persona > implied-by-tier-bridge`.
5. Treat canonical `minRigor` as derived/read-only in this phase. Validate or
   normalize explicit values at or below the derived value; reject an explicit
   value above it. Do not add an independent minRigor raise channel.
6. Extend the resolved policy/evidence shape so a stranger can distinguish
   `semanticTier`, `quality.minRigor`, `lookupPolicyTier`, and the model selected
   from `modelPolicies.<provider>.<lookupPolicyTier>`.
7. Preserve the live `modelPolicies` table and all current model mappings. Do
   not add `providers.<provider>.models`, six-tier `modelTier`, provider
   fallback, or PlacementPolicy behavior.
8. Keep tool/MCP executors out of this quality bridge; do not infer provider
   capacity, account identity, executor profile, or confinement from quality.

## Required tests

Add or update focused tests covering:

- legacy tier bridge and mode source precedence;
- raise-only semantic tier composition before quality derivation;
- explicit `minRigor` equal/lower than derived value accepted or normalized;
- explicit `minRigor` above derived value rejected;
- raw agy heavy work preserving `lookupPolicyTier=creative` and
  `gemini-3.8-flash-high`;
- capability-overridden heavy work preserving
  `lookupPolicyTier=standard` and `gemini-3.8-flash-medium`;
- evidence containing separate semantic tier, canonical quality,
  calibration lookup tier, and model source provenance;
- no regression in Phase 00 baseline snapshots.

Run the narrowest relevant test files first, then `npm test`. Compare full-suite
failures against the baseline recorded in `plan.md`; do not hide new failures
under the known baseline.

## Completion report

Before handing back the work, report:

- branch/worktree and base/tested SHAs;
- files changed and why;
- targeted test commands and results;
- full-suite result and baseline triage;
- snapshot impact (`unchanged` or named intentional delta);
- any unresolved issue, without silently widening scope.

## Canonical model

`minRigor` is ordinal:

```text
low < standard < high < critical
```

`mode` is nominal:

```text
balanced | creative | analytical | adversarial
```

Raise-only applies only to `minRigor`.

## Legacy bridge

Map legacy policy tiers as:

| legacy tier | quality |
|---|---|
| lightweight | `{minRigor: low, mode: balanced}` |
| standard | `{minRigor: standard, mode: balanced}` |
| creative | `{minRigor: standard, mode: creative}` |
| analytical | `{minRigor: high, mode: analytical}` |
| critical | `{minRigor: critical, mode: analytical}` |

The bridge's mode sourceKind is `implied-by-tier-bridge`.

For work-driven dispatch, keep two distinct tier values in the resolved
provenance:

- `semanticTier`: the work/item semantic tier after
  `DEFAULT_TIER_TO_POLICY` (for example, `heavy -> critical`). This is the
  only tier from which Phase 04 derives canonical `minRigor`.
- `lookupPolicyTier`: the compatibility/calibration tier used to query the
  live `modelPolicies.<provider>.<legacy tier>` table. Executor
  `rigorOverrides` may change this lookup tier, and its source must be recorded
  as calibration provenance.

`lookupPolicyTier` must not derive `minRigor`, and the two values must not be
compared as if they were competing quality claims. This prevents the same
work item from receiving different semantic rigor merely because a provider's
model calibration differs.

Mode source precedence:

```text
explicit > implied-by-persona > implied-by-tier-bridge
```

Within the same sourceKind, use normal scope precedence.

If a Phase 04 caller supplies an explicit `minRigor`, it must be no stronger
than the value derived from `semanticTier`; a stronger value is rejected
explicitly. In this phase `minRigor` is derived and read-only, not an
independent raise channel. A caller may provide `mode` as the independent
canonical quality input, subject to the mode source precedence above.

## Resolver rule

Introduce explicit source kind on mode:

```text
explicit
implied-by-persona
implied-by-tier-bridge
```

The semantic tier composition may use raise-only before derivation. After the
semantic value is derived, it is authoritative and read-only for this phase:
an explicit `minRigor` lower than or equal to the derived value is validated or
normalized to that value, while an explicit value above it is rejected. `mode`
remains nominal; only source-kind precedence and then scope precedence can pick
a winner.

## Catalog decision

Provider model catalog remains the existing `modelPolicies.<provider>.<legacy
policy tier>` table in this phase. The phase introduces the canonical quality
bridge and provenance, but it must not introduce six-tier `modelTier` runtime
config or a second provider model table.

For model lookup, legacy policy tier remains the compatibility key until
PlacementPolicy/model calibration has enough shadow proof to re-key safely.
`minRigor` is the semantic quality axis for policy composition and future
placement, not an immediate replacement for live `modelPolicies` keys.

Therefore this phase must include a migration/calibration note or fixture
showing how the current gemini creative-column behavior is preserved or
intentionally changed.

The minimum evidence shape is:

```jsonc
{
  "semanticTier": { "value": "heavy", "source": { "scope": "work" } },
  "quality": {
    "minRigor": { "value": "critical", "source": { "scope": "derived" } },
    "mode": { "value": "balanced", "source": { "scope": "tier-bridge" } }
  },
  "lookupPolicyTier": {
    "value": "creative",
    "source": { "kind": "calibration", "scope": "executor" }
  },
  "model": {
    "value": "gemini-3.8-flash-high",
    "source": { "provider": "gemini", "lookupPolicyTier": "creative" }
  }
}
```

The exact source scopes may follow the existing provenance vocabulary, but the
semantic tier, canonical quality, calibration lookup tier, and model source
must remain separately inspectable.

Do not silently map model lookup through canonical quality:

```text
semantic heavy -> critical

calibration lookup heavy -> creative -> gemini-3.8-flash-high
```

to:

```text
semantic heavy -> critical, while lookupPolicyTier remains creative
```

without an intentional-delta record.

## Verification

```sh
npm test
```

If full suite has baseline failures, compare exactly against the recorded
baseline from `plan.md` and triage every new failure.

## Exit criteria

- Existing legacy tier callers still pass.
- Phase 04 callers may provide `mode` and a `minRigor` no stronger than the
  semantic-tier-derived value; stronger explicit `minRigor` is rejected.
- Quality evidence records both canonical `{minRigor, mode}` and the legacy
  policy tier used for current model lookup.
- No `providers.<provider>.models` or six-tier `modelTier` runtime config is
  added by this phase.
- Red-team/adversarial persona posture is not overwritten by legacy
  `--tier analytical`.
- Phase 00 snapshots either stay equivalent or record intentional catalog
  deltas with rationale.
- Fixtures assert both `standard -> gemini-3.8-flash-medium` and
  `creative -> gemini-3.8-flash-high`, including raw agy heavy work and the
  capability override for heavy work.
