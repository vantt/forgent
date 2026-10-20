# Review a38 step-05 rr5 p03 (src/setup/skill-wrappers.mjs)

Pin aa8d34374. Payload: 1 file, 149 changed items (136 ADMIT parked -> preserve, 13 ADMIT parked -> REJECT/preserve). No diff, no parks remain, no coCut paths.

## src/setup/skill-wrappers.mjs: verdict ok (one small admission inconsistency, outcome unaffected)

Items reviewed: 149.

Standard applied: R14 (hand-written skill/generator code, fixed non-docs roots -> preserve; park only if the operation touches docs/specs or docs/architect), R7/R16 (one expression, one admission), R5/R6.

Checks done
- Whole pinned file grepped: the only docs/ strings are comment pointers into docs/history (not in this payload). No operand in the 149 items builds, reads, writes or probes a docs/specs or docs/architect path. Every operand is under .agents/skills, .claude/skills, plugins/fgOS/skills, .gemini/extensions/fgos, core/skills, domains/*/skills, or a caller-supplied output dir. So preserve (R14) is correct for all 136 admitted items. No park is warranted.
- All 149 blockedReason and stateExportDependency values are null, so no boilerplate park text remains (R12 satisfied). blockedSeams is empty. proofScope is a single repeated sentence, but only on preserve items and it is not a blocker.
- Every admitted item carries a real pathOperand present in its passage. Every rejected item names a nonDocumentUse, and the use is true (see below).
- The 13 rejects match the Lead's R10/R14 list. Verified against the source:
  - 015062 (L1089) and 015086 (L127): caller-derived relative path emitted into a generated header or wrapper body. This is caller-data formatting with no fixed document root (R6). OK.
  - 015084/015085 (L1252): path.resolve equality on package/target roots, a boolean guard. OK.
  - 015117/015118 (L308/L313): targetPath.slice root extraction, string slicing. OK.
  - 015136 (L377): isAbsolute ternary selector, with the real join items at L378-L381 carried separately. OK.
  - 015142/015144 (L436/L466): `rel.split(path.sep).join('/')` normalization feeding startsWith guards. OK.
  - 015172 (L63): case-fold `.join('/')` for the collision key. OK.
  - 015222 (L863): regex capture then join. OK.
  - 015230 (L889): regex literal. OK.
- Same-line check: only one line has mixed admissions (L881, below). Every other line has a single admission and a single preserve disposition.

### OUTCOME defects
None. Every admit/reject choice leaves disposition = preserve, and every preserve is justified under R14. The item below is an admission inconsistency only.

- D1 (admission only, disposition preserve either way): L881 `const fragmentPath = path.relative(matchedRoot, matchedPath).split(path.sep).join('/');`
  - 015227 is ADMIT (operand `path.relative(matchedRoot, matchedPath)`).
  - 015228 is REJECT (operand `join('/')`).
  - Rule: R7/R16, "one expression (relative()+join) has one admission".
  - Correction: give both items the same admission. The sibling at L820 (015211 `join('/')` admitted, unified with its relative per the Lead's "unify 015211/015212") shows the intended pattern. The consistent options are to admit 015228 with a pathOperand, or to reject 015227 with the same nonDocumentUse.
  - Under R10 this needs no re-review, because the outcome stays preserve.

### Record-text notes (admission-only, preserve either way, R10 so no re-review)
- N1: 015224 `isPathInside(root.real, real)` (L874) is a pure boolean predicate on two values, which R16 calls a guard and rejects. The same file rejects the equivalent guard `path.resolve(packageRoot) !== path.resolve(targetRoot)` (015084/015085).
- N2: 015220 `path.resolve(root)` (L843) is a resolve of a root. R5 lists resolve of a root as a reject, and 015084/015085 reject the same shape. It is admitted here, so the file is inconsistent.
- N3: 015204 `entryRel` (L783) is the `pathToSources.set(...)` map-key accumulator, which R5 rejects (accumulator). It is currently admitted.
- N4: 015063/015064 and 015197/015198 are sibling `.tmp-<pid>-...` atomic-write scratch paths. The precedent for temp scratch in other files (p24 008608-008612) is reject. Here they are admitted. Preserve is unaffected.
- N5: 015225/015226 (`matchedRoot === root.real ? real : resolved`) is a value selection, not a read. It is the same family as N1-N3.
- Reason text: for the 136 preserve items the reason says "existing source and generated instruction/skill surfaces from caller options" and the receipt says "pilot". Both are accurate enough. The parityObligation comparison still reads "No candidate output claimed when parked", which is stale now that the items are preserve. This is a text nit only.

### Lead-judgment questions
- Q1: 015062 (L1089) is rejected as caller-data formatting, but the same file admits the analogous emitted-header-path computation at L179 (015098, `path.relative(wrapperDir, sourcePath)`, with fixed .agents/.claude roots). That is defensible, because L1089 takes both roots from the caller while L179 uses fixed roots. It follows the L12-74 p38 ruling (L1078 015060/015062 reject), so no change is requested. This is flagged only so the distinction is intentional.

Counts: 149 reviewed; 136 ADMIT/preserve ok; 13 REJECT/preserve ok; 0 outcome defects; 1 admission inconsistency (D1); 5 record-text/admission notes; 1 Lead question.
