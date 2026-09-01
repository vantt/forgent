# Current Cell

Cell: P04.2
Status: BLOCKED — objective stop gate #4 (R8 two-provider live proof)
Last updated: 2026-09-02
Next action: AWAITING MAINTAINER DECISION — see P04.2.md's "R8: STOP GATE #4" section

## Summary

R5, R6, R7, R9 are complete, tested (189/189 focused, 14 new tests),
and independently verified by the Coordinator. R8 (two-real-provider-
family live proof) is architecturally unreachable today:
`resolveAssignmentDispatchPolicy`'s tier floor (`assignment-policy.mjs:92`,
`opPolicy.minTier || 'standard'`) is unconditional, and no coordination
dispatch (agent-led or declared, this whole track) has ever been able to
populate `assignment.policy` to lower it, because the inline-contract
field whitelist (`execution-contract.mjs`/`assignment.mjs`) has no
`policy` field. The real `.fgos/config.json` only configures
`lightweight` tier for every non-`claude` provider family, so none of
them can ever satisfy the floor. Root cause independently confirmed in
source by the Coordinator, and live-reproduced twice (a direct pin
failing closed, and `planCohort`'s own diversity-seeking allocation
naturally triggering the identical failure for both non-claude research
branches in a full live run).

This is Phase 04's own named Proofs-And-Exit criterion and this plan's
own explicit stop gate #4 ("a required live CLI executor/provider is
absent, unconfigured, lacks the exact required tier..."; Phase 04's own
Risks/Rollback text: "Configuration may not support the required tiers.
That is a declared stop gate, not an implementation failure.").

The only fix path requires widening `execution-contract.mjs`'s
inline-contract field whitelist to accept a `policy` field — a file that
has been in EVERY cell's "Do Not Touch" list across all 4 phases of this
entire track. This is a real, cross-cutting schema decision, not a
routine/reversible implementation choice delegable to an autonomous
cell.

**Autonomous cell progression is paused pending a maintainer decision.**
Phase 05 depends on Phase 04 (per plan.md's own dependency chain) and
Phase 04 cannot close without R8. See `P04.2.md`'s "R8: STOP GATE #4"
section for full evidence and the two concrete decision options.
