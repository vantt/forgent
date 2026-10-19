# Review A38 step-02b census part 11

- Reviewer: reviewer:sonnet-session:a5811c99fecf0e71d@2026-10-19
- Worktree: /home/vantt/projects/forgentX-s8-review, HEAD c801778ac48e78dae45b67a58b7484e87bfcd4a5 (verified detached); author 8606433d6, accounting c801778ac
- Part: plans/260925-documentation-authority-unification/reports/phase-08/step-02b-review-part-11.json, sha256 55a8d40a9dd6c0886436175bd704ca0c9f1f7db4d8a3663787357e757b17fd77, 60 entries
- Method: scripted per-entry checks (file digest, equality with census table row, source digest, generated header source and clean-render equality with source, bareSiblingMentions line/text, priorHistoryEdges consumer, edgeIds set equality, edge span/column exactness, render/source edge-set parity, inventory record equality with export), plus deep reads of source passages below.
- Totals: ok 60, rework 0, needs-Lead-judgment 0

## Deep reads (D column)
Read actual passages/functions for the D rows; also distill.mjs (every fs write/path.join use; edges cover writeAtomic l.41, init mkdir/write l.244-258, source write l.283, move l.361, porting log l.464-645, state l.587), instruction-audit.mjs (HOME/ROOT/settings/rules/walk constructions), and RUL45 target (runner spec unheaded-block-6 exists via anchorExists, RUL45 text at l.78). Targets of skills-105/121/192 exist; skills-084/112 parked correctly.

## Cross-cutting
- Zero-edge files scanned for docs/ and CONTEXT/RESEARCH/DISCUSSION mentions; unedged ones are old-inventory non-migration targets (nonexistent docs/how-to, docs/decisions/0026, docs/explanation, docs/enduser-docs-index.json generated manifest) reconciled with explicit statuses, except the deliver docs/journals gap (part 12).
- L12-7/L12-10: history topology preserved (external-project docs/history/<feature> rows are preserve, no alias destinations); no alias entries used.

## Rows
| # | id | class | verdict | deep | note |
|---|---|---|---|---|---|
| 0 | `core/skills/_shared/coding-worker-contract.md` | source (including hand; edges=5; bare=7 | ok | D | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 1 | `core/skills/_shared/coordination-driver.md` | source (including hand; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 2 | `core/skills/_shared/decision-question.md` | source (including hand; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 3 | `core/skills/_shared/executor-dispatch-fallback.md` | source (including hand; edges=0; bare=4 | ok | D | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 4 | `core/skills/_shared/fgos-cli-fallback.md` | source (including hand; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 5 | `core/skills/_shared/planning-capability-awareness.md` | source (including hand; edges=0; bare=1 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 6 | `core/skills/_shared/private-cell-worktree.md` | source (including hand; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 7 | `core/skills/distill/CREATION-LOG.md` | source (including hand; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 8 | `core/skills/distill/SKILL.md` | source (including hand; edges=0; bare=0 | ok | D | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 9 | `core/skills/distill/references/consult-protocol.md` | source (including hand; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 10 | `core/skills/distill/references/deep-dive-protocol.md` | source (including hand; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 11 | `core/skills/distill/references/extract-rules.md` | source (including hand; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 12 | `core/skills/distill/scripts/distill.mjs` | source (including hand; edges=34; bare=0 | ok | D | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 13 | `core/skills/distill/scripts/migrate-porting-state-backfill.mjs` | source (including hand; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 14 | `core/skills/fgos-advise/SKILL.md` | source (including hand; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 15 | `core/skills/fgos-advise/references/request-kinds-and-routes.md` | source (including hand; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 16 | `core/skills/fgos-architecture-panel/SKILL.md` | source (including hand; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 17 | `core/skills/fgos-clarifying/SKILL.md` | source (including hand; edges=1; bare=1 | ok | D | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 18 | `core/skills/fgos-fanout/SKILL.md` | source (including hand; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 19 | `core/skills/fgos-fanout/references/wave-dispatch-mechanics.md` | source (including hand; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 20 | `core/skills/fgos-group-thinking/SKILL.md` | source (including hand; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 21 | `core/skills/fgos-indexing/SKILL.md` | source (including hand; edges=1; bare=0 | ok | D | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 22 | `core/skills/fgos-lock-fence/SKILL.md` | source (including hand; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 23 | `core/skills/fgos-researching/SKILL.md` | source (including hand; edges=2; bare=4 | ok | D | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 24 | `core/skills/fgos-routing/SKILL.md` | source (including hand; edges=0; bare=2 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 25 | `core/skills/fgos-run/SKILL.md` | source (including hand; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 26 | `core/skills/instruction-audit/SKILL.md` | source (including hand; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 27 | `core/skills/instruction-audit/references/lane-prompts.md` | source (including hand; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 28 | `core/skills/instruction-audit/references/report-template.md` | source (including hand; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 29 | `core/skills/instruction-audit/scripts/instruction-audit.mjs` | source (including hand; edges=12; bare=0 | ok | D | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 30 | `core/task-specs/distill.md` | source (including hand; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 31 | `core/task-specs/fgos-clarifying.md` | source (including hand; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 32 | `core/task-specs/fgos-fanout.md` | source (including hand; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 33 | `core/task-specs/fgos-indexing.md` | source (including hand; edges=1; bare=0 | ok | D | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 34 | `core/task-specs/fgos-lock-fence.md` | source (including hand; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 35 | `core/task-specs/fgos-researching.md` | source (including hand; edges=1; bare=3 | ok | D | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 36 | `core/task-specs/fgos-routing.md` | source (including hand; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 37 | `domains/coding/skills/_shared/coding-cell-policy.md` | source (including hand; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 38 | `domains/coding/skills/fgos-coding-discovering/SKILL.md` | source (including hand; edges=4; bare=4 | ok | D | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 39 | `domains/coding/skills/fgos-coding-driving/SKILL.md` | source (including hand; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 40 | `domains/coding/skills/fgos-coding-driving/references/caller-contract.md` | source (including hand; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 41 | `domains/coding/skills/fgos-coding-driving/references/loop-mechanics.md` | source (including hand; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 42 | `domains/coding/skills/fgos-coding-driving/references/reclaim-and-role-graph.md` | source (including hand; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 43 | `domains/coding/skills/fgos-coding-exploring/SKILL.md` | source (including hand; edges=3; bare=12 | ok | D | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 44 | `domains/coding/skills/fgos-coding-exploring/references/gate-mechanics.md` | source (including hand; edges=2; bare=6 | ok | D | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 45 | `domains/coding/skills/fgos-coding-exploring/references/lock-decisions-and-write-context.md` | source (including hand; edges=2; bare=8 | ok | D | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 46 | `domains/coding/skills/fgos-coding-exploring/references/re-entry-from-planning.md` | source (including hand; edges=0; bare=5 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 47 | `domains/coding/skills/fgos-coding-exploring/references/scope-and-reclaim.md` | source (including hand; edges=0; bare=2 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 48 | `domains/coding/skills/fgos-coding-implement/SKILL.md` | source (including hand; edges=2; bare=1 | ok | D | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 49 | `domains/coding/skills/fgos-coding-implement/references/implement-and-collaboration.md` | source (including hand; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 50 | `domains/coding/skills/fgos-coding-implement/references/return-mechanics.md` | source (including hand; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 51 | `domains/coding/skills/fgos-coding-implement/references/verify-commit-and-iron-law.md` | source (including hand; edges=1; bare=1 | ok | D | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 52 | `domains/coding/skills/fgos-coding-implement/references/worker-contract-and-orient.md` | source (including hand; edges=1; bare=2 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 53 | `domains/coding/skills/fgos-coding-knowledge/SKILL.md` | source (including hand; edges=1; bare=0 | ok | D | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 54 | `domains/coding/skills/fgos-coding-planning/SKILL.md` | source (including hand; edges=0; bare=29 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 55 | `domains/coding/skills/fgos-coding-planning/references/approach-and-shape.md` | source (including hand; edges=0; bare=8 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 56 | `domains/coding/skills/fgos-coding-planning/references/bootstrap-and-lane.md` | source (including hand; edges=3; bare=13 | ok | D | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 57 | `domains/coding/skills/fgos-coding-planning/references/split-and-child-specs.md` | source (including hand; edges=0; bare=5 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 58 | `domains/coding/skills/fgos-coding-planning/references/verify-sync-and-gap.md` | source (including hand; edges=0; bare=12 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 59 | `domains/coding/skills/fgos-coding-shaping/SKILL.md` | source (including hand; edges=7; bare=22 | ok | D | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |

## Totals
ok 60, rework 0, needs-Lead-judgment 0.
