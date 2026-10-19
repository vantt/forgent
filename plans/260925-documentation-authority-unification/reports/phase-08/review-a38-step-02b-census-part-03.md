# Review a38 step-02b census part 03

- Reviewer: reviewer:sonnet-session:a3f2c2a8fa501f640@2026-10-19
- Worktree: /home/vantt/projects/forgentX-s8-review, detached HEAD c801778ac48e78dae45b67a58b7484e87bfcd4a5 (author 8606433d6, accounting c801778ac)
- Part: step-02b-review-part-03.json, 60 entries (skills-032 .. skills-091, all reviewClass skills-prompts, all edges), sha256 77aa1462847b0445644ad132b1d56075d844a49a7ca965ec98ea32d2527a1e9f

## Mechanical results (all 60 entries)

- Every row: file digest matches; callSite equals the line; matched expression equals the column slice; every context line matches; switchboardDigest matches current transitional-switchboard.json. 0 failures.
- Each row equals the corresponding row in step-02-census-skills-prompts.json exactly.
- Source vs render: 31 generated-assembly renders (.agents, .claude) with header stripped are byte-equal to the named source; 1 thin wrapper (skills-057) equals generateWrapperContent output; 28 source rows (core/, domains/, hand-authored .claude/skills/ui-spec) correctly not classed as generated. No render is named as an edit target; regeneration is `npm run build:skills` later.
- canonicalEdgeIds list sibling source edges of the same file; the five renders without a same-table source edge (055, 056, 059, 060, 061) map to prior history edges (history-023/024/026/027/028) whose path/line/expression match the source file.
- Desired owners exist for all concrete (non-template) targets (docs/reading-map.md, docs/backlog.md, docs/id-systems-audit.md and its platform history copy, docs/history/* files, docs/ui-spec/*). RUL45 anchor unheaded-block-6 passes anchorExists and covers lines 71-78 containing RUL45.
- preCutoverAction is preserve for all 60; cutover-patch-only is limited to the 10 rows citing docs/specs/** (038, 043, 045, 070, 078, 084, 085, 087, 088, 090) (L12-7 respected). L12-10: all docs/history/<feature>/ rows are preserve with external-project wording, no repository plans/ mapping.

## Verdicts

| Entry | Verdict | Deep read | Note |
|---|---|---|---|
| skills-032 | ok | no | Mechanics, role and L12-10 external-project preserve verified. |
| skills-033 | ok | no | Mechanics, role and L12-10 external-project preserve verified. |
| skills-034 | ok | no | Mechanics, role and L12-10 external-project preserve verified. |
| skills-035 | ok | yes | Mechanics, role and L12-10 external-project preserve verified. |
| skills-036 | ok | no | Mechanics, role and L12-10 external-project preserve verified. |
| skills-037 | ok | yes | Prohibited-write role (skill forbids writing CONTEXT.md/plan.md) correctly labeled; L12-10 preserve. |
| skills-038 | ok | yes | Parked correctly: runner.md untrusted-input gloss; RUL45 "Ranh giới tin cậy" at runner candidate spec supports it, but candidate-only suggestion, no executable new patch. Cutover-patch-only per L12-7. |
| skills-039 | ok | yes | Mechanics, role and L12-10 external-project preserve verified. |
| skills-040 | ok | yes | Mechanics, role and L12-10 external-project preserve verified. |
| skills-041 | ok | yes | Metadata docsRef/refs role (fgos edit --refs), not file write; correct. |
| skills-042 | ok | no | Mechanics, role and L12-10 external-project preserve verified. |
| skills-043 | ok | yes | Writer/pointer contract for end-user docs pointer; docs/reading-map.md has the matching end-user pointer (line ~157, "Merged from docs/specs/reading-map.md"). Parked until conservation shown; pre-flip write destination stays docs/specs/reading-map.md. L12-7 cutover-only OK. |
| skills-044 | ok | yes | Mechanics, role and L12-10 external-project preserve verified. |
| skills-045 | ok | yes | Concrete new target docs/platform/runner/subcomponents/h-6979005beaf7/spec.md#unheaded-block-6: anchor exists, spans lines 71-78 and contains RUL45 text (line 78) incl. untrusted-input boundary. Positional anchor, rebind if shifts. Parked for Step 3 semantic check. |
| skills-046 | ok | no | Mechanics, role and L12-10 external-project preserve verified. |
| skills-047 | ok | yes | Mechanics, role and L12-10 external-project preserve verified. |
| skills-048 | ok | yes | Mechanics, role and L12-10 external-project preserve verified. |
| skills-049 | ok | no | Mechanics, role and L12-10 external-project preserve verified. |
| skills-050 | ok | yes | Mechanics, role and L12-10 external-project preserve verified. |
| skills-051 | ok | no | Mechanics, role and L12-10 external-project preserve verified. |
| skills-052 | ok | no | Mechanics, role and L12-10 external-project preserve verified. |
| skills-053 | ok | no | Mechanics, role and L12-10 external-project preserve verified. |
| skills-054 | ok | no | Mechanics, role and L12-10 external-project preserve verified. |
| skills-055 | ok | yes | Render .claude/ maps to source domains/coding/...; source edge is the prior history-023/024 (no source row in this table by design, via priorCanonicalHistoryEdges). |
| skills-056 | ok | no | Mechanics, role and L12-10 external-project preserve verified. |
| skills-057 | ok | yes | Thin wrapper byte-equals generateWrapperContent(.agents source); verified. |
| skills-058 | ok | no | Mechanics, role and L12-10 external-project preserve verified. |
| skills-059 | ok | yes | Source edge = history-026 via prior table. |
| skills-060 | ok | yes | Source edges history-027/028. |
| skills-061 | ok | no | Same as 060. |
| skills-062 | ok | yes | Mechanics, role and L12-10 external-project preserve verified. |
| skills-063 | ok | yes | Portable ui-spec --output example; not an authority alias; L12-10 preserve. |
| skills-064 | ok | yes | Mechanics, role and L12-10 external-project preserve verified. |
| skills-065 | ok | no | Mechanics, role and L12-10 external-project preserve verified. |
| skills-066 | ok | yes | Mechanics, role and L12-10 external-project preserve verified. |
| skills-067 | ok | yes | Mechanics, role and L12-10 external-project preserve verified. |
| skills-068 | ok | yes | Mechanics, role and L12-10 external-project preserve verified. |
| skills-069 | ok | yes | verify-runtime reads fixed frontend/docs/ui-spec/generated/wireframe-v2.html (absent from checkout; frontend/ does not exist), outside --root/config contract. Row correctly preserve + parked. Note stale in-file comment says .agents/... path. |
| skills-070 | ok | yes | Portable citation convention; patch blocked on checker/default-root parity. L12-7 cutover-only OK. |
| skills-071 | ok | no | Mechanics, role and L12-10 external-project preserve verified. |
| skills-072 | ok | yes | Mechanics, role and L12-10 external-project preserve verified. |
| skills-073 | ok | yes | Mechanics, role and L12-10 external-project preserve verified. |
| skills-074 | ok | no | Mechanics, role and L12-10 external-project preserve verified. |
| skills-075 | ok | no | Mechanics, role and L12-10 external-project preserve verified. |
| skills-076 | ok | no | Mechanics, role and L12-10 external-project preserve verified. |
| skills-077 | ok | yes | Mechanics, role and L12-10 external-project preserve verified. |
| skills-078 | ok | yes | Same; proposed new is a glob docs/platform/**/spec.md, not executable, parked. |
| skills-079 | ok | yes | Mechanics, role and L12-10 external-project preserve verified. |
| skills-080 | ok | no | Mechanics, role and L12-10 external-project preserve verified. |
| skills-081 | ok | no | Mechanics, role and L12-10 external-project preserve verified. |
| skills-082 | ok | no | Mechanics, role and L12-10 external-project preserve verified. |
| skills-083 | ok | no | Mechanics, role and L12-10 external-project preserve verified. |
| skills-084 | ok | yes | Same RUL45 target as skills-045; supported by passage; parked. |
| skills-085 | ok | yes | Source of 043; same. |
| skills-086 | ok | yes | Mechanics, role and L12-10 external-project preserve verified. |
| skills-087 | ok | yes | Same RUL45 target; parked. |
| skills-088 | ok | yes | Task-spec source for fgos-indexing; same. |
| skills-089 | ok | yes | Mechanics, role and L12-10 external-project preserve verified. |
| skills-090 | ok | yes | Same RUL45 target (source, Vietnamese gloss); parked. |
| skills-091 | ok | no | Mechanics, role and L12-10 external-project preserve verified. |

## Deep-read list (36 entries)

skills-035, skills-037, skills-038, skills-039, skills-040, skills-041, skills-043, skills-044, skills-045, skills-047, skills-048, skills-050, skills-055, skills-057, skills-059, skills-060, skills-062, skills-063, skills-064, skills-066, skills-067, skills-068, skills-069, skills-070, skills-072, skills-073, skills-077, skills-078, skills-079, skills-084, skills-085, skills-086, skills-087, skills-088, skills-089, skills-090. Read: source text around matched lines in the .agents/.claude renders, core/domains sources, docs/reading-map.md pointer, runner candidate spec lines 71-78, ui-spec config.mjs root discovery and verify-runtime.mjs line 14, wrapper generator output.

## Observations (no rework)

- skills-045/084/087/090 carry a concrete new target while parked; consistent with the contract, Step 3 must still confirm RUL45 correspondence for each gloss. skills-038 correctly has only a candidate suggestion.
- skills-069: frontend/ is absent, in-file comment mentions a .agents path; already flagged by the author for Lead triage.
- skills-078 proposed new is a glob, not an executable patch; parked.

## Totals

ok 60, rework 0, needs-Lead-judgment 0.
