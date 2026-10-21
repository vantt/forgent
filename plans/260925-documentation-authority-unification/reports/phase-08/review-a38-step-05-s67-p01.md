# Review a38 step-05 seam 7 part p01 (citation/ratchet core source, baseline, checker)

Payload: s4-src-p01.json, 3 files, pin 97c9694a. No diffs, no patches, no cross-seam-only entries. Read standard: L12-72 R1-R9, L12-77, L12-83 R26, L12-85 R27/R28, seam 7 packet rule.

Counts reviewed: citation-format.md 9 author-added admitted slots (3 parked, 6 preserve); baseline.json 22 admitted preserves + 2 rejects; check-decision-citation-drift.mjs 9 literal references + 21 dynamic tuples (30 items). Total 63 items. No mechanical/neutral items in the payload.

## core/skills/_shared/citation-format.md — verdict: rework (2 defects)

Items reviewed: 9. The parks at L4 (docs/decisions/*.md), L6 (docs/specs/<area>.md) and L96 (docs/specs/*.md) each name a passage-specific blocker. Docs/history pointers (L7, L10, L53, L92) preserve correctly: docs/history and docs/backlog.md are not in the move set. The three parks share one packet dependency.

OUTCOME defects
1. author-s67-citation-core-34-30 (L34) and author-s67-citation-core-51-3 (L51), `docs/id-systems-audit.md`: disposition preserve is acceptable only as an R28 co-change slot, but the record rests on "retained docs/history convention; treeRetires false". That witness is false for this path: docs/id-systems-audit.md is in step-05-cutover-move-set.json as a Phase 6 proposed move (to docs/platform/documentation/history/id-systems-audit.md), and step-05-proposed-move-read-units.json already holds a parked unit "Phase 9 retention-or-move decision for docs/id-systems-audit.md". That unit's coChanges list only generate-shipped-path-inventory.mjs L277, next-doc-id.mjs L3 and propose-doc-decisions.mjs L11. It contains no citation-format entry (the string "citation-format" does not occur in the units file). Rule: R26/R28 (a pointer to a proposed-move path joins that path's unit; it cannot rest on a retained witness). Correction: keep preserve, add both slots to the id-systems-audit unit's coChanges with their pins, and replace the witness/reason text with the proposed-move dependency.
2. author-s67-citation-core-96-25 (L96, `docs/backlog.md`, preserve) vs author-s67-citation-core-96-44 (L96, `docs/specs/*.md`, parked). Both operands sit in the same single sentence: the documented command's scan set "across docs/backlog.md, docs/specs/*.md, and any --skills-dir root". Rule: R7 (same line/passage, one admission and one disposition). The seam 7 brief also makes line 96 one packet. Correction: park 96-25 with the same blocker and dependency as 96-44, or obtain an explicit Lead ruling that retained operands in a mixed list may preserve independently (see Lead questions).

Record-text notes
- 96-44 and 6-2 and 4-51 use dependency `citation-convention-and-scan-packet`, while the mjs parks (002469, 006494/5, 006511, 006516) use `citation-candidate-scan-coverage` for the same packet. Unify the dependency id or state that they are two named halves of one packet.
- L4 retired-corpus pointer (`docs/decisions/*.md`) is a retired decision-file citation with successorNote null. The park carries the blocker, but the live retired-decision-history holder (docs/platform/work-state/decisions/retired-decision-history.md) could be named as the successor in the record.

## scripts/check-decision-citation-drift.baseline.json — verdict: ok

Items reviewed: 24 (22 admitted, 2 rejected). I checked that every matchedExpression occurs on its stated line in the pinned bytes; there are no mismatches. Uncovered docs/ hits (L284/287/288) are docs/platform paths, outside the census. Preserve under R13 with treeRetires true for the docs/specs entries is correct (frozen checker data, no rebaseline, no new exception kind). docs/history entries are retained. dynamic-006481 and -006485 (`${CLAUDE_PROJECT_DIR}` inside serialized finding strings) truly read no path, so REJECT/generated-data-text is true.

Note (not a defect): baseline excerpts are tied to consumer prose; patching a consumer in Phase 9 will change finding keys. This is the already-ruled R13 and Phase 9 obligation; nothing to change here.

## scripts/check-decision-citation-drift.mjs — verdict: rework (1 defect)

Items reviewed: 30. Verified against pinned source (L232, L253, L285-288, L321-323, L340-352, L419-467). Parks at L422/L419/L232/L448 (decisionsDir) and L428/L427/L288/L452 (specsDir) are passage-specific and consistent line by line. Backlog default L426/L423/L451 and skills/wide-sweep operations preserve as retained-root operations. Same-line pairs agree: 006494/95, 006498/99, 006502/03, 006518/19.

OUTCOME defects
3. reference-002470 (L18 `docs/decisions/index.md` comment, preserve): the record says "move decision for index joins this pointer as a co-change", but the docs/decisions/index.md unit in step-05-proposed-move-read-units.json lists only the four readers (002463, 006492, 006509, 006514) for this file and no coChanges entry for 002470. Rule: R28 (comment pointers to a proposed-move path are individually listed co-change slots). Correction: add 002470 (pin-bound) to that unit's coChanges. Disposition preserve itself is right.

Record-text notes
- reference-002468 (L19 `docs/decisions/000N-*.md`, preserve): retired decision-file pattern with successorNote null. R8 requires a successorNote pointing at the live retired-decision-history holder. Disposition is right; add the note.
- dynamic-006499 operand "excludeRelDirs = []" is not itself a document path; its pathOperand label (WIDE_SWEEP_ROOTS) comes from the same L340 line. Admission agrees with 006498 under R7, so the label is the only issue; name the L340 roots operand and describe excludeRelDirs as a caller-supplied exclusion list.
- 002463 and 006492 blocker text names only index.md; the loader also reads the numeric retired files (00NN) and throws on a vanished directory. Mentioning the missing-directory behavior would make the park more specific (not required).

## Lead-judgment questions
1. R7 on the L96 mixed list (defect 2): may a retained operand (docs/backlog.md) preserve while a retiring operand in the same sentence parks, given a patch rewrites the list as a whole? I judged no by R7; Lead may rule otherwise (the mjs L426 and L428 split is on different lines and is fine).
2. dynamic-006512 (`baselinePath:` L430) is REJECT/config-or-metadata, while dynamic-006518/006519 (resolution of the same baseline path at L464) are ADMIT/preserve as "checker data I/O". Both end preserve, but the admission differs for one file. Decide whether the baseline data file counts as a document operand; if yes, 006512 should ADMIT/preserve; if no, 006518/19 should REJECT. The outcome is unchanged either way.
3. citation-format L4 (docs/decisions/*.md) and L6 (docs/specs/<area>.md) park for a design decision (holder addressability, RUL ownership). A live holder exists for retired decisions (retired-decision-history.md). Confirm Lead agrees this is a genuine design park rather than "live holder => patch" under L12-72.

## Counts
Files 3: ok 1, rework 2. Items 63. Outcome defects 3 (ids: author-s67-citation-core-34-30, -51-3, -96-25 vs -96-44, reference-002470). Record-text notes 6. Lead questions 3.
