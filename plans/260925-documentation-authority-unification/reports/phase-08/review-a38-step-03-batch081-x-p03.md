# Review a38 step-03 batch081 x-p03

## File 1
- path: docs/knowledge/why-the-locked-decisions-heading-contract-between-plan-mjs-s/decision-record.md
- set: batch-081, stratum: patched (L12-49 expansion)
- record: step-03-records/batch-081.jsonl, 9 edges (maps-j-05030..05038), pin ae141550c. Not retiresWithTree.
- verdict: ok. Read the whole source (170 lines) and the complete diff (2 hunks).

## Edges (all 9 reviewed)
- 05030 L26 `docs/history/**/CONTEXT.md`: preserve. It is a glob and the sentence reports a scan result (evidence). ok.
- 05031 L29 docs/history/gate-approve-vs-movenext-semantics/CONTEXT.md: preserve. The path exists at the pin and the sentence is a measurement finding. ok.
- 05032 L35 docs/explanation/gate-bypass-design.md: patch, Phase 9, to docs/knowledge/why-gate-bypass-is-shaped-the-way-it-is/gate-bypass-design.md#a-mechanical-check-is-only-as-live-as-the-artifact-it-reads-tsk-5hg. The old path is absent at the pin. The target exists, and its heading "A mechanical check is only as live as the artifact it reads (tsk-5hg)" slugs exactly to the anchor. The tsk-5hg account is the sentence's subject, so the target is right. The diff hunk @@ -32 changes only that path. ok.
- 05033 L77 docs/history/tsk-1ia/CONTEXT.md: preserve. It exists and is cited as evidence of a real heading variant. ok.
- 05034 L79-80 docs/history/gate-approve-vs-movenext-semantics/\n CONTEXT.md: preserve. It exists. The span across the line break is handled and the evidence role is right. ok.
- 05035 L102 docs/explanation/gate-bypass-design.md: patch, same target and anchor. The lesson cited (writer convention checked separately from reader logic) is the one that section covers. The hunk @@ -99 changes only that path. ok.
- 05036 L132-133 docs/history/\ngate-approve-.../CONTEXT.md:164: preserve. It exists and cites a real heading found by the audit (evidence). ok.
- 05037 L152 docs/history/tsk-3xog/: preserve. The directory exists at the pin (plan.md) and this is a Source provenance line. ok.
- 05038 L154-155 docs/history/tsk-zl5-post-merge-audit/\nREVIEW.md: preserve. It exists and is Source provenance. ok.

## Outcome defects
None.

## Missed references
None. The other paths in the file (src/intake/plan.mjs, .agents/skills/fgos-coding-exploring/SKILL.md, test/scripts/check-decision-citation-drift.test.mjs, test/skills/fgos-mirror.test.mjs, scripts/check-locked-decisions-heading-drift.mjs) are not retiring-doc paths. The four I checked exist at the pin. I did not check the scripts/ path, which is code and out of scope for doc edges. The file contains no decision-id or docs/specs references.

## Record-text notes (not rework)
- 05030's reason says "no literal placeholder file is asserted" and also quotes the source role. This is fine.
- 05036's reason quotes "actual source role" cut off mid-sentence in my 800-character print. That is my truncation, not the record's.

## Lead-judgment questions
None.

## Counts
- Part p03: 1 file reviewed, 0 rework, 9 edges.
- Set batch-081, patched stratum, this part's contribution: reviewed 1, rework 0.
- No overlap with wave5a files (this file was not in wave5a).
