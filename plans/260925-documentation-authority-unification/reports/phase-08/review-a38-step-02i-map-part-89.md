# Review a38 step-02i map part 89

Reviewer: reviewer:sonnet-session:a17c07519effcf8f1@2026-10-19  
Commits: author 904d0fb5c, accounting 74e3ecf1e (worktree detached at 74e3ecf1e, verified)  
Part: 89 (seeded-semantic-edge-sample, sourceTable step-02i-census-maps-portals-prose.json, 60 entries)

Method: every row read in full (all fields), consumer passage read in committed context (5-line window plus wider reads where needed), targets checked in the worktree tree (README vs spec.md locator resolution, carriage typing, file existence).

| # | edgeId | consumer:line | role / action | verdict | defect class | note |
|--:|---|---|---|---|---|---|
| 1 | maps-i-01655 | architecture-advisory-panel-v1-clarification-and-challenge.md:73 | reader / cutover-patch-only | ok |  | Same-path evidence mirror; target exists; link form and label kept; correct. |
| 2 | maps-i-01666 | architecture-advisory-panel-v1-material-context-reopen.md:37 | reader / cutover-patch-only | ok |  | Same-path evidence mirror; target exists; link form and label kept; correct. |
| 3 | maps-i-01669 | fix-bare-citation-findings.md:37 | behavioral / preserve-pending-behavioral-proof | ok |  | Checker-scope or generated-row reference; parked to Step 5 with no patch; correct. |
| 4 | maps-i-01671 | fix-bare-citation-findings.md:54 | behavioral / preserve-pending-behavioral-proof | ok |  | Checker-scope or generated-row reference; parked to Step 5 with no patch; correct. |
| 5 | maps-i-01676 | install-fgos-in-a-project-and-use-doctor.md:345 | reader / preserve | ok |  | Retained file (docs/backlog.md / reading-map / doc-registry or in-place target); preserve correct. |
| 6 | maps-i-01677 | run-a-coordination-session.md:252 | reader / preserve-pending-target | ok |  | Parked with no executable patch (carriage/moved target/line locator/glob/whole-tree); correct. |
| 7 | maps-i-01679 | run-a-coordination-session.md:272 | reader / cutover-patch-only | rework | A | Patch swaps `docs/specs/runner.md` for the runner README but leaves the locator §"CoordinationSession - dieu phoi agent Work-doc-lap" after it. The README (5.9K) has no such section; it lives in the runner architecture file (h-69197b459754.md) / spec.md. Park for Step 3 or retarget to the exact file. |
| 8 | maps-i-01680 | use-fgos-architecture-panel.md:28 | reader / cutover-patch-only | ok |  | Same-path evidence mirror; target exists; link form and label kept; correct. |
| 9 | maps-i-01681 | use-fgos-architecture-panel.md:34 | reader / cutover-patch-only | ok |  | Same-path evidence mirror; target exists; link form and label kept; correct. |
| 10 | maps-i-01683 | use-fgos-architecture-panel.md:130 | reader / cutover-patch-only | ok |  | Same-path evidence mirror; target exists; link form and label kept; correct. |
| 11 | maps-i-01687 | use-fgos-group-thinking.md:42 | reader / preserve-pending-target | ok |  | Parked with no executable patch (carriage/moved target/line locator/glob/whole-tree); correct. |
| 12 | maps-i-01691 | id-systems-audit.md:11 | reader / preserve | ok |  | Retained file (docs/backlog.md / reading-map / doc-registry or in-place target); preserve correct. |
| 13 | maps-i-01699 | id-systems-audit.md:170 | reader / preserve | ok |  | Retained file (docs/backlog.md / reading-map / doc-registry or in-place target); preserve correct. |
| 14 | maps-i-01711 | a-decision-doc-can-be-superseded-twice-superseded-by-becomes-a-list.md:109 | reader / preserve | ok |  | docs/history is retained; reference preserved, correct. |
| 15 | maps-i-01714 | add-a-read-only-fgos-verb-and-plugin-skill.md:59 | reader / preserve | ok |  | docs/history is retained; reference preserved, correct. |
| 16 | maps-i-01716 | add-a-stateful-fgos-verb-group-with-a-local-status-overlay.md:19 | reader / preserve-pending-target | ok |  | Wrapped ref to docs/reference/forgentx-tool-registry-configuration.md, which no longer exists (moved to docs/knowledge/forgentx-repo-s-tool-registry-configuration/ by 83c92b908). Park is correct; observation only: a moved-target successor note (L12-23) is missing. |
| 17 | maps-i-01720 | add-a-stateful-fgos-verb-group-with-a-local-status-overlay.md:145 | reader / preserve | ok |  | docs/history is retained; reference preserved, correct. |
| 18 | maps-i-01737 | decision-record.md:19 | generator / preserve-pending-behavioral-proof | ok |  | Checker-scope or generated-row reference; parked to Step 5 with no patch; correct. |
| 19 | maps-i-01738 | decision-record.md:20 | generator / preserve-pending-behavioral-proof | ok |  | Checker-scope or generated-row reference; parked to Step 5 with no patch; correct. |
| 20 | maps-i-01746 | decision-record.md:28 | generator / preserve-pending-behavioral-proof | ok |  | Checker-scope or generated-row reference; parked to Step 5 with no patch; correct. |
| 21 | maps-i-01749 | decision-record.md:31 | generator / preserve-pending-behavioral-proof | ok |  | Checker-scope or generated-row reference; parked to Step 5 with no patch; correct. |
| 22 | maps-i-01753 | decision-record.md:35 | generator / preserve-pending-behavioral-proof | ok |  | Checker-scope or generated-row reference; parked to Step 5 with no patch; correct. |
| 23 | maps-i-01775 | fgos-cook-worktree-claim-before-drive.md:96 | reader / preserve | ok |  | docs/history is retained; reference preserved, correct. |
| 24 | maps-i-01778 | fgos-participant-contract.md:30 | reader / cutover-patch-only | rework | A | Table cell cites `docs/specs/work-state.md` RUL10. work-state README has 0 RUL10; docs/platform/work-state/spec.md carries it (line 1050). Patch target must be spec.md (the sibling line-1045 edge 01787 is correctly parked). |
| 25 | maps-i-01780 | fgos-participant-contract.md:77 | reader / cutover-patch-only | ok |  | Plain navigation to a split document; no section/rule locator in the sentence; README target exists; patch form kept; correct. |
| 26 | maps-i-01787 | fgos-participant-contract.md:248 | reader / preserve-pending-target | ok |  | Parked with no executable patch (carriage/moved target/line locator/glob/whole-tree); correct. |
| 27 | maps-i-01789 | fgos-researching-d2-fanout-verified-live.md:78 | reader / preserve | ok |  | docs/history is retained; reference preserved, correct. |
| 28 | maps-i-01803 | fsm-refusal-messages-name-a-remedy-and-wontfix-gains-an-awaiting-human-door.md:33 | reader / preserve | ok |  | docs/history is retained; reference preserved, correct. |
| 29 | maps-i-01809 | gate-bypass-config.md:125 | reader / preserve | ok |  | docs/history is retained; reference preserved, correct. |
| 30 | maps-i-01816 | herdr-web-dashboard-layout.md:39 | reader / preserve | ok |  | docs/ui-spec is not retiring; preserve correct. |
| 31 | maps-i-01819 | session-isolation-and-concurrency.md:247 | reader / preserve | ok |  | docs/history is retained; reference preserved, correct. |
| 32 | maps-i-01821 | session-isolation-and-concurrency.md:399 | reader / preserve | ok |  | docs/history is retained; reference preserved, correct. |
| 33 | maps-i-01829 | check-whether-a-suspected-mechanism-ever-fired-before-fixing-it.md:61 | reader / preserve | ok |  | docs/history is retained; reference preserved, correct. |
| 34 | maps-i-01835 | handle-a-duplicate-work-item.md:116 | reader / cutover-patch-only | rework | A | Cites `docs/specs/work-state.md` "Data Dictionary row #4". README has no Data Dictionary (spec.md has 27 mentions). Locator does not resolve in README; target spec.md or park. |
| 35 | maps-i-01841 | close-out-a-work-item-already-done-before-claim.md:80 | reader / preserve | ok |  | docs/history is retained; reference preserved, correct. |
| 36 | maps-i-01842 | compute-a-parallel-dispatch-wave-schedule.md:110 | reader / preserve | ok |  | docs/history is retained; reference preserved, correct. |
| 37 | maps-i-01843 | configure-an-executor-to-dispatch-via-a-named-agent.md:119 | reader / preserve | ok |  | docs/history is retained; reference preserved, correct. |
| 38 | maps-i-01848 | find-every-caller-before-requiring-a-cli-flag.md:79 | reader / cutover-patch-only | needs-Lead-judgment | B? | Past-tense recount of an earlier caller search ("two prose-doc mentions ... that were non-executable and safe to leave alone"). Reads as a historical enumeration, but no locator and still a plain file mention. Preserve vs README patch is a Lead call. |
| 39 | maps-i-01854 | add-a-scoped-allowedtools-override-for-a-nested-executor-call.md:22 | reader / preserve-pending-target | ok |  | Parked with no executable patch (carriage/moved target/line locator/glob/whole-tree); correct. |
| 40 | maps-i-01855 | add-a-scoped-allowedtools-override-for-a-nested-executor-call.md:87 | reader / cutover-patch-only | rework | A | Cites "RUL6, `docs/specs/runner.md`". runner README has no RUL6 (spec.md does, 4 hits). Patch target must hold the rule. |
| 41 | maps-i-01856 | add-a-scoped-allowedtools-override-for-a-nested-executor-call.md:127 | reader / preserve | ok |  | docs/history is retained; reference preserved, correct. |
| 42 | maps-i-01863 | hold-an-open-ended-design-brainstorm-with-fgos-coding-shaping.md:131 | reader / preserve | ok |  | docs/history is retained; reference preserved, correct. |
| 43 | maps-i-01864 | fgos-terminal-pane-rename.md:11 | reader / preserve | ok |  | docs/history is retained; reference preserved, correct. |
| 44 | maps-i-01867 | land-a-delivered-item-whose-branch-was-never-actually-merged.md:61 | reader / cutover-patch-only | rework | B | Past-tense incident narrative ("in this real case, docs/specs/runner.md still described a 22-status lifecycle ..."). Describes the file as it was; lead ruling is historical preserve, not a navigation patch. |
| 45 | maps-i-01873 | read-a-critical-impact-analysis-result-before-treating-it-as-a-blocker.md:125 | reader / preserve | ok |  | docs/history is retained; reference preserved, correct. |
| 46 | maps-i-01879 | recover-a-blocked-item-with-fgos-catchup-from-inside-its-own-worktree.md:74 | reader / preserve-pending-target | ok |  | Parked with no executable patch (carriage/moved target/line locator/glob/whole-tree); correct. |
| 47 | maps-i-01880 | recover-a-blocked-item-with-fgos-catchup-from-inside-its-own-worktree.md:84 | reader / preserve-pending-target | ok |  | Parked with no executable patch (carriage/moved target/line locator/glob/whole-tree); correct. |
| 48 | maps-i-01886 | register-a-fixable-doctor-check-in-fgos.md:9 | reader / preserve | ok |  | docs/history is retained; reference preserved, correct. |
| 49 | maps-i-01900 | resolve-an-events-jsonl-truncation.md:62 | reader / preserve-pending-target | ok |  | Parked with no executable patch (carriage/moved target/line locator/glob/whole-tree); correct. |
| 50 | maps-i-01902 | resolve-an-events-jsonl-truncation.md:92 | reader / preserve | ok |  | docs/history is retained; reference preserved, correct. |
| 51 | maps-i-01911 | see-done-items-in-list-and-triage.md:123 | reader / preserve | ok |  | docs/history is retained; reference preserved, correct. |
| 52 | maps-i-01921 | wait-out-an-active-main-checkout-lock-holder.md:156 | reader / preserve | ok |  | docs/history is retained; reference preserved, correct. |
| 53 | maps-i-01929 | write-a-doctor-check-that-detects-real-shell-function-breakage.md:82 | reader / preserve | ok |  | docs/history is retained; reference preserved, correct. |
| 54 | maps-i-01931 | write-a-task-spec.md:70 | reader / preserve | ok |  | docs/history is retained; reference preserved, correct. |
| 55 | maps-i-01932 | judge-fail-safe-debug-log-fields.md:23 | reader / preserve | ok |  | docs/history is retained; reference preserved, correct. |
| 56 | maps-i-01936 | tiny-multi-file-edits-stay-one-item-when-split-overhead-exceeds-the-work.md:75 | reader / preserve | ok |  | docs/history is retained; reference preserved, correct. |
| 57 | maps-i-01949 | scaffold-and-link-a-herdr-plugin.md:35 | reader / preserve | ok |  | docs/history is retained; reference preserved, correct. |
| 58 | maps-i-01953 | spec-docs-drift-silently-when-only-code-has-an-exact-match-test.md:122 | reader / preserve | ok |  | docs/history is retained; reference preserved, correct. |
| 59 | maps-i-01958 | test-suite-legibility-cleanup-numbers.md:58 | reader / preserve | ok |  | docs/history is retained; reference preserved, correct. |
| 60 | maps-i-01959 | gateway-subsystem-audit-260814-findings.md:14 | reader / cutover-patch-only | needs-Lead-judgment | B? | "Scope:" line of a dated audit-findings doc (2026-08-14) listing what was audited. Reads as provenance of the audit scope; patch target exists (herdr-web-dashboard contract). Lead to decide provenance-preserve vs navigation patch. |

## Totals

ok 53, rework 5, needs-Lead-judgment 2 of 60.  
Rework (5/60 = 8.3%, above the 3% threshold): maps-i-01679, maps-i-01778, maps-i-01835, maps-i-01855, maps-i-01867.  
Needs-Lead-judgment: maps-i-01848, maps-i-01959.

## Rework by defect class

- A. Section, rule or decision locator (RULnn, decision N, Data Dictionary row, section title) kept after the path while the patch target is a README portal that does not hold it. Fix: retarget to the content file (spec.md / architecture file) or park for Step 3.
- B. Past-tense or verbatim historical narrative (completed action on a legacy file, quoted plan text) patched instead of preserved.
- C. Patch points into a History-typed carriage file (docs/platform/packaging-distribution/history/distribution-vision.md).
