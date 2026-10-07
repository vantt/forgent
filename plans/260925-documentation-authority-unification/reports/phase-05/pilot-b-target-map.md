# Pilot B Target Map: Work State Area

Target map for the two legacy sources of the area "Work state / work lifecycle engine" ([docs/specs/work-state.md](../../../../docs/specs/work-state.md), 325 unit rows; [docs/io-contract.md](../../../../docs/io-contract.md), 41 unit rows) into candidate documents under `docs/platform/work-state/`. Every source unit (heading or unheaded block) is mapped to exactly one target heading. The target headings below are the anchors to freeze after review. Generated and sum-checked by script; the maps in sections 4 and 5 are exhaustive.

## 1. Candidate Header Template For The Authoring Step

Every target document opens with one H1, then this fenced `txt` block (candidate core, constitution section 3; field list from doc-governance section 5, reduced to the candidate level). `Related:` paths in the block must also appear as relative markdown links in the body section `Related Files`. Status is read from the switchboard, so `Candidate` is descriptive only.

```txt
Document type: <Area portal | Spec | Contract | Architecture | Decision | History>
Audience: Human reviewer, architect, maintainer, implementation agent
Purpose: <one sentence naming what this document owns>
Design status: Candidate
Last reviewed: 2026-10-06
Related:
- docs/platform/work-state/README.md
- <every other path that the body links in Related Files>
```

Document type values come from the constitution `documentTypeAliases` (`Area portal`, `Spec`, `Contract`, `Architecture`, `Decision`, `History`), so each classifies to its kind without an unmapped type. Rules for all targets: one H1 only, sections start at H2 and are numbered (`## 1. Purpose And Scope`), H3 and H4 are not numbered, and no promotion fields (`Canonical for`, `Supersedes`) are added before the cutover.

## 2. Target Layout And Placement Justification

Directory `docs/platform/work-state/` (new). Six documents: five content documents plus the portal. Cap respected (3 to 6 plus portal).

| Target document | Kind | Constitution rule (minimum-constitution.md) | Why this placement | Rows ws / io | H2 / H3 / H4 |
|---|---|---|---|---:|---|
| `docs/platform/work-state/README.md` | `area-portal` | `area-portal`, section 2 table: `<A>README.md`, singleton per area | Entry for the area; scaffolding and navigation only, no source rows. The promoted areas (host-invocation-routing, packaging-distribution) use the same shape. | 0 / 0 | 5 / 0 / 0 |
| `docs/platform/work-state/spec.md` | `spec` | `spec`, section 2 table: `<A>spec.md`, singleton per area | Observable behavior, state model, records, stages, verbs and rules. One spec per area, so all `specification` rows land here and nowhere else. | 140 / 0 | 16 / 35 / 0 |
| `docs/platform/work-state/contracts/cli-io-contract.md` | `contract` | `contract`, section 2 table: `<A>contracts/**`, collection | The CLI input/output surface (writer identity, envelope, exit codes, pagination, manifest, version tokens) is a normative interface invariant. docs/io-contract.md is already a contract and the switchboard calls it the canonical CLI/runner I/O contract. Contracts outrank guides (section 5), so the duplicated work-state text merges into it. | 18 / 41 | 13 / 11 / 0 |
| `docs/platform/work-state/architecture/implementation-pointers.md` | `architecture` | `architecture`, section 2 table: `<A>architecture/**`, collection | The implementation pointers describe which module owns which responsibility; this is component topology, not observable behavior and not navigation to documents. | 2 / 0 | 3 / 0 / 0 |
| `docs/platform/work-state/decisions/retired-decision-history.md` | `decision` | `decision`, section 2 table: `<A>decisions/**`, collection | The 165-row retired-decision section is twelve ADR records (0002 to 0032). Fixed document cap forbids twelve files, so one decision-history document with one H2 per ADR; per-ADR anchors stay stable if a later split happens. | 156 / 0 | 14 / 43 / 6 |
| `docs/platform/work-state/history/multi-role-harness-distill-record.md` | `history` | `history`, section 2 table: `<A>history/**`, collection, non-canonical | Dated narrative rows (ADR 0032 journey, state at distill time, post-distill review) are `historical-context`, which only History and Knowledge documents may serve (vocabulary section 2). They keep their provenance without competing with the decision text. | 9 / 0 | 5 / 0 / 0 |

Heading totals across the six documents: 56 H2, 89 H3, 6 H4 = 151 named headings (H1 titles not counted).

Placement rules applied beyond the table:

- No `verification/` document: no source row is an empirical proof or receipt (constitution kind `verification`). The ADR 0027 consumer audit is blast-radius evidence inside a decision, and the ADR 0032 post-distill recap is a dated narrative; both stay with their decision or history owner. Authoring must not create a `verification/` directory for them.
- No `<collection>/README.md` collection indexes (`collection-index` kind): they are optional singletons and would exceed the document cap. The portal links the contract, architecture, decision and history documents directly.
- No `vision.md` or `intent-preservation-ledger.md`: no source row is a vision or an intent record. The retained source `docs/work-item-lifecycle-vision.md` (third source of this area in the switchboard) is outside this pilot and would own the area vision later; see section 11 item 11.
- One owner per claim (constitution section 1 and migration-authoring-rules section 1): where the two sources state the same claim, both rows target the same heading (disposition `merge`, section 6), so exactly one document owns the text.

## 3. Heading Registry (Frozen After Review)

GitHub-style anchors: lower-case, spaces to hyphens, punctuation removed (`1. Purpose` becomes `1-purpose`). Uniqueness of anchors per document was checked by script. "Scaffold" marks a section with no source rows. Row counts are unit rows (ws = work-state.md, io = io-contract.md).

### docs/platform/work-state/README.md

| Level | Heading | Anchor | Rows ws | Rows io | Scaffold |
|---|---|---|---:|---:|---|
| H2 | 1. Purpose And Audience | `#1-purpose-and-audience` | 0 | 0 | yes |
| H2 | 2. Read First | `#2-read-first` | 0 | 0 | yes |
| H2 | 3. Document Map | `#3-document-map` | 0 | 0 | yes |
| H2 | 4. Legacy Source Pointers | `#4-legacy-source-pointers` | 0 | 0 | yes |
| H2 | 5. Related Files | `#5-related-files` | 0 | 0 | yes |

### docs/platform/work-state/spec.md

| Level | Heading | Anchor | Rows ws | Rows io | Scaffold |
|---|---|---|---:|---:|---|
| H2 | 1. Purpose And Scope | `#1-purpose-and-scope` | 2 | 0 |  |
| H2 | 2. Entry Points And Triggers | `#2-entry-points-and-triggers` | 2 | 0 |  |
| H2 | 3. Work Item Data Dictionary | `#3-work-item-data-dictionary` | 2 | 0 |  |
| H2 | 4. Capture And Evidence Records | `#4-capture-and-evidence-records` | 0 | 0 | yes |
| H3 | Outcome Record | `#outcome-record` | 4 | 0 |  |
| H3 | Friction Record | `#friction-record` | 4 | 0 |  |
| H3 | Settlement Record | `#settlement-record` | 6 | 0 |  |
| H3 | Close Lesson Record | `#close-lesson-record` | 5 | 0 |  |
| H3 | Human Gate Record | `#human-gate-record` | 4 | 0 |  |
| H3 | Discovery Gate Record | `#discovery-gate-record` | 4 | 0 |  |
| H2 | 5. Workflow Step And Stage Model | `#5-workflow-step-and-stage-model` | 0 | 0 | yes |
| H3 | Workflow Step Replaces Stage | `#workflow-step-replaces-stage` | 5 | 0 |  |
| H3 | Discovery And Exploring Stages | `#discovery-and-exploring-stages` | 7 | 0 |  |
| H3 | Planning Stage | `#planning-stage` | 8 | 0 |  |
| H2 | 6. Domain Model | `#6-domain-model` | 11 | 0 |  |
| H2 | 7. Pull Door Take And Return | `#7-pull-door-take-and-return` | 4 | 0 |  |
| H3 | Branch Proposal Completion | `#branch-proposal-completion` | 3 | 0 |  |
| H2 | 8. Tool Registry | `#8-tool-registry` | 0 | 0 | yes |
| H3 | Registry Projection And Registration Standard | `#registry-projection-and-registration-standard` | 3 | 0 |  |
| H3 | Tool Registry Verbs | `#tool-registry-verbs` | 2 | 0 |  |
| H2 | 9. Behaviors And Operations | `#9-behaviors-and-operations` | 1 | 0 |  |
| H3 | Init Verb | `#init-verb` | 2 | 0 |  |
| H3 | Add Verb | `#add-verb` | 3 | 0 |  |
| H3 | Submit Verb | `#submit-verb` | 2 | 0 |  |
| H3 | Discover Verb | `#discover-verb` | 2 | 0 |  |
| H3 | Plan Verb | `#plan-verb` | 2 | 0 |  |
| H3 | Move Verb | `#move-verb` | 2 | 0 |  |
| H3 | Edit Verb | `#edit-verb` | 3 | 0 |  |
| H3 | Decision Verb | `#decision-verb` | 2 | 0 |  |
| H3 | Ask Verb | `#ask-verb` | 2 | 0 |  |
| H3 | Answer Verb | `#answer-verb` | 2 | 0 |  |
| H3 | Outcome Recording | `#outcome-recording` | 2 | 0 |  |
| H3 | Check Verb | `#check-verb` | 2 | 0 |  |
| H3 | Docs Index Verb | `#docs-index-verb` | 2 | 0 |  |
| H3 | Rollup Verb | `#rollup-verb` | 2 | 0 |  |
| H3 | Triage Verb | `#triage-verb` | 2 | 0 |  |
| H3 | Take Verb | `#take-verb` | 2 | 0 |  |
| H3 | Pick Verb | `#pick-verb` | 2 | 0 |  |
| H3 | Return Verb | `#return-verb` | 2 | 0 |  |
| H3 | Rebuild Verb | `#rebuild-verb` | 2 | 0 |  |
| H3 | List And Ready Verbs | `#list-and-ready-verbs` | 2 | 0 |  |
| H3 | Graph Verb | `#graph-verb` | 3 | 0 |  |
| H3 | Stale Verb | `#stale-verb` | 3 | 0 |  |
| H3 | Conflicts Verb | `#conflicts-verb` | 3 | 0 |  |
| H2 | 10. Actors And Access | `#10-actors-and-access` | 2 | 0 |  |
| H2 | 11. Business Rules | `#11-business-rules` | 2 | 0 |  |
| H2 | 12. Edge Cases Settled | `#12-edge-cases-settled` | 2 | 0 |  |
| H2 | 13. Known Gaps And Deferred Work | `#13-known-gaps-and-deferred-work` | 3 | 0 |  |
| H2 | 14. Presentation Surface | `#14-presentation-surface` | 2 | 0 |  |
| H2 | 15. Source Provenance And Coverage | `#15-source-provenance-and-coverage` | 1 | 0 |  |
| H2 | 16. Related Files | `#16-related-files` | 0 | 0 | yes |

### docs/platform/work-state/contracts/cli-io-contract.md

| Level | Heading | Anchor | Rows ws | Rows io | Scaffold |
|---|---|---|---:|---:|---|
| H2 | 1. Purpose And Scope | `#1-purpose-and-scope` | 0 | 3 |  |
| H2 | 2. Input Direction Verb And Identity | `#2-input-direction-verb-and-identity` | 0 | 1 |  |
| H3 | Single Write Door | `#single-write-door` | 0 | 1 |  |
| H3 | Writer Identity | `#writer-identity` | 3 | 2 |  |
| H3 | Writer Source Trust Levels | `#writer-source-trust-levels` | 1 | 1 |  |
| H3 | Writer Resolution Rules | `#writer-resolution-rules` | 2 | 0 |  |
| H3 | Caller Role | `#caller-role` | 0 | 1 |  |
| H2 | 3. Output Direction Unified Envelope | `#3-output-direction-unified-envelope` | 0 | 1 |  |
| H3 | Envelope Shape | `#envelope-shape` | 2 | 3 |  |
| H3 | Error Path Is Not Enveloped | `#error-path-is-not-enveloped` | 1 | 0 |  |
| H3 | Runner Stdout Envelope | `#runner-stdout-envelope` | 1 | 1 |  |
| H3 | Recognizing A Real Envelope | `#recognizing-a-real-envelope` | 0 | 1 |  |
| H2 | 4. Exit Codes | `#4-exit-codes` | 0 | 2 |  |
| H2 | 5. Reasoned Envelope Exceptions | `#5-reasoned-envelope-exceptions` | 0 | 4 |  |
| H2 | 6. Cursor Pagination | `#6-cursor-pagination` | 1 | 3 |  |
| H2 | 7. Machine-Readable Verb Registry | `#7-machine-readable-verb-registry` | 0 | 1 |  |
| H3 | Manifest Shape | `#manifest-shape` | 2 | 1 |  |
| H3 | Entry Fields And Effect Axes | `#entry-fields-and-effect-axes` | 1 | 2 |  |
| H2 | 8. Multi-Value Flag Convention | `#8-multi-value-flag-convention` | 1 | 2 |  |
| H2 | 9. Per-Verb Help | `#9-per-verb-help` | 3 | 0 |  |
| H2 | 10. Version Tokens | `#10-version-tokens` | 0 | 4 |  |
| H2 | 11. Scope Boundary | `#11-scope-boundary` | 0 | 5 |  |
| H2 | 12. References | `#12-references` | 0 | 2 |  |
| H2 | 13. Related Files | `#13-related-files` | 0 | 0 | yes |

### docs/platform/work-state/architecture/implementation-pointers.md

| Level | Heading | Anchor | Rows ws | Rows io | Scaffold |
|---|---|---|---:|---:|---|
| H2 | 1. Purpose And Scope | `#1-purpose-and-scope` | 0 | 0 | yes |
| H2 | 2. Implementation Pointers | `#2-implementation-pointers` | 2 | 0 |  |
| H2 | 3. Related Files | `#3-related-files` | 0 | 0 | yes |

### docs/platform/work-state/decisions/retired-decision-history.md

| Level | Heading | Anchor | Rows ws | Rows io | Scaffold |
|---|---|---|---:|---:|---|
| H2 | 1. Provenance Of Retired Decisions | `#1-provenance-of-retired-decisions` | 2 | 0 |  |
| H2 | 2. ADR 0002 Flat Work Model | `#2-adr-0002-flat-work-model` | 3 | 0 |  |
| H3 | 0002 Context | `#0002-context` | 2 | 0 |  |
| H3 | 0002 Decision | `#0002-decision` | 2 | 0 |  |
| H3 | 0002 Consequences | `#0002-consequences` | 3 | 0 |  |
| H2 | 3. ADR 0003 Naming And Data Layout | `#3-adr-0003-naming-and-data-layout` | 1 | 0 |  |
| H3 | 0003 Context | `#0003-context` | 2 | 0 |  |
| H3 | 0003 Decision | `#0003-decision` | 2 | 0 |  |
| H3 | 0003 Consequences | `#0003-consequences` | 3 | 0 |  |
| H2 | 4. ADR 0004 Scope And Non-Goals | `#4-adr-0004-scope-and-non-goals` | 1 | 0 |  |
| H3 | 0004 Context | `#0004-context` | 3 | 0 |  |
| H3 | 0004 Decision | `#0004-decision` | 2 | 0 |  |
| H3 | 0004 Consequences | `#0004-consequences` | 3 | 0 |  |
| H2 | 5. ADR 0006 Proposed Status | `#5-adr-0006-proposed-status` | 1 | 0 |  |
| H3 | 0006 Context | `#0006-context` | 3 | 0 |  |
| H3 | 0006 Decision | `#0006-decision` | 4 | 0 |  |
| H3 | 0006 Consequences | `#0006-consequences` | 3 | 0 |  |
| H2 | 6. ADR 0007 Schema And Event Evolution | `#6-adr-0007-schema-and-event-evolution` | 1 | 0 |  |
| H3 | 0007 Context | `#0007-context` | 2 | 0 |  |
| H3 | 0007 Decision | `#0007-decision` | 3 | 0 |  |
| H3 | 0007 Consequences | `#0007-consequences` | 3 | 0 |  |
| H2 | 7. ADR 0011 Explicit Version For Every Contract | `#7-adr-0011-explicit-version-for-every-contract` | 1 | 0 |  |
| H3 | 0011 Context | `#0011-context` | 3 | 0 |  |
| H3 | 0011 Decision | `#0011-decision` | 3 | 0 |  |
| H3 | 0011 Consequences | `#0011-consequences` | 3 | 0 |  |
| H2 | 8. ADR 0012 Unified Typed-Edge Graph Model | `#8-adr-0012-unified-typed-edge-graph-model` | 1 | 0 |  |
| H3 | 0012 Context | `#0012-context` | 4 | 0 |  |
| H3 | 0012 Decision | `#0012-decision` | 2 | 0 |  |
| H3 | 0012 Consequences | `#0012-consequences` | 3 | 0 |  |
| H2 | 9. ADR 0013 Report-Not-Write Channel For Discovered-From | `#9-adr-0013-report-not-write-channel-for-discovered-from` | 1 | 0 |  |
| H3 | 0013 Context | `#0013-context` | 3 | 0 |  |
| H3 | 0013 Decision | `#0013-decision` | 6 | 0 |  |
| H3 | 0013 Consequences | `#0013-consequences` | 2 | 0 |  |
| H3 | 0013 Trust Boundary | `#0013-trust-boundary` | 2 | 0 |  |
| H3 | 0013 Delivery Guarantee | `#0013-delivery-guarantee` | 2 | 0 |  |
| H3 | 0013 Alternatives Considered | `#0013-alternatives-considered` | 2 | 0 |  |
| H2 | 10. ADR 0019 Pre-Release Exemption For The Schema Evolution Rule | `#10-adr-0019-pre-release-exemption-for-the-schema-evolution-rule` | 1 | 0 |  |
| H3 | 0019 Context | `#0019-context` | 3 | 0 |  |
| H3 | 0019 Decision | `#0019-decision` | 4 | 0 |  |
| H3 | 0019 Consequences | `#0019-consequences` | 2 | 0 |  |
| H2 | 11. ADR 0024 Rename Proposed Status To Awaiting-Approval | `#11-adr-0024-rename-proposed-status-to-awaiting-approval` | 1 | 0 |  |
| H3 | 0024 Context | `#0024-context` | 4 | 0 |  |
| H3 | 0024 Decision | `#0024-decision` | 3 | 0 |  |
| H3 | 0024 Consequences | `#0024-consequences` | 3 | 0 |  |
| H2 | 12. ADR 0027 Domain Owns The Pre-Delivered Status Vocabulary | `#12-adr-0027-domain-owns-the-pre-delivered-status-vocabulary` | 1 | 0 |  |
| H3 | 0027 Context | `#0027-context` | 4 | 0 |  |
| H3 | 0027 Decision | `#0027-decision` | 8 | 0 |  |
| H3 | 0027 Consumer Audit | `#0027-consumer-audit` | 2 | 0 |  |
| H4 | 0027 Audit 1 Status Source Of Truth | `#0027-audit-1-status-source-of-truth` | 2 | 0 |  |
| H4 | 0027 Audit 2 Resolved Statuses Set | `#0027-audit-2-resolved-statuses-set` | 3 | 0 |  |
| H4 | 0027 Audit 3 CLI Status Literals | `#0027-audit-3-cli-status-literals` | 2 | 0 |  |
| H4 | 0027 Audit 4 Runner Consumers | `#0027-audit-4-runner-consumers` | 2 | 0 |  |
| H4 | 0027 Audit 5 Other Domain-Agnostic Mechanisms | `#0027-audit-5-other-domain-agnostic-mechanisms` | 2 | 0 |  |
| H4 | 0027 Audit 6 Adjacent Gaps | `#0027-audit-6-adjacent-gaps` | 2 | 0 |  |
| H3 | 0027 Consequences | `#0027-consequences` | 2 | 0 |  |
| H2 | 13. ADR 0032 Multi-Role Team Harness | `#13-adr-0032-multi-role-team-harness` | 2 | 0 |  |
| H3 | 0032 Foundation Architecture | `#0032-foundation-architecture` | 2 | 0 |  |
| H3 | 0032 Handoff | `#0032-handoff` | 2 | 0 |  |
| H3 | 0032 Declarative Structure | `#0032-declarative-structure` | 2 | 0 |  |
| H3 | 0032 Implementation Sequence | `#0032-implementation-sequence` | 4 | 0 |  |
| H3 | 0032 Marketing Cockpit Comparison Conclusion | `#0032-marketing-cockpit-comparison-conclusion` | 4 | 0 |  |
| H3 | 0032 Deliberately Deferred Questions | `#0032-deliberately-deferred-questions` | 2 | 0 |  |
| H2 | 14. Related Files | `#14-related-files` | 0 | 0 | yes |

### docs/platform/work-state/history/multi-role-harness-distill-record.md

| Level | Heading | Anchor | Rows ws | Rows io | Scaffold |
|---|---|---|---:|---:|---|
| H2 | 1. Purpose And Scope | `#1-purpose-and-scope` | 0 | 0 | yes |
| H2 | 2. Distill Journey | `#2-distill-journey` | 2 | 0 |  |
| H2 | 3. State At Distill Time | `#3-state-at-distill-time` | 2 | 0 |  |
| H2 | 4. Implementation Review And Verification After Distill | `#4-implementation-review-and-verification-after-distill` | 5 | 0 |  |
| H2 | 5. Related Files | `#5-related-files` | 0 | 0 | yes |

## 4. Source To Target Map: docs/specs/work-state.md

Rows are grouped consecutive units of one section. "Units" is the number of TSV rows in the group. "Generator kind" is `specification` for every row (the inventory default); "Proposed kind" is the vocabulary kind the row should carry. Anchors are exact (section 3).

| Source lines | Units | Source section (first unit) | Generator kind | Proposed kind | Target | Note |
|---|---:|---|---|---|---|---|
| 1-7 | 1 | (unheaded block) | specification | historical-context (generator wrong) | `docs/platform/work-state/spec.md#15-source-provenance-and-coverage` | YAML front matter: sources, decisions, coverage: partial |
| 9-11 | 2 | spec-work-state-tầng-quản-việc-của-forgent | specification | specification | `docs/platform/work-state/spec.md#1-purpose-and-scope` | Title and purpose paragraph |
| 13-38 | 2 | entry-points-triggers | specification | specification | `docs/platform/work-state/spec.md#2-entry-points-and-triggers` |  |
| 40-75 | 2 | data-dictionary | specification | specification | `docs/platform/work-state/spec.md#3-work-item-data-dictionary` |  |
| 77-99 | 4 | bản-ghi-kết-quả-outcome-dự-đoán-thực-tế | specification | specification | `docs/platform/work-state/spec.md#outcome-record` |  |
| 101-121 | 4 | bản-ghi-friction-kênh-2-của-capture-phase-3-slice-2 | specification | specification | `docs/platform/work-state/spec.md#friction-record` |  |
| 123-152 | 6 | bản-ghi-settlement-kênh-1-của-capture-2-kênh-phase-3-s3-closeout | specification | specification | `docs/platform/work-state/spec.md#settlement-record` |  |
| 154-167 | 3 | danh-tính-người-ghi-writer-cá-thể-tách-bạch-khỏi-vai-str46-io-contract | specification | contract (generator wrong) | `docs/platform/work-state/contracts/cli-io-contract.md#writer-identity` | Merged with the io-contract writer rows (duplicate content); embedded English sentence on the gates[id] version token (line 163) belongs with Version Tokens, same owner doc |
| 169-174 | 1 | (unheaded block) | specification | contract (generator wrong) | `docs/platform/work-state/contracts/cli-io-contract.md#writer-source-trust-levels` | Merged with io-contract writer.source list |
| 176-191 | 2 | (unheaded block) | specification | contract (generator wrong) | `docs/platform/work-state/contracts/cli-io-contract.md#writer-resolution-rules` |  |
| 193-215 | 5 | bài-học-lúc-đóng-câu-6-tự-động-phase-3-s3-closeout | specification | specification | `docs/platform/work-state/spec.md#close-lesson-record` |  |
| 217-237 | 4 | bản-ghi-cổng-người-gate-câu-hỏi-câu-trả-lời-ảnh-chụp-gốc | specification | specification | `docs/platform/work-state/spec.md#human-gate-record` |  |
| 239-262 | 5 | work-không-còn-stage-bước-đến-từ-workflow-đường-đọc-dữ-liệu-cũ | specification | specification | `docs/platform/work-state/spec.md#workflow-step-replaces-stage` |  |
| 264-337 | 7 | giai-đoạn-soi-rõ-bước-discovery-và-đào-sâu-bước-exploring | specification | specification | `docs/platform/work-state/spec.md#discovery-and-exploring-stages` |  |
| 339-355 | 4 | bản-ghi-cổng-discovery | specification | specification | `docs/platform/work-state/spec.md#discovery-gate-record` |  |
| 357-439 | 8 | giai-đoạn-lập-kế-hoạch-stage-planning | specification | specification | `docs/platform/work-state/spec.md#planning-stage` |  |
| 441-536 | 11 | mô-hình-domain-base-workflow-domain-extension | specification | specification | `docs/platform/work-state/spec.md#6-domain-model` |  |
| 538-585 | 4 | cửa-pull-giaonhận-việc-takereturn | specification | specification | `docs/platform/work-state/spec.md#7-pull-door-take-and-return` |  |
| 587-620 | 3 | cửa-pull-mở-rộng-hoàn-tất-một-đề-xuất-nguồn-nhánh-bị-đỗ | specification | specification | `docs/platform/work-state/spec.md#branch-proposal-completion` |  |
| 622-634 | 2 | phong-bì-output-envelope-chuẩn-máy-đọc-của-mọi-verb-per-d-b2d18cc7-b0da87aa | specification | contract (generator wrong) | `docs/platform/work-state/contracts/cli-io-contract.md#envelope-shape` | Merged with io-contract envelope rows (duplicate content) |
| 636-639 | 1 | (unheaded block) | specification | contract (generator wrong) | `docs/platform/work-state/contracts/cli-io-contract.md#error-path-is-not-enveloped` | io-contract carries the same claim inside its envelope-shape unit (57-60) |
| 641-645 | 1 | (unheaded block) | specification | contract (generator wrong) | `docs/platform/work-state/contracts/cli-io-contract.md#runner-stdout-envelope` | Merged with io-contract runner single-line rule |
| 647-663 | 2 | sổ-verb-máy-đọc-manifest---help---json | specification | contract (generator wrong) | `docs/platform/work-state/contracts/cli-io-contract.md#manifest-shape` | Merged with io-contract manifest rows |
| 665-676 | 1 | (unheaded block) | specification | contract (generator wrong) | `docs/platform/work-state/contracts/cli-io-contract.md#entry-fields-and-effect-axes` | CONFLICT with io 124-134: spec says only review and approve carry externalEffect, io says review, approve, coordination |
| 678-702 | 1 | (unheaded block) | specification | contract (generator wrong) | `docs/platform/work-state/contracts/cli-io-contract.md#6-cursor-pagination` | Superset of io rows: adds the permanent list --all --json exception and list side-log narrowing |
| 704-711 | 1 | (unheaded block) | specification | contract (generator wrong) | `docs/platform/work-state/contracts/cli-io-contract.md#8-multi-value-flag-convention` | Merged with io-contract rows |
| 713-731 | 3 | trợ-giúp-theo-từng-verb-fgos---help | specification | contract (generator wrong) | `docs/platform/work-state/contracts/cli-io-contract.md#9-per-verb-help` | Runs-when/Blocked-when form, but the claim is a CLI surface guarantee |
| 733-768 | 3 | sổ-đăng-ký-công-cụ-tool-registry-hai-chiều-tách-chuẩn-đăng-ký-khỏi-đang-hiện-diện | specification | specification | `docs/platform/work-state/spec.md#registry-projection-and-registration-standard` |  |
| 770-799 | 2 | đăng-kýgỡprobehỏi-công-cụ-tool-register-check-query-remove | specification | specification | `docs/platform/work-state/spec.md#tool-registry-verbs` |  |
| 801-801 | 1 | behaviors-operations | specification | specification | `docs/platform/work-state/spec.md#9-behaviors-and-operations` |  |
| 803-831 | 2 | khởi-tạo-init | specification | specification | `docs/platform/work-state/spec.md#init-verb` |  |
| 833-855 | 3 | khai-việc-add-bề-mặt-nội-bộ | specification | specification | `docs/platform/work-state/spec.md#add-verb` |  |
| 857-912 | 2 | nộp-vấn-đề-tự-do-submit | specification | specification | `docs/platform/work-state/spec.md#submit-verb` |  |
| 914-950 | 2 | chạy-context-discovery-discover | specification | specification | `docs/platform/work-state/spec.md#discover-verb` |  |
| 952-974 | 2 | chạy-phán-chia-việc-plan | specification | specification | `docs/platform/work-state/spec.md#plan-verb` |  |
| 976-981 | 2 | chuyển-trạng-thái-move | specification | specification | `docs/platform/work-state/spec.md#move-verb` |  |
| 983-1025 | 3 | sửa-việc-edit-luôn-ghi-đè-được-str23-per-work-item-verb-surface | specification | specification | `docs/platform/work-state/spec.md#edit-verb` |  |
| 1027-1030 | 2 | ghi-quyết-định-decision | specification | specification | `docs/platform/work-state/spec.md#decision-verb` |  |
| 1032-1038 | 2 | đưa-vào-chờ-người-ask | specification | specification | `docs/platform/work-state/spec.md#ask-verb` |  |
| 1040-1046 | 2 | trả-lời-answer | specification | specification | `docs/platform/work-state/spec.md#answer-verb` |  |
| 1048-1054 | 2 | ghi-kết-quả-dự-đoánthực-tế-outcome | specification | specification | `docs/platform/work-state/spec.md#outcome-recording` |  |
| 1056-1061 | 2 | đọc-kết-quả-check | specification | specification | `docs/platform/work-state/spec.md#check-verb` |  |
| 1063-1068 | 2 | sinh-chỉ-mục-đọc-theo-tag-tài-liệu-người-dùng-cuối-docs-index | specification | specification | `docs/platform/work-state/spec.md#docs-index-verb` |  |
| 1070-1075 | 2 | xem-tiến-độ-theo-bộ-rollup | specification | specification | `docs/platform/work-state/spec.md#rollup-verb` |  |
| 1077-1082 | 2 | xếp-hạng-tác-động-backlog-triage | specification | specification | `docs/platform/work-state/spec.md#triage-verb` |  |
| 1084-1090 | 2 | cầm-việc-qua-cửa-pull-take | specification | specification | `docs/platform/work-state/spec.md#take-verb` |  |
| 1092-1098 | 2 | cầm-việc-dựng-workspace-pick | specification | specification | `docs/platform/work-state/spec.md#pick-verb` |  |
| 1100-1106 | 2 | trả-việc-qua-cửa-pull-return | specification | specification | `docs/platform/work-state/spec.md#return-verb` |  |
| 1108-1112 | 2 | dựng-lại-rebuild-thao-tác-phục-hồi | specification | specification | `docs/platform/work-state/spec.md#rebuild-verb` |  |
| 1114-1118 | 2 | đọc-list-ready | specification | specification | `docs/platform/work-state/spec.md#list-and-ready-verbs` |  |
| 1120-1132 | 3 | đọc-metrics-đồ-thị-graph-bề-mặt-đọc-thuần-str43 | specification | specification | `docs/platform/work-state/spec.md#graph-verb` |  |
| 1134-1140 | 3 | cố-vấn-item-kẹt-ở-doing-stale-đọc-thuần-không-tự-thu-hồi-s8 | specification | specification | `docs/platform/work-state/spec.md#stale-verb` |  |
| 1142-1147 | 3 | cố-vấn-xung-đột-dấu-chân-file-conflicts-chống-đụng-độ-fan-out-song-song-s9 | specification | specification | `docs/platform/work-state/spec.md#conflicts-verb` |  |
| 1149-1156 | 2 | actors-access | specification | specification | `docs/platform/work-state/spec.md#10-actors-and-access` |  |
| 1158-1213 | 2 | business-rules | specification | specification | `docs/platform/work-state/spec.md#11-business-rules` | Single unit of RUL rules; normative within the area, not a platform law (normative-law is reserved for L1-L8) |
| 1215-1282 | 2 | edge-cases-settled | specification | specification | `docs/platform/work-state/spec.md#12-edge-cases-settled` | Single unit |
| 1284-1299 | 3 | open-gaps | specification | specification | `docs/platform/work-state/spec.md#13-known-gaps-and-deferred-work` | Status future; deferred items are intent-like, see ambiguity note on intent ledger |
| 1301-1303 | 2 | visuals | specification | specification | `docs/platform/work-state/spec.md#14-presentation-surface` | States no screen; kept as non-scope statement |
| 1305-1330 | 2 | pointers-implementation | specification | architecture (generator wrong) | `docs/platform/work-state/architecture/implementation-pointers.md#2-implementation-pointers` | Single unit of module pointers; navigation to code, owned as architecture |
| 1332-1334 | 2 | lịch-sử-quyết-định-retired-từ-docsdecisions-tsk-1lv-4 | specification | historical-context (generator wrong) | `docs/platform/work-state/decisions/retired-decision-history.md#1-provenance-of-retired-decisions` | Statement that the ADRs were relocated verbatim and the corpus is retired |
| 1337-1344 | 3 | 0002-mô-hình-việc-phẳng | specification | decision (generator wrong) | `docs/platform/work-state/decisions/retired-decision-history.md#2-adr-0002-flat-work-model` | Heading, partial-supersession note (by 0012), and a second H1 inside the source; authoring demotes the duplicate title |
| 1346-1351 | 2 | bối-cảnh | specification | decision (generator wrong) | `docs/platform/work-state/decisions/retired-decision-history.md#0002-context` |  |
| 1353-1361 | 2 | quyết-định | specification | decision (generator wrong) | `docs/platform/work-state/decisions/retired-decision-history.md#0002-decision` |  |
| 1363-1372 | 3 | hệ-quả | specification | decision (generator wrong) | `docs/platform/work-state/decisions/retired-decision-history.md#0002-consequences` |  |
| 1374-1374 | 1 | 0003-đặt-tên-bố-cục-dữ-liệu | specification | decision (generator wrong) | `docs/platform/work-state/decisions/retired-decision-history.md#3-adr-0003-naming-and-data-layout` |  |
| 1376-1380 | 2 | bối-cảnh-1 | specification | decision (generator wrong) | `docs/platform/work-state/decisions/retired-decision-history.md#0003-context` |  |
| 1382-1389 | 2 | quyết-định-1 | specification | decision (generator wrong) | `docs/platform/work-state/decisions/retired-decision-history.md#0003-decision` |  |
| 1391-1399 | 3 | hệ-quả-1 | specification | decision (generator wrong) | `docs/platform/work-state/decisions/retired-decision-history.md#0003-consequences` |  |
| 1401-1401 | 1 | 0004-phạm-vi-non-goal | specification | decision (generator wrong) | `docs/platform/work-state/decisions/retired-decision-history.md#4-adr-0004-scope-and-non-goals` |  |
| 1403-1411 | 3 | bối-cảnh-2 | specification | decision (generator wrong) | `docs/platform/work-state/decisions/retired-decision-history.md#0004-context` |  |
| 1413-1421 | 2 | quyết-định-2 | specification | decision (generator wrong) | `docs/platform/work-state/decisions/retired-decision-history.md#0004-decision` |  |
| 1423-1430 | 3 | hệ-quả-2 | specification | decision (generator wrong) | `docs/platform/work-state/decisions/retired-decision-history.md#0004-consequences` |  |
| 1432-1432 | 1 | 0006-trạng-thái-proposed | specification | decision (generator wrong) | `docs/platform/work-state/decisions/retired-decision-history.md#5-adr-0006-proposed-status` | Status proposed was renamed by 0024; keep both records, mark 0006 as superseded in part only if the source states it |
| 1434-1441 | 3 | bối-cảnh-3 | specification | decision (generator wrong) | `docs/platform/work-state/decisions/retired-decision-history.md#0006-context` |  |
| 1443-1459 | 4 | quyết-định-3 | specification | decision (generator wrong) | `docs/platform/work-state/decisions/retired-decision-history.md#0006-decision` |  |
| 1461-1471 | 3 | hệ-quả-3 | specification | decision (generator wrong) | `docs/platform/work-state/decisions/retired-decision-history.md#0006-consequences` |  |
| 1473-1473 | 1 | 0007-tiến-hoá-schema-event | specification | decision (generator wrong) | `docs/platform/work-state/decisions/retired-decision-history.md#6-adr-0007-schema-and-event-evolution` |  |
| 1475-1479 | 2 | bối-cảnh-4 | specification | decision (generator wrong) | `docs/platform/work-state/decisions/retired-decision-history.md#0007-context` |  |
| 1481-1491 | 3 | quyết-định-4 | specification | decision (generator wrong) | `docs/platform/work-state/decisions/retired-decision-history.md#0007-decision` |  |
| 1493-1502 | 3 | hệ-quả-4 | specification | decision (generator wrong) | `docs/platform/work-state/decisions/retired-decision-history.md#0007-consequences` |  |
| 1504-1504 | 1 | 0011-version-tường-minh-cho-mọi-contract | specification | decision (generator wrong) | `docs/platform/work-state/decisions/retired-decision-history.md#7-adr-0011-explicit-version-for-every-contract` |  |
| 1506-1523 | 3 | bối-cảnh-5 | specification | decision (generator wrong) | `docs/platform/work-state/decisions/retired-decision-history.md#0011-context` |  |
| 1525-1544 | 3 | quyết-định-5 | specification | decision (generator wrong) | `docs/platform/work-state/decisions/retired-decision-history.md#0011-decision` |  |
| 1546-1556 | 3 | hệ-quả-5 | specification | decision (generator wrong) | `docs/platform/work-state/decisions/retired-decision-history.md#0011-consequences` |  |
| 1558-1558 | 1 | 0012-mô-hình-đồ-thị-cạnh-định-kiểu-hợp-nhất-thay-thế-depsparent-tách-rời | specification | decision (generator wrong) | `docs/platform/work-state/decisions/retired-decision-history.md#8-adr-0012-unified-typed-edge-graph-model` |  |
| 1560-1581 | 4 | bối-cảnh-6 | specification | decision (generator wrong) | `docs/platform/work-state/decisions/retired-decision-history.md#0012-context` |  |
| 1583-1620 | 2 | quyết-định-6 | specification | decision (generator wrong) | `docs/platform/work-state/decisions/retired-decision-history.md#0012-decision` |  |
| 1622-1633 | 3 | hệ-quả-6 | specification | decision (generator wrong) | `docs/platform/work-state/decisions/retired-decision-history.md#0012-consequences` |  |
| 1635-1635 | 1 | 0013-kênh-báo-cáo-không-ghi-workerrunner-cho-discovered-from | specification | decision (generator wrong) | `docs/platform/work-state/decisions/retired-decision-history.md#9-adr-0013-report-not-write-channel-for-discovered-from` |  |
| 1637-1650 | 3 | bối-cảnh-7 | specification | decision (generator wrong) | `docs/platform/work-state/decisions/retired-decision-history.md#0013-context` |  |
| 1652-1682 | 6 | quyết-định-7 | specification | decision (generator wrong) | `docs/platform/work-state/decisions/retired-decision-history.md#0013-decision` |  |
| 1684-1693 | 2 | hệ-quả-7 | specification | decision (generator wrong) | `docs/platform/work-state/decisions/retired-decision-history.md#0013-consequences` |  |
| 1695-1709 | 2 | ranh-giới-tin-cậy-bổ-chú-2026-07-18-review-fix-s11 | specification | decision (generator wrong) | `docs/platform/work-state/decisions/retired-decision-history.md#0013-trust-boundary` | Dated addendum; obligation-like text kept in the decision record |
| 1711-1717 | 2 | bảo-đảm-giao-nhận-bổ-chú-2026-07-18-review-fix-s11 | specification | decision (generator wrong) | `docs/platform/work-state/decisions/retired-decision-history.md#0013-delivery-guarantee` | Dated addendum |
| 1719-1726 | 2 | phương-án-đã-cân-nhắc-và-bỏ | specification | decision (generator wrong) | `docs/platform/work-state/decisions/retired-decision-history.md#0013-alternatives-considered` |  |
| 1728-1728 | 1 | 0019-miễn-trừ-pre-release-cho-rul11-viết-lại-nhật-ký-tại-chỗ | specification | decision (generator wrong) | `docs/platform/work-state/decisions/retired-decision-history.md#10-adr-0019-pre-release-exemption-for-the-schema-evolution-rule` |  |
| 1730-1742 | 3 | bối-cảnh-8 | specification | decision (generator wrong) | `docs/platform/work-state/decisions/retired-decision-history.md#0019-context` |  |
| 1744-1779 | 4 | quyết-định-8 | specification | decision (generator wrong) | `docs/platform/work-state/decisions/retired-decision-history.md#0019-decision` |  |
| 1781-1789 | 2 | hệ-quả-8 | specification | decision (generator wrong) | `docs/platform/work-state/decisions/retired-decision-history.md#0019-consequences` |  |
| 1791-1791 | 1 | 0024-đổi-tên-status-proposed-thành-awaiting-approval | specification | decision (generator wrong) | `docs/platform/work-state/decisions/retired-decision-history.md#11-adr-0024-rename-proposed-status-to-awaiting-approval` |  |
| 1793-1811 | 4 | bối-cảnh-9 | specification | decision (generator wrong) | `docs/platform/work-state/decisions/retired-decision-history.md#0024-context` |  |
| 1813-1829 | 3 | quyết-định-9 | specification | decision (generator wrong) | `docs/platform/work-state/decisions/retired-decision-history.md#0024-decision` |  |
| 1831-1846 | 3 | hệ-quả-9 | specification | decision (generator wrong) | `docs/platform/work-state/decisions/retired-decision-history.md#0024-consequences` |  |
| 1848-1848 | 1 | 0027-domain-sở-hữu-vocabularytransition-status-đoạn-trước-delivered-supersede-base-workflow-model | specification | decision (generator wrong) | `docs/platform/work-state/decisions/retired-decision-history.md#12-adr-0027-domain-owns-the-pre-delivered-status-vocabulary` |  |
| 1850-1896 | 4 | bối-cảnh-10 | specification | decision (generator wrong) | `docs/platform/work-state/decisions/retired-decision-history.md#0027-context` | Quotes the retired RUL status rule verbatim (historical text inside a decision) |
| 1898-1955 | 8 | quyết-định-10 | specification | decision (generator wrong) | `docs/platform/work-state/decisions/retired-decision-history.md#0027-decision` |  |
| 1957-1968 | 2 | audit-mọi-consumer-thật-của-status-fsmmjsstatusestransitionsliteral-status-hôm-nay | specification | decision (generator wrong) | `docs/platform/work-state/decisions/retired-decision-history.md#0027-consumer-audit` | Evidence of blast radius inside a decision, not a verification record |
| 1970-1977 | 2 | 1-nguồn-sự-thật-định-nghĩa-statusestransitions | specification | decision (generator wrong) | `docs/platform/work-state/decisions/retired-decision-history.md#0027-audit-1-status-source-of-truth` |  |
| 1979-1999 | 3 | 2-resolved_statuses-tập-giống-category-viết-tay-trộn-cả-2-nhóm | specification | decision (generator wrong) | `docs/platform/work-state/decisions/retired-decision-history.md#0027-audit-2-resolved-statuses-set` |  |
| 2001-2014 | 2 | 3-literal-status-trong-verb-logic-của-binfgosmjs-tầng-clistore-chính-là-bảng-transition-của-domain-coding-hôm-nay | specification | decision (generator wrong) | `docs/platform/work-state/decisions/retired-decision-history.md#0027-audit-3-cli-status-literals` |  |
| 2016-2029 | 2 | 4-runner-vòng-tự-hành-tiêu-thụ-nặng-nhóm-đầu | specification | decision (generator wrong) | `docs/platform/work-state/decisions/retired-decision-history.md#0027-audit-4-runner-consumers` |  |
| 2031-2038 | 2 | 5-cơ-chế-domain-agnostic-khác-được-discussionmd-liệt-tường-minh | specification | decision (generator wrong) | `docs/platform/work-state/decisions/retired-decision-history.md#0027-audit-5-other-domain-agnostic-mechanisms` |  |
| 2040-2046 | 2 | 6-gap-liên-quan-nhưng-không-phải-phạm-vi-audit-status-literal-ghi-nhận-để-không-lặp-lại-công-sức | specification | decision (generator wrong) | `docs/platform/work-state/decisions/retired-decision-history.md#0027-audit-6-adjacent-gaps` |  |
| 2048-2077 | 2 | hệ-quả-10 | specification | decision (generator wrong) | `docs/platform/work-state/decisions/retired-decision-history.md#0027-consequences` |  |
| 2079-2090 | 2 | 0032-multi-role-team-harness-trục-roleholder-handoff-và-marketing-cockpit-absorption | specification | decision (generator wrong) | `docs/platform/work-state/decisions/retired-decision-history.md#13-adr-0032-multi-role-team-harness` | Heading plus distill-evidence blockquote |
| 2092-2100 | 2 | hành-trình | specification | historical-context (generator wrong) | `docs/platform/work-state/history/multi-role-harness-distill-record.md#2-distill-journey` |  |
| 2102-2115 | 2 | i-kiến-trúc-nền-seq-18029-18031 | specification | decision (generator wrong) | `docs/platform/work-state/decisions/retired-decision-history.md#0032-foundation-architecture` |  |
| 2117-2137 | 2 | ii-handoff-trái-tim-của-tính-uyển-chuyển-seq-18032-18070-18058 | specification | decision (generator wrong) | `docs/platform/work-state/decisions/retired-decision-history.md#0032-handoff` |  |
| 2139-2206 | 2 | iii-cấu-trúc-khai-báo-seq-18059-18060-18110-18189-18232-18242 | specification | decision (generator wrong) | `docs/platform/work-state/decisions/retired-decision-history.md#0032-declarative-structure` |  |
| 2208-2223 | 4 | iv-trình-tự-triển-khai-seq-18030 | specification | decision (generator wrong) | `docs/platform/work-state/decisions/retired-decision-history.md#0032-implementation-sequence` |  |
| 2225-2246 | 4 | v-kết-luận-so-sánh-marketing-cockpit-vòng-fable-vẫn-đứng-vững | specification | decision (generator wrong) | `docs/platform/work-state/decisions/retired-decision-history.md#0032-marketing-cockpit-comparison-conclusion` |  |
| 2248-2261 | 2 | vi-treo-có-chủ-đích-không-phải-quên | specification | decision (generator wrong) | `docs/platform/work-state/decisions/retired-decision-history.md#0032-deliberately-deferred-questions` |  |
| 2263-2278 | 2 | vii-trạng-thái-tại-thời-điểm-distill-2026-08-15 | specification | historical-context (generator wrong) | `docs/platform/work-state/history/multi-role-harness-distill-record.md#3-state-at-distill-time` | Dated snapshot (2026-08-15) |
| 2280-2320 | 5 | viii-sau-distill-implement-review-độc-lập-và-verify-thật-2026-08-1516 | specification | historical-context (generator wrong) | `docs/platform/work-state/history/multi-role-harness-distill-record.md#4-implementation-review-and-verification-after-distill` | Dated narrative; verification-flavoured but a recap, not a proof record |

## 5. Source To Target Map: docs/io-contract.md

| Source lines | Units | Source section (first unit) | Generator kind | Proposed kind | Target | Note |
|---|---:|---|---|---|---|---|
| 1-15 | 3 | hợp-đồng-io-của-fgos-cửa-cli-bề-mặt-stdout-của-fgos-runner | specification | contract (generator wrong) | `docs/platform/work-state/contracts/cli-io-contract.md#1-purpose-and-scope` | Purpose and goal of the contract |
| 17-17 | 1 | chiều-vào-verb-danh-tính | specification | contract (generator wrong) | `docs/platform/work-state/contracts/cli-io-contract.md#2-input-direction-verb-and-identity` | Section heading |
| 19-20 | 1 | (unheaded block) | specification | contract (generator wrong) | `docs/platform/work-state/contracts/cli-io-contract.md#single-write-door` |  |
| 22-22 | 1 | (unheaded block) | specification | contract (generator wrong) | `docs/platform/work-state/contracts/cli-io-contract.md#writer-identity` |  |
| 24-31 | 1 | (unheaded block) | specification | contract (generator wrong) | `docs/platform/work-state/contracts/cli-io-contract.md#writer-source-trust-levels` | Duplicate of ws 169-174 (merge) |
| 33-39 | 1 | (unheaded block) | specification | contract (generator wrong) | `docs/platform/work-state/contracts/cli-io-contract.md#writer-identity` | Attribution not authentication; merge with ws 154-167 |
| 41-45 | 1 | (unheaded block) | specification | contract (generator wrong) | `docs/platform/work-state/contracts/cli-io-contract.md#caller-role` |  |
| 47-47 | 1 | chiều-ra-envelope-thống-nhất | specification | contract (generator wrong) | `docs/platform/work-state/contracts/cli-io-contract.md#3-output-direction-unified-envelope` |  |
| 49-60 | 3 | (unheaded block) | specification | contract (generator wrong) | `docs/platform/work-state/contracts/cli-io-contract.md#envelope-shape` | Duplicate of ws 622-634 (merge) |
| 62-66 | 1 | (unheaded block) | specification | contract (generator wrong) | `docs/platform/work-state/contracts/cli-io-contract.md#runner-stdout-envelope` | Duplicate of ws 641-645 (merge) |
| 68-71 | 1 | (unheaded block) | specification | contract (generator wrong) | `docs/platform/work-state/contracts/cli-io-contract.md#recognizing-a-real-envelope` |  |
| 73-79 | 2 | mã-thoát-exit-code-một-nguồn-duy-nhất | specification | contract (generator wrong) | `docs/platform/work-state/contracts/cli-io-contract.md#4-exit-codes` |  |
| 81-99 | 4 | ngoại-lệ-có-lý-do | specification | contract (generator wrong) | `docs/platform/work-state/contracts/cli-io-contract.md#5-reasoned-envelope-exceptions` |  |
| 101-115 | 3 | phân-trang-con-trỏ-đục | specification | contract (generator wrong) | `docs/platform/work-state/contracts/cli-io-contract.md#6-cursor-pagination` | Subset of ws 678-702 (merge) |
| 117-117 | 1 | sổ-verb-máy-đọc-cli-tự-mô-tả | specification | contract (generator wrong) | `docs/platform/work-state/contracts/cli-io-contract.md#7-machine-readable-verb-registry` | Section heading |
| 119-122 | 1 | (unheaded block) | specification | contract (generator wrong) | `docs/platform/work-state/contracts/cli-io-contract.md#manifest-shape` | Duplicate of ws 647-663 (merge) |
| 124-137 | 2 | (unheaded block) | specification | contract (generator wrong) | `docs/platform/work-state/contracts/cli-io-contract.md#entry-fields-and-effect-axes` | See conflict with ws 665-676 |
| 139-145 | 2 | quy-ước-cờ-nhiều-giá-trị | specification | contract (generator wrong) | `docs/platform/work-state/contracts/cli-io-contract.md#8-multi-value-flag-convention` | Duplicate of ws 704-711 (merge) |
| 147-161 | 4 | version-token | specification | contract (generator wrong) | `docs/platform/work-state/contracts/cli-io-contract.md#10-version-tokens` |  |
| 163-183 | 5 | ranh-giới-điều-gì-không-thuộc-hợp-đồng-này | specification | contract (generator wrong) | `docs/platform/work-state/contracts/cli-io-contract.md#11-scope-boundary` | Explicit non-scope with named owners (STR48, STR83, STR38); contract boundary obligation |
| 185-193 | 2 | tham-chiếu | specification | navigation (generator wrong) | `docs/platform/work-state/contracts/cli-io-contract.md#12-references` | Legacy paths; authoring rewrites them to canonical targets |

## 6. Duplicate Content, Merges And One Conflict

The two sources state the CLI surface twice. Each pair below targets the same heading, so the authoring step writes one text that is the union of both (nothing from either side is dropped), and both source rows keep their own ledger identity with disposition `merge` and one shared owner. Neither source was kept as a second owner.

| Target heading | work-state.md lines | io-contract.md lines | Relationship |
|---|---|---|---|
| Writer Identity | 154-167 | 22, 33-39 | same claims (writer.id, attribution not authentication); io adds D1/D9 never-block rationale |
| Writer Source Trust Levels | 169-174 | 24-31 | same four-value table; ws has the longer wording |
| Envelope Shape | 622-634 | 49-60 | same four-field envelope |
| Runner Stdout Envelope | 641-645 | 62-66 | same one-line-per-envelope rule |
| Manifest Shape | 647-663 | 119-122 | same manifest fields; ws adds the positional-parameter rule |
| Entry Fields And Effect Axes | 665-676 | 124-137 | same two axes; the lists of externalEffect verbs disagree (conflict below) |
| Cursor Pagination (H2 6) | 678-702 | 101-115 | ws is a superset: adds the permanent list --all --json shape and the side-log narrowing |
| Multi-Value Flag Convention (H2 8) | 704-711 | 139-145 | same csv / json-array rule |

Conflict to record before authoring (constitution section 5: record, relate, do not pick silently): work-state.md lines 670-672 say only `review` and `approve` carry `externalEffect: true` today; io-contract.md lines 128-133 say `review`, `approve`, `coordination`. No precedence rule applies (both are legacy-current), so the authoring step keeps both statements as `unknown-blocking` with review status `blocking` until the owner decides, or verifies against `fgos --help --json` (a source check would settle it mechanically). Likely the work-state text is stale.

A second, smaller overlap: work-state.md unit 156-163 contains an English sentence about the `gates[id]` projection carrying the `CTR004/v1` token. It duplicates the io-contract version table (rows 152-158). The unit stays with its row owner (Writer Identity); the authoring step may relocate the sentence under `10. Version Tokens` as the same single owner without changing any ledger owner, or leave it.

## 7. Claim Kind Findings

The generator infers `specification` for every row. Proposed kinds differ for 186 of 325 work-state rows and 41 of 41 io-contract rows:

| Proposed kind | work-state rows | io-contract rows | Where |
|---|---:|---:|---|
| specification | 139 | 0 | spec.md (all other sections of work-state.md) |
| decision | 154 | 0 | decisions/retired-decision-history.md: ADR 0002 to 0032 text. This is the main generator error: the 165-row retired decision history is decision, not specification |
| historical-context | 12 | 0 | work-state.md front matter, the relocation statement (lines 1332-1334), ADR 0032 journey, state at distill, post-distill recap |
| contract | 18 | 39 | contracts/cli-io-contract.md: writer identity, envelope, manifest, pagination, help, plus all of io-contract.md except its reference list |
| architecture | 2 | 0 | architecture/implementation-pointers.md: the Pointers section |
| navigation | 0 | 2 | io-contract.md reference list |

Rows whose generator kind `specification` is wrong, by cause:

- Of the 165 rows from line 1332 on, 154 are `decision` (ADR context, decision and consequences, plus 0013 addenda and the 0027 consumer audit evidence). The other 11 are `historical-context`: the relocation statement (2 rows) and the ADR 0032 journey, state at distill time and post-distill recap (9 rows).
- 18 work-state rows (lines 154-191 writer identity, 622-731 envelope, manifest, pagination, flag convention and per-verb help) are `contract`: they define the CLI interface, and the contract outranks specification wording of the same rule (constitution section 5 precedence 1).
- The Pointers row (1307-1330) is `architecture`; the front matter row (1-7) is `historical-context`.
- io-contract.md rows are `contract`, except its closing reference list (`navigation`). The scope-boundary rows (163-183) are a contract boundary obligation with named owners; they could be read as vision (explicit non-scope), see section 11 item 10.
- Business Rules (1160-1213) stay `specification`, not `normative-law`: the vocabulary reserves `normative-law` for the platform laws L1 to L8; the RUL rules are area rules.

## 8. Rows Not Carried, And Carry Notes

Rows proposed NOT to carry: none. The default (carry everything) holds for all 366 rows, so no dropped-claims register entry is proposed. Items considered and kept, so the reviewer can see they were weighed:

| Source | Candidate for dropping | Decision | Reason |
|---|---|---|---|
| work-state.md 1301-1303 | "Visuals: Not applicable" | carry | A non-scope statement; it costs one line in `14. Presentation Surface` and is a claim about the area. |
| work-state.md 1344 | second H1 `# 0002 ...` inside the ADR 0002 text | carry | The row is the heading unit of the ADR 0002 H2; authoring demotes or merges the duplicate title (heading only, no claim lost). |
| work-state.md 1372, 1399, 1430, 1502, 1556, 1633, 1846 | boilerplate line "change this decision by superseding with a new record" | carry | It is the supersession rule of each ADR; kept in that ADR consequences section. |
| work-state.md 1305-1330 | module pointers that are likely stale (file names, line behavior) | carry | Staleness is a review decision, not a migration decision; the owner can mark individual pointers obsolete during review with a recorded disposition. |
| io-contract.md 185-193 | reference list pointing at retired `docs/decisions/*` paths and legacy docs | carry as `navigation`, rewrite links | The list is carried as one row; authoring replaces each legacy path by the canonical target (decision records move into `decisions/retired-decision-history.md`), keeping the facts they point at. |
| both sources | duplicated claims (section 6) | carry once, merge | Not a drop: both rows point at the same owner heading. |

## 9. Coverage Table

### docs/specs/work-state.md

| Source H2 section | Section lines | Rows | Target document | Rows to target |
|---|---|---:|---|---:|
| Preamble (front matter, title, intro) | 1-12 | 3 | `docs/platform/work-state/spec.md` | 3 |
| Entry Points & Triggers | 13-39 | 2 | `docs/platform/work-state/spec.md` | 2 |
| Data Dictionary | 40-800 | 90 | `docs/platform/work-state/spec.md` | 72 |
|  |  |  | `docs/platform/work-state/contracts/cli-io-contract.md` | 18 |
| Behaviors & Operations | 801-1148 | 52 | `docs/platform/work-state/spec.md` | 52 |
| Actors & Access | 1149-1157 | 2 | `docs/platform/work-state/spec.md` | 2 |
| Business Rules | 1158-1214 | 2 | `docs/platform/work-state/spec.md` | 2 |
| Edge Cases Settled | 1215-1283 | 2 | `docs/platform/work-state/spec.md` | 2 |
| Open Gaps | 1284-1300 | 3 | `docs/platform/work-state/spec.md` | 3 |
| Visuals | 1301-1304 | 2 | `docs/platform/work-state/spec.md` | 2 |
| Pointers (implementation) | 1305-1331 | 2 | `docs/platform/work-state/architecture/implementation-pointers.md` | 2 |
| Lịch sử quyết định retired từ docs/decisions/ (tsk-1lv-4) | 1332-2321 | 165 | `docs/platform/work-state/decisions/retired-decision-history.md` | 156 |
|  |  |  | `docs/platform/work-state/history/multi-role-harness-distill-record.md` | 9 |
| **Total** | | **325** | | **325** |

### docs/io-contract.md

| Source H2 section | Section lines | Rows | Target document | Rows to target |
|---|---|---:|---|---:|
| Preamble (title, purpose, goal) | 1-16 | 3 | `docs/platform/work-state/contracts/cli-io-contract.md` | 3 |
| Chiều vào — verb + danh tính | 17-46 | 6 | `docs/platform/work-state/contracts/cli-io-contract.md` | 6 |
| Chiều ra — envelope thống nhất (incl. Mã thoát, Ngoại lệ có lý do, Phân trang) | 47-116 | 15 | `docs/platform/work-state/contracts/cli-io-contract.md` | 15 |
| Sổ verb máy-đọc — CLI tự mô tả (incl. Quy ước cờ nhiều-giá-trị) | 117-146 | 6 | `docs/platform/work-state/contracts/cli-io-contract.md` | 6 |
| Version token | 147-162 | 4 | `docs/platform/work-state/contracts/cli-io-contract.md` | 4 |
| Ranh giới — điều gì KHÔNG thuộc hợp đồng này | 163-184 | 5 | `docs/platform/work-state/contracts/cli-io-contract.md` | 5 |
| Tham chiếu | 185-193 | 2 | `docs/platform/work-state/contracts/cli-io-contract.md` | 2 |
| **Total** | | **41** | | **41** |

### Rows per target document

| Target document | From work-state.md | From io-contract.md | Total |
|---|---:|---:|---:|
| `docs/platform/work-state/README.md` | 0 | 0 | 0 |
| `docs/platform/work-state/spec.md` | 140 | 0 | 140 |
| `docs/platform/work-state/contracts/cli-io-contract.md` | 18 | 41 | 59 |
| `docs/platform/work-state/architecture/implementation-pointers.md` | 2 | 0 | 2 |
| `docs/platform/work-state/decisions/retired-decision-history.md` | 156 | 0 | 156 |
| `docs/platform/work-state/history/multi-role-harness-distill-record.md` | 9 | 0 | 9 |
| **Total** | **325** | **41** | **366** |

### Sum check (script output)

```txt
work-state.md : TSV rows 325 | sum of coverage rows 325 | sum of heading rows 325 | expected 325 -> OK
io-contract.md: TSV rows 41 | sum of coverage rows 41 | sum of heading rows 41 | expected 41 -> OK
combined      : 366 / 366; every unit matched exactly one rule; no rule matched zero units; every rule heading exists in the registry; anchors unique per document
```

Method: the rule list in `scratchpad/cook5/work-map/rules.mjs` assigns each unit (by start line) to one heading; `build.mjs` fails on any unit matching zero or two rules and on any sum other than 325 and 41. Re-run `node build.mjs && node gen.mjs` in that directory to reproduce this file.

## 10. Scaffolding-Only Sections (No Source Rows)

These carry structure only (header, purpose, navigation, related links). The authoring step must not put a claim in them.

- `docs/platform/work-state/README.md#1-purpose-and-audience` (1. Purpose And Audience)
- `docs/platform/work-state/README.md#2-read-first` (2. Read First)
- `docs/platform/work-state/README.md#3-document-map` (3. Document Map)
- `docs/platform/work-state/README.md#4-legacy-source-pointers` (4. Legacy Source Pointers)
- `docs/platform/work-state/README.md#5-related-files` (5. Related Files)
- `docs/platform/work-state/spec.md#4-capture-and-evidence-records` (4. Capture And Evidence Records)
- `docs/platform/work-state/spec.md#5-workflow-step-and-stage-model` (5. Workflow Step And Stage Model)
- `docs/platform/work-state/spec.md#8-tool-registry` (8. Tool Registry)
- `docs/platform/work-state/spec.md#16-related-files` (16. Related Files)
- `docs/platform/work-state/contracts/cli-io-contract.md#13-related-files` (13. Related Files)
- `docs/platform/work-state/architecture/implementation-pointers.md#1-purpose-and-scope` (1. Purpose And Scope)
- `docs/platform/work-state/architecture/implementation-pointers.md#3-related-files` (3. Related Files)
- `docs/platform/work-state/decisions/retired-decision-history.md#14-related-files` (14. Related Files)
- `docs/platform/work-state/history/multi-role-harness-distill-record.md#1-purpose-and-scope` (1. Purpose And Scope)
- `docs/platform/work-state/history/multi-role-harness-distill-record.md#5-related-files` (5. Related Files)

All other headings carry at least one source row and nothing else; the portal `README.md` is entirely scaffolding. `Related Files` sections hold relative markdown links for every path in the header `Related:` block (constitution section 3).

## 11. Judgment Calls And Open Questions For The Reviewer

1. **Decision history as one document, not twelve records.** The task allows decision records or a decision-history document; the document cap (3 to 6) rules out twelve files. One H2 per ADR with H3 Context / Decision / Consequences (prefixed with the ADR number so anchors stay unique, for example `0013-trust-boundary`). A later split into per-ADR files can reuse the ADR H2 as the new H1 without renaming anchors much.
2. **ADR 0032 divided between decision and history.** Parts I to VI are the decision (foundation, handoff, declarative structure, implementation sequence, comparison conclusion, deferred questions). The journey (Hành trình), VII state at distill time and VIII post-distill recap are dated narrative, so `historical-context` and a `history/` document. Alternative: keep all of 0032 in the decision document and accept nine rows of the wrong kind there. Chosen split follows vocabulary section 2 (historical-context is served by History).
3. **Open Gaps stays in spec.md.** Open Gaps are deferred items (intent-like) with status future. The intent ledger kind needs new structured entries (new claims), which this pilot must not invent. Alternative if the reviewer wants it: map the single row (1286-1297) plus 1299 to a new `intent-preservation-ledger.md`, which would make a seventh document and exceed the cap.
4. **Domain Model stays in spec.md.** It could be architecture (base-workflow plus domain-extension). The rows state observable behavior (an item without a `domain` reads as `coding`, four domains registered), so they are specification. Moving it would give `architecture/` more than one document, without changing ownership rules.
5. **Pointers as architecture.** The 24-bullet row names modules and their purity constraints. It is navigation to code rather than to documents, so `navigation` would be an alternative; `architecture` was chosen because the bullets state module responsibilities. The row will probably be partly stale; flagged in section 8 for review rather than dropped.
6. **Writer identity and envelope placed in the contract, not the spec.** Both sources already treat them as the I/O contract (io-contract.md claims them; work-state.md cross-refers to it). The spec keeps only behavior that uses them. The settlement record in spec.md cross-links to `Caller Role` in the contract.
7. **Per-verb help (713-731) as contract.** Written in the Runs-when / Blocked-when behavior format, but its claim (every verb has its own help entry, read-only, exit 0) is a CLI surface guarantee. If the reviewer prefers it under `9. Behaviors And Operations`, only the target changes.
8. **Front matter row as historical-context in spec.md.** Lines 1-7 list source slices, decision hashes and `coverage: partial`. They are provenance, not behavior, and a spec section `15. Source Provenance And Coverage` keeps them with the doc they describe. The task allows no new claims, so no text is added around them.
9. **Single-unit giants stay whole.** Business Rules (1160-1213, 54 lines of RUL1 to RULn) and Edge Cases Settled (1217-1282) are one conservation unit each. A finer split needs a change of the unit definition (generator), not of this map; the authoring step may reorder inside the section but not move text out.
10. **Scope Boundary kind (io-contract.md 163-183).** Contract (boundary obligation) was chosen; vision (explicit non-scope) is the reading to weigh. No vision document exists in this pilot, so contract keeps one owner and a clear place.
11. **Third source in the switchboard is out of scope.** The switchboard also lists `docs/work-item-lifecycle-vision.md` as retained direction for this area. This map covers only the two assigned sources; the portal README lists the third source as a pointer under `4. Legacy Source Pointers` so a reader is not misled, and its later placement (likely `vision.md`) is a separate decision.
12. **Order changes.** The target reorders the source: records first, stages, domain, pull door, tool registry, operations, rules, with the contract material pulled out. Heading units keep their own rows, so reordering loses no row. The numbering of H2 headings in spec.md follows the new order.
13. **Heading hygiene frozen now.** Titles avoid punctuation and non-ASCII characters so anchors are predictable. Verb headings end in `Verb` (or a descriptive name) to avoid clashing with H2 names such as `7. Pull Door Take And Return`.


## 12. Freeze Record (lead, 2026-10-07)

The map was reviewed against the constitution placement rules and frozen with the heading registry of section 3: after this point a target heading is not renamed (anchors are the contract). All thirteen judgment calls of section 11 are accepted as proposed. The coverage sums (325 + 41 = 366 rows) were recomputed from the unit TSVs by the lead before freezing.

Resolution of the one conflict (section 6, the `externalEffect` verb list). Evidence: `COMMAND_REGISTRY` in `src/cli/command-registry.mjs` marks 15 verbs `externalEffect: true` (cleanup, decision-index, context-render, dispatch, run, review, approve, sync-root, promote-to-component, docs-index, doc-registry, gateway, resync-worktree, main-checkout-reset, workflow). The statement of `work-state.md` lines 670-672 ("today only `review` and `approve`") is a dated claim that the code contradicts; `io-contract.md` lines 128-133 defers to `fgos --help --json` for the current list and names `coordination` as an example. Decision: the candidate carries the `io-contract.md` wording (the manifest is the source of the list); the `work-state.md` exclusive-list row gets disposition `supersede` with this evidence as its rationale, so no stale exclusive list is carried as authority. The `coordination` example is a separate stale example in `io-contract.md` and is carried as written, flagged in the ledger rationale.

## 13. Added-In-Candidate Headings (owner ruling 2026-10-07)

A candidate heading counts as traced when a source row lands in its section. A heading that the map added as a subdivision of a source section and that has no source heading row of its own carries an explicit added-in-candidate label. Eight H3 headings of `docs/platform/work-state/contracts/cli-io-contract.md` are such subdivisions: Single Write Door, Writer Source Trust Levels, Writer Resolution Rules, Caller Role, Error Path Is Not Enveloped, Runner Stdout Envelope, Recognizing A Real Envelope, Entry Fields And Effect Axes. The label is the `Added in candidate` field of the document header; the units under these headings are carried from the sources and are traced by their own decision rows. The other unreferenced headings are scaffold (section 10): the six document titles, the portal sections, and the Related Files and Purpose sections.

