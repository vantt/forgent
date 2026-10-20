# Review a38 step-05 rr4 p20 (seam 4 source files)

Payload: s4-src-p20.json, 6 files, 99 items (7 literal references and 92 dynamic tuples). Pin 95301cb9. No diffs in any file (no patch dispositions), 12 parks, all in knowledge-migration.mjs.

## scripts/knowledge-migration.mjs — verdict: rework (53 items)

OUTCOME defects

- dynamic-008154 (L138, `throw new Error(\`... '${inventoryPath}' must contain a JSON array ...\`)`). R6: the printed path comes from `inventoryPath`, which is `path.join(repoRoot, 'docs/history/.../inventory-data.json')`, a fixed document literal that the same file admits as 008152/008153/003610. The message output changes if that path moves, so this must be ADMIT, disposition preserve (the same outcome as 003610). The REJECT is wrong, and the nonDocumentUse "accumulator" is also untrue. Correction: admit with a pathOperand naming `inventoryPath` (derived from the L126 literal).
- dynamic-008167 (L206, untraceable-oldPath message). The message prints `${targetPath}`, which is built from the fixed `docs/knowledge/...` root (L150, admitted/parked as 008156/008157). Under R6 a fixed-document-root path in a user-visible message is ADMIT. It was rejected as caller-data-formatting; the `${item.oldPath}` part is caller data, but the fixed-root part makes it a document message. Correction: admit, and take the disposition of the L150 construction (park if that park stands) or preserve if the Lead keeps the message as formatting only.
- dynamic-008164/008165/008166 (L200, `oldPathTraceable = item.oldPath === existingDoc.currentPath || (existingDoc.aliases||[]).includes(item.oldPath)`). This is a pure comparison/membership guard. It constructs, reads, probes or emits no path, which is R5 "guards". The same family at L199 (008163, `sourcePath === targetPath && ...`) is already REJECT/guard, and L200 is the same kind of operation. As written, the pathOperand `item.oldPath` does not "yield a document path" in an operation. Correction: REJECT with nonDocumentUse "guard" (or, if the Lead wants the alias identity check treated as a path operation, make L199 and L200 consistent). Currently they are inconsistent.
- dynamic-008159/008160 (L164, `sourcePath = existingDoc ? existingDoc.currentPath : item.oldPath`). This is a ternary pass-through of a caller/registry path value. Nothing is constructed or read here; the later read happens at L249/L58, which are separately admitted. Under R5 this is closer to scalar pass-through. Same Lead call as the L200 item: either reject both or document why value selection is admitted.

Parks (12: 008156, 008157, 008159, 008160, 008162, 008164, 008165, 008166, 008173, 008174, 008186, 008188)

- All 12 carry one identical template blocker: "requires bounded inventory and folded registry input for this operation at the final candidate tree; current legacy projection cannot establish candidate identities", with blockedSeams ["generators"]. R4 says the generators seam blocker applies only to generator inputs/outputs, and "no bounded artifact/export supplied" style sentences are not blockers. This script is hand-written.
- The substance is real, though. I checked the pinned inventory-data.json: 332 rows whose oldPath values are under docs/explanation (213), docs/how-to (89), docs/reference (28), docs/tutorials (1) and docs/decisions (1), and newPath is `docs/knowledge/<slug>/<role>.md`. The read/write operands at L58, L67, L189, L249 and L250 therefore resolve to legacy-root files whose final locations are not knowable from the source. A park is defensible, but the blockedReason should name this passage's actual missing input: the inventory rows' oldPath values in legacy roots and the registry currentPath after the move. Record-text note, not an outcome defect. The same wording on 008162 (L189, `existsSync(join(repoRoot, targetPath))`) is the weakest, because targetPath is built from the retained docs/knowledge root; see Q1.
- 008173/008174/008186/008188 (existsSync/readFileSync/git mv over `move.oldPath`/`move.newPath`) are correctly admitted. Parks within the same passage agree (L58/L59 reject message vs L58 probe is a disjoint pair, fine; L67/L68 likewise).

Items otherwise ok
- Literal references 003610 (inventory-data.json, L126, preserve, existsAtPin true), 003613/003614/003615 (docs/doc-registry.*, .md, .json; L336-347). Dynamic 008177-008180 admit/preserve and agree with 003614/003615 (fixed document outputs). 003613 is correctly labelled a pattern.
- Rejects with true nonDocumentUse: 008147 (L104 message with topic/doc ids), 008148, 008149/008150/008151 (the `.fgos` state dir and its error message), 008155, 008158, 008161 (comment text), 008163, 008168/008169/008176 (finding path fields), 008170-008172 (join/format), 008175, 008181-008183 (cwd/argv roots), 008184/008185/008187/008189-008192 (caller-data messages with no fixed root).
- 008152/008153 and 003610 share the L126 passage and agree (ADMIT/preserve).

Lead-judgment questions
- Q1 (L12-72 R8, comment pointers 003611 L12, 003612 L323, 003616 L152). They cite `docs/architect/knowledge-registry-redesign.md` §13.4/§13.5 and are preserved as dated provenance with a "tree retires at Phase 9" witness, which fits the R8 wording. A live carrier exists at the pin: `docs/platform/proposals/knowledge-registry-redesign.md` has the same §13.4 Conservation and §13.5 Apply sections, but declares itself "Canonical: No ... Do not use this for current authority" (a conservation carrier, Provenance points back to docs/architect). I did not treat that as a live holder, so I do not call this a defect. If the Lead considers the carrier a live holder, these three become comment-only patches. Retired-decision citations: none in this file.
- Q2 (parks vs R4 "hand-written source with fixed target set => preserve"). Target construction is fixed on retained docs/knowledge, but the oldPath side is inventory data into retiring roots, so I lean toward keeping the parks with a rewritten blocker text. Lead to confirm.

## scripts/lib/full-suite-queue.mjs — ok (8 items)
All REJECT/preserve: caller-data messages (L33, L38, L39, L73, L81) and lockRoot/scope plumbing (L63, L64). No document path is constructed or read; the file has no docs/plans/.md mentions. Labels are true.

## scripts/lib/is-main-module.mjs — ok (2 items)
008201 (path.resolve(process.argv[1]) in isMainModule) and 008202 (file URL in a doc comment) are non-document. Labels true.

## scripts/lib/test-file-watchdog.mjs — ok (5 items)
Process-table formatting, rootPid and guards; no document path. Labels true.

## scripts/lib/test-git-config-guard.mjs — ok (24 items)
All reject: git argument formatting, `.git` probes (008229/008230, non-document-fs-probe), tmpdir/CHECKOUT_ROOT/protectedCommonDir plumbing, scope-flag sets and dirs accumulators. No document path in this file.

## scripts/list-doc-anchors.mjs — ok (7 items)
008232 (L42) and 008237 (L48) are ADMIT/preserve: `fs.readFileSync(path.resolve(cwd, <caller doc path>))` really reads a caller-named document; no fixed root, so preserve is right. 008233/008234/008235/008236/008238 reject (caller-data messages and a tab join; the usage-text/print of `ref` has no fixed root). Same-passage admissions: L42 read admit with L43 messages reject are disjoint operations.

## Counts
Files 6; items 99; files ok 5, rework 1. Outcome defects: 4 groups touching 9 items (008154; 008167; 008164-008166; 008159-008160, the last pair a Lead-call). Record-text notes: 12 parks share a boilerplate-shaped blockedReason (substance real, wording to be made passage-specific). Questions: 2.

Status: DONE_WITH_CONCERNS
