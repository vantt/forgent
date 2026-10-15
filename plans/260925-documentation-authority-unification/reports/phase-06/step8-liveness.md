# Specs and UI section liveness scan

Source commit: `cc18d2a2f2d0bd29bbf8a876b625677fac1f0c5f`. Rules: A19/P1, conservative section-level protection. Run before carriage. This is a liveness triage, not a current-truth approval. Full references, section hashes, cited implementation files and lexical subject hits are in `step8-liveness.json`. No subject is declared retired and no section is discarded. Historical placement does not erase current consumers.

| Source | Units | Sections | Live direct citations | Classification |
|---|---:|---:|---:|---|
| docs/specs/confinement-authority.md | 200 | 51 | 27 | Current by default; decision/history subdivisions recorded |
| docs/specs/decision-citation-drift.md | 20 | 11 | 5 | Current by default; decision/history subdivisions recorded |
| docs/specs/distillery.md | 21 | 11 | 4 | Current by default; decision/history subdivisions recorded |
| docs/specs/fgos-plugin.md | 45 | 23 | 6 | Current by default; decision/history subdivisions recorded |
| docs/specs/herdr-web-dashboard.md | 44 | 20 | 22 | Current by default; decision/history subdivisions recorded |
| docs/specs/observe.md | 25 | 13 | 3 | Current by default; decision/history subdivisions recorded |
| docs/ui-spec/00-overview.md | 16 | 6 | 16 | Current by default; decision/history subdivisions recorded |
| docs/ui-spec/15-system-events.md | 9 | 2 | 10 | Current by default; decision/history subdivisions recorded |
| docs/ui-spec/20-domain-rules.md | 5 | 2 | 23 | Current by default; decision/history subdivisions recorded |
| docs/ui-spec/30-states-and-errors.md | 30 | 16 | 16 | Current by default; decision/history subdivisions recorded |
| docs/ui-spec/components/C01-item-card.md | 12 | 5 | 1 | Current by default; decision/history subdivisions recorded |
| docs/ui-spec/flows/F01-answer-a-parked-question.md | 10 | 5 | 1 | Current by default; decision/history subdivisions recorded |
| docs/ui-spec/flows/F02-approve-a-merge.md | 9 | 5 | 1 | Current by default; decision/history subdivisions recorded |
| docs/ui-spec/generated/action-registry.csv | 1 | 1 | 10 | Generated, retained in place |
| docs/ui-spec/generated/coverage-report.md | 5 | 3 | 9 | Generated, retained in place |
| docs/ui-spec/generated/navigation-graph.yaml | 1 | 1 | 10 | Generated, retained in place |
| docs/ui-spec/generated/surface-registry.yaml | 1 | 1 | 12 | Generated, retained in place |
| docs/ui-spec/generated/wireframe-v2.html | 1 | 1 | 7 | Generated, retained in place |
| docs/ui-spec/modals/M01-answer-question.md | 11 | 6 | 1 | Current by default; decision/history subdivisions recorded |
| docs/ui-spec/modals/M02-approve-merge.md | 12 | 6 | 1 | Current by default; decision/history subdivisions recorded |
| docs/ui-spec/modals/M03-add-edit-item.md | 13 | 6 | 4 | Current by default; decision/history subdivisions recorded |
| docs/ui-spec/schema/surface-contract.schema.json | 1 | 1 | 5 | Current by default; decision/history subdivisions recorded |
| docs/ui-spec/screens/S01-sign-in.md | 14 | 6 | 3 | Current by default; decision/history subdivisions recorded |
| docs/ui-spec/screens/S02-taskboard.md | 20 | 6 | 3 | Current by default; decision/history subdivisions recorded |
| docs/ui-spec/screens/S03-task-detail.md | 24 | 9 | 2 | Current by default; decision/history subdivisions recorded |
| docs/ui-spec/screens/S04-questions-needing-answer.md | 15 | 6 | 1 | Current by default; decision/history subdivisions recorded |
| docs/ui-spec/spec.config.yaml | 1 | 1 | 25 | Current by default; decision/history subdivisions recorded |

All 27 source blobs match the committed Lead evidence. Known stale assertions are listed in step8-evidence.md §4 and carried verbatim under the explicit Lead instruction, A19 and A28. The full current truth check is owed at promotion; the independent batch sample remains owed.
