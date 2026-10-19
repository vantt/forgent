# Review a38 Step 02 merged census part 02 (history-plan-contracts)

Reviewer: reviewer:sonnet-session:a58ae565cd4d12fab@2026-10-19

Reviewed commit: 0689b862e (author ce84b84e7, input main merge 587c2a791). Part: step-02-review-part-02.json, sha256 e13d001d361a6d721b1def55a28ffbb0a2e72fbefbd426980a83ff16622d0620 (22 entries).

## Checks run (read-only, light)

- Per entry: file digest equals fileDigest; every edge's callSite equals the file line and matchedExpression equals the line slice at columnStart/columnEndExclusive.
- Coverage: an independent regex over docs/history/(<feature>|path)/(plan|CONTEXT|RESEARCH|DISCUSSION).md per file equals the entry edge multiset (line, column, expression) for all 22 files (43 edges).
- L12-10: 13 literal-plan-convention (external-project) entries and 9 named-historical-plan-reference entries; all have preCutoverAction = cutoverAction = preserve; writeDestination is only set on writer/footprint conventions with kind 'explicit external-project convention; not alias', activeAlias false; no alias activated.
- L12-7: no docs/specs or docs/architect consumer is edited here; `git diff --name-only 587c2a791 HEAD` outside plans/ is empty, so no consumer, source, render or sibling file changed.
- Source vs render: 14 generated entries (.agents/skills, plugins/fgOS/skills) carry sourceVsRender=render with sourcePath pointing at core/ or domains/; their docs/history lines are byte-identical to the source file lines. Source entries are marked source.
- Semantic: read the cited lines. Reader vs writer is correct: planning SKILL L15/16 reads CONTEXT.md and writes plan.md; verify-sync-and-gap writes/footprints plan.md (reader-writer-footprint); validating SKILL and gate-check --plan read plan.md; shape-plan.md requires the Mode token inside plan.md (writer convention); gate-bypass/CONTEXT.md, agent-coordination-foundation/plan.md, two-layer-dispatch/DISCUSSION.md and agent-executor-generalized-capacity-helper/CONTEXT.md are historical citations with no destination role.

## Rows

| # | Entry id (path) | Edges | Class | Verdict |
|---|---|---:|---|---|
| 1 | .agents/skills/_shared/capability-catalog.md (render) | 1 | historical reference (L12-10); preserve/preserve | ok |
| 2 | .agents/skills/_shared/executor-dispatch-fallback.md (render) | 4 | historical reference (L12-10); preserve/preserve | ok |
| 3 | .agents/skills/_shared/planning-capability-awareness.md (render) | 1 | historical reference (L12-10); preserve/preserve | ok |
| 4 | .agents/skills/fgos-coding-planning/SKILL.md (render) | 2 | external-project convention (L12-10); preserve/preserve | ok |
| 5 | .agents/skills/fgos-coding-planning/references/verify-sync-and-gap.md (render) | 2 | external-project convention (L12-10); preserve/preserve | ok |
| 6 | .agents/skills/fgos-coding-validating/SKILL.md (render) | 1 | external-project convention (L12-10); preserve/preserve | ok |
| 7 | .agents/skills/fgos-coding-validating/references/gate-auto-approve-mechanics.md (render) | 3 | external-project convention (L12-10); preserve/preserve | ok |
| 8 | core/skills/_shared/capability-catalog.md (source) | 1 | historical reference (L12-10); preserve/preserve | ok |
| 9 | core/skills/_shared/executor-dispatch-fallback.md (source) | 4 | historical reference (L12-10); preserve/preserve | ok |
| 10 | core/skills/_shared/planning-capability-awareness.md (source) | 1 | historical reference (L12-10); preserve/preserve | ok |
| 11 | domains/coding/skills/fgos-coding-planning/SKILL.md (source) | 2 | external-project convention (L12-10); preserve/preserve | ok |
| 12 | domains/coding/skills/fgos-coding-planning/references/verify-sync-and-gap.md (source) | 2 | external-project convention (L12-10); preserve/preserve | ok |
| 13 | domains/coding/skills/fgos-coding-validating/SKILL.md (source) | 1 | external-project convention (L12-10); preserve/preserve | ok |
| 14 | domains/coding/skills/fgos-coding-validating/references/gate-auto-approve-mechanics.md (source) | 3 | external-project convention (L12-10); preserve/preserve | ok |
| 15 | domains/coding/task-specs/shape-plan.md (source) | 1 | external-project convention (L12-10); preserve/preserve | ok |
| 16 | plugins/fgOS/skills/_shared/capability-catalog.md (render) | 1 | historical reference (L12-10); preserve/preserve | ok |
| 17 | plugins/fgOS/skills/_shared/executor-dispatch-fallback.md (render) | 4 | historical reference (L12-10); preserve/preserve | ok |
| 18 | plugins/fgOS/skills/_shared/planning-capability-awareness.md (render) | 1 | historical reference (L12-10); preserve/preserve | ok |
| 19 | plugins/fgOS/skills/fgos-coding-planning/SKILL.md (render) | 2 | external-project convention (L12-10); preserve/preserve | ok |
| 20 | plugins/fgOS/skills/fgos-coding-planning/references/verify-sync-and-gap.md (render) | 2 | external-project convention (L12-10); preserve/preserve | ok |
| 21 | plugins/fgOS/skills/fgos-coding-validating/SKILL.md (render) | 1 | external-project convention (L12-10); preserve/preserve | ok |
| 22 | plugins/fgOS/skills/fgos-coding-validating/references/gate-auto-approve-mechanics.md (render) | 3 | external-project convention (L12-10); preserve/preserve | ok |

## Totals

ok 22, rework 0, needs-Lead-judgment 0.

Notes: the two gate-bypass edges per file share one line (two matches in the same line, both counted); this is faithful to the scanner. Mechanical, not semantic: no tests or fgos CLI were run; static replay of the author's script was not repeated in full.
