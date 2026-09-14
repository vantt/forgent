# Dispatch Operability And Evidence Attribution - Design Track

**Track:** `dispatch-operability-design`

**Branch:** `design-track--dispatch-operability-evidence-attribution`

**Worktree:** `/home/vantt/projects/dispatch-operability-design`

**Status:** READY after D06 supplemental repair

**Date:** 2026-09-14

**Source evidence:** [Runtime-recovery dispatch/process incidents](../260911-2305-runtime-recovery/reports/dispatch-process-incidents.md)

## Objective

Complete, independently review, and promote the design for dispatch runtime
inspection, evidence attribution, and bounded guard reconciliation. This track
produces design authority only. It must not implement runtime behavior.

The capability serves projects and workflows using fgOS (missions 1 and 2). It
is not justified merely as convenience for fgOS self-hosting.

## Committed Capabilities

| Capability | This design commits | This design does not commit |
|---|---|---|
| Typed Run Result And Observation | `RunObservation` for mutable point-in-time facts; versioned `RunResult` as the only immutable terminal Run truth; distinct execution, assessment, confidence, failure, policy, and delivery dimensions; deterministic historical interpretation | A parallel `DispatchOutcome`; rewriting historical results; treating `ProviderOutcome` or a worker claim as terminal Run truth |
| Dispatch Inspection And Guard Reconciliation | One read-only `dispatch.runtime.inspect` operation with exactly one typed selector (`run`, `assignment`, or `cwd`); recovery-authority discovery; CAS-guarded repair of proven-stale local guards/projections | A unified recovery door; automatic inspect-to-recover forwarding; kill, retry, admission, resume, reassign, writable takeover, or TTL-only deletion |
| Evidence Attribution | Observation separated from attribution and policy; `proven`, `correlated`, `excluded`, and `unattributed`; substantive worker results preserved when policy refuses a round | Exact authorship inferred from Git snapshots; a filesystem-monitoring daemon; eBPF/fanotify as a required dependency |

Supporting contracts are not separate capabilities: `agent-result-claim.v2`,
the effective execution-contract snapshot, shared prompt/claim validation, and
production-door proof requirements.

## Explicitly Deferred

- `fgos recover <subject>` and automatic inspect-to-recover forwarding.
- Provider account limits, host OOM prevention, destructive cancellation, and force-kill.
- Cross-session authority or cross-session `contextRefs`.
- Changes to same-`taskKey` replay, Coordination quorum, authorization ordering, or the separately tracked BL1 defect.
- Writable workspace takeover, generic process management, and arbitrary Git history protection.
- Implementation planning and source changes. Those require a new track after
  D06 closes `READY`.

## Locked Architecture Direction

```text
CLI / REST / chat
        |
        v
Host Invocation Router
        | OperationId: dispatch.runtime.inspect
        v
Dispatch Inspect Use Case
        |-- RunRepositoryPort
        |-- AssignmentRepositoryPort
        |-- CoordinationReadPort
        |-- RuntimeResourceObservationPort
        |-- WorkspaceEvidencePort
        `-- DispatchGuardReadPort
                    |
                    v
              RunObservation
              /            \
     RunResult reader   recovery-authority hint
```

Invocation routing selects a provider from `OperationId`; it does not interpret
`--run`, `--assignment`, or `--cwd`. Dispatch owns subject resolution and
read-model composition. Existing standalone and CoordinationSession doors keep
their separate recovery authority. No new component is introduced unless later
evidence establishes independent state/lifecycle, authority, public operations,
broad consumers, or a provider/replacement boundary.

## Coordination Contract

Use the registered `core.coordination-protocol.standalone-master-coordination-loop`
through `fgos coordination chain/run/show`. The Lead is the only driver and merge
authority. Each cell uses a private branch/worktree and the required first pass:

```text
Doer -> Reviewer + Red-Team -> Lead disposition
     -> Fixer + both rechecks only when Lead authorizes
```

Reviewer and Red-Team receive artifact references and committed repository
context, never the Doer's chat transcript. They must cite file/section evidence.
No cell closes with unresolved HIGH findings.

## Execution Inputs

- Plan root: `plans/260914-dispatch-operability-evidence-attribution/`
- Track branch: `design-track--dispatch-operability-evidence-attribution`
- Cell branch convention: `dispatch-operability-design--<cell-id>`
- Protocol: `core.coordination-protocol.standalone-master-coordination-loop`
- Doer/Fixer mutation: markdown paths limited by the active phase lease
- Reviewer/Red-Team mutation: read-only; operation requirements come from the registered protocol
- Baseline references: `docs/specs/reading-map.md`, `docs/specs/runner.md`, `docs/platform-foundations.md`, `docs/routing-handoff-contract.md`, source incident report, and this plan's decision lock
- Human gate: only a genuinely new product decision or a proposed change to a locked law; batch independent questions and continue all unaffected work

Executor/provider names are intentionally not pinned in this portable plan.
The Lead supplies trusted dispatch policy at invocation time.

## Cells

- unit: D00 normalize incident evidence and scope dispositions
  capability: execute
- unit: D01 complete RunResult v2 and RunObservation contracts
  capability: execute
- unit: D02 complete inspection surface and invocation-routing boundaries
  capability: execute
- unit: D03 complete evidence-attribution and policy-separation rules
  capability: execute
- unit: D04 complete CAS guard-reconciliation authority and algorithms
  capability: execute
- unit: D05 complete worker claim, effective contract, and production-proof design
  capability: execute
- unit: D06 run cross-design architecture review, disposition findings, and promote accepted design
  capability: advise

```text
D00 -> D01 -> D02 -> D03 -> D04 -> D05 -> D06
```

Run sequentially. Later phases may rely on earlier committed design artifacts;
parallel execution would create avoidable ambiguity in the shared vocabulary.

## Phase Briefs

| Cell | Brief | Primary output |
|---|---|---|
| D00 | [phase-00-incident-normalization.md](phase-00-incident-normalization.md) | complete evidence/disposition baseline |
| D01 | [phase-01-run-result-observation-contract.md](phase-01-run-result-observation-contract.md) | normative terminal/read-model contract |
| D02 | [phase-02-inspection-surface-routing.md](phase-02-inspection-surface-routing.md) | one-door selector and ownership design |
| D03 | [phase-03-evidence-attribution.md](phase-03-evidence-attribution.md) | causal-strength and policy design |
| D04 | [phase-04-guard-reconciliation.md](phase-04-guard-reconciliation.md) | mutation authority and CAS protocol |
| D05 | [phase-05-executor-contract-production-proof.md](phase-05-executor-contract-production-proof.md) | worker/effective contract and proof matrix |
| D06 | [phase-06-cross-design-review-promotion.md](phase-06-cross-design-review-promotion.md) | independent verdict, disposition, canonical promotion only if READY |

## Track-Wide Prohibitions

Every cell must leave `src/**`, `test/**`, `bin/**`, `core/**`, `domains/**`,
`package*.json`, `.fgos/**`, and `CHANGELOG.md` unchanged. D06 may edit only the
canonical markdown paths explicitly identified by its promotion manifest. No
phase may run recovery, kill a process, clear a lock, create a Work item, or
start implementation.

## Exit Gate

The design track closes only when:

1. Every source incident maps to a committed, supporting, already-resolved, external, or deferred disposition with evidence and no double counting.
2. One glossary and one authority model hold across all design artifacts.
3. Positive and negative capabilities are specified symmetrically.
4. Historical compatibility, ambiguity, corruption, and concurrency behavior are explicit and testable.
5. D06 records independent review and red-team evidence, resolves every accepted finding, and returns `READY` or `NOT READY` without ambiguity.
6. `READY` includes a canonical-doc promotion manifest and an implementation handoff; it does not authorize implementation in this track.
7. `git diff --check` passes and the design-only path fence is clean.

## Completion Meaning

`READY` means the design is sufficiently precise to create a separate
implementation plan. It does not mean any advertised runtime capability ships,
and user-facing documentation must continue to label the capability as planned
until production-door evidence exists.

## Cell Status

| Cell | Merge commit | Review/red-team verdict | Deferred findings |
|---|---|---|---|
| D00 | `a3414717` | PASS | none |
| D01 | `15246f07` | PASS | none |
| D02 | `36364eea` | PASS | none |
| D03 | `9b54c221` | PASS | none |
| D04 | `77a3d294` | PASS | none |
| D05 | `23ec44cf` | PASS | none |
| D06 | `b6ffeb83`; merge `1cb448a6` | READY | supplemental registered panel `dispatch-operability-design-d06-panel-r2`; Codex-only/non-cross-provider limitation recorded; documentation/evidence blockers repaired |
