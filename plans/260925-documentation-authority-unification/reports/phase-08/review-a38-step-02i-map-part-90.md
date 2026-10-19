# Review a38 step-02i map part 90

Reviewer: reviewer:sonnet-session:a17c07519effcf8f1@2026-10-19  
Commits: author 904d0fb5c, accounting 74e3ecf1e (worktree detached at 74e3ecf1e, verified)  
Part: 90 (seeded-semantic-edge-sample, sourceTable step-02i-census-maps-portals-prose.json, 60 entries)

Method: every row read in full (all fields), consumer passage read in committed context (5-line window plus wider reads where needed), targets checked in the worktree tree (README vs spec.md locator resolution, carriage typing, file existence).

| # | edgeId | consumer:line | role / action | verdict | defect class | note |
|--:|---|---|---|---|---|---|
| 1 | maps-i-01965 | fgos-gateway-api-ctr010.md:68 | reader / preserve | ok |  | docs/history is retained; reference preserved, correct. |
| 2 | maps-i-01969 | merge-loop-self-resolve-feature-summary.md:94 | reader / preserve | ok |  | docs/history is retained; reference preserved, correct. |
| 3 | maps-i-01995 | why-plugin-only-installs-could-not-reach-fgoss-coding-domain-dev-skills.md:80 | reader / cutover-patch-only | rework | C | Live sentence "docs/distribution-vision.md ... now state[s] the posture". Patch target docs/platform/packaging-distribution/history/distribution-vision.md is a History-typed carriage file ("Preserve the mapped source as candidate material"). Patches never point into carriage; docs/distribution-vision.md still exists, so the edge needs park/Step 3 or a non-carriage target. |
| 4 | maps-i-01996 | why-plugin-only-installs-could-not-reach-fgoss-coding-domain-dev-skills.md:81 | reader / cutover-patch-only | needs-Lead-judgment | A? | Sentence claims docs/specs/distribution.md "now state[s] the posture explicitly". README mapping is a portal; spec.md (96.8K) is the content file. No locator, but the claim is about content. Lead to decide README vs spec.md. |
| 5 | maps-i-01997 | why-a-retired-stage-name-sometimes-keeps-a-drain-only-alias.md:170 | reader / preserve | ok |  | docs/history is retained; reference preserved, correct. |
| 6 | maps-i-02019 | why-bee-prefixed-identifiers-became-fgos-prefixed.md:72 | reader / cutover-patch-only | rework | B | Past-tense account of a finished item ("the two live specs ... that documented the same env-var priority in prose. It passed verify ..."). Completed-past-action recount on legacy files = historical preserve. |
| 7 | maps-i-02038 | why-decompose-checks-footprint-overlap-before-creating-children.md:128 | reader / cutover-patch-only | rework | B | Verbatim quotation of plan-tsk-1uw.md ("the footprint is a single file (docs/specs/work-state.md)"). Patching changes quoted historical text; preserve. |
| 8 | maps-i-02044 | why-the-enduser-docs-index-needed-a-doctor-check-not-just-a-regenerate-skill.md:93 | reader / preserve | ok |  | docs/history is retained; reference preserved, correct. |
| 9 | maps-i-02045 | why-the-enduser-docs-index-needed-a-doctor-check-not-just-a-regenerate-skill.md:96 | reader / preserve | ok |  | docs/history is retained; reference preserved, correct. |
| 10 | maps-i-02065 | why-fgos-added-sync-root-and-drift-detection.md:154 | reader / preserve | ok |  | docs/history is retained; reference preserved, correct. |
| 11 | maps-i-02078 | why-fgos-planning-moved-mode-gate-to-fgos-routing.md:213 | reader / preserve | ok |  | docs/history is retained; reference preserved, correct. |
| 12 | maps-i-02079 | why-fgos-planning-moved-mode-gate-to-fgos-routing.md:218 | reader / preserve | ok |  | docs/history is retained; reference preserved, correct. |
| 13 | maps-i-02086 | why-fgos-coding-planning-writes-docsref-when-it-self-creates-a-feature-dir.md:50 | reader / preserve | ok |  | docs/history is retained; reference preserved, correct. |
| 14 | maps-i-02087 | why-state-and-runner-import-edges-were-cut-and-cli-logic-moved-to-a-use-case-layer.md:13 | reader / preserve | ok |  | docs/history is retained; reference preserved, correct. |
| 15 | maps-i-02090 | discovery-decompose-reporoot-verify-overwrite.md:186 | reader / preserve | ok |  | docs/history is retained; reference preserved, correct. |
| 16 | maps-i-02096 | events-jsonl-lost-update-race-under-concurrent-session-writes.md:73 | reader / preserve | ok |  | docs/history is retained; reference preserved, correct. |
| 17 | maps-i-02101 | events-jsonl-lost-update-race-under-concurrent-session-writes.md:272 | reader / preserve | ok |  | docs/history is retained; reference preserved, correct. |
| 18 | maps-i-02111 | why-merge-next-auto-syncs-blockedonsync-roots.md:127 | reader / preserve | ok |  | docs/history is retained; reference preserved, correct. |
| 19 | maps-i-02114 | why-verify-moved-from-the-merge-lock-to-catchups-inbound-gate.md:15 | reader / preserve | ok |  | docs/history is retained; reference preserved, correct. |
| 20 | maps-i-02119 | fgos-retro-loop-and-the-restored-compound-verb.md:72 | reader / cutover-patch-only | rework | A | Cites `docs/specs/work-state.md` (RUL51-53). README has no RUL51; spec.md has 7. Sentence is also a past-tense rationale ("Keeping the same verb name mattered ... already documented"). Preserve, or retarget to spec.md. |
| 21 | maps-i-02131 | why-fgos-citations-carry-a-gloss-and-check-mechanically.md:53 | reader / preserve | ok |  | Retained file (docs/backlog.md / reading-map / doc-registry or in-place target); preserve correct. |
| 22 | maps-i-02140 | fgos-uninstall-feature-overview.md:26 | reader / preserve | ok |  | docs/history is retained; reference preserved, correct. |
| 23 | maps-i-02149 | why-herdr-cockpit-stacked-worker-launches-into-one-pane.md:73 | reader / preserve | ok |  | docs/history is retained; reference preserved, correct. |
| 24 | maps-i-02154 | hook-registration-guard.md:52 | reader / cutover-patch-only | ok |  | Same-path evidence mirror; target exists; link form and label kept; correct. |
| 25 | maps-i-02176 | why-mergetree-groups-by-parent-and-sorts-recursively-by-blocks.md:116 | reader / preserve | ok |  | docs/history is retained; reference preserved, correct. |
| 26 | maps-i-02193 | why-dispatch-mjs-was-redesigned-around-task-not-agent-capacity.md:16 | reader / cutover-patch-only | rework | A | "removed (decision 0062 in `docs/specs/runner.md`)". README line 58 mentions 0062 only as the R3 pending-callers gate, not the dispatch-door removal; locator does not resolve in README. Park or retarget. |
| 27 | maps-i-02203 | decision-record.md:235 | reader / preserve-pending-target | ok |  | Parked with no executable patch (carriage/moved target/line locator/glob/whole-tree); correct. |
| 28 | maps-i-02204 | decision-record.md:259 | reader / preserve | ok |  | Template placeholder; preserve correct. |
| 29 | maps-i-02210 | why-state-json-became-an-incrementally-read-snapshot.md:94 | reader / preserve | ok |  | docs/history is retained; reference preserved, correct. |
| 30 | maps-i-02219 | merge-auto-resolves-decision-id-collision.md:81 | reader / cutover-patch-only | rework | A | "(RUL34/RUL37, `docs/specs/runner.md` ...)". README has no RUL34/RUL37. Rule locators need the content file. |
| 31 | maps-i-02221 | why-the-fgos-interface-daemon-is-one-process-that-only-ever-shells-out-to-the-cli.md:16 | reader / preserve | ok |  | Retained file (docs/backlog.md / reading-map / doc-registry or in-place target); preserve correct. |
| 32 | maps-i-02223 | why-the-fgos-interface-daemon-is-one-process-that-only-ever-shells-out-to-the-cli.md:70 | reader / cutover-patch-only | rework | A | "`docs/specs/runner.md` RUL40 stays as-is". README has no RUL40. Rule locator needs the content file. |
| 33 | maps-i-02232 | why-the-herdr-web-dashboard-became-a-static-client-of-the-gateway-not-its-own-server.md:16 | reader / preserve | ok |  | docs/history is retained; reference preserved, correct. |
| 34 | maps-i-02247 | decision-record.md:26 | reader / preserve | ok |  | docs/history is retained; reference preserved, correct. |
| 35 | maps-i-02256 | why-the-pre-commit-hook-got-its-own-shorter-lock-ttl.md:99 | reader / preserve | ok |  | docs/history is retained; reference preserved, correct. |
| 36 | maps-i-02257 | why-the-stage-status-driving-split-decision-got-superseded.md:7 | reader / preserve | ok |  | docs/history is retained; reference preserved, correct. |
| 37 | maps-i-02258 | why-the-stage-status-driving-split-decision-got-superseded.md:95 | reader / preserve | ok |  | docs/history is retained; reference preserved, correct. |
| 38 | maps-i-02266 | wontfix-terminal-status-filter-consistency.md:19 | reader / preserve | ok |  | docs/history is retained; reference preserved, correct. |
| 39 | maps-i-02270 | impact-analysis-capability-gate-replaces-hardcoded-gitnexus.md:150 | reader / preserve | ok |  | docs/history is retained; reference preserved, correct. |
| 40 | maps-i-02272 | work-item-pipeline-stages-verbs-and-handoffs.md:123 | reader / cutover-patch-only | ok |  | Plain navigation to a split document; no section/rule locator in the sentence; README target exists; patch form kept; correct. |
| 41 | maps-i-02273 | work-item-pipeline-stages-verbs-and-handoffs.md:124 | reader / cutover-patch-only | ok |  | Plain navigation to a split document; no section/rule locator in the sentence; README target exists; patch form kept; correct. |
| 42 | maps-i-02294 | README.md:32 | reader / phase9-row-flip | ok |  | Migration-state cell in docs/platform/README.md; Phase 9 row flip, not substitution; correct. |
| 43 | maps-i-02300 | README.md:37 | reader / phase9-row-flip | ok |  | Migration-state cell in docs/platform/README.md; Phase 9 row flip, not substitution; correct. |
| 44 | maps-i-02303 | README.md:45 | reader / phase9-row-flip | ok |  | Migration-state cell in docs/platform/README.md; Phase 9 row flip, not substitution; correct. |
| 45 | maps-i-02306 | README.md:47 | reader / phase9-row-flip | ok |  | Migration-state cell in docs/platform/README.md; Phase 9 row flip, not substitution; correct. |
| 46 | maps-i-02307 | README.md:47 | reader / phase9-row-flip | ok |  | Migration-state cell in docs/platform/README.md; Phase 9 row flip, not substitution; correct. |
| 47 | maps-i-02308 | README.md:48 | reader / phase9-row-flip | ok |  | Migration-state cell in docs/platform/README.md; Phase 9 row flip, not substitution; correct. |
| 48 | maps-i-02309 | README.md:50 | reader / phase9-row-flip | ok |  | Migration-state cell in docs/platform/README.md; Phase 9 row flip, not substitution; correct. |
| 49 | maps-i-02313 | README.md:103 | reader / preserve | ok |  | Retained file (docs/backlog.md / reading-map / doc-registry or in-place target); preserve correct. |
| 50 | maps-i-02318 | confinement-authority-decisions.md:9 | reader / preserve | ok |  | Source-locator/provenance cell; preserve correct. |
| 51 | maps-i-02328 | README.md:16 | reader / cutover-patch-only | ok |  | Plain navigation to a split document; no section/rule locator in the sentence; README target exists; patch form kept; correct. |
| 52 | maps-i-02337 | dispatch-control-plane.md:105 | reader / preserve | ok |  | Retained file (docs/backlog.md / reading-map / doc-registry or in-place target); preserve correct. |
| 53 | maps-i-02353 | ADR-001-work-lifecycle-authority.md:17 | reader / cutover-patch-only | ok |  | Plain navigation to a split document; no section/rule locator in the sentence; README target exists; patch form kept; correct. |
| 54 | maps-i-02354 | ADR-002-stage-operation-compatibility.md:17 | reader / cutover-patch-only | ok |  | Plain navigation to a split document; no section/rule locator in the sentence; README target exists; patch form kept; correct. |
| 55 | maps-i-02359 | ADR-006-assignment-provenance-and-contract-snapshot.md:67 | reader / preserve-pending-target | ok |  | Parked with no executable patch (carriage/moved target/line locator/glob/whole-tree); correct. |
| 56 | maps-i-02389 | documentation-standardization-plan.md:625 | reader / preserve | ok |  | Source-locator/provenance cell; preserve correct. |
| 57 | maps-i-02392 | documentation-standardization-plan.md:628 | reader / preserve | ok |  | Source-locator/provenance cell; preserve correct. |
| 58 | maps-i-02393 | documentation-standardization-plan.md:629 | reader / preserve | ok |  | Source-locator/provenance cell; preserve correct. |
| 59 | maps-i-02396 | documentation-standardization-plan.md:637 | reader / preserve | ok |  | Source-locator/provenance cell; preserve correct. |
| 60 | maps-i-02406 | documentation-standardization-plan.md:890 | reader / preserve-pending-target | ok |  | Parked with no executable patch (carriage/moved target/line locator/glob/whole-tree); correct. |

## Totals

ok 52, rework 7, needs-Lead-judgment 1 of 60.  
Rework (7/60 = 11.7%, above the 3% threshold): maps-i-01995, maps-i-02019, maps-i-02038, maps-i-02119, maps-i-02193, maps-i-02219, maps-i-02223.  
Needs-Lead-judgment: maps-i-01996.

## Rework by defect class

- A. Section, rule or decision locator (RULnn, decision N, Data Dictionary row, section title) kept after the path while the patch target is a README portal that does not hold it. Fix: retarget to the content file (spec.md / architecture file) or park for Step 3.
- B. Past-tense or verbatim historical narrative (completed action on a legacy file, quoted plan text) patched instead of preserved.
- C. Patch points into a History-typed carriage file (docs/platform/packaging-distribution/history/distribution-vision.md).
