# review-a38-step-02h-map-part-38

- Reviewer: reviewer:sonnet-session:a3eb64b43c5583184@2026-10-19
- Commits: reviewed tree `b3d2c2ebd4be66848520e3f3f797c6219a610dee` (accounting), author `6c415d7ce`; input source commit `f5033e20a`
- Part: 38 (writers-and-writer-triage), 60 entries; rules applied: A50, L12-7, L12-10, L12-19..L12-24
- Method: every entry resolved from `step-02h-census-maps-portals-prose.json` via the index's id list; source block read at the committed tree; target existence/anchors checked with `git ls-tree`/`git cat-file`.

| Entry | Source | Verdict | Rationale |
|---|---|---|---|
| maps-h-00027 | agent-coordination README L15 note citing decision 0062 in `docs/specs/runner.md` | ok | Patch to runner README follows the census-wide mapping; semantic target stays a Step 3 gate. |
| maps-h-00138 | run-handle L100 relative link | ok | Relative patch correct (`../../../platform/...`), anchor resolved. |
| maps-h-00166 | contracts/README L14 `../vision.md` | ok | Relative patch correct; exact file. |
| maps-h-00175 | assignment-run-runresult L138 | ok | Relative patch correct; exact file. |
| maps-h-00180 | coordination-session L33 `playbooks/mvp6-dogfood-handoff.md` | ok | Only a literal-carriage successor exists; parked for Step 3, no patch into carriage. Right. |
| maps-h-00182 | coordination-session L76 verification index | ok | Same-path evidence mirror exists; patch right. |
| maps-h-00325 | standardization plan L159 ADR-009 row | ok | Source column of a migration plan = provenance, preserved (L12-23). |
| maps-h-00326 | L160 ADR-010 row | ok | Same. |
| maps-h-00327 | L161 ADR-011 row | ok | Same. |
| maps-h-00392 | standardization plan L732 `Create:` list under "9.6 Phase 2 Files To Create" | rework | This is a design-doc migration to-do list, which L12-24 (settled: maps-g-03867/03868) classes as planning narrative, not a runtime writer. Target path is already `docs/platform/...`. Its carriage twin (maps-h-02402, same line) is a plain reader. Relabel as reader/preserve. |
| maps-h-00395 | standardization plan L825 `Create:` under "9.9 Phase 5 Files To Create Or Promote" | rework | Same defect as 00392. |
| maps-h-00454 | role-doctrine L1554 P00.1 link | ok | Mirror and relative depth correct. |
| maps-h-00457 | harness playbook L121 `Create:` trace layout | ok | Operative playbook layout block, real writer (L12-22). Step 5, destination and checks together. |
| maps-h-00459 | harness playbook L413 proof path convention | ok | Real writer. Right. |
| maps-h-00460 | harness playbook L465 `test -s .../team-dispatch-v1/index.md` | ok | Real check on the verification tree; moves with the destination in Step 5. |
| maps-h-00461 | L466 `test -s current-cell.md` | ok | Same. |
| maps-h-00462 | L467 `rg ... current-cell.md` | ok | Check command; same. |
| maps-h-00486 | advisory-coordinator prompt L776 `EVIDENCE_DIR:` example | ok | Prompt block that sets the evidence write directory; writer (L12-22). Right. |
| maps-h-00492 | master-coordinator L158 PERSISTENT STATE | ok | Real writer. Right. |
| maps-h-00545 | dispatch-control-plane-redesign L892 `docs/history/tsk-5x7-1/plan.md` | ok | docs/history retained; preserve right. |
| maps-h-00791 | documentation-system-design L657 `Promote ... into docs/doc-governance.md` | ok | Design to-do list is navigation per L12-24; patched like its carrier twin 03866. Right. |
| maps-h-00792 | L658 `docs/README.md` | ok | Same class; consistent with other docs/README.md rows. |
| maps-h-00793 | L658 `docs/reading-map.md` | ok | Retained root file; preserve. |
| maps-h-00800 | discussion L53 `docs/doc-registry.md` | ok | Retained; preserve. |
| maps-h-00801 | discussion L57 ui-spec generated glob | ok | Non-retiring; preserve. |
| maps-h-00806 | discussion L159 `docs/doc-registry.md` | ok | Retained; preserve. |
| maps-h-00807 | discussion L160 ui-spec generated glob | ok | Non-retiring; preserve. |
| maps-h-00879 | host-invocation standardization plan L88 source inventory | ok | `Source` table column; provenance preserved. |
| maps-h-00880 | L89 | ok | Same. |
| maps-h-00881 | L90 | ok | Same. |
| maps-h-00882 | L91 | ok | Same. |
| maps-h-00912 | host-invocation-provider-routing L111 `[Legacy CLI Transition](./legacy-cli-transition.md)` | rework | Patch points to the area README, but the exact successor exists: `docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md`. A one-to-one file is not a split document (L12-21 reserves README for plain navigation of split documents; L12-24 fix 6 spirit). Re-map to the exact file. Same stale owner appears on preserved row 00880 (owner field only). |
| maps-h-00953 | knowledge-registry-redesign L626 `docs/specs/enduser-docs-authoring.md` | ok | No platform successor exists for the end-user specs (switchboard row classes them non-authority); parked for Step 3, consistent with switchboard rows 04010/04011. |
| maps-h-00954 | L627 `docs/specs/enduser-docs-index.md` | ok | Same. |
| maps-h-00958 | packaging README L41 workspace-topology link | ok | Exact file exists, relative patch correct. |
| maps-h-00965 | distribution-baseline L56 `Source` column (D-ADR0009) | ok | Source/pinned-citation column; preserve right. |
| maps-h-00966 | L57 | ok | Same. |
| maps-h-00967 | L58 | ok | Same. |
| maps-h-00968 | L59 | ok | Same. |
| maps-h-00969 | L60 | ok | Same. |
| maps-h-00970 | L61 | ok | Same. |
| maps-h-00971 | L62 | ok | Same. |
| maps-h-00972 | L63 | ok | Same. |
| maps-h-00973 | L64 | ok | Same. |
| maps-h-00987 | packaging migration-map L100 evidence cell `docs/architect/packaging-distribution/runtime-identity-and-activation.md` | needs-Lead-judgment | See judgment A. Independently, the patch goes to the README although the exact file `docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md` exists (same defect as 00912) if Lead decides these stay patched. |
| maps-h-00988 | migration-map L104 evidence cell `docs/specs/distribution.md` | needs-Lead-judgment | See judgment A. |
| maps-h-00989 | migration-map L105 evidence cell | needs-Lead-judgment | See judgment A. |
| maps-h-00994 | migration-map L114 `Rewrite spec.md from docs/specs/distribution.md and README.md` | needs-Lead-judgment | See judgment A; patched text would read "from <README> and README.md", which is nonsensical for a source-of-rewrite statement. |
| maps-h-01021 | scope-map L44 `docs/architect/component-boundary/README.md` | ok | Target `docs/platform/component-boundary.md` exists; navigation cell. |
| maps-h-01023 | scope-map L53 | ok | Same. |
| maps-h-01051 | component-authority-boundary-map L192 relative link | ok | Relative patch correct, exact file. |
| maps-h-01053 | same file L497 anchor link `#9-hexagonal-architecture-view` | ok | Anchor exists in new component-boundary.md; patch correct. |
| maps-h-01054 | same file L497 dispatch control plane link | ok | Correct. |
| maps-h-01083 | coordination-envelope-progress L42 result report | ok | Evidence mirror; correct. |
| maps-h-01084 | same file L45 boundary sketch | ok | Exact file in docs/platform/proposals exists; correct. |
| maps-h-01184 | visibility proposal L113 `docs/specs/runner.md` RUL40 (D d3dbe7f5) in drift findings | needs-Lead-judgment | See judgment B. Preserved as a pinned citation. |
| maps-h-01186 | visibility proposal L493 permission-posture-findings link | ok | Mirror and depth correct. |
| maps-h-01187 | same file L500 brace list, first member | ok | Parked with exact targets present (checked); Step 3 whole-unit list rewrite is acceptable. Note: the same-path mirror would also allow a deterministic whole-unit patch. |
| maps-h-01188 | same file L500 brace list, second member | ok | Same. |
| maps-h-01189 | same file L516 `docs/specs/runner.md RUL40: da lam 2026-09-06 ... supersedes:d3dbe7f5` | needs-Lead-judgment | See judgment B. Patched to the runner README, while 01184 (same file, same dated-finding kind, same decision pin) is preserved. |

## Totals

- Entries 60: ok 51, rework 3, needs-Lead-judgment 6.
- Rework: maps-h-00392, maps-h-00395, maps-h-00912.
- Needs-Lead-judgment: maps-h-00987, maps-h-00988, maps-h-00989, maps-h-00994, maps-h-01184, maps-h-01189.

## Rework by defect class

1. Design-doc migration to-do lists labeled as writers (00392, 00395): L12-24 settled that "Create or update ..." / "Files To Create" lists are planning narrative. Sibling carriage row maps-h-02402 is a reader. Relabel; no path change needed.
2. Area README chosen although an exact one-to-one successor file exists (00912; also 00987 if it stays patched): re-map to `docs/platform/host-invocation-routing/architecture/legacy-cli-transition.md` and `docs/platform/packaging-distribution/architecture/runtime-identity-and-activation.md`. Suggest Lead has the generator check all README-owner mappings for an existing exact file (owner field on preserved rows 00879-00882 is also README).

## Needs-Lead-judgment

A. migration-map.md (00987, 00988, 00989, 00994). The file declares itself a "migration planning note" mapping current sources to targets. Its line 64 source row is preserved (00975) and its carriage copy preserves every equivalent row (maps-h-04438..04445), yet evidence/source citations at L100-114 are patched. L12-23 says any source column of a migration plan or ledger is provenance. Options: (1) preserve all as provenance (consistent with L12-23 and the carriage twin); (2) keep patching under L12-24 (design to-do lists are navigation), but then re-map to exact files (spec.md, architecture/runtime-identity-and-activation.md) and rewrite the L114 sentence by hand. Recommendation: option 1.

B. Same dated drift finding in one proposal (01184 preserved, 01189 patched; carriage twins 04688 preserved, 04693 patched). Both cite `docs/specs/runner.md` RUL40 with the same decision pin d3dbe7f5. Needs one rule: either both are pinned point-in-time citations (preserve) or both are live references (patch). Recommendation: preserve both.
