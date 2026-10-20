# Review a38 step-05 rr4 p01 (seam 4 source files)

Pin reviewed: 6813aac5e (read-only worktree). Payload: s4-src-p01.json (3 files, 103 items). Reviewed by windows plus enclosing code; no checker or script run.

## Summary

| File | Verdict | Items | Admit/Reject | Outcome defects |
|---|---|---|---|---|
| .githooks/pre-commit | ok (record-text notes only) | 57 (5 literal, 52 dynamic) | 8 admit / 49 reject | 0 |
| bin/fgos.mjs | rework | 6 (2 literal, 4 dynamic) | 2 admit / 4 reject | 1 (reference-000277) |
| src/cli/command-registry.mjs | rework | 40 (26 literal, 14 dynamic) | 25 admit / 15 reject | 2 groups (parks, 10 ids; line 846 consistency) |

Counts: 103 items reviewed, 0 unseen sibling slices. 6+1 parks reviewed (reference-000277; 003641, 003643, 003652, 003653, 003659, 003666). Diffs: 3 hook/registry/bin diffs, all on source files, all change only admitted passages.

## .githooks/pre-commit - ok

All 57 items reviewed (reference-000110..000114, dynamic-000534..000585).

- Admits are right: 000110/000111 (refuse() messages at L491/L523 print a fixed doc path), 000114 and dynamic-000536 (HOW_TO_DOC feeds every refuse() output), dynamic-000566/000571 (same operations as 000110/000111, share the patch outcome, R7 ok).
- The patch (two refuse() literals, L491 and L523) targets a live registry currentPath (docs/knowledge/how-to-fix-a-fgos-write-rejected-merge-block-on-a-fgos-chang/fix-fgos-write-rejected-merge-block.md). The diff touches only those two message literals, the rollback is the inverse, and the path is a message pointer only (alias lookup, not a write destination). The co-cut test (test/runner/merge.test.mjs) is a different message, in merge.mjs, so no conflict.
- 000114 / dynamic-000536 preserve is right: the doc is a workshop-root file outside the repo ("one level up from repo/").
- 000112/000113 are comment pointers to docs/history/** (retained, exists). REJECT + preserve is acceptable: a comment reads no path. Rejecting them without nonDocumentUse is allowed because the field is required for tuples only.
- Rejects checked against source: git subprocess scalars, allowlist/`git diff` plumbing, `.fgos` state/event-store `git show HEAD:${p}` over `.fgos/*.jsonl` (not documents), and caller-data message formatting (err.message, branch, shas, fgosDeletions list) are true non-document uses. The L485 message (".fgos/" recovery text, no docs path) is correctly a reject. The L92 message prints only the fixed `.githooks/pre-commit` and `.fgos/runtime/tmp/` (not documents).
- Record-text notes (labels only, outcome right):
  - dynamic-000545 (L327) and dynamic-000546 (L328) are `git show HEAD:${p}` / `git show :${p}` over `.fgos/*.jsonl`; nonDocumentUse should read state-event-store, not caller-data-formatting.
  - dynamic-000541 (L304) and dynamic-000565 (L485) are caller-data message formatting; their state-event-store label is imprecise.
  - dynamic-000551 (L39) is the ROOT_FILE_ALLOWLIST constant (a name-membership set, no read/write); "accumulator" is the wrong label, should be allowlist/guard.
  - 000114 reason cites "L12-10/26 keep these roots" while the actual reason is that the target is outside the repo; resolverWitness exists:false is consistent with that.

## bin/fgos.mjs - rework

Items: reference-000228, reference-000277, dynamic-001601, 001602, 001606, 001607.

- reference-000228 (L5108, StoreError message): ADMIT/patch ok. Verified live target docs/platform/runner/decisions/h-36d872fbb0e5.md exists and has heading "### 0020 - Chặn `.fgos/` khỏi worktree worker ...". The citation of retired docs/decisions/0020 carries a live successor (the patch itself). The anchor uses the owner-acknowledged single-hyphen-across-em-dash slug convention (owner-answers L686 verifies it at the Phase 9 link pass); note that the repo's slug function (scripts/doc-alias-resolver.mjs:140) would yield `0020--chặn-...`, so the Phase 9 link pass must settle it. Diff touches only this literal, inverse rollback fine.
- dynamic-001601/1602/1606/1607 REJECT: all true (usage/diagnostic text formatting verb/sub/option/words.join, no doc path).
- OUTCOME defect, reference-000277 (L3064, `'authoritative-match requires --quadrant <docs/quadrant-dir>'`): parked with blocker "requires final composed candidate document input set for the owning operation; current caller artifacts do not pin that candidate set". That is the R4-excluded boilerplate class ("no bounded artifact/export supplied"). The passage is a hand-written usage placeholder: the verb reads a caller-supplied directory and nothing in the passage depends on a composed candidate set. A live holder with the same passage form already exists (docs/knowledge/why-state-decisions-splits-engine-bookkeeping-from-design-de/decision-record.md:276 writes `--quadrant <quadrant>`). Correction: patch to the live placeholder form (no fixed docs/ root), or reject as caller-data placeholder; no park. No test asserts the message text (test/report/authoritative-match.test.mjs:213 checks exit 4 only). Lead may prefer preserve; either beats the current park.

## src/cli/command-registry.mjs - rework

Items: 26 literal (reference-003641..003666), 14 dynamic (dynamic-009294..009307).

- Patches (003655, 003649, 003664) ok. 003655 retargets the doc-sources example to a live currentPath (exists). 003649/003664 retarget `docs/specs/distribution.md` to docs/platform/packaging-distribution/spec.md#business-rules; verified the heading is unique ("#### Business Rules", L610) and contains the RUL9/RUL11 text. Diff changes only these two lines, source file, inverse rollback.
- Preserves (003642, 003644, 003645, 003647, 003648, 003650, 003651, 003654, 003656, 003658, 003660, 003661, 003662, 003663, 003665) are right: docs/history/** pointers and generated retained outputs (decisions index, doc-registry) with live paths; 003665 `docs/**+src/**+plugins/**` is a citation-sweep scope glob, not a doc.
- 003657 (comment L7, docs/architecture-manifest.json) REJECT/preserve ok.
- Dynamic rejects (009294..009307): all true; schema/help data (`type: 'string'` property bodies, finding path fields, forwarded-flag text). Nothing constructs or reads a path.

OUTCOME defects:

1. R4 parks with boilerplate blocker: reference-003641 (L1760 `docs/how-to` in the quadrant description), 003652 (L1767), 003653 (L1768), 003659 (L638 `--doc-path docs/how-to/example.md`), 003643 (L846 `docs/specs/<area>.md`), 003666 (L846 `docs/specs/`). All six blockers read "requires final composed candidate document input set for the owning operation; current caller artifacts do not pin that candidate set", which R4 excludes. The command-registry is hand-written help text, so the generators seam blocker (L12-71/L12-69 resolverWitness text) does not apply to it.
   - 003643/003666 (L846): the `scope` description names the area-spec file pattern. No code reads or validates it (no `docs/specs` read in src outside this string). Area specs have live holders at docs/platform/<area>/spec.md, so R-rule "live holder means patch" applies. Correction: patch `docs/specs/<area>.md` to `docs/platform/<area>/spec.md` (and make the `docs/specs/` token the same patch, same operation).
   - 003641/003652/003653/003659: the quadrant-dir examples/description are coupled to the end-user index generator (src/report/enduser-index.mjs QUADRANTS, enduser-index-generate.mjs enumerate docs/<quadrant>/). That dependency is real, but then the park must name that specific owner (the parked generators-enduser-index quadrant-directory record) and what is missing from it. As written the park is not valid. Correction: cite the exact parked generator source owner (R2/R4 style) or give a patch/preserve. 003659 is a synthetic example path with no live file; if kept, the reason should say that.
2. Line 846 mixed outcomes in one description string: 003643 and 003666 parked, 003646 (`docs/decisions/index.md`) preserve, dynamic-009306 REJECT (config-or-metadata) all sit on the one `scope` description literal. R7 requires one admission and one disposition for a same-line/same-passage operation. The same shape occurs at L2075: 003647 (docs/history/doctor-fix-gate-bypass/CONTEXT.md) preserve vs 003649 and 003664 patch. See Lead-judgment question 1; if sub-literal tokens do count as one operation, the correction is to give the whole string one disposition (patch, with unchanged tokens inside the patched string) and admit dynamic-009306 consistently or reject all.

## Lead-judgment questions

1. Does R7 treat distinct path tokens inside one string literal (L846, L2075) as one operation? The records currently mix preserve/park/patch/reject on them. If yes, reference-003647/003646/003643/003666/dynamic-009306 need one outcome; if no, say so in the rulings.
2. Unrecorded document-bearing passages in command-registry.mjs windows with no item: L1725 (`docs/<quadrant>/`, `docs/enduser-docs-index.json`), L1756 (`docs/<quadrant>/*.md`), L1760 (`docs/<quadrant>` text sits beside 003641), L1828 (`docs/worktree-reclaim/guide.md` example), L1849 (`docs/worktree/guide.md`), L1415-1416 (`docs/ast.md` example). The census patterns only cover legacy roots, so these may be out of scope; but L1725/L1756 describe the same quadrant-enumeration operation that 003641/3652/3653 park, so they should carry the same outcome if they are admitted (R3 author-added slot). Confirm intended scope.
3. 000228 anchor: single-hyphen slug (`0020-chặn-...`) vs the repo slug function's double hyphen; carried by owner L686 for the Phase 9 link pass; no change requested here.

## Record-text notes (not outcome)

See pre-commit notes above (dynamic-000545/000546/000541/000565/000551 labels; 000114 reason text). In command-registry the dynamic REJECT nonDocumentUse labels (finding-path-field, config-or-metadata, scalar-pass-through) are all acceptable.

## Counts

Items 103; ADMIT 35; REJECT 68; patch 5 (000110, 000111 hook; 000228 bin; 003655, 003649, 003664 registry counted as 6 patches total incl. dynamic 000566/000571 which follow); parked 7 (all 7 flagged); preserve rest. Outcome defects: 1 (bin) + 6 parks (registry) + 1 consistency group (registry L846/L2075). Files ok: 1; rework: 2.

Status: DONE_WITH_CONCERNS
