# Review a38 Step 05 rr4 p38: src/setup/skill-wrappers.mjs

Method: loaded the part payload, read L12-72 and the pinned source (6813aac5e) in full. The 223 items are 149 ADMIT/parked and 74 REJECT/preserve. There is no diff and no rollbackDiff.

## File verdict: src/setup/skill-wrappers.mjs is REWORK (223 items reviewed)

Counts: 149 ADMIT/parked, 74 REJECT/preserve. 3 are literal comment references (003859, 003860, 003861); the other 220 are dynamic tuples. The three docs/history comment citations are REJECT/preserve with the history targets existing; this is consistent. No retired-decision citation is present, so no successorNote is owed.

### OUTCOME defects

Admitted operands that build no document path and read or probe none (R5). Each should be REJECT/preserve with the stated nonDocumentUse:

- D1 dynamic-015117 (L308) and dynamic-015118 (L313): `root: targetPath.slice(0, idx)` and `slice(0, endIdx)` in resolveProjectRoot. They derive a project root scalar, which is root-only pass-through (R5). The sibling resolveProjectRoot return at L376, 434 and 464 is already REJECT root-only, so the file is inconsistent. Correction: REJECT, root-only.
- D2 dynamic-015084 (L1252 `path.resolve(packageRoot)`) and dynamic-015085 (L1252 `path.resolve(targetRoot)`): only a self-hosting equality test between two roots (R5 "resolve of a root"). Correction: REJECT, root-only/guard.
- D3 dynamic-015136 (L377 `path.isAbsolute(targetPath)`): a boolean guard choosing which branch builds candidateDir. The joins on L378, 379, 381 and 384 are the path operations. Correction: REJECT, guard. Same shape as 015119 (L322), which is already rejected as a guard.
- D4 dynamic-015172 (L63 `.join('/')` in windowsPathCollisionKey): joins already-normalised string segments into a collision key. It reads, writes, probes and emits nothing. Correction: REJECT, text-label-join.
- D5 dynamic-015142 (L436) and dynamic-015144 (L466), `rel.split(path.sep).join('/')` in isGeneratedAdapterTarget and isCanonicalSkillSource: string normalisation of the caller path before prefix guards. No fs operation on those lines. Correction: REJECT, text-label-join/guard. dynamic-015222 (L863, `.split('\\').join('/')` of a regex capture) and dynamic-015228 (L881, `.split(path.sep).join('/')` on the relative result) are the same kind of operation. Lead should apply one rule to all of these `join('/')` items. L881 sits inside the realpath-based fragment resolution and is the weakest case; keep it only if Lead treats the whole fragmentPathForCanonicalReference body as one operation.
- D6 dynamic-015230 (L889, `absoluteProjectPathPattern` regex): a shape pattern that matches path text inside file content. Per p01 and p09 rulings, a regex that only matches text rejects as a shape guard. The resolution work is owned by 015223, 015224 and 015227, which are not in dispute. Correction: REJECT, shape guard.
- D7 R6 inconsistency (an emitted path from a fixed literal is admitted): dynamic-015055 (L1060 `packaged_source = "${packagedRelPath}"`) and dynamic-015058 (L1063, the prompt text containing `${packagedRelPath}`). Both are REJECT/caller-data-formatting. The runtime-emitted path comes from the fixed literal `skills/${s.name}/SKILL.md` (L1055, which is ADMIT via 015050/015051), so the emitted string changes if that path moves. Correction: ADMIT, same disposition as 015050/015051. The scalar siblings at L1057-1059, 1061 and 1062 (name, description, intent, provenance, user_invocable) reject correctly.
- D8 R7 same passage (toPosixRelativePath, L818-822): dynamic-015211 (L820 `join('/')`) is ADMIT while dynamic-015212 (L821, the `./${rel}` template of the same value) is REJECT. Make them agree: both ADMIT if the packaged-reference emission is treated as a document operation (the value goes into rewritten skill content), otherwise both REJECT.
- D9 R7 same passage (generateWrapperContent, L127-131): dynamic-015086 (L127, `relPath = sourceRelativePath.replaceAll('\\','/')`) is ADMIT/parked while dynamic-015087, 015088 and 015089 (L129-131, the template that emits `The real skill content lives at \`${relPath}\``) are REJECT. Pick one outcome for the passage. Since `replaceAll` is only a normaliser, REJECT of 015086 is cleanest. See Q2 for whether the emitted pointer should be admitted instead.

### Blocker specificity (R4)

All 149 parks share one blocker sentence, with only the quoted expression changing: "requires composed canonical instruction/skill/agent inputs and resulting generated destination inventory after source patches; final source bytes are not assembled", blockedSeams ["generators"]. This is exactly the shape R4 calls boilerplate. For fixed-root operations over core/skills, domains/*/skills, .agents/skills, .claude/skills, plugins/fgOS/skills and .gemini/extensions/fgos, none of which is a retiring root, the p06 ruling is that "fixed generated skill-root operations and their assembled/wrote/mirrored path messages preserve". The blocker names no source patch, export or Phase 9 obligation specific to any single passage. I am not marking all 149 as defects because an earlier owner-answers item (item 9 of the seam-4 reviewer closure) states that "all surviving skill-wrapper parks use blockedSeams: generators". Treat this as Q1 below.

### Record-text notes

- dynamic-015056 (L1061, the `provenance = "${s.canonicalDir || 'inline'}"` template) is labelled nonDocumentUse "guard"; "caller-data-formatting" is correct.
- Roles disagree on the same line and outcome: 015197 is "document-path-operation" but 015198 is "instruction/generator" (L76); 015063 is "document-path-operation" but 015064 is "instruction/generator" (L1091); 015049 is "document-path-operation" but 015047/015048 are "instruction/generator" (L1054). 015050 and 015051 have the same split (L1055). Outcomes agree, so this is label only.
- For all REJECT items the `reason` text cites "export function ..." declaration snippets truncated mid-line (for example 015087 "It formats values at export function generateWrapperContent(sourceContent, sourceRelativePath) {"). The words are awkward but not false.

### Lead-judgment questions

- Q1: Should the 149 generator-seam parks become preserve under R4/p06 (fixed generator operations on retained skill roots with no Phase 9 patch) or stay parked by the earlier closure? My recommendation: preserve, with a one-line witness that none of these roots is touched by Phase 9. A park with the same sentence on every item names no missing artifact.
- Q2: Should the pointer text emitted into generated wrappers and headers be admitted? Candidates are L129-131 (wrapper body "lives at `${relPath}`") and L1078 (header "Generated by fgOS skill assembly from `${sourceRelativePath}`", dynamic-015060, which an owner-answers item 8 records as a deliberate reject/preserve). Both print a path computed from caller data (`path.relative(projectRoot, sourcePath)`, L179 and L1089), not from a fixed document literal, so under R6 the current REJECT is defensible. If Lead instead follows p06's "assembled/wrote/mirrored path messages preserve", they become ADMIT/preserve, and 015086 and 015062 move with them. Decide once for all three sites.

## Counts

- Items reviewed: 223 (149 ADMIT/parked, 74 REJECT/preserve).
- Outcome defects: 9 groups touching 17 item ids. Admission flips to REJECT: 015117, 015118, 015084, 015085, 015136, 015172, 015142, 015144, 015222, 015228 (L881 conditional), 015230, plus 015086 per D9. Flips to ADMIT: 015055, 015058. 015211 and 015212 need to agree (D8). 
- Record-text notes: 3 groups.
- Lead questions: 2.
- No diff or rollback diff to check; file is a source file.
