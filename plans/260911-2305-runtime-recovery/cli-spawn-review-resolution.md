# CLI Spawn Review Resolution

**Status:** DESIGN READY; IMPLEMENTATION HANDOFF ON HUMAN HOLD  
**Date:** 2026-09-12  
**Scope:** response to `cli-spawn-independent-review-report.md`

This note records how the P02L design was simplified and sharpened after the
independent review. It is not a second implementation contract. The
implementation contract is
[`phase-designs/cli-spawn-local-contract.md`](phase-designs/cli-spawn-local-contract.md).

## Resolution Matrix

| Finding | Resolution | Normative location | Why this is simpler |
|---|---|---|---|
| CL01 protected proof can be worker-forged | Canonical stdout/stderr capture moved under `protected/capture`; worker write grant is limited to `worker-output/outbox`; required confinement must keep protected proof outside worker writable mounts; unconfined recovered settlement is disabled. | `cli-spawn-local-contract.md` Artifact Layout, Launch Envelope, Adapter Receipt | No MAC/signature or daemon. Use the existing filesystem/confinement trust boundary and state the unconfined limit honestly. |
| CL02 envelope missing execution context and ordering | `cli-spawn-launch-envelope.v1` includes resolved command, args, cwd, env, stdin, encoding, dispatch depth, timeout, idle timeout and maxBuffer. Command pending starts with `envelopeDigest: null`; `assignmentLaunchContext` carries Run/command/control/baseline identity through the confinement request; after envelope publication the current controller records the digest with a guarded update. Supervisor cannot re-resolve. | Launch Envelope V1, Command State V1, Launch Sequence | One producer sequence replaces the conflicting pseudocode and scattered implicit inputs. |
| CL03 receipt cannot preserve timeout/maxBuffer semantics | `cli-spawn-adapter-receipt.v1` has typed completion, protected output digests, capture byte counts, overflow live-stream flag and process-tree coverage. Live observation is bounded/best-effort; capture freezes and fsyncs before receipt publication. | Adapter Receipt V1, Existing Behavior To Preserve | The receipt mirrors the existing adapter contract instead of inventing a new result vocabulary. |
| CL04 recovered collection lacks pre-launch evaluator state | Controller writes `run-evaluator-baseline.v1` before envelope publication; recovered collection must use it or park. | Evaluator Baseline V1, Launch Sequence | Persist only the facts the existing evaluator already uses; no checkpoint framework. |
| CL05 confinement cleanup/finalization dies with coordinator | Confinement Authority persists `confinement-finalization.v1` with dispatch/resource/attestation/ownership-marker identity and guarded progress fields; cleanup is idempotently resumed or retained with reason after receipt/unknown park, including after delete-succeeded/result-write-crashed. | Confinement Finalization | Keeps Confinement Authority owner; supervisor only reports evidence. |
| CL06 shared-cwd mutating overlap | First P02L supports isolated/read-only collection only; shared-cwd mutating continuation is typed unsupported until workspace occupancy/quiescence exists. | Local Capability Matrix | Avoids dragging P06 writable takeover into P02L. |
| CL07 recovered destructive cancel underspecified | Recovered cancel after coordinator death is unsupported by default; supervisor-owned timers remain supported because the supervisor still has the live child handle/PGID. | Local Capability Matrix, Recovery Outcomes | Keeps existing timeout behavior without pretending historical PID kill is safe. |
| CL08 stale projections | Plan, detailed design, catalog, impact correction, manifest, request pack, audit and traceability now point to the canonical local contract and no longer claim P02L approval. | Updated summary files | One detailed source plus small pointers prevents drift. |
| CL09 collection can strand after command reconciliation | `run-launch-command.v1` allows `state: reconciled` for receipt-backed completion and `submission-refused`; if crash happens after command outcome publication and before Run settlement, the next current controller reuses the stored outcome, normalizes idempotently and settles the exact Run or failed settlement. | Command State V1, Launch Sequence, Recovery Outcomes, Crash Matrix | One extra resumable state in the existing command file avoids a new journal or registry. |

## Current Gate

Astra re-review first returned `NOT_READY` on 2026-09-12 and identified residual CL01, CL02, CL03, CL05 plus new CL09. After the final revision, Astra returned `READY_WITH_NON_BLOCKING_NOTES`: CL02, CL05 and CL09 are closed at the design level, and the only low note was resolved by defining `submission-refused.failureDigest` over the persisted refusal fields. P02L is technically ready for implementation handoff, but the human hold remains separate and still blocks code-panel dispatch.
