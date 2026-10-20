# Review p01 - seam 5 judgment file (batch 4, dead-vocabulary-guard)

Payload: s4-src-p01.json, 1 file, pin 5eb9dc609, 82 items (5 literal references + 77 dynamic tuples), no diff (no patches), 14 parks, 68 preserves. Reviewed against the full pinned source (570 lines), not only windows.

## test/runner/dead-vocabulary-guard.test.mjs - verdict: REWORK (one admission defect, rest ok)

Items reviewed: 82.

### OUTCOME defects

D1. dynamic-023891 (L539, `roots = ['src', ..., path.join('docs', 'specs')]`), R7/R6. It is REJECT/preserve with nonDocumentUse non-document-fs-probe. The array literal carries the fixed document root `path.join('docs','specs')`. Its actual operation interval contains reference-004371 and dynamic-023892 (both ADMIT/parked, gateway-root), and dynamic-023893 (L541) maps that same array through walk. The array tuple must follow the same operation: ADMIT, pathOperand `path.join('docs', 'specs')`, parked, with the same gateway-root blocker. Contrast: the sibling arrays dynamic-023874 (L461 `['docs/specs','core','domains']`) and dynamic-023896 (L56 docDirs) are admitted and parked correctly, so 023891 is inconsistent with them. Arrays with no document root (L340, L384, L422, L49) are rightly rejected.

D2. reference-004372 (L447, "docs/specs" inside the test title string), R6/R16. It is REJECT with label non-document-fs-probe. The title is a runtime-emitted string (the node:test name) printing a fixed `docs/specs` literal, so the admission should be ADMIT. Disposition: preserve is acceptable because no in-repo baseline file keys on this title (only receipts/logs mention it). Because the title lives in the same test as the parked P5 scan set (004373 / 023873 / 023874), the record should say that the title words follow the scan-set change in Phase 9 and are not an independent preserve. See Q1 for the Lead decision. If the Lead wants admission flips with an unchanged preserve closed without re-review, per R10 this is label-level.

### Record-text notes (no outcome change)

- reference-004372 and reference-004375 carry nonDocumentUse `non-document-fs-probe`, which is untrue: 004372 is a title string, 004375 is a regex that strips docs/history slugs from line text. Use a true label (title/message literal; line-text regex).
- reference-004374 (L559 comment naming docs/history): R16 says comment pointers into docs/history are admit/preserve uniformly. It is REJECT/comment-or-type. Label-level flip (R10), preserve unchanged.
- reference-004371 resolverWitness says `treeRetires:false`, but `docs/specs` retires in Phase 9 (004373's witness says true). Fix the witness.
- dynamic-023835/023836/023890/023892/023893/023873/023874: blockedReason is repeated verbatim only for items of one passage (same line or same array), which is allowed. No two different passages share a normalised blocker (R12 ok): gateway-root, p5, collect, gateway-walk, gateway-expanded, component, doc-array, p1spec, p1platform, p1architect are all distinct.
- No retired-decision citation exists in this file (no docs/decisions/00NN or 0000-index), so no successorNote is owed.

### What checked out

- Parks (14): each names a real blocker for its passage. Evidence: docs/specs (16 files) and docs/architect/agent-coordination/contracts retire; docs/platform already carries FlowDefinition/CoordinationProtocol/DemandFacts text (e.g. docs/platform/agent-coordination/vocabulary/concept-relationships.md), so widening the scan to promoted Markdown needs the history/rule exemption and coverage proof, not a blind path swap. There is no single live holder for a directory set, so patch is not available (L12-77/R4 "live holder" test does not apply).
- dynamic-023895 (component-boundary.md) park is true: P7-DOC-GAP-05 exists in plan/phase-09 and the pinned docs/platform/component-boundary.md still contains `herdr-plugin/` at L1306, L1437, L1449 (retired regex matches), so the guard reads carried wording that Phase 9 must relocate. The path itself is retained, but the content conflict is a real Phase 9 dependency; park acceptable.
- 023902 (retained docs/platform contracts dir) is in the docDirs array whose element/array outcome must be one (R7); park acceptable as the joint read set.
- Admitted preserves on retained root documents (023867, 023875, 023894 AGENTS.md; 023876 README.md): root files are not in the cutover move set (checked step-05-cutover-move-set.json: no root AGENTS.md/README.md, no core/ or domains/ entries) and no live scan change is needed. ok.
- Rejects of core/domains Markdown walks (023865/66, 023878/79): core/ and domains/ paths are absent from the move set, so the rejection stands; this agrees with R20.
- Rejects checked as true non-document use: .fgos/config.json state (023839, 023859, 023883), os.tmpdir/mkdtemp fixtures (023841-023843), src/bin/packages code dirs and deleted-path probes (023833/34, 023844-46, 023854-58, 023862-63, 023865-66, 023870-71, 023878-79, 023881-86, 023891 excluded per D1), root-only REPO_ROOT (023905/06), skipDirs/extension plumbing (023889), and diagnostic/label joins.

### Counts

82 items reviewed: 18 ADMIT as recorded (14 parked; 4 preserve: 023867, 023875, 023876, 023894), 64 REJECT/preserve. After D1/D2: 20 ADMIT (15 parked, 5 preserve incl. 004372), 62 REJECT. Outcome defects: 2 (D1 disposition-affecting, D2 admission-only). Mechanical (R19/R20) items are not separately flagged in this payload; none looked wrong.

### Lead-judgment questions

Q1. Title string at L447 (reference-004372): after Phase 9 changes the P5 scan roots, the title still says docs/specs. Decide: (a) keep title as a frozen label (preserve, ADMIT note), or (b) co-cut the title with the P5 scan patch. Current record gives no hint either way.
Q2. Failing-test diagnostics `${rel}` built from file lists that include fixed doc roots (023831, 023880, 023897, 023899, 023869) are all REJECT/text-label-join. Under R16 "a path from a fixed doc root => admit" they arguably are admitted, but the output only appears on failure and the path is a loop variable, not a fixed literal; the checker/p01 N4 precedent says reject. Confirm the intended reading; outcome is preserve either way (R10).

Status: DONE_WITH_CONCERNS
