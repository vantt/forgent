# Review A38 step-02b census part 12

- Reviewer: reviewer:sonnet-session:a5811c99fecf0e71d@2026-10-19
- Worktree: /home/vantt/projects/forgentX-s8-review, HEAD c801778ac48e78dae45b67a58b7484e87bfcd4a5 (verified detached); author 8606433d6, accounting c801778ac
- Part: plans/260925-documentation-authority-unification/reports/phase-08/step-02b-review-part-12.json, sha256 a45b091645c7b09c99b9377c0d65903759071698f2df9556212fce94c9965306, 60 entries
- Method: scripted per-entry checks (file digest, equality with census table row, source digest, generated header source and clean-render equality with source, bareSiblingMentions line/text, priorHistoryEdges consumer, edgeIds set equality, edge span/column exactness, render/source edge-set parity, inventory record equality with export), plus deep reads of source passages below.
- Totals: ok 58, rework 1, needs-Lead-judgment 1

## Deep reads (D column)
Read actual passages/functions for the D rows; also writer/reader edges skills-117,119,132,134,139,142,152; citation-format sources; generated-render parity (all plugin renders have identical edge sets to their sources); deliver cook-successor trace.

## Cross-cutting
- Zero-edge files scanned for docs/ and CONTEXT/RESEARCH/DISCUSSION mentions; unedged ones are old-inventory non-migration targets (nonexistent docs/how-to, docs/decisions/0026, docs/explanation, docs/enduser-docs-index.json generated manifest) reconciled with explicit statuses, except the deliver docs/journals gap (part 12).
- L12-7/L12-10: history topology preserved (external-project docs/history/<feature> rows are preserve, no alias destinations); no alias entries used.

## Rows
| # | id | class | verdict | deep | note |
|---|---|---|---|---|---|
| 0 | `domains/coding/skills/fgos-coding-validating/SKILL.md` | source (including hand; edges=0; bare=14 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 1 | `domains/coding/skills/fgos-coding-validating/references/bootstrap-and-reality-gate.md` | source (including hand; edges=1; bare=1 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 2 | `domains/coding/skills/fgos-coding-validating/references/gate-auto-approve-mechanics.md` | source (including hand; edges=0; bare=11 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 3 | `domains/coding/skills/fgos-coding-validating/references/gate-tier-a-b-triggers.md` | source (including hand; edges=0; bare=3 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 4 | `domains/coding/task-specs/answer-question.md` | source (including hand; edges=0; bare=1 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 5 | `domains/coding/task-specs/approve-merge.md` | source (including hand; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 6 | `domains/coding/task-specs/compound-learn.md` | source (including hand; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 7 | `domains/coding/task-specs/fix-verify-red.md` | source (including hand; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 8 | `domains/coding/task-specs/implement-item.md` | source (including hand; edges=0; bare=2 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 9 | `domains/coding/task-specs/judge-ambiguity.md` | source (including hand; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 10 | `domains/coding/task-specs/lock-decisions.md` | source (including hand; edges=1; bare=2 | ok | D | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 11 | `domains/coding/task-specs/resolve-question.md` | source (including hand; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 12 | `domains/coding/task-specs/review-item.md` | source (including hand; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 13 | `domains/coding/task-specs/scoped-subtask.md` | source (including hand; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 14 | `domains/coding/task-specs/scout-blast-radius.md` | source (including hand; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 15 | `domains/coding/task-specs/shape-plan.md` | source (including hand; edges=0; bare=4 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 16 | `domains/coding/task-specs/validate-plan.md` | source (including hand; edges=0; bare=2 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 17 | `plugins/fgOS/skills/_shared/capability-catalog.md` | generated assembly; so; edges=0; bare=1 | ok | D | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 18 | `plugins/fgOS/skills/_shared/capability-matching.md` | generated assembly; so; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 19 | `plugins/fgOS/skills/_shared/catchup-self-recovery.md` | generated assembly; so; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 20 | `plugins/fgOS/skills/_shared/citation-format.md` | generated assembly; so; edges=9; bare=9 | needs-Lead-judgment | D | portable citation-format: cutoverPatch carries non-literal/glob "new" values (the explicit area owner from docs/reading-map.md; docs/platform/**/spec.md) while parkedReason says no universal path substitution approved and no blocked status is recorded, so the replay guard (blocked => no executable new) does not protect it. Lead should mark the patches candidate-only/blocked or settle the external-project convention. |
| 21 | `plugins/fgOS/skills/_shared/coding-cell-policy.md` | generated assembly; so; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 22 | `plugins/fgOS/skills/_shared/coding-worker-contract.md` | generated assembly; so; edges=5; bare=7 | ok | D | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 23 | `plugins/fgOS/skills/_shared/coordination-driver.md` | generated assembly; so; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 24 | `plugins/fgOS/skills/_shared/decision-question.md` | generated assembly; so; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 25 | `plugins/fgOS/skills/_shared/executor-dispatch-fallback.md` | generated assembly; so; edges=0; bare=4 | ok | D | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 26 | `plugins/fgOS/skills/_shared/fgos-cli-fallback.md` | generated assembly; so; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 27 | `plugins/fgOS/skills/_shared/planning-capability-awareness.md` | generated assembly; so; edges=0; bare=1 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 28 | `plugins/fgOS/skills/_shared/private-cell-worktree.md` | generated assembly; so; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 29 | `plugins/fgOS/skills/answer/SKILL.md` | source (including hand; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 30 | `plugins/fgOS/skills/approve/SKILL.md` | source (including hand; edges=1; bare=0 | ok | D | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 31 | `plugins/fgOS/skills/ask/SKILL.md` | source (including hand; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 32 | `plugins/fgOS/skills/cleanup-loop/SKILL.md` | source (including hand; edges=2; bare=2 | ok | D | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 33 | `plugins/fgOS/skills/cleanup-next/SKILL.md` | source (including hand; edges=2; bare=2 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 34 | `plugins/fgOS/skills/coding-shape-distill/SKILL.md` | source (including hand; edges=1; bare=3 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 35 | `plugins/fgOS/skills/coding-shape/SKILL.md` | source (including hand; edges=2; bare=3 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 36 | `plugins/fgOS/skills/conflicts/SKILL.md` | source (including hand; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 37 | `plugins/fgOS/skills/deliver/SKILL.md` | source (including hand; edges=3; bare=8 | rework | D | Current deliver SKILL.md lines 82-83 cite `docs/journals/260803-1612-main-checkout-direct-branch-checkout-tsk-4hk.md` (wrapped across two lines; tracked file exists; old inventory edge consumer_6bab899e83f64eeff3178575 targets it). The occurrence is not an edge, not in bareSiblingMentions (line 89-90 wrapped history path is), and the cook historical disposition lists successorEdges skills-140..142 only. Add the wrapped-path edge (historical-provenance, preserve, desired owner = the journal path / journal split per plan 7.6) and fix the reconciliation row currentExactTargetOccurrences/successorEdges. |
| 38 | `plugins/fgOS/skills/discover-loop/SKILL.md` | source (including hand; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 39 | `plugins/fgOS/skills/discover-next/SKILL.md` | source (including hand; edges=1; bare=1 | ok | D | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 40 | `plugins/fgOS/skills/discover/SKILL.md` | source (including hand; edges=4; bare=6 | ok | D | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 41 | `plugins/fgOS/skills/fgos-advise/SKILL.md` | generated assembly; so; edges=0; bare=0 | ok | D | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 42 | `plugins/fgOS/skills/fgos-advise/references/request-kinds-and-routes.md` | generated assembly; so; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 43 | `plugins/fgOS/skills/fgos-architecture-panel/SKILL.md` | generated assembly; so; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 44 | `plugins/fgOS/skills/fgos-clarifying/SKILL.md` | generated assembly; so; edges=1; bare=1 | ok | D | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 45 | `plugins/fgOS/skills/fgos-coding-discovering/SKILL.md` | generated assembly; so; edges=4; bare=4 | ok | D | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 46 | `plugins/fgOS/skills/fgos-coding-driving/SKILL.md` | generated assembly; so; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 47 | `plugins/fgOS/skills/fgos-coding-driving/references/caller-contract.md` | generated assembly; so; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 48 | `plugins/fgOS/skills/fgos-coding-driving/references/loop-mechanics.md` | generated assembly; so; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 49 | `plugins/fgOS/skills/fgos-coding-driving/references/reclaim-and-role-graph.md` | generated assembly; so; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 50 | `plugins/fgOS/skills/fgos-coding-exploring/SKILL.md` | generated assembly; so; edges=3; bare=12 | ok | D | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 51 | `plugins/fgOS/skills/fgos-coding-exploring/references/gate-mechanics.md` | generated assembly; so; edges=2; bare=6 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 52 | `plugins/fgOS/skills/fgos-coding-exploring/references/lock-decisions-and-write-context.md` | generated assembly; so; edges=2; bare=8 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 53 | `plugins/fgOS/skills/fgos-coding-exploring/references/re-entry-from-planning.md` | generated assembly; so; edges=0; bare=5 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 54 | `plugins/fgOS/skills/fgos-coding-exploring/references/scope-and-reclaim.md` | generated assembly; so; edges=0; bare=2 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 55 | `plugins/fgOS/skills/fgos-coding-implement/SKILL.md` | generated assembly; so; edges=2; bare=1 | ok | D | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 56 | `plugins/fgOS/skills/fgos-coding-implement/references/implement-and-collaboration.md` | generated assembly; so; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 57 | `plugins/fgOS/skills/fgos-coding-implement/references/return-mechanics.md` | generated assembly; so; edges=0; bare=0 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 58 | `plugins/fgOS/skills/fgos-coding-implement/references/verify-commit-and-iron-law.md` | generated assembly; so; edges=1; bare=1 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |
| 59 | `plugins/fgOS/skills/fgos-coding-implement/references/worker-contract-and-orient.md` | generated assembly; so; edges=1; bare=2 | ok |  | digest, source/render map, bare-mention lines, edge ids, spans verified mechanically |

## Totals
ok 58, rework 1, needs-Lead-judgment 1.
