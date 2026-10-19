# Review A38 step-02b census part 13

- Reviewer: reviewer:sonnet-session:a5811c99fecf0e71d@2026-10-19
- Worktree: /home/vantt/projects/forgentX-s8-review, HEAD c801778ac48e78dae45b67a58b7484e87bfcd4a5 (verified detached); author 8606433d6, accounting c801778ac
- Part: plans/260925-documentation-authority-unification/reports/phase-08/step-02b-review-part-13.json, sha256 64486ee1cce109a9b0a75c5b9443f3d4391a11eb6982296c0e8eb724cef2405a, 60 entries
- Method: scripted per-entry checks (file digest, equality with census table row, source digest, generated header source and clean-render equality with source, bareSiblingMentions line/text, priorHistoryEdges consumer, edgeIds set equality, edge span/column exactness, render/source edge-set parity, inventory record equality with export), plus deep reads of source passages below.
- Totals: ok 60, rework 0, needs-Lead-judgment 0

## Deep reads (D column)
Read actual passages/functions for the D rows; also writer/reader edges skills-167,170,174,177,179,181,192,198,199, all 9 inventory reconciliation rows against export and source files; terminal/*.sh and prompt-templates zero-hit scans.

## Cross-cutting
- Zero-edge files scanned for docs/ and CONTEXT/RESEARCH/DISCUSSION mentions; unedged ones are old-inventory non-migration targets (nonexistent docs/how-to, docs/decisions/0026, docs/explanation, docs/enduser-docs-index.json generated manifest) reconciled with explicit statuses, except the deliver docs/journals gap (part 12).
- L12-7/L12-10: history topology preserved (external-project docs/history/<feature> rows are preserve, no alias destinations); no alias entries used.

## Rows
| # | id | class | verdict | deep | note |
|---|---|---|---|---|---|
| 0 | `plugins/fgOS/skills/fgos-coding-knowledge/SKILL.md` | generated assembly; so; edges=1; bare=0 | ok | D | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 1 | `plugins/fgOS/skills/fgos-coding-planning/SKILL.md` | generated assembly; so; edges=0; bare=29 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 2 | `plugins/fgOS/skills/fgos-coding-planning/references/approach-and-shape.md` | generated assembly; so; edges=0; bare=8 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 3 | `plugins/fgOS/skills/fgos-coding-planning/references/bootstrap-and-lane.md` | generated assembly; so; edges=3; bare=13 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 4 | `plugins/fgOS/skills/fgos-coding-planning/references/split-and-child-specs.md` | generated assembly; so; edges=0; bare=5 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 5 | `plugins/fgOS/skills/fgos-coding-planning/references/verify-sync-and-gap.md` | generated assembly; so; edges=0; bare=12 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 6 | `plugins/fgOS/skills/fgos-coding-shaping/SKILL.md` | generated assembly; so; edges=7; bare=22 | ok | D | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 7 | `plugins/fgOS/skills/fgos-coding-validating/SKILL.md` | generated assembly; so; edges=0; bare=14 | ok | D | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 8 | `plugins/fgOS/skills/fgos-coding-validating/references/bootstrap-and-reality-gate.md` | generated assembly; so; edges=1; bare=1 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 9 | `plugins/fgOS/skills/fgos-coding-validating/references/gate-auto-approve-mechanics.md` | generated assembly; so; edges=0; bare=11 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 10 | `plugins/fgOS/skills/fgos-coding-validating/references/gate-tier-a-b-triggers.md` | generated assembly; so; edges=0; bare=3 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 11 | `plugins/fgOS/skills/fgos-fanout/SKILL.md` | generated assembly; so; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 12 | `plugins/fgOS/skills/fgos-fanout/references/wave-dispatch-mechanics.md` | generated assembly; so; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 13 | `plugins/fgOS/skills/fgos-group-thinking/SKILL.md` | generated assembly; so; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 14 | `plugins/fgOS/skills/fgos-indexing/SKILL.md` | generated assembly; so; edges=1; bare=0 | ok | D | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 15 | `plugins/fgOS/skills/fgos-lock-fence/SKILL.md` | generated assembly; so; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 16 | `plugins/fgOS/skills/fgos-researching/SKILL.md` | generated assembly; so; edges=2; bare=4 | ok | D | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 17 | `plugins/fgOS/skills/fgos-routing/SKILL.md` | generated assembly; so; edges=0; bare=2 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 18 | `plugins/fgOS/skills/fgos-run/SKILL.md` | generated assembly; so; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 19 | `plugins/fgOS/skills/goal/SKILL.md` | source (including hand; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 20 | `plugins/fgOS/skills/graph/SKILL.md` | source (including hand; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 21 | `plugins/fgOS/skills/list/SKILL.md` | source (including hand; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 22 | `plugins/fgOS/skills/merge-list/SKILL.md` | source (including hand; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 23 | `plugins/fgOS/skills/merge-loop/SKILL.md` | source (including hand; edges=1; bare=1 | ok | D | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 24 | `plugins/fgOS/skills/merge-loop/references/blocked-pick-decision-tree.md` | source (including hand; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 25 | `plugins/fgOS/skills/merge-next/SKILL.md` | source (including hand; edges=2; bare=2 | ok | D | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 26 | `plugins/fgOS/skills/metrics/SKILL.md` | source (including hand; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 27 | `plugins/fgOS/skills/move/SKILL.md` | source (including hand; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 28 | `plugins/fgOS/skills/pick/SKILL.md` | source (including hand; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 29 | `plugins/fgOS/skills/plan-loop/SKILL.md` | source (including hand; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 30 | `plugins/fgOS/skills/plan-next/SKILL.md` | source (including hand; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 31 | `plugins/fgOS/skills/plan/SKILL.md` | source (including hand; edges=2; bare=3 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 32 | `plugins/fgOS/skills/ready/SKILL.md` | source (including hand; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 33 | `plugins/fgOS/skills/retro-loop/SKILL.md` | source (including hand; edges=2; bare=2 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 34 | `plugins/fgOS/skills/retro-next/SKILL.md` | source (including hand; edges=4; bare=4 | ok | D | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 35 | `plugins/fgOS/skills/return/SKILL.md` | source (including hand; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 36 | `plugins/fgOS/skills/rollup/SKILL.md` | source (including hand; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 37 | `plugins/fgOS/skills/show/SKILL.md` | source (including hand; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 38 | `plugins/fgOS/skills/stale/SKILL.md` | source (including hand; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 39 | `plugins/fgOS/skills/submit/SKILL.md` | source (including hand; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 40 | `plugins/fgOS/skills/terminal-close/SKILL.md` | source (including hand; edges=1; bare=1 | ok | D | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 41 | `plugins/fgOS/skills/terminal-close/close.sh` | source (including hand; edges=1; bare=1 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 42 | `plugins/fgOS/skills/terminal/SKILL.md` | source (including hand; edges=3; bare=2 | ok | D | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 43 | `plugins/fgOS/skills/terminal/pane-owned.sh` | source (including hand; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 44 | `plugins/fgOS/skills/terminal/rename.sh` | source (including hand; edges=3; bare=3 | ok | D | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 45 | `plugins/fgOS/skills/terminal/terminal-port.sh` | source (including hand; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 46 | `plugins/fgOS/skills/triage/SKILL.md` | source (including hand; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 47 | `src/runner/prompt-templates/judge-scout-instructions.txt` | source (including hand; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 48 | `src/runner/prompt-templates/worker-prompt-default.txt` | source (including hand; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 49 | `src/runner/prompt-templates/worker-prompt-discovery.txt` | source (including hand; edges=1; bare=1 | ok | D | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 50 | `src/runner/prompt-templates/worker-prompt-skill-pointer.txt` | source (including hand; edges=1; bare=0 | ok | D | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 51 | `consumer_a67185e11bb7ab6938697d19` | inventory CLAUDE.md -> AGENTS.md; censusEdges=1 | ok | D | record equals export row; current exact occurrences/census join checked against source file |
| 52 | `consumer_e7ca4b5b3fe36a37e89b79e9` | inventory CLAUDE.md -> AGENTS.md; censusEdges=0 | ok | D | record equals export row; current exact occurrences/census join checked against source file |
| 53 | `consumer_e7049f5a2f74bbda362b0fcc` | inventory CLAUDE.md -> AGENTS.md; censusEdges=0 | ok | D | record equals export row; current exact occurrences/census join checked against source file |
| 54 | `consumer_57fc3b8634364f88b78b1dcb` | inventory src/setup/instruction-composition.mjs -> AGENTS.md; censusEdges=0 | ok | D | record equals export row; current exact occurrences/census join checked against source file |
| 55 | `consumer_bb413432cab333fda7900c80` | inventory src/setup/instruction-projections.mjs -> AGENTS.md; censusEdges=0 | ok | D | record equals export row; current exact occurrences/census join checked against source file; note: line 19 constant PORTABLE_AGENTS_DESTINATION is covered by write/read edges instructions-067/069 at the use sites, so non-migration disposition is acceptable |
| 56 | `consumer_1b8b30d08079d2af3ededbd7` | inventory CLAUDE.md -> CLAUDE.md; censusEdges=0 | ok | D | record equals export row; current exact occurrences/census join checked against source file |
| 57 | `consumer_3be76ec45ae87b19a45ea99b` | inventory src/setup/instruction-registry.mjs -> docs/architecture-manifest.json; censusEdges=2 | ok | D | record equals export row; current exact occurrences/census join checked against source file |
| 58 | `consumer_cfe1153f96a898ff4e19a70c` | inventory src/setup/instruction-registry.mjs -> docs/architecture-manifest.json; censusEdges=3 | ok | D | record equals export row; current exact occurrences/census join checked against source file |
| 59 | `consumer_99d9125b3752e30b3be66c6b` | inventory src/setup/instruction-registry.mjs -> docs/architecture-manifest.json; censusEdges=2 | ok |  | record equals export row; current exact occurrences/census join checked against source file |

## Totals
ok 60, rework 0, needs-Lead-judgment 0.
