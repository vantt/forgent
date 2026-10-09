# Review pack: s2-agent-coordination-judgment-03

Pack commit: a7d561538a9ec6192ce5a513b3cc7f006f995fb7

Pack id: 01dc094d0a68ff18e016e795d6693f63e718edde41b73da9dc453d545f69da8a

Author session: codex-session:1@2026-10-08

## claim_9ca45c1cbc5df4468eae3eb46d27e672

Source: docs/architect/agent-coordination/verification/README.md#evidence-sets

Target: docs/platform/agent-coordination/verification/README.md#evidence-sets

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_9ca45c1cbc5df4468eae3eb46d27e672 |
| sourceUnitDigest | d0d8f4efe057c6bb8a40429e7613c28b63c49e6923e9a52d0926ac94b04b5ab9 |
| targetOwner | docs/platform/agent-coordination/verification/README.md |
| targetAnchor | evidence-sets |
| claimKind | navigation |
| disposition | supersede |
| reviewStatus | pending |
| authoredBy | codex-session:1@2026-10-08 |
| rationale | Preserve docs/architect/agent-coordination/verification/README.md#evidence-sets at docs/platform/agent-coordination/verification/README.md#evidence-sets. The source evidence list and verification limits are retained; the pre-existing candidate migration paragraph and eight-row evidence navigation table are now explicitly labelled additions, not claimed to be source material. The Added in candidate label now also names the pre-existing Proof Preservation pointer below the evidence-root table; it routes to move policy and known gaps without claiming new conformance. |
| reviewNote | Evidence Sets now labels the migration paragraph and the eight-row proof-root table, but the target also adds a Proof Preservation sentence ('phase-by-phase move policy and known gaps are in ...') that the label does not name and the rationale omits. Extend the Added-in-candidate label and rationale to cover it. |

### Source unit

```text
## Evidence Sets

- [Team Dispatch V1 trace](team-dispatch-v1/index.md) records cell-level
  implementation, review, red-team, and live proof evidence.

Verification establishes implementation conformance at a point in time. It does
not define architecture or change a contract.

Future verification should separate:

- deterministic unit/integration tests;
- negative and adversarial tests;
- live provider/executor scenarios;
- traceability matrix from requirement to code/test/evidence;
- known unrelated failures;
- date/commit/configuration of the proof.
```

### Target unit

```text
## Evidence Sets

Added in candidate: The migration navigation paragraph, evidence-root table and Proof Preservation pointer below predate this batch (`fcfe78cb8`); they are candidate navigation, not newly verified conformance. During migration, target docs link to retained legacy proof roots. The mirrored
target directories remain navigable copies, but do not replace the dated
evidence artifacts or their recorded environments.

- [Team Dispatch V1 trace](team-dispatch-v1/index.md) records cell-level
  implementation, review, red-team, and live proof evidence.

| Evidence set | Supports | Current proof root |
|---|---|---|
| Foundation and standalone coordination | CoordinationSession, FlowDefinition, and Work-isolation boundaries | [Step 08](../../../architect/agent-coordination/verification/step-08-standalone-coordination/index.md) |
| Runtime recovery | admission fencing, launch reconciliation, fallback, and recovery status split | [Runtime recovery](../../../architect/agent-coordination/verification/runtime-recovery/) |
| Dispatch operability | worker claim, execution-contract persistence, RunResult v2, inspect, and reconcile boundaries | [Dispatch operability](../../../architect/agent-coordination/verification/dispatch-operability-implementation/) |
| Executor policy and placement | executor-policy baseline and placement-policy limits | [Executor-policy seams](../../../architect/agent-coordination/verification/executor-policy-dispatch-seams/p00.md) |
| Code implementation track policy | targeted proof per cell and full proof at declared gates | [Track policy](../../../architect/agent-coordination/verification/code-implementation-track-policy/) |
| Group thinking | protocol, cohort, and advisory-panel evidence, including known quality gaps | [Step 09 evidence](../../../architect/agent-coordination/verification/step-09-mvp6-to-mvp9/index.md) |
| Visibility / Herdr | visibility-only boundary | [Live proof](../../../architect/agent-coordination/verification/visibility-herdr/v0-live-proof-2026-09-07.md) |
| Team Dispatch V1 | original cell-level implementation, review, red-team, and live proof | [Team Dispatch V1](../../../architect/agent-coordination/verification/team-dispatch-v1/index.md) |

The phase-by-phase move policy and known gaps are in
[Proof Preservation](../history/documentation-migration/proof-preservation.md).

Verification establishes implementation conformance at a point in time. It does
not define architecture or change a contract.

Future verification should separate:

- deterministic unit/integration tests;
- negative and adversarial tests;
- live provider/executor scenarios;
- traceability matrix from requirement to code/test/evidence;
- known unrelated failures;
- date/commit/configuration of the proof.
```

### Unified diff

```diff
--- "docs/architect/agent-coordination/verification/README.md#evidence-sets"
+++ "docs/platform/agent-coordination/verification/README.md#evidence-sets"
@@ -1,8 +1,26 @@
 ## Evidence Sets
 
+Added in candidate: The migration navigation paragraph, evidence-root table and Proof Preservation pointer below predate this batch (`fcfe78cb8`); they are candidate navigation, not newly verified conformance. During migration, target docs link to retained legacy proof roots. The mirrored
+target directories remain navigable copies, but do not replace the dated
+evidence artifacts or their recorded environments.
+
 - [Team Dispatch V1 trace](team-dispatch-v1/index.md) records cell-level
   implementation, review, red-team, and live proof evidence.
 
+| Evidence set | Supports | Current proof root |
+|---|---|---|
+| Foundation and standalone coordination | CoordinationSession, FlowDefinition, and Work-isolation boundaries | [Step 08](../../../architect/agent-coordination/verification/step-08-standalone-coordination/index.md) |
+| Runtime recovery | admission fencing, launch reconciliation, fallback, and recovery status split | [Runtime recovery](../../../architect/agent-coordination/verification/runtime-recovery/) |
+| Dispatch operability | worker claim, execution-contract persistence, RunResult v2, inspect, and reconcile boundaries | [Dispatch operability](../../../architect/agent-coordination/verification/dispatch-operability-implementation/) |
+| Executor policy and placement | executor-policy baseline and placement-policy limits | [Executor-policy seams](../../../architect/agent-coordination/verification/executor-policy-dispatch-seams/p00.md) |
+| Code implementation track policy | targeted proof per cell and full proof at declared gates | [Track policy](../../../architect/agent-coordination/verification/code-implementation-track-policy/) |
+| Group thinking | protocol, cohort, and advisory-panel evidence, including known quality gaps | [Step 09 evidence](../../../architect/agent-coordination/verification/step-09-mvp6-to-mvp9/index.md) |
+| Visibility / Herdr | visibility-only boundary | [Live proof](../../../architect/agent-coordination/verification/visibility-herdr/v0-live-proof-2026-09-07.md) |
+| Team Dispatch V1 | original cell-level implementation, review, red-team, and live proof | [Team Dispatch V1](../../../architect/agent-coordination/verification/team-dispatch-v1/index.md) |
+
+The phase-by-phase move policy and known gaps are in
+[Proof Preservation](../history/documentation-migration/proof-preservation.md).
+
 Verification establishes implementation conformance at a point in time. It does
 not define architecture or change a contract.
```

## claim_b15db24ee1738cb12ed454378aab1638

Source: docs/architect/agent-coordination/vision.md#reading-down-from-the-vision

Target: docs/platform/agent-coordination/vision.md#reading-down-from-the-vision

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_b15db24ee1738cb12ed454378aab1638 |
| sourceUnitDigest | 0703183ea6f8d1a19cf45de96ba51b2e7f4e4b86867b3335522c9e9138e5d99f |
| targetOwner | docs/platform/agent-coordination/vision.md |
| targetAnchor | reading-down-from-the-vision |
| claimKind | navigation |
| disposition | supersede |
| reviewStatus | pending |
| authoredBy | codex-session:1@2026-10-08 |
| rationale | Preserve docs/architect/agent-coordination/vision.md#reading-down-from-the-vision at docs/platform/agent-coordination/vision.md#reading-down-from-the-vision. The reviewed source clauses remain whole in the relocated unit. Relative links are normalized for the relocated owner; any historical absent-path annotation is explicit. This is not a claim that promotion metadata changed this body section. Kind navigation records reading-order links. The eight reading-order links are retained as navigation, with relative paths rewritten for the candidate directory and no new authority granted. |
| reviewNote | Reading Down From The Vision now has the navigation kind and its eight links are carried whole with valid rewrites, fixing round one. But the rationale says the index 'does not turn this source rule into navigation' while the kind is navigation, a self-contradiction; drop that templated sentence. |

### Source unit

```text
## Reading Down From The Vision

1. [Documentation Governance](documentation-governance.md) explains authority
   and promotion rules.
2. [Vocabulary](vocabulary/README.md) defines canonical terms.
3. [Accepted Architecture](architecture/README.md) defines current system
   boundaries and implemented profiles.
4. [Contracts](contracts/README.md) define exact machine-visible behavior.
5. [Architecture Decisions](decisions/README.md) record specific accepted and
   rejected choices.
6. [Step 07](proposals/step-07-coordination-session-adhoc-task.md) resolves the
   session/task/planning/isolation design still open under this Vision.
7. [Step 08](proposals/step-08-standalone-coordination-protocols.md) develops
   optional reusable protocols and agent-led standalone adoption.
8. [Step 09](../proposals/step-09-group-thinking-substrate.md) discusses the
   standalone group-thinking substrate expansion, and
   [Step 10](../proposals/step-10-coding-domain-adoption.md) discusses bringing
   the existing coding domain onto that foundation as its second unlike
   consumer.
```

### Target unit

```text
## Reading Down From The Vision

1. [Documentation Governance](../../architect/agent-coordination/documentation-governance.md) explains authority
   and promotion rules.
2. [Vocabulary](../../architect/agent-coordination/vocabulary/README.md) defines canonical terms.
3. [Accepted Architecture](../../architect/agent-coordination/architecture/README.md) defines current system
   boundaries and implemented profiles.
4. [Contracts](../../architect/agent-coordination/contracts/README.md) define exact machine-visible behavior.
5. [Architecture Decisions](../../architect/agent-coordination/decisions/README.md) record specific accepted and
   rejected choices.
6. [Step 07](../../architect/agent-coordination/proposals/step-07-coordination-session-adhoc-task.md) resolves the
   session/task/planning/isolation design still open under this Vision.
7. [Step 08](../../architect/agent-coordination/proposals/step-08-standalone-coordination-protocols.md) develops
   optional reusable protocols and agent-led standalone adoption.
8. [Step 09](../../architect/proposals/step-09-group-thinking-substrate.md) discusses the
   standalone group-thinking substrate expansion, and
   [Step 10](../../architect/proposals/step-10-coding-domain-adoption.md) discusses bringing
   the existing coding domain onto that foundation as its second unlike
   consumer.
```

### Unified diff

```diff
--- "docs/architect/agent-coordination/vision.md#reading-down-from-the-vision"
+++ "docs/platform/agent-coordination/vision.md#reading-down-from-the-vision"
@@ -1,19 +1,19 @@
 ## Reading Down From The Vision
 
-1. [Documentation Governance](documentation-governance.md) explains authority
+1. [Documentation Governance](../../architect/agent-coordination/documentation-governance.md) explains authority
    and promotion rules.
-2. [Vocabulary](vocabulary/README.md) defines canonical terms.
-3. [Accepted Architecture](architecture/README.md) defines current system
+2. [Vocabulary](../../architect/agent-coordination/vocabulary/README.md) defines canonical terms.
+3. [Accepted Architecture](../../architect/agent-coordination/architecture/README.md) defines current system
    boundaries and implemented profiles.
-4. [Contracts](contracts/README.md) define exact machine-visible behavior.
-5. [Architecture Decisions](decisions/README.md) record specific accepted and
+4. [Contracts](../../architect/agent-coordination/contracts/README.md) define exact machine-visible behavior.
+5. [Architecture Decisions](../../architect/agent-coordination/decisions/README.md) record specific accepted and
    rejected choices.
-6. [Step 07](proposals/step-07-coordination-session-adhoc-task.md) resolves the
+6. [Step 07](../../architect/agent-coordination/proposals/step-07-coordination-session-adhoc-task.md) resolves the
    session/task/planning/isolation design still open under this Vision.
-7. [Step 08](proposals/step-08-standalone-coordination-protocols.md) develops
+7. [Step 08](../../architect/agent-coordination/proposals/step-08-standalone-coordination-protocols.md) develops
    optional reusable protocols and agent-led standalone adoption.
-8. [Step 09](../proposals/step-09-group-thinking-substrate.md) discusses the
+8. [Step 09](../../architect/proposals/step-09-group-thinking-substrate.md) discusses the
    standalone group-thinking substrate expansion, and
-   [Step 10](../proposals/step-10-coding-domain-adoption.md) discusses bringing
+   [Step 10](../../architect/proposals/step-10-coding-domain-adoption.md) discusses bringing
    the existing coding domain onto that foundation as its second unlike
    consumer.
\ No newline at end of file
```

## claim_60a5c12e7c7c78095b2c90db75324462

Source: docs/architect/agent-coordination/vision.md#unheaded-block-65

Target: docs/platform/agent-coordination/vision.md#unheaded-block-65

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_60a5c12e7c7c78095b2c90db75324462 |
| sourceUnitDigest | ea4efb1bd39165a8a159e48b5e5d03a7da8ba4b017f66b0fcfec46fe96db6242 |
| targetOwner | docs/platform/agent-coordination/vision.md |
| targetAnchor | unheaded-block-65 |
| claimKind | navigation |
| disposition | supersede |
| reviewStatus | pending |
| authoredBy | codex-session:1@2026-10-08 |
| rationale | Preserve docs/architect/agent-coordination/vision.md#unheaded-block-65 at docs/platform/agent-coordination/vision.md#unheaded-block-65. The reviewed source clauses remain whole in the relocated unit. Relative links are normalized for the relocated owner; any historical absent-path annotation is explicit. This is not a claim that promotion metadata changed this body section. Kind navigation records reading-order link list. This eight-item reading list remains navigation; its destinations are retained through relative architect-path rewrites. |
| reviewNote | The eight-item reading list is correctly relabelled navigation and all links are carried with valid architect-path rewrites. However the rationale adds that the index 'does not turn this source rule into navigation', contradicting kind=navigation; the templated sentence must be removed or corrected. |

### Source unit

```text
1. [Documentation Governance](documentation-governance.md) explains authority
   and promotion rules.
2. [Vocabulary](vocabulary/README.md) defines canonical terms.
3. [Accepted Architecture](architecture/README.md) defines current system
   boundaries and implemented profiles.
4. [Contracts](contracts/README.md) define exact machine-visible behavior.
5. [Architecture Decisions](decisions/README.md) record specific accepted and
   rejected choices.
6. [Step 07](proposals/step-07-coordination-session-adhoc-task.md) resolves the
   session/task/planning/isolation design still open under this Vision.
7. [Step 08](proposals/step-08-standalone-coordination-protocols.md) develops
   optional reusable protocols and agent-led standalone adoption.
8. [Step 09](../proposals/step-09-group-thinking-substrate.md) discusses the
   standalone group-thinking substrate expansion, and
   [Step 10](../proposals/step-10-coding-domain-adoption.md) discusses bringing
   the existing coding domain onto that foundation as its second unlike
   consumer.
```

### Target unit

```text
1. [Documentation Governance](../../architect/agent-coordination/documentation-governance.md) explains authority
   and promotion rules.
2. [Vocabulary](../../architect/agent-coordination/vocabulary/README.md) defines canonical terms.
3. [Accepted Architecture](../../architect/agent-coordination/architecture/README.md) defines current system
   boundaries and implemented profiles.
4. [Contracts](../../architect/agent-coordination/contracts/README.md) define exact machine-visible behavior.
5. [Architecture Decisions](../../architect/agent-coordination/decisions/README.md) record specific accepted and
   rejected choices.
6. [Step 07](../../architect/agent-coordination/proposals/step-07-coordination-session-adhoc-task.md) resolves the
   session/task/planning/isolation design still open under this Vision.
7. [Step 08](../../architect/agent-coordination/proposals/step-08-standalone-coordination-protocols.md) develops
   optional reusable protocols and agent-led standalone adoption.
8. [Step 09](../../architect/proposals/step-09-group-thinking-substrate.md) discusses the
   standalone group-thinking substrate expansion, and
   [Step 10](../../architect/proposals/step-10-coding-domain-adoption.md) discusses bringing
   the existing coding domain onto that foundation as its second unlike
   consumer.
```

### Unified diff

```diff
--- "docs/architect/agent-coordination/vision.md#unheaded-block-65"
+++ "docs/platform/agent-coordination/vision.md#unheaded-block-65"
@@ -1,17 +1,17 @@
-1. [Documentation Governance](documentation-governance.md) explains authority
+1. [Documentation Governance](../../architect/agent-coordination/documentation-governance.md) explains authority
    and promotion rules.
-2. [Vocabulary](vocabulary/README.md) defines canonical terms.
-3. [Accepted Architecture](architecture/README.md) defines current system
+2. [Vocabulary](../../architect/agent-coordination/vocabulary/README.md) defines canonical terms.
+3. [Accepted Architecture](../../architect/agent-coordination/architecture/README.md) defines current system
    boundaries and implemented profiles.
-4. [Contracts](contracts/README.md) define exact machine-visible behavior.
-5. [Architecture Decisions](decisions/README.md) record specific accepted and
+4. [Contracts](../../architect/agent-coordination/contracts/README.md) define exact machine-visible behavior.
+5. [Architecture Decisions](../../architect/agent-coordination/decisions/README.md) record specific accepted and
    rejected choices.
-6. [Step 07](proposals/step-07-coordination-session-adhoc-task.md) resolves the
+6. [Step 07](../../architect/agent-coordination/proposals/step-07-coordination-session-adhoc-task.md) resolves the
    session/task/planning/isolation design still open under this Vision.
-7. [Step 08](proposals/step-08-standalone-coordination-protocols.md) develops
+7. [Step 08](../../architect/agent-coordination/proposals/step-08-standalone-coordination-protocols.md) develops
    optional reusable protocols and agent-led standalone adoption.
-8. [Step 09](../proposals/step-09-group-thinking-substrate.md) discusses the
+8. [Step 09](../../architect/proposals/step-09-group-thinking-substrate.md) discusses the
    standalone group-thinking substrate expansion, and
-   [Step 10](../proposals/step-10-coding-domain-adoption.md) discusses bringing
+   [Step 10](../../architect/proposals/step-10-coding-domain-adoption.md) discusses bringing
    the existing coding domain onto that foundation as its second unlike
    consumer.
\ No newline at end of file
```

## claim_5fbe0e914039d88235adf86cbf69914a

Source: docs/architect/agent-coordination/vocabulary/deprecated-and-reserved.md#historical-vocabulary

Target: docs/platform/agent-coordination/vocabulary/deprecated-and-reserved.md#historical-vocabulary

### Proposed decision

| Field | Value |
|---|---|
| claimId | claim\_5fbe0e914039d88235adf86cbf69914a |
| sourceUnitDigest | 6867d901c91997275541d6e914d9419ade1248df922dcccd745795c68c70369e |
| targetOwner | docs/platform/agent-coordination/vocabulary/deprecated-and-reserved.md |
| targetAnchor | historical-vocabulary |
| claimKind | historical-context |
| disposition | promote |
| reviewStatus | pending |
| authoredBy | codex-session:1@2026-10-08 |
| rationale | Preserve docs/architect/agent-coordination/vocabulary/deprecated-and-reserved.md#historical-vocabulary at docs/platform/agent-coordination/vocabulary/deprecated-and-reserved.md#historical-vocabulary. The complete native source unit is byte-equal at this exact target anchor; the locator below, not the previous block number, is the binding. Kind historical-context records historical vocabulary pointer and non-override context. The vocabulary document retains a pointer to historical vocabulary and its explicit non-override context; this is historical context, not an index rule. |
| reviewNote | Historical Vocabulary in vocabulary/deprecated-and-reserved.md is byte-equal and historical-context is the right kind (round-one mislabel fixed), but the rationale still ends with the copied sentence that the enclosing retained index does not turn this source rule into navigation; this unit sits in a vocabulary document, not an index, and is a pointer note, not a rule, so the sentence is false here. Rewrite the closing sentence specifically. |

### Source unit

```text
## Historical Vocabulary

Older terminology and rationale remain searchable in the
[pre-migration vocabulary map](../history/implementation-records/orchestration-vocabulary-map-2026-08-27.md).
Historical use does not override this document.
```

### Target unit

```text
## Historical Vocabulary

Older terminology and rationale remain searchable in the
[pre-migration vocabulary map](../history/implementation-records/orchestration-vocabulary-map-2026-08-27.md).
Historical use does not override this document.
```

### Unified diff

```diff
No text difference.
```

## Unmatched candidate units

### docs/platform/agent-coordination/history/documentation-migration/documentation-governance.md#agent-coordination-documentation-governance

````text
# Agent Coordination Documentation Governance

```txt
Document type: History
Audience: Human reviewer, maintainer, documentation agent
Purpose: Preserve the retired area policy and migration plan verbatim as non-authority history
Design status: Candidate
Implementation: Historical record; not a live runtime or documentation policy
Provenance: Verbatim source snapshot from docs/architect/agent-coordination/documentation-governance.md
Writer type: Human + agent coauthor
Canonical for: Historical evidence only; no current authority
Use this when: Auditing the former area documentation policy or migration plan
Do not use this for: Current authority, current runtime behavior, or new migration instructions
Last reviewed: Not independently reviewed
Related:
- docs/platform/agent-coordination/README.md
- docs/platform/agent-coordination/history/documentation-migration/source-inventory.md
Supersedes: None; legacy source is unchanged
Superseded by: None
Added in candidate: Wrapper H1 and promotion metadata for the literal historical snapshot; not part of the retired source policy
```

Added in candidate: Retired area policy and migration plan, retained verbatim as non-authority history. The literal source snapshot below preserves original status fields and file-relative references as historical text, not active authority or navigation.

```text
# Agent Coordination Documentation Governance

Document type: Policy
Design status: Accepted
Implementation: Active
Last reviewed: 2026-08-31
Canonical for: document taxonomy, authority, metadata, and maintenance rules

## Purpose

This policy keeps design truth separate from proposals, delivery plans,
verification evidence, operating instructions, and historical records.

## Document Types

| Type | Purpose | Normative |
|---|---|---|
| Vision | Highest-level product identity, foundation boundaries, and direction. | Yes. |
| Portal | Top-level navigation and reading paths. | No. |
| Policy | Documentation authority and maintenance rules. | Yes, for documentation. |
| Index | Navigation within one documentation area. | No. |
| Vocabulary | Canonical names, definitions, aliases, and concept relationships. | Yes, for terminology. |
| Architecture | Accepted system boundaries, responsibilities, and invariants. | Yes. |
| Contract | Accepted machine-facing or behavioral interface. | Yes. |
| Proposal | Design under discussion or review. | No. |
| ADR | Durable record of one accepted or rejected architecture decision. | Yes for accepted decisions. |
| Roadmap | Time-ordered implementation sequence and acceptance plan. | No new architecture authority. |
| Verification | Tests, live proof, traceability, and conformance evidence. | Evidence, not design authority. |
| Playbook | Engineering bootstrap, maintenance, or manual fallback procedure. | Operational only; never product runtime authority. |
| History | Superseded, exploratory, or implementation-era source material. | No. |

## Required Metadata

Every maintained Markdown design document should identify:

```
```txt
Document type: <type>
Design status: Discussion | Proposed | Accepted | Superseded | N/A
Implementation: Not started | Partial | Implemented | Verified | Drifted | Active | N/A
Last reviewed: YYYY-MM-DD
Canonical for: <subject or "nothing">
```
```text

Optional metadata:

```
```txt
Supersedes: <document links>
Superseded by: <document links>
Related: <document links>
```
```text

Design status and implementation state are independent. An accepted contract
may be only partially implemented; an implemented prototype may still embody a
discussion-stage design.

## Authority Order

When documents disagree, use this order:

1. accepted Vision for product identity, foundation boundaries, and direction;
2. accepted ADR for a specific decision within the Vision;
3. accepted contract for machine-visible behavior;
4. accepted architecture document;
5. canonical vocabulary for term meaning;
6. proposal;
7. roadmap;
8. playbook;
9. verification or history as evidence of what happened.

The Vision is not a substitute for exact schemas or state rules. ADRs and
contracts refine it, but they cannot silently make a Vision capability
mandatory, optional, or impossible in the opposite direction.

An implementation mismatch does not silently rewrite the design. Mark the
implementation state `Drifted`, then reconcile code or amend the accepted
decision explicitly.

## Source-Of-Truth Rules

- Define a term only in `vocabulary/`; other documents link to it.
- Put product identity and foundation-versus-domain boundaries in `vision.md`.
- Put durable system boundaries in `architecture/`, not numbered steps.
- Put exact schemas and state/evidence rules in `contracts/`.
- Keep unresolved alternatives in `proposals/` until accepted.
- Record accepted choices and rejected alternatives in `decisions/`.
- Roadmaps may reference architecture and contracts but must not redefine them.
- Test output and live proof belong in `verification/`.
- Prompt templates and team execution procedures belong in `playbooks/`.
- Runtime Skills/prose belong in `core/skills/` or `domains/<domain>/skills/`,
  with TaskSpecs and protocol/workflow configuration beside their runtime
  ownership layer; they must not depend on documentation playbooks.
- Historical documents must state that they are non-canonical.

## Change Rules

- A canonical term change that affects boundaries requires an ADR or an update
  to the ADR that owns the decision.
- A change to product identity or the foundation/domain boundary updates the
  Vision first, then reconciles every affected downstream document.
- An accepted contract change requires compatibility and migration notes.
- Proposal approval requires extracting accepted content into canonical docs;
  do not merely relabel the entire proposal as accepted.
- Superseded files remain searchable in `history/` when they contain useful
  rationale or implementation evidence.
- Cross-links must be checked after every move or rename.
```
````

### docs/platform/agent-coordination/history/documentation-migration/documentation-governance.md#unheaded-block-1

````text
```txt
Document type: History
Audience: Human reviewer, maintainer, documentation agent
Purpose: Preserve the retired area policy and migration plan verbatim as non-authority history
Design status: Candidate
Implementation: Historical record; not a live runtime or documentation policy
Provenance: Verbatim source snapshot from docs/architect/agent-coordination/documentation-governance.md
Writer type: Human + agent coauthor
Canonical for: Historical evidence only; no current authority
Use this when: Auditing the former area documentation policy or migration plan
Do not use this for: Current authority, current runtime behavior, or new migration instructions
Last reviewed: Not independently reviewed
Related:
- docs/platform/agent-coordination/README.md
- docs/platform/agent-coordination/history/documentation-migration/source-inventory.md
Supersedes: None; legacy source is unchanged
Superseded by: None
Added in candidate: Wrapper H1 and promotion metadata for the literal historical snapshot; not part of the retired source policy
```
````

### docs/platform/agent-coordination/history/documentation-migration/documentation-governance.md#unheaded-block-2

```text
Added in candidate: Retired area policy and migration plan, retained verbatim as non-authority history. The literal source snapshot below preserves original status fields and file-relative references as historical text, not active authority or navigation.
```

### docs/platform/agent-coordination/history/documentation-migration/documentation-standardization-plan.md#agent-coordination-documentation-standardization-plan

````text
# Agent Coordination Documentation Standardization Plan

```txt
Document type: History
Audience: Human reviewer, maintainer, documentation agent
Purpose: Preserve the retired area policy and migration plan verbatim as non-authority history
Design status: Candidate
Implementation: Historical record; not a live runtime or documentation policy
Provenance: Verbatim source snapshot from docs/architect/agent-coordination/documentation-standardization-plan.md
Writer type: Human + agent coauthor
Canonical for: Historical evidence only; no current authority
Use this when: Auditing the former area documentation policy or migration plan
Do not use this for: Current authority, current runtime behavior, or new migration instructions
Last reviewed: Not independently reviewed
Related:
- docs/platform/agent-coordination/README.md
- docs/platform/agent-coordination/history/documentation-migration/source-inventory.md
Supersedes: None; legacy source is unchanged
Superseded by: None
Added in candidate: Wrapper H1 and promotion metadata for the literal historical snapshot; not part of the retired source plan
```

Added in candidate: Retired area policy and migration plan, retained verbatim as non-authority history. The literal source snapshot below preserves original status fields and file-relative references as historical text, not active authority or navigation.

```text
# Agent Coordination Documentation Standardization Plan

```
```txt
Document type: Migration plan
Audience: Human reviewer, architect, maintainer, documentation agent
Purpose: Plan the migration of agent-coordination docs into the new platform documentation system without losing accepted intent, contracts, ADRs, or proof trees
Design status: Draft
Implementation: Complete; Phase 0-7 completed, with legacy proof artifacts retained as link-only evidence
Provenance: Created from documentation-system discussion and scan of existing agent-coordination docs
Writer type: Human + agent coauthor
Canonical for: Planning the agent-coordination documentation migration only
Use this when: Standardizing, migrating, or reviewing agent-coordination documentation
Do not use this for: Current runtime behavior, accepted architecture authority, or implementation truth
Last reviewed: 2026-09-18
Related:
- docs/doc-governance.md
- docs/platform/intent-preservation-ledger.md
- docs/platform/component-boundary.md
- docs/architect/agent-coordination/README.md
- docs/architect/agent-coordination/intent-preservation-ledger.md
```
```text

Agent Coordination is a critical foundation component. It is not a small docs
cleanup target. It covers multiple important subcomponents: coordination
session identity, flow definition, workflow/stage operation compatibility,
assignment/run/run-result, dispatch control, evidence and result evaluation,
visibility/Herdr, work integration, group-thinking protocols, runtime recovery,
and domain adoption.

The migration goal is to preserve and clarify this body of work, not simplify
it into a smaller idea.

Since this plan was first drafted, several adjacent and agent-coordination
tracks have changed the design surface: host-invocation-routing,
packaging-distribution, runtime-recovery, dispatch-operability,
executor-policy/dispatch seams, provider-capacity/account rotation,
code-implementation-track policy, test-suite feedback cost, and
cold-resumable coordination DAG scheduling. The migration must therefore be
source-first and code-verified: scan old docs/specs/history/plans first, then
verify current truth against code, tests, contracts, and proof files before
marking anything current.

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
| Source-first, code-verified | Scan legacy docs, old specs, architecture docs, history, proposals, and plan tracks before writing target docs; then verify implementation claims against current code/tests/proof. |
| Track-complete is not current-truth | A plan marked complete on a branch is only `track-complete` until the relevant code/docs/proof are visible in the current checkout or canonical target docs. |
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

### 4.6. Recent Plan, Code, And Cross-Area Sources

These sources were created or changed after the first documentation-system
rounds. They must be included in Phase 0 inventory. Do not migrate
agent-coordination from `docs/architect/agent-coordination/**` alone.

| Source | Current status | Must preserve | Target treatment |
|---|---|---|---|
| [../../../plans/260911-2305-runtime-recovery/](../../../plans/260911-2305-runtime-recovery/) | Track with implemented and unimplemented slices | Runtime recovery S0-S4 and session-recovery half of S5 are implemented; S5 transfer/import/budget/apply half, S6, S7, and writable partial-edit takeover are not implemented. | Split between architecture, contracts/status, verification, and history. |
| [../../../plans/260915-dispatch-operability-implementation/](../../../plans/260915-dispatch-operability-implementation/) | Track-complete on implementation branch; verify current checkout before claiming current | `agent-result-claim.v2`, effective execution contract persistence, `RunResult` v2, `RunObservation`, `dispatch.runtime.inspect`, CAS-guarded `dispatch.runtime.reconcile`, and negative-route proof that reconcile is not recovery. | Feed dispatch-control, assignment/run/runresult, evidence/results, verification, and operator how-to links. |
| [../../../plans/260915-executor-policy-dispatch-seams/](../../../plans/260915-executor-policy-dispatch-seams/) | Implemented/partial track with production behavior changes | Executor identity must be separated from execution policy; `PlacementPolicy` becomes provider/model/executor binder only after self-verifying proof; `readOnlyExecutorRedirects` remains a legacy pool source until fully retired. | Feed dispatch-control and executor-policy subcomponent rows; verify code before marking implemented. |
| [../../../plans/260916-account-rotator/](../../../plans/260916-account-rotator/) | Proposed implementation contract; slice status needs code verification | Provider Capacity Rotator is same-provider account/capacity rotation, not provider/model/executor selection; global/operator config only; no project-local account inventory. | Keep as proposal or accepted-not-implemented until code/proof confirms a shipped slice. |
| [../../../plans/260915-code-implementation-track-policy/](../../../plans/260915-code-implementation-track-policy/) | Done track affecting plan-loop/code-panel proof policy | Work-independent implementation tracks use targeted proof per cell plus full proof at gates; no `trackKind`/`executionPolicy` YAML; no policy validator; P05 became a real engine fix. | Feed playbooks, verification policy, and plan-loop operational docs. |
| [../../../plans/260915-0455-test-suite-feedback-cost/plan.md](../../../plans/260915-0455-test-suite-feedback-cost/plan.md) | High-risk proof-harness track, mostly complete with P05 deferred | Restores trustworthy cross-env tests and feedback-cost evidence; P05 related-test selector is deferred and must not be described as accepted/shipped. | Feed verification policy and history; do not promote deferred selector behavior. |
| [../../../plans/260917-cold-resumable-coordination-dag/plan.md](../../../plans/260917-cold-resumable-coordination-dag/plan.md) | Ready for implementation; design authority points to proposal | Cold-resumable DAG scheduling is read-only, immutable, and reconstructable from request plus session events; no mutation nodes, daemon, new lifecycle, or Work replacement. | Keep proposal/frontier until accepted and implemented proof exists. |
| [proposals/dag-request-scheduler.md](proposals/dag-request-scheduler.md) | Proposal/discussion/partial implementation; canonical for nothing | Candidate `dependsOn` operation DAG, scheduler reconstruction, existing Assignment/DispatchPlan/Run/RunResult path, and unresolved acceptance questions. | Keep in proposals and link from any DAG roadmap row. |
| [../../../plans/260915-host-invocation-r2-external-process/](../../../plans/260915-host-invocation-r2-external-process/) | Cross-area host-invocation rollout source | External-provider process routing affects agent-coordination only at dispatch/executor/provider boundaries. | Link to host-invocation-routing docs; do not duplicate host authority. |
| [../../platform/host-invocation-routing/README.md](../../platform/host-invocation-routing/README.md) | New platform area docs | Host invocation owns command routing, operation catalog, provider process protocol, release boundaries, and legacy CLI transition. | Agent-coordination consumes/link-only for host boundary claims. |
| [../../platform/packaging-distribution/README.md](../../platform/packaging-distribution/README.md) | New platform area docs | Packaging/distribution owns install, activation, release manifest, setup/doctor, and runtime identity. | Agent-coordination consumes/link-only for install/runtime activation claims. |

### 4.7. Code And Test Surfaces To Verify

Phase 0 must include a code/test scan for implementation truth. Minimum
surfaces:

| Surface | Why scan it |
|---|---|
| `src/runner/coordination/**` and `src/verbs/coordination/**` | CoordinationSession, FlowDefinition, protocol execution, continuation, and session recovery truth. |
| `src/runner/dispatch/**` and `src/verbs/dispatch/**` | Assignment, Run, RunResult, dispatch inspection, reconciliation, recovery, execution policy, placement, and worker evidence truth. |
| `src/runner/assignment*`, `src/runner/coordination/*recovery*`, `src/runner/dispatch/*recovery*` | Recovery and assignment/run boundaries often straddle module names. |
| `src/runner/provider*`, `src/runner/*placement*`, `src/runner/*capacity*`, `src/runner/executor*` | Provider capacity, account rotation, executor policy, and placement truth. |
| `src/cli/command-registry.mjs`, `bin/fgos.mjs`, `src/host/**`, `rust/**` where present | CLI/host doors prove which public operations are actually exposed. |
| `test/runner/**`, `test/verbs/**`, `test/cli/**`, `test/setup/**` | Proof of shipped behavior and known non-shipped gaps. |
| `docs/specs/**`, especially [../../../docs/specs/runner.md](../../../docs/specs/runner.md) | Existing state-layer facts that may still be canonical until replaced. |

## 5. Target Structure

Target shape:

```
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
```text

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
| Dispatch operability | [../../../plans/260915-dispatch-operability-implementation/](../../../plans/260915-dispatch-operability-implementation/), [contracts/assignment-run-runresult.md](contracts/assignment-run-runresult.md) | Preserve `agent-result-claim.v2`, effective execution contract, `RunResult` v2, `RunObservation`, inspect/reconcile boundaries, and negative-route proof. |
| Executor policy / placement | [../../../plans/260915-executor-policy-dispatch-seams/](../../../plans/260915-executor-policy-dispatch-seams/) | Preserve `PlacementPolicy` as provider/model/executor binder, not account rotator or lifecycle owner; verify shipped status in code. |
| Provider capacity / account rotation | [../../../plans/260916-account-rotator/](../../../plans/260916-account-rotator/) | Preserve as same-provider account/capacity concern; do not describe as cross-provider fallback or model selection. |
| Evidence and results | [architecture/evidence-and-results.md](architecture/evidence-and-results.md), ADR-005/006/007 | Preserve false-success and evidence integrity boundaries. |
| Track execution / code implementation policy | [../../../plans/260915-code-implementation-track-policy/](../../../plans/260915-code-implementation-track-policy/) | Preserve targeted proof per cell, full proof at gates, and plan-loop/code-panel operational constraints. |
| Verification feedback cost | [../../../plans/260915-0455-test-suite-feedback-cost/plan.md](../../../plans/260915-0455-test-suite-feedback-cost/plan.md) | Preserve proof-harness lessons while keeping P05 related-test selector deferred. |
| Work integration | [architecture/work-integration.md](architecture/work-integration.md), ADR-001/010 | Preserve Work as optional integration and sole lifecycle authority. |
| Visibility / Herdr | [architecture/visibility-and-herdr.md](architecture/visibility-and-herdr.md), ADR-005 | Keep visibility separate from truth/evidence. |
| Runtime recovery | [architecture/runtime-recovery-design.md](architecture/runtime-recovery-design.md) and related docs | Preserve proposal/accepted status accurately. |
| Launch reconciliation | [../../../plans/260911-2305-runtime-recovery/phase-designs/launch-reconciliation.md](../../../plans/260911-2305-runtime-recovery/phase-designs/launch-reconciliation.md), [verification/runtime-recovery/p02h-reopen.md](verification/runtime-recovery/p02h-reopen.md) | Preserve the implemented launcher-script mechanism and the warning that the earlier `herdr agent start ... -- <prepared-command>` shape is false. |
| Cold-resumable DAG scheduling | [proposals/dag-request-scheduler.md](proposals/dag-request-scheduler.md), [../../../plans/260917-cold-resumable-coordination-dag/plan.md](../../../plans/260917-cold-resumable-coordination-dag/plan.md) | Keep as proposal/frontier until accepted; preserve read-only immutable DAG limits and no-new-lifecycle constraint. |
| Group thinking and advisory panels | [architecture/group-thinking-trigger-surface.md](architecture/group-thinking-trigger-surface.md), [verification/architecture-advisory-panel/index.md](verification/architecture-advisory-panel/index.md) | Preserve protocol and proof status without hiding known gaps. |
| Host invocation boundary | [../../platform/host-invocation-routing/README.md](../../platform/host-invocation-routing/README.md), [../../../plans/260915-host-invocation-r2-external-process/](../../../plans/260915-host-invocation-r2-external-process/) | Link to host authority for command/provider process routing; agent-coordination owns only its dispatch/executor integration contract. |
| Packaging/distribution boundary | [../../platform/packaging-distribution/README.md](../../platform/packaging-distribution/README.md) | Link to install/runtime activation authority; do not duplicate distribution docs here. |

## 7. Migration Phases

### 7.1. Phase 0: Protect The Current Authority Graph

1. Read [../../doc-governance.md](../../doc-governance.md), [../../platform/intent-preservation-ledger.md](../../platform/intent-preservation-ledger.md), and [../../platform/component-boundary.md](../../platform/component-boundary.md).
2. Read all source groups in §4, including legacy docs, old specs, history,
   proposals, verification roots, and every listed plan track.
3. Scan current code and tests for every claim that may be marked
   `implemented`, `partial`, or `track-complete`.
4. Produce a source inventory with document type, authority, implementation
   state, target location, and disposition.
5. Identify docs that already satisfy the new documentation rules and should be
   moved with minimal rewrite.
6. Identify docs that require status notes because proposal/accepted/current
   boundaries are ambiguous.

Exit gate:

- No source group is unclassified.
- Every implemented/current claim has code, test, contract, or proof evidence
  in the current checkout; otherwise mark it `unknown`, `partial`, or
  `track-complete`.
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

```
```sh
pwd
git status --short
find docs/architect/agent-coordination -maxdepth 3 -type f | sort
find docs/architect/agent-coordination/verification -maxdepth 2 -type f | sort
find docs/specs -maxdepth 2 -type f | sort
find plans/260911-2305-runtime-recovery plans/260915-dispatch-operability-implementation plans/260915-executor-policy-dispatch-seams plans/260916-account-rotator plans/260915-code-implementation-track-policy plans/260915-0455-test-suite-feedback-cost plans/260917-cold-resumable-coordination-dag plans/260915-host-invocation-r2-external-process -maxdepth 2 -type f | sort
find docs/platform/host-invocation-routing docs/platform/packaging-distribution -maxdepth 3 -type f | sort
rg -n "agent-result-claim|RunResult v2|RunObservation|dispatch.runtime|PlacementPolicy|Provider Capacity Rotator|account rotator|cold-resumable|DAG|runtime recovery|RunHandle|test-suite feedback|related-test selector" docs/specs docs/architect/agent-coordination docs/platform/host-invocation-routing docs/platform/packaging-distribution plans src test
```
```text

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
13. Every source listed in §4.6.

Before any claim is marked `implemented` or `partial`, run a focused code/test
scan for that claim. At minimum, inspect the relevant files under
`src/runner/coordination/**`, `src/verbs/coordination/**`,
`src/runner/dispatch/**`, `src/verbs/dispatch/**`, `src/cli/**`, `bin/`,
`test/runner/**`, `test/verbs/**`, and `test/cli/**`. If the code/proof is only
mentioned in a plan branch or closeout report but is not visible in the current
checkout, record `track-complete / needs current-checkout verification`.

### 9.2. Phase 0 Deliverables

Create these files first under a migration working directory:

```
```txt
docs/platform/agent-coordination/history/documentation-migration/
  source-inventory.md
  claim-preservation.md
  proof-preservation.md
  proposal-status.md
```
```text

These files are temporary migration aids. They may later be drained into
canonical docs or retained as history.

`source-inventory.md` must use this table:

| Source path | Existing type | Authority | Implementation status | Target path | Disposition | Notes |
|---|---|---|---|---|---|---|
| `docs/architect/agent-coordination/...` / `docs/specs/...` / `plans/...` / `src/...` / `test/...` | vision / spec / contract / architecture / proposal / verification / playbook / history / plan / code / test | accepted / proposed / evidence / operational / non-canonical / implementation truth | implemented / partial / accepted-not-implemented / proposed / track-complete / unknown / N/A | `docs/platform/agent-coordination/...` | promote / split / keep-legacy-current / link-only / archive / redirect / needs-human / evidence-only |  |

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
| `evidence-only` | Code/test/proof file is not migrated, but is cited as evidence for a target claim. |

`source-inventory.md` must include rows for:

- every file under `docs/architect/agent-coordination/**` that is not generated
  noise;
- relevant legacy state-layer files under `docs/specs/**`, especially
  `docs/specs/runner.md`;
- every plan/source listed in §4.6;
- target docs under `docs/platform/host-invocation-routing/**` and
  `docs/platform/packaging-distribution/**` that define cross-area authority;
- code/test evidence files for each implemented/partial claim.

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
- `agent-result-claim.v2` is a worker claim contract, not normalized proof.
- Effective execution contract is persisted pre-launch and must stay
  inspectable where implemented.
- `RunResult` v2 is immutable terminal Run truth; `RunObservation` is mutable
  read-only projection and never settles a Run.
- `dispatch.runtime.inspect` is read-only.
- `dispatch.runtime.reconcile` is limited to guard/projection repair and must
  not kill, signal, retry, relaunch, resume, reattach, reassign, admit, cancel,
  or take over execution.
- Executor identity is not execution policy.
- `PlacementPolicy` owns provider/model/executor ranking/binding only where the
  self-verifying production binder has shipped; it does not own same-provider
  account rotation or lifecycle settlement.
- Provider Capacity Rotator, if present, is same-provider account/capacity
  rotation with global/operator config; it is not cross-provider fallback and
  not project-local credential inventory.
- Work-independent code implementation tracks use targeted proof per cell and
  full proof at gates; no `trackKind`/`executionPolicy` YAML or policy
  validator was accepted by the policy track.
- Test feedback/cost work improved proof trust and feedback cost; P05
  related-test selector remains deferred and must not be described as shipped.
- Cold-resumable coordination DAG scheduling is read-only proposal/frontier
  work unless code/proof says otherwise; it must not add mutation nodes, daemon,
  new lifecycle authority, or Work replacement.
- Host-invocation-routing owns host command/provider process routing; this area
  owns only the coordination/dispatch integration boundary.
- Packaging-distribution owns installation, activation, release manifest, and
  setup/doctor/runtime identity; this area links to it instead of duplicating
  that authority.

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

Required recent-track proof/source rows:

| Proof or source root | Must preserve |
|---|---|
| `docs/architect/agent-coordination/verification/dispatch-operability-implementation/I01.md` | `agent-result-claim.v2` prompt/validation contract proof. |
| `docs/architect/agent-coordination/verification/dispatch-operability-implementation/I02.md` | Effective execution contract persisted pre-launch and inspectable. |
| `docs/architect/agent-coordination/verification/dispatch-operability-implementation/I03.md` | `RunResult` v2, legacy-v1 interpretation, and attribution dimensions; preserve documented residuals. |
| `docs/architect/agent-coordination/verification/dispatch-operability-implementation/I04.md` | `dispatch.runtime.inspect` read model and public CLI projection; preserve deferred label-consistency residual. |
| `docs/architect/agent-coordination/verification/dispatch-operability-implementation/I05.md` | `dispatch.runtime.reconcile` CAS guard/projection repair; preserve negative-route and residual findings. |
| `plans/260915-dispatch-operability-implementation/reports/track-closeout.md` | Production-door proof summary, full-suite result, and deferred non-capabilities. |
| `docs/architect/agent-coordination/verification/executor-policy-dispatch-seams/p00.md` | Existing executor-policy verification root; inventory must find whether later phase proof lives in plans/reports/code/tests. |
| `plans/260915-executor-policy-dispatch-seams/plan.md` | Phase status for `PlacementPolicy`, self-verifying production binder, and redirect retirement status. |
| `plans/260916-account-rotator/design.md` and `plans/260916-account-rotator/plan.md` | Provider Capacity Rotator design and proposed implementation contract; preserve same-provider/global-config limits. |
| `docs/architect/agent-coordination/verification/code-implementation-track-policy/p01.md` through `p05.md` | Proof policy implementation track evidence and known gaps. |
| `plans/260915-code-implementation-track-policy/reports/track-closeout.md` | Final policy-track closeout and proof status. |
| `plans/260915-0455-test-suite-feedback-cost/decision-lock.md` and `phase-08-evidence-decision-and-handoff.md` | Decisions and handoff for test-suite feedback cost; preserve P05 deferred status. |
| `plans/260917-cold-resumable-coordination-dag/plan.md` | DAG implementation plan and non-goals; not accepted runtime truth by itself. |
| `docs/architect/agent-coordination/proposals/dag-request-scheduler.md` | Proposal authority for DAG shape; canonical for nothing until accepted. |

`proposal-status.md` must use this table:

| Proposal / frontier source | Topic | Current status | Accepted pieces | Deferred / rejected pieces | Target treatment |
|---|---|---|---|---|---|
|  |  | proposed / partially-accepted / superseded / unknown |  |  | keep-proposal / split-accepted / archive / needs-human |

### 9.3. Target Tree Decision

Use this exact initial target tree for Phase 1:

```
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
```text

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
| Dispatch Operability | RunResult v2, RunObservation, inspect/reconcile, worker result claim attribution | `plans/260915-dispatch-operability-implementation/`, `verification/dispatch-operability-implementation/` | likely under `subcomponents/dispatch-control/` or `subcomponents/assignment-run-result/` after inventory | track-complete / verify current checkout |
| Executor Policy / Placement | Provider/model/executor selection and self-verifying production binder | `plans/260915-executor-policy-dispatch-seams/` | likely `subcomponents/dispatch-control/placement-policy/` only if inventory proves enough local mass | implemented / partial / verify current checkout |
| Provider Capacity Rotator | Same-provider account/capacity rotation and refusal facts | `plans/260916-account-rotator/` | likely proposal row under dispatch-control unless shipped code proves a component | proposed / verify |
| Evidence And Results | Confidence, false-success, proof boundary | `architecture/evidence-and-results.md`, ADR-005/006/007 | likely `subcomponents/evidence-results/` | accepted / partial |
| Code Implementation Track Policy | Proof policy for work-independent implementation tracks | `plans/260915-code-implementation-track-policy/`, `verification/code-implementation-track-policy/` | likely playbook/verification policy, not runtime subcomponent | done / operational |
| Test Feedback Cost | Test/proof harness reliability and feedback-cost decisions | `plans/260915-0455-test-suite-feedback-cost/` | likely verification/history, not runtime subcomponent | partial; P05 deferred |
| Work Integration | Work-attached coordination without second lifecycle authority | `architecture/work-integration.md`, ADR-001/010 | decide after inventory | accepted / partial |
| Visibility / Herdr | Visibility-only boundary | `architecture/visibility-and-herdr.md`, ADR-005 | decide after inventory | accepted / partial |
| Runtime Recovery | RunHandle, continuation/recovery, fallback, health | runtime recovery architecture docs | likely `subcomponents/runtime-recovery/` only if status is clear | proposed / partial / unknown |
| Launch Reconciliation | Herdr/cli spawn launch reconciliation and confinement authority handoff | runtime recovery phase designs and P02H verification | likely under `subcomponents/runtime-recovery/` | substantially implemented with residual gap |
| Cold-Resumable DAG Scheduler | Read-only DAG scheduling of protocol operation nodes | `proposals/dag-request-scheduler.md`, `plans/260917-cold-resumable-coordination-dag/` | proposal row only until accepted/implemented | proposed / ready for implementation |
| Group Thinking | Group-thinking protocols, advisory panels, cohort planning | group-thinking docs and verification | likely `subcomponents/group-thinking/` | implemented mechanism / quality proof mixed |
| Host Boundary | Host invocation and provider process ownership consumed by coordination | `docs/platform/host-invocation-routing/` | link-only cross-area boundary | external authority |
| Packaging Boundary | Install, activation, release manifest, setup/doctor consumed by runtime docs | `docs/platform/packaging-distribution/` | link-only cross-area boundary | external authority |

### 9.5. Phase 1 Files To Create

After Phase 0 tables exist, create only these target files:

```
```txt
docs/platform/agent-coordination/README.md
docs/platform/agent-coordination/vision.md
docs/platform/agent-coordination/intent-preservation-ledger.md
docs/platform/agent-coordination/subcomponents/README.md
docs/platform/agent-coordination/history/README.md
```
```text

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

```
```txt
docs/platform/agent-coordination/spec.md
docs/platform/agent-coordination/verification/implementation-alignment.md
```
```text

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

```
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
```text

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

For dispatch-operability, do not rely on the plan closeout alone. Verify
whether the current checkout contains the relevant code/tests before writing
`implemented` into target docs. If current checkout verification passes, promote
the accepted pieces into `assignment-run-runresult`, `dispatch-control`, and
`evidence-and-results` docs with proof links. If not, mark them
`track-complete / needs current-checkout verification`.

For executor-policy/dispatch seams, preserve the separation between executor
identity, execution policy, placement policy, and provider capacity. Do not
collapse `PlacementPolicy` and Provider Capacity Rotator into one concept.

For cold-resumable DAG scheduling, keep the proposal visible but non-canonical
until an acceptance decision and implementation proof exist. The migration may
add an architecture roadmap row, but it must not rewrite the proposal as
current runtime behavior.

### 9.8. Phase 4 Files To Create Or Promote

Create target contract and decision indexes first:

```
```txt
docs/platform/agent-coordination/contracts/README.md
docs/platform/agent-coordination/decisions/README.md
```
```text

Then promote accepted contract docs and ADRs one by one. Keep original IDs and
titles. Do not combine ADRs.

### 9.9. Phase 5 Files To Create Or Promote

Create:

```
```txt
docs/platform/agent-coordination/verification/README.md
```
```text

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

```
```md
> Migration status: This document is a legacy/current source for
> `docs/platform/agent-coordination/<target>`. Do not edit divergent design
> claims here without also updating the target doc or migration inventory.
```
```text

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
- a plan says a track is complete, but the current checkout does not visibly
  contain the code/docs/proof needed to support the target claim;
- legacy docs/specs/history/plans disagree with current code and no ADR,
  contract, or proof root explains the supersession.

### 9.13. Validation Commands

After each phase, run:

```
```sh
rg -n '^# [0-9]+\\.' docs/platform/agent-coordination docs/architect/agent-coordination/documentation-standardization-plan.md
```
```text

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
13. Were legacy docs, old specs, history, proposals, and relevant plans scanned
    before target docs were written?
14. Were implemented/partial claims verified against current code, tests,
    contracts, or proof roots?
15. Are track-complete branch claims distinguished from current-checkout truth?

## 11. Open Questions

| Question | Needed before |
|---|---|
| Should all proof artifact directories move physically, or should target docs link back to legacy proof roots during migration? | Phase 5. |
| Should `documentation-governance.md` remain as an area-local policy after global governance exists? | Phase 1. |
| Which runtime recovery docs are accepted architecture versus proposed detailed design? | Phase 3. |
| Should vocabulary remain inside this area or move to a platform-wide vocabulary later? | Phase 4. |
| What exact target path should host/dispatch overlap use to avoid duplicate authority? | Phase 3. |
| Does dispatch-operability code/proof from the implementation branch exist in the current checkout, or must target docs mark it `track-complete / needs current-checkout verification`? | Phase 2 and Phase 3. |
| Should `dispatch.runtime.inspect` / `dispatch.runtime.reconcile` live under dispatch-control, assignment-run-result, or a dedicated dispatch-operability subcomponent? | Phase 3. |
| Does Provider Capacity Rotator belong as an agent-coordination subcomponent, a dispatch-control child, or a cross-area provider/runtime concern? | Phase 0 and Phase 3. |
| Has cold-resumable DAG scheduling been accepted by ADR, or is it still proposal/frontier only? | Phase 3. |
| Should code-implementation-track policy be documented under agent-coordination playbooks, verification policy, coding-domain docs, or all three with one canonical owner? | Phase 6. |
| How should test-suite feedback-cost decisions be linked from verification docs without turning deferred related-test selection into accepted behavior? | Phase 5. |
| Are host-invocation-routing and packaging-distribution already canonical enough that agent-coordination should only consume them by link, or are bridge contracts still needed? | Phase 3 and Phase 4. |

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
| runtime recovery plan source | [../../../plans/260911-2305-runtime-recovery/](../../../plans/260911-2305-runtime-recovery/) |
| dispatch operability plan source | [../../../plans/260915-dispatch-operability-implementation/](../../../plans/260915-dispatch-operability-implementation/) |
| executor policy dispatch seams source | [../../../plans/260915-executor-policy-dispatch-seams/](../../../plans/260915-executor-policy-dispatch-seams/) |
| provider capacity/account rotator source | [../../../plans/260916-account-rotator/](../../../plans/260916-account-rotator/) |
| code implementation track policy source | [../../../plans/260915-code-implementation-track-policy/](../../../plans/260915-code-implementation-track-policy/) |
| test-suite feedback cost source | [../../../plans/260915-0455-test-suite-feedback-cost/plan.md](../../../plans/260915-0455-test-suite-feedback-cost/plan.md) |
| cold-resumable DAG source | [../../../plans/260917-cold-resumable-coordination-dag/plan.md](../../../plans/260917-cold-resumable-coordination-dag/plan.md) |
| DAG scheduler proposal | [proposals/dag-request-scheduler.md](proposals/dag-request-scheduler.md) |
| host-invocation-routing authority | [../../platform/host-invocation-routing/README.md](../../platform/host-invocation-routing/README.md) |
| packaging-distribution authority | [../../platform/packaging-distribution/README.md](../../platform/packaging-distribution/README.md) |
```
````

### docs/platform/agent-coordination/history/documentation-migration/documentation-standardization-plan.md#unheaded-block-1

````text
```txt
Document type: History
Audience: Human reviewer, maintainer, documentation agent
Purpose: Preserve the retired area policy and migration plan verbatim as non-authority history
Design status: Candidate
Implementation: Historical record; not a live runtime or documentation policy
Provenance: Verbatim source snapshot from docs/architect/agent-coordination/documentation-standardization-plan.md
Writer type: Human + agent coauthor
Canonical for: Historical evidence only; no current authority
Use this when: Auditing the former area documentation policy or migration plan
Do not use this for: Current authority, current runtime behavior, or new migration instructions
Last reviewed: Not independently reviewed
Related:
- docs/platform/agent-coordination/README.md
- docs/platform/agent-coordination/history/documentation-migration/source-inventory.md
Supersedes: None; legacy source is unchanged
Superseded by: None
Added in candidate: Wrapper H1 and promotion metadata for the literal historical snapshot; not part of the retired source plan
```
````

### docs/platform/agent-coordination/history/documentation-migration/documentation-standardization-plan.md#unheaded-block-2

```text
Added in candidate: Retired area policy and migration plan, retained verbatim as non-authority history. The literal source snapshot below preserves original status fields and file-relative references as historical text, not active authority or navigation.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#step-01---team-dispatch-v1-rollout

````text
# Step 01 - Team Dispatch V1 Rollout

```txt
Document type: Roadmap
Audience: Human reviewers, maintainers, documentation agents
Purpose: Preserve source material for Step 01 - Team Dispatch V1 Rollout
Design status: Candidate
Implementation: Not re-verified; source implementation statements remain in the body
Provenance: Retained from docs/architect/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md at fcfe78cb89585bc9ab23f11bab67d41458834fc4
Writer type: Documentation maintainer
Canonical for: Preserved roadmap material for Step 01 - Team Dispatch V1 Rollout; no authority cutover
Use this when: Comparing this candidate with its pinned legacy source
Do not use this for: Inferring current implementation or supersession of retained sources
Last reviewed: UNPROVEN; independent content review pending
Related:
- None
Supersedes: None; retained source authority is unchanged
Superseded by: None
Added in candidate: Promotion metadata only; source claims and implementation are not re-decided here
```
Document type: Roadmap
Design status: Superseded
Superseded by: `../../architecture/` and `../../contracts/`
Implementation: Implemented
Last reviewed: 2026-08-31
Canonical for: implementation sequence only
Original date: 2026-08-27
Scope: safe sequence for moving from current coding workflow to operation-based team dispatch
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-1

````text
```txt
Document type: Roadmap
Audience: Human reviewers, maintainers, documentation agents
Purpose: Preserve source material for Step 01 - Team Dispatch V1 Rollout
Design status: Candidate
Implementation: Not re-verified; source implementation statements remain in the body
Provenance: Retained from docs/architect/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md at fcfe78cb89585bc9ab23f11bab67d41458834fc4
Writer type: Documentation maintainer
Canonical for: Preserved roadmap material for Step 01 - Team Dispatch V1 Rollout; no authority cutover
Use this when: Comparing this candidate with its pinned legacy source
Do not use this for: Inferring current implementation or supersession of retained sources
Last reviewed: UNPROVEN; independent content review pending
Related:
- None
Supersedes: None; retained source authority is unchanged
Superseded by: None
Added in candidate: Promotion metadata only; source claims and implementation are not re-decided here
```
Document type: Roadmap
Design status: Superseded
Superseded by: `../../architecture/` and `../../contracts/`
Implementation: Implemented
Last reviewed: 2026-08-31
Canonical for: implementation sequence only
Original date: 2026-08-27
Scope: safe sequence for moving from current coding workflow to operation-based team dispatch
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#1-purpose

````text
## 1. Purpose

Step 00 defines the V1 architecture target:

```txt
Work
Flow operations
Assignment
Run
RunResult
```

This document turns that target into independently reviewable work slices.
Each slice must preserve the current primary path until the next layer has
tests and rollback instructions.

The rollout rule is:

```txt
Declare -> validate -> read -> assign -> policy -> dispatch -> evidence -> drive -> orchestrate
```

The first implementation slice should make operations visible and validated.
It must not make the driver choose operations, run assignments, add Herdr
visibility, create mission lifecycle, or introduce a queue/scheduler.
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-2

```text
Step 00 defines the V1 architecture target:
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-3

````text
```txt
Work
Flow operations
Assignment
Run
RunResult
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-4

```text
This document turns that target into independently reviewable work slices.
Each slice must preserve the current primary path until the next layer has
tests and rollback instructions.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-5

````text
The rollout rule is:

```txt
Declare -> validate -> read -> assign -> policy -> dispatch -> evidence -> drive -> orchestrate
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-6

```text
The first implementation slice should make operations visible and validated.
It must not make the driver choose operations, run assignments, add Herdr
visibility, create mission lifecycle, or introduce a queue/scheduler.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#2-current-starting-point

````text
## 2. Current Starting Point

The current codebase already has these surfaces:

- `domains/coding/workflows/feature.yaml` declares the coding feature workflow.
- `domains/coding/registry.yaml` declares the coding `roleGraph` roles, legal
  call edges, stage labels, and workflow selection.
- `domains/coding/task-specs/*.md` already defines task-shaped contracts for
  discovery, exploring, planning, executing, review, consult, assist, and fix
  work.
- Some task-spec prose still distinguishes function from roleGraph holder.
  Before runtime dispatch, operation `role` must be reconciled with each
  task-spec's execution contract.
- `domains/coding/skills/fgos-coding-driving/SKILL.md` is the mechanical loop
  that resolves the current position to one stage skill, invokes it, and
  re-reads state.
- `domains/coding/skills/fgos-coding-discovering/SKILL.md` already proves a
  machine-alone consult loop: discovery can call `fgos-researching`, log
  `handoff --reason consult`, and then apply `clear` or `unclear` without
  asking the human directly.
- `src/state/workflow-stage-graphs.mjs` normalizes workflow YAML into stage,
  step, transition, skill, taskSpec, and operation lookup data.
- `src/setup/registrations.mjs` owns setup/doctor validation for registry,
  task-spec, agent-type, and operation drift.
- `src/runner/dispatch/*.mjs` owns dispatch config, executor resolution,
  mechanism choice, prompt preparation, transport adapters, DispatchPlan, and
  current result normalization.
- `src/runner/loop.mjs` remains the single-work runner path and must keep its
  current work lifecycle semantics.
- `src/state/stage-fsm.mjs`, `src/state/status-fsm.mjs`, `src/state/handoff.mjs`,
  and `src/state/runtime-coordination.mjs` own stage transitions, status
  transitions, role-call legality, and runtime claims.

The narrow gap is:

```txt
Current: stage -> one skill + one taskSpec
Needed:  stage -> primary operation + optional operation set
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-7

```text
The current codebase already has these surfaces:
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-8

```text
- `domains/coding/workflows/feature.yaml` declares the coding feature workflow.
- `domains/coding/registry.yaml` declares the coding `roleGraph` roles, legal
  call edges, stage labels, and workflow selection.
- `domains/coding/task-specs/*.md` already defines task-shaped contracts for
  discovery, exploring, planning, executing, review, consult, assist, and fix
  work.
- Some task-spec prose still distinguishes function from roleGraph holder.
  Before runtime dispatch, operation `role` must be reconciled with each
  task-spec's execution contract.
- `domains/coding/skills/fgos-coding-driving/SKILL.md` is the mechanical loop
  that resolves the current position to one stage skill, invokes it, and
  re-reads state.
- `domains/coding/skills/fgos-coding-discovering/SKILL.md` already proves a
  machine-alone consult loop: discovery can call `fgos-researching`, log
  `handoff --reason consult`, and then apply `clear` or `unclear` without
  asking the human directly.
- `src/state/workflow-stage-graphs.mjs` normalizes workflow YAML into stage,
  step, transition, skill, taskSpec, and operation lookup data.
- `src/setup/registrations.mjs` owns setup/doctor validation for registry,
  task-spec, agent-type, and operation drift.
- `src/runner/dispatch/*.mjs` owns dispatch config, executor resolution,
  mechanism choice, prompt preparation, transport adapters, DispatchPlan, and
  current result normalization.
- `src/runner/loop.mjs` remains the single-work runner path and must keep its
  current work lifecycle semantics.
- `src/state/stage-fsm.mjs`, `src/state/status-fsm.mjs`, `src/state/handoff.mjs`,
  and `src/state/runtime-coordination.mjs` own stage transitions, status
  transitions, role-call legality, and runtime claims.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-9

````text
The narrow gap is:

```txt
Current: stage -> one skill + one taskSpec
Needed:  stage -> primary operation + optional operation set
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#3-vocabulary-and-boundary-rules

````text
## 3. Vocabulary And Boundary Rules

Use these terms consistently:

- `Work` is the lifecycle authority.
- `Assignment` is the semantic request to one role/executor/tool.
- `Run` is one runtime attempt to execute an assignment.
- `RunResult` is the normalized result and evidence from a run.
- `Job` is reserved for a future queue/scheduler design. Do not use it for V1
  objects, ids, files, tests, or examples.
- Discovery is machine-alone. It may consult machine helpers for facts and
  evidence. It must not ask the human directly; unresolved product ambiguity
  routes to exploring.

Keep these separations intact:

```txt
Work != Assignment
Stage != Operation
Role != Executor
Dispatch != RunResult
Visibility != Evidence
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-10

```text
Use these terms consistently:
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-11

```text
- `Work` is the lifecycle authority.
- `Assignment` is the semantic request to one role/executor/tool.
- `Run` is one runtime attempt to execute an assignment.
- `RunResult` is the normalized result and evidence from a run.
- `Job` is reserved for a future queue/scheduler design. Do not use it for V1
  objects, ids, files, tests, or examples.
- Discovery is machine-alone. It may consult machine helpers for facts and
  evidence. It must not ask the human directly; unresolved product ambiguity
  routes to exploring.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-12

```text
Keep these separations intact:
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-13

````text
```txt
Work != Assignment
Stage != Operation
Role != Executor
Dispatch != RunResult
Visibility != Evidence
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#4-dependency-order

```text
## 4. Dependency Order

The dependency order is strict unless an implementation plan explicitly proves
a slice can be split further:

1. Slice 1: preserve and validate operation metadata.
2. Slice 2: expose operations read-only.
3. Slice 3: build Assignment from one selected operation.
4. Slice 3a: resolve effective assignment dispatch policy.
5. Slice 4: execute one non-mutating assignment through existing cli-spawn.
6. Slice 5: write Run and RunResult evidence.
7. Slice 6: let the coding driver choose declared/legal operations.
8. Slice 7: coordinate multiple items or assignments above the driver.

Post-merge hardening continues the same dependency chain:

9. Step 04: harden Assignment RunResult evidence before any driver consumes it.
10. Step 05: wire coding driver operation choice for the smallest safe
    secondary operation path.
11. Step 06: adopt Work-attached team dispatch on real planning/executing
    scenarios.
12. Step 07: make the coordination operating harness durable and reusable.
13. Step 08: try mission-lite read-only brainstorming/debate after Work-attached
    evidence and coordination discipline are stable.

Do not start Slice 4 before Slice 3a has a minimal policy resolver. Do not
start Slice 6 before Slice 5 can distinguish `reported`, `verified`,
`inferred`, `no-evidence`, and `failed`.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-14

```text
The dependency order is strict unless an implementation plan explicitly proves
a slice can be split further:
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-15

```text
1. Slice 1: preserve and validate operation metadata.
2. Slice 2: expose operations read-only.
3. Slice 3: build Assignment from one selected operation.
4. Slice 3a: resolve effective assignment dispatch policy.
5. Slice 4: execute one non-mutating assignment through existing cli-spawn.
6. Slice 5: write Run and RunResult evidence.
7. Slice 6: let the coding driver choose declared/legal operations.
8. Slice 7: coordinate multiple items or assignments above the driver.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-16

```text
Post-merge hardening continues the same dependency chain:
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-17

```text
9. Step 04: harden Assignment RunResult evidence before any driver consumes it.
10. Step 05: wire coding driver operation choice for the smallest safe
    secondary operation path.
11. Step 06: adopt Work-attached team dispatch on real planning/executing
    scenarios.
12. Step 07: make the coordination operating harness durable and reusable.
13. Step 08: try mission-lite read-only brainstorming/debate after Work-attached
    evidence and coordination discipline are stable.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-18

```text
Do not start Slice 4 before Slice 3a has a minimal policy resolver. Do not
start Slice 6 before Slice 5 can distinguish `reported`, `verified`,
`inferred`, `no-evidence`, and `failed`.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#5-surface-ownership

```text
## 5. Surface Ownership

| Slice | Purpose | Code/config surfaces | Doc/skill surfaces | Runtime impact |
|---|---|---|---|---|
| 1 | operation registry only | `domains/coding/workflows/feature.yaml`, `src/state/workflow-stage-graphs.mjs`, `src/setup/registrations.mjs`, normalization/setup tests | Step 02 | none |
| 2 | read-only operation surface | optional CLI/report facade, `operationsForStage()` callers, tests | optional CLI docs | none |
| 3 | Assignment builder | new small assignment module under `src/runner/dispatch/` or `src/runner/team/`, prompt tests | Step 03 | none unless explicitly paired with Slice 4 |
| 3a | policy resolver | dispatch policy helper, runner config readers, resolver tests | policy notes in Step 03 | no new transport |
| 4 | cli-spawn assignment execution | `src/runner/dispatch/cli.mjs`, `prepare.mjs`, `resolve.mjs`, `plan.mjs`, `transport.mjs`, fake executor tests | none required | one non-mutating assignment can run |
| 5 | RunResult evidence | assignment storage writer, result classifier, dispatch result bridge, filesystem tests | Step 03 | writes `.fgos/assignments/` |
| 6 | driver operation choice | `fgos-coding-driving`, stage skills, `src/state/handoff.mjs` guard use, loop tests | driver/stage skill guidance | driver may dispatch legal operations |
| 7 | team orchestration | orchestrator/launcher strategy layer, runner selection tests | strategy guidance | multiple assignments/items coordinated |
| 8 | evidence hardening | assignment prompt, RunResult classifier, dirty-before/after snapshots, result schema tests | Step 04, Team Communication Protocol V1 | makes Assignment results safe for driver consumption |
| 9 | coding driver adoption | operation-choice helper, planning validate-plan wiring, loop tests, skill prose | Step 05 | one secondary operation can run inside Work lifecycle |
| 10 | live Work-attached adoption | real planning/executing scenarios, fake+live executor tests, adoption notes | Step 06 | real Work uses Team Dispatch without changing lifecycle authority |
| 11 | coordination harness | trace/current-cell contracts, prompt templates, review/red-team gates, proof capture | Step 07 | multi-agent implementation can run without context bloat or lost proof |
| 12 | mission-lite experiment | read-only mission envelope, thread/results storage, synthesis report tests | Step 08 | non-Work team debate/brainstorm, no mutation |
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-19

```text
| Slice | Purpose | Code/config surfaces | Doc/skill surfaces | Runtime impact |
|---|---|---|---|---|
| 1 | operation registry only | `domains/coding/workflows/feature.yaml`, `src/state/workflow-stage-graphs.mjs`, `src/setup/registrations.mjs`, normalization/setup tests | Step 02 | none |
| 2 | read-only operation surface | optional CLI/report facade, `operationsForStage()` callers, tests | optional CLI docs | none |
| 3 | Assignment builder | new small assignment module under `src/runner/dispatch/` or `src/runner/team/`, prompt tests | Step 03 | none unless explicitly paired with Slice 4 |
| 3a | policy resolver | dispatch policy helper, runner config readers, resolver tests | policy notes in Step 03 | no new transport |
| 4 | cli-spawn assignment execution | `src/runner/dispatch/cli.mjs`, `prepare.mjs`, `resolve.mjs`, `plan.mjs`, `transport.mjs`, fake executor tests | none required | one non-mutating assignment can run |
| 5 | RunResult evidence | assignment storage writer, result classifier, dispatch result bridge, filesystem tests | Step 03 | writes `.fgos/assignments/` |
| 6 | driver operation choice | `fgos-coding-driving`, stage skills, `src/state/handoff.mjs` guard use, loop tests | driver/stage skill guidance | driver may dispatch legal operations |
| 7 | team orchestration | orchestrator/launcher strategy layer, runner selection tests | strategy guidance | multiple assignments/items coordinated |
| 8 | evidence hardening | assignment prompt, RunResult classifier, dirty-before/after snapshots, result schema tests | Step 04, Team Communication Protocol V1 | makes Assignment results safe for driver consumption |
| 9 | coding driver adoption | operation-choice helper, planning validate-plan wiring, loop tests, skill prose | Step 05 | one secondary operation can run inside Work lifecycle |
| 10 | live Work-attached adoption | real planning/executing scenarios, fake+live executor tests, adoption notes | Step 06 | real Work uses Team Dispatch without changing lifecycle authority |
| 11 | coordination harness | trace/current-cell contracts, prompt templates, review/red-team gates, proof capture | Step 07 | multi-agent implementation can run without context bloat or lost proof |
| 12 | mission-lite experiment | read-only mission envelope, thread/results storage, synthesis report tests | Step 08 | non-Work team debate/brainstorm, no mutation |
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#6-slice-1---operation-registry-only

````text
## 6. Slice 1 - Operation Registry Only

Purpose: add operation metadata and validation without changing runtime
behavior.

Exact code/config surfaces:

- `domains/coding/workflows/feature.yaml`
  - Add `operations` under `discovery`, `exploring`, `planning`, and
    `executing`.
  - Mark the current `skill`/`taskSpec` pair as `primary: true`.
  - Leave `decompose` compatibility/drain-only unless a later decision gives it
    explicit operations.
- `src/state/workflow-stage-graphs.mjs`
  - Preserve `stage.operations`.
  - Produce `operationMap`.
  - Freeze operation arrays, operation objects, nested `skills`, and nested
    policy arrays.
  - Add or keep `operationsForStage(domain, stage, { kind })`.
  - Keep `skillMap`, `taskSpecMap`, `bundleForStage()`, and `skillForStage()`
    compatible.
- `src/setup/registrations.mjs`
  - Validate operation task-specs, roles, skills, reasons, duplicate primary
    operations, dispatch mode, policy vocabulary, and primary-operation
    contradictions.
- Tests:
  - `test/state/workflow-stage-graphs.test.mjs`
  - `test/setup/registrations.test.mjs`
  - setup/doctor coverage that checks the registered validation hook.

Must not change:

- No driver behavior change.
- No executor/provider routing change.
- No assignment files.
- No `.fgos/assignments/` writes.
- No Herdr use.
- No mission/thread/mailbox.
- No stage/status FSM edge changes.
- No child work creation.

Verification commands:

```bash
node --test test/state/workflow-stage-graphs.test.mjs
node --test test/setup/registrations.test.mjs
node --test test/runner/dispatch.test.mjs
```

Useful manual checks:

```bash
node -e "import('./src/state/workflow-stage-graphs.mjs').then(({operationsForStage}) => console.log(operationsForStage('coding','planning').map(o => o.id)))"
node -e "import('./src/state/workflow-stage-graphs.mjs').then(({bundleForStage}) => console.log(bundleForStage('coding','planning')))"
```

Rollback strategy:

- Revert only the `operations` entries in `feature.yaml`, the
  `operationMap`/`operationsForStage()` additions, and the operation validation
  tests.
- Since no runtime behavior may depend on operations in this slice, rollback
  should restore the previous one-stage/one-skill path without data migration.

Done criteria:

```txt
bundleForStage(coding, planning) still returns fgos-coding-planning / shape-plan.
operationsForStage(coding, planning) exposes shape-plan, validate-plan, scout-blast-radius, resolve-question.
Bad operation config fails setup/doctor validation.
Human-only operations are visible but not dispatchable through cli-spawn.
No dispatch/driver test changes are required except compatibility assertions.
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-20

```text
Purpose: add operation metadata and validation without changing runtime
behavior.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-21

```text
Exact code/config surfaces:
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-22

```text
- `domains/coding/workflows/feature.yaml`
  - Add `operations` under `discovery`, `exploring`, `planning`, and
    `executing`.
  - Mark the current `skill`/`taskSpec` pair as `primary: true`.
  - Leave `decompose` compatibility/drain-only unless a later decision gives it
    explicit operations.
- `src/state/workflow-stage-graphs.mjs`
  - Preserve `stage.operations`.
  - Produce `operationMap`.
  - Freeze operation arrays, operation objects, nested `skills`, and nested
    policy arrays.
  - Add or keep `operationsForStage(domain, stage, { kind })`.
  - Keep `skillMap`, `taskSpecMap`, `bundleForStage()`, and `skillForStage()`
    compatible.
- `src/setup/registrations.mjs`
  - Validate operation task-specs, roles, skills, reasons, duplicate primary
    operations, dispatch mode, policy vocabulary, and primary-operation
    contradictions.
- Tests:
  - `test/state/workflow-stage-graphs.test.mjs`
  - `test/setup/registrations.test.mjs`
  - setup/doctor coverage that checks the registered validation hook.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-23

```text
Must not change:

- No driver behavior change.
- No executor/provider routing change.
- No assignment files.
- No `.fgos/assignments/` writes.
- No Herdr use.
- No mission/thread/mailbox.
- No stage/status FSM edge changes.
- No child work creation.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-24

```text
Verification commands:
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-25

````text
```bash
node --test test/state/workflow-stage-graphs.test.mjs
node --test test/setup/registrations.test.mjs
node --test test/runner/dispatch.test.mjs
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-26

````text
Useful manual checks:

```bash
node -e "import('./src/state/workflow-stage-graphs.mjs').then(({operationsForStage}) => console.log(operationsForStage('coding','planning').map(o => o.id)))"
node -e "import('./src/state/workflow-stage-graphs.mjs').then(({bundleForStage}) => console.log(bundleForStage('coding','planning')))"
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-27

```text
Rollback strategy:

- Revert only the `operations` entries in `feature.yaml`, the
  `operationMap`/`operationsForStage()` additions, and the operation validation
  tests.
- Since no runtime behavior may depend on operations in this slice, rollback
  should restore the previous one-stage/one-skill path without data migration.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-28

````text
Done criteria:

```txt
bundleForStage(coding, planning) still returns fgos-coding-planning / shape-plan.
operationsForStage(coding, planning) exposes shape-plan, validate-plan, scout-blast-radius, resolve-question.
Bad operation config fails setup/doctor validation.
Human-only operations are visible but not dispatchable through cli-spawn.
No dispatch/driver test changes are required except compatibility assertions.
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#7-slice-2---read-only-operation-surface

````text
## 7. Slice 2 - Read-Only Operation Surface

Purpose: make operation sets inspectable by humans, tests, and future driver
logic before any behavior uses them.

Exact code/config surfaces:

- Prefer no config changes.
- If a CLI is justified, add a narrow read-only command such as:

  ```txt
  fgos workflow operations --domain coding --workflow feature --stage planning --json
  ```

- If no CLI consumer exists yet, keep this slice as a module-only helper and
  test `operationsForStage()` directly.

Must not change:

- No stage skill invocation logic.
- No dispatch execution.
- No assignment builder.
- No policy resolution.
- No writes to `.fgos/`.

Verification commands:

```bash
node --test test/state/workflow-stage-graphs.test.mjs
node --test test/setup/registrations.test.mjs
```

If a CLI is added, add a CLI test proving:

- planning lists `shape-plan`, `validate-plan`, `scout-blast-radius`,
  `resolve-question`;
- executing lists `implement-item`, `review-item`, `fix-verify-red`,
  `scoped-subtask`, `scout-blast-radius`, `resolve-question`;
- absent stage returns an empty list or a clear validation envelope, not a
  thrown stack trace.

Rollback strategy:

- Remove only the read-only CLI/report facade and its tests.
- Keep Slice 1 metadata and validation, because later slices can still use the
  module helper.

Done criteria:

```txt
Allowed operations are inspectable without the caller inventing them.
The read surface is pure/read-only.
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-29

```text
Purpose: make operation sets inspectable by humans, tests, and future driver
logic before any behavior uses them.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-30

```text
Exact code/config surfaces:
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-31

```text
- Prefer no config changes.
- If a CLI is justified, add a narrow read-only command such as:
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-32

````text
```txt
  fgos workflow operations --domain coding --workflow feature --stage planning --json
  ```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-33

```text
- If no CLI consumer exists yet, keep this slice as a module-only helper and
  test `operationsForStage()` directly.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-34

```text
Must not change:

- No stage skill invocation logic.
- No dispatch execution.
- No assignment builder.
- No policy resolution.
- No writes to `.fgos/`.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-35

```text
Verification commands:
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-36

````text
```bash
node --test test/state/workflow-stage-graphs.test.mjs
node --test test/setup/registrations.test.mjs
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-37

```text
If a CLI is added, add a CLI test proving:
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-38

```text
- planning lists `shape-plan`, `validate-plan`, `scout-blast-radius`,
  `resolve-question`;
- executing lists `implement-item`, `review-item`, `fix-verify-red`,
  `scoped-subtask`, `scout-blast-radius`, `resolve-question`;
- absent stage returns an empty list or a clear validation envelope, not a
  thrown stack trace.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-39

```text
Rollback strategy:

- Remove only the read-only CLI/report facade and its tests.
- Keep Slice 1 metadata and validation, because later slices can still use the
  module helper.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-40

````text
Done criteria:

```txt
Allowed operations are inspectable without the caller inventing them.
The read surface is pure/read-only.
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#8-slice-3---assignment-builder

````text
## 8. Slice 3 - Assignment Builder

Purpose: convert one selected stage operation into a bounded semantic
Assignment.

Preferred first operation:

```txt
planning.validate-plan
```

Exact code surfaces:

- Add a small pure module, preferably one of:
  - `src/runner/dispatch/assignment.mjs`; or
  - `src/runner/team/assignment.mjs` if a team namespace already exists at
    implementation time.
- Read operation metadata through `operationsForStage()`.
- Resolve task-spec paths through `resolveTaskSpecPath()`.
- Do not import the runner loop.
- Do not mutate work state.

Assignment must include at least:

- `assignmentId`;
- `workId`;
- `domain`;
- `workflow`;
- `stage`;
- `operation`;
- `role`;
- `reason` when present;
- `taskSpec`;
- `skills`;
- declared `policy` when present;
- `objective`;
- `contextRefs`;
- `expectedOutputs`.

Must not change:

- Assignment is not Work.
- Assignment must not receive `tsk-*` ids.
- No child work is created.
- No lifecycle state changes.
- No process spawn unless Slice 4 is explicitly included.
- No mailbox or AgentMessage protocol.

Verification commands:

```bash
node --test test/runner/assignment.test.mjs
node --test test/state/workflow-stage-graphs.test.mjs
```

Minimum tests:

- building from `planning.validate-plan` copies role/taskSpec/skills/policy;
- `planning.validate-plan` is blocked from runtime dispatch until task-spec
  prose agrees it is a reviewer Assignment;
- `answer-question` remains visible as `human-only` and is not converted into a
  cli-spawn Assignment;
- unknown stage or operation refuses;
- missing taskSpec refuses;
- generated id uses `asgn_*`;
- generated prompt uses refs instead of embedding large docs.

Rollback strategy:

- Remove the assignment module and tests.
- No `.fgos/` data migration is needed if this slice stayed pure.

Done criteria:

```txt
One declared operation can become one Assignment object.
No work lifecycle state changes because an Assignment was built.
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-41

```text
Purpose: convert one selected stage operation into a bounded semantic
Assignment.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-42

```text
Preferred first operation:
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-44

```text
Exact code surfaces:

- Add a small pure module, preferably one of:
  - `src/runner/dispatch/assignment.mjs`; or
  - `src/runner/team/assignment.mjs` if a team namespace already exists at
    implementation time.
- Read operation metadata through `operationsForStage()`.
- Resolve task-spec paths through `resolveTaskSpecPath()`.
- Do not import the runner loop.
- Do not mutate work state.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-46

```text
- `assignmentId`;
- `workId`;
- `domain`;
- `workflow`;
- `stage`;
- `operation`;
- `role`;
- `reason` when present;
- `taskSpec`;
- `skills`;
- declared `policy` when present;
- `objective`;
- `contextRefs`;
- `expectedOutputs`.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-47

```text
Must not change:

- Assignment is not Work.
- Assignment must not receive `tsk-*` ids.
- No child work is created.
- No lifecycle state changes.
- No process spawn unless Slice 4 is explicitly included.
- No mailbox or AgentMessage protocol.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-49

````text
```bash
node --test test/runner/assignment.test.mjs
node --test test/state/workflow-stage-graphs.test.mjs
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-50

```text
Minimum tests:

- building from `planning.validate-plan` copies role/taskSpec/skills/policy;
- `planning.validate-plan` is blocked from runtime dispatch until task-spec
  prose agrees it is a reviewer Assignment;
- `answer-question` remains visible as `human-only` and is not converted into a
  cli-spawn Assignment;
- unknown stage or operation refuses;
- missing taskSpec refuses;
- generated id uses `asgn_*`;
- generated prompt uses refs instead of embedding large docs.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-51

```text
Rollback strategy:

- Remove the assignment module and tests.
- No `.fgos/` data migration is needed if this slice stayed pure.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-52

````text
Done criteria:

```txt
One declared operation can become one Assignment object.
No work lifecycle state changes because an Assignment was built.
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#9-slice-3a---dispatch-policy-resolver

````text
## 9. Slice 3a - Dispatch Policy Resolver

Purpose: resolve provider/model/tier/persona preferences before runtime
execution while keeping executor invocation truth in existing runner config.

Exact code/config surfaces:

- New policy helper near assignment/dispatch code.
- Read existing runner config through the established dispatch config loader.
- Reuse `MODEL_POLICY_TIERS`, `modelForTier()`, `resolveExecutorAndOverrides()`,
  and governance checks where possible.
- Do not hardcode provider-specific command shapes in workflow YAML.

Policy input order:

```txt
Global defaults
-> Domain defaults
-> Workflow defaults
-> Stage defaults
-> Operation / taskSpec defaults
-> Role defaults
-> Persona defaults
-> Work-item policy
-> Assignment explicit policy
-> Human / CLI explicit override
-> Governance gate
```

Resolution rules:

- constraints accumulate and fail closed;
- executor/provider preference uses the most specific value;
- fallback executor list uses the most specific list that exists, with
  deterministic order;
- tier resolves to the strongest required tier;
- provider/model policy resolves after executor/provider and tier are known;
- literal model names are accepted only from Assignment or human/CLI override;
- governance remains final and may reject the resolved policy.

Must not change:

- Existing `execute --for` behavior for work/ad-hoc dispatch.
- Existing `executorIdForWork()` stage-skill resolution.
- Existing runner config schema unless a minimal optional assignment policy
  namespace is explicitly reviewed.
- Existing `resolveExecutorCommand()` invocation truth.

Verification commands:

```bash
node --test test/runner/dispatch.test.mjs
node --test test/runner/assignment-policy.test.mjs
```

Minimum tests:

- `validate-plan` defaults to reviewer/code-reviewer/claude/standard when
  declared that way;
- high-risk Work can raise review rigor;
- Assignment override can prefer `pi` over operation default;
- CLI/human override wins over Assignment preference;
- governance rejects disallowed egress after resolution;
- literal model override is rejected unless it comes from Assignment or
  human/CLI input.

Rollback strategy:

- Remove the assignment policy helper and tests.
- Leave operation policy metadata in YAML because it remains inert until a
  runtime caller uses the resolver.

Done criteria:

```txt
An Assignment has a normalized effective policy before DispatchPlan compilation.
Existing work dispatch remains unchanged when no Assignment policy is present.
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-53

```text
Purpose: resolve provider/model/tier/persona preferences before runtime
execution while keeping executor invocation truth in existing runner config.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-55

```text
- New policy helper near assignment/dispatch code.
- Read existing runner config through the established dispatch config loader.
- Reuse `MODEL_POLICY_TIERS`, `modelForTier()`, `resolveExecutorAndOverrides()`,
  and governance checks where possible.
- Do not hardcode provider-specific command shapes in workflow YAML.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-56

````text
Policy input order:

```txt
Global defaults
-> Domain defaults
-> Workflow defaults
-> Stage defaults
-> Operation / taskSpec defaults
-> Role defaults
-> Persona defaults
-> Work-item policy
-> Assignment explicit policy
-> Human / CLI explicit override
-> Governance gate
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-57

```text
Resolution rules:

- constraints accumulate and fail closed;
- executor/provider preference uses the most specific value;
- fallback executor list uses the most specific list that exists, with
  deterministic order;
- tier resolves to the strongest required tier;
- provider/model policy resolves after executor/provider and tier are known;
- literal model names are accepted only from Assignment or human/CLI override;
- governance remains final and may reject the resolved policy.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-58

```text
Must not change:

- Existing `execute --for` behavior for work/ad-hoc dispatch.
- Existing `executorIdForWork()` stage-skill resolution.
- Existing runner config schema unless a minimal optional assignment policy
  namespace is explicitly reviewed.
- Existing `resolveExecutorCommand()` invocation truth.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-60

````text
```bash
node --test test/runner/dispatch.test.mjs
node --test test/runner/assignment-policy.test.mjs
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-61

```text
Minimum tests:

- `validate-plan` defaults to reviewer/code-reviewer/claude/standard when
  declared that way;
- high-risk Work can raise review rigor;
- Assignment override can prefer `pi` over operation default;
- CLI/human override wins over Assignment preference;
- governance rejects disallowed egress after resolution;
- literal model override is rejected unless it comes from Assignment or
  human/CLI input.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-62

```text
Rollback strategy:

- Remove the assignment policy helper and tests.
- Leave operation policy metadata in YAML because it remains inert until a
  runtime caller uses the resolver.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-63

````text
Done criteria:

```txt
An Assignment has a normalized effective policy before DispatchPlan compilation.
Existing work dispatch remains unchanged when no Assignment policy is present.
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#10-slice-4---cli-spawn-assignment-execution

````text
## 10. Slice 4 - cli-spawn Assignment Execution

Purpose: run one non-mutating Assignment through the existing dispatch control
plane.

Preferred first operations:

```txt
planning.validate-plan
planning.scout-blast-radius
discovery.resolve-question
```

Exact code surfaces:

- `src/runner/dispatch/cli.mjs`
- `src/runner/dispatch/prepare.mjs`
- `src/runner/dispatch/resolve.mjs`
- `src/runner/dispatch/plan.mjs`
- `src/runner/dispatch/transport.mjs`
- fake executor tests in `test/runner/dispatch.test.mjs` or a focused
  assignment dispatch test file.

Integration shape:

```txt
Assignment
  -> taskSpec/skill/role metadata
  -> effective dispatch policy
  -> DispatchPlan
  -> existing governance
  -> existing cli-spawn adapter
  -> raw dispatch result plus assignment metadata
```

Must not change:

- No parallel transport path beside existing dispatch adapters.
- No Herdr dependency.
- No repo-mutating first operation.
- No Work stage/status transition only because an Assignment ran.
- No trust in terminal narration as done.
- No queue/scheduler object.

Verification commands:

```bash
node --test test/runner/dispatch.test.mjs
node --test test/runner/assignment-dispatch.test.mjs
```

Minimum tests:

- fake executor receives an assignment prompt;
- stdout/stderr/exit are captured;
- dispatch result includes assignment metadata;
- nonzero exit returns a failed runtime result rather than changing Work;
- timeout returns failed runtime metadata with captured partial output;
- Work item status/stage remains unchanged after a consult/review assignment.

Rollback strategy:

- Remove assignment-specific CLI entry points and adapter plumbing.
- Keep Assignment builder and policy resolver if they remain pure.
- No stored RunResult rollback is required until Slice 5.

Done criteria:

```txt
One non-mutating operation runs through cli-spawn as an Assignment.
The same dispatch governance chokepoints remain in control.
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-64

```text
Purpose: run one non-mutating Assignment through the existing dispatch control
plane.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-66

````text
```txt
planning.validate-plan
planning.scout-blast-radius
discovery.resolve-question
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-67

```text
Exact code surfaces:

- `src/runner/dispatch/cli.mjs`
- `src/runner/dispatch/prepare.mjs`
- `src/runner/dispatch/resolve.mjs`
- `src/runner/dispatch/plan.mjs`
- `src/runner/dispatch/transport.mjs`
- fake executor tests in `test/runner/dispatch.test.mjs` or a focused
  assignment dispatch test file.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-68

````text
Integration shape:

```txt
Assignment
  -> taskSpec/skill/role metadata
  -> effective dispatch policy
  -> DispatchPlan
  -> existing governance
  -> existing cli-spawn adapter
  -> raw dispatch result plus assignment metadata
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-69

```text
Must not change:

- No parallel transport path beside existing dispatch adapters.
- No Herdr dependency.
- No repo-mutating first operation.
- No Work stage/status transition only because an Assignment ran.
- No trust in terminal narration as done.
- No queue/scheduler object.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-71

````text
```bash
node --test test/runner/dispatch.test.mjs
node --test test/runner/assignment-dispatch.test.mjs
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-72

```text
Minimum tests:

- fake executor receives an assignment prompt;
- stdout/stderr/exit are captured;
- dispatch result includes assignment metadata;
- nonzero exit returns a failed runtime result rather than changing Work;
- timeout returns failed runtime metadata with captured partial output;
- Work item status/stage remains unchanged after a consult/review assignment.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-73

```text
Rollback strategy:

- Remove assignment-specific CLI entry points and adapter plumbing.
- Keep Assignment builder and policy resolver if they remain pure.
- No stored RunResult rollback is required until Slice 5.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-74

````text
Done criteria:

```txt
One non-mutating operation runs through cli-spawn as an Assignment.
The same dispatch governance chokepoints remain in control.
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-75

```text
Purpose: make result trust explicit and durable enough for drivers and
orchestrators.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-76

```text
Exact code surfaces:

- Add Run/RunResult writer near assignment dispatch code.
- Bridge current dispatch result ladder into V1 confidence values.
- Reuse stdout/stderr capture from `src/runner/dispatch/transport.mjs`.
- Snapshot git state only where repo mutation is possible.
- Keep existing `.fgos/logs/` worker logs unchanged; Assignment run logs live
  under `.fgos/assignments/`.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-77

````text
Storage layout:

```txt
.fgos/assignments/<assignment-id>/
  assignment.json
  runs/
    01/
      run.json
      stdout.log
      stderr.log
      exit.json
      result.json
      evidence.json
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-78

```text
Must not change:

- Do not store under the reserved future queue/scheduler namespace.
- Do not rename current worker logs.
- Do not make Herdr pane status prove success.
- Do not mark success only because a process exited zero.
- Do not require repo git delta for read-only consult/review operations.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-80

````text
```bash
node --test test/runner/assignment-runresult.test.mjs
node --test test/runner/dispatch.test.mjs
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-81

```text
Minimum tests:

- `reported` for consult/review with structured claim and worker-produced
  result/report artifact;
- `verified` for structured claim plus external proof;
- `inferred` for git/artifact evidence without structured claim;
- `no-evidence` for settled process with no worker-produced result/report
  artifact and no useful external proof;
- `failed` for timeout, nonzero exit, invalid result, or explicit failure;
- failure still writes `run.json`, logs, `exit.json`, `result.json`, and
  `evidence.json`.
- control-plane `result.json` alone never counts as evidence for `reported` or
  `verified`.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-82

```text
Rollback strategy:

- Disable assignment execution from writing new run directories.
- Keep existing work dispatch and worker logs untouched.
- Existing `.fgos/assignments/` directories are append-only artifacts and can
  be ignored by earlier slices; no Work state migration should be needed.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-83

````text
Done criteria:

```txt
RunResult captures runtime, agent claim, evidence, status, and confidence.
Drivers can consume evidence instead of terminal prose.
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#12-slice-6---driver-operation-choice

````text
## 12. Slice 6 - Driver Operation Choice

Purpose: allow the coding driver to choose among declared/legal operations
inside a stage.

Exact code/doc surfaces:

- `domains/coding/skills/fgos-coding-driving/SKILL.md`
- stage-owner skill docs for discovery, exploring, planning, validating, and
  executing when their operation choice rules need prose updates
- `src/state/handoff.mjs` or callers around it for legality checks
- `src/runner/loop.mjs` only if the actual loop needs a new assignment
  dispatch hook
- tests covering driver operation choice and handoff legality

Behavior rules:

- Keep the primary operation as default.
- Choose consult/review/assist/fix only when declared in `stage.operations`.
- Check roleGraph legality before dispatching an operation that crosses roles.
- Preserve no-progress stops.
- Preserve callstack caps.
- Do not convert every operation into a stage FSM transition.
- Discovery remains machine-alone and routes unresolved ambiguity to exploring.

Must not change:

- Work remains lifecycle authority.
- No direct human question from discovery.
- No driver bypass around dispatcher to spawn another agent.
- No stage graph expansion for ordinary review/consult/fix loops.
- No automatic approve/merge.

Verification commands:

```bash
node --test test/state/handoff.test.mjs
node --test test/runner/loop.test.mjs
node --test test/runner/assignment-dispatch.test.mjs
```

Minimum tests:

- planning can choose `validate-plan` before advancing to executing;
- planning can choose declared consult operations;
- executing can choose review/fix/assist loops without a new FSM state;
- undeclared operation refuses before dispatch;
- illegal roleGraph edge refuses before dispatch;
- discovery `resolve-question` remains machine-only evidence gathering.

Rollback strategy:

- Revert driver/stage-skill guidance and dispatch hook.
- Leave operation registry, Assignment builder, policy resolver, and RunResult
  storage available but unused by the driver.

Done criteria:

```txt
The driver can run multiple task-shaped operations within one stage.
Only declared/legal operations are dispatchable.
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-84

```text
Purpose: allow the coding driver to choose among declared/legal operations
inside a stage.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-86

```text
- `domains/coding/skills/fgos-coding-driving/SKILL.md`
- stage-owner skill docs for discovery, exploring, planning, validating, and
  executing when their operation choice rules need prose updates
- `src/state/handoff.mjs` or callers around it for legality checks
- `src/runner/loop.mjs` only if the actual loop needs a new assignment
  dispatch hook
- tests covering driver operation choice and handoff legality
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-87

```text
Behavior rules:

- Keep the primary operation as default.
- Choose consult/review/assist/fix only when declared in `stage.operations`.
- Check roleGraph legality before dispatching an operation that crosses roles.
- Preserve no-progress stops.
- Preserve callstack caps.
- Do not convert every operation into a stage FSM transition.
- Discovery remains machine-alone and routes unresolved ambiguity to exploring.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-88

```text
Must not change:

- Work remains lifecycle authority.
- No direct human question from discovery.
- No driver bypass around dispatcher to spawn another agent.
- No stage graph expansion for ordinary review/consult/fix loops.
- No automatic approve/merge.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-90

````text
```bash
node --test test/state/handoff.test.mjs
node --test test/runner/loop.test.mjs
node --test test/runner/assignment-dispatch.test.mjs
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-91

```text
Minimum tests:

- planning can choose `validate-plan` before advancing to executing;
- planning can choose declared consult operations;
- executing can choose review/fix/assist loops without a new FSM state;
- undeclared operation refuses before dispatch;
- illegal roleGraph edge refuses before dispatch;
- discovery `resolve-question` remains machine-only evidence gathering.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-92

```text
Rollback strategy:

- Revert driver/stage-skill guidance and dispatch hook.
- Leave operation registry, Assignment builder, policy resolver, and RunResult
  storage available but unused by the driver.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-93

````text
Done criteria:

```txt
The driver can run multiple task-shaped operations within one stage.
Only declared/legal operations are dispatchable.
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-94

```text
Purpose: coordinate more than one Work item or Assignment above the single-item
driver.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-96

```text
- Orchestrator or launcher strategy module, if one already exists by then.
- `src/runner/loop.mjs` only for selection/activation seams already present.
- Assignment dispatch API from earlier slices.
- RunResult reader/index if orchestration needs to summarize results.
- Strategy docs for profiles such as `review-gated` or `frontier-drain`.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-97

```text
Behavior rules:

- Orchestrator selects Work or Assignment candidates.
- Launcher activates one selected Work item when needed.
- Driver remains responsible for progressing one Work item through its flow.
- Dispatcher remains responsible for executing Assignments.
- RunResult feeds back into the orchestrator's next choice.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-98

```text
Must not change:

- No mission lifecycle requirement.
- No mailbox requirement.
- No queue/scheduler object.
- No provider auto-ranking.
- No agent bypasses dispatcher to start another agent directly.
- Herdr remains optional visibility only.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-100

````text
```bash
node --test test/runner/loop.test.mjs
node --test test/runner/dispatch.test.mjs
node --test test/runner/team-orchestration.test.mjs
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-101

```text
Minimum tests:

- one `review-gated` sequence runs planner/reviewer/verifier-style operations;
- orchestration does not create child Work unless explicitly requested;
- a failed/no-evidence RunResult prevents false success;
- no mission/thread storage is required for the sequence.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-102

```text
Rollback strategy:

- Disable or remove the strategy profile.
- Keep lower-level Assignment dispatch and RunResult storage intact.
- Because Work remains lifecycle authority, rolling back orchestration should
  not require Work event rewrites.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-103

````text
Done criteria:

```txt
Team dispatch exists over cli-spawn before Herdr visibility is added.
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-104

```text
Defer until evidence from earlier slices proves a need:
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-105

```text
- full mission lifecycle;
- full AgentMessage protocol;
- mailbox;
- Herdr-visible run execution;
- queue/scheduler and any `job` object;
- provider auto-ranking;
- reusable global operation registry;
- broad renames of existing dispatch terms.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-106

````text
Title:

```txt
Preserve and validate workflow stage operations for coding feature workflow
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-107

````text
Scope:

```txt
domains/coding/workflows/feature.yaml
src/state/workflow-stage-graphs.mjs
src/setup/registrations.mjs
test/state/workflow-stage-graphs.test.mjs
test/setup/registrations.test.mjs
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-108

````text
Non-scope:

```txt
assignment execution
RunResult storage
driver operation choice
Herdr
mission/thread/mailbox
queue/scheduler/job
stage/status FSM changes
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-109

```text
Review prompt if the first slice needs refinement:
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-110

````text
```txt
Review only Slice 1 of Team Dispatch V1.

Confirm that workflow operation metadata is preserved, validated, and exposed
without changing runtime behavior. Look for compatibility regressions in
bundleForStage(), skillForStage(), taskSpecMap, setup/doctor validation, and
the coding feature workflow's primary stage path. Treat any driver dispatch,
Assignment storage, RunResult writing, Herdr integration, mission/thread, or
queue/scheduler behavior as out of scope unless it accidentally changed.
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-111

```text
Use this prompt to review Step 01 independently after the staged rollout plan
is implemented:
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md#unheaded-block-112

````text
```txt
Review the Team Dispatch V1 rollout implementation.

Scope:
- Confirm implementation follows docs/architect/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md.
- Review slice boundaries and make sure later-slice behavior did not leak into earlier slices.
- Focus on sequencing, compatibility, and rollback safety.
- Do not review mission lifecycle, AgentMessage/mailbox, Herdr visibility, queue/scheduler jobs, or provider auto-ranking unless the implementation unexpectedly adds them.

Read:
- docs/architect/agent-coordination/roadmap/team-dispatch-v1/step-00-overview.md
- docs/architect/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md
- docs/architect/agent-coordination/roadmap/team-dispatch-v1/step-02-workflow-stage-operations.md
- docs/architect/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md
- docs/architect/agent-coordination/vocabulary/README.md
- docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md
- docs/architect/agent-coordination/history/brainstorms/agent-team-dispatch-and-herdr-stability-2026-08-27.md
- domains/coding/workflows/feature.yaml
- domains/coding/registry.yaml
- domains/coding/task-specs/*.md
- domains/coding/skills/fgos-coding-driving/SKILL.md
- domains/coding/skills/fgos-coding-discovering/SKILL.md
- src/state/workflow-stage-graphs.mjs
- src/setup/registrations.mjs
- src/runner/dispatch/*.mjs
- src/runner/loop.mjs
- src/state/*fsm*.mjs
- src/state/handoff.mjs
- src/state/runtime-coordination.mjs
- related tests for workflow normalization, setup/doctor validation, dispatch, loop, and assignment/runresult if present

Check:
- Slice 1 changes only workflow loader/validation, feature workflow metadata, and tests.
- Slice 2 is read-only if implemented.
- Slice 3 builds Assignment without creating child Work or changing Work lifecycle.
- Slice 3a resolves policy without hardcoding provider choices into workflow runtime.
- Slice 4 uses existing cli-spawn dispatch instead of introducing a second dispatch path.
- Slice 5 writes RunResult/evidence and does not trust terminal narration as success.
- Slice 6 lets the driver choose only declared/legal operations.
- Slice 7 keeps orchestrator strategy above driver/dispatcher and does not require mission lifecycle.
- Reserved queue/scheduler vocabulary and storage names do not appear in V1 implementation artifacts.
- Discovery remains machine-alone and routes unresolved human/product ambiguity to exploring.

Findings format:
- Lead with boundary violations, behavioral regressions, missing tests, vocabulary drift, or unclear rollback risk.
- Include file/line references.
- If no issues, say so and list residual risk.
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-02-workflow-stage-operations.md#unheaded-block-2

```text
Upgrade the coding feature workflow from:
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-02-workflow-stage-operations.md#unheaded-block-3

````text
```txt
stage -> one skill + one taskSpec
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-02-workflow-stage-operations.md#unheaded-block-4

````text
to:

```txt
stage -> primary operation + allowed operation set
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-02-workflow-stage-operations.md#unheaded-block-5

```text
without changing the current driver behavior first.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-02-workflow-stage-operations.md#unheaded-block-6

```text
Current files:

- `domains/coding/workflows/feature.yaml` declares `discovery`, `exploring`,
  `decompose`, `planning`, and `executing`.
- Each stage currently has at most one `skill` and one `taskSpec`.
- `src/state/workflow-stage-graphs.mjs` normalizes workflow YAML into
  `skillMap` and `taskSpecMap`.
- `bundleForStage()` returns one `{ skill, taskSpec }`.
- `domains/coding/task-specs/` already contains multiple task-shaped
  operations for planning and executing.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-02-workflow-stage-operations.md#unheaded-block-7

```text
Extend stage entries with optional `operations`.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-02-workflow-stage-operations.md#unheaded-block-8

````text
```yaml
stages:
  - name: planning
    step: Divide
    skill: fgos-coding-planning
    taskSpec: shape-plan
    operations:
      - id: shape-plan
        primary: true
        taskSpec: shape-plan
        role: implementer
        skills:
          - fgos-coding-planning
      - id: validate-plan
        taskSpec: validate-plan
        role: reviewer
        reason: review
        dispatch: assignment
        skills:
          - fgos-coding-validating
        policy:
          minTier: standard
          preferPersona: code-reviewer
          preferExecutor: claude
          fallbackExecutors:
            - pi
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-02-workflow-stage-operations.md#unheaded-block-9

```text
Field meanings:

- `id` - stable operation id, usually equal to task-spec id.
- `primary` - operation equivalent to the existing stage `skill`/`taskSpec`.
- `taskSpec` - task-spec file id under `domains/<domain>/task-specs/`.
- `role` - role expected to perform the operation.
- `reason` - handoff reason when the operation uses a roleGraph edge.
- `skills` - skills/capabilities needed by the actor.
- `policy` - optional execution hints; it does not replace dispatch
  governance or executor config.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-02-workflow-stage-operations.md#unheaded-block-11

```text
- `minTier` - minimum model tier/rigor for this operation.
- `preferPersona` - preferred agent-type/persona for this operation.
- `preferExecutor` - preferred executor id when assignment dispatch reaches
  runtime.
- `fallbackExecutors` - ordered executor ids to try when the preferred executor
  is unavailable or rejected by policy/governance.
- `visibility` - optional preference such as `headless` or `visible`; V1 should
  default to headless cli-spawn for proof stability.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-02-workflow-stage-operations.md#unheaded-block-12

````text
Policy rule:

```txt
Operation policy is a hint layer, not a permanent provider binding.
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-02-workflow-stage-operations.md#unheaded-block-13

```text
Workflow YAML should declare only defaults that are true for the operation
itself. Work-item, assignment, and human/CLI overrides can specialize later.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-02-workflow-stage-operations.md#unheaded-block-14

```text
`stage.operations` is an optional array on a workflow stage entry. In V1 it is
stage-local metadata, not a global operation registry.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-02-workflow-stage-operations.md#unheaded-block-16

````text
```yaml
operations:
  - id: validate-plan
    primary: false
    taskSpec: validate-plan
    role: reviewer
    reason: review
    dispatch: assignment
    skills:
      - fgos-coding-validating
    policy:
      minTier: standard
      preferPersona: code-reviewer
      preferExecutor: claude
      fallbackExecutors:
        - pi
      visibility: headless
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-02-workflow-stage-operations.md#unheaded-block-17

```text
Required fields:

- `id` - non-empty string, unique within the stage's operation list.
- `taskSpec` - non-empty string for V1 coding operations. It should resolve to
  `domains/<domain>/task-specs/<taskSpec>.md`.
- `role` - non-empty string when the domain declares `roleGraph.roles`.
- `skills` - array of skill/capability names. It may be empty only for a
  synthesized compatibility operation where the stage has no skill.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-02-workflow-stage-operations.md#unheaded-block-18

```text
Optional fields:

- `primary` - boolean. At most one operation per stage may set `true`.
- `reason` - roleGraph handoff reason, required for cross-role consult/review/
  advise/assist operations and omitted for the current role's primary operation.
- `dispatch` - execution mode for this operation. Omitted means ordinary
  Assignment dispatch when the operation is selected. `human-only` means the
  operation is visible in the stage protocol but must not be sent to cli-spawn.
- `policy` - inert execution hints preserved for later policy resolution.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-02-workflow-stage-operations.md#unheaded-block-20

````text
```yaml
policy:
  minTier: lightweight | standard | creative | analytical | critical
  preferPersona: <agent-type name>
  preferExecutor: <runner executor id>
  fallbackExecutors:
    - <runner executor id>
  visibility: headless | visible
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-02-workflow-stage-operations.md#unheaded-block-21

```text
V1 should not add provider command templates, literal model names, prompt text,
timeouts, filesystem paths, or secrets to workflow operation policy. Those
belong to assignment policy, CLI/human overrides, or runner config.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-02-workflow-stage-operations.md#unheaded-block-22

```text
Role contract:

- `operation.role` is the target role for an Assignment or handoff.
- If existing task-spec prose says a role name is only the function being
  performed, implementation must reconcile that prose in the same slice before
  enabling dispatch for that operation.
- V1's intended `planning.validate-plan` contract is a review Assignment to
  `role: reviewer`, not a hidden implementer self-call. That means
  `domains/coding/task-specs/validate-plan.md` must stop saying the reviewer
  role is not the roleGraph reviewer before Slice 3/4 dispatches it.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-02-workflow-stage-operations.md#unheaded-block-23

```text
`normalizeWorkflow()` should preserve the operation fields without interpreting
runtime policy:
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-02-workflow-stage-operations.md#unheaded-block-24

````text
```js
{
  id: 'validate-plan',
  primary: false,
  taskSpec: 'validate-plan',
  role: 'reviewer',
  reason: 'review',
  dispatch: 'assignment',
  skills: Object.freeze(['fgos-coding-validating']),
  policy: Object.freeze({
    minTier: 'standard',
    preferPersona: 'code-reviewer',
    preferExecutor: 'claude',
    fallbackExecutors: Object.freeze(['pi']),
    visibility: 'headless',
  }),
}
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-02-workflow-stage-operations.md#unheaded-block-25

```text
Normalization rules:

- Preserve explicit operations under `workflow.operationMap[stage]`.
- Freeze every operation array.
- Freeze every operation object.
- Freeze `skills`.
- Freeze `policy`.
- Freeze `policy.fallbackExecutors`.
- Do not inject synthesized operations into `operationMap`.
- Do not rewrite `stage.skill` or `stage.taskSpec`.
- Do not resolve executor/provider/model at normalization time.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-02-workflow-stage-operations.md#33-compatibility-with-existing-skill-and-taskspec

````text
### 3.3 Compatibility With Existing `skill` And `taskSpec`

Existing callers must keep working:

```js
bundleForStage('coding', 'planning')
// -> { skill: 'fgos-coding-planning', taskSpec: 'shape-plan' }
```

Compatibility behavior:

- `skillForStage()` reads the same `skillMap` as before.
- `bundleForStage()` reads the same `skillMap` and `taskSpecMap` as before.
- A stage's explicit primary operation must agree with the existing
  `stage.skill`/`stage.taskSpec` pair.
- If a stage has no explicit `operations`, `operationsForStage()` synthesizes
  one primary operation from `bundleForStage()`.
- The synthesized operation is returned by the helper only. It is not written
  back into normalized workflow data.
- A stage with `skill` but no `taskSpec` synthesizes `taskSpec` as the stage
  name only for operation-read compatibility. Validation must not pretend a
  missing task-spec file exists unless that synthesized operation becomes a
  declared operation.

Synthesis example for `decompose` today:

```json
{
  "id": "decompose",
  "primary": true,
  "taskSpec": "decompose",
  "role": "implementer",
  "skills": ["fgos-coding-planning"]
}
```

Because `decompose` is compatibility/drain-only, this synthetic operation is a
read surface, not an instruction to add `domains/coding/task-specs/decompose.md`
or dispatch it in V1.
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-02-workflow-stage-operations.md#unheaded-block-27

````text
```js
bundleForStage('coding', 'planning')
// -> { skill: 'fgos-coding-planning', taskSpec: 'shape-plan' }
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-02-workflow-stage-operations.md#unheaded-block-29

```text
- `skillForStage()` reads the same `skillMap` as before.
- `bundleForStage()` reads the same `skillMap` and `taskSpecMap` as before.
- A stage's explicit primary operation must agree with the existing
  `stage.skill`/`stage.taskSpec` pair.
- If a stage has no explicit `operations`, `operationsForStage()` synthesizes
  one primary operation from `bundleForStage()`.
- The synthesized operation is returned by the helper only. It is not written
  back into normalized workflow data.
- A stage with `skill` but no `taskSpec` synthesizes `taskSpec` as the stage
  name only for operation-read compatibility. Validation must not pretend a
  missing task-spec file exists unless that synthesized operation becomes a
  declared operation.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-02-workflow-stage-operations.md#unheaded-block-30

```text
Synthesis example for `decompose` today:
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-02-workflow-stage-operations.md#unheaded-block-31

````text
```json
{
  "id": "decompose",
  "primary": true,
  "taskSpec": "decompose",
  "role": "implementer",
  "skills": ["fgos-coding-planning"]
}
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-02-workflow-stage-operations.md#unheaded-block-32

```text
Because `decompose` is compatibility/drain-only, this synthetic operation is a
read surface, not an instruction to add `domains/coding/task-specs/decompose.md`
or dispatch it in V1.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-02-workflow-stage-operations.md#unheaded-block-33

```text
Touchpoint:

- `src/state/workflow-stage-graphs.mjs`
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-02-workflow-stage-operations.md#unheaded-block-34

```text
Changes:

1. `normalizeWorkflow()` preserves `operations` for each stage.
2. The normalized workflow gains `operationMap`.
3. `operationMap[stage]` is a frozen array.
4. Operation objects and nested `skills` arrays are frozen.
5. Existing `stages`, `stepMap`, `transitions`, `skillMap`, and `taskSpecMap`
   remain unchanged.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-02-workflow-stage-operations.md#unheaded-block-35

````text
New helper:

```js
operationsForStage(domain, stage, options = {})
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-02-workflow-stage-operations.md#unheaded-block-36

```text
Rules:

- Resolve workflow through `resolveWorkflow(domain, kind)`.
- If explicit operations exist, return them.
- If not, synthesize one primary operation from `bundleForStage()`.
- If no skill and no taskSpec exist, return `[]`.
- Never throw for absent stage/config; return `[]`.
- Accept either a domain name or an already resolved domain object.
- Accept `options` as `{ kind }` or the existing string shorthand when that
  convention is already present beside `bundleForStage()`.
- Return frozen arrays so callers cannot mutate registry state.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-02-workflow-stage-operations.md#unheaded-block-38

````text
```txt
discovery:
  judge-ambiguity                 -> primary, planner/discoverer, current default executor
  resolve-question                -> machine-only consult, researcher, gather ambiguity evidence, prefer pi/openai-codex:gpt-5.5

exploring:
  lock-decisions                  -> primary, planner, prefer claude/sonnet
  answer-question                 -> human-only advise, advisor, no cli-spawn executor in V1
  resolve-question                -> consult, researcher, prefer pi/openai-codex:gpt-5.5

planning:
  shape-plan                      -> primary, planner, prefer claude/sonnet
  validate-plan                   -> review assignment, reviewer, prefer claude/sonnet, critical -> opus
  scout-blast-radius              -> consult, researcher/tool, prefer gitnexus then pi
  resolve-question                -> consult, researcher, prefer pi/openai-codex:gpt-5.5

executing:
  implement-item                  -> primary, implementer, prefer agy-cli/gemini-3.6-flash-medium
  review-item                     -> review, reviewer, prefer claude/sonnet, critical -> opus
  fix-verify-red                  -> fix, debugger/implementer, prefer claude for diagnosis or agy-cli for bounded edits
  scoped-subtask                  -> assist, helper, prefer agy-cli or pi
  scout-blast-radius              -> consult, researcher/tool, prefer gitnexus then pi
  resolve-question                -> consult, researcher, prefer pi/openai-codex:gpt-5.5
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-02-workflow-stage-operations.md#unheaded-block-39

```text
`decompose` remains compatibility/drain-only unless a separate decision says it
needs explicit operations.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-02-workflow-stage-operations.md#unheaded-block-40

```text
Expected coding feature operation declarations:
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-02-workflow-stage-operations.md#unheaded-block-41

```text
| Stage | Operation | Primary | TaskSpec | Role | Reason | Dispatch | Skills |
|---|---|---:|---|---|---|---|---|
| `discovery` | `judge-ambiguity` | yes | `judge-ambiguity` | `implementer` | omitted | `assignment` | `fgos-coding-discovering` |
| `discovery` | `resolve-question` | no | `resolve-question` | `researcher` | `consult` | `assignment` | `fgos-researching` |
| `exploring` | `lock-decisions` | yes | `lock-decisions` | `implementer` | omitted | `assignment` | `fgos-coding-exploring` |
| `exploring` | `answer-question` | no | `answer-question` | `advisor` | `advise` | `human-only` | `fgos-coding-exploring` |
| `exploring` | `resolve-question` | no | `resolve-question` | `researcher` | `consult` | `assignment` | `fgos-researching` |
| `planning` | `shape-plan` | yes | `shape-plan` | `implementer` | omitted | `assignment` | `fgos-coding-planning` |
| `planning` | `validate-plan` | no | `validate-plan` | `reviewer` | `review` | `assignment` | `fgos-coding-validating` |
| `planning` | `scout-blast-radius` | no | `scout-blast-radius` | `researcher` | `consult` | `assignment` | `fgos-researching` |
| `planning` | `resolve-question` | no | `resolve-question` | `researcher` | `consult` | `assignment` | `fgos-researching` |
| `executing` | `implement-item` | yes | `implement-item` | `implementer` | omitted | `assignment` | `fgos-coding-implement` |
| `executing` | `review-item` | no | `review-item` | `reviewer` | `review` | `assignment` | `fgos-coding-validating` |
| `executing` | `fix-verify-red` | no | `fix-verify-red` | `implementer` | omitted | `assignment` | `fgos-coding-implement` |
| `executing` | `scoped-subtask` | no | `scoped-subtask` | `helper` | `assist` | `assignment` | `fgos-coding-implement` |
| `executing` | `scout-blast-radius` | no | `scout-blast-radius` | `researcher` | `consult` | `assignment` | `fgos-researching` |
| `executing` | `resolve-question` | no | `resolve-question` | `researcher` | `consult` | `assignment` | `fgos-researching` |
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-02-workflow-stage-operations.md#unheaded-block-42

```text
`answer-question` is intentionally visible but `human-only` in V1. The current
task-spec says its executor is a person through `fgos ask`/`answer`; do not add
Claude/Codex/agy policy for it until a real advisor-agent contract exists.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-02-workflow-stage-operations.md#unheaded-block-43

````text
Discovery rule:

```txt
Discovery is machine-alone.
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-02-workflow-stage-operations.md#unheaded-block-44

```text
`discovery.resolve-question` means a machine consult for ambiguity evidence. It
must not become a human-facing question path. If discovery cannot settle the
item from machine evidence, `judge-ambiguity` returns `unclear` and routes the
Work item to `exploring`, where human/product clarification belongs.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-02-workflow-stage-operations.md#unheaded-block-45

```text
Touchpoint:

- `src/setup/registrations.mjs`
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-02-workflow-stage-operations.md#unheaded-block-46

```text
Checks:

1. Every `operation.taskSpec` resolves to a real task-spec file.
2. Every `operation.role` exists in `roleGraph.roles` when a roleGraph exists.
3. Every `operation.skills[]` is provided by at least one registered agent-type.
4. Every `operation.reason`, when present, matches at least one legal roleGraph
   edge at that stage.
5. Every stage has at most one `primary: true` operation.
6. If a stage has existing `skill`/`taskSpec`, its primary operation must not
   contradict them.
7. Every `policy.preferExecutor` and `policy.fallbackExecutors[]`, when present,
   names a configured executor or is skipped until the policy resolver slice.
8. Every `policy.preferPersona`, when present, names a known agent-type.
9. Every `policy.minTier`, when present, uses the existing model-policy tier
   vocabulary.
10. Every operation id is unique within its stage.
11. Every operation item is an object, not a string or array.
12. `skills`, when present, is an array of strings.
13. `policy.fallbackExecutors`, when present, is an array of strings.
14. `policy.visibility`, when present, is either `headless` or `visible`.
15. `dispatch`, when present, is either `assignment` or `human-only`.
16. `dispatch: human-only` operations must not require an executor policy.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-02-workflow-stage-operations.md#unheaded-block-47

```text
Validation should fail setup/doctor loudly for declared operation drift.
Validation should not fail because a synthesized compatibility operation's
implicit taskSpec does not exist; synthesized operations are not declared
workflow config.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-02-workflow-stage-operations.md#unheaded-block-48

```text
Validation must not:

- resolve a provider/model;
- spawn an executor;
- write `.fgos/`;
- create Assignment, Run, or RunResult data;
- add a second lifecycle system beside Work.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-02-workflow-stage-operations.md#unheaded-block-49

```text
Minimum tests:

1. Existing `bundleForStage(coding, planning)` still returns
   `fgos-coding-planning` and `shape-plan`.
2. `operationsForStage(coding, planning)` returns `shape-plan`,
   `validate-plan`, `scout-blast-radius`, and `resolve-question`.
3. A workflow with no explicit operations synthesizes a primary operation.
4. A bad operation taskSpec fails setup/doctor validation.
5. A bad operation role fails validation.
6. A bad operation reason fails validation when roleGraph is present.
7. A malformed operation policy fails validation.
8. Operation policy is preserved but does not affect `bundleForStage()`.
9. Duplicate operation ids fail validation.
10. `operationsForStage()` returns frozen explicit operations.
11. `operationsForStage()` returns a frozen synthesized primary operation for a
    no-operations stage with existing `skill`.
12. `operationsForStage()` returns `[]` for an absent stage and for a domain
    stage with no skill/taskSpec.
13. Discovery operations include no human-facing advise path.
14. Existing dispatch tests still pass without assignment behavior.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-02-workflow-stage-operations.md#unheaded-block-51

````text
```bash
node --test test/state/workflow-stage-graphs.test.mjs
node --test test/setup/registrations.test.mjs
node --test test/runner/dispatch.test.mjs
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-02-workflow-stage-operations.md#unheaded-block-52

````text
Manual smoke checks:

```bash
node -e "import('./src/state/workflow-stage-graphs.mjs').then(({operationsForStage}) => console.log(operationsForStage('coding','executing').map(o => o.id).join('\\n')))"
node -e "import('./src/state/workflow-stage-graphs.mjs').then(({bundleForStage}) => console.log(JSON.stringify(bundleForStage('coding','executing'))))"
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-02-workflow-stage-operations.md#unheaded-block-54

```text
- stage has explicit empty `operations: []` - return an empty explicit list,
  not a synthesized operation;
- stage is absent - return `[]`;
- domain is absent - fold through the existing default-domain behavior and do
  not throw;
- `kind` selects a workflow without operation metadata - synthesize from that
  workflow's `skillMap`/`taskSpecMap`;
- primary operation omits `skills` while stage `skill` exists - validation
  should reject or require the stage skill to be represented;
- primary operation points to a different `taskSpec` from `stage.taskSpec` -
  validation rejects;
- operation has `reason: review` at a stage whose roleGraph has no review edge -
  validation rejects;
- operation policy names an unknown `minTier` - validation rejects;
- operation policy names a literal model - validation rejects because literal
  models are not part of the workflow schema.
- `answer-question` accidentally gains provider/executor policy while still
  `human-only` - validation rejects or the workflow review rejects the config;
- `validate-plan` remains documented as an implementer self-call while the
  operation declares `role: reviewer` - implementation is not ready to dispatch.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-02-workflow-stage-operations.md#unheaded-block-55

```text
This slice must not change runtime driving behavior.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-02-workflow-stage-operations.md#unheaded-block-56

```text
The driver may keep loading the same primary stage skill. The new operation
lookup exists so the next slice can choose operations deliberately.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-02-workflow-stage-operations.md#unheaded-block-57

```text
Use this prompt to review Step 02 independently after implementation:
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-02-workflow-stage-operations.md#unheaded-block-58

````text
```txt
Review the workflow stage operations implementation.

Scope:
- Confirm implementation follows docs/architect/agent-coordination/roadmap/team-dispatch-v1/step-02-workflow-stage-operations.md.
- Focus on workflow YAML normalization, operation lookup, validation, and compatibility.
- Do not review assignment execution or driver autonomy unless the implementation unexpectedly changes them.

Read:
- docs/architect/agent-coordination/roadmap/team-dispatch-v1/step-02-workflow-stage-operations.md
- docs/architect/agent-coordination/vocabulary/README.md
- domains/coding/workflows/feature.yaml
- domains/coding/registry.yaml
- domains/coding/task-specs/*.md
- src/state/workflow-stage-graphs.mjs
- src/setup/registrations.mjs
- related tests for workflow normalization, setup/doctor validation, and dispatch/driver compatibility

Check:
- `stage.operations` is preserved in normalized workflow data.
- `operationsForStage()` returns explicit operations when declared.
- `operationsForStage()` synthesizes one primary operation from existing `skill`/`taskSpec` when operations are absent.
- Existing `skillForStage()` and `bundleForStage()` behavior is unchanged.
- Coding feature workflow declares operations for discovery, exploring, planning, and executing.
- Discovery `resolve-question` remains machine-only consult/evidence gathering, not human clarification.
- Validation catches bad taskSpec, role, skill, reason, duplicate primary, malformed policy, and primary-operation contradictions.
- Operation policy metadata is preserved but does not change executor selection in this slice.

Findings format:
- Lead with compatibility regressions, bad validation gaps, config drift, or missing tests.
- Include file/line references.
- If no issues, say so and list residual risk.
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md#unheaded-block-2

```text
Turn one selected stage operation into a dispatchable assignment and record the
execution result with enough evidence for a driver or orchestrator to decide
the next step.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md#unheaded-block-3

```text
V1 keeps this file-based and local. No mailbox, daemon, or full AgentMessage
protocol is required.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md#unheaded-block-5

````text
```txt
The first implementation can write RunResult files, but the coding driver must
not consume RunResult as lifecycle proof until Step 04 hardens the evidence
contract.
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md#unheaded-block-6

```text
Step 04 owns the stricter worker artifact path, `agent-result.json` schema,
dirty-before/after evidence subtraction, malformed-claim failure behavior, and
read-only versus mutating confidence rules.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md#unheaded-block-7

````text
Minimal assignment:

```json
{
  "assignmentId": "asgn_tsk_abc_validate_plan_001",
  "workId": "tsk-abc",
  "domain": "coding",
  "workflow": "feature",
  "stage": "planning",
  "operation": "validate-plan",
  "role": "reviewer",
  "dispatch": "assignment",
  "taskSpec": "validate-plan",
  "policy": {
    "minTier": "standard",
    "preferPersona": "code-reviewer",
    "preferExecutor": "claude",
    "fallbackExecutors": ["pi"]
  },
  "objective": "Validate the plan against repo reality",
  "contextRefs": ["docs/history/tsk-abc/plan.md"],
  "expectedOutputs": ["verdict", "findings if blocked"]
}
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md#unheaded-block-8

```text
Rules:

- Assignment is semantic. It is not a run and not a work item.
- Assignment may reference a work item but does not own lifecycle.
- Assignment becomes child work only when it needs independent lifecycle,
  approval, merge, or backlog visibility.
- Assignment id uses the assignment namespace, not the work namespace.
- `tsk-*` remains reserved for lifecycle work.
- Assignment does not prove that anything ran.
- Assignment may be rebuilt from Work plus operation metadata, but the
  persisted `assignment.json` is the immutable input for a specific Run once
  execution starts.
- Assignment context uses refs, not embedded large docs, diffs, or transcripts.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md#unheaded-block-9

```text
Required fields:

- `assignmentId` - `asgn_*`, generated by the assignment id helper.
- `workId` - lifecycle Work id when attached to Work; nullable only for a
  future mission-only consult.
- `domain` - resolved domain name, usually `coding` in V1.
- `workflow` - resolved workflow name, usually `feature` in V1.
- `stage` - workflow stage where the operation is available.
- `operation` - operation id from `operationsForStage()`.
- `role` - role expected to perform the operation.
- `dispatch` - `assignment` for cli-spawn dispatchable operations or
  `human-only` for operations that remain visible protocol options but are not
  executed by an agent in V1.
- `taskSpec` - task-spec id the actor must satisfy.
- `objective` - concise semantic request.
- `contextRefs` - file/work/result refs the actor must read.
- `expectedOutputs` - list of expected artifacts or verdict fields.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md#unheaded-block-10

```text
Optional fields:

- `reason` - roleGraph reason for cross-role operations.
- `skills` - copied from the operation.
- `policy` - declared operation or caller policy, unresolved.
- `createdAt` - ISO timestamp.
- `createdBy` - launcher/driver/orchestrator identity when available.
- `attemptLimit` - optional guard for assignment retries, not a scheduler.
- `metadata` - small structured values only; no logs or embedded file content.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md#unheaded-block-11

```text
Role contract:

- Assignment `role` is the target role for the semantic request.
- For `planning.validate-plan`, V1 treats the Assignment as a request to
  `role: reviewer`.
- Before `planning.validate-plan` can be executed as an Assignment, the
  task-spec prose must agree with that roleGraph role. If the task-spec still
  says reviewer is only a function and the operation runs as implementer, the
  implementation must stop at Slice 2/3 and reconcile the docs before runtime
  dispatch.
- Operations marked `dispatch: human-only`, such as current `answer-question`,
  may be shown as legal stage protocol options but must not be sent to
  cli-spawn.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md#unheaded-block-12

```text
Step 03 must add exactly one assignment id creator before any assignment files
are written.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md#unheaded-block-13

````text
Suggested helper:

```js
createAssignmentId({ workId, stage, operation, existingIds })
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md#unheaded-block-14

````text
Recommended V1 shape:

```txt
asgn_<safe-work-id>_<safe-operation-id>_<n>
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md#unheaded-block-15

````text
Example:

```txt
asgn_tsk_abc_validate_plan_001
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md#unheaded-block-16

```text
Rules:

- deterministic prefix from work id and operation id;
- numeric suffix increments on collision under `.fgos/assignments/` or the assignment
  store;
- no random id in V1 unless concurrency proves suffix allocation insufficient;
- no `tsk-*` prefix;
- no `msg_*` or `trace_*` until those layers have real writers.
- safe tokens should lowercase where practical and replace non `[a-zA-Z0-9_-]`
  characters with `_`;
- suffix allocation must never overwrite an existing assignment directory;
- concurrent creation may use an atomic directory create around the selected
  suffix if implementation discovers real races.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md#unheaded-block-17

```text
Run ids are derived only when execution starts:
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md#unheaded-block-18

````text
```txt
run_<assignment-id>_<attempt>
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md#unheaded-block-19

````text
Example:

```txt
run_asgn_tsk_abc_validate_plan_001_01
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md#unheaded-block-20

```text
The attempt suffix is two digits for readability in examples. Implementations
may support more attempts, but lexical order must match numeric attempt order.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md#unheaded-block-21

````text
Suggested module:

```txt
src/runner/team/assignment.mjs
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md#unheaded-block-22

````text
Pure helpers:

```js
buildAssignment({ work, domain, workflow, stage, operation, objective, contextRefs })
assignmentPrompt(assignment)
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md#unheaded-block-24

```text
1. Generate a stable assignment id through the assignment id helper.
2. Copy work/domain/workflow/stage identity.
3. Copy operation id, role, dispatch mode, taskSpec, reason, and skills.
4. Copy operation policy as declared policy, without resolving provider/model
   yet.
5. Keep context refs as refs, not embedded large content.
6. Produce a prompt payload compatible with existing cli-spawn dispatch.
7. Reject runtime dispatch for `dispatch: human-only`.
8. Reject an operation that is not declared for the stage.
9. Reject a taskSpec that does not resolve.
10. Preserve Work lifecycle state exactly as-is.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md#unheaded-block-26

````text
```txt
Assignment: <assignmentId>
Work: <workId>
Stage operation: <stage>.<operation>
Role: <role>
Task-spec: domains/<domain>/task-specs/<taskSpec>.md
Objective: <objective>
Context refs:
- <ref>
Expected outputs:
- <output>
Result artifact:
- Write structured JSON to <runDir>/agent-result.json
- Optional human-readable report: <runDir>/agent-report.md
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md#unheaded-block-27

```text
The prompt can be rendered through existing dispatch prompt utilities, but it
must remain assignment-shaped. Do not pretend the Assignment is a Work item or
ask the worker to call Work lifecycle verbs.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md#unheaded-block-28

```text
For runtime execution, `<runDir>` must be concrete and writeable. Prefer an
absolute path in the actual prompt because the worker may run from a worktree
while assignment storage lives under the main checkout's `.fgos/` directory.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md#unheaded-block-29

```text
Before execution, resolve a concrete effective policy for the assignment.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md#unheaded-block-30

````text
Suggested helper:

```js
resolveAssignmentDispatchPolicy({
  globalPolicy,
  domainPolicy,
  workflowPolicy,
  stagePolicy,
  operationPolicy,
  rolePolicy,
  personaPolicy,
  workPolicy,
  assignmentPolicy,
  cliOverride,
})
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md#unheaded-block-31

````text
Resolution order:

```txt
Global defaults
-> Domain defaults
-> Workflow defaults
-> Stage defaults
-> Operation / taskSpec defaults
-> Role defaults
-> Persona defaults
-> Work-item policy
-> Assignment explicit policy
-> Human / CLI explicit override
-> Governance gate
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md#unheaded-block-32

```text
Rules:

- constraints are accumulated and cannot be weakened;
- executor/provider preference uses the most specific value;
- fallback executors preserve most-specific ordering;
- tier uses the strongest required tier;
- model name is resolved from provider/model policy after executor/provider and
  tier are known;
- literal model names are accepted only from assignment or human/CLI override;
- governance may reject the final choice.
- operation policy is a default, not a binding provider choice;
- work risk/tier may raise rigor above operation defaults;
- Assignment explicit policy may narrow executor preference but cannot weaken
  constraints;
- CLI/human explicit override is last before governance and still cannot bypass
  egress rules.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md#unheaded-block-34

````text
```json
{
  "role": "reviewer",
  "persona": "code-reviewer",
  "executorPreference": ["claude", "pi"],
  "providerModel": "claude",
  "tier": "standard",
  "model": "sonnet",
  "visibility": "headless",
  "constraints": {
    "requiresSkills": ["fgos-coding-validating"],
    "carries": ["repo-content"]
  }
}
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md#unheaded-block-36

````text
```txt
Resolve policy before dispatch, but let existing dispatch config remain the source of executor invocation truth.
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md#unheaded-block-38

```text
- `src/runner/dispatch/config.mjs` for model-policy tier vocabulary and runner
  config validation.
- `src/runner/dispatch/resolve.mjs` for executor, capability, and tier/model
  resolution.
- `src/runner/dispatch/plan.mjs` for DispatchPlan compilation.
- `src/runner/dispatch/transport.mjs` for governance attached to resolved
  executor command shape.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md#unheaded-block-39

```text
Policy must not:

- add command templates to workflow YAML;
- let workflow YAML pin literal model names;
- treat role as executor identity;
- silently downgrade a `critical` requirement to `standard`;
- bypass cross-provider governance.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md#unheaded-block-40

```text
V1 should start with one non-mutating operation:
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md#unheaded-block-42

````text
or:

```txt
planning.scout-blast-radius
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md#unheaded-block-43

````text
Dispatch path:

```txt
assignment
  -> taskSpec/skill/role metadata
  -> effective dispatch policy
  -> capability or executor selection
  -> DispatchPlan
  -> governance
  -> cli-spawn
  -> RunResult
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md#unheaded-block-44

```text
Do not start with `implement-item` or `fix-verify-red`; repo-mutating operations
need evidence capture first.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md#unheaded-block-46

```text
- `src/runner/dispatch/prepare.mjs`
  - Accept or wrap an Assignment as a legal dispatch target.
  - Keep existing Work/ad-hoc dispatch preparation compatible.
- `src/runner/dispatch/resolve.mjs`
  - Resolve effective executor/capability from assignment policy and existing
    runner config.
  - Keep `executorIdForWork()` unchanged for Work dispatch.
- `src/runner/dispatch/plan.mjs`
  - Compile a DispatchPlan that records selector type `assignment` or an
    equivalent assignment-specific target without changing existing selector
    semantics.
- `src/runner/dispatch/transport.mjs`
  - Reuse `cli-spawn` and its stdout/stderr/timeout capture.
  - Do not create a second process-spawn implementation.
- `src/runner/dispatch/cli.mjs`
  - Add an assignment execution entry point only after the pure builder and
    policy resolver exist.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md#unheaded-block-47

````text
Selector shape:

```json
{
  "selector": {
    "type": "assignment",
    "value": "asgn_tsk_abc_validate_plan_001"
  }
}
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md#unheaded-block-48

```text
The assignment selector is a dispatch input. It is not a mechanism, not a
runtime run, and not a Work lifecycle state.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md#unheaded-block-49

```text
First live/manual dry run, if needed, should use a fake or read-only executor
before trying a real Claude/Codex/agy provider.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md#unheaded-block-50

```text
A Run is created immediately before execution starts.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md#unheaded-block-51

````text
Minimal `run.json`:

```json
{
  "runId": "run_asgn_tsk_abc_validate_plan_001_01",
  "assignmentId": "asgn_tsk_abc_validate_plan_001",
  "attempt": 1,
  "executorId": "claude",
  "dispatchPlanPath": ".fgos/assignments/asgn_tsk_abc_validate_plan_001/runs/01/dispatch-plan.json",
  "cwd": "/repo",
  "startedAt": "2026-08-27T00:00:00.000Z",
  "timeoutMs": 900000,
  "status": "running"
}
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md#unheaded-block-52

```text
Run rules:

- Run belongs to Assignment, not Work.
- Run is one attempt. Retry creates a new run attempt directory.
- Write `run.json` before spawning the process.
- Update or supplement run state after process settlement; do not rely on an
  in-memory object only.
- Persist the DispatchPlan used for the run if the implementation compiles one.
- Runtime cwd must be explicit.
- Timeout must be explicit, even if it came from runner default config.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md#unheaded-block-53

````text
Minimal RunResult:

```json
{
  "runId": "run_asgn_tsk_abc_validate_plan_001_01",
  "assignmentId": "asgn_tsk_abc_validate_plan_001",
  "workId": "tsk-abc",
  "executorId": "codex",
  "policy": {
    "persona": "code-reviewer",
    "tier": "standard",
    "model": "sonnet",
    "executorPreference": ["claude", "pi"]
  },
  "status": "done",
  "confidence": "reported",
  "runtime": {
    "exitCode": 0,
    "stdoutLog": ".fgos/assignments/asgn_tsk_abc_validate_plan_001/runs/01/stdout.log",
    "stderrLog": ".fgos/assignments/asgn_tsk_abc_validate_plan_001/runs/01/stderr.log"
  },
  "agentClaim": {
    "status": "done",
    "summary": "Plan is feasible with one missing test."
  },
  "evidence": {
    "gitBefore": "abc",
    "gitAfter": "abc",
    "changedFiles": [],
    "artifacts": [
      ".fgos/assignments/asgn_tsk_abc_validate_plan_001/runs/01/agent-report.md"
    ],
    "tests": []
  }
}
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md#unheaded-block-54

```text
Confidence:

- `verified` - claim plus external evidence;
- `reported` - structured claim, acceptable for consult/review when an artifact
  exists;
- `inferred` - no structured claim, but git/artifact evidence exists;
- `no-evidence` - process settled but no useful proof exists;
- `failed` - timeout, nonzero exit, invalid result, or explicit failure.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md#unheaded-block-56

```text
- `runId`;
- `assignmentId`;
- `workId` when attached to Work;
- `executorId`;
- effective `policy`;
- `status`;
- `confidence`;
- `runtime`;
- `agentClaim`;
- `evidence`.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md#unheaded-block-57

```text
Status values in V1:

- `done` - runtime settled and evidence/claim supports a completed assignment;
- `blocked` - runtime settled and structured claim says the assignment cannot
  complete with current context;
- `failed` - runtime failed, timed out, returned invalid required output, or
  violated the assignment contract;
- `no-evidence` - runtime settled but produced no useful claim or proof.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md#unheaded-block-58

```text
`status` and `confidence` are separate. A read-only consult may be `done` with
`reported` confidence. A process may exit zero and still become `no-evidence`.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md#unheaded-block-59

```text
Malformed structured claims are not absent claims. If a worker writes
`agent-result.json` and it is invalid JSON or fails the required schema, the
RunResult should be `failed/failed`, not `no-evidence/no-evidence`.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md#unheaded-block-60

```text
Dirty working tree evidence must be run-relative. A file that was already dirty
before the run started cannot prove the Assignment changed anything unless a
future implementation records content hashes and proves the file changed again
during the run.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md#51-evidence-and-confidence-classification

```text
## 5.1 Evidence And Confidence Classification

Classification inputs:

- process exit/timeout/spawn failure;
- stdout/stderr logs;
- worker-produced structured claim or report artifact;
- legacy stdout tokens when still supported by the existing result ladder;
- git head before/after;
- changed files;
- declared operation mutability;
- expected output files or reports;
- test command results when applicable.

Classification rules:

- `failed`
  - timeout;
  - spawn failure;
  - nonzero exit for assignment execution;
  - invalid structured result;
  - explicit agent claim `failed`;
  - required artifact missing.
- `verified`
  - structured claim says done; and
  - external evidence confirms the claim, such as git delta, expected artifact,
    or passing test result.
- `reported`
  - structured claim exists; and
  - operation is consult/review/read-only; and
  - a worker-produced result/report artifact exists; and
  - no contradictory external evidence exists.
- `inferred`
  - no structured claim exists; and
  - external evidence shows concrete effect, such as git/artifact delta.
- `no-evidence`
  - process settled; and
  - no structured claim, no required artifact, and no useful external proof.

Herdr pane status, terminal quietness, and visible prompt echo are visibility
signals only. They may end waiting or help debugging, but they must not produce
`reported` or `verified` confidence by themselves.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md#unheaded-block-62

```text
- process exit/timeout/spawn failure;
- stdout/stderr logs;
- worker-produced structured claim or report artifact;
- legacy stdout tokens when still supported by the existing result ladder;
- git head before/after;
- changed files;
- declared operation mutability;
- expected output files or reports;
- test command results when applicable.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md#unheaded-block-64

```text
- `failed`
  - timeout;
  - spawn failure;
  - nonzero exit for assignment execution;
  - invalid structured result;
  - explicit agent claim `failed`;
  - required artifact missing.
- `verified`
  - structured claim says done; and
  - external evidence confirms the claim, such as git delta, expected artifact,
    or passing test result.
- `reported`
  - structured claim exists; and
  - operation is consult/review/read-only; and
  - a worker-produced result/report artifact exists; and
  - no contradictory external evidence exists.
- `inferred`
  - no structured claim exists; and
  - external evidence shows concrete effect, such as git/artifact delta.
- `no-evidence`
  - process settled; and
  - no structured claim, no required artifact, and no useful external proof.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md#unheaded-block-65

```text
Herdr pane status, terminal quietness, and visible prompt echo are visibility
signals only. They may end waiting or help debugging, but they must not produce
`reported` or `verified` confidence by themselves.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md#52-failure-timeout-and-no-evidence-behavior

```text
## 5.2 Failure, Timeout, And No-Evidence Behavior

Failure behavior:

- Always write a RunResult for failures.
- Preserve stdout/stderr captured before failure.
- Include failure category when the lower layer provides one.
- Do not transition Work state only because an assignment failed.
- Let the driver/orchestrator decide whether to retry, choose another
  operation, or route back to an earlier stage.

Timeout behavior:

- Mark RunResult `status: failed`.
- Mark `confidence: failed`.
- Record timeout duration and partial logs.
- Do not reuse the same run attempt directory for retry.

No-evidence behavior:

- Mark RunResult `status: no-evidence`.
- Mark `confidence: no-evidence`.
- Treat this as a non-success for driver/orchestrator decisions.
- For consult/review, missing worker-produced result/report artifact is enough
  to classify `no-evidence` even if the process exits zero.
- For repo-mutating work, missing git/artifact evidence prevents `verified`.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md#unheaded-block-66

```text
Failure behavior:

- Always write a RunResult for failures.
- Preserve stdout/stderr captured before failure.
- Include failure category when the lower layer provides one.
- Do not transition Work state only because an assignment failed.
- Let the driver/orchestrator decide whether to retry, choose another
  operation, or route back to an earlier stage.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md#unheaded-block-67

```text
Timeout behavior:

- Mark RunResult `status: failed`.
- Mark `confidence: failed`.
- Record timeout duration and partial logs.
- Do not reuse the same run attempt directory for retry.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md#unheaded-block-69

```text
- Mark RunResult `status: no-evidence`.
- Mark `confidence: no-evidence`.
- Treat this as a non-success for driver/orchestrator decisions.
- For consult/review, missing worker-produced result/report artifact is enough
  to classify `no-evidence` even if the process exits zero.
- For repo-mutating work, missing git/artifact evidence prevents `verified`.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md#unheaded-block-70

````text
Suggested storage:

```txt
.fgos/assignments/<assignment-id>/
  assignment.json
  runs/
    01/
      run.json
      stdout.log
      stderr.log
      exit.json
      agent-result.json
      agent-report.md
      result.json
      evidence.json
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md#unheaded-block-71

```text
Rules:

- Always write `assignment.json` before execution.
- Always write `runs/<n>/run.json` before process spawn.
- Always write `runs/<n>/exit.json` after process settlement.
- Always write `runs/<n>/result.json`, even for failure.
- For repo-mutating operations, snapshot git state before and after.
- For consult/review operations, require at least one worker-produced result or
  report artifact.
- Prefer atomic write-then-rename for JSON files.
- Never write under the reserved future queue/scheduler namespace.
- Do not mix Assignment run logs with existing `.fgos/logs/<work-id>.log`.
- `assignment.json` is shared by attempts; run-specific copies belong under the
  attempt directory only if needed for audit.
- The control-plane `result.json` is never evidence for itself.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md#unheaded-block-72

```text
Recommended files:

- `assignment.json` - semantic request.
- `dispatch-plan.json` - exact dispatch plan used for this attempt, if a plan
  is compiled.
- `run.json` - runtime attempt metadata.
- `stdout.log` - stdout stream for this attempt.
- `stderr.log` - stderr stream for this attempt.
- `exit.json` - process settlement data.
- `agent-result.json` - optional worker-produced structured claim, if the
  executor can write one.
- `agent-report.md` - optional worker-produced report for read-only
  consult/review operations.
- `result.json` - normalized RunResult.
- `evidence.json` - evidence details used to classify confidence.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md#unheaded-block-74

````text
```txt
Control-plane files prove recording happened.
Worker-produced files prove the assignment produced something.
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md#unheaded-block-75

```text
`result.json`, `run.json`, `exit.json`, and `evidence.json` must not be listed
as evidence artifacts for `reported` or `verified` confidence. Evidence
artifacts must be produced by the worker or by an external verifier, such as
`agent-result.json`, `agent-report.md`, changed source files, commits, or test
reports.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md#unheaded-block-77

````text
```json
{
  "exitCode": 0,
  "signal": null,
  "timedOut": false,
  "settledAt": "2026-08-27T00:10:00.000Z",
  "durationMs": 600000
}
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md#unheaded-block-79

````text
```json
{
  "operationMutability": "read-only",
  "gitBefore": "abc",
  "gitAfter": "abc",
  "changedFiles": [],
  "artifacts": [
    ".fgos/assignments/asgn_tsk_abc_validate_plan_001/runs/01/agent-report.md"
  ],
  "tests": [],
  "classificationInputs": [
    "exit-zero",
    "structured-claim",
    "result-artifact"
  ]
}
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md#unheaded-block-80

```text
Minimum tests:

1. Build assignment from `planning.validate-plan`.
2. Build assignment from `executing.review-item`.
3. Assignment id uses `asgn_*`, not `tsk-*`.
4. Repeated assignment id allocation increments suffix without overwriting an
   existing assignment directory.
5. Refuse unknown operation.
6. Refuse operation whose taskSpec does not resolve.
7. cli-spawn fake executor writes stdout/stderr/exit/result files.
8. Consult assignment with worker-produced result/report artifact classifies as
   `reported`.
9. Work assignment with git delta classifies as `inferred` or `verified`.
10. Settled process with no worker-produced result/report artifact and no git
   delta classifies as `no-evidence`.
11. Work risk or assignment policy can raise tier above operation default.
12. Assignment/human executor override wins over operation preference but still
    fails when governance rejects it.
13. Literal model override is rejected unless it comes from assignment or
    human/CLI input.
14. Run id uses `run_<assignment-id>_<attempt>` and attempts sort
    deterministically.
15. `assignment.json` is written before process spawn.
16. `run.json` is written before process spawn.
17. `exit.json`, `result.json`, and `evidence.json` are written for timeout and
    nonzero exit.
18. A zero-exit run with no structured claim and no worker-produced artifact becomes
    `no-evidence`.
19. `result.json` alone never classifies as `reported` or `verified`.
20. Herdr or pane-style visibility signals do not classify success.
21. Existing `execute --for` and `spawnWorker()` work-dispatch behavior remains
    unchanged when no Assignment is involved.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md#unheaded-block-82

````text
```bash
node --test test/runner/assignment.test.mjs
node --test test/runner/assignment-policy.test.mjs
node --test test/runner/assignment-dispatch.test.mjs
node --test test/runner/assignment-runresult.test.mjs
node --test test/runner/dispatch.test.mjs
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md#unheaded-block-83

```text
If the implementation folds these into existing files, run the equivalent
focused test files plus the existing dispatch suite.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md#unheaded-block-84

```text
The first assignment dispatch should not mutate repo state. Prove the
assignment, Run, and RunResult path with consult/review before
implementation/fix operations.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md#unheaded-block-85

```text
Use this prompt to review Step 03 independently after implementation:
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md#unheaded-block-86

````text
```txt
Review the Assignment, Run, and RunResult implementation.

Scope:
- Confirm implementation follows docs/architect/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md.
- Focus on assignment construction, policy resolution inputs, cli-spawn integration, run metadata, result storage, and evidence classification.
- Do not review full mission lifecycle, AgentMessage/mailbox, Herdr visibility, or autonomous driver behavior unless the implementation unexpectedly adds them.

Read:
- docs/architect/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md
- docs/architect/agent-coordination/roadmap/team-dispatch-v1/step-01-rollout.md
- docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md
- docs/architect/agent-coordination/history/brainstorms/agent-team-dispatch-and-herdr-stability-2026-08-27.md
- src/runner/dispatch/cli.mjs
- src/runner/dispatch/resolve.mjs
- src/runner/dispatch/prepare.mjs
- src/runner/dispatch/result parsing or adapter modules touched by the implementation
- any new src/runner/team/* or src/runner/assignment/* modules
- tests covering assignment building, cli-spawn fake executor, run storage, and confidence classification

Check:
- Assignment is semantic and does not become lifecycle work.
- Assignment ids use `asgn_*`; work ids stay `tsk-*`.
- Run ids are created only when execution starts and use `run_<assignment-id>_<attempt>`.
- Assignment storage uses `.fgos/assignments/<assignment-id>/assignment.json`.
- Run storage uses `.fgos/assignments/<assignment-id>/runs/<attempt>/`.
- `run.json`, stdout/stderr logs, `exit.json`, `result.json`, and `evidence.json` are written consistently, including failures.
- Consult/review operations can classify as `reported` only with a
  worker-produced result/report artifact.
- Repo-mutating operations require git/artifact evidence before `verified`.
- Control-plane `result.json` is never counted as evidence for itself.
- Settled processes with no useful proof become `no-evidence`, not success.
- Policy overrides respect specificity while constraints fail closed and governance remains final.
- Execution goes through existing cli-spawn dispatch, not a parallel transport path.

Findings format:
- Lead with false-success risks, lifecycle leaks, evidence gaps, policy/governance bypasses, storage bugs, or missing tests.
- Include file/line references.
- If no issues, say so and list residual risk.
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-04-assignment-runresult-hardening.md#unheaded-block-2

```text
Prevent Assignment runs from producing false success.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-04-assignment-runresult-hardening.md#unheaded-block-3

```text
Current V1 can execute an Assignment and write run files. The next increment
must make the evidence contract strict enough that a driver can safely decide
what to do next.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-04-assignment-runresult-hardening.md#unheaded-block-4

````text
The target invariant:

```txt
No Work lifecycle decision may be made from an Assignment RunResult unless the
RunResult has evidence produced during that run.
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-04-assignment-runresult-hardening.md#unheaded-block-6

```text
- assignment id generation and Assignment builder;
- assignment prompt rendering;
- effective assignment policy resolution;
- `dispatch decide --assignment`;
- `dispatch execute --assignment`;
- `.fgos/assignments/<assignmentId>/runs/<attempt>/` storage;
- `run.json`, stdout/stderr logs, `exit.json`, `evidence.json`, and
  `result.json`;
- confidence labels: `verified`, `reported`, `inferred`, `no-evidence`,
  `failed`.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-04-assignment-runresult-hardening.md#unheaded-block-7

```text
Known gaps:

- changed files are measured after the run, but dirty-before state is not
  subtracted;
- the worker is not told where to write `agent-result.json` or
  `agent-report.md`;
- `agent-result.json` has no strict schema;
- malformed structured output is treated as absent instead of invalid;
- read-only result artifacts are detected only in the run directory, but the
  run directory is not part of the prompt contract;
- fallback executors are stored in policy but not attempted;
- synthetic compatibility operations can be built as if runtime-ready.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-04-assignment-runresult-hardening.md#unheaded-block-8

```text
- Do not wire the coding driver to choose operations yet.
- Do not add mission lifecycle.
- Do not add a queue, scheduler, or `Job`.
- Do not make Herdr a truth source.
- Do not require all third-party agents to obey schema before the control plane
  can classify `no-evidence`.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-04-assignment-runresult-hardening.md#unheaded-block-9

```text
Expected code files:

- `src/runner/dispatch/assignment.mjs`
- `src/runner/dispatch/assignment-runner.mjs`
- `src/runner/dispatch/assignment-policy.mjs` only if policy fields need minor
  threading
- `src/runner/dispatch/cli.mjs` only if CLI output or flags need to expose the
  run artifact directory
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-04-assignment-runresult-hardening.md#unheaded-block-10

```text
Expected tests:

- `test/runner/assignment.test.mjs`
- `test/runner/assignment-runresult.test.mjs`
- `test/runner/assignment-dispatch.test.mjs`
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-04-assignment-runresult-hardening.md#unheaded-block-11

```text
Expected docs:

- `docs/architect/agent-coordination/roadmap/team-dispatch-v1/step-03-assignment-runresult.md`
- `docs/architect/agent-coordination/proposals/team-communication-protocol-v1.md`
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-04-assignment-runresult-hardening.md#51-pass-the-run-artifact-contract-to-the-worker

````text
### 5.1 Pass The Run Artifact Contract To The Worker

Before spawning the executor, compute:

```txt
runDir
agentResultPath = <runDir>/agent-result.json
agentReportPath = <runDir>/agent-report.md
```

The assignment prompt must include both paths. Keep paths concrete and
writeable from the worker's cwd. Prefer absolute paths in the runtime prompt to
avoid ambiguity across worktrees.

Prompt addition:

```txt
Result artifact:
- Write structured JSON to <absolute-run-dir>/agent-result.json
- Optional human-readable report: <absolute-run-dir>/agent-report.md
- Do not call Work lifecycle verbs unless the task-spec explicitly says this
  Assignment is the lifecycle driver.
```

Tests:

- `renderAssignmentPrompt` includes both result artifact paths when supplied.
- `executeAssignment` passes paths into prompt rendering.
- A fake executor can read the prompt and write the expected artifact.
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-04-assignment-runresult-hardening.md#unheaded-block-13

````text
```txt
runDir
agentResultPath = <runDir>/agent-result.json
agentReportPath = <runDir>/agent-report.md
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-04-assignment-runresult-hardening.md#unheaded-block-14

```text
The assignment prompt must include both paths. Keep paths concrete and
writeable from the worker's cwd. Prefer absolute paths in the runtime prompt to
avoid ambiguity across worktrees.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-04-assignment-runresult-hardening.md#unheaded-block-15

````text
Prompt addition:

```txt
Result artifact:
- Write structured JSON to <absolute-run-dir>/agent-result.json
- Optional human-readable report: <absolute-run-dir>/agent-report.md
- Do not call Work lifecycle verbs unless the task-spec explicitly says this
  Assignment is the lifecycle driver.
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-04-assignment-runresult-hardening.md#unheaded-block-16

```text
Tests:

- `renderAssignmentPrompt` includes both result artifact paths when supplied.
- `executeAssignment` passes paths into prompt rendering.
- A fake executor can read the prompt and write the expected artifact.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-04-assignment-runresult-hardening.md#unheaded-block-17

```text
Add a small validator near `assignment-runner.mjs` or in a sibling module if it
grows:
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-04-assignment-runresult-hardening.md#unheaded-block-18

````text
```js
validateAgentResultClaim(value)
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-04-assignment-runresult-hardening.md#unheaded-block-19

````text
Allowed statuses:

```txt
done
blocked
failed
no-evidence
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-04-assignment-runresult-hardening.md#unheaded-block-21

```text
- `status`: allowed status string;
- `summary`: non-empty string.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-04-assignment-runresult-hardening.md#unheaded-block-23

```text
- `blocked`: requires `blocker`, non-empty string;
- `failed`: requires `error`, non-empty string;
- `done`: requires at least one of:
  - non-empty `evidenceRefs`;
  - companion `agent-report.md` for read-only operation;
  - post-run changed files for mutating operation.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-04-assignment-runresult-hardening.md#unheaded-block-24

```text
Malformed JSON or invalid schema must produce:
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-04-assignment-runresult-hardening.md#unheaded-block-25

````text
```json
{
  "status": "failed",
  "confidence": "failed"
}
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-04-assignment-runresult-hardening.md#unheaded-block-26

```text
It must not silently degrade to `no-evidence` if the worker attempted a
structured claim and got it wrong.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-04-assignment-runresult-hardening.md#unheaded-block-27

```text
Tests:

- invalid JSON claim fails the run result;
- unknown status fails;
- missing summary fails;
- `blocked` without blocker fails;
- `failed` without error fails;
- valid read-only done with report is `reported`;
- valid mutating done without delta is `no-evidence`.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-04-assignment-runresult-hardening.md#53-snapshot-dirty-state-before-and-after

````text
### 5.3 Snapshot Dirty State Before And After

Capture three states:

```txt
gitBefore
dirtyBefore
gitAfter
dirtyAfter
```

Post-run evidence files are:

```txt
newDirtyFiles = dirtyAfter - dirtyBefore
committedFiles = diff(gitBefore..gitAfter)
changedFiles = union(newDirtyFiles, committedFiles)
```

Do not count paths that were already dirty before the run. If a path was dirty
before and changed again during the run, V1 may conservatively classify it as
ambiguous rather than verified unless a future patch records file hashes.

Recommended Step 04 behavior:

```txt
dirty-before path still dirty after run -> not evidence
clean-before path dirty after run       -> evidence
HEAD advanced                           -> committed diff evidence
```

Tests:

- a pre-existing dirty file does not produce `verified` or `inferred`;
- a new dirty file produced by the fake executor is evidence;
- a committed file between `gitBefore` and `gitAfter` is evidence;
- `.fgos/` internal files are excluded.
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-04-assignment-runresult-hardening.md#unheaded-block-28

````text
Capture three states:

```txt
gitBefore
dirtyBefore
gitAfter
dirtyAfter
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-04-assignment-runresult-hardening.md#unheaded-block-30

````text
```txt
newDirtyFiles = dirtyAfter - dirtyBefore
committedFiles = diff(gitBefore..gitAfter)
changedFiles = union(newDirtyFiles, committedFiles)
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-04-assignment-runresult-hardening.md#unheaded-block-31

```text
Do not count paths that were already dirty before the run. If a path was dirty
before and changed again during the run, V1 may conservatively classify it as
ambiguous rather than verified unless a future patch records file hashes.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-04-assignment-runresult-hardening.md#unheaded-block-33

````text
```txt
dirty-before path still dirty after run -> not evidence
clean-before path dirty after run       -> evidence
HEAD advanced                           -> committed diff evidence
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-04-assignment-runresult-hardening.md#unheaded-block-34

```text
Tests:

- a pre-existing dirty file does not produce `verified` or `inferred`;
- a new dirty file produced by the fake executor is evidence;
- a committed file between `gitBefore` and `gitAfter` is evidence;
- `.fgos/` internal files are excluded.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-04-assignment-runresult-hardening.md#54-distinguish-read-only-and-mutating-operations

````text
### 5.4 Distinguish Read-Only And Mutating Operations

V1 can infer read-only from role as a fallback, but role alone is not enough.

Add a small helper:

```js
isReadOnlyAssignment(assignment)
```

Initial rule:

```txt
reviewer/researcher/advisor => read-only unless operation id is explicitly
known mutating
implementer/helper          => mutating unless taskSpec/operation declares
read-only later
```

Do not add a broad YAML schema field unless Step 04 actually needs it. If a
field is added, use a narrow `effects: read-only | mutates-repo` operation hint
and validate it in doctor.

Tests:

- `validate-plan`, `review-item`, `scout-blast-radius`, `resolve-question`
  classify read-only;
- `implement-item`, `fix-verify-red`, `scoped-subtask` classify mutating.
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-04-assignment-runresult-hardening.md#unheaded-block-35

```text
V1 can infer read-only from role as a fallback, but role alone is not enough.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-04-assignment-runresult-hardening.md#unheaded-block-36

````text
Add a small helper:

```js
isReadOnlyAssignment(assignment)
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-04-assignment-runresult-hardening.md#unheaded-block-37

````text
Initial rule:

```txt
reviewer/researcher/advisor => read-only unless operation id is explicitly
known mutating
implementer/helper          => mutating unless taskSpec/operation declares
read-only later
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-04-assignment-runresult-hardening.md#unheaded-block-38

```text
Do not add a broad YAML schema field unless Step 04 actually needs it. If a
field is added, use a narrow `effects: read-only | mutates-repo` operation hint
and validate it in doctor.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-04-assignment-runresult-hardening.md#unheaded-block-39

```text
Tests:

- `validate-plan`, `review-item`, `scout-blast-radius`, `resolve-question`
  classify read-only;
- `implement-item`, `fix-verify-red`, `scoped-subtask` classify mutating.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-04-assignment-runresult-hardening.md#unheaded-block-40

```text
`evidence.json` should record not just `changedFiles`, but why each file counts.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-04-assignment-runresult-hardening.md#unheaded-block-41

````text
Suggested shape:

```json
{
  "gitBefore": "abc",
  "gitAfter": "def",
  "dirtyBefore": ["preexisting.md"],
  "dirtyAfter": ["preexisting.md", "new.md"],
  "changedFiles": ["new.md"],
  "changedFileReasons": {
    "new.md": "new-dirty-after-run"
  },
  "artifacts": [
    {
      "path": ".fgos/assignments/asgn_x/runs/01/agent-result.json",
      "kind": "agent-result",
      "valid": true
    }
  ],
  "tests": []
}
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-04-assignment-runresult-hardening.md#unheaded-block-42

```text
Keep `changedFiles` for compatibility. Add richer fields beside it.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-04-assignment-runresult-hardening.md#56-refuse-runtime-dispatch-for-non-resolving-taskspec

```text
### 5.6 Refuse Runtime Dispatch For Non-Resolving TaskSpec

`buildAssignment()` should reject runtime-ready assignments whose taskSpec file
does not exist.

Compatibility requirement:

- `operationsForStage()` may still synthesize read-only compatibility
  operations.
- `buildAssignment()` must not turn a synthetic missing-taskSpec operation into
  a dispatchable assignment by accident.

Implementation options:

1. Check `resolveTaskSpecPath()` in `buildAssignment()` and throw if missing.
2. Or add an option `allowSyntheticCompatibilityOperation: true` and default it
   to false.

Preferred: option 1 for V1, because runtime dispatch should be conservative.

Tests:

- `buildAssignment({ stage: 'decompose', operation: 'decompose' })` refuses
  until a real task-spec exists.
- existing declared operations still build.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-04-assignment-runresult-hardening.md#unheaded-block-43

```text
`buildAssignment()` should reject runtime-ready assignments whose taskSpec file
does not exist.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-04-assignment-runresult-hardening.md#unheaded-block-45

```text
- `operationsForStage()` may still synthesize read-only compatibility
  operations.
- `buildAssignment()` must not turn a synthetic missing-taskSpec operation into
  a dispatchable assignment by accident.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-04-assignment-runresult-hardening.md#unheaded-block-47

```text
1. Check `resolveTaskSpecPath()` in `buildAssignment()` and throw if missing.
2. Or add an option `allowSyntheticCompatibilityOperation: true` and default it
   to false.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-04-assignment-runresult-hardening.md#unheaded-block-48

```text
Preferred: option 1 for V1, because runtime dispatch should be conservative.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-04-assignment-runresult-hardening.md#unheaded-block-49

```text
Tests:

- `buildAssignment({ stage: 'decompose', operation: 'decompose' })` refuses
  until a real task-spec exists.
- existing declared operations still build.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-04-assignment-runresult-hardening.md#unheaded-block-50

```text
No changes to `spawnWorker()` or `loop.mjs` should be required. Existing
`stage.skill/taskSpec` dispatch path must stay green.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-04-assignment-runresult-hardening.md#unheaded-block-52

````text
```bash
node --test test/runner/dispatch.test.mjs
node --test test/runner/loop.test.mjs
node --test test/cli/fgos-workflow.test.mjs
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-04-assignment-runresult-hardening.md#unheaded-block-53

```text
Step 04 is done when:

- assignment prompt names concrete result artifact paths;
- fake executor can write a valid `agent-result.json` and get `reported`;
- malformed `agent-result.json` produces failed RunResult;
- dirty-before files do not count as run evidence;
- new post-run dirty files or committed diffs count as evidence;
- mutating assignment cannot be `verified` without post-run external evidence;
- read-only assignment cannot be `reported` without a valid claim and artifact;
- missing task-spec assignment is refused before spawn;
- existing Work dispatch tests still pass.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-04-assignment-runresult-hardening.md#unheaded-block-54

```text
Create a temporary assignment for `planning.validate-plan` attached to an
existing planning-stage Work item.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-04-assignment-runresult-hardening.md#unheaded-block-55

```text
Expected:

1. `assignment.json` is written.
2. `run.json` is written before spawn.
3. Worker prompt contains `agent-result.json` path.
4. Fake or real worker writes `agent-result.json`.
5. `result.json` returns `status: done`, `confidence: reported` only for a
   valid read-only report.
6. If the worker exits zero but writes nothing, `result.json` returns
   `status: no-evidence`, `confidence: no-evidence`.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-04-assignment-runresult-hardening.md#unheaded-block-56

```text
Rollback only the Step 04 hardening helpers and tests. Keep Step 01-03
Assignment surfaces, because they remain useful as read-only and fake-executor
validated infrastructure.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-05-coding-driver-operation-choice.md#unheaded-block-2

```text
Teach the coding driver to choose legal stage operations when the current stage
needs team collaboration.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-05-coding-driver-operation-choice.md#unheaded-block-3

```text
The driver should remain a lifecycle driver, not an orchestrator:
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-05-coding-driver-operation-choice.md#unheaded-block-4

````text
```txt
driver reads Work
driver sees current stage
driver chooses one legal operation
driver executes or invokes it
driver consumes evidence
driver either loops, stops, or calls an engine verb
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-05-coding-driver-operation-choice.md#unheaded-block-5

```text
Step 04 must be complete. The driver must not consume Assignment RunResults
until false-success and missing-artifact paths are hardened.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-05-coding-driver-operation-choice.md#unheaded-block-6

```text
- Do not create Mission lifecycle.
- Do not create child Work for every secondary operation.
- Do not make Herdr truth.
- Do not replace `fgos-coding-driving` with a new router.
- Do not remove primary `stage.skill/taskSpec` compatibility.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-05-coding-driver-operation-choice.md#unheaded-block-8

```text
- `domains/coding/skills/fgos-coding-driving/SKILL.md`
- `domains/coding/skills/fgos-coding-planning/SKILL.md`
- `domains/coding/skills/fgos-coding-validating/SKILL.md`
- `domains/coding/skills/fgos-coding-implement/SKILL.md`
- `domains/coding/skills/fgos-coding-discovering/SKILL.md`
- relevant references under `domains/coding/skills/*/references/`
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-05-coding-driver-operation-choice.md#unheaded-block-9

```text
Expected code files:

- `src/runner/loop.mjs` only if the runtime loop itself gets operation choice
  hooks;
- `src/runner/dispatch/assignment.mjs`;
- `src/runner/dispatch/assignment-runner.mjs`;
- possibly a new small module such as
  `src/runner/dispatch/operation-choice.mjs`.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-05-coding-driver-operation-choice.md#unheaded-block-10

```text
Expected tests:

- `test/runner/assignment-dispatch.test.mjs`
- `test/runner/assignment-runresult.test.mjs`
- `test/runner/loop.test.mjs`
- `test/skills/*` tests that pin skill prose behavior if present.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-05-coding-driver-operation-choice.md#unheaded-block-11

```text
Add one pure helper before wiring any stage skill:
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-05-coding-driver-operation-choice.md#unheaded-block-12

````text
```js
chooseStageOperation({
  work,
  stage,
  domain,
  workflow,
  availableOperations,
  driverIntent,
  lastRunResult,
  contextSignals
})
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-05-coding-driver-operation-choice.md#unheaded-block-13

```text
Initial V1 can be deterministic and conservative. It does not need LLM
judgment.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-05-coding-driver-operation-choice.md#unheaded-block-15

````text
```json
{
  "operation": "validate-plan",
  "reason": "plan-written-needs-reality-check",
  "dispatch": "assignment",
  "stop": false
}
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-05-coding-driver-operation-choice.md#unheaded-block-17

````text
```json
{
  "operation": "shape-plan",
  "reason": "primary-stage-owner-work",
  "dispatch": "direct-stage-skill",
  "stop": false
}
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-05-coding-driver-operation-choice.md#unheaded-block-18

````text
```json
{
  "operation": null,
  "reason": "awaiting-human",
  "dispatch": null,
  "stop": true
}
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-05-coding-driver-operation-choice.md#unheaded-block-19

```text
The helper must not mutate Work, create assignments, or spawn executors.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-05-coding-driver-operation-choice.md#unheaded-block-20

````text
Default:

```txt
discovery -> judge-ambiguity primary path
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-05-coding-driver-operation-choice.md#unheaded-block-21

```text
Use researcher Assignment only when the discovery owner identifies a concrete
bounded evidence gap. Discovery must not ask the human directly.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-05-coding-driver-operation-choice.md#unheaded-block-22

```text
If the result is:

- `reported` with clear evidence: owner may incorporate it and decide
  `clear`/`unclear`;
- `no-evidence`: retry once or route to `unclear`;
- `failed`: stop as system block;
- `blocked`: route to `unclear` if the blocker is product ambiguity, otherwise
  stop as system block.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-05-coding-driver-operation-choice.md#unheaded-block-23

````text
Default:

```txt
planning -> shape-plan primary path
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-05-coding-driver-operation-choice.md#unheaded-block-24

```text
Once plan.md exists and contains no outstanding planning-authoring gap, choose:
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-05-coding-driver-operation-choice.md#unheaded-block-25

````text
```txt
planning.validate-plan -> reviewer Assignment
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-05-coding-driver-operation-choice.md#unheaded-block-27

```text
- `reported` with verdict `READY`: driver may proceed to the existing
  `fgos plan` engine call path;
- `reported` with `READY WITH CONSTRAINTS`: driver may proceed only if
  constraints are written into plan.md or the gate accepts them;
- `reported` with `NOT READY - RETURN TO PLANNING`: invoke planning again;
- `no-evidence`: do not move stage; request a proper validation artifact or
  retry once;
- `failed`: stop with error category;
- `blocked`: if product input needed, route to exploring/advisor; otherwise
  stop.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-05-coding-driver-operation-choice.md#unheaded-block-28

```text
Do not let `validate-plan` itself call `fgos plan` once it is running as a
reviewer Assignment. The lifecycle driver owns the engine verb.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-05-coding-driver-operation-choice.md#unheaded-block-29

````text
Default:

```txt
executing -> implement-item primary path
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-05-coding-driver-operation-choice.md#unheaded-block-30

```text
Use secondary operations only for bounded cases:
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-05-coding-driver-operation-choice.md#unheaded-block-31

```text
- `scout-blast-radius`: before editing a risky symbol when impact is unknown;
- `scoped-subtask`: independent helper work with non-overlapping footprint;
- `review-item`: after a candidate implementation or returned diff needs
  review;
- `fix-verify-red`: after a specific verify/review failure is known.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-05-coding-driver-operation-choice.md#unheaded-block-32

```text
Result handling:

- mutating helper work requires `verified`;
- read-only review/research can feed driver judgment at `reported`;
- `inferred` is inspection-only until a human/driver confirms;
- `no-evidence` never advances Work;
- failed or blocked stops or routes according to blocker type.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-05-coding-driver-operation-choice.md#unheaded-block-33

````text
Add a section:

```txt
Operation-aware loop
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-05-coding-driver-operation-choice.md#unheaded-block-34

```text
It should say:

- the driver first checks lifecycle stops and ceilings exactly as today;
- then it resolves `operationsForStage`;
- primary operation keeps the old direct stage-skill path;
- secondary operation creates an Assignment only when the stage skill or
  deterministic rule selects it;
- Assignment result is evidence input, not lifecycle movement;
- only engine verbs move Work.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-05-coding-driver-operation-choice.md#unheaded-block-36

````text
```txt
Before Step 05 adoption, load fgos-coding-validating directly as the
compatibility path. After Step 05 adoption, the driver should represent this as
planning.validate-plan reviewer Assignment and the driver owns the eventual
fgos plan call.
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-05-coding-driver-operation-choice.md#unheaded-block-37

```text
Reconcile role prose:

- When running as direct compatibility path, validating may be same-session
  implementer function.
- When running as `planning.validate-plan` Assignment, it is a reviewer-role
  operation.
- The reviewer Assignment must not call `fgos plan`; it writes verdict
  artifacts only.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-05-coding-driver-operation-choice.md#unheaded-block-38

````text
Add explicit mapping:

```txt
consult -> scout-blast-radius or resolve-question Assignment
assist  -> scoped-subtask Assignment
review  -> review-item Assignment
fix     -> fix-verify-red operation, usually direct implementer path
advise  -> async advisor path, not cli-spawn unless explicitly supported
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-05-coding-driver-operation-choice.md#unheaded-block-40

```text
1. Add operation-choice helper and unit tests.
2. Add driver support for `planning.validate-plan` only.
3. Keep discovery and executing prose-updated but not runtime-wired in the same
   slice unless tests prove the planning path stable.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-05-coding-driver-operation-choice.md#unheaded-block-41

````text
Reason:

```txt
planning.validate-plan is read-only, bounded, and already has a clear
RunResult artifact contract after Step 04.
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-05-coding-driver-operation-choice.md#unheaded-block-42

````text
Required tests:

```bash
node --test test/runner/assignment-runresult.test.mjs
node --test test/runner/assignment-dispatch.test.mjs
node --test test/runner/loop.test.mjs
node --test test/cli/fgos-workflow.test.mjs
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-05-coding-driver-operation-choice.md#unheaded-block-43

```text
Add focused tests:

- driver chooses primary path when no plan.md exists;
- driver chooses `validate-plan` when plan.md exists and validation is due;
- `validate-plan` `no-evidence` does not call `fgos plan`;
- `validate-plan` `READY` with `reported` allows existing planning edge path;
- `validate-plan` invalid operation is refused;
- `dispatch: human-only` operation is not executed;
- discovery still cannot ask human directly.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-05-coding-driver-operation-choice.md#unheaded-block-44

```text
Step 05 is done when:

- coding driver can choose at least one secondary operation;
- Work lifecycle remains owned by existing engine verbs;
- primary stage path still works unchanged;
- `planning.validate-plan` can run as reviewer Assignment;
- reviewer Assignment writes RunResult artifacts and never moves Work directly;
- driver consumes RunResult confidence conservatively;
- tests prove `no-evidence` and `failed` cannot advance stage/status;
- skill prose and task-spec prose no longer contradict role ownership.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-05-coding-driver-operation-choice.md#unheaded-block-45

```text
Use one planning-stage Work item with a committed `plan.md`.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-05-coding-driver-operation-choice.md#unheaded-block-46

```text
Expected path:

1. Driver reads Work at `stage: planning`.
2. Driver sees plan exists and selects `validate-plan`.
3. Driver builds Assignment attached to the Work id.
4. Driver executes Assignment.
5. Reviewer writes `agent-result.json` with verdict.
6. Driver reads RunResult.
7. If `reported` and verdict READY, driver invokes the existing `fgos plan`
   path.
8. If `no-evidence`, driver stops without moving Work.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-05-coding-driver-operation-choice.md#unheaded-block-47

```text
Rollback only the operation-choice wiring. Keep Step 04 evidence hardening and
read-only operation surfaces.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-06-work-attached-team-adoption.md#unheaded-block-2

```text
Move Team Dispatch V1 from tested infrastructure into real coding-domain
workflow usage.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-06-work-attached-team-adoption.md#unheaded-block-3

````text
Adoption means:

```txt
real Work item
real stage
declared operation
Assignment
RunResult
driver decision
existing Work lifecycle verb
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-06-work-attached-team-adoption.md#unheaded-block-4

```text
It does not mean every interaction becomes an Assignment.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-06-work-attached-team-adoption.md#unheaded-block-5

```text
- Step 04 complete.
- Step 05 complete for `planning.validate-plan`.
- `fgos doctor` Team Dispatch checks pass:
  - `task-specs-resolve`;
  - `agent-claims-resolve`;
  - `domain-workflow-operations-coverage`;
  - dispatch decide hook wired;
  - config not stale.
- Existing primary Work path remains green.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-06-work-attached-team-adoption.md#slice-61-planning-validate-plan-on-one-real-item

```text
### Slice 6.1: Planning Validate-Plan On One Real Item

Use `planning.validate-plan` because it is read-only and bounded.

Files likely touched:

- driver/loop operation-choice code from Step 05;
- test fixtures for a planning-stage item with docsRef and plan.md;
- no workflow YAML change expected.

Acceptance:

- one real planning item can run reviewer Assignment;
- result is `reported` or a conservative stop;
- no direct Work lifecycle movement happens inside the reviewer Assignment.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-06-work-attached-team-adoption.md#unheaded-block-6

```text
Use `planning.validate-plan` because it is read-only and bounded.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-06-work-attached-team-adoption.md#unheaded-block-7

```text
Files likely touched:

- driver/loop operation-choice code from Step 05;
- test fixtures for a planning-stage item with docsRef and plan.md;
- no workflow YAML change expected.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-06-work-attached-team-adoption.md#unheaded-block-8

```text
Acceptance:

- one real planning item can run reviewer Assignment;
- result is `reported` or a conservative stop;
- no direct Work lifecycle movement happens inside the reviewer Assignment.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-06-work-attached-team-adoption.md#unheaded-block-9

```text
Use `executing.review-item` after a candidate implementation exists.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-06-work-attached-team-adoption.md#unheaded-block-10

```text
Acceptance:

- review Assignment reads diff/verify evidence refs;
- reviewer writes findings or approve verdict;
- driver uses verdict to choose approve path, reject/fix path, or stop;
- review result alone does not merge.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-06-work-attached-team-adoption.md#slice-63-executing-scout-blast-radius

```text
### Slice 6.3: Executing Scout-Blast-Radius

Use `executing.scout-blast-radius` before risky edits.

Acceptance:

- researcher Assignment writes blast-radius report;
- degraded/inactive impact-analysis posture is explicit;
- driver treats report as `reported`, not `verified`;
- implementation still requires normal verify/return.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-06-work-attached-team-adoption.md#unheaded-block-11

```text
Use `executing.scout-blast-radius` before risky edits.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-06-work-attached-team-adoption.md#unheaded-block-12

```text
Acceptance:

- researcher Assignment writes blast-radius report;
- degraded/inactive impact-analysis posture is explicit;
- driver treats report as `reported`, not `verified`;
- implementation still requires normal verify/return.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-06-work-attached-team-adoption.md#unheaded-block-13

```text
Use `executing.scoped-subtask` only when the footprint is independent.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-06-work-attached-team-adoption.md#unheaded-block-14

```text
Acceptance:

- helper Assignment declares expected touched files;
- helper result must be `verified`;
- driver refuses to proceed if helper touched undeclared or overlapping files;
- child Work is still preferred when the helper needs independent lifecycle.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-06-work-attached-team-adoption.md#unheaded-block-15

```text
- Do not allow Assignment execution to bypass `dispatch decide`.
- Do not let CLI override model/provider bypass egress governance.
- Do not trust Herdr pane status.
- Do not advance Work from `inferred` unless a human/driver explicitly accepts
  the evidence in a later hardened rule.
- Do not auto-retry more than once without a new reason.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-06-work-attached-team-adoption.md#5-evidence-requirements-by-operation

```text
## 5. Evidence Requirements By Operation

| Operation | Minimum acceptable confidence | Additional requirement |
|---|---|---|
| `validate-plan` | `reported` | structured verdict and feasibility matrix artifact |
| `review-item` | `reported` | structured approve/reject findings tied to diff/verify refs |
| `scout-blast-radius` | `reported` | named files/symbols and search/graph posture |
| `resolve-question` | `reported` | direct answer, citations, remaining uncertainty |
| `scoped-subtask` | `verified` | post-run changed files or commit; verify evidence |
| `fix-verify-red` | `verified` | changed files plus rerun failing verify |
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-06-work-attached-team-adoption.md#unheaded-block-16

```text
| Operation | Minimum acceptable confidence | Additional requirement |
|---|---|---|
| `validate-plan` | `reported` | structured verdict and feasibility matrix artifact |
| `review-item` | `reported` | structured approve/reject findings tied to diff/verify refs |
| `scout-blast-radius` | `reported` | named files/symbols and search/graph posture |
| `resolve-question` | `reported` | direct answer, citations, remaining uncertainty |
| `scoped-subtask` | `verified` | post-run changed files or commit; verify evidence |
| `fix-verify-red` | `verified` | changed files plus rerun failing verify |
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-06-work-attached-team-adoption.md#unheaded-block-17

```text
Add integration-style tests with fake executors:
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-06-work-attached-team-adoption.md#unheaded-block-18

```text
- planning validate-plan happy path;
- planning validate-plan no-evidence stop;
- executing review-item reject routes to fix operation;
- executing scout-blast-radius report does not mutate Work;
- scoped-subtask requires changed-file evidence;
- governance-blocked executor returns a stop, not success;
- Herdr/visibility fields do not affect confidence.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-06-work-attached-team-adoption.md#unheaded-block-19

````text
Run:

```bash
node --test test/runner/assignment-runresult.test.mjs
node --test test/runner/assignment-dispatch.test.mjs
node --test test/runner/loop.test.mjs
node --test test/e2e/runner-loop.test.mjs
node bin/fgos.mjs doctor
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-06-work-attached-team-adoption.md#unheaded-block-20

```text
If full doctor is red for unrelated repo-state issues, record the unrelated
checks and require the Team Dispatch checks to pass.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-06-work-attached-team-adoption.md#unheaded-block-21

```text
Pick a low-risk docs or test-only Work item.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-06-work-attached-team-adoption.md#unheaded-block-23

```text
- Work item is at `stage: planning`;
- `docsRef` exists;
- `plan.md` exists and is committed;
- item has no open child blockers.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-06-work-attached-team-adoption.md#unheaded-block-24

````text
Manual run:

```bash
node bin/fgos.mjs workflow operations --stage planning
node src/runner/dispatch.mjs decide --assignment <assignment-id> --has-live-task-access
node src/runner/dispatch.mjs execute --assignment <assignment-id> --cwd <worktree> --repo-root <main-root>
```
````

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-06-work-attached-team-adoption.md#unheaded-block-25

```text
Expected evidence:

- `.fgos/assignments/<assignment-id>/assignment.json`;
- `.fgos/assignments/<assignment-id>/runs/01/run.json`;
- `dispatch-plan.json`;
- `agent-result.json`;
- `evidence.json`;
- `result.json`.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-06-work-attached-team-adoption.md#unheaded-block-27

```text
- `reported READY` can feed the existing planning edge;
- `no-evidence` stops;
- `failed` stops;
- `blocked` routes by blocker type;
- Work status/stage changes only through existing engine verbs.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-06-work-attached-team-adoption.md#unheaded-block-28

```text
Step 06 is done when at least two real Work-attached operations have been used:
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-06-work-attached-team-adoption.md#unheaded-block-29

```text
1. one read-only operation, preferably `planning.validate-plan`;
2. one executing-stage operation, preferably `review-item` or
   `scout-blast-radius`.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-06-work-attached-team-adoption.md#unheaded-block-31

```text
- command transcript;
- assignment/run/result files;
- driver decision;
- final Work state;
- any rollback or manual intervention.
```

### docs/platform/agent-coordination/roadmap/team-dispatch-v1/step-06-work-attached-team-adoption.md#unheaded-block-32

```text
Disable operation-aware driver selection and fall back to primary stage skill
path. Do not delete stored assignment/run evidence; it remains useful for
audit.
```

### docs/platform/agent-coordination/verification/README.md#unheaded-block-2

```text
Added in candidate: The migration navigation paragraph, evidence-root table and Proof Preservation pointer below predate this batch (`fcfe78cb8`); they are candidate navigation, not newly verified conformance. During migration, target docs link to retained legacy proof roots. The mirrored
target directories remain navigable copies, but do not replace the dated
evidence artifacts or their recorded environments.
```

### docs/platform/agent-coordination/verification/README.md#unheaded-block-3

```text
- [Team Dispatch V1 trace](team-dispatch-v1/index.md) records cell-level
  implementation, review, red-team, and live proof evidence.
```

### docs/platform/agent-coordination/verification/README.md#unheaded-block-4

```text
| Evidence set | Supports | Current proof root |
|---|---|---|
| Foundation and standalone coordination | CoordinationSession, FlowDefinition, and Work-isolation boundaries | [Step 08](../../../architect/agent-coordination/verification/step-08-standalone-coordination/index.md) |
| Runtime recovery | admission fencing, launch reconciliation, fallback, and recovery status split | [Runtime recovery](../../../architect/agent-coordination/verification/runtime-recovery/) |
| Dispatch operability | worker claim, execution-contract persistence, RunResult v2, inspect, and reconcile boundaries | [Dispatch operability](../../../architect/agent-coordination/verification/dispatch-operability-implementation/) |
| Executor policy and placement | executor-policy baseline and placement-policy limits | [Executor-policy seams](../../../architect/agent-coordination/verification/executor-policy-dispatch-seams/p00.md) |
| Code implementation track policy | targeted proof per cell and full proof at declared gates | [Track policy](../../../architect/agent-coordination/verification/code-implementation-track-policy/) |
| Group thinking | protocol, cohort, and advisory-panel evidence, including known quality gaps | [Step 09 evidence](../../../architect/agent-coordination/verification/step-09-mvp6-to-mvp9/index.md) |
| Visibility / Herdr | visibility-only boundary | [Live proof](../../../architect/agent-coordination/verification/visibility-herdr/v0-live-proof-2026-09-07.md) |
| Team Dispatch V1 | original cell-level implementation, review, red-team, and live proof | [Team Dispatch V1](../../../architect/agent-coordination/verification/team-dispatch-v1/index.md) |
```

### docs/platform/agent-coordination/verification/README.md#unheaded-block-5

```text
The phase-by-phase move policy and known gaps are in
[Proof Preservation](../history/documentation-migration/proof-preservation.md).
```

### docs/platform/agent-coordination/verification/README.md#unheaded-block-6

```text
Verification establishes implementation conformance at a point in time. It does
not define architecture or change a contract.
```

### docs/platform/agent-coordination/verification/README.md#unheaded-block-8

```text
- deterministic unit/integration tests;
- negative and adversarial tests;
- live provider/executor scenarios;
- traceability matrix from requirement to code/test/evidence;
- known unrelated failures;
- date/commit/configuration of the proof.
```

### docs/platform/agent-coordination/vision.md#unheaded-block-2

```text
Read this document before every other agent-coordination document.
```

### docs/platform/agent-coordination/vision.md#unheaded-block-3

```text
This Vision is the highest authority for what Agent Coordination is, what it
must enable, and which concerns belong in the foundation versus a domain. ADRs,
architecture, contracts, proposals, roadmaps, Skills, and implementation define
more specific behavior underneath it. They may refine this Vision but must not
silently narrow or contradict it.
```

### docs/platform/agent-coordination/vision.md#unheaded-block-4

```text
The [Intent Preservation Ledger](intent-preservation-ledger.md) is the required
second read. It does not outrank this Vision or make deferred ideas accepted
architecture. It makes deliberate narrowing visible and records what each
increment must not preclude, so a temporary MVP does not silently replace the
original direction.
```

### docs/platform/agent-coordination/vision.md#unheaded-block-5

```text
When a downstream document conflicts with this Vision:
```

### docs/platform/agent-coordination/vision.md#unheaded-block-6

```text
1. preserve the Vision boundary;
2. mark the downstream design or implementation as drifted;
3. reconcile the downstream document explicitly;
4. change this Vision first if the product direction itself must change.
```

### docs/platform/agent-coordination/vision.md#unheaded-block-7

```text
This authority does not make the Vision a field-level runtime contract. Exact
schemas, state transitions, compatibility, and validation rules remain owned by
accepted contracts and ADRs.
```

### docs/platform/agent-coordination/vision.md#unheaded-block-8

```text
Agent Coordination is the domain-neutral foundation that turns an objective
into governed, evidence-aware activity across agents, capabilities, souls,
providers, models, tiers, and execution mechanisms.
```

### docs/platform/agent-coordination/vision.md#unheaded-block-9

```text
It must work with or without Work and with or without a predeclared Workflow or
Coordination Protocol. A coordinator agent may reason from a Mission/objective,
create and revise a runtime plan, delegate bounded requests, consult or
challenge other roles, and synthesize results. Declarative protocols and domain
harnesses may constrain or improve that process, but they are augmentation, not
an entry requirement.
```

### docs/platform/agent-coordination/vision.md#unheaded-block-10

```text
The foundation owns the durable execution invariants that free-form prose must
not own: dispatch governance, bounded execution, authority checks, budgets,
Run provenance, normalized results, evidence quality, and safe integration
boundaries.
```

### docs/platform/agent-coordination/vision.md#unheaded-block-11

```text
Domain and organization layers add differentiated experience: knowledge,
doctrine, Skills, protocol templates, planning harnesses, validators, evidence
policy, resource analysis, isolation strategy, and lifecycle integration.
```

### docs/platform/agent-coordination/vision.md#unheaded-block-12

````text
```txt
Mission / objective
  -> Agent Coordination Foundation
       -> coordinator reasoning and runtime planning
       -> semantic execution contracts
       -> governed dispatch
       -> Assignment -> Run -> RunResult / Evidence
       -> bounded adaptation and synthesis
  -> optional augmentation
       -> reusable Coordination Protocol
       -> domain knowledge / doctrine / Skills
       -> domain planning and validation harness
       -> organization-specific policy and experience
       -> optional Work integration
```
````

### docs/platform/agent-coordination/vision.md#1-coordination-has-been-too-closely-identified-with-work

```text
### 1. Coordination Has Been Too Closely Identified With Work

Work is a durable, human-managed delivery lifecycle. Research, brainstorm,
consult, debate, review, and internal decomposition often need coordination but
do not need backlog identity, acceptance, approval, a durable branch, or merge
lifecycle.

Requiring placeholder Work for every collaboration creates dashboard noise and
makes an integration profile look like the identity of the system.
```

### docs/platform/agent-coordination/vision.md#unheaded-block-13

```text
Work is a durable, human-managed delivery lifecycle. Research, brainstorm,
consult, debate, review, and internal decomposition often need coordination but
do not need backlog identity, acceptance, approval, a durable branch, or merge
lifecycle.
```

### docs/platform/agent-coordination/vision.md#unheaded-block-14

```text
Requiring placeholder Work for every collaboration creates dashboard noise and
makes an integration profile look like the identity of the system.
```

### docs/platform/agent-coordination/vision.md#2-planning-currently-over-materializes-work

```text
### 2. Planning Currently Over-Materializes Work

Current coding planning materializes every decomposed child through Work intake.
That is correct for independently governable delivery units and too heavy for
temporary research branches, review passes, specialist consultations, or
bounded tasks returning to one parent objective.

The system lacks a neutral way to represent session-local intent and dependency
without creating another Work item.
```

### docs/platform/agent-coordination/vision.md#unheaded-block-15

```text
Current coding planning materializes every decomposed child through Work intake.
That is correct for independently governable delivery units and too heavy for
temporary research branches, review passes, specialist consultations, or
bounded tasks returning to one parent objective.
```

### docs/platform/agent-coordination/vision.md#unheaded-block-16

```text
The system lacks a neutral way to represent session-local intent and dependency
without creating another Work item.
```

### docs/platform/agent-coordination/vision.md#3-standalone-coordination-borrows-coding-workflow-structure

```text
### 3. Standalone Coordination Borrows Coding Workflow Structure

The mission-lite prototype proves that read-only Assignments can run with
`workId: null`, but it selects operations from coding Workflow stages and has no
general runtime task graph. A standalone objective should not pretend to be at
`planning` or `executing` merely to access dispatch.
```

### docs/platform/agent-coordination/vision.md#unheaded-block-17

```text
The mission-lite prototype proves that read-only Assignments can run with
`workId: null`, but it selects operations from coding Workflow stages and has no
general runtime task graph. A standalone objective should not pretend to be at
`planning` or `executing` merely to access dispatch.
```

### docs/platform/agent-coordination/vision.md#4-predeclared-structure-has-been-treated-as-universally-mandatory

```text
### 4. Predeclared Structure Has Been Treated As Universally Mandatory

Workflow, Stage, Stage Operation, TaskSpec, and Skill provide valuable
repeatability and hard-and-soft coordination. They are not the only legitimate
source of coordination structure.

Research and brainstorm can often be planned competently by an agent from the
objective and current evidence. Their task graph may be created incrementally
at runtime. Forcing every such objective through a predeclared graph adds
ceremony without adding safety.
```

### docs/platform/agent-coordination/vision.md#unheaded-block-18

```text
Workflow, Stage, Stage Operation, TaskSpec, and Skill provide valuable
repeatability and hard-and-soft coordination. They are not the only legitimate
source of coordination structure.
```

### docs/platform/agent-coordination/vision.md#unheaded-block-19

```text
Research and brainstorm can often be planned competently by an agent from the
objective and current evidence. Their task graph may be created incrementally
at runtime. Forcing every such objective through a predeclared graph adds
ceremony without adding safety.
```

### docs/platform/agent-coordination/vision.md#5-generic-and-domain-specific-planning-concerns-are-mixed

```text
### 5. Generic And Domain-Specific Planning Concerns Are Mixed

Coding needs special reasoning about files, Git indexes, generated output,
lockfiles, worktrees, verification, and merge topology. Other domains may have
different resources and risks, or may need no specialized planning harness at
all.

Putting coding-specific planning rules in the foundation prevents the
foundation from remaining reusable. Omitting all hard runtime rules, however,
would reduce it to an unsafe multi-agent prompt loop.
```

### docs/platform/agent-coordination/vision.md#unheaded-block-20

```text
Coding needs special reasoning about files, Git indexes, generated output,
lockfiles, worktrees, verification, and merge topology. Other domains may have
different resources and risks, or may need no specialized planning harness at
all.
```

### docs/platform/agent-coordination/vision.md#unheaded-block-21

```text
Putting coding-specific planning rules in the foundation prevents the
foundation from remaining reusable. Omitting all hard runtime rules, however,
would reduce it to an unsafe multi-agent prompt loop.
```

### docs/platform/agent-coordination/vision.md#unheaded-block-23

```text
- a mandatory workflow engine that makes every collaboration preconfigured and
  domain-shaped;
- unrestricted prose that may launch executors, grant itself authority, spend
  unbounded budget, mutate state, or declare its own evidence verified.
```

### docs/platform/agent-coordination/vision.md#v-001-agent-coordination-is-a-foundation-layer

```text
### V-001: Agent Coordination Is A Foundation Layer

The core is domain-neutral. It coordinates semantic execution and evidence; it
does not encode one domain's preferred problem-solving workflow.
```

### docs/platform/agent-coordination/vision.md#unheaded-block-24

```text
The core is domain-neutral. It coordinates semantic execution and evidence; it
does not encode one domain's preferred problem-solving workflow.
```

### docs/platform/agent-coordination/vision.md#v-002-work-is-optional-integration-not-system-identity

```text
### V-002: Work Is Optional Integration, Not System Identity

A coordination activity may be Work-attached or standalone. Work remains the
sole authority whenever delivery lifecycle exists. Mission, Session, task,
Assignment, Run, RunResult, protocol, or synthesis cannot become a second Work
lifecycle.
```

### docs/platform/agent-coordination/vision.md#unheaded-block-25

```text
A coordination activity may be Work-attached or standalone. Work remains the
sole authority whenever delivery lifecycle exists. Mission, Session, task,
Assignment, Run, RunResult, protocol, or synthesis cannot become a second Work
lifecycle.
```

### docs/platform/agent-coordination/vision.md#v-003-a-predeclared-workflow-or-protocol-is-optional

```text
### V-003: A Predeclared Workflow Or Protocol Is Optional

A session may use:

- agent-led runtime planning;
- a declared Workflow or Coordination Protocol;
- a domain planning harness;
- a composition of those sources.

A one-shot consult may lower directly to one Assignment. A research session may
create a runtime task graph incrementally. A repeatable or regulated process may
select a declared protocol graph.

These are composable sources of planning and constraints, not mutually
exclusive top-level lifecycle modes.
```

### docs/platform/agent-coordination/vision.md#unheaded-block-26

```text
A session may use:

- agent-led runtime planning;
- a declared Workflow or Coordination Protocol;
- a domain planning harness;
- a composition of those sources.
```

### docs/platform/agent-coordination/vision.md#unheaded-block-27

```text
A one-shot consult may lower directly to one Assignment. A research session may
create a runtime task graph incrementally. A repeatable or regulated process may
select a declared protocol graph.
```

### docs/platform/agent-coordination/vision.md#unheaded-block-28

```text
These are composable sources of planning and constraints, not mutually
exclusive top-level lifecycle modes.
```

### docs/platform/agent-coordination/vision.md#v-004-runtime-execution-contracts-are-mandatory

```text
### V-004: Runtime Execution Contracts Are Mandatory

Optional predeclared structure does not mean optional execution contracts.
Every executable request must lower to a validated semantic contract containing
at least:

- objective and bounded context references;
- constraints and authority;
- expected outputs;
- mutation policy;
- evidence expectations;
- role/capability requirements;
- budget or execution bounds;
- caller/session provenance.

A registered Stage Operation and TaskSpec may supply that contract. Agent-led
planning may supply an inline contract that passes the same foundation-level
validation. The exact inline schema remains a contract-design decision.
```

### docs/platform/agent-coordination/vision.md#unheaded-block-29

```text
Optional predeclared structure does not mean optional execution contracts.
Every executable request must lower to a validated semantic contract containing
at least:
```

### docs/platform/agent-coordination/vision.md#unheaded-block-30

```text
- objective and bounded context references;
- constraints and authority;
- expected outputs;
- mutation policy;
- evidence expectations;
- role/capability requirements;
- budget or execution bounds;
- caller/session provenance.
```

### docs/platform/agent-coordination/vision.md#unheaded-block-31

```text
A registered Stage Operation and TaskSpec may supply that contract. Agent-led
planning may supply an inline contract that passes the same foundation-level
validation. The exact inline schema remains a contract-design decision.
```

### docs/platform/agent-coordination/vision.md#v-005-agents-own-adaptive-reasoning-the-foundation-owns-authority

````text
### V-005: Agents Own Adaptive Reasoning; The Foundation Owns Authority

Skill/prose and coordinator agents may propose tasks, roles, capabilities,
fan-out, follow-ups, reviews, and next actions. They may not directly bypass
dispatch, grant mutation permission, weaken evidence policy, expand budget
without authorization, or mutate Work lifecycle.

```txt
agent / Skill       -> proposes semantic action
policy / harness    -> validates and enriches constraints
dispatch            -> resolves execution infrastructure
runtime             -> records attempt and result
driver / caller     -> applies authorized lifecycle action, if any
```
````

### docs/platform/agent-coordination/vision.md#unheaded-block-32

```text
Skill/prose and coordinator agents may propose tasks, roles, capabilities,
fan-out, follow-ups, reviews, and next actions. They may not directly bypass
dispatch, grant mutation permission, weaken evidence policy, expand budget
without authorization, or mutate Work lifecycle.
```

### docs/platform/agent-coordination/vision.md#unheaded-block-33

````text
```txt
agent / Skill       -> proposes semantic action
policy / harness    -> validates and enriches constraints
dispatch            -> resolves execution infrastructure
runtime             -> records attempt and result
driver / caller     -> applies authorized lifecycle action, if any
```
````

### docs/platform/agent-coordination/vision.md#v-006-planning-is-pluggable-and-composable

```text
### V-006: Planning Is Pluggable And Composable

The foundation must accept planning intelligence from an agent, a declarative
protocol, or a domain/organization harness without forking the execution core.

Domain planning may enrich or reject an agent proposal. For example, coding may
derive resource claims, detect file overlap, require isolated worktrees, and
constrain merge targets. Research may rely only on generic dependency, budget,
duplicate-intent, source-quality, and evidence rules.
```

### docs/platform/agent-coordination/vision.md#unheaded-block-34

```text
The foundation must accept planning intelligence from an agent, a declarative
protocol, or a domain/organization harness without forking the execution core.
```

### docs/platform/agent-coordination/vision.md#unheaded-block-35

```text
Domain planning may enrich or reject an agent proposal. For example, coding may
derive resource claims, detect file overlap, require isolated worktrees, and
constrain merge targets. Research may rely only on generic dependency, budget,
duplicate-intent, source-quality, and evidence rules.
```

### docs/platform/agent-coordination/vision.md#v-007-dispatch-is-a-primary-foundation-capability

```text
### V-007: Dispatch Is A Primary Foundation Capability

Semantic roles are not executors. An Assignment expresses the capability,
role, policy, privacy, context, and evidence needs of an action. Dispatch
resolves the appropriate executor, provider, model, tier, soul/profile,
mechanism, and adapter under governance.

No Workflow, Skill, domain harness, coordinator, or external agent may invoke
execution infrastructure as a private bypass around the dispatch control plane.
```

### docs/platform/agent-coordination/vision.md#unheaded-block-36

```text
Semantic roles are not executors. An Assignment expresses the capability,
role, policy, privacy, context, and evidence needs of an action. Dispatch
resolves the appropriate executor, provider, model, tier, soul/profile,
mechanism, and adapter under governance.
```

### docs/platform/agent-coordination/vision.md#unheaded-block-37

```text
No Workflow, Skill, domain harness, coordinator, or external agent may invoke
execution infrastructure as a private bypass around the dispatch control plane.
```

### docs/platform/agent-coordination/vision.md#v-008-domain-and-organization-augmentation-creates-differentiation

```text
### V-008: Domain And Organization Augmentation Creates Differentiation

Domain packages and organization-specific extensions may provide:

- knowledge and context enrichment;
- doctrine and Skills;
- reusable protocol definitions;
- plan/task validation;
- resource, conflict, and isolation analysis;
- evidence and result evaluation;
- Work or other lifecycle integration;
- organization-specific roles, souls, policy, and quality criteria.

The foundation defines stable seams only when at least two real consumers prove
the common need. It must not pre-build a large generic plugin framework from
hypothetical variation.
```

### docs/platform/agent-coordination/vision.md#unheaded-block-38

```text
Domain packages and organization-specific extensions may provide:
```

### docs/platform/agent-coordination/vision.md#unheaded-block-39

```text
- knowledge and context enrichment;
- doctrine and Skills;
- reusable protocol definitions;
- plan/task validation;
- resource, conflict, and isolation analysis;
- evidence and result evaluation;
- Work or other lifecycle integration;
- organization-specific roles, souls, policy, and quality criteria.
```

### docs/platform/agent-coordination/vision.md#unheaded-block-40

```text
The foundation defines stable seams only when at least two real consumers prove
the common need. It must not pre-build a large generic plugin framework from
hypothetical variation.
```

### docs/platform/agent-coordination/vision.md#v-009-runtime-graphs-may-be-trivial-dynamic-or-declared

```text
### V-009: Runtime Graphs May Be Trivial, Dynamic, Or Declared

Coordination structure may be:

- one Assignment with no meaningful graph;
- an upfront task dependency graph;
- a graph expanded dynamically as evidence reveals new questions;
- a declared protocol graph;
- a domain-validated hybrid of dynamic and declared structure.

Dynamic does not mean unbounded. Task count, depth, concurrency, time, tokens,
cost, communication rounds, mutation, and duplicate intent remain governed.
```

### docs/platform/agent-coordination/vision.md#unheaded-block-42

```text
- one Assignment with no meaningful graph;
- an upfront task dependency graph;
- a graph expanded dynamically as evidence reveals new questions;
- a declared protocol graph;
- a domain-validated hybrid of dynamic and declared structure.
```

### docs/platform/agent-coordination/vision.md#unheaded-block-43

```text
Dynamic does not mean unbounded. Task count, depth, concurrency, time, tokens,
cost, communication rounds, mutation, and duplicate intent remain governed.
```

### docs/platform/agent-coordination/vision.md#v-010-evidence-and-provenance-survive-every-profile

```text
### V-010: Evidence And Provenance Survive Every Profile

Agent-led planning does not weaken the Assignment, Run, RunResult, evidence, or
provenance boundaries. Exit zero, terminal visibility, repetition, consensus,
or agent self-report cannot manufacture verified success.
```

### docs/platform/agent-coordination/vision.md#unheaded-block-44

```text
Agent-led planning does not weaken the Assignment, Run, RunResult, evidence, or
provenance boundaries. Exit zero, terminal visibility, repetition, consensus,
or agent self-report cannot manufacture verified success.
```

### docs/platform/agent-coordination/vision.md#v-011-the-foundation-core-stays-small

```text
### V-011: The Foundation Core Stays Small

The first foundation does not require a scheduler, durable Job queue, daemon,
general mailbox, mandatory Mission lifecycle, unrestricted peer chat, or a
universal domain plugin system.

New persisted entities require a distinct authority, recovery need, or
invariant that existing entities cannot represent correctly.
```

### docs/platform/agent-coordination/vision.md#unheaded-block-45

```text
The first foundation does not require a scheduler, durable Job queue, daemon,
general mailbox, mandatory Mission lifecycle, unrestricted peer chat, or a
universal domain plugin system.
```

### docs/platform/agent-coordination/vision.md#unheaded-block-46

```text
New persisted entities require a distinct authority, recovery need, or
invariant that existing entities cannot represent correctly.
```

### docs/platform/agent-coordination/vision.md#v-012-generalization-requires-two-unlike-consumers

```text
### V-012: Generalization Requires Two Unlike Consumers

The foundation claim must be proved by at least:

1. an agent-led research or brainstorm session with no predeclared Workflow;
2. a coding session using the same dispatch/runtime core plus domain-specific
   planning, resource, evidence, or isolation constraints.

If those consumers require separate execution cores, the foundation boundary
has not been found yet.
```

### docs/platform/agent-coordination/vision.md#unheaded-block-47

```text
The foundation claim must be proved by at least:
```

### docs/platform/agent-coordination/vision.md#unheaded-block-48

```text
1. an agent-led research or brainstorm session with no predeclared Workflow;
2. a coding session using the same dispatch/runtime core plus domain-specific
   planning, resource, evidence, or isolation constraints.
```

### docs/platform/agent-coordination/vision.md#unheaded-block-49

```text
If those consumers require separate execution cores, the foundation boundary
has not been found yet.
```

### docs/platform/agent-coordination/vision.md#unheaded-block-50

```text
The foundation owns:

- bounded session/invocation context;
- semantic execution-contract validation;
- task/Assignment identity and dependency mechanics when needed;
- dispatch governance and capability resolution;
- execution budgets, retries, cancellation, and recovery boundaries;
- Run and RunResult provenance;
- evidence normalization and confidence boundaries;
- communication authorization and loop bounds;
- aggregate outcome and synthesis inputs;
- extension seams proven to be domain-neutral.
```

### docs/platform/agent-coordination/vision.md#domain-and-integration-responsibilities

```text
## Domain And Integration Responsibilities

Domain, organization, or lifecycle integrations own:

- domain knowledge and vocabulary;
- preferred problem-solving doctrine;
- reusable Skills and protocol templates;
- domain-specific planning heuristics and validators;
- domain resource/conflict models;
- domain evidence strength and acceptance criteria;
- Work lifecycle decisions and verbs;
- durable branch/merge behavior where the domain requires it;
- organization-specific policy, roles, souls, and quality posture.
```

### docs/platform/agent-coordination/vision.md#unheaded-block-51

```text
Domain, organization, or lifecycle integrations own:
```

### docs/platform/agent-coordination/vision.md#unheaded-block-52

```text
- domain knowledge and vocabulary;
- preferred problem-solving doctrine;
- reusable Skills and protocol templates;
- domain-specific planning heuristics and validators;
- domain resource/conflict models;
- domain evidence strength and acceptance criteria;
- Work lifecycle decisions and verbs;
- durable branch/merge behavior where the domain requires it;
- organization-specific policy, roles, souls, and quality posture.
```

### docs/platform/agent-coordination/vision.md#unheaded-block-53

```text
The accepted Vision rejects these interpretations:
```

### docs/platform/agent-coordination/vision.md#unheaded-block-54

```text
1. Every CoordinationSession must reference a predeclared Workflow, Stage, or
   Coordination Protocol.
2. Every executable request must have a pre-existing TaskSpec file.
3. No predefined graph means no structured runtime contract.
4. Skill prose may call executors or mutate lifecycle directly.
5. Work is required to gain access to coordination or dispatch.
6. Protocol families such as research, brainstorm, or debate are mandatory
   gateways rather than optional reusable accelerators.
7. Coding-specific file/Git rules belong in the universal coordination core.
8. Domain neutrality means the foundation has no hard safety, evidence, budget,
   or authority policy.
```

### docs/platform/agent-coordination/vision.md#unheaded-block-55

```text
The declared Workflow/Stage/Operation/TaskSpec/Skill model remains valuable and
backward compatible. Its graph and TaskSpec are hard constraints when that
declared model is selected. It is not the universal entry path for a session.
```

### docs/platform/agent-coordination/vision.md#unheaded-block-56

```text
Assignment remains the immutable semantic request. Downstream contracts must
support both declared-operation provenance and a validated dynamic/inline
operation contract without creating a governance bypass.
```

### docs/platform/agent-coordination/vision.md#unheaded-block-57

```text
A CoordinationSession, if persisted, is a thin execution and recovery boundary;
it does not require a protocol reference. AdhocTask, if used, represents
session-local intent and evidence roll-up. A session may contain one trivial
task or a dynamically evolving task graph.
```

### docs/platform/agent-coordination/vision.md#unheaded-block-58

```text
The exact persistence boundary and minimum task state remain Step 07 design
questions.
```

### docs/platform/agent-coordination/vision.md#unheaded-block-59

```text
Research, consult, brainstorm, debate, leader-worker, and peer-review protocols
are optional doctrine/configuration packages on the foundation. Step 08 must
also prove agent-led coordination without a predefined protocol.
```

### docs/platform/agent-coordination/vision.md#unheaded-block-60

```text
Planning output must not automatically imply child Work. Domain planning may
propose tasks and lifecycle needs; deterministic policy validates them; only
units requiring independently governable delivery lifecycle become child Work.
```

### docs/platform/agent-coordination/vision.md#unheaded-block-61

```text
Do not design a comprehensive extension SDK upfront. Begin with the smallest
seams required by the two proof consumers, likely context enrichment,
plan/task validation, resource/isolation advice, and result/evidence evaluation.
```

### docs/platform/agent-coordination/vision.md#open-design-questions-under-this-vision

```text
## Open Design Questions Under This Vision

The Vision fixes direction but intentionally does not decide:

1. whether CoordinationSession is always persisted or may be an invocation
   envelope for trivial calls;
2. the minimum AdhocTask state and persistence model;
3. the exact validated inline execution-contract schema;
4. how declared and dynamic tasks share operation identity and policy lookup;
5. which planning/validation extension seams the first two consumers prove;
6. how privacy and context-egress policy constrain external providers and souls;
7. how dynamic fan-out budgets and duplicate-intent checks are enforced;
8. how mutating session-local tasks obtain and integrate isolation;
9. how nested Work branch topology is reconciled;
10. whether and how an AdhocTask may be promoted to child Work.

These belong in proposals, ADRs, architecture, and contracts beneath this
Vision. They must be answered without reopening V-001 through V-012 implicitly.
```

### docs/platform/agent-coordination/vision.md#unheaded-block-62

```text
The Vision fixes direction but intentionally does not decide:
```

### docs/platform/agent-coordination/vision.md#unheaded-block-63

```text
1. whether CoordinationSession is always persisted or may be an invocation
   envelope for trivial calls;
2. the minimum AdhocTask state and persistence model;
3. the exact validated inline execution-contract schema;
4. how declared and dynamic tasks share operation identity and policy lookup;
5. which planning/validation extension seams the first two consumers prove;
6. how privacy and context-egress policy constrain external providers and souls;
7. how dynamic fan-out budgets and duplicate-intent checks are enforced;
8. how mutating session-local tasks obtain and integrate isolation;
9. how nested Work branch topology is reconciled;
10. whether and how an AdhocTask may be promoted to child Work.
```

### docs/platform/agent-coordination/vision.md#unheaded-block-64

```text
These belong in proposals, ADRs, architecture, and contracts beneath this
Vision. They must be answered without reopening V-001 through V-012 implicitly.
```

### docs/platform/agent-coordination/vocabulary/README.md#unheaded-block-2

```text
This directory is the single source of truth for agent-coordination terms.
Architecture, contracts, proposals, roadmaps, tests, and Skills should link here
instead of introducing local definitions.
```

### docs/platform/agent-coordination/vocabulary/README.md#unheaded-block-3

```text
Term meanings refine the [Agent Coordination Foundation Vision](../vision.md)
and must not make Work or a predeclared protocol universally mandatory.
```

### docs/platform/agent-coordination/vocabulary/README.md#unheaded-block-4

```text
Vocabulary entries describe meaning and ownership. Detailed behavior belongs in
architecture or contracts.
```

### docs/platform/agent-coordination/vocabulary/README.md#unheaded-block-5

```text
1. [Canonical Concepts](canonical-concepts.md) defines the supported terms by
   architectural layer.
2. [Concept Relationships](concept-relationships.md) shows how those concepts
   compose and which layer owns each transition.
3. [Deprecated And Reserved Terms](deprecated-and-reserved.md) records aliases,
   rejected overloads, and future-reserved vocabulary.
4. [Stage Operation Relationship Diagram](stage-operation-taskspec-skill-relationship.svg)
   visualizes the current Workflow/Stage/Operation/Assignment execution path.
```

### docs/platform/agent-coordination/vocabulary/README.md#unheaded-block-6

```text
The pre-migration vocabulary map is retained as a non-canonical
[historical record](../history/implementation-records/orchestration-vocabulary-map-2026-08-27.md).
```

### docs/platform/agent-coordination/vocabulary/README.md#unheaded-block-8

```text
- definition;
- owning layer;
- lifecycle authority, if any;
- creator and consumer;
- important relationships;
- concepts it must not be confused with;
- aliases or deprecated names;
- design and implementation status when relevant.
```

### docs/platform/agent-coordination/vocabulary/README.md#unheaded-block-9

```text
- Add an alias here before allowing it in user-facing or machine-facing prose.
- Do not reuse an existing term for a different lifecycle layer.
- Changes to accepted ownership boundaries require an ADR.
- Open naming questions belong in `proposals/`, not in this index.
```

### docs/platform/agent-coordination/vocabulary/canonical-concepts.md#unheaded-block-2

```text
A durable, human-manageable delivery item. Work is the sole authority for its
status, workflow stage, claim/return ownership, acceptance, approval, durable
branch, and merge lifecycle.
```

### docs/platform/agent-coordination/vocabulary/canonical-concepts.md#unheaded-block-3

```text
Work may reference coordination sessions and their evidence. Session, Task,
Assignment, Run, RunResult, Mission, or Herdr state cannot mutate Work lifecycle
except by invoking authorized Work engine verbs.
```

### docs/platform/agent-coordination/vocabulary/canonical-concepts.md#unheaded-block-4

```text
Do not confuse Work with AdhocTask, Assignment, or Mission.
```

### docs/platform/agent-coordination/vocabulary/canonical-concepts.md#unheaded-block-5

```text
An optional lightweight objective envelope for related standalone coordination
sessions. Mission does not replace Work and owns no delivery lifecycle.
```

### docs/platform/agent-coordination/vocabulary/canonical-concepts.md#unheaded-block-6

```text
Design status: Proposed; the boundary that Mission is `deferred-preserved` and
must not gain a mandatory `missionId` on any V1 record is Accepted, per
[ADR-008](../decisions/ADR-008-coordination-session-and-mission-deferral.md).
A one-off session must not require a Mission.
```

### docs/platform/agent-coordination/vocabulary/canonical-concepts.md#unheaded-block-7

```text
The shared, versioned graph/operation/policy intermediate representation
beneath both [Workflow](#workflow) and [Coordination Protocol](#coordination-protocol).
A FlowDefinition declares a common `spec` kernel (graph, roles, actors,
operations, policy) plus a required typed profile discriminator selecting
`Workflow` (Stage semantics, Work lifecycle integration) or
`CoordinationProtocol` (Phase semantics, topology/cohort/synthesis, no Work
lifecycle authority). FlowDefinition is an additive second projection of the
already-normalized Workflow shape; it does not migrate existing Workflow
consumers.
```

### docs/platform/agent-coordination/vocabulary/canonical-concepts.md#unheaded-block-8

```text
Design status: Accepted, per
[ADR-009](../decisions/ADR-009-flow-definition-shared-ir-and-typed-profiles.md).
Exact schema: [FlowDefinition Contract](../contracts/flow-definition.md).
```

### docs/platform/agent-coordination/vocabulary/canonical-concepts.md#unheaded-block-9

```text
A graph describing the legal lifecycle stages and transitions for a Work type.
Workflow is definition/configuration, not a runtime attempt.
```

### docs/platform/agent-coordination/vocabulary/canonical-concepts.md#unheaded-block-10

```text
A named node in a Workflow. A Stage identifies the current Work lifecycle
position and exposes a Stage Protocol and legal Stage Operations.
```

### docs/platform/agent-coordination/vocabulary/canonical-concepts.md#unheaded-block-11

```text
The coordination doctrine active in one Stage: owner role, legal operations,
handoff expectations, gates, and evidence expectations.
```

### docs/platform/agent-coordination/vocabulary/canonical-concepts.md#unheaded-block-12

```text
A legal semantic action available in a Stage. An operation references TaskSpec,
Skill(s), Role, and policy hints. It is a choice in protocol definition, not an
Assignment or Run.
```

### docs/platform/agent-coordination/vocabulary/canonical-concepts.md#unheaded-block-13

```text
The current compatibility path keeps `stage.skill` and `stage.taskSpec` as the
primary operation projection.
```

### docs/platform/agent-coordination/vocabulary/canonical-concepts.md#unheaded-block-14

```text
An optional reusable graph and doctrine for one class of collaboration, such as
consult, research, leader-worker, review, brainstorm, or debate. When selected,
it declares legal phases, operations, communication edges, budgets, and
synthesis requirements.
```

### docs/platform/agent-coordination/vocabulary/canonical-concepts.md#unheaded-block-15

```text
A CoordinationSession does not require a Coordination Protocol. Agent-led
planning may create runtime tasks and execution contracts dynamically under
foundation policy.
```

### docs/platform/agent-coordination/vocabulary/canonical-concepts.md#unheaded-block-16

```text
Design status: Proposed for the generalized standalone runtime.
```

### docs/platform/agent-coordination/vocabulary/canonical-concepts.md#unheaded-block-17

```text
A reusable machine-readable execution contract defining required inputs,
expected outputs, gates, mutation/evidence expectations, and completion
criteria for an operation.
```

### docs/platform/agent-coordination/vocabulary/canonical-concepts.md#unheaded-block-18

```text
A registered TaskSpec is optional for agent-led coordination. Every executable
request still requires equivalent validated semantic fields in its Assignment
contract. The exact inline representation remains under design.
```

### docs/platform/agent-coordination/vocabulary/canonical-concepts.md#unheaded-block-19

```text
Adaptive prose and procedural guidance used by an agent to perform an operation
with domain judgment. Skill prose may guide choices inside hard contracts; it
cannot override graph, TaskSpec, governance, or lifecycle rules.
```

### docs/platform/agent-coordination/vocabulary/canonical-concepts.md#unheaded-block-20

```text
A semantic responsibility in a protocol, such as implementer, researcher,
reviewer, advisor, helper, coordinator, or synthesizer. Role is not an executor,
provider, model, terminal, or process.
```

### docs/platform/agent-coordination/vocabulary/canonical-concepts.md#unheaded-block-21

```text
Role, seat, and responsibility position are the same concept and must not
become separate fields or split into a distinct "Seat" entity; schema uses
only `role`. An operation declares the Role it needs to be performed;
[SessionActor](#sessionactor) is the addressable instance that fills a Role in
a definition or session. Do not confuse Role with [Stance](#stance), a
temporary viewpoint such as argument-for/argument-against, or with
[Phase](#phase)/Stage, which is a position in the coordination graph rather
than a responsibility.
```

### docs/platform/agent-coordination/vocabulary/canonical-concepts.md#unheaded-block-22

```text
A named node in a `CoordinationProtocol` graph — the Phase-profile analog of
[Stage](#stage) under the shared [FlowDefinition](#flowdefinition) IR. A
FlowDefinition graph node's Phase-versus-Stage identity is derived from its
definition's typed profile (`spec.profile.kind`), never restated as an
independent per-node field.
```

### docs/platform/agent-coordination/vocabulary/canonical-concepts.md#unheaded-block-23

```text
Public Stage and Phase semantics remain distinct even though both normalize
onto the same internal graph-node shape: Stage carries Work lifecycle
position; Phase carries standalone coordination-protocol position and never
implies Work lifecycle authority.
```

### docs/platform/agent-coordination/vocabulary/canonical-concepts.md#unheaded-block-24

```text
Design status: Accepted, per
[ADR-009](../decisions/ADR-009-flow-definition-shared-ir-and-typed-profiles.md).
```

### docs/platform/agent-coordination/vocabulary/canonical-concepts.md#unheaded-block-25

```text
One bounded coordination invocation, with context, participants, budgets,
events, runtime tasks/Assignments when needed, and aggregate outcome. It may be
Work-attached or standalone, agent-led or protocol-led. A task graph may be
trivial, dynamic, or declared.
```

### docs/platform/agent-coordination/vocabulary/canonical-concepts.md#unheaded-block-26

```text
It owns collaboration progress only, never Work lifecycle.
```

### docs/platform/agent-coordination/vocabulary/canonical-concepts.md#unheaded-block-27

```text
Design status: Accepted for identity/persistence boundary, per
[ADR-008](../decisions/ADR-008-coordination-session-and-mission-deferral.md)
and the [CoordinationSession Contract](../contracts/coordination-session.md);
the full runtime remains Proposed pending implementation.
```

### docs/platform/agent-coordination/vocabulary/canonical-concepts.md#unheaded-block-28

```text
One addressable actor instance filling a [Role](#role) in a definition or
session, config key `actors:`. Multiple SessionActors may fill the same Role
(for example two independently isolated critics). An operation declares the
Role it needs; a graph operation binding may assign that operation to a
specific SessionActor. Topology edges, round limits, context visibility,
actor-level policy, and cohort diversity address SessionActor ids, because
Role alone cannot distinguish multiple fillers of one responsibility.
```

### docs/platform/agent-coordination/vocabulary/canonical-concepts.md#unheaded-block-29

```text
The qualified SessionActor-to-Assignment reference lives only in the
CoordinationSession's one-way ledger; it is never added as an Assignment
field. `SessionActor` is not `Participant`: fgOS reserves `Participant` for
the existing platform-level concept of any process that speaks the
event-log contract (`docs/specs/platform-foundations.md` D0014); see
[Deprecated And Reserved Terms](deprecated-and-reserved.md#participant).
```

### docs/platform/agent-coordination/vocabulary/canonical-concepts.md#unheaded-block-31

```text
The behavioral identity a SessionActor runs with, attached through
`policy.preferPersona` at operation, Role, or SessionActor scope. Persona is
not Role: Role is the responsibility a SessionActor fills; Persona is how
that SessionActor performs it.
```

### docs/platform/agent-coordination/vocabulary/canonical-concepts.md#unheaded-block-33

```text
A temporary viewpoint a SessionActor argues from within one coordination
episode, such as argument-for or argument-against. Stance is distinct from
Role (a durable responsibility) and from Persona (a behavioral identity that
outlives one episode).
```

### docs/platform/agent-coordination/vocabulary/canonical-concepts.md#unheaded-block-34

```text
Design status: **Not a V1 schema field.** V1 expresses a stance-like
distinction through Role/operation naming (for example separate
`argument-for` and `argument-against` operations, or a `critical-reviewer`
Role) rather than through a dedicated `stance` field. Introducing `stance` as
a schema field is deferred until a framework needs to track it independently
of Role; see [ADR-008](../decisions/ADR-008-coordination-session-and-mission-deferral.md)
Decision 6.
```

### docs/platform/agent-coordination/vocabulary/canonical-concepts.md#unheaded-block-35

```text
A planner-proposed node before graph validation and materialization. Candidate
properties may independently describe inherited/independent lifecycle and
shared/isolated execution.
```

### docs/platform/agent-coordination/vocabulary/canonical-concepts.md#unheaded-block-36

```text
TaskCandidate is an optional intermediate representation, not a required input
for one-shot or incrementally planned coordination.
```

### docs/platform/agent-coordination/vocabulary/canonical-concepts.md#unheaded-block-38

```text
A session-local unit of intent, dependency, ownership, progress, and evidence
roll-up. It is suitable for research fan-out, consultation, debate branches,
review passes, synthesis, or bounded implementation returning to one parent.
```

### docs/platform/agent-coordination/vocabulary/canonical-concepts.md#unheaded-block-39

```text
AdhocTask is not Assignment. One AdhocTask may issue multiple Assignments, and
one Assignment may have multiple Runs.
```

### docs/platform/agent-coordination/vocabulary/canonical-concepts.md#unheaded-block-41

```text
An immutable semantic request to perform one operation for a caller/context. It
contains objective, inputs, constraints, expected outputs, role, operation, and
policy context. It does not own retries or lifecycle progress.
```

### docs/platform/agent-coordination/vocabulary/canonical-concepts.md#unheaded-block-42

```text
An Assignment may originate from a declared Stage Operation/TaskSpec or from an
agent-proposed inline execution contract that passes foundation and selected
domain validation. Both paths use the same dispatch and runtime governance.
```

### docs/platform/agent-coordination/vocabulary/canonical-concepts.md#unheaded-block-43

```text
A structured semantic communication between roles, such as task, clarification,
result, blocker, escalation, critique, or synthesis input. A message that
triggers execution must route through Assignment and dispatch governance.
```

### docs/platform/agent-coordination/vocabulary/canonical-concepts.md#unheaded-block-44

```text
Design status: Proposed beyond the current V1 result exchange.
```

### docs/platform/agent-coordination/vocabulary/canonical-concepts.md#unheaded-block-45

```text
An evidence-linked aggregate conclusion from accepted task/results. Synthesis
must preserve disagreement, unsupported claims, failures, and unknowns. It is
not consensus, approval, or a Work transition.
```

### docs/platform/agent-coordination/vocabulary/canonical-concepts.md#unheaded-block-47

```text
An abstract behavior promise, resolved through `runner.capabilities.<capability>`
(`prefer`/`overrides`) to a registered Executor's `for[]` declaration. Together
with Executor-id, Capability is one of exactly two target identities the
Dispatch And Execution Engine resolves against — see the
[Dispatch Control Plane](../architecture/dispatch-control-plane.md)'s Routing
Identities section. `purpose` and the `--for` CLI flag are compatibility
terminology for Capability, not a separate concept.
```

### docs/platform/agent-coordination/vocabulary/canonical-concepts.md#unheaded-block-48

```text
The resolved execution decision for a selected Assignment: executor target,
provider/model/tier, mechanism, policy/governance decisions, adapter, and result
handling.
```

### docs/platform/agent-coordination/vocabulary/canonical-concepts.md#unheaded-block-49

```text
The component that resolves and launches execution infrastructure for an
Assignment. It must not choose Work lifecycle transitions or treat terminal
visibility as completion evidence.
```

### docs/platform/agent-coordination/vocabulary/canonical-concepts.md#unheaded-block-50

```text
A configured target capable of performing an Assignment, such as a provider,
agent CLI, model profile, or governed adapter target. Executor is not Role.
```

### docs/platform/agent-coordination/vocabulary/canonical-concepts.md#unheaded-block-51

```text
One concrete runtime attempt to execute an Assignment through an approved
DispatchPlan and mechanism. Retries create additional Runs; they do not replace
the Assignment or erase prior evidence.
```

### docs/platform/agent-coordination/vocabulary/canonical-concepts.md#unheaded-block-52

```text
The normalized result for one Run: status/claim, confidence, evidence refs,
artifacts, verification details, failure information, and provenance.
```

### docs/platform/agent-coordination/vocabulary/canonical-concepts.md#unheaded-block-53

```text
RunResult is not Work completion and cannot authorize lifecycle mutation.
```

### docs/platform/agent-coordination/vocabulary/canonical-concepts.md#unheaded-block-54

```text
Independently inspectable support for a result claim, such as structured worker
output, post-run file state, git delta, command output, test result, or artifact
hash. Evidence strength is operation-specific.
```

### docs/platform/agent-coordination/vocabulary/canonical-concepts.md#unheaded-block-55

```text
A persisted output referenced by Assignment, RunResult, task, or synthesis.
Artifact existence alone does not establish correctness or freshness.
```

### docs/platform/agent-coordination/vocabulary/canonical-concepts.md#unheaded-block-56

```text
Interactive execution visibility over panes/processes. Herdr may show activity,
but pane text, quietness, or process appearance is not truth or evidence.
```

### docs/platform/agent-coordination/vocabulary/canonical-concepts.md#unheaded-block-57

```text
A future-reserved queue/scheduler concept. Job is not used in Team Dispatch V1
and must not be introduced as an alias for Assignment, Run, or AdhocTask.
```

### docs/platform/agent-coordination/vocabulary/concept-relationships.md#unheaded-block-2

````text
```txt
Objective/lifecycle
  Mission (optional, proposed)       Work (durable lifecycle authority)
            \                         /
             -> CoordinationSession <-

Planning and constraints (composable)
  Agent-led runtime planning -----------\
  optional Coordination Protocol -------+-> semantic execution contract
  Workflow -> Stage -> Stage Operation -/       -> TaskSpec or validated inline contract
  optional domain/organization harness --------> enrichment / validation

Coordination runtime
  CoordinationSession -> optional AdhocTask graph -> Assignment

Dispatch/runtime
  Assignment -> DispatchPlan -> Dispatcher -> Executor -> Run -> RunResult

Evidence/visibility
  RunResult -> Evidence / Artifact
  Run       -> Herdr visibility
```
````

### docs/platform/agent-coordination/vocabulary/concept-relationships.md#unheaded-block-3

```text
Dashed/proposed concepts in prose are defined in
[Canonical Concepts](canonical-concepts.md) with explicit design status.
```

### docs/platform/agent-coordination/vocabulary/concept-relationships.md#unheaded-block-4

````text
```txt
Work-attached
  Work
    -> optional CoordinationSession
      -> optional declared protocol / agent-led planning / domain harness
      -> zero, one, or many AdhocTasks
        -> Assignment -> Run -> RunResult / Evidence
    -> outcome returned to Work driver

Standalone
  optional Mission
    -> CoordinationSession
      -> agent-led or optional declared protocol planning
      -> zero, one, or many AdhocTasks
        -> Assignment -> Run -> RunResult / Evidence
      -> Synthesis
```
````

### docs/platform/agent-coordination/vocabulary/concept-relationships.md#unheaded-block-5

```text
The profiles share planning-contract, dispatch, runtime, and evidence machinery
and may share declared protocols when selected. They do not share lifecycle
authority.
```

### docs/platform/agent-coordination/vocabulary/concept-relationships.md#unheaded-block-6

```text
| Concern | Owner |
|---|---|
| Work status/stage/claim/approval/merge | Work engine verbs |
| Legal lifecycle transition | Workflow graph and Work driver |
| Legal operation in a stage/phase | Active protocol graph |
| Legal dynamic execution | Foundation policy plus validated inline execution contract |
| Input/output/evidence contract | TaskSpec or validated inline Assignment contract |
| Adaptive execution judgment | Skill, within hard constraints |
| Role responsibility | Declared protocol or validated dynamic execution contract |
| Dynamic planning proposal | Coordinator agent/Skill, within policy and budget |
| Domain plan/resource/evidence validation | Selected domain/organization harness |
| Task dependencies/progress | CoordinationSession/AdhocTask runtime, proposed |
| Executor/provider/model/mechanism | Dispatch control plane |
| Runtime attempt | Run |
| Normalized claim and provenance | RunResult |
| Interactive visibility | Herdr |
```

### docs/platform/agent-coordination/vocabulary/concept-relationships.md#unheaded-block-7

```text
- Normal intake creates Work.
- A Work driver may start a Work-attached CoordinationSession.
- An authorized standalone caller may start a session without Work.
- A session may lower directly to one Assignment or materialize validated
  AdhocTasks from a declared or dynamically proposed graph.
- Independent lifecycle candidates create child Work only through normal Work
  intake.
- A declared operation selection or validated inline execution contract creates
  an Assignment request.
- Dispatch creates a Run for an Assignment.
- Runtime settlement produces one RunResult per Run.
- Synthesis reads accepted result/evidence refs; it does not create truth.
```

### docs/platform/agent-coordination/vocabulary/concept-relationships.md#unheaded-block-8

````text
```txt
Work != Mission
Work != AdhocTask
AdhocTask != Assignment
Assignment != Run
Run != RunResult
Role != Executor
Skill != TaskSpec
Stage Operation != Assignment
Coordination Protocol != CoordinationSession requirement
Herdr state != Evidence
Synthesis != Approval
Job != Assignment/Run/Task
Capability != Purpose (purpose/--for is a compatibility alias for Capability, not a third routing identity)
Job != Capability/Executor-id (Job is unused, reserved for a future scheduler; it is never a dispatch target)
```
````

### docs/platform/agent-coordination/vocabulary/concept-relationships.md#unheaded-block-9

```text
Lifecycle ownership and execution isolation are independent:
```

### docs/platform/agent-coordination/vocabulary/concept-relationships.md#unheaded-block-10

````text
```txt
lifecycle: inherited | independent
isolation: shared | isolated
```
````

### docs/platform/agent-coordination/vocabulary/concept-relationships.md#unheaded-block-11

```text
An inherited isolated task may use an ephemeral branch/worktree without
becoming Work. Independent child Work uses Work-owned durable isolation and
merge behavior.
```

### docs/platform/agent-coordination/vocabulary/concept-relationships.md#unheaded-block-12

````text
```txt
Strategic ring  = Orchestrator
Activation ring = Launcher
Flow ring       = Router + Driver
Execution ring  = Dispatcher
```
````

### docs/platform/agent-coordination/vocabulary/concept-relationships.md#unheaded-block-13

```text
The rings are responsibility boundaries, not necessarily one process or module
per ring.
```

### docs/platform/agent-coordination/vocabulary/deprecated-and-reserved.md#unheaded-block-2

```text
Reserved for the existing fgOS platform-level concept: any process that
speaks the fgOS event-log contract is a full "participant"
(`docs/specs/platform-foundations.md` D0014,
`docs/knowledge/fgos-participant-contract-what-it-takes-to-be-a-full-partici/fgos-participant-contract.md`).
That definition lives outside this documentation tree and is not restated
here. Do not reuse `Participant` for the agent-coordination actor-instance
concept — the addressable instance that fills a Role inside a definition or
session is [SessionActor](canonical-concepts.md#sessionactor)
(per [ADR-008](../decisions/ADR-008-coordination-session-and-mission-deferral.md)).
```

### docs/platform/agent-coordination/vocabulary/deprecated-and-reserved.md#unheaded-block-3

```text
Reserved for a future durable queue/scheduler unit. Team Dispatch V1 does not
create Job records. Do not use Job as a generic synonym for Work, AdhocTask,
Assignment, or Run.
```

### docs/platform/agent-coordination/vocabulary/deprecated-and-reserved.md#unheaded-block-4

```text
Reserved for an optional broader objective envelope. Until its proposal is
accepted, do not make Mission mandatory for standalone coordination and do not
give it Work lifecycle semantics.
```

### docs/platform/agent-coordination/vocabulary/deprecated-and-reserved.md#unheaded-block-5

```text
May be used informally in implementation planning or the operating harness, but
is not currently a canonical runtime entity. Use AdhocTask for the proposed
session-local runtime concept and child Work for durable lifecycle units.
```

### docs/platform/agent-coordination/vocabulary/deprecated-and-reserved.md#unheaded-block-6

```text
Avoid as an alias for Assignment. If used in historical material, it describes
an implementation-era execution payload, not a separate canonical lifecycle.
```

### docs/platform/agent-coordination/vocabulary/deprecated-and-reserved.md#unheaded-block-7

```text
Use only as a protocol role or generic executing participant with explicit
context. Do not assume Worker identifies provider, model, process, or lifecycle
owner.
```

### docs/platform/agent-coordination/vocabulary/deprecated-and-reserved.md#unheaded-block-8

```text
Use for the worker-produced structured artifact when discussing transport.
Use RunResult for the normalized fgOS runtime record and confidence decision.
```

### docs/platform/agent-coordination/vocabulary/deprecated-and-reserved.md#unheaded-block-9

```text
Avoid without qualification. Distinguish process settlement, worker claim,
task satisfaction, Work completion, and visible terminal state.
```

### docs/platform/agent-coordination/vocabulary/deprecated-and-reserved.md#unheaded-block-10

```text
- Do not call Assignment a Job.
- Do not call Run a task lifecycle.
- Do not call Herdr pane state evidence.
- Do not call Mission a Work replacement.
- Do not call every planner child Work.
- Do not call every temporary helper unit an independent Work item.
- Do not use consensus as a synonym for verified synthesis.
- Do not call a SessionActor a Participant; Participant is reserved for the
  platform-level event-log-contract concept.
```

### docs/platform/agent-coordination/vocabulary/deprecated-and-reserved.md#unheaded-block-11

```text
Older terminology and rationale remain searchable in the
[pre-migration vocabulary map](../history/implementation-records/orchestration-vocabulary-map-2026-08-27.md).
Historical use does not override this document.
```
