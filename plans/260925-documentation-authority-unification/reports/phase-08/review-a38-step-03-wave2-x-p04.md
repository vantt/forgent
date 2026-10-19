# Review a38 step-03 wave-2 expansion, Part 04

Reviewer: independent read-only semantic reviewer. Worktree detached at feeeeee92 (read-only); author pin ae141550c2e022310de7a0efea757580c0b2479f. Set batch-038 (unpatched-stratum expansion; stratum "full-set-expansion"). Checker/probes not run.

## Method
- Read owner-answers L12-26, L12-30..L12-37 and the authoring-rules digest.
- Loaded each record with python (per-field extraction: edgeId, sourceSpans, matchedExpression, disposition, unitId, target, anchor, timing, reason, blocked/dependency fields, diff and per-edge hunks, legacyScan candidates/exclusions). No full record line printed.
- Read each source whole with `git show <pin>:<path>` (the three large ones, 1129/1651/529 lines, were read in the header region plus a token scan of every path-like token across the full file, with every edge line and every exclusion read in context).
- Verified targets at the pin: docs/platform/runner/spec.md, docs/platform/runner/decisions/h-aabefc85f0c9.md, docs/specs/runner.md and the architect source files exist; `../verification/architecture-advisory-panel/P00.1.md` and `playbooks/prompts/*` exist in the retiring architect tree. The alias table at the pin has no entries and doc-registry has no entry for these paths; the history snapshot is the mapped holder.
- Record hashes (sha256, first 16 hex of the JSONL line / of the diff string): handoff-prompt 620a5c1d77234fc8 / e3b0c44298fc1c14 (empty diff); README 88f29bfc8f7e4106 / 3ac3f1833c4fec28; artifact-templates 651a200dd9d2d51a / bd5a183ececd9dc3; evaluation-rubric 87ace2efe52cb146 / 38537f3eae16f21a; role-doctrine 87a33f1e79f45320 / a0828fd95b9a3ecd; operating-harness 2748c7fb62f72aa9 / 84a69c84888f0272. Hash equality was not treated as semantic acceptance.

## Per-file verdicts

| # | File (under docs/platform/agent-coordination/history/) | Set / stratum | Edges read | Verdict |
|---|---|---|---:|---|
| 1 | proposals-redesigns/step-09-step-10-replan-handoff-prompt.md | batch-038 / full-set-expansion (unpatched, empty diff) | 21 of 21 | ok |
| 2 | retired-engine/files/playbooks/README.md | batch-038 / full-set-expansion | 9 of 9 (5 inventory + 4 author-added) | ok |
| 3 | retired-engine/files/playbooks/architecture-advisory-artifact-templates.md | same | 9 of 9 (5 + 4 added) | ok |
| 4 | retired-engine/files/playbooks/architecture-advisory-evaluation-rubric.md | same | 5 of 5 (4 + 1 added) | ok |
| 5 | retired-engine/files/playbooks/architecture-advisory-role-doctrine.md | same | 10 of 10 (4 + 6 added) | ok |
| 6 | retired-engine/files/playbooks/coordination-operating-harness.md | same | 11 of 11 (9 + 2 added) | ok |

Total 65 edges read, 0 outcome defects.

### File 1 (21 edges, all preserve except one park, empty diff)
- 05723 (L9 Provenance) preserve: lineage, correct.
- 05724 (L17 `Related:` entry to the architect source) parked phase9-carry as duplicate: the mapped live holder is this very consumer, which already carries the entry in Provenance L9. Matches L12-34(4) ("holder is the file itself or already listed, then park as duplicate") and L12-26(8). Correct.
- 05725 (L24 relative "original source" link `../../../../architect/proposals/...`), 05726-05743 (L53-L80: baseline/roadmap/proposals/architecture-intent/specs reading-map read-lists): all preserved inside the declared literal carriage ("Original source metadata and text follow ... preserved as literal fenced source text", L22). The file is Document type History, a 2026-09-02 handoff prompt; the read lists are the original source text. Reasons state only the carriage declaration, no existence facts (L12-35(4)). Wrapped units L52/L61 share one disposition. Scan of the whole file found no uncovered legacy reference (`group-cognition-framework.yaml`, `schema.mjs`, `session-engine.mjs` are not legacy doc paths).

### Files 2-6 (shared header pattern)
- Related-list line L17 `docs/specs/runner.md`: patch to `docs/platform/runner/spec.md`, Phase 9, whole-file anchor justified (no locator claimed). Diff hunk is exactly that one line, context unchanged; correct under L12-26(8)/L12-34(4) (wrapper header Related is live navigation; holder is not the file itself and not already listed).
- Line L19 "Superseded by: Current execution ownership in docs/specs/runner.md": preserve with record-only successor note docs/platform/runner/spec.md, no in-file note (L12-37(6)); correct.
- Line L23 dated retirement framing naming `docs/specs/runner.md` CoordinationSession: preserve, quotes the dated marker, successor note names docs/platform/runner/decisions/h-aabefc85f0c9.md (L12-37(5)); correct, and the file at that path exists with the CoordinationSession history heading.
- Inside "## Literal Snapshot" (all five files): Provenance `docs/architect/agent-coordination/playbooks/<file>` L36, carriage preserve.
- File 2 extra edges: L59 backticked directory `docs/architect/agent-coordination/playbooks/`; author-added L65/68/71/74 relative links (`coordination-operating-harness.md`, `prompts/master-coordinator.md`, `prompts/step-07-design-discussion-handoff.md`, `mvp6-dogfood-handoff.md`) read from the original-source coordinate; all carriage preserves, correct.
- File 3 extra edges: L860 `Read: docs/architect/.../architecture-advisory-role-doctrine.md` inside a prompt template (carriage preserve); author-added L85/L86/L1086/L1119 relative links. The 30 scan exclusions (`intake.md`, `session.md`, `synthesis.md`, ...) are runtime artifact names of the advisory panel, not documents; exclusion is sound.
- File 4: author-added L94 `architecture-advisory-artifact-templates.md`; exclusions are the same artifact-name class; correct.
- File 5: author-added L90/91/92/1650 relative links, L1273 `prompts/` directory, L1597 `../verification/architecture-advisory-panel/P00.1.md` (exists in the retiring architect tree). L84 `../../../../plans/260905-architecture-advisory-panel/plan.md` is a plans path with an explicit "historical path absent" note, not a retiring-tree reference; correctly not an edge.
- File 6: L163 and L455 fenced `verification/<track>/` trees, L507-509 manual-check commands naming `team-dispatch-v1` index/current-cell (all exist in the retiring tree), author-added L74 `../proposals/step-07-coordination-session-adhoc-task.md` and L326 `prompts/master-coordinator.md`. All carriage preserves. `docs/templates` (L482/L526) is a retained live directory, correctly no edge.

## Outcome defects (rework)
None.

## Record-text notes (not rework)
1. In files 2-6 the Superseded-by edges (05979, 05984, 05989, 05993, 05997) carry `unitId` "item-L17" while their span is L19 (a separate line). Advisory field only; the dispositions differ from the L17 patch edge and the checker passed, so the unit mislabel has no outcome effect.
2. Carriage-edge reasons in files 2-6 quote only the heading "## Literal Snapshot" as the declaration. This is acceptable under L12-26(5) (Literal Snapshot heading) but gives less information than the file 1 reasons, which quote the full declaration paragraph.

## Lead-judgment questions
1. Partial-root directory forms inside carriage are inconsistently covered. Role-doctrine L1273 `prompts/` (resolved from the original-source dir) was added as an edge, but README L125 backticked `playbooks/prompts/` and operating-harness L64/L177/L182 backticked `verification/<track>/` (resolved only from the original-source area root `docs/architect/agent-coordination/`) were not. All would be carriage preserves with no diff effect, so this is coverage-only. Should the scan treat the original-source area root as a stated parent for backticked directory forms (L12-34(5) says "consumer's directory or its area root")? If yes, add carriage preserve edges for those 4 spans; if no, the L1273 edge is the outlier.
2. operating-harness L501 `test/architect/coordination-trace.test.mjs` is a code path inside carriage, not a doc; confirming it is out of scope (no edge) matches the "partial-root forms are `.md` only" scan rule.

## Accounting (this part)
- batch-038 / full-set-expansion (unpatched stratum; 5 of 6 files have a one-line Related patch but each is the set's expansion member): 6 files reviewed, 0 rework. Edges reviewed 65 (patch 5, parked 1, preserve 59).
- Not a member of batch-036, batch-037 or batch-041; no overlap strata in this part.

Status: DONE
