# Review a38 step-02i mapping part 66

- Reviewer: reviewer:sonnet-session:a4c948669250c2c37@2026-10-19
- Commits: author 904d0fb5c, accounting 74e3ecf1e (worktree HEAD verified 74e3ecf1eb9a2bc1429f50a25bb7017e240ef798, read-only)
- Part: 66 (population behavioral-runtime-and-contract-triage, 60 entries, sourceTable step-02i-census-maps-portals-prose.json)
- Method: every row's full fields and source passage read; targets/anchors/headings/carriage regions checked in the committed tree; rule locators checked against destination files.

## Totals

ok 51 / rework 9 / needs-Lead-judgment 0 (of 60; rework 15.0%)

rework ids: maps-i-04695, maps-i-04707, maps-i-04723, maps-i-04761, maps-i-04810, maps-i-04831, maps-i-04844, maps-i-04852, maps-i-04855

needs-Lead-judgment ids: none

## Rework by defect class

- Class A: Rule/section/decision locator dropped when patched to an area README (target holds no such locator; exact file exists): maps-i-04695, maps-i-04707, maps-i-04723, maps-i-04761, maps-i-04810
- Class C: Migration-state sentence/cell/header self-ref-preserved or path-substituted instead of Phase 9 row flip/Step 3 rewrite: maps-i-04831, maps-i-04844, maps-i-04852, maps-i-04855

## Entries

| Entry | Consumer:line | Expression | Rule / action | Verdict | Class | Rationale |
|---|---|---|---|---|---|---|
| maps-i-04694 | docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md:524 | `../agent-coordination/verification/visibility-herdr/proofs/2026-09-06-` | retained-reference / preserve | ok | - | Target exists at the input commit and is retained in place; preserved, correct. |
| maps-i-04695 | docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md:540 | `docs/specs/runner.md` | navigation / cutover-patch-only | rework | A | "docs/specs/runner.md RUL40: da lam 2026-09-06" is a dated status narrative plus a rule locator; README patch drops RUL40 (not in README). Locator-bearing text should map to the exact file/anchor or park. |
| maps-i-04696 | docs/platform/proposals/visibility-and-interactive-contact-herdr-spawn.md:540 | `docs/backlog.md:84` | retained-reference / preserve | ok | - | Target exists at the input commit and is retained in place; preserved, correct. |
| maps-i-04700 | docs/platform/run-supervisor/spec.md:340 | `[runner.md](../../specs/runner.md)` | navigation / cutover-patch-only | ok | - | Decision-history bullet links runner.md for detail; no section/rule locator, README is the runner router; patch to ../runner/README.md valid. Note: names decision `detached-run-supervisor` (0043 in runner/decisions/h-36d872fbb0e5.md). |
| maps-i-04701 | docs/platform/run-supervisor/spec.md:349 | `[runner.md](../../specs/runner.md)` | navigation / cutover-patch-only | ok | - | Complete reference replaced by exact same-path/promoted target that exists at the input commit; no locator lost; correct. |
| maps-i-04703 | docs/platform/runner/README.md:10 | `docs/specs/runner.md` | self-reference-preserved / preserve | ok | - | Pinned sha/blob provenance (or original-source link) in candidate header; self-reference preserved, correct. |
| maps-i-04705 | docs/platform/runner/architecture/h-69197b459754.md:10 | `docs/specs/runner.md` | provenance / preserve | ok | - | Pinned provenance/source-locator column or header preserved; correct. |
| maps-i-04707 | docs/platform/runner/architecture/h-69197b459754.md:107 | `docs/specs/confinement-authority.md` | navigation / cutover-patch-only | rework | A | "(docs/specs/confinement-authority.md §9.2)": README (35 lines) has no 9.2; the section lives in agent-confinement/spec.md L454. Locator dropped by patching to README. |
| maps-i-04708 | docs/platform/runner/architecture/h-69197b459754.md:115 | `docs/architect/agent-coordination/architecture/dispatch-control-plane.` | navigation / cutover-patch-only | ok | - | Complete reference replaced by exact same-path/promoted target that exists at the input commit; no locator lost; correct. |
| maps-i-04712 | docs/platform/runner/architecture/h-7af1f0242611.md:10 | `docs/specs/runner.md` | provenance / preserve | ok | - | Pinned provenance/source-locator column or header preserved; correct. |
| maps-i-04715 | docs/platform/runner/architecture/h-e53a3a9829a8.md:10 | `docs/specs/runner.md` | provenance / preserve | ok | - | Pinned provenance/source-locator column or header preserved; correct. |
| maps-i-04717 | docs/platform/runner/contracts/h-b3eb60fb4d2b.md:10 | `docs/specs/runner.md` | provenance / preserve | ok | - | Pinned provenance/source-locator column or header preserved; correct. |
| maps-i-04719 | docs/platform/runner/contracts/routing-handoff.md:9 | `docs/routing-handoff-contract.md` | self-reference-preserved / preserve | ok | - | Pinned sha/blob provenance (or original-source link) in candidate header; self-reference preserved, correct. |
| maps-i-04721 | docs/platform/runner/contracts/routing-handoff.md:23 | `docs/platform-foundations.md` | navigation / cutover-patch-only | ok | - | Complete reference replaced by exact same-path/promoted target that exists at the input commit; no locator lost; correct. |
| maps-i-04722 | docs/platform/runner/contracts/routing-handoff.md:54 | `docs/specs/work-state.md` | operative-read / cutover-patch-only | ok | - | Operative read mapped to exact retained file (work-state/spec.md exists); correct. |
| maps-i-04723 | docs/platform/runner/contracts/routing-handoff.md:107 | `docs/specs/confinement-authority.md` | navigation / cutover-patch-only | rework | A | Same as 04707 (§9.2 cited; target should be agent-confinement/spec.md section 9.2). |
| maps-i-04726 | docs/platform/runner/decisions/h-36d872fbb0e5.md:10 | `docs/specs/runner.md` | provenance / preserve | ok | - | Pinned provenance/source-locator column or header preserved; correct. |
| maps-i-04758 | docs/platform/runner/decisions/h-36d872fbb0e5.md:1385 | `docs/history/agent-coordination-foundation/plan.md` | retained-history / preserve | ok | - | docs/history is retained; preserved, correct. |
| maps-i-04759 | docs/platform/runner/decisions/h-36d872fbb0e5.md:1406 | `docs/routing-handoff-contract.md` | navigation / cutover-patch-only | ok | - | Complete reference replaced by exact same-path/promoted target that exists at the input commit; no locator lost; correct. |
| maps-i-04760 | docs/platform/runner/decisions/h-36d872fbb0e5.md:1605 | `docs/routing-handoff-contract.md` | navigation / cutover-patch-only | ok | - | Complete reference replaced by exact same-path/promoted target that exists at the input commit; no locator lost; correct. |
| maps-i-04761 | docs/platform/runner/decisions/h-36d872fbb0e5.md:1640 | `docs/specs/distribution.md` | navigation / cutover-patch-only | rework | A | "RUL13 ... in docs/specs/distribution.md": README has no RUL13; rule carried in packaging-distribution/spec.md L674. Locator dropped by README patch. |
| maps-i-04764 | docs/platform/runner/decisions/h-aabefc85f0c9.md:10 | `docs/specs/runner.md` | provenance / preserve | ok | - | Pinned provenance/source-locator column or header preserved; correct. |
| maps-i-04767 | docs/platform/runner/decisions/h-aabefc85f0c9.md:57 | `docs/architect/agent-coordination/architecture/work-integration.md` | navigation / cutover-patch-only | ok | - | Complete reference replaced by exact same-path/promoted target that exists at the input commit; no locator lost; correct. |
| maps-i-04770 | docs/platform/runner/operations/h-51f5cd7279fd.md:10 | `docs/specs/runner.md` | provenance / preserve | ok | - | Pinned provenance/source-locator column or header preserved; correct. |
| maps-i-04773 | docs/platform/runner/spec.md:17 | `docs/specs/runner.md` | provenance / preserve | ok | - | Pinned provenance/source-locator column or header preserved; correct. |
| maps-i-04781 | docs/platform/runner/spec.md:187 | `docs/architecture-manifest.json` | retained-reference / preserve | ok | - | Target exists at the input commit and is retained in place; preserved, correct. |
| maps-i-04782 | docs/platform/runner/spec.md:197 | `docs/architecture-manifest.json` | retained-reference / preserve | ok | - | Target exists at the input commit and is retained in place; preserved, correct. |
| maps-i-04785 | docs/platform/runner/spec.md:208 | `docs/routing-handoff-contract.md` | navigation / cutover-patch-only | ok | - | Complete reference replaced by exact same-path/promoted target that exists at the input commit; no locator lost; correct. |
| maps-i-04786 | docs/platform/runner/spec.md:212 | `docs/specs/distribution.md` | navigation / cutover-patch-only | ok | - | Complete reference replaced by exact same-path/promoted target that exists at the input commit; no locator lost; correct. |
| maps-i-04788 | docs/platform/runner/subcomponents/h-02842f76ffd2/spec.md:10 | `docs/specs/runner.md` | provenance / preserve | ok | - | Pinned provenance/source-locator column or header preserved; correct. |
| maps-i-04790 | docs/platform/runner/subcomponents/h-2e032393add1/spec.md:10 | `docs/specs/runner.md` | provenance / preserve | ok | - | Pinned provenance/source-locator column or header preserved; correct. |
| maps-i-04792 | docs/platform/runner/subcomponents/h-2e032393add1/spec.md:30 | `docs/backlog.md` | retained-reference / preserve | ok | - | Target exists at the input commit and is retained in place; preserved, correct. |
| maps-i-04793 | docs/platform/runner/subcomponents/h-2e032393add1/spec.md:42 | `docs/backlog.md` | retained-reference / preserve | ok | - | Target exists at the input commit and is retained in place; preserved, correct. |
| maps-i-04796 | docs/platform/runner/subcomponents/h-2e032393add1/spec.md:55 | `docs/backlog.md` | retained-reference / preserve | ok | - | Target exists at the input commit and is retained in place; preserved, correct. |
| maps-i-04797 | docs/platform/runner/subcomponents/h-37aced3896a8/spec.md:10 | `docs/specs/runner.md` | provenance / preserve | ok | - | Pinned provenance/source-locator column or header preserved; correct. |
| maps-i-04799 | docs/platform/runner/subcomponents/h-6979005beaf7/spec.md:10 | `docs/specs/runner.md` | provenance / preserve | ok | - | Pinned provenance/source-locator column or header preserved; correct. |
| maps-i-04806 | docs/platform/runner/subcomponents/h-6979005beaf7/spec.md:72 | `docs/operator-runbook-herdr-cockpit.md` | navigation / cutover-patch-only | ok | - | Complete reference replaced by exact same-path/promoted target that exists at the input commit; no locator lost; correct. |
| maps-i-04807 | docs/platform/runner/subcomponents/h-6979005beaf7/spec.md:72 | `docs/architect/agent-coordination/decisions/ADR-011-dispatch-owns-life` | navigation / cutover-patch-only | ok | - | Complete reference replaced by exact same-path/promoted target that exists at the input commit; no locator lost; correct. |
| maps-i-04808 | docs/platform/runner/subcomponents/h-6979005beaf7/spec.md:72 | `docs/architect/proposals/visibility-and-interactive-contact-herdr-spaw` | navigation / cutover-patch-only | ok | - | Complete reference replaced by exact same-path/promoted target that exists at the input commit; no locator lost; correct. |
| maps-i-04810 | docs/platform/runner/subcomponents/h-6979005beaf7/spec.md:99 | `docs/specs/confinement-authority.md` | navigation / cutover-patch-only | rework | A | "docs/specs/confinement-authority.md §13.1 ... confined-pane-accounts": section 13.1 is absent from agent-confinement/spec.md and README (history/rollout-and-settled-facts.md carries the settled facts); patch to README drops the §13.1 locator. |
| maps-i-04811 | docs/platform/runner/subcomponents/h-6979005beaf7/spec.md:166 | `docs/specs/confinement-authority.md` | navigation / cutover-patch-only | ok | - | Complete reference replaced by exact same-path/promoted target that exists at the input commit; no locator lost; correct. |
| maps-i-04812 | docs/platform/runner/subcomponents/h-6df5686d0d54/spec.md:10 | `docs/specs/runner.md` | provenance / preserve | ok | - | Pinned provenance/source-locator column or header preserved; correct. |
| maps-i-04814 | docs/platform/runner/subcomponents/h-ce5b9771a26a/spec.md:10 | `docs/specs/runner.md` | provenance / preserve | ok | - | Pinned provenance/source-locator column or header preserved; correct. |
| maps-i-04816 | docs/platform/runner/subcomponents/h-d3b49ef7edf5/spec.md:10 | `docs/specs/runner.md` | provenance / preserve | ok | - | Pinned provenance/source-locator column or header preserved; correct. |
| maps-i-04818 | docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md:10 | `docs/specs/runner.md` | provenance / preserve | ok | - | Pinned provenance/source-locator column or header preserved; correct. |
| maps-i-04820 | docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md:51 | `docs/architecture-manifest.json` | retained-reference / preserve | ok | - | Target exists at the input commit and is retained in place; preserved, correct. |
| maps-i-04821 | docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md:61 | `docs/architecture-manifest.json` | retained-reference / preserve | ok | - | Target exists at the input commit and is retained in place; preserved, correct. |
| maps-i-04824 | docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md:72 | `docs/routing-handoff-contract.md` | navigation / cutover-patch-only | ok | - | Complete reference replaced by exact same-path/promoted target that exists at the input commit; no locator lost; correct. |
| maps-i-04825 | docs/platform/runner/subcomponents/h-f34e0d170d89/spec.md:76 | `docs/specs/distribution.md` | navigation / cutover-patch-only | ok | - | Complete reference replaced by exact same-path/promoted target that exists at the input commit; no locator lost; correct. |
| maps-i-04829 | docs/platform/session-identity/spec.md:30 | `[io-contract](../../io-contract.md)` | navigation / cutover-patch-only | ok | - | Complete reference replaced by exact same-path/promoted target that exists at the input commit; no locator lost; correct. |
| maps-i-04830 | docs/platform/system-architecture/architecture/architecture-intent.md:9 | `docs/architect/architecture-intent.md` | self-reference-preserved / preserve | ok | - | Pinned sha/blob provenance (or original-source link) in candidate header; self-reference preserved, correct. |
| maps-i-04831 | docs/platform/system-architecture/architecture/architecture-intent.md:11 | `docs/architect/architecture-intent.md` | self-reference-preserved / preserve | rework | C | "Canonical for: Nothing until promotion; current source remains docs/architect/architecture-intent.md" is a migration-state header sentence; self-ref-preserved (L12-25.1/4 call for row flip at the authority flip). Preserving bytes leaves a false claim after cutover. (Line 9 provenance, 04830, is correctly preserved.) |
| maps-i-04843 | docs/platform/system-architecture/architecture/roadmap.md:9 | `docs/architect/roadmap.md` | self-reference-preserved / preserve | ok | - | Pinned sha/blob provenance (or original-source link) in candidate header; self-reference preserved, correct. |
| maps-i-04844 | docs/platform/system-architecture/architecture/roadmap.md:11 | `docs/architect/roadmap.md` | self-reference-preserved / preserve | rework | C | Same as 04831 for roadmap.md L11. |
| maps-i-04849 | docs/platform/system-architecture/architecture/roadmap.md:275 | `docs/architect/` | legacy-tree-semantic / preserve-pending-target | ok | - | Whole legacy-tree/glob mention or no unique target; parked for Step 3, not path-substituted; acceptable. |
| maps-i-04850 | docs/platform/system-architecture/architecture/roadmap.md:277 | `docs/specs/*` | navigation / preserve-pending-target | ok | - | Whole legacy-tree/glob mention or no unique target; parked for Step 3, not path-substituted; acceptable. |
| maps-i-04851 | docs/platform/system-architecture/architecture/system-vision-trong-mem-ngoai-cung.md:9 | `docs/architect/system-vision-trong-mem-ngoai-cung.md` | self-reference-preserved / preserve | ok | - | Pinned sha/blob provenance (or original-source link) in candidate header; self-reference preserved, correct. |
| maps-i-04852 | docs/platform/system-architecture/architecture/system-vision-trong-mem-ngoai-cung.md:11 | `docs/architect/system-vision-trong-mem-ngoai-cung.md` | self-reference-preserved / preserve | rework | C | Same as 04831 for system-vision-trong-mem-ngoai-cung.md L11. |
| maps-i-04854 | docs/platform/system-architecture/architecture/workspace-topology-audit.md:9 | `docs/architect/workspace-topology-audit.md` | self-reference-preserved / preserve | ok | - | Pinned sha/blob provenance (or original-source link) in candidate header; self-reference preserved, correct. |
| maps-i-04855 | docs/platform/system-architecture/architecture/workspace-topology-audit.md:11 | `docs/architect/workspace-topology-audit.md` | self-reference-preserved / preserve | rework | C | Same as 04831 for workspace-topology-audit.md L11. |

## Notes for Lead

- Class A is generator-wide: 58 census rows with a RUL/section locator in the cited line (48 docs/specs/runner.md, 10 docs/specs/distribution.md) are patched to the area README; the same applies to confinement-authority section references. Fix once in the generator (locator-bearing refs map to the exact split file or park), not per row.
- Decision-record bodies in runner/decisions/h-36d872fbb0e5.md (04759, 04760, 04767) are path-patched; the instructions give no immutable-record exception, and the target files exist, so they are ok. Mention only if Lead wants a history-body exception.
- Brace expansion pairs (04693/04694) are correctly two edges with distinct spans.
