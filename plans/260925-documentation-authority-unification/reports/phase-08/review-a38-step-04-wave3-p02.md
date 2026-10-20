# Review a38 step-04 wave3 p02

Part 02, set step04-002, category A. Pin dc24ce645.

## domains/coding/skills/fgos-coding-planning/references/verify-sync-and-gap.md
Verdict: ok. Slots reviewed: 14 (4 source slots, 10 render-join slots), whole file read through line 163.

Source slots:
- Line 16, `docs/how-to/write-verify-for-a-skill-prose-change.md`: patch. The old path is absent at the pin. The target `docs/knowledge/vi-t-verify-cho-m-t-item-thay-i-skill-prose/write-verify-for-a-skill-prose-change.md` exists. I diffed the file at its deletion commit's parent against the target and found only added `framework`/`mode` frontmatter, so it is moved verbatim (ruling 1). Label and backtick form are kept, and the replacement stays inside the existing backtick span.
- Lines 49-50, the wrapped `docs/how-to/preserve-` + `shell-escapes-...md`: patch. The wrapped matchedExpression is complete. The target `docs/knowledge/how-to-preserve-shell-escapes-when-transcribing-a-verify-com/preserve-shell-escapes-when-transcribing-a-verify-command.md` exists, and its only diff against the original is the added frontmatter. The diff hunk is exact and keeps the inline-code span.
- Lines 64 and 68, `docs/history/<feature>/plan.md`: preserve. Both are external-project convention paths and a fenced example (L12-10, L12-60(1)).
- No other path-like reference is in the file. The mentions of CONTEXT.md and plan.md are bare filenames and not edges.

Render slots (`.agents`, `.claude`, `plugins`; ids class4-l-000064/65/66, class4-l-002066/67/68, skills-055/056, and the id-null supplementals): all render-join, no render diff, each carrying its source outcome. The source-outcome line mapping is consistent with the one header line on each render, which shifts render lines by +1.

Defects: none.

Record-text notes (not rework):
- After the patch, the target path wraps at "how-" / "to-preserve..." inside a backtick span, which renders as a space. The original wrapped path had the same defect, so this is not a regression. Phase 9 could put the whole path on one line.

Counts: set step04-002 reviewed 1 file, 14 slots, rework 0. Stratum: category A.

Status: DONE
