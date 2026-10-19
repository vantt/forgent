# Review A38 step-02i mapping, part 121

- Reviewer: reviewer:sonnet-session:a147bc07079968d24@2026-10-19
- Commits: author 904d0fb5c, accounting 74e3ecf1e (worktree detached at 74e3ecf1e, verified)
- Part: 121 (mandatory-rereview-action-changed-from-02h, 31 entries, sourceTable step-02i-census-maps-portals-prose.json)
- Method: every row read in full against its 02h row (joined by source path, line and expression), actual consumer passage and target read in context; mechanical check of patch old==expression, target existence and anchors at HEAD.

## Totals

ok 21 / rework 7 / needs-Lead-judgment 3 of 31

- rework ids: maps-i-05042 maps-i-05059 maps-i-05060 maps-i-05101 maps-i-05174 maps-i-05191 maps-i-05192
- needs-Lead-judgment ids: maps-i-04989 maps-i-05233 maps-i-05315

## Defect class notes

- Class E: path:line-range citation inside a past-tense evidence or retired-decision record ('Truth correction ... evidence:', 'Corrections in this candidate: A41 F4 ...', 'Candidate design evidence cited by ...', retired RUL11 decision text with a stale line number). New action is park (no anchor for the line range), 02h was preserve/patch-to-fake-anchor. Park never patches and is defensible under the line-locator rule, but these are historical audit/decision-record citations, so preserve (no Step 3 work) is arguably the better class. Lead to choose park vs preserve once for the class; no patch text is at stake.
  - ids: maps-i-04989 maps-i-05315
- Class G: specific-content citation ('docs/specs/confinement-authority.md already said a direct executor call must carry a capability anchor and never infer the minimum from executor.for') mapped to the area README, which has no such content; the statement sits at docs/platform/agent-confinement/contracts/confinement-authority-v1.md l.148. No explicit locator, so the README default also applies. Lead to choose README default vs exact content file.
  - ids: maps-i-05233
- Class K: the sentence documents the citation-drift checker scan scope ('quet docs/backlog.md + docs/specs/*.md'). Checker-scope statements are behavioral rows (settled; same unit as maps-i-05109/05111 in decision-citation-drift.md) so the script default and its documentation change together. Classified navigation/pending-target instead of preserve-pending-behavioral-proof/checker-scope.
  - ids: maps-i-05042 maps-i-05174
- Class L: citation carries an explicit rule locator (RUL40/RUL53/RUL93/RUL65b) but the patch targets the runner or area README, which contains none of those rules; the rules live in docs/platform/runner/subcomponents/h-6979005beaf7/spec.md (RUL40 l.72, RUL53 l.90, RUL93 l.187; RUL65b also there). Locator-bearing citations must map to the exact file holding the content (Lead ruling), so the locator does not resolve after the patch.
  - ids: maps-i-05059 maps-i-05060 maps-i-05101 maps-i-05191 maps-i-05192

## Rows

| # | edge | location | expression | action/rule (02i) | verdict | rationale |
|---|---|---|---|---|---|---|
| 1 | maps-i-04963 | docs/platform/work-state/README.md:62 | `[docs/work-item-lifecycle-vision.md](../../work-item-lifecycle-vision.` | phase9-row-flip/migration-state | ok | Migration-state cell/sentence (switchboard route/status row, legacy-owner or canonical-until-cutover cell/sentence): Phase 9 row flip, no patch text; matches settled rule. |
| 2 | maps-i-04965 | docs/platform/work-state/README.md:74 | `[../../io-contract.md](../../io-contract.md)` | phase9-row-flip/migration-state | ok | Migration-state cell/sentence (switchboard route/status row, legacy-owner or canonical-until-cutover cell/sentence): Phase 9 row flip, no patch text; matches settled rule. |
| 3 | maps-i-04966 | docs/platform/work-state/README.md:75 | `[../../work-item-lifecycle-vision.md](../../work-item-lifecycle-vision` | phase9-row-flip/migration-state | ok | Migration-state cell/sentence (switchboard route/status row, legacy-owner or canonical-until-cutover cell/sentence): Phase 9 row flip, no patch text; matches settled rule. |
| 4 | maps-i-04989 | docs/platform/work-state/decisions/retired-decision-history.md:420 | `docs/specs/work-state.md:886` | preserve-pending-target/line-locator-unresolved | needs-Lead-judgment | Class E: see class notes |
| 5 | maps-i-04998 | docs/platform/work-state/history/multi-role-harness-distill-record.md:12 | `docs/specs/work-state.md` | preserve/provenance | ok | Provenance/source-locator context (Related list duplicate of Source type line, Old-source/Original-source column, merge-conflict file list, git log proof command): preserve. |
| 6 | maps-i-05009 | docs/platform/work-state/spec.md:1071 | `docs/coexistence.md` | cutover-patch-only/navigation | ok | Live navigation pointer to a moved file, patch replaces complete reference unit, target exists, anchor/locators resolve, label/form kept. |
| 7 | maps-i-05011 | docs/platform/work-state/spec.md:1173 | `docs/coexistence.md` | cutover-patch-only/navigation | ok | Live navigation pointer to a moved file, patch replaces complete reference unit, target exists, anchor/locators resolve, label/form kept. |
| 8 | maps-i-05042 | docs/reading-map.md:145 | `docs/specs/*.md` | preserve-pending-target/navigation | rework | Class K: see class notes |
| 9 | maps-i-05043 | docs/reading-map.md:145 | `docs/specs/decision-citation-drift.md` | cutover-patch-only/navigation | ok | Live navigation pointer to a moved file, patch replaces complete reference unit, target exists, anchor/locators resolve, label/form kept. |
| 10 | maps-i-05059 | docs/reading-map.md:158 | `docs/specs/runner.md` | cutover-patch-only/navigation | rework | Class L: see class notes |
| 11 | maps-i-05060 | docs/reading-map.md:158 | `docs/specs/runner.md` | cutover-patch-only/navigation | rework | Class L: see class notes |
| 12 | maps-i-05061 | docs/reading-map.md:158 | `docs/specs/runner.md` | cutover-patch-only/navigation | ok | Live navigation pointer to a moved file, patch replaces complete reference unit, target exists, anchor/locators resolve, label/form kept. |
| 13 | maps-i-05098 | docs/routing-handoff-contract.md:93 | `docs/platform-foundations.md` | cutover-patch-only/navigation | ok | Live navigation pointer to a moved file, patch replaces complete reference unit, target exists, anchor/locators resolve, label/form kept. |
| 14 | maps-i-05101 | docs/specs/confinement-authority.md:1360 | `docs/specs/runner.md` | cutover-patch-only/navigation | rework | Class L: see class notes |
| 15 | maps-i-05106 | docs/specs/decision-citation-drift.md:26 | `docs/backlog.md` | preserve-pending-behavioral-proof/checker-scope | ok | Checker-scope statement: behavioral Step 5. |
| 16 | maps-i-05108 | docs/specs/decision-citation-drift.md:37 | `docs/backlog.md` | preserve-pending-behavioral-proof/checker-scope | ok | Checker-scope statement: behavioral Step 5. |
| 17 | maps-i-05110 | docs/specs/decision-citation-drift.md:63 | `docs/backlog.md` | preserve-pending-behavioral-proof/checker-scope | ok | Checker-scope statement: behavioral Step 5. |
| 18 | maps-i-05111 | docs/specs/decision-citation-drift.md:63 | `docs/specs/*.md` | preserve-pending-behavioral-proof/checker-scope | ok | Checker-scope statement: behavioral Step 5. |
| 19 | maps-i-05112 | docs/specs/decision-citation-drift.md:70 | `docs/backlog.md` | preserve-pending-behavioral-proof/checker-scope | ok | Checker-scope statement: behavioral Step 5. |
| 20 | maps-i-05174 | docs/specs/reading-map.md:25 | `docs/specs/*.md` | preserve-pending-target/navigation | rework | Class K: see class notes |
| 21 | maps-i-05175 | docs/specs/reading-map.md:25 | `docs/specs/decision-citation-drift.md` | cutover-patch-only/navigation | ok | Live navigation pointer to a moved file, patch replaces complete reference unit, target exists, anchor/locators resolve, label/form kept. |
| 22 | maps-i-05191 | docs/specs/reading-map.md:38 | `docs/specs/runner.md` | cutover-patch-only/navigation | rework | Class L: see class notes |
| 23 | maps-i-05192 | docs/specs/reading-map.md:38 | `docs/specs/runner.md` | cutover-patch-only/navigation | rework | Class L: see class notes |
| 24 | maps-i-05193 | docs/specs/reading-map.md:38 | `docs/specs/runner.md` | cutover-patch-only/navigation | ok | Live navigation pointer to a moved file, patch replaces complete reference unit, target exists, anchor/locators resolve, label/form kept. |
| 25 | maps-i-05228 | docs/specs/runner.md:1006 | `docs/operator-runbook-herdr-cockpit.md` | cutover-patch-only/navigation | ok | Live navigation pointer to a moved file, patch replaces complete reference unit, target exists, anchor/locators resolve, label/form kept. |
| 26 | maps-i-05229 | docs/specs/runner.md:1006 | `docs/architect/agent-coordination/decisions/ADR-011-dispatch-owns-life` | cutover-patch-only/navigation | ok | Live navigation pointer to a moved file, patch replaces complete reference unit, target exists, anchor/locators resolve, label/form kept. |
| 27 | maps-i-05230 | docs/specs/runner.md:1006 | `docs/architect/proposals/visibility-and-interactive-contact-herdr-spaw` | cutover-patch-only/navigation | ok | Live navigation pointer to a moved file, patch replaces complete reference unit, target exists, anchor/locators resolve, label/form kept. |
| 28 | maps-i-05233 | docs/specs/runner.md:1100 | `docs/specs/confinement-authority.md` | cutover-patch-only/navigation | needs-Lead-judgment | Class G: see class notes |
| 29 | maps-i-05304 | docs/specs/work-state.md:1222 | `docs/coexistence.md` | cutover-patch-only/navigation | ok | Live navigation pointer to a moved file, patch replaces complete reference unit, target exists, anchor/locators resolve, label/form kept. |
| 30 | maps-i-05306 | docs/specs/work-state.md:1324 | `docs/coexistence.md` | cutover-patch-only/navigation | ok | Live navigation pointer to a moved file, patch replaces complete reference unit, target exists, anchor/locators resolve, label/form kept. |
| 31 | maps-i-05315 | docs/specs/work-state.md:1764 | `docs/specs/work-state.md:886` | preserve-pending-target/line-locator-unresolved | needs-Lead-judgment | Class E: see class notes |
