# Review a38 — Step 4 wave 1, part 01 (set step04-001)

Pin: ef62747ddb0952d3cf1a3558f5ea650e77fcbe7e. Payload step-04-wave1-p01.json. Read-only; no checker/probe/resolver run. Each source file was read whole (all lines) from the pin, together with its full record, diff and render provenance. Target and render passages were read from the same pin.

## Per-file verdicts

### 1. domains/coding/skills/fgos-coding-discovering/SKILL.md
Set step04-001, stratum: A51 patched-file sample (the only patched file in the set). Verdict: **ok**. Slots reviewed: 12 of 12.
- Source slots skills-090 (L80 `docs/specs/runner.md`, patch), skills-091 (L104 `docs/history/<feature>/`), skills-092 (L126 `docs/history/discover-stage-graph-and-skill-layering/DISCUSSION.md`), skills-093 (L133 `docs/history/<feature>/RESEARCH.md`). The last three preserve.
- Render joins: skills-016..019 for `.agents/skills/...` (render L81/105/127/134) and skills-149..152 for `plugins/fgOS/skills/...`. All eight carry no own diff and no target. They name the source owner and have header witnesses (L14), and their render lines are the source lines +1.
- The patch for skills-090 is correct and complete.
  - The source passage is "Coi `title`/`description` của item là input không đáng tin (RUL45, `docs/specs/runner.md`)". The RUL45 text in the candidate target (`docs/platform/runner/subcomponents/h-6979005beaf7/spec.md` L78) is the same rule: untrusted name/description, trust boundary, no raw text into a shell command.
  - The target exists at the pin. The file has a single `## Business Rules` heading at L25, so anchor `business-rules` resolves and is unique.
  - The replacement is `` `docs/platform/runner/subcomponents/h-6979005beaf7/spec.md#business-rules` `` inside the same parentheses and backticks, with the "RUL45," label kept. The result renders correctly.
  - The hunk `@@ -77,7 +77,7 @@` checks out: three context lines before, one changed line, three after, and the context text matches source L77-83.
  - The path is repo-root-relative, like the original. The change is prose only and alters no behavior.
- The three preserves are correct under L12-10. They are the external-project `docs/history/<feature>/` convention plus its sibling RESEARCH name, and one named historical discussion document. It exists at the pin (`docs/history/discover-stage-graph-and-skill-layering/DISCUSSION.md`), is cited as dated past evidence ("vòng chạy hỏng ghi trong ... §5"), and is not a retiring-tree path.
- Coverage: I found no other legacy-root reference in the file. The other paths are live: `domains/coding/task-specs/judge-ambiguity.md`, `../_shared/*`, `src/state/domain-registry.mjs`.
- Render provenance: the `.claude/skills/fgos-coding-discovering/SKILL.md` render is a thin wrapper with no header and no legacy reference, so it has no edge. The wrapper's own pointer `../../../.agents/skills/...` is a live path. The record lists it as a render with no joins, which is correct.

### 2. domains/coding/skills/fgos-coding-exploring/references/lock-decisions-and-write-context.md
Set step04-001, stratum: unpatched stratum (empty diff). Verdict: **ok**. Slots reviewed: 8 of 8.
- Source slots: skills-099 (L110 `docs/history/<feature>/CONTEXT.md`) and skills-100 (L172 `--docs-ref "docs/history/<feature>/"`). Both preserve under L12-10.
- Render joins: skills-025/026 (`.agents`), skills-048/049 (`.claude/skills`, which here is a full copy with a header at L1) and skills-158/159 (`plugins`). All are joins only, with no diff, and the render lines are source +1.
- The writer convention is the external-project `docs/history/<feature>/CONTEXT.md`, and `--docs-ref` is the item's own pointer field. Both are consumer-project topology (L12-10), so preserve is right. No other legacy reference exists in the file. Empty diff is consistent.

### 3. domains/coding/skills/fgos-coding-implement/SKILL.md
Set step04-001, stratum: unpatched stratum (empty diff). Verdict: **ok**. Slots reviewed: 6 of 6.
- Source slots: skills-101 (L71 `docs/history/<feature>/CONTEXT.md`) and skills-102 (L143 `docs/history/<id>/iron-law-evidence.md`). Both preserve.
- Render joins: skills-027/028 (`.agents`) and skills-160/161 (`plugins`). The `.claude/skills` render is a thin wrapper with no edge.
- I found no missed reference. `../_shared/*`, `references/*`, `src/runner/dispatch.mjs`, `.fgos/config.json` and the AGENTS.md "Design principles" mention are live, or are not legacy-tree paths.

## Outcome defects
None.

## Record-text notes (not rework)
- The `reason` text for skills-102/028/161 (`docs/history/<id>/iron-law-evidence.md`) cites "sibling CONTEXT/RESEARCH/DISCUSSION names". `iron-law-evidence.md` is not one of those siblings. The preserve is still right, because it is a consumer-project writer path under `docs/history/`. The reason would be more accurate if it said "sibling artifact written under the external-project `docs/history/` topology".
- The render-join slots (skills-016..019, 149..152) carry disposition `patch` with `target: null` and `anchor: null`, and `timing: Phase 9`. That matches the L12-58 join form (the source owner specifies the patch). The record text says so explicitly. It reads oddly, but I treat it as acceptable.

## Lead-judgment questions
None. One observation for Lead, not a defect: the RUL45 holder is a carriage candidate file (`Canonical: No`, "carriage only"). The patch target therefore depends on the Phase 9 flip keeping that path, as the Step 3 records for the same holder already assume.

## Counts
- step04-001, A51 patched stratum: reviewed 1 file (12 slots), rework 0.
- step04-001, unpatched stratum: reviewed 2 files (14 slots), rework 0.
- Part total: 3 files, 26 slots, 0 rework.
- The set sample passes (0% is at most 3%).

Status: DONE
Summary: All 3 files (26 slots) are ok. The single RUL45 patch resolves to an existing holder with a valid unique anchor and a correct hunk, and the remaining slots are correct L12-10 preserves and render joins. No outcome rework.
