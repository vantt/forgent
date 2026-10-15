# Specs and UI file triage

Author: codex-session:unit-run-1792045007741-a245b0a6@2026-10-15. Source commit: `111adc51fd047d99121fd9d076eb4794c87045a4`. All triage and all 566 source decisions are pending independent review. A19/P1 liveness ran first (224 sections); no retired subject is established. Frozen source text is carried without truth correction. Generated outputs are retained in place. Map overrides are per file below; the frozen map is not edited.

| Source | Units | Source class | Kind | Disposition | Candidate targets / override |
|---|---:|---|---|---|---|
| docs/specs/decision-citation-drift.md | 20 | maintained-authority | spec | move | `docs/platform/decision-citation-drift/spec.md` |
| docs/specs/distillery.md | 21 | maintained-authority | spec | move | `docs/platform/distillery/spec.md` |
| docs/specs/fgos-plugin.md | 45 | maintained-authority | spec | move | `docs/platform/claude-plugin/spec.md` |
| docs/specs/herdr-web-dashboard.md | 44 | maintained-authority | spec | move | `docs/platform/herdr-web-dashboard/spec.md` |
| docs/ui-spec/00-overview.md | 16 | maintained-authority | spec | move | `docs/platform/ui-spec/spec.md` |
| docs/ui-spec/15-system-events.md | 9 | maintained-authority | contract | move | `docs/platform/ui-spec/contracts/15-system-events.md` |
| docs/ui-spec/20-domain-rules.md | 5 | maintained-authority | contract | move | `docs/platform/ui-spec/contracts/20-domain-rules.md` |
| docs/ui-spec/30-states-and-errors.md | 30 | maintained-authority | contract | move | `docs/platform/ui-spec/contracts/30-states-and-errors.md` |
| docs/ui-spec/components/C01-item-card.md | 12 | maintained-authority | architecture | move | `docs/platform/ui-spec/architecture/components/C01-item-card.md` |
| docs/ui-spec/flows/F01-answer-a-parked-question.md | 10 | maintained-authority | guide-runbook | move | `docs/platform/ui-spec/operations/F01-answer-a-parked-question.md` |
| docs/ui-spec/flows/F02-approve-a-merge.md | 9 | maintained-authority | guide-runbook | move | `docs/platform/ui-spec/operations/F02-approve-a-merge.md` |
| docs/ui-spec/generated/action-registry.csv | 1 | generated | history | regenerate-from-source | **Map override (A9/N1, constitution §4):** Declared ui-spec build output remains at its legacy path; regenerate using .claude/skills/ui-spec/tools/build.mjs and interpret-wireframe.mjs against docs/ui-spec. No candidate snapshot or candidate carrier is created. |
| docs/ui-spec/generated/coverage-report.md | 5 | generated | history | regenerate-from-source | **Map override (A9/N1, constitution §4):** Declared ui-spec build output remains at its legacy path; regenerate using .claude/skills/ui-spec/tools/build.mjs and interpret-wireframe.mjs against docs/ui-spec. No candidate snapshot or candidate carrier is created. |
| docs/ui-spec/generated/navigation-graph.yaml | 1 | generated | history | regenerate-from-source | **Map override (A9/N1, constitution §4):** Declared ui-spec build output remains at its legacy path; regenerate using .claude/skills/ui-spec/tools/build.mjs and interpret-wireframe.mjs against docs/ui-spec. No candidate snapshot or candidate carrier is created. |
| docs/ui-spec/generated/surface-registry.yaml | 1 | generated | history | regenerate-from-source | **Map override (A9/N1, constitution §4):** Declared ui-spec build output remains at its legacy path; regenerate using .claude/skills/ui-spec/tools/build.mjs and interpret-wireframe.mjs against docs/ui-spec. No candidate snapshot or candidate carrier is created. |
| docs/ui-spec/generated/wireframe-v2.html | 1 | generated | history | regenerate-from-source | **Map override (A9/N1, constitution §4):** Declared ui-spec build output remains at its legacy path; regenerate using .claude/skills/ui-spec/tools/build.mjs and interpret-wireframe.mjs against docs/ui-spec. No candidate snapshot or candidate carrier is created. |
| docs/ui-spec/modals/M01-answer-question.md | 11 | maintained-authority | architecture | move | `docs/platform/ui-spec/architecture/modals/M01-answer-question.md` |
| docs/ui-spec/modals/M02-approve-merge.md | 12 | maintained-authority | architecture | move | `docs/platform/ui-spec/architecture/modals/M02-approve-merge.md` |
| docs/ui-spec/modals/M03-add-edit-item.md | 13 | maintained-authority | architecture | move | `docs/platform/ui-spec/architecture/modals/M03-add-edit-item.md` |
| docs/ui-spec/schema/surface-contract.schema.json | 1 | maintained-authority | history | move | `docs/platform/ui-spec/history/schema/surface-contract.schema.json` |
| docs/ui-spec/screens/S01-sign-in.md | 14 | maintained-authority | architecture | move | `docs/platform/ui-spec/architecture/screens/S01-sign-in.md` |
| docs/ui-spec/screens/S02-taskboard.md | 20 | maintained-authority | architecture | move | `docs/platform/ui-spec/architecture/screens/S02-taskboard.md` |
| docs/ui-spec/screens/S03-task-detail.md | 24 | maintained-authority | architecture | move | `docs/platform/ui-spec/architecture/screens/S03-task-detail.md` |
| docs/ui-spec/screens/S04-questions-needing-answer.md | 15 | maintained-authority | architecture | move | `docs/platform/ui-spec/architecture/screens/S04-questions-needing-answer.md` |
| docs/ui-spec/spec.config.yaml | 1 | maintained-authority | architecture | move | `docs/platform/ui-spec/architecture/spec.config.yaml` |
| docs/specs/observe.md | 25 | maintained-authority | spec | split | `docs/platform/observe/spec.md`, `docs/platform/observe/decisions/observe-component-architecture.md` |
| docs/specs/confinement-authority.md | 200 | maintained-authority | spec | split | `docs/platform/agent-confinement/spec.md`, `docs/platform/agent-confinement/contracts/confinement-authority-v1.md`, `docs/platform/agent-confinement/history/rollout-and-settled-facts.md`, `docs/platform/agent-confinement/decisions/confinement-authority-decisions.md` |

## Added in candidate subdivisions

Confinement §6 is a contract; §10, §13 leading settled risks and the whole mixed §13.1 are historical carriage (including its recipe), §12 and §13.3 are decision carriage. §13.2 and Open Deferred Items stay in the spec under a labelled new parent. Observe §6 is decision carriage. All source text, original headings and numbering are retained; historical placement certifies neither retirement of its subject nor truth of its current assertions. The new files and parent scaffolding are labelled Added in candidate.

## Truth and tool obligations

Lead evidence §4 names stale plugin verb count/coverage, confinement migration state, retired citation corpus/.bee path, observe migrate/archive path, dashboard dead links and UI generated/gitignore assertion. Carry them verbatim under A19/A28; later independent truth sample and promotion truth review remain owed. ui-spec kinds follow the map. The working compiler keeps docs/ui-spec as its root; promotion must repoint tools or retain that root. Machine files are byte-equal with adjacent provenance sidecars; Markdown front matter remains first and byte-equal.
