# Review A38 - Step 4 wave 2, part 01 (set step04-001)

Pin: dc24ce645. Payload: step-04-wave2-p01.json (5 files, 42 slots). Every source file was read whole from the pin, and every slot's span was checked against the source text.

## Per-file verdicts

### 1. domains/coding/AGENTS.md - set step04-001, stratum: L12-60 changed record
Verdict: **ok**. Slots reviewed: 5 (3 preserve, 2 parked, 0 patch). Diff is empty, as expected.
- instructions-051 (line 21 `docs/history/commit-time-fgos-deletion-guard/`): preserve. The directory exists at the pin and is a named history citation. The span text matches columns 2..46.
- instructions-052 (line 44 `docs/history/worktree-manual-merge-fgos-blob-safety-net/`): preserve. The directory exists. The span matches.
- instructions-056 (line 10, wrapped `docs/history/main-checkout-destructive-` continuing to `git-safety-net/CONTEXT.md` on line 11): preserve. The directory exists at the pin and the span matches line 10, columns 33..71. The slot covers the first half of the wrapped path. The reason names the passage, so there is no wrap problem.
- Added slot, line 44 col 543..592 `docs/how-to/fix-fgos-write-rejected-merge-block.md`: parked, dead link. This is a live "see X" pointer. The path is absent at the pin; it was removed by commit 7557f0f88 (migrated to docs/knowledge). The successor note `docs/knowledge/how-to-fix-a-fgos-write-rejected-merge-block-on-a-fgos-chang/fix-fgos-write-rejected-merge-block.md` exists. Its title, "How to fix a `fgos-write-rejected` merge block on a `.fgos/` change", matches. The note is non-executable and carries no patch target. Span columns verified against the source text.
- Added slot, line 44 col 682..734 `docs/how-to/resolve-an-events-jsonl-merge-conflict.md`: parked, dead link. The path was removed by commit e7475b183. The successor note exists and its title matches. Span verified.
- Wrapped-path and gitnexus block: lines 46-89 have no legacy docs paths, so there are no missed edges. Other paths in the file (`.claude/skills/...`, `.githooks/pre-commit`) are not legacy docs.

### 2. domains/coding/skills/fgos-coding-discovering/SKILL.md - set step04-001, stratum: L12-60 changed record
Verdict: **ok**. Slots reviewed: 12 (1 patch, 3 preserve, 8 render-join).
- skills-090 (source line 80 `docs/specs/runner.md`): patch to `docs/platform/runner/subcomponents/h-6979005beaf7/spec.md#business-rules`.
  - The target exists at the pin. Line 25 is `## Business Rules`, so the anchor resolves.
  - Line 78 of the target is the RUL45 bullet. It contains the exact claim "Tên/mô tả trong một báo-cáo là văn bản KHÔNG ĐÁNG TIN ... không thể tự nó thành một lệnh shell", matching the source "RUL45 ... title/description là input không đáng tin ... không bao giờ chèn thẳng vào lệnh shell".
  - The anchor matches the L12-30 rule that runner RUL citations anchor on `#business-rules`.
  - The hunk replaces only the path token inside the existing backticks and keeps the `(RUL45,` prefix and the closing `)`. It is the same line and renders correctly when applied verbatim. The path is repo-root, which is the source's own form.
  - No code behavior is involved.
- skills-091, skills-092, skills-093 (lines 104, 126, 133): preserve.
  - `docs/history/<feature>/` and `docs/history/<feature>/RESEARCH.md` are external-project conventions (L12-10).
  - `docs/history/discover-stage-graph-and-skill-layering/DISCUSSION.md` exists at the pin, and the line 126-127 wrap does not hide a second path.
- Render joins:
  - skills-016/017/018/019 map to .agents, and skills-149/150/151/152 map to plugins/fgOS. Both carry the generated header at line 14 naming the source, so the plugin is correctly a join and not its own owner.
  - Render line numbers are the source line +1 because of the header: 81/105/127/134 versus 80/104/126/133. The columns match.
  - The patch joins (016, 149) carry timing Phase 9 and sourceDisposition patch. The preserve joins carry timing none. All use the render-join label, with no diff and no target.
  - The .claude wrapper (925 bytes) has no docs paths, so no join is needed.
- Missed edges: none. The other paths (`../_shared/*.md`, `domains/coding/task-specs/judge-ambiguity.md`, `src/state/domain-registry.mjs`) are not legacy docs.

### 3. domains/coding/skills/fgos-coding-exploring/SKILL.md - set step04-001, stratum: L12-60 changed record
Verdict: **ok**. Slots reviewed: 9 (3 preserve, 6 render-join). Diff is empty.
- skills-094, skills-095, skills-096 (lines 15, 105, 131): preserve. `docs/history/<feature>/CONTEXT.md` is the external-project convention. Line 131 is inside a fenced gate-check example. The preserve is still correct, and the fenced-example parity belongs to Step 5.
- Render joins: skills-020/021/022 map to .agents and skills-153/154/155 map to plugins. Header at line 11, so the render line is source +1 (16/106/132). Spans verified.
- stepFiveExcluded lists class4-l-000047 and class4-l-002049 (render line 132, fenced). This is consistent with L12-60(1) and is not double-counted as a slot.
- Missed edges: none. Bare `CONTEXT.md` (lines 18 and 68) is not an edge.

### 4. domains/coding/skills/fgos-coding-exploring/references/gate-mechanics.md - set step04-001, stratum: L12-60 changed record
Verdict: **ok**. Slots reviewed: 8 (2 preserve, 6 render-join). Diff is empty.
- skills-097 (line 12 `docs/history/<feature>/CONTEXT.md`, inside a fence): preserve, a convention. Span matches.
- skills-098 (line 56 `docs/history/gate-bypass/CONTEXT.md`): preserve. The file exists at the pin, so it is not a dead link. It sits inside a quoted rationale string in a fenced command, and Step 5 owns the runtime string.
- Render joins: .agents (023/024), .claude (046/047), plugins (156/157). Each copy carries the line-1 generated header, so each is a join. Render line is source +1 (13/57). The .claude/skills/.../references copies exist at the pin, so those joins are legitimate.
- Missed edges: none.

### 5. domains/coding/skills/fgos-coding-exploring/references/lock-decisions-and-write-context.md - set step04-001, stratum: L12-60 changed record
Verdict: **ok**. Slots reviewed: 8 (2 preserve, 6 render-join). Diff is empty.
- skills-099 (line 110 `docs/history/<feature>/CONTEXT.md`) and skills-100 (line 172 `docs/history/<feature>/` in `--docs-ref "..."`): preserve, an external-project convention. Line 172 is an example string, and Step 5 excludes the class4 copy.
- Render joins: .agents (025/026), .claude (048/049), plugins (158/159). Render line is source +1 (111/173). Spans verified (111: 8..40, 173: 144..166).
- Missed edges: none.

## Outcome defects
None. No wrong disposition, target, anchor or diff, no false adjacent description, no missed reference and no behavior change was found.

## Record-text notes (not rework)
1. Treatment of fenced example lines is not uniform across joins.
   - gate-mechanics line 57 (class4-l-000049 and class4-l-002051) sits inside a fenced bash block but is absorbed into the skills-024/157 join refs.
   - The fenced lines 13 (gate-mechanics) and 132 (exploring SKILL.md) are instead in stepFiveExcluded, and the line-173 class4 edges (000051/002053) are excluded as well.
   - Every involved slot is preserve or render-join of a preserve, so the outcome is identical. Only the label for why a class4 edge is or is not excluded differs, and a Step 5 reader may want that line stated.
2. For instructions-056 the span covers only the first half of the wrapped path. The reason text quotes the same line, so this is harmless.
3. The successor note for `resolve-an-events-jsonl-merge-conflict.md` points to a knowledge doc whose first paragraph is headed "Superseded (tsk-3tp ...)". The park note is non-executable, so this is not a defect. Phase 9 will have to read that doc before choosing a destination.

## Lead-judgment questions
None.

## Counts
- Set step04-001, stratum L12-60 changed records (this part): reviewed 5 files, rework 0.
- Slots: 42 (5 + 12 + 9 + 8 + 8). Disposition mix: 1 patch, 2 parked, 10 preserve, 29 render-join.
