# Review a38 step-05 seam 5 batch 7, payload s4-src-p01 (R26 sweep, source files)

Reviewer: independent read-only. Pinned bytes read through git (aa8d34374 / 95301cb9a / 5eb9dc609). Standard: L12-72 .. L12-83 (R1-R26). Items reviewed: 77 (3 + 11 + 10 + 6 + 3 + 7 + 10 + 18 + 9).

## Verdict table

| File | Verdict | Items |
|---|---|---|
| src/cli/command-registry.mjs | rework | 3 |
| apps/fgos-gateway/src/gateway.rs | ok | 11 |
| apps/fgos-gateway/src/mcp.rs | ok | 10 |
| src/report/decision-index.mjs | ok (questions) | 6 |
| src/report/enduser-index-generate.mjs | ok (question) | 3 |
| scripts/check-doc-constitution.mjs | ok | 7 |
| src/setup/instruction-registry.mjs | rework | 10 |
| src/setup/registrations.mjs | rework | 18 |
| test/architecture.test.mjs | ok (record-text notes) | 9 |

## OUTCOME defects

### src/cli/command-registry.mjs
- D1 (missing slot, R3/R7/R26). Pinned L861, the `decision-index` description, contains two fixed document literals on one line: `docs/decisions/index.md` (reference-003651, parked) and `docs/enduser-docs-index.json` ("mirrors fgos docs-index's own generate+drift shape for docs/enduser-docs-index.json"). The second has no record. L1725 has an author-added slot (author-s4-fix2-284fae1afd0a9579) for the same literal, parked, and it is the only command-registry reader in the docs/enduser-docs-index.json unit. Correction: add an author-added source slot at L861 for `docs/enduser-docs-index.json`, ADMIT/parked with "Phase 9 retention-or-move decision for docs/enduser-docs-index.json", and list it in that unit. It is the same passage as 003651, so it takes the same park.
- 003646, 003651 (admit, park, unit docs/decisions/index.md) are right. L846 and L861 are emitted help text naming the fixed document. 003646 shares its line with the parked docs/specs/<area>.md items 003643 and 003666, so the single-outcome rule holds. 003657 (comment, REJECT/preserve) is accepted as an inherited rationale-comment custody item, listed as a co-change in the architecture-manifest unit.

### src/setup/registrations.mjs (R26 sweep gaps)
The file parks `${indexPathFor(root)}` messages at L3730-3743 and the L3688 manifest description. It leaves other fixed-root operations on the same two proposed-move paths as preserve. The units file lists none of them. R26 says a real read/probe/copy of such a path cannot rest on "retained", and every reader joins one co-cut unit. R7 says the same function and passage take one outcome.
- D2. author-s4-fix2-70cc3f725650c613, L3766: `fs.existsSync(indexPathFor(root))` is a real probe of docs/decisions/index.md, ADMIT/preserve. It must be ADMIT/parked with "Phase 9 retention-or-move decision for docs/decisions/index.md", added to the decisions/index.md unit.
- D3. dynamic-014343 (L3777, `${result.path} already up to date`) and dynamic-014344 (L3779, `regenerated ${result.path}`) are ADMIT/preserve. `result.path` is the relative docs/decisions/index.md emitted by generateDecisionIndex (decision-index.mjs L135), so the printed text changes if the index moves. They should be ADMIT/parked and in the same unit.
- D4. dynamic-014342 (L3772, pathOperand "`skipped -- ${err.message}`") is ADMIT/preserve. That operand prints no document path in its own passage. The text arrives through `err.message`, and its owner is the already-parked decision-index.mjs dynamic-009758. Per R6 it should be REJECT with nonDocumentUse caller-data-formatting. It has no outcome impact, since it is preserve either way, so treat it as low severity.
- D5 (enduser manifest side, same function family):
  - author-s4-fix2-2a45460821f48dec, L3678: `fs.existsSync(manifestPathFor(root))` is ADMIT/preserve. It must park with the docs/enduser-docs-index.json dependency, like L3688 (author-s4-fix2-a8e9503a9eafcad1).
  - dynamic-014318 (L3644, `${manifestPathFor(root)} not found ...`) and dynamic-014329/014330 (L3681/L3683, `${manifestRelPath}`) are ADMIT/preserve. They print the manifest path and should park with the same dependency and unit membership.
- The patch hunks themselves (L874, L2045, L2094, L3063, L3518, L4301) pass:
  - Every new target exists at pin: the four docs/knowledge files and docs/platform/agent-coordination/history/retired-engine/files/contracts/flow-definition.md.
  - Every old docs/how-to and docs/explanation path is absent at pin, so the hunks correct dead pointers.
  - The 6 hunks match the 6 patch passages. 003804/dynamic-014307, 003806/dynamic-014207, 003811/dynamic-014907 share outcomes.
  - The L3063 wrapped comment (`docs/explanation/gate-bypass-` then `design.md`) yields the correct joined filename.
  - The test assertion at test/setup/checks.test.mjs L381, `/resolve-an-events-jsonl-truncation/`, still matches after the patch.

### src/setup/instruction-registry.mjs
- D6. dynamic-014002, L610: `manifestPath: options.manifestPath,` is ADMIT/parked with a stated pathOperand of `options.manifestPath`. In its own passage it is a scalar option pass-through. The document path is constructed only at L458 (013983-013985, correctly parked). R5 (root/scalar pass-through) says REJECT with nonDocumentUse scalar-pass-through, and it should drop out of the unit's readerRecordIds. If the Lead prefers to keep it as a downstream consumer, the pathOperand must name the L458 default, not `options.manifestPath`.
- 003798 and dynamic-013969 (L361 message) and dynamic-014034/014035 (L99 probe/read) are right: park, and the state-parity obligation stays inside the blocker.
- 003799 and 003800 (comments, REJECT/preserve) are accepted as co-changes.

## Lead-judgment questions
- Q1. src/setup/instruction-registry.mjs L480-481: the message `Failed to parse architecture manifest at ${manifestPath}` and `filePath: manifestPath` (dynamic-013986/013987) are REJECT (caller-data-formatting / finding-path-field). `manifestPath` defaults to docs/architecture-manifest.json (L458). R16 says a message printing a path from a fixed doc default, even if overridable, is ADMIT. Should these join the architecture-manifest unit (park)? Outside this payload's changed items, but it is part of the R26 reader sweep.
- Q2. src/report/decision-index.mjs L135 (dynamic-009759/009760) and enduser-index-generate.mjs L156 (dynamic-009772/009773) are REJECT finding-path-field. `path: path.relative(repoRoot, indexPath)...` is the verb result, and the doctor messages in registrations print it (see D3, D5). Under R26/R16 these may be emitted outputs of a fixed doc root rather than "finding data fields". If the Lead agrees, the result-path tuples join the units. If not, D3/D5 stay valid anyway, because the messages print `result.path` and `manifestRelPath` directly.
- Q3. decision-index.mjs 003693/003694/003695 (navigation comments naming docs/decisions/index.md) are preserve while their three code readers park. They are listed as co-changes, which is acceptable. State whether Phase 9 must patch them in the same unit if the move is confirmed. The "preserve" currently hides a needed change in that case.
- Q4. Comment pointers to proposed-move paths are admitted inconsistently. 003607 (install-git-hooks) is ADMIT/preserve, while 003657, 003799, 003800 and 003815 are REJECT/preserve under the L12-26(5) rationale-comment basis. All are preserve, so there is no outcome difference, but the labels should agree.
- Q5. src/setup/instruction-registry.mjs, command-registry.mjs and gateway.rs: the fixture directory creation (gateway.rs reference-000172 / dynamic-000693 at L1740, and mcp.rs L528/545/562 `root.join("docs/contracts")`) and the wrapped comment gateway.rs 000181 (L1248) are not in the docs/contracts/fgos-gateway-api-v1.yaml unit's coChanges. They follow the same fixtures, so confirm that the unit's co-cut file list (gateway.rs, mcp.rs) is the binding unit, not the id list.
- Q6. scripts/check-doc-constitution.mjs L365/L370 messages name the bare basename `doc-governance.md` (dynamic-006639/006640, REJECT). Bare basenames stay outside the census per L12-60, so this is probably correct. Flagged only because the file moves with the unit.

## Record-text notes (no outcome change)
- registrations.mjs dynamic-014334..014337 carry role "non-document-message" while ADMIT/parked. The role label should read emitted-document-message.
- architecture.test.mjs reference-003949 reason still reads "comment points to the retained docs/architecture-manifest.json real reader ... retention follows L12-60(6)/L12-71". L12-83 R26 now parks that reader (dynamic-016778), so the "retained" wording is stale. Reword it as a co-change of the parked reader.
- architecture.test.mjs dynamic-016721/016775/016776 have nonDocumentUse "non-document-fs-probe". 016721 is a string inside a lexer fixture array, and 016775/016776 are repo-root derivation (`path.resolve(path.dirname(...), '..')`), not an fs probe. REJECT is right. The labels should be synthetic-fixture-string and root-only.
- The two parked reasons for the R26 units are the mandated template text ("depends on the exact <path> input/default destination ...") plus the path-specific dependency string. This is acceptable under R26. The text is identical across files per path, which R12 normalisation may flag, but the ruling prescribes this dependency form.
- command-registry 003646/003651 blockedReason text is identical apart from the role word. Accepted for the same reason.

## Per-file confirmations
- gateway.rs / mcp.rs: the readers at L1187 (000177, 000664, 000665) and L127 (000200, 000767, 000768) are real reads of the contract file and each shares one admission and one park per operation. Test fixture writers (000178/000694, 000193-195/000778/783/788) are ADMIT/preserve and listed as unit co-changes. They are synthetic temp-root writes that must co-move, so preserve is justified. The unit exists with decisionDependency "Phase 9 retention-or-move decision for docs/contracts/fgos-gateway-api-v1.yaml". Comments 000162/163/164/173/183/187 and mcp 000196 are REJECT/preserve rationale comments.
- decision-index.mjs: 009761 (L18 path.join), 009767 (L91 indexPathFor) and 009758 (L128 emitted message with `${indexPath}`) are correctly admitted and parked. Each pathOperand yields the document path, and `indexPath` in the message is bound at L91.
- enduser-index-generate.mjs: 009768 (L103) and 009769 (L117) park under the manifest dependency. 009788 (L94, alias scan) parks under the decisions/index.md dependency. QUADRANT_DIR_ALIASES at pin is `{explanation: ['decisions']}`, so the park is specific and true. The L92 quadrant scan (009787) is a separate operation and stays preserve.
- check-doc-constitution.mjs: all 7 items (002482-002485, dynamic-006599/006602/006642) are admitted and parked on the docs/doc-governance.md dependency. The pinned reads at L221/L264 and messages at L382/L383 match. Gate-script preserve (R13) is correctly overridden by R26. The unit lists the readers.
- architecture.test.mjs: dynamic-016778 (L24 readFileSync of docs/architecture-manifest.json) is ADMIT/parked, a real read, and is in the architecture-manifest unit. The remaining 8 items are synthetic lexer fixtures or root derivation, with only an overlapping passage window. No other real doc read exists at pin (grep confirmed).

## Counts
Files 9. Items reviewed 77. Admit/park (R26 or earlier) 33, patch 8, preserve (admit) 7, reject/preserve 29. Outcome defects D1-D6 (13 item-level corrections: 1 new slot, 8 park flips, 1 admission flip to REJECT, 1 admission flip on 014002, plus the L3644/L3681/L3683 trio counted within D5). Questions Q1-Q6.

Status: DONE_WITH_CONCERNS
Summary: Seam 5 batch 7 R26 sweep source payload reviewed. gateway, mcp, decision-index, enduser-index-generate, check-doc-constitution and architecture.test are sound. command-registry (one missing L861 enduser-index slot), instruction-registry (014002 pass-through) and registrations.mjs (preserved probes/messages on docs/decisions/index.md and docs/enduser-docs-index.json missed by the sweep) need rework.
