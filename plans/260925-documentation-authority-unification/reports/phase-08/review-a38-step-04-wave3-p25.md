# Review a38 — Step 4 wave 3, part 25 (set step04-030)

Pin: dc24ce645 (author input), worktree detached at 774adbd01. Read-only; no checker/probe/author scripts run.
Payload step-04-wave3-p25.json holds only the first four final records. The record for executor-dispatch-fallback.md was loaded from step-04-records/step04-030.jsonl (21 edges), because it is not an item in the payload.

## Per file

| File | Stratum | Slots reviewed | Verdict |
|---|---|---|---|
| .claude/skills/ui-spec/SKILL.md | B (headerless local skill, own owner) | 4 preserve | ok |
| .claude/skills/ui-spec/references/CONVENTION.md | B | 1 preserve | ok |
| core/skills/_shared/citation-format.md | A+B | 3 source parked, 7 source preserve, 18 render-join, 2 render-join on the parked decisions slot | ok |
| core/skills/_shared/coding-worker-contract.md | B | 5 source preserve, 10 render-join | ok |
| core/skills/_shared/executor-dispatch-fallback.md | A | 7 source slots (4 preserve, 2 parked, 1 patch) plus 14 render-join | ok |

Total 50 joined slots in the part (payload count); all reviewed. Whole sources read to EOF (ui-spec SKILL 339 lines was checked only at its 4 edge lines plus the `tools` mentions; the other four read whole).

### .claude/skills/ui-spec/SKILL.md (skills-063..066) and references/CONVENTION.md (skills-067)
- skills-063/064/065: `docs/ui-spec` is the skill's default output root. The tree exists (21 files at the pin), so the literal preserve is correct.
- skills-066 (SKILL line 246) and skills-067 (CONVENTION line 173): `docs/ui-spec/tools/` never existed. The source says `init` scaffolds a "tools directory" into the output (SKILL lines 32/39), so this is a literal example in an external-project convention, not a see-pointer (L12-10/49). Preserve is correct and the exception is witnessed.
- No missed references.

### citation-format.md
- Parked skills-070 (line 6, `docs/specs/<area>.md`), skills-078 (line 96, `docs/specs/*.md`) and the author-added slot at line 4 (`docs/decisions/*.md`): passage-content searches are present for all three, with live-holder terms area-scoped and decision-index.
  - I checked the nearest live holders: `docs/platform/decision-citation-drift/spec.md` (R5/R3 still fixes the scan scope as `docs/backlog.md` plus `docs/specs/*.md`), the knowledge entry `why-fgos-citations-carry-a-gloss...` (D1 describes the 3-tier shape but does not carry this passage verbatim), and `docs/history/self-contained-id-references/CONTEXT.md`.
  - None is a moved-verbatim holder of the passage, so park-as-description-rewrite is defensible.
  - Line 96 is arguably still a true description of the checker's current scan roots until Step 5. Parking it is conservative, not wrong, so I raise it as a question below.
- Preserves skills-071..077: `docs/history/<feature>/CONTEXT.md` is a pattern (L12-10). The other five paths exist at the pin: `docs/history/self-contained-id-references/{DISCUSSION,CONTEXT}.md`, `docs/id-systems-audit.md`, `docs/backlog.md`. Correct.
- Render joins: every render slot is on the same text as its source slot, with the header line shifting each line number by 1 (skills-001..009 map to skills-070..078, skills-118..126 map likewise for plugins/). Verified. Render bodies are byte-identical to the source after the header line, for both .agents and plugins.
  - The two decisions-line joins (class4-l-000003, class4-l-002001, render line 5 to source line 4) correctly point at the author-added parked slot, which has no source edge id.
- Step 5 exclusions (class4-l-000007, class4-l-002005: fenced line-35 example) are consistent with the source line-34 preserve.

### coding-worker-contract.md
- All five docs/history references (CONTEXT.md and RESEARCH.md of retained dispatch/pi/claude-named/tsk-5gd histories) exist at the pin, so preserve is correct. Slot skills-079..083 map to render joins skills-010..014 and skills-127..131 at line +1.
- Lines 150-151 and 196 use `.claude/skills/...` and `.agents/skills/...` (not retiring trees). Lines 15/69/91/192 are relative `../_shared/` links and bare `CONTEXT.md`. None is an edge.
- No missed references.

### executor-dispatch-fallback.md
- Line 292 patch: the old `docs/how-to/wire-a-skills-classify-step-through-an-agent-executor-executor.md` is absent at the pin (dead link). The target `docs/knowledge/how-to-wire-an-existing-skill-s-inline-reasoning-step-throug/wire-a-skills-classify-step-through-an-agent-executor-executor.md` exists and has the same basename.
  - It was moved by 47703ebf0 and still has the "Steps" section whose steps 1-3 are the config-entry/registration steps the bullet describes. The adjacent description stays true.
  - Hunk `@@ -289,7 +289,7 @@` replaces exactly line 292, and its 3+3 context lines match the pinned source. Backtick and absolute repo-path form are kept. timing is Phase 9, and there is no anchor, which is right for a file-level pointer.
  - Render joins for the patch slot are class4-l-000023 and class4-l-002021, at line 293, with a join label and no diff of their own.
- Line 224 source slot (`docs/history/two-layer-dispatch/DISCUSSION.md` D12): preserve. The file exists. It is a named history reference (L12-10), and the record marks it as a missing-source-slot repair. Render joins are at line 225 (class4-l-000021, class4-l-002019). Lines 12, 33 and 151 are likewise preserved, and their joins are at 13, 34 and 152.
- Parked decision 0026 (lines 239-240, a multi-line backticked path wrapped across a line break, and line 311): `docs/decisions/` has only index.md at the pin, so this is a dead link. The successor notes point to `docs/platform/runner/decisions/h-36d872fbb0e5.md`. The file exists, and `### 0026 — Native-First Dispatch Doctrine: launcher/rootTask/capacity` sits at line 583 of it.
  - Line 695 of the same file carries the "Lớp còn thiếu" subsection that the line-239 passage names. The anchor slug `#0026-native-first-dispatch-doctrine-launcherroottaskcapacity` matches the heading. Notes are non-executable.
  - Passage-content witnesses are present for both. The parked records carry no target or patch, which is correct. Render joins class4-l-000022/000024 and 002020/002022 (240-241 and 312) correspond to the source spans 239-240 and 311.
- Render bodies are identical to the source after the header line, in both trees. 7 source edges and 14 render joins add up to the 21 edges in the record.
- Step 5 exclusions (history-002..005, 016..019, 031..034) duplicate the preserved history slots at the same spans. That is consistent, not a conflict.
- Other path tokens (`scripts/write-wrapper-script.mjs`, `src/...`, `./capability-catalog.md` and similar) are not retiring-tree edges. `AGENTS.md` is a bare root filename and not an edge.

## Defects
OUTCOME defects: none.

Record-text notes (not rework):
- The source-edge `reason` and `blockedReason` strings in citation-format parks repeat the prefix "A51, ...: L12-62: A51, ..." (doubled citation). Cosmetic.
- The five executor-dispatch-fallback source slots and the citation-format line-4 slot are supplemental (edgeId null). Their render joins carry class4-l-* ids, and the join mapping works through the spans. Intentional per the record, noted for the Lead's accounting.

Lead-judgment questions:
- citation-format line 96 (`docs/backlog.md`, `docs/specs/*.md` as the checker scan roots): the statement is true of the checker at the pin, and the holder spec still fixes that scan scope, so one could preserve it. The park is a conservative choice. Confirm you accept it under the L12-62 description-rewrite basis (checker-root parity is Step 5). I do not count it as a defect.

## Counts
- Set step04-030, this part: 5 files reviewed, 0 rework (A: 2 files incl. citation-format, 0 rework; B: 4 files, 0 rework).
- Slots: 50 joined slots reviewed (preserve 21, parked 5, patch 1 on source side; render-join 41 listed against those).
