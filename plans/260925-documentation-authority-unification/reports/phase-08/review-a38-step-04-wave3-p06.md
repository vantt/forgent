# Review a38 step-04 wave3 p06

Part 06, set step04-008, category A, headerless plugin skills. Pin dc24ce645.

The three files have no generated header and no `core/skills`, `.claude/skills` or `.agents/skills` counterpart, so each is its own source owner. Each has an `sourceRenderProvenance` of [], which is correct.

## plugins/fgOS/skills/cleanup-loop/SKILL.md
Verdict: ok. Slots reviewed: 3, whole file read (92 lines).
- skills-133 (line 21) and skills-134 (lines 60-61, wrapped `docs/history/` + `fgos-cleanup-loop/CONTEXT.md`): preserve. The target `docs/history/fgos-cleanup-loop/CONTEXT.md` exists at the pin, so this is named history evidence kept literal (L12-10). The wrapped slot is complete.
- class4-l-002026 (line 31, `docs/explanation/why-merge-loop-recurses-into-loop-not-ck-loop.md`): patch to `docs/knowledge/why-fgos-merge-loop-tsk-1sm-recurses-into-loop-not-ck-loop/why-merge-loop-recurses-into-loop-not-ck-loop.md`. The target exists. The explanation file was deleted by migration commit a9f3007a6, and its pre-delete bytes differ from the target only by the added `framework`/`mode` frontmatter, so ruling 1 (same-basename moved-verbatim) applies. The diff hunk replaces the path inside the existing backticks and the parentheses. The sentence "see ...)." still renders. The relative path resolves from the repo root, as the original did.

## plugins/fgOS/skills/deliver/SKILL.md
Verdict: ok. Slots reviewed: 5, whole file read (196 lines). No diff, which is correct for an all-preserve file.
- skills-140 (line 36), skills-141 (line 39), skills-142 (line 89 start) and class4-l-002035 (lines 89-90, wrapped `docs/history/main-checkout-destructive-git-safety-net/CONTEXT.md`): preserve. All targets exist at the pin: coding-planning-validating-gate-redesign, gate-bypass and main-checkout-destructive-git-safety-net.
- The id-null wrapped supplemental on lines 82-83 (`docs/journals/260803-1612-main-checkout-direct-branch-checkout-tsk-4hk.md`): preserve. The target exists and the reference is design-origin provenance (tsk-4hk), so L12-47 and ruling 2 apply.
- Line 40, `coding-planning-validating-gate-redesign/CONTEXT.md` has no `docs/` prefix, so it is a bare relative mention and not an edge.

## plugins/fgOS/skills/retro-loop/SKILL.md
Verdict: ok. Slots reviewed: 3, whole file read (98 lines).
- skills-184 (line 23) and skills-185 (line 41): preserve. Both `docs/history/fgos-retro-loop/CONTEXT.md` and `docs/history/fgos-cleanup-loop/CONTEXT.md` exist at the pin.
- class4-l-002095 (line 36): patch, the same moved-verbatim knowledge holder and the same diff shape as cleanup-loop. The hunk is exact.

Defects: none. Record-text notes: none.

Counts: set step04-008 reviewed 3 files, 11 slots, rework 0. Stratum: category A.

Status: DONE
