# ui-spec

```txt
Document type: Area portal
Audience: Maintainer, implementer, agent
Purpose: Define the stated scope and preserve its source provenance and limits
Design status: Accepted at atomic cutover
Implementation: Carriage only; current implementation truth is not certified
Provenance: docs/ui-spec/00-overview.md at 111adc51fd047d99121fd9d076eb4794c87045a4
Writer type: Agent draft writer
Canonical: Yes
Canonical for: The document scope stated above; source implementation limits remain explicit
Use this when: Reading or changing the stated scope and its contracts
Do not use this for: Standalone implemented-behavior proof or claims outside the stated scope
Last reviewed: No current review date recorded; retained source dates are historical
Related:
- docs/platform/ui-spec/spec.md
Supersedes: The mapped source location at atomic cutover
Superseded by: None
```

> Source carriage: This reading portal is new navigation, not a new component or authority. 
## Read this area

Start with [spec.md](spec.md). These documents own their stated scopes; carried implementation limits and deferred work remain explicit.

- [contracts/15-system-events.md](contracts/15-system-events.md)
- [contracts/20-domain-rules.md](contracts/20-domain-rules.md)
- [contracts/30-states-and-errors.md](contracts/30-states-and-errors.md)
- [architecture/components/C01-item-card.md](architecture/components/C01-item-card.md)
- [operations/F01-answer-a-parked-question.md](operations/F01-answer-a-parked-question.md)
- [operations/F02-approve-a-merge.md](operations/F02-approve-a-merge.md)
- [architecture/modals/M01-answer-question.md](architecture/modals/M01-answer-question.md)
- [architecture/modals/M02-approve-merge.md](architecture/modals/M02-approve-merge.md)
- [architecture/modals/M03-add-edit-item.md](architecture/modals/M03-add-edit-item.md)
- [history/schema/surface-contract.schema.json](history/schema/surface-contract.schema.json)
- [history/schema/surface-contract.schema.json.md](history/schema/surface-contract.schema.json.md)
- [architecture/screens/S01-sign-in.md](architecture/screens/S01-sign-in.md)
- [architecture/screens/S02-taskboard.md](architecture/screens/S02-taskboard.md)
- [architecture/screens/S03-task-detail.md](architecture/screens/S03-task-detail.md)
- [architecture/screens/S04-questions-needing-answer.md](architecture/screens/S04-questions-needing-answer.md)
- [architecture/spec.config.yaml](architecture/spec.config.yaml)
- [architecture/spec.config.yaml.md](architecture/spec.config.yaml.md)

## Tool root obligation

The functioning compiler root remains `docs/ui-spec/` with `spec.config.yaml`, `schema/`, `screens/`, `modals/`, `components/` and `flows/` directly below it. This document layout follows the frozen map and has not been certified as a compiler root. Before promotion, repoint the tool root or explicitly retain the legacy root. The five generated outputs stay in place with `regenerate-from-source`; no candidate generated copies were authored. The owner queue records the obligation.

## Verification and change boundary

This portal routes readers to the exact documents that own each scope and to their implementation evidence. Navigation is not an implementation certification. Read `docs/platform/component-boundary.md` before changing runtime boundaries.

## Cross-area reading links

- [Component boundary and change check](../component-boundary.md#5-how-to-change).
- [Document types and learning placement](../governance.md#3-document-types).
- [Metadata, evidence and gap reporting](../governance.md#5-metadata).
- [Link and registration discipline](../governance.md#11-linking-discipline).
- [Six-question acceptance](../platform-foundations.md#l5-definition-of-done-sáu-câu-hỏi).

Read these alongside this area's tool-root obligation; they do not certify a compiler root.
