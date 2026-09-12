# S3/P03 - Fallback And Effect Boundary

**Status:** READY FOR PRE-DELIVERY PROFILE; POST-DELIVERY REPEAT GATED  
**Owner:** recovery resolver, DispatchPlan and confinement adapters  
**Depends on:** S1; S2 reconcile contract

## Goal

Allow fallback only when governance and repeated effects are explicitly
provable. Unknown delivery or effect evidence parks; it never blind-retries.

## Contracts

```text
resolveFallback(originalPlan, candidateId)
  -> scopedPlan(provenance) | candidate-not-governed | compiler-mismatch

assess(plan, repeatMode, confinement, attestation)
  -> eligible | effect-unknown | provider-not-allowed | undeclared-sink
```

`repeatMode` is explicit in review/red-team operation YAML. It is not inferred
from `Assignment.mutation`.

## Effect Rules

1. Provider endpoints derive from selected executor `DispatchPlan.providerModel`.
2. Network `allow` is not eligible for automatic repeat.
3. Filtered provider-only access may be eligible only when the active
   confinement adapter attests that coverage. `local-bwrap-v1` currently
   supports network `allow` only, so it always parks post-delivery repeat.
4. Telemetry sinks must be declared duplicable; only outcome-affecting repeated
   sinks require a dedup identity.
5. Any undeclared external sink parks with evidence of the offending sink.

## Acceptance Matrix

| Confinement/effect | Outcome |
|---|---|
| network allow | park |
| filtered provider + undeclared sink | park |
| filtered requested but adapter coverage unsupported | park |
| filtered provider-only + duplicable telemetry + adapter proof | eligible |
| fallback compiler mismatch | park |
| unknown delivery/effect | park, no retry |

## Non-goals

No generic effect ledger, no provider inference from worker text, no claim that
YAML alone proves effects, and no automatic retry of unknown outcomes. The
attestation pins the source Run, DispatchPlan digest and confinement evidence;
it is not derived from the replacement Run.
