# Incident Evidence Matrix

**Status:** D00 drafted
**Source:** [dispatch-process-incidents.md](../260911-2305-runtime-recovery/reports/dispatch-process-incidents.md)

This matrix preserves all twenty observations. `addressed` means a committed
capability directly covers the product gap; `supporting` means required work or
proof under a committed capability; `already-resolved` means the source track
changed its practice or implementation; `external` means fgOS does not own the
root cause but must classify or preserve recoverable work; `deferred` means the
initiative explicitly does not implement it.

| # | Incident | Class | Disposition | Design response |
|---|---|---|---|---|
| 1 | Cross-worktree `.fgos/` evidence path unavailable | contract visibility | already-resolved | Continue using owned identifiers/ports rather than raw main-checkout paths; inspection resolves storage internally |
| 2 | Untracked plan directory absent in fresh worktrees | operational hygiene | already-resolved | Required design/contract inputs must be committed before implementation cells open |
| 3 | Older unconsumed authorization can outrank a newer retry | coordination semantics | deferred | Do not change authorization ordering here; inspect exposes delivery/replay provenance without granting cross-session authority |
| 4 | `contextRefs` cannot cross coordination sessions | expected authority behavior | supporting | Effective contract and diagnostics must disclose the boundary; no cross-session authority is added |
| 5 | Session auto-close depends on clean required-actor completions | expected coordination behavior | supporting | Typed observation distinguishes execution failure, findings and quorum state; BL1 remains separately owned |
| 6 | Session wall-time and executor timeout are separate immutable bounds | contract visibility | supporting | Effective execution contract presents both bounds and their separate owners |
| 7 | Worker self-report claimed PASS despite falsifying evidence | evidence trust | addressed | RunResult normalizer preserves independent evidence; worker claim never certifies itself |
| 8 | Correct isolated logic was unreachable through production dispatch | wiring/proof gap | supporting | Production-door proof is mandatory for every committed capability |
| 9 | A plausible Herdr worker-command hypothesis failed live | design evidence gap | supporting | Adapter capability claims require live executable proof and fail closed otherwise |
| 10 | OOM kills left claims and runtime resources behind | external resource pressure | external + addressed | Typed resource failure and salvage observation; guard reconciliation only after dead/absent proof; fgOS does not solve host memory pressure |
| 11 | Hand-rolled `nohup` did not survive tool-call lifetime | unsupported process launch | already-resolved | Managed gateway/dispatch doors remain the supported process-lifetime boundary |
| 12 | Restricted Bash was mistaken for all-Bash denial | contract visibility | supporting | Persist and present effective tool/command permissions before launch |
| 13 | Status-specific worker-claim fields were missing from prompt | contract drift | supporting | Versioned worker claim; prompt and validator derive from one definition |
| 14 | Repeated `git branch -f` discarded integration history | destructive operator action | already-resolved | Branch policy changed; optional guardrails may document risk, but this initiative does not own arbitrary Git history protection |
| 15 | Live long-running coordination process hidden by truncated process view | observability gap | addressed | Inspection correlates full PID/incarnation, cwd lock, Assignment, Run and resource facts |
| 16 | Same `taskKey` replayed the cached failure | expected idempotency behavior | addressed | RunResult delivery mode exposes `replayed`; inspect names recovery authority; same-key semantics stay unchanged |
| 17 | Completed/failed dispatch sat unread for hours | operability gap | addressed | Inspection exposes completed-uncollected, orphan and stale-guard states without contacting workers |
| 18 | Reviewer findings appeared as generic failed quorum | result-model ambiguity | addressed | Separate execution status from assessment verdict; legacy status remains a compatibility projection |
| 19 | Provider session limit left valuable uncommitted work | external provider limit | external + addressed | Preserve workspace/evidence and classify resource failure; no automatic retry or reimplementation |
| 20 | Unrelated main-checkout dirt was attributed to the reviewer | false causal attribution | addressed | Separate observation, attribution strength and policy disposition; pre/post snapshots are correlation only |

## Coverage Summary

| Disposition | Incidents |
|---|---|
| Addressed directly | 7, 10, 15, 16, 17, 18, 19, 20 |
| Supporting contract/proof | 4, 5, 6, 8, 9, 12, 13 |
| Already resolved operationally | 1, 2, 11, 14 |
| Deferred semantic change | 3 and the BL1 aspect of 5 |
| External root cause retained as typed evidence | 10, 19 |

No row authorizes automatic retry, cross-session authority, force-kill or
TTL-only cleanup.
