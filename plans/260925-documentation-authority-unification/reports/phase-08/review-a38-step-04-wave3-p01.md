# Review a38 Step 4 wave 3, part 01 (set step04-001)

Pin dc24ce645. All three files are category A. Sources were read to EOF. Every slot and its diff were checked against the pinned targets and renders. Totals: 3 files, 16 slots reviewed, 0 rework.

## domains/coding/AGENTS.md (stratum: instruction source, no render) — verdict ok
Slots reviewed: 5 (instructions-051, -052, -056, and two patch slots on line 44).
- instructions-051 (line 21): `docs/history/commit-time-fgos-deletion-guard/` preserve. The tree exists at the pin, and the citation is history evidence. ok.
- instructions-052 (line 44): `docs/history/worktree-manual-merge-fgos-blob-safety-net/` preserve. The tree exists at the pin. ok.
- instructions-056 (lines 10-11): the wrapped `docs/history/main-checkout-destructive-\ngit-safety-net/CONTEXT.md` is preserved with its full span. The joined path exists at the pin. ok.
- Line 44 patch to `docs/how-to/fix-fgos-write-rejected-merge-block.md`: the old path is absent at the pin (deleted in 7557f0f88). The target `docs/knowledge/how-to-fix-a-fgos-write-rejected-merge-block-on-a-fgos-chang/fix-fgos-write-rejected-merge-block.md` exists. I diffed the deleted file against the target at 7557f0f88^ and the only difference is the added frontmatter lines `framework: diataxis` and `mode: how-to`. This is a same-basename moved-verbatim holder (ruling 1). The tsk-3v2 example the sentence points at is still in the target at line 339.
- Line 44 patch to `docs/how-to/resolve-an-events-jsonl-merge-conflict.md`: same result. The target in docs/knowledge exists, and the bodies are identical apart from the two added frontmatter lines.
- The diff hunk context matches the source, and the replacement is a single-line change with the backtick form kept. Paths are repo-root relative, as the originals were. The edit is prose only. ok.
- No missed references. The only `docs/` tokens in the source are on lines 10-11, 21 and 44. The GitNexus managed block has no retiring-tree paths. No render of this file exists at the pin.

## domains/coding/skills/fgos-coding-implement/references/verify-commit-and-iron-law.md (stratum: skill source plus 3 renders) — verdict ok
Slots reviewed: 8 (source patch, source preserve skills-103, and 6 render-join slots).
- The patch at source lines 19-20 (wrapped `docs/how-to/preserve-shell-escapes-when-transcribing-\na-verify-command.md`) goes to `docs/knowledge/how-to-preserve-shell-escapes-when-transcribing-a-verify-com/preserve-shell-escapes-when-transcribing-a-verify-command.md`. The target exists, and the old file is verbatim apart from the two frontmatter lines. Concatenating the two wrapped halves of the replacement gives exactly the target path. The hunk context matches the source.
- skills-103 (line 65): `docs/history/<id>/iron-law-evidence.md` preserve. This is an external-project writer convention (L12-10). ok.
- Render joins: all three renders (.agents, .claude, plugins) carry the generated header at line 1 and have the legacy text at line 20, plus line 66 for the iron-law path. The wrapped path is at render lines 20-21 and the iron-law path at render line 66. The offset of 1 is the header. The joins are labelled render-join, carry no diff of their own, and take their outcome from the source (patch and preserve). The six join slots are skills-029, -050, -162, class4-l-000055, class4-l-002057 and the edge-less wrapped join. ok.
- No missed references.

## domains/coding/skills/fgos-coding-knowledge/SKILL.md (stratum: skill source plus 3 renders) — verdict ok
Slots reviewed: 3 (skills-105 source, skills-031 and skills-164 render joins).
- skills-105 (line 44, `docs/architect/knowledge-registry-redesign.md` §7.4) is parked.
  - The live-holder search found none. `docs/platform/proposals/knowledge-registry-redesign.md` at the pin is a full copy of the architect doc with a different header and one corrected pointer. It is labelled "Canonical: No ... non-canonical candidate conservation carrier", so it is carriage and not a live holder.
  - `docs/explanation/compound-learn-artifact-registry.md` is a design-origin narrative. It describes the attest gate but does not hold the §7.4 attestation record shape or the "docPath must equal currentPath" rule. `docs/knowledge` has no holder of it either.
  - So the park, with its non-carriage successor note, is correct. No edit is proposed and the diff is empty, as expected. ok.
- skills-031 (.agents render) and skills-164 (plugins render): both are render-join slots with the passage at render line 45 (source line 44 plus the header offset). They follow the parked source outcome and carry no diff. ok.
- The `.claude/skills/fgos-coding-knowledge/SKILL.md` wrapper holds no docs reference. It is a 12-line build:skills output, correctly recorded as `wrapperProvenance` with no joins. ok.
- The `docs/<purposeSlug>/<role>.md` tokens at lines 12 and 17 are placeholder patterns and not edges.

## Defects
None.

## Record-text notes (not rework)
- The verify-commit patch keeps the original hard wrap inside the backtick span. Markdown renders a code-span newline as a space, so the rendered path shows a space after "when-". The original wrapped text had the same quirk, so the patch conserves the existing form and adds nothing new.

## Lead-judgment questions
- Should the Phase 9 repair of the wrapped inline-code path (verify-commit-and-iron-law.md lines 19-20, the knowledge/how-to-preserve-shell-escapes path) put the path on one line? It would be cosmetic and would break the exact "preserve wrap" equal-passage join with the three renders, so leaving it is defensible.

## Counts
Set step04-001: 16 slots reviewed (patch 4, preserve 4, parked 1, render-join 7), 0 rework. Stratum counts: instruction source 5 reviewed / 0 rework; skill source with render 11 reviewed / 0 rework.

One process note: a `git grep` I ran at the pin (to find consumers of domains/coding/AGENTS.md) also returned lines from `.fgos/` paths inside the git object tree. I did not use that output, and nothing in it affects this review.
