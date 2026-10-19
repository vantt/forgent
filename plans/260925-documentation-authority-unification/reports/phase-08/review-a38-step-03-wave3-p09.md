# Wave 3 review, Part 09 (pin ae141550c)

Reviewer: independent read-only. 6 whole files, 18 edges, every edge reviewed. No checker or probe run. Targets read at the pin.

## Per file

| File | Set | Stratum | Edges | Verdict |
|---|---|---|---:|---|
| docs/explanation/footprint-diff-research-md-noise.md | batch-065 | unpatched-seeded | 7 | ok |
| docs/explanation/herdr-orchestrator-terminology-boundary.md | batch-065 | patched-seeded | 5 | ok |
| docs/explanation/mode-gate-tiny-small-skip-load.md | batch-066 | unpatched-seeded | 2 | ok |
| docs/explanation/partial-claim-event-loss-covered-by-tsk-1vc.md | batch-066 | unpatched-seeded | 1 | ok |
| docs/explanation/retro-next-shared-driving.md | batch-066 | unpatched-seeded | 1 | ok |
| docs/explanation/return-approve-background-execution-guidance.md | batch-066 | patched-seeded | 2 | ok |

### footprint-diff-research-md-noise.md (03867-03873)
- 03867, 03868, 03871, 03872, 03873 (docs/history/<feature>/RESEARCH.md, docs/history/<id>/iron-law-evidence.md, directory forms): placeholder patterns under the existing docs/history directory. Preserve is correct.
- 03869: docs/history/data-dictionary-no-stuck-merge-abort-drift/RESEARCH.md exists at the pin. Preserve is correct.
- 03870 (L26 `docs/specs/distribution.md`): this is the footprint the item had at tsk-22b's return, so it is a past-event fact in a dated explanation. Preserve is correct, consistent with the historical-action rule.
- No missed reference. The `.agents/skills/...` path and the `bin/`, `src/` paths are not legacy roots.

### herdr-orchestrator-terminology-boundary.md (03887-03891)
- 03887 (frontmatter `authoritative_for`, `docs/architect`): preserved as an exact-match identity key per L12-21. Accepted as authored.
- 03888 (L21): patch to `docs/platform/agent-coordination/proposals/dispatch-control-plane-redesign.md#51-dispatch-roles`, Phase 9. The target exists at the pin and §5.1 "Dispatch Roles" defines `orchestrator` as "T0 composition layer that manages N units of work and stays attached". That matches the adjacent description and the "§5.1" label. The Herdr-vocabulary subsection the file mentions survives there as §12.1a. Disposition, target and anchor are correct. The diff changes only the path.
- 03889 (L21-23 link to the retained docs/explanation/d0026 file): the target exists and is registry-current. It is in the same list item as 03888 with a different disposition, and the record carries a unitDispositionReason. A retained link is a distinct claim from the retiring path, so I accept the split.
- 03890, 03891 (L49-50, the commit-ba7b62ac move narrative): dated history naming both old paths. Preserve is correct.

### mode-gate-tiny-small-skip-load.md (03907, 03908)
Both are links to docs/explanation files that exist and are current in the registry. Preserve is correct. No other legacy references.

### partial-claim-event-loss-covered-by-tsk-1vc.md (03917)
The link to eventlog-guard-fail-closed-event-count-checkpoint.md is retained, so preserve is correct. No other references.

### retro-next-shared-driving.md (03928)
`docs/explanation/` is a retained directory, so preserve is correct. "Decision `0027` D5" and "stage-status-driving-coordination" are dated design narrative with no path token, so they are not edges.

### return-approve-background-execution-guidance.md (03929, 03930)
- 03929: link to the retained fanout-batch explanation. Preserve is correct.
- 03930: `docs/how-to/write-verify-for-a-skill-prose-change.md` is absent at the pin. The registry maps it as an alias to `docs/knowledge/vi-t-verify-cho-m-t-item-thay-i-skill-prose/write-verify-for-a-skill-prose-change.md`. This is a live pointer to a renamed alias, so patch is the right disposition. The anchor `verify-trông-thế-nào` matches `## Verify trông thế nào` (L26), which holds `npm test && <POSITIVE> && <NEGATIVE>`. The adjacent description ("prescribed shape", `npm test && ...`) is true for the target, and the 224-386 s figure is the item's own measurement.

## Outcome defects
None. 0 of 18 edges need rework.

## Record-text notes (not rework)
- 03930 diff: the original wrapped the path inside one inline-code span across a newline, so it already rendered as a broken path. The patch keeps that layout and lengthens it. Cosmetic only. Phase 9 could re-flow it onto a single line.
- 03870 and 03890/03891 quote long source passages in the reason field. The quotes are accurate.

## Lead-judgment question
- 03891 (`docs/architect/agent-coordination/proposals/dispatch-control-plane-redesign.md`, L50) sits under the heading "Where the doc lives now". The body is a dated move narrative ("later moved ... commit ba7b62ac"), and the same file's L21 mention of the same document is patched to `docs/platform/...`. After Phase 9 the heading "lives now" is false for L50. I read the passage as history and agree with preserve. If the Lead treats the "lives now" heading as a live statement naming a retiring tree (L12-37(4)), 03890/03891 would become a description-rewrite park. I do not count this as rework.

## Counts
- batch-065: patched-seeded 1 file reviewed, 0 rework. Unpatched-seeded 1 file reviewed, 0 rework.
- batch-066: patched-seeded 1 file reviewed, 0 rework. Unpatched-seeded 3 files reviewed, 0 rework.
- Part total: 6 files, 18 edges, 0 rework.

Status: DONE
Summary: All 6 files and 18 edges are ok, with no outcome defects. One Lead-judgment question on the "Where the doc lives now" heading (03891), which I read as history.
