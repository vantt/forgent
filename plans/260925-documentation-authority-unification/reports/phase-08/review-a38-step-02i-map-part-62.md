# Review a38 step-02i mapping part 62

- Reviewer: reviewer:sonnet-session:af1c6c75c63eb2c8c@2026-10-19
- Commits: worktree detached at 74e3ecf1e (accounting); author 904d0fb5c
- Part: 62 (population behavioral-runtime-and-contract-triage; sourceTable step-02i-census-maps-portals-prose.json; 60 entries)
- Method: every entry read with all fields (successorNote, desiredOwner, parkedReason, mechanicalTargetCheck); consumer passage, fences/headings and target existence checked in the committed tree; L12-7, L12-10, L12-19..25 and A50 applied.

## Totals

ok 57, rework 3, needs-Lead-judgment 0 (of 60). Rework rate 5.0%.

| # | edgeId | consumer:line | action | verdict | class | evidence / rationale |
|---|---|---|---|---|---|---|
| 0 | maps-i-03820 | component-boundary.md:74 | cutover-patch-only | **ok** |  | Live component table row; confinement-authority is a split area (README+spec+contracts+decisions) so README navigation is acceptable; relative patch correct from docs/platform/. |
| 1 | maps-i-03821 | component-boundary.md:75 | cutover-patch-only | **ok** |  | Exact single retained destination exists (agent-coordination/architecture/evidence-and-results.md); relative patch correct. |
| 2 | maps-i-03822 | component-boundary.md:76 | cutover-patch-only | **ok** |  | Same-path directory mirror docs/platform/domainization/ exists (L12-22), trailing slash kept. |
| 3 | maps-i-03823 | component-boundary.md:80 | cutover-patch-only | **ok** |  | Exact Observe spec exists (docs/platform/observe/spec.md) per L12-22. |
| 4 | maps-i-03837 | architecture-manifest.json:3 | preserve-pending-behavioral-proof | **ok** |  | JSON data key `map`; no reader found in test/architecture.test.mjs, src or scripts; parked for Step 5 reader trace with no executable text. |
| 5 | maps-i-03839 | README.md:9 | preserve | **ok** |  | Header Provenance with sha pin; preserve correct. |
| 6 | maps-i-03841 | spec.md:17 | preserve | **ok** |  | Header Provenance with sha pin; preserve correct. |
| 7 | maps-i-03846 | spec.md:49 | preserve-pending-behavioral-proof | **ok** |  | Checker-scope statement (`--specs-dir` default docs/specs); behavioral Step 5 per L12-21/25(8). |
| 8 | maps-i-03847 | spec.md:59 | preserve | **ok** |  | Retained root file docs/backlog.md (L12-23); preserve correct. |
| 9 | maps-i-03848 | spec.md:59 | preserve-pending-behavioral-proof | **ok** |  | Checker scope (`docs/specs/*.md`) in scan-scope row; behavioral Step 5. |
| 10 | maps-i-03852 | spec.md:92 | preserve-pending-behavioral-proof | **ok** |  | Rule R3 scan scope; behavioral Step 5. |
| 11 | maps-i-03854 | README.md:9 | preserve | **ok** |  | Header Provenance with sha pin; preserve correct. |
| 12 | maps-i-03856 | spec.md:17 | preserve | **ok** |  | Header Provenance with sha pin; preserve correct. |
| 13 | maps-i-03858 | spec.md:146 | cutover-patch-only | **ok** |  | Target docs/platform/system-overview/spec.md exists and carries the distillery area entry (line 50), so the factual claim stays true. |
| 14 | maps-i-03859 | documentation-system-design.md:9 | preserve | **ok** |  | Header Provenance (sha+blob pin); preserve correct. |
| 15 | maps-i-03867 | documentation-system-design.md:655 | preserve-pending-target | **ok** |  | Whole-tree `docs/specs/**` statement in generated-docs section; parked, no substitution. |
| 16 | maps-i-03868 | documentation-system-design.md:681 | cutover-patch-only | **ok** |  | Section 15 Migration Strategy to-do list ('Promote ... into'); L12-24 settled this class as planning-narrative navigation (maps-g-03867/03868). Verified decision, not reversed. |
| 17 | maps-i-03869 | documentation-system-design.md:682 | cutover-patch-only | **ok** |  | Same settled class as maps-i-03868; docs-portal.md exists. |
| 18 | maps-i-03870 | documentation-system-design.md:682 | preserve | **ok** |  | Retained root file docs/reading-map.md stays in place (L12-23); consistent within the same sentence. |
| 19 | maps-i-03871 | id-systems-audit.md:9 | preserve | **ok** |  | Header Provenance (sha pin); preserve correct. |
| 20 | maps-i-03881 | id-systems-audit.md:181 | preserve | **ok** |  | `repo/docs/backlog.md` resolves to retained docs/backlog.md; preserve correct. |
| 21 | maps-i-03886 | documentation-system-discussion.md:9 | preserve | **ok** |  | Header Provenance (sha+blob pin); preserve correct. |
| 22 | maps-i-03890 | documentation-system-discussion.md:64 | preserve | **ok** | N2 | Dated discussion history (Document type: History carrier); preserve is right. Non-blocking: label 'explicit current-file carriage region' is not backed by a carriage heading in this file (N2). |
| 23 | maps-i-03891 | documentation-system-discussion.md:65 | preserve | **ok** | N2 | Dated discussion history (Document type: History carrier); preserve is right. Non-blocking: label 'explicit current-file carriage region' is not backed by a carriage heading in this file (N2). |
| 24 | maps-i-03893 | documentation-system-discussion.md:73 | preserve | **ok** | N2 | Dated discussion history (Document type: History carrier); preserve is right. Non-blocking: label 'explicit current-file carriage region' is not backed by a carriage heading in this file (N2). |
| 25 | maps-i-03894 | documentation-system-discussion.md:74 | preserve | **rework** | D4 | Glob token `docs/ui-spec/generated/*` is checked as a literal file: mechanicalCheck exists=false / missing-target and successorNote says 'Deleted historical target'. docs/ui-spec/generated/ exists (action-registry.csv, coverage-report.md, ...). Action preserve is right (ui-spec not retiring, L12-24(5)); the mechanical record and note are false and feed the target-failure population. |
| 26 | maps-i-03895 | documentation-system-discussion.md:77 | preserve | **ok** | N2 | Dated discussion history (Document type: History carrier); preserve is right. Non-blocking: label 'explicit current-file carriage region' is not backed by a carriage heading in this file (N2). |
| 27 | maps-i-03896 | documentation-system-discussion.md:81 | preserve | **rework** | D4 | Same as maps-i-03894: glob resolved as literal file, false missing-target and 'Deleted historical target' note for an existing non-retiring directory. |
| 28 | maps-i-03899 | documentation-system-discussion.md:94 | preserve | **ok** | N2 | Dated discussion history (Document type: History carrier); preserve is right. Non-blocking: label 'explicit current-file carriage region' is not backed by a carriage heading in this file (N2). |
| 29 | maps-i-03900 | documentation-system-discussion.md:97 | preserve | **ok** | N2 | Dated discussion history (Document type: History carrier); preserve is right. Non-blocking: label 'explicit current-file carriage region' is not backed by a carriage heading in this file (N2). |
| 30 | maps-i-03901 | documentation-system-discussion.md:183 | preserve | **ok** | N2 | Dated discussion history (Document type: History carrier); preserve is right. Non-blocking: label 'explicit current-file carriage region' is not backed by a carriage heading in this file (N2). |
| 31 | maps-i-03902 | documentation-system-discussion.md:184 | preserve | **rework** | D4 | Same as maps-i-03894: glob resolved as literal file, false missing-target and 'Deleted historical target' note for an existing non-retiring directory. |
| 32 | maps-i-03937 | documentation-system-discussion.md:1231 | preserve | **ok** | N2 | Dated discussion history (Document type: History carrier); preserve is right. Non-blocking: label 'explicit current-file carriage region' is not backed by a carriage heading in this file (N2). |
| 33 | maps-i-03944 | documentation-system-discussion.md:1283 | preserve | **ok** | N2 | Dated discussion history (Document type: History carrier); preserve is right. Non-blocking: label 'explicit current-file carriage region' is not backed by a carriage heading in this file (N2). |
| 34 | maps-i-03945 | documentation-system-discussion.md:1283 | preserve | **ok** | N2 | Dated discussion history (Document type: History carrier); preserve is right. Non-blocking: label 'explicit current-file carriage region' is not backed by a carriage heading in this file (N2). |
| 35 | maps-i-03965 | docs-portal.md:9 | preserve | **ok** |  | Header Provenance (sha pin); preserve correct. |
| 36 | maps-i-03976 | switchboard.md:33 | preserve-pending-target | **ok** |  | Live invariant sentence about `legacy-current` under `docs/specs/**`; migration-state wording parked non-executably for Step 3, so it is not lost. |
| 37 | maps-i-04037 | switchboard.md:87 | phase9-row-flip | **ok** |  | Switchboard status row; migration-state row flip at Phase 9 (L12-25(1)), no path substitution. |
| 38 | maps-i-04044 | domainization.md:9 | preserve | **ok** |  | Header Provenance (sha+blob pin); preserve correct. |
| 39 | maps-i-04050 | spec.md:243 | cutover-patch-only | **ok** |  | Line-range citation :184-190 lies inside old L7 section (182-199); mapped to anchor l7-durability-ladder, which exists at docs/platform/platform-foundations.md:267 (repo anchor tool accepts the extractor anchor). |
| 40 | maps-i-04053 | governance.md:9 | preserve | **ok** |  | Header Provenance (sha pin); preserve correct. |
| 41 | maps-i-04060 | governance.md:488 | preserve | **ok** |  | Header-block Provenance (`Promoted from`, Source Metadata); preserve correct. |
| 42 | maps-i-04063 | README.md:9 | preserve | **ok** |  | Header Provenance (sha pin); preserve correct. |
| 43 | maps-i-04065 | fgos-gateway-api-v1.yaml:44 | preserve-pending-behavioral-proof | **ok** |  | YAML `description:` string in served OpenAPI contract (data, not comment); Step 5 reader/served-bytes trace pending, no executable text. |
| 44 | maps-i-04066 | fgos-gateway-api-v1.yaml:53 | preserve-pending-behavioral-proof | **ok** |  | YAML `x-specs` list data in served contract; Step 5. |
| 45 | maps-i-04067 | fgos-gateway-api-v1.yaml:54 | preserve-pending-behavioral-proof | **ok** |  | YAML `x-specs` list data; Step 5. |
| 46 | maps-i-04068 | fgos-gateway-api-v1.yaml:55 | preserve-pending-behavioral-proof | **ok** |  | YAML `x-specs` list data; Step 5. |
| 47 | maps-i-04073 | fgos-gateway-api-v1.yaml:456 | preserve-pending-behavioral-proof | **ok** |  | YAML flow-mapping `description:` data; Step 5. |
| 48 | maps-i-04074 | fgos-gateway-api-v1.yaml:607 | preserve-pending-behavioral-proof | **ok** |  | YAML block-scalar `description:` data; Step 5. |
| 49 | maps-i-04075 | fgos-gateway-api-v1.yaml:681 | preserve-pending-behavioral-proof | **ok** |  | YAML block-scalar `description:` data (quoted rule); Step 5. |
| 50 | maps-i-04076 | fgos-gateway-api-v1.yaml:710 | preserve-pending-behavioral-proof | **ok** |  | YAML block-scalar description data; Step 5. |
| 51 | maps-i-04078 | fgos-gateway-api-v1.yaml:739 | preserve-pending-behavioral-proof | **ok** |  | YAML block-scalar description data; Step 5. |
| 52 | maps-i-04079 | fgos-gateway-api-v1.yaml:863 | preserve-pending-behavioral-proof | **ok** |  | YAML `description:` data; Step 5. |
| 53 | maps-i-04080 | operator-runbook.md:9 | preserve | **ok** |  | Header Provenance (sha pin); preserve correct. |
| 54 | maps-i-04084 | spec.md:17 | preserve | **ok** |  | Header Provenance (sha pin); preserve correct. |
| 55 | maps-i-04099 | spec.md:345 | preserve-pending-target | **ok** |  | Decision-anchor citation (`#0014--...`) with no unique exact mapping; parked, locator kept, no path substitution. |
| 56 | maps-i-04108 | README.md:16 | preserve | **ok** |  | Header Provenance glob; preserve correct. |
| 57 | maps-i-04110 | external-provider-protocol.md:16 | preserve | **ok** |  | Header Provenance; preserve correct. |
| 58 | maps-i-04123 | host-use-cases.md:15 | preserve | **ok** |  | Header Provenance; preserve correct. |
| 59 | maps-i-04126 | invocation-kernel.md:16 | preserve | **ok** |  | Header Provenance; preserve correct. |

## Defect classes (rework)

- D4 glob token mechanically checked as a literal file: maps-i-03894, 03896, 03902 (`docs/ui-spec/generated/*`): false missing-target and 'Deleted historical target' successorNote for an existing, non-retiring directory. Fix: expand the glob, drop the failure and the note; action preserve unchanged.

## Non-blocking observations (rows kept ok)

- N2 maps-i-03890..03901, 03937, 03944, 03945 (documentation-system-discussion.md): labelled 'explicit current-file carriage region' but the file has no carriage heading (the whole file is a History carrier with a dated discussion log). Preserve is right; if the Phase 9 link check relies on region exclusion, it needs the whole-file carrier rule.
- maps-i-03868/03869 (migration to-do list path-substituted) kept ok because L12-24 settled that class as navigation.
- maps-i-03837 `map` key: no reader found in test/architecture.test.mjs, src or scripts; parking for Step 5 is conservative. The platform/contracts copy (13.0K) already differs from docs/architecture-manifest.json (14.4K).
