# Phase 04 — quality split and legacy tier bridge

## Cell goal

Split the current mixed tier vocabulary into canonical quality
`{minRigor, mode}` while keeping legacy `minTier`/tier inputs accepted through a
compatibility bridge.

This is a full-suite gate because it touches central policy monotonicity.

## Parallelization

Do not run in parallel with other mutating code cells. Integrate Phase 01, Phase
02, and Phase 03 first, then run this as a full-suite gate. Phase 06 doc-only
work may continue separately, but validator/config changes should wait.

## Likely files

- `src/runner/definitions/schema.mjs`
- `src/runner/dispatch/assignment-policy.mjs`
- `src/runner/dispatch/resolve.mjs`
- `src/runner/coordination/session-engine.mjs`
- `src/verbs/coordination/run.mjs`
- tests for FlowDefinition schema, session-engine policy stack, and dispatch
  policy resolution

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

Mode source precedence:

```text
explicit > implied-by-persona > implied-by-tier-bridge
```

Within the same sourceKind, use normal scope precedence.

If caller supplies both legacy tier and canonical quality and they conflict
after bridge, fail validation rather than choosing silently.

## Resolver rule

Introduce explicit source kind on mode:

```text
explicit
implied-by-persona
implied-by-tier-bridge
```

`minRigor` conflict is ordinal and uses raise-only. `mode` conflict is nominal;
only source-kind precedence and then scope precedence can pick a winner.

## Catalog decision

Provider model catalog remains keyed by `minRigor`, not by `mode`, for this
track. Therefore this phase must include a migration/calibration note or fixture
showing how the current gemini creative-column behavior is preserved or
intentionally changed.

Do not silently map:

```text
heavy -> creative -> gemini-3.8-flash-high
```

to:

```text
standard -> gemini-3.8-flash-medium
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
- New canonical quality callers pass.
- Red-team/adversarial persona posture is not overwritten by legacy
  `--tier analytical`.
- Phase 00 snapshots either stay equivalent or record intentional catalog
  deltas with rationale.
