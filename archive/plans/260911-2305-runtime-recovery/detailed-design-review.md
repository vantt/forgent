# Runtime Recovery Detailed Design Review and Red-Team

**Review type:** local architecture review plus adversarial red-team  
**Input:** [detailed-design.md](detailed-design.md)  
**Verdict:** ARCHITECTURE ACCEPTED; IMPLEMENTATION GATED BY CONTRACT CLOSURE

The iterative audit result is [design-audit-final.md](design-audit-final.md).

The phase-level input set is now:

- S1: [run-admission-and-fencing.md](phase-designs/run-admission-and-fencing.md)
- S2: [launch-reconciliation.md](phase-designs/launch-reconciliation.md)
- S3: [fallback-and-effect-boundary.md](phase-designs/fallback-and-effect-boundary.md)
- S4: [read-evaluator-and-planner.md](phase-designs/read-evaluator-and-planner.md)
- S5: [continuation-and-transfer.md](phase-designs/continuation-and-transfer.md)
- P06/P08: writable and closeout briefs in [phase-designs](phase-designs/README.md)

The design is now sufficiently detailed to review: canonical records, ports,
mutation owners, crash windows, algorithms and negative cases are explicit.
The findings below are implementation-entry gates, not a rejection of the
architecture.

## Implementation-Entry Findings

| ID | Finding | Why it blocks | Required closure |
|---|---|---|---|
| R-01 | S1 must bind its algorithm to the repository's concrete serialization primitive. | Otherwise the crash matrix is descriptive only. | Phase brief names the exact store/lock function and event ordering before P01. |
| R-02 | S2 `LaunchRegistry` needs a gateway request/response schema. | B04 remains open until lookup authority and unknown semantics are executable. | Add the schema and fake-gateway contract before P02. |
| R-03 | S3 needs a versioned attestation schema. | `providerModel` alone cannot prove the complete filtered effect set. | Add attestation examples and park reasons before P03. |
| R-04 | S4 must avoid creating a second durable authority. | A token store would add accidental complexity, but apply still needs caller expectations. | Use an ephemeral recommendation; apply echoes snapshot/control epoch/action key for CAS at the existing write door. |
| R-05 | S5 still depends on the CP section 6 contract amendment. | Replay cannot safely accept post-terminal event classes before that change. | Amend CP and add replay fixtures before P07. |
| R-06 | Writable profile needs material identity and merge-base rules. | X05 can otherwise discard or double-count inherited edits. | Specify lineage graph and evaluator examples before enabling P06. |

## High-Risk Warnings

- The Herdr client exposes `agentGet(name)` today; a deterministic name must stay
  an optimization, never the authority. A gateway restart test is mandatory.
- Read-only does not mean harmless: filtered network access must be provider
  derived, and undeclared sinks park.
- Heartbeat expiry is not holder death. SIGSTOP must remain unreclaimable while
  SIGKILL may reclaim only with PID-dead evidence.
- `open fresh session` is a safety remedy, not permission to hide premature
  close; X11 must count the hazard.
- The design does not yet specify migration/versioning for existing schema-1
  events. P08 must not claim compatibility until replay fixtures prove it.

## Red-Team Scenarios

1. Kill the coordinator after Herdr create and before locator persistence; assert
   reattach or park, never a second spawn.
2. Restart the gateway so the same pane receives a new `agentSession`; assert
   incarnation mismatch/unknown and park, never absent-proven.
3. Submit two retries concurrently with different payload digests; assert one
   winner and one typed refusal.
4. Let heartbeat expire while the holder is SIGSTOP'd; assert HELD. SIGKILL the
   holder without a release marker; assert reclaim only after PID-dead proof.
5. Run provider-only filtered read-only work and then emit an undeclared sink;
   assert park and no acceptance evidence.
6. Replay a single-use `driver-replaced` invocation twice; assert the second is
   refused without consulting mutable config.
7. Attempt writable takeover with inherited edits and no workspace grant; assert
   park and confirm no inherited delta is silently discarded.

## Review Decision

Architecture direction is coherent and remains simple/hexagonal/SRP. The
detailed design and phase briefs are accepted as the baseline for an
independent design-panel review. R-01 through R-06 are explicit contract
closure gates, not invitations to improvise during implementation. That
independent panel review, owner decisions and rebuttal are now recorded in
`architecture-panel-adoption-and-rebuttal.md`; the design gate is closed while
capability-specific external gates remain enforceable.
