# Architecture Decision Lock

**Status:** READY design lock after supplemental D06 repair; not implementation authority
**Date:** 2026-09-15

The following decisions held through the manual design discussion. D06 may
falsify them with direct source/contract evidence; it must not reopen them for
preference alone.

| ID | Candidate decision |
|---|---|
| DOEA-01 | The initiative commits exactly three capabilities: typed RunResult/Observation, Dispatch inspection/guard reconciliation, and Evidence Attribution. Supporting executor/proof work is not a fourth capability. |
| DOEA-02 | Documentation states positive and negative capabilities symmetrically; unsupported paths must be disabled or typed-refused. |
| DOEA-03 | `RunResult` is the sole immutable terminal truth for a Run. `RunObservation` is mutable read projection; `ProviderOutcome` is a host-invocation wrapper. No `DispatchOutcome` entity is created. |
| DOEA-04 | All new RunResults use contract v2 independent of CoordinationSession schema. Historical v1 results are interpreted as `legacy-derived` and never rewritten. |
| DOEA-05 | One public read operation, `dispatch.runtime.inspect`, accepts exactly one of Run, Assignment or cwd selectors and routes to Dispatch. |
| DOEA-06 | Host Invocation routes by OperationId/provider only. Selector resolution and recovery-authority discovery remain inside the Dispatch use case. |
| DOEA-07 | Inspection may compose facts through read ports but never receives Coordination or standalone recovery authority. Existing recovery doors remain separate. |
| DOEA-08 | `fgos recover <subject>` and automatic inspect-to-recover forwarding are outside this initiative. |
| DOEA-09 | Observation, attribution and policy disposition are independent. Pre/post Git snapshots provide correlation, never proven causation. |
| DOEA-10 | `dispatch.runtime.reconcile` repairs only proven-stale guards/projections under CAS. It never kills, retries, admits, resumes, reassigns or performs writable takeover. |
| DOEA-11 | Worker claim schema, prompt and validator have one source; an effective execution contract is persisted before launch. |
| DOEA-12 | Every shipped capability requires a production-door proof; direct unit invocation cannot alone close an implementation cell. |
| DOEA-13 | No new component is introduced. Extraction requires independent state/lifecycle, authority, public operations, broad consumers or provider/replacement boundary. |

## D06 Review Questions

1. Does any candidate decision create a second terminal or mutation authority?
2. Can `dispatch.runtime.inspect` remain read-only by dependency direction, not
   merely by convention?
3. Are RunResult v2 compatibility projections deterministic and corruption
   detectable?
4. Can guard cleanup prove dead/absent state for every supported adapter, or
   must some actions remain `unsupported` per profile?
5. Does any production consumer require a migration phase not represented in
   I01-I06?
6. Are the negative capabilities actually testable as absent/refused?

## D06 Verdict

`READY` on 2026-09-15 after supplemental registered architecture panel session
`dispatch-operability-design-d06-panel-r2` and D06 documentation/evidence
repair.

The earlier inline D06 closure recorded an explicit user override that waived
external panel dispatch. A later operator instruction reopened that gap; the
supplemental panel ran with every static role bound to `codex-bwrap`. That run
created real role-separated advisory outputs, but it did **not** provide
cross-provider independence and did not close replay/evidence-link blockers.

The repair changed the D06 record as follows:

1. D06 no longer claims the older waiver alone satisfied the panel gate.
2. Supplemental role outputs are copied into
   `architecture-panel/role-outputs/` and hash-bound by
   `architecture-panel/evidence-manifest.sha256`.
3. The D06 panel is described as operator-authorized Codex-only
   role-separated review, not cross-provider independent review and not
   protocol-proven staged artifact fan-in.
4. D05 proof planning now requires negative production-route checks proving
   `dispatch.runtime.reconcile` cannot reach `kill`, `retry`, `resume`,
   `reassign`, `admit`, `cancel`, or takeover through host/CLI/operation-catalog
   indirection.
5. Closure metadata lists the supplemental HIGH/MEDIUM findings, their
   dispositions, owners, evidence requirements, and recheck status.

This file records convergence but grants no source mutation authority. `READY`
authorizes only creation of a separate implementation plan; it never authorizes
source mutation in this design track.
