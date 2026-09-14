# Agent Coordination Documentation Standardization Plan

```txt
Document type: Migration plan
Audience: Human reviewer, architect, maintainer, documentation agent
Purpose: Plan the migration of agent-coordination docs into the new platform documentation system without losing accepted intent, contracts, ADRs, or proof trees
Design status: Draft
Implementation: Not started
Provenance: Created from documentation-system discussion and scan of existing agent-coordination docs
Writer type: Human + agent coauthor
Canonical for: Planning the agent-coordination documentation migration only
Use this when: Standardizing, migrating, or reviewing agent-coordination documentation
Do not use this for: Current runtime behavior, accepted architecture authority, or implementation truth
Last reviewed: 2026-09-14
Related:
- docs/doc-governance.md
- docs/platform/intent-preservation-ledger.md
- docs/platform/component-boundary.md
- docs/architect/agent-coordination/README.md
- docs/architect/agent-coordination/intent-preservation-ledger.md
```

Agent Coordination is a critical foundation component. It is not a small docs
cleanup target. It covers multiple important subcomponents: coordination
session identity, flow definition, workflow/stage operation compatibility,
assignment/run/run-result, dispatch control, evidence and result evaluation,
visibility/Herdr, work integration, group-thinking protocols, runtime recovery,
and domain adoption.

The migration goal is to preserve and clarify this body of work, not simplify
it into a smaller idea.

## 1. Goal

Move agent-coordination toward the new `docs/platform/<area>/` documentation
model while preserving:

- the accepted vision and foundation/domain boundary;
- the intent preservation ledger and every preserved/deferred intent;
- all accepted ADRs and their implementation notes;
- current contracts and schema authority;
- accepted architecture boundaries;
- proposal status for Step 09 / Step 10 and other frontier work;
- verification proof trees and live evidence;
- playbook status as engineering bootstrap, not product runtime authority;
- history and implementation records as non-canonical but valuable source
  material.

The result must let a human or stranger agent answer what is accepted, what is
implemented, what is deferred-preserved, what is only proposed, and what proof
backs each claim.

## 2. Non-Goals

- Do not rewrite agent-coordination runtime code.
- Do not promote proposals into accepted architecture.
- Do not demote accepted contracts or ADRs into history.
- Do not flatten verification proof trees into prose summaries.
- Do not merge playbooks into architecture or contracts.
- Do not collapse agent-coordination into host-invocation, runner, work-state,
  or coding-domain docs.
- Do not delete old paths until the migration ledger proves they are drained.

## 3. Hard Rules

| Rule | Meaning |
|---|---|
| Critical component posture | Treat this migration as high-risk documentation work because it affects foundation authority and many subcomponents. |
| Vision first | [vision.md](vision.md) remains the highest area authority until explicitly superseded. |
| Ledger preserved | [intent-preservation-ledger.md](intent-preservation-ledger.md) must be migrated intact before any simplification. |
| ADRs stay authoritative | Accepted ADRs keep decision authority; do not replace them with prose summaries. |
| Contracts stay normative | Contract docs define exact behavior and cannot be weakened by portal or architecture wording. |
| Proposals remain proposals | Step 09, Step 10, runtime recovery proposals, and frontier docs remain non-canonical unless explicitly accepted. |
| Proof trees stay linkable | Verification evidence remains navigable; summaries must link to proof roots. |
| Implementation status explicit | Every major claim is marked current, implemented, partial, accepted-not-implemented, deferred-preserved, proposed, superseded, or unknown. |
| Component boundary check | Update [component-boundary.md](../../platform/component-boundary.md) if ownership or parent/child shape changes; otherwise record `No component-boundary change`. |
| New doc system invariants | Related files are linkable in body; one H1 title per file; sections begin at H2. |

## 4. Source Inventory

### 4.1. Existing Area Control Docs

| Source | Current role | Migration treatment |
|---|---|---|
| [README.md](README.md) | Portal and accepted baseline summary | Promote to `docs/platform/agent-coordination/README.md` after preserving read paths and status distinctions. |
| [documentation-governance.md](documentation-governance.md) | Local documentation authority | Reconcile with [../../doc-governance.md](../../doc-governance.md); preserve stricter local rules that protect this area. |
| [vision.md](vision.md) | Highest area authority | Move/promote as `vision.md`; preserve authority and second-read rule for the ledger. |
| [intent-preservation-ledger.md](intent-preservation-ledger.md) | Intent traceability authority | Move/promote as `intent-preservation-ledger.md`; do not summarize away entries. |
| [vocabulary/README.md](vocabulary/README.md) | Vocabulary navigation | Preserve as area vocabulary or contract-adjacent reference. |

### 4.2. Accepted Architecture Sources

| Source | Current role |
|---|---|
| [architecture/README.md](architecture/README.md) | Accepted architecture index plus runtime recovery proposal status. |
| [architecture/system-context.md](architecture/system-context.md) | System purpose and authority boundaries. |
| [architecture/coordination-foundation-baseline.md](architecture/coordination-foundation-baseline.md) | Accepted Step 00-08 baseline. |
| [architecture/protocol-model.md](architecture/protocol-model.md) | Workflow, CoordinationProtocol, agent-led planning, hard/soft coordination model. |
| [architecture/runtime-model.md](architecture/runtime-model.md) | Assignment, dispatch, Run, RunResult, evidence flow. |
| [architecture/work-integration.md](architecture/work-integration.md) | Work integration without becoming second lifecycle authority. |
| [architecture/dispatch-control-plane.md](architecture/dispatch-control-plane.md) | Semantic operation choice vs execution infrastructure. |
| [architecture/evidence-and-results.md](architecture/evidence-and-results.md) | Outcome confidence and false-success boundaries. |
| [architecture/visibility-and-herdr.md](architecture/visibility-and-herdr.md) | Herdr visibility boundary. |
| [architecture/run-handle.md](architecture/run-handle.md) | Runtime-layer handle proposal. |
| [architecture/coordination-continuation-recovery.md](architecture/coordination-continuation-recovery.md) | Continuation/recovery proposal. |
| [architecture/executor-health-and-fallback.md](architecture/executor-health-and-fallback.md) | Executor health/fallback proposal. |
| [architecture/runtime-recovery-design.md](architecture/runtime-recovery-design.md) | Detailed runtime recovery design entry. |
| [architecture/group-thinking-trigger-surface.md](architecture/group-thinking-trigger-surface.md) | Group-thinking trigger surface. |

### 4.2.1. Recently Updated Runtime-Recovery Sources

These sources were updated during runtime-recovery work and must be read
directly before migrating runtime recovery, RunHandle, Herdr visibility, or
launch reconciliation material.

| Source | Current role | Migration warning |
|---|---|---|
| [architecture/runtime-recovery-design.md](architecture/runtime-recovery-design.md) | Runtime recovery entry point and proof/status map | Header says S0-S4 and the session-recovery half of S5 are implemented; S5 transfer/import/budget/apply half, S6, and S7 remain not implemented. Preserve this split. |
| [architecture/run-handle.md](architecture/run-handle.md) | RunHandle and recovery material reasoning | Treat as accepted reasoning and proposed vocabulary; per-cell verification docs are authoritative for exact shipped field names/shapes. |
| [architecture/visibility-and-herdr.md](architecture/visibility-and-herdr.md) | Visibility versus runtime truth | Implementation is now substantial; Herdr remains visibility, not Run truth. Writable takeover remains parked/deferred. |
| [../../../plans/260911-2305-runtime-recovery/phase-designs/launch-reconciliation.md](../../../plans/260911-2305-runtime-recovery/phase-designs/launch-reconciliation.md) | Historical design plus implemented P02H reopen warning | The original `herdr agent start ... -- <prepared-command>` pseudocode was falsified. The shipped mechanism is documented in [verification/runtime-recovery/p02h-reopen.md](verification/runtime-recovery/p02h-reopen.md). Do not promote the falsified invocation as current design. |
| [verification/runtime-recovery/p02h-reopen.md](verification/runtime-recovery/p02h-reopen.md) | Authoritative shipped proof for herdr-spawn bwrap launch reconciliation | Use this for what actually shipped and the residual accepted gap. |

### 4.3. Accepted Contracts

| Source | Current role |
|---|---|
| [contracts/README.md](contracts/README.md) | Contract index and proposal exclusion. |
| [contracts/workflow-stage-operation.md](contracts/workflow-stage-operation.md) | Stage operation normalization, lookup, validation, compatibility. |
| [contracts/assignment-run-runresult.md](contracts/assignment-run-runresult.md) | Assignment, Run, RunResult, evidence boundaries. |
| [contracts/coordination-session.md](contracts/coordination-session.md) | CoordinationSession schema, storage, membership, recovery. |
| [contracts/flow-definition.md](contracts/flow-definition.md) | Shared graph/operation/policy IR and typed profiles. |

### 4.4. Accepted Decisions

| Source | Current role |
|---|---|
| [decisions/README.md](decisions/README.md) | ADR index and implementation notes. |
| [decisions/ADR-001-work-lifecycle-authority.md](decisions/ADR-001-work-lifecycle-authority.md) | Work owns delivery lifecycle. |
| [decisions/ADR-002-stage-operation-compatibility.md](decisions/ADR-002-stage-operation-compatibility.md) | Stage primary operation compatibility. |
| [decisions/ADR-003-assignment-run-runresult-separation.md](decisions/ADR-003-assignment-run-runresult-separation.md) | Assignment/Run/RunResult separation. |
| [decisions/ADR-004-reserve-job.md](decisions/ADR-004-reserve-job.md) | Job reserved for future scheduler. |
| [decisions/ADR-005-herdr-visibility-only.md](decisions/ADR-005-herdr-visibility-only.md) | Herdr is visibility, not evidence/truth. |
| [decisions/ADR-006-assignment-provenance-and-contract-snapshot.md](decisions/ADR-006-assignment-provenance-and-contract-snapshot.md) | Assignment provenance and normalized execution-contract snapshot. |
| [decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md](decisions/ADR-007-domain-harness-seam-and-non-driving-inline-evidence.md) | Domain harness seam and non-driving inline evidence. |
| [decisions/ADR-008-coordination-session-and-mission-deferral.md](decisions/ADR-008-coordination-session-and-mission-deferral.md) | CoordinationSession recovery root and mission deferral. |
| [decisions/ADR-009-flow-definition-shared-ir-and-typed-profiles.md](decisions/ADR-009-flow-definition-shared-ir-and-typed-profiles.md) | FlowDefinition shared IR and typed profiles. |
| [decisions/ADR-010-interactive-headless-parity-and-work-isolation.md](decisions/ADR-010-interactive-headless-parity-and-work-isolation.md) | Interactive/headless parity and domain-owned Work isolation. |
| [decisions/ADR-011-dispatch-owns-lifecycle-receiver-writes-receipt.md](decisions/ADR-011-dispatch-owns-lifecycle-receiver-writes-receipt.md) | Dispatch owns lifecycle receiver writes receipt. |

### 4.5. Proposals, Roadmap, Playbooks, Verification, History

| Source group | Treatment |
|---|---|
| [proposals/](proposals/) | Keep non-canonical unless promoted by explicit decision. Preserve frontier status and unresolved questions. |
| [roadmap/](roadmap/) | Preserve implementation sequencing; do not let roadmap redefine architecture. |
| [playbooks/](playbooks/) | Preserve as engineering bootstrap and prompt material; never runtime authority. |
| [verification/](verification/) | Preserve proof roots, indexes, proof artifacts, review/red-team records, live evidence, known gaps. |
| [history/](history/) | Preserve historical context and implementation records as non-canonical source material. |

## 5. Target Structure

Target shape:

```txt
docs/platform/agent-coordination/
  README.md
  vision.md
  intent-preservation-ledger.md
  spec.md
  subcomponents/
  vocabulary/
  architecture/
  contracts/
  decisions/
  verification/
  playbooks/
  proposals/
  roadmap/
  history/
```

This area should not be compressed into fewer buckets just to look simpler.
Its current separation is meaningful and should mostly survive the move.

Because agent-coordination covers many child components, the target portal must
include a subcomponent map. Create `subcomponents/<name>/` directories only
after the source inventory proves the child needs local navigation; otherwise
keep the child in the map and link to the owning architecture/contract docs.

## 6. Subcomponent Map To Preserve

The migration must keep these subcomponents visible:

| Subcomponent | Current source | Migration note |
|---|---|---|
| Foundation identity and boundaries | [vision.md](vision.md), [architecture/system-context.md](architecture/system-context.md) | Preserve as top-level area direction and architecture. |
| Intent preservation | [intent-preservation-ledger.md](intent-preservation-ledger.md) | Keep near vision, separate file. |
| Vocabulary and concept relationships | [vocabulary/README.md](vocabulary/README.md) | Preserve canonical terminology. |
| Workflow / Stage Operation compatibility | [contracts/workflow-stage-operation.md](contracts/workflow-stage-operation.md), ADR-002 | Keep contract authority explicit. |
| CoordinationSession | [contracts/coordination-session.md](contracts/coordination-session.md), ADR-008 | Preserve recovery-root status and mission deferral. |
| FlowDefinition | [contracts/flow-definition.md](contracts/flow-definition.md), ADR-009 | Preserve shared IR and typed profile distinction. |
| Assignment / Run / RunResult | [contracts/assignment-run-runresult.md](contracts/assignment-run-runresult.md), ADR-003 | Preserve separation and evidence boundary. |
| Dispatch control | [architecture/dispatch-control-plane.md](architecture/dispatch-control-plane.md), ADR-011 | Keep semantic choice separate from execution infrastructure. |
| Evidence and results | [architecture/evidence-and-results.md](architecture/evidence-and-results.md), ADR-005/006/007 | Preserve false-success and evidence integrity boundaries. |
| Work integration | [architecture/work-integration.md](architecture/work-integration.md), ADR-001/010 | Preserve Work as optional integration and sole lifecycle authority. |
| Visibility / Herdr | [architecture/visibility-and-herdr.md](architecture/visibility-and-herdr.md), ADR-005 | Keep visibility separate from truth/evidence. |
| Runtime recovery | [architecture/runtime-recovery-design.md](architecture/runtime-recovery-design.md) and related docs | Preserve proposal/accepted status accurately. |
| Launch reconciliation | [../../../plans/260911-2305-runtime-recovery/phase-designs/launch-reconciliation.md](../../../plans/260911-2305-runtime-recovery/phase-designs/launch-reconciliation.md), [verification/runtime-recovery/p02h-reopen.md](verification/runtime-recovery/p02h-reopen.md) | Preserve the implemented launcher-script mechanism and the warning that the earlier `herdr agent start ... -- <prepared-command>` shape is false. |
| Group thinking and advisory panels | [architecture/group-thinking-trigger-surface.md](architecture/group-thinking-trigger-surface.md), [verification/architecture-advisory-panel/index.md](verification/architecture-advisory-panel/index.md) | Preserve protocol and proof status without hiding known gaps. |

## 7. Migration Phases

### 7.1. Phase 0: Protect The Current Authority Graph

1. Read [../../doc-governance.md](../../doc-governance.md), [../../platform/intent-preservation-ledger.md](../../platform/intent-preservation-ledger.md), and [../../platform/component-boundary.md](../../platform/component-boundary.md).
2. Read all source groups in §4.
3. Produce a source inventory with document type, authority, implementation
   state, target location, and disposition.
4. Identify docs that already satisfy the new documentation rules and should be
   moved with minimal rewrite.
5. Identify docs that require status notes because proposal/accepted/current
   boundaries are ambiguous.

Exit gate:

- No source group is unclassified.
- Accepted, proposed, verification, playbook, and history materials are not
  mixed.
- Component-boundary impact is either updated or recorded as
  `No component-boundary change`.

### 7.2. Phase 1: Create Target Portal And Preserve Vision/Ledger Pair

1. Create `docs/platform/agent-coordination/README.md`.
2. Promote `vision.md` and `intent-preservation-ledger.md` first.
3. Preserve the existing authority rule: Vision first, ledger second.
4. Add linkable related files and status notes.
5. Link from [../../platform/README.md](../../platform/README.md) only when the
   new portal honestly routes readers.

Exit gate:

- A human can enter the new area and immediately tell what is accepted,
  proposed, implemented, partial, and deferred-preserved.

### 7.3. Phase 2: Promote Spec Without Shrinking The Vision

Create `spec.md` from current implemented behavior and accepted contracts.

The spec must separate:

| Status | Meaning |
|---|---|
| `implemented` | Current code/proof supports it. |
| `partial` | Some implementation exists, but not the full accepted claim. |
| `accepted-not-implemented` | Accepted direction with no proof yet. |
| `deferred-preserved` | Preserved in ledger but intentionally outside current slice. |
| `proposed` | Design exists but is not accepted authority. |
| `unknown` | Needs fresh code/proof scan. |

Exit gate:

- The spec does not make deferred-preserved capabilities disappear.
- The spec does not imply proposals are current behavior.

### 7.4. Phase 3: Move Accepted Architecture

Promote accepted architecture before frontier proposals.

Order:

1. system context;
2. coordination foundation baseline;
3. protocol model;
4. runtime model;
5. work integration;
6. dispatch control plane;
7. evidence and results;
8. visibility and Herdr;
9. runtime recovery documents with explicit accepted/proposed labels;
10. group-thinking trigger surface with explicit status.

Exit gate:

- Architecture docs link to relevant contracts, ADRs, verification, and ledger
  entries.
- Proposal status is visible in the body, not only implied by path.

### 7.5. Phase 4: Move Contracts And ADRs

Contracts and ADRs should move with minimal semantic rewrite.

Rules:

- Keep exact schema/contract language intact unless an accepted decision changes
  it.
- Preserve ADR IDs, titles, dates, context, consequences, implementation notes,
  and supersession relationships.
- Add metadata, H1/H2 normalization, linkable related files, and implementation
  alignment where missing.
- Do not merge multiple ADRs into one summary.

Exit gate:

- Every accepted contract and ADR has a new target path or explicit reason to
  remain in legacy path during migration.

### 7.6. Phase 5: Preserve Verification Trees

Verification is large and must not be flattened.

1. Move or mirror indexes first.
2. Preserve proof directories as evidence artifacts.
3. Keep `current-cell.md`, review reports, red-team reports, live proof logs,
   request JSON, and known-failure notes linkable.
4. Create summary pages only as navigation, never as replacement evidence.
5. Keep dated proof context and configuration where present.

Exit gate:

- Every claim in spec/architecture/contracts that says `implemented` links to
  evidence or a named proof gap.
- Large proof trees remain reachable from stable indexes.

### 7.7. Phase 6: Preserve Playbooks, Proposals, Roadmap, And History

Rules:

- Playbooks stay operational/bootstrap docs.
- Proposals stay non-canonical until accepted.
- Roadmap stays implementation sequence, not design authority.
- History stays non-canonical source/evidence.
- Add status notes instead of rewriting history as current truth.

Exit gate:

- A reader cannot mistake a prompt/playbook/proposal for a binding contract.

### 7.8. Phase 7: Redirect Legacy Paths

Only after target docs are reviewed:

1. Add status notes to old files.
2. Redirect portal/index docs where safe.
3. Keep old detailed docs live if not fully drained.
4. Mark the source inventory row as `drained` only when every important claim is
   represented in target docs or explicitly retired.

Exit gate:

- Opening any old path tells the reader whether it is current, migration source,
  historical, or redirected.

## 8. Required Migration Ledgers

Because agent-coordination already has a mature intent ledger, do not create a
replacement ledger. Preserve and extend it.

Additional temporary migration tables may be used:

| Ledger | Purpose | Delete/archive when |
|---|---|---|
| Source inventory | Tracks old file -> target disposition. | Every row is promoted, redirected, retained, or archived. |
| Claim preservation table | Tracks accepted claims and target anchors. | All accepted claims have stable anchors. |
| Proof preservation table | Tracks verification roots and consuming claims. | Every proof root has an index and consumer link. |
| Proposal status table | Tracks proposal/frontier docs and acceptance state. | Proposal paths are clearly labeled in target docs. |

## 9. Execution Packet

This section is the handoff packet for an agent implementing the migration.
Follow it in order. Do not skip Phase 0 to start writing polished docs.

### 9.1. First Commands

Run these before editing:

```sh
pwd
git status --short
find docs/architect/agent-coordination -maxdepth 3 -type f | sort
find docs/architect/agent-coordination/verification -maxdepth 2 -type f | sort
```

Then read, in this order:

1. [../../doc-governance.md](../../doc-governance.md)
2. [../../platform/README.md](../../platform/README.md)
3. [../../platform/component-boundary.md](../../platform/component-boundary.md)
4. This plan.
5. [README.md](README.md)
6. [documentation-governance.md](documentation-governance.md)
7. [vision.md](vision.md)
8. [intent-preservation-ledger.md](intent-preservation-ledger.md)
9. [architecture/README.md](architecture/README.md)
10. [contracts/README.md](contracts/README.md)
11. [decisions/README.md](decisions/README.md)
12. [verification/README.md](verification/README.md)

### 9.2. Phase 0 Deliverables

Create these files first under a migration working directory:

```txt
docs/platform/agent-coordination/history/documentation-migration/
  source-inventory.md
  claim-preservation.md
  proof-preservation.md
  proposal-status.md
```

These files are temporary migration aids. They may later be drained into
canonical docs or retained as history.

`source-inventory.md` must use this table:

| Source path | Existing type | Authority | Implementation status | Target path | Disposition | Notes |
|---|---|---|---|---|---|---|
| `docs/architect/agent-coordination/...` | vision / contract / architecture / proposal / verification / playbook / history | accepted / proposed / evidence / operational / non-canonical | implemented / partial / accepted-not-implemented / proposed / unknown / N/A | `docs/platform/agent-coordination/...` | promote / split / keep-legacy-current / link-only / archive / redirect / needs-human |  |

Allowed `Disposition` values:

| Disposition | Meaning |
|---|---|
| `promote` | Move or copy the source into the target docs with preserved meaning. |
| `split` | Source contains multiple authority types and must be split into target docs. |
| `keep-legacy-current` | Source remains current during migration; target links to it. |
| `link-only` | Target index links to source, but content is not moved yet. |
| `archive` | Source becomes history after canonical content is promoted. |
| `redirect` | Source gets a status note pointing to the new canonical target. |
| `needs-human` | Agent cannot decide without reviewer input. |

`claim-preservation.md` must use this table:

| Claim ID | Claim | Source | Authority | Status | Target anchor | Must not lose | Proof / gap |
|---|---|---|---|---|---|---|---|
| `AC-CLAIM-001` |  |  | vision / ADR / contract / architecture | implemented / partial / accepted-not-implemented / deferred-preserved / proposed / unknown |  |  |  |

Minimum claim buckets:

- Agent Coordination is a foundation layer.
- Work is optional integration, not system identity.
- A predeclared Workflow or CoordinationProtocol is optional.
- Runtime execution contracts are mandatory.
- Work owns delivery lifecycle when present.
- CoordinationSession is the V1 executable/recovery root.
- FlowDefinition is shared graph/operation/policy IR with typed profiles.
- Assignment, Run, and RunResult are separate.
- Dispatch governs execution infrastructure.
- Evidence and RunResult prevent false success.
- Herdr is visibility, not evidence/truth.
- Domain-owned Work isolation remains outside coordination code until proven.
- Group-thinking and heterogeneous cohorts preserve dissent/evidence.
- Runtime recovery guarantees are distinct: control fencing, result fencing,
  effect protection.
- Herdr is transport/visibility and failure detector, never Run truth.
- Herdr-spawn bwrap launch reconciliation uses the P02H reopen shipped
  launcher-script mechanism, not the falsified `herdr agent start ... --
  <prepared-command>` pseudocode.
- Runtime recovery status split: S0-S4 and session-recovery half of S5 are
  implemented; S5 transfer/import/budget/apply, S6, and S7 remain not
  implemented.
- Writable partial-edit takeover remains parked/deferred until workspace-grant
  and evaluator owners exist.

`proof-preservation.md` must use this table:

| Proof root | Proves / supports | Consumed by target doc | Move policy | Known gaps | Notes |
|---|---|---|---|---|---|
| `docs/architect/agent-coordination/verification/...` |  |  | move / link-only / keep-legacy-current |  |  |

Required runtime-recovery proof rows:

| Proof root | Must preserve |
|---|---|
| `docs/architect/agent-coordination/verification/runtime-recovery/p01.md` | Run admission/control-epoch fencing. |
| `docs/architect/agent-coordination/verification/runtime-recovery/p02l.md` | cli-spawn launch reconciliation. |
| `docs/architect/agent-coordination/verification/runtime-recovery/p02h.md` | Original herdr-spawn proof attempt and falsified direct-command typing context. |
| `docs/architect/agent-coordination/verification/runtime-recovery/p02h-reopen.md` | Authoritative shipped herdr-spawn bwrap launcher-script mechanism and residual accepted gap. |
| `docs/architect/agent-coordination/verification/runtime-recovery/p03.md` | Governed fallback. |
| `docs/architect/agent-coordination/verification/runtime-recovery/p04.md` | Pure evaluators. |
| `docs/architect/agent-coordination/verification/runtime-recovery/p05.md` | Standalone `dispatch recover`. |
| `docs/architect/agent-coordination/verification/runtime-recovery/p05s.md` | Session-owned recovery read/apply door. |

`proposal-status.md` must use this table:

| Proposal / frontier source | Topic | Current status | Accepted pieces | Deferred / rejected pieces | Target treatment |
|---|---|---|---|---|---|
|  |  | proposed / partially-accepted / superseded / unknown |  |  | keep-proposal / split-accepted / archive / needs-human |

### 9.3. Target Tree Decision

Use this exact initial target tree for Phase 1:

```txt
docs/platform/agent-coordination/
  README.md
  vision.md
  intent-preservation-ledger.md
  spec.md
  subcomponents/
    README.md
  architecture/
    README.md
  contracts/
    README.md
  decisions/
    README.md
  verification/
    README.md
  proposals/
    README.md
  playbooks/
    README.md
  roadmap/
    README.md
  history/
    README.md
    documentation-migration/
      source-inventory.md
      claim-preservation.md
      proof-preservation.md
      proposal-status.md
```

Do not create `subcomponents/<name>/` directories in Phase 1 unless the source
inventory proves a child component has at least two of:

- its own contract;
- its own implementation/proof set;
- its own accepted ADR;
- its own lifecycle/status distinct from the parent area;
- enough docs that a local portal reduces reader confusion.

If unsure, keep the child in `subcomponents/README.md` as a row and link to the
owning architecture/contract docs.

### 9.4. Initial Subcomponent Map

Create `subcomponents/README.md` with this initial map. The `Target directory`
column is a decision, not assumed.

| Subcomponent | Owns | Primary sources | Target directory | Status |
|---|---|---|---|---|
| Foundation identity | Foundation/domain boundary and optional structure | `vision.md`, `architecture/system-context.md` | map-only initially | accepted / partial |
| CoordinationSession | Session manifest, event schema, storage, recovery root | `contracts/coordination-session.md`, ADR-008 | likely `subcomponents/coordination-session/` | implemented / partial |
| FlowDefinition | Shared graph/operation/policy IR and typed profiles | `contracts/flow-definition.md`, ADR-009 | likely `subcomponents/flow-definition/` | implemented / partial |
| Workflow Stage Operation | Stage operation normalization and compatibility | `contracts/workflow-stage-operation.md`, ADR-002 | decide after inventory | accepted / partial |
| Assignment / Run / RunResult | Semantic request, attempt, result, evidence boundary | `contracts/assignment-run-runresult.md`, ADR-003 | likely `subcomponents/assignment-run-result/` | implemented / partial |
| Dispatch Control | Execution infrastructure and operation dispatch boundary | `architecture/dispatch-control-plane.md`, ADR-011 | likely `subcomponents/dispatch-control/` | implemented / partial |
| Evidence And Results | Confidence, false-success, proof boundary | `architecture/evidence-and-results.md`, ADR-005/006/007 | likely `subcomponents/evidence-results/` | accepted / partial |
| Work Integration | Work-attached coordination without second lifecycle authority | `architecture/work-integration.md`, ADR-001/010 | decide after inventory | accepted / partial |
| Visibility / Herdr | Visibility-only boundary | `architecture/visibility-and-herdr.md`, ADR-005 | decide after inventory | accepted / partial |
| Runtime Recovery | RunHandle, continuation/recovery, fallback, health | runtime recovery architecture docs | likely `subcomponents/runtime-recovery/` only if status is clear | proposed / partial / unknown |
| Launch Reconciliation | Herdr/cli spawn launch reconciliation and confinement authority handoff | runtime recovery phase designs and P02H verification | likely under `subcomponents/runtime-recovery/` | substantially implemented with residual gap |
| Group Thinking | Group-thinking protocols, advisory panels, cohort planning | group-thinking docs and verification | likely `subcomponents/group-thinking/` | implemented mechanism / quality proof mixed |

### 9.5. Phase 1 Files To Create

After Phase 0 tables exist, create only these target files:

```txt
docs/platform/agent-coordination/README.md
docs/platform/agent-coordination/vision.md
docs/platform/agent-coordination/intent-preservation-ledger.md
docs/platform/agent-coordination/subcomponents/README.md
docs/platform/agent-coordination/history/README.md
```

Minimum content:

- `README.md`: area purpose, read-first table, current accepted baseline,
  subcomponent map link, status summary, related files.
- `vision.md`: preserve existing Vision authority and wording as much as
  possible; add metadata, linkable related files, H1/H2 normalization.
- `intent-preservation-ledger.md`: preserve existing ledger entries; do not
  rewrite into a short summary.
- `subcomponents/README.md`: use §9.4 table, with status and source links.
- `history/README.md`: explain migration aids and legacy source status.

Do not create `spec.md` in Phase 1 unless Phase 0 has enough implemented/current
evidence to avoid guessing.

### 9.6. Phase 2 Files To Create

Create:

```txt
docs/platform/agent-coordination/spec.md
docs/platform/agent-coordination/verification/implementation-alignment.md
```

`spec.md` must include:

- current summary;
- scope / non-scope;
- actors and surfaces;
- core entities;
- operations and flows;
- contracts owned;
- contracts consumed;
- implementation status table;
- known gaps.

`implementation-alignment.md` must include:

| Design claim | Implementation status | Evidence | Gap / next action |
|---|---|---|---|

Populate it from `claim-preservation.md` and `proof-preservation.md`; use
`unknown` rather than guessing.

### 9.7. Phase 3 Files To Create Or Promote

Create target architecture index and promote accepted architecture docs:

```txt
docs/platform/agent-coordination/architecture/README.md
docs/platform/agent-coordination/architecture/system-context.md
docs/platform/agent-coordination/architecture/coordination-foundation-baseline.md
docs/platform/agent-coordination/architecture/protocol-model.md
docs/platform/agent-coordination/architecture/runtime-model.md
docs/platform/agent-coordination/architecture/work-integration.md
docs/platform/agent-coordination/architecture/dispatch-control-plane.md
docs/platform/agent-coordination/architecture/evidence-and-results.md
docs/platform/agent-coordination/architecture/visibility-and-herdr.md
```

Runtime recovery and group-thinking docs may be promoted in this phase only if
their status is clear. Otherwise create index rows pointing back to legacy
sources and mark them `proposed`, `partial`, or `unknown`.

For runtime recovery, status is no longer simply `proposed`. Preserve the
2026-09-14 split from [architecture/runtime-recovery-design.md](architecture/runtime-recovery-design.md):

| Slice | Migration status |
|---|---|
| S0-S4 | implemented; link to runtime-recovery verification docs. |
| S5 session-recovery half | implemented; link to P05/P05S evidence. |
| S5 transfer/import/budget/apply half | not implemented; preserve as proposed/deferred. |
| S6 additional adapters/checkpoint support | not implemented. |
| S7 Rust writer port | not implemented; separate track. |
| Writable partial-edit takeover | deliberately parked/deferred. |

For launch reconciliation, use [verification/runtime-recovery/p02h-reopen.md](verification/runtime-recovery/p02h-reopen.md)
as the shipped source. Keep
[../../../plans/260911-2305-runtime-recovery/phase-designs/launch-reconciliation.md](../../../plans/260911-2305-runtime-recovery/phase-designs/launch-reconciliation.md)
as historical reasoning plus warning, not as current invocation syntax.

### 9.8. Phase 4 Files To Create Or Promote

Create target contract and decision indexes first:

```txt
docs/platform/agent-coordination/contracts/README.md
docs/platform/agent-coordination/decisions/README.md
```

Then promote accepted contract docs and ADRs one by one. Keep original IDs and
titles. Do not combine ADRs.

### 9.9. Phase 5 Files To Create Or Promote

Create:

```txt
docs/platform/agent-coordination/verification/README.md
```

Then decide per proof root:

- `link-only` for large proof artifact directories during first migration;
- `move` only for compact proof docs that do not risk breaking historical
  evidence paths;
- `keep-legacy-current` for active verification tracks that are still being
  appended to.

The default for large proof trees is `link-only`.

### 9.10. Platform Portal Update Gate

Update [../../platform/README.md](../../platform/README.md) only after Phase 1
files exist and links resolve.

The platform portal row should point to
`docs/platform/agent-coordination/README.md` as the target area portal and list
`docs/architect/agent-coordination/` as legacy/current source during migration.

### 9.11. Legacy Status Notes

Do not add status notes to old docs until the target doc exists.

Use this exact status-note shape at the top of old docs when redirecting:

```md
> Migration status: This document is a legacy/current source for
> `docs/platform/agent-coordination/<target>`. Do not edit divergent design
> claims here without also updating the target doc or migration inventory.
```

Use `legacy/current source` when the old doc still has authority during
migration. Use `historical source` only after the target doc owns the claim.

### 9.12. Stop Conditions

Stop and ask a human reviewer when:

- a source document mixes accepted contract and proposal in a way the agent
  cannot separate confidently;
- moving a proof tree would break references from active plans;
- a proposal appears to have been partially accepted but no ADR/decision is
  found;
- a claim conflicts with the intent preservation ledger;
- a component boundary would change and the correct parent/child relationship is
  unclear;
- code scan is needed to mark a major claim as implemented but the relevant code
  ownership is unclear.

### 9.13. Validation Commands

After each phase, run:

```sh
rg -n '^# [0-9]+\\.' docs/platform/agent-coordination docs/architect/agent-coordination/documentation-standardization-plan.md
```

Run a local link check for production docs touched in that phase. Templates may
contain future relative links and should be checked separately.

Render long Markdown files with `mdview open <absolute-path>`.

### 9.14. Phase Completion Report

Each phase report must include:

| Field | Required content |
|---|---|
| Files created/updated | Exact paths. |
| Source rows completed | Count and notable paths. |
| Claims preserved | IDs and target anchors. |
| Proof links preserved | Proof roots and target consumers. |
| Legacy docs still authoritative | Paths and why. |
| Unknowns / human questions | Explicit list, or `none`. |
| Component-boundary impact | Updated path or `No component-boundary change`. |
| Validation | Commands run and result. |
| Preview URLs | MDView URLs for long docs. |

## 10. Review Checklist

Before accepting the migration, answer:

1. Is [vision.md](vision.md) preserved as highest area authority?
2. Is [intent-preservation-ledger.md](intent-preservation-ledger.md) preserved
   without losing entries?
3. Can a reader distinguish accepted architecture from proposals?
4. Can a reader distinguish contracts from playbooks/prompts?
5. Are all ADRs preserved with their IDs and consequences?
6. Are all contracts preserved with exact normative meaning?
7. Are large verification proof trees still linkable and indexed?
8. Are implementation statuses explicit for every major claim?
9. Are Work, Dispatch, RunResult, Herdr, Host, and Coding Domain boundaries
   still clear?
10. Has [component-boundary.md](../../platform/component-boundary.md) been
    updated or explicitly marked `No component-boundary change`?
11. Are related files linkable in body sections?
12. Does every new/updated Markdown file have one H1 title and H2+ sections?

## 11. Open Questions

| Question | Needed before |
|---|---|
| Should all proof artifact directories move physically, or should target docs link back to legacy proof roots during migration? | Phase 5. |
| Should `documentation-governance.md` remain as an area-local policy after global governance exists? | Phase 1. |
| Which runtime recovery docs are accepted architecture versus proposed detailed design? | Phase 3. |
| Should vocabulary remain inside this area or move to a platform-wide vocabulary later? | Phase 4. |
| What exact target path should host/dispatch overlap use to avoid duplicate authority? | Phase 3. |

## 12. Related Files

| Relationship | File |
|---|---|
| global documentation governance | [../../doc-governance.md](../../doc-governance.md) |
| platform intent ledger | [../../platform/intent-preservation-ledger.md](../../platform/intent-preservation-ledger.md) |
| component-boundary anchor | [../../platform/component-boundary.md](../../platform/component-boundary.md) |
| current area portal | [README.md](README.md) |
| current area vision | [vision.md](vision.md) |
| current area intent ledger | [intent-preservation-ledger.md](intent-preservation-ledger.md) |
| current architecture index | [architecture/README.md](architecture/README.md) |
| current contracts index | [contracts/README.md](contracts/README.md) |
| current decisions index | [decisions/README.md](decisions/README.md) |
| current verification index | [verification/README.md](verification/README.md) |
