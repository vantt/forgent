# ui-spec candidate area

```txt
Document type: Area portal
Audience: Documentation migration reviewer, maintainer, agent
Purpose: Preserve mapped legacy content for independent conservation review
Design status: Candidate
Implementation: Carriage only; current implementation truth is not certified
Provenance: docs/ui-spec/00-overview.md at 111adc51fd047d99121fd9d076eb4794c87045a4
Writer type: Agent draft writer
Canonical: No
Canonical for: None; candidate only
Use this when: Reviewing carriage, placement and source conservation
Do not use this for: Current canonical authority or implemented-behavior proof
Last reviewed: Not independently reviewed; authored 2026-10-15
Related:
- docs/ui-spec/00-overview.md
Supersedes: None; candidate only
Superseded by: None
```

> Added in candidate: Candidate metadata and placement scaffolding. This reading portal is new navigation, not a new component or authority. Legacy authority remains unchanged; source wording is preserved for conservation, including known stale assertions.

## Added in candidate: Read this area

Start with [spec.md](spec.md). These files preserve source text for independent conservation review. All content remains candidate; known stale assertions await the separate A19/A28 truth pass.

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

## Added in candidate: Tool root obligation

The functioning compiler root remains `docs/ui-spec/` with `spec.config.yaml`, `schema/`, `screens/`, `modals/`, `components/` and `flows/` directly below it. This candidate layout follows the frozen map and has not been certified as a compiler root. Before promotion, repoint the tool root or explicitly retain the legacy root. The five generated outputs stay in place with `regenerate-from-source`; no candidate generated copies were authored. The owner queue records the obligation.

## Added in candidate: Verification and change boundary

Use the source citations carried in this area to locate implementation and tests; this portal approves no current truth. The batch report and pending ledger live at `plans/260925-documentation-authority-unification/reports/phase-06/step-08-report.md` and `plans/260925-documentation-authority-unification/ledger/decisions/s8-*`. Read `docs/platform/component-boundary.md` before changing runtime boundaries. No component-boundary change.
