# Review a38 step-05 seam 8, part p02

Payload: s4-src-p02.json (bin/fgos.mjs, docs/architecture-manifest.json). Pin 97c9694a4. I read the pinned source through git and the windows. I ran no checks.

## docs/architecture-manifest.json
Verdict: ok. Items reviewed: 1 (reference-000292, preserve). The join to the Step 3 record maps-j-01236 is exact. The map field names the retained docs/architecture-map.md. There is no diff.

## bin/fgos.mjs
Verdict: rework. Items reviewed: 98, plus 5 author-added references. There is no file-level diff.

Counts: 38 reference ADMIT, 3 reference REJECT, 5 reference parks with an ownerJoin. Dynamic tuples: 30 ADMIT, 22 REJECT. The three patches are two references and one dynamic tuple.

### OUTCOME defects
1. **dynamic-001635, line 5108: wrong disposition.**
   - The disposition is patch, but the record has no target, no anchor and no replacement text or diff.
   - The message cites `docs/decisions/0020-chan-fgos-khoi-worktree-worker.md`. That file does not exist at the pin, because the docs/decisions corpus is retired. The citation is dead.
   - The tuple has no successorNote, although it cites a retired decision.
   - pathOperand is null, though the tuple is admitted for a literal document path.
   - Rule: a patch needs a live target and an exact Phase 9 patch. A retired-decision citation needs a successorNote. This message is user-visible output.
   - Correction: name a live holder and anchor, and give the exact new message text with its inverse. Candidates at the pin:
     - `docs/knowledge/decisions-index/decision-record.md`, which has a D-ADR0020 row at line 25.
     - `docs/knowledge/how-fgos-isolates-concurrent-sessions-and-why-the-event-log/session-isolation-and-concurrency.md`, around line 151.
   - Add a successorNote and set pathOperand to the literal, with the owner receipt joined.
   - If no single passage states ADR0020's "worktree never carries .fgos/" rule, park with that missing claim named.
   - Also state whether a test asserts this message text. If one does, the patch needs a co-cut test.

### Checked and ok
- **Patches with a live target.**
  - reference-000240 targets `docs/platform/packaging-distribution/spec.md`. RUL9 is under Business Rules and carries the `--fix` exception wording.
  - reference-000249 targets `docs/knowledge/why-fgos-add-now-caps-...`. The section "Why `add` had this gap and `submit` didn't" exists, and the cited `docs/explanation/...` path does not exist at the pin.
  - Both are comment-only passages, so I treat target plus anchor as enough here. See Lead question 1.
- **Parks.** Each blockedReason names its own passage and gap: context-render docsRef, the attest and promote registry export, the registry writers, the gate-check and plan-lint file inputs, and the authoritative-match quadrant scan. The ownerJoin parks 000231, 000232, 000235 and 000236 point at Step 4 records. They are parked because the holder passage is missing or retiring (docs/specs/runner.md, docs/architect), so none rests on a "retained" witness.
- **Preserves.**
  - The docs/history/... citations, the iron-law-evidence exact-path comparison (000243, 000245, 000250, dynamic-001376 and -001377), and the RESEARCH.md citation (000248) are all external-project history conventions.
  - The fixed docs/doc-registry.md and docs/doc-registry.json destinations (000238, 000242, 000266, 000267, dynamic-001332 to -001335) match L12-26 and share one disposition per line.
  - The docs/decisions/index.md comments (000230, 000233) follow the unit-co-change preserve rule for output slots, consistent with the parks at 2071 and 2074.
- **Dynamic ADMIT items.** The pathOperand yields a document path in every case I checked: docs/history/${id}, docsRef + CONTEXT.md or RESEARCH.md, contextPath, absQuadrantDir, and the quadrant joins. Same-line items agree: 1774, 1775, 2040, 2071, 2105, 2107, 2108, 3081, 3101 and 3102 each share one admission and one disposition.
- **Rejects.**
  - The text-label-join diagnostics and the guard predicates (000263, 000265, 000270) do not construct or read a document. The scalar pass-throughs (000260 and 000261, dynamic-001321, -001331, -001340, -001352, -001452, -001457 and -001458) do not either.
  - The 1453 destructure is rejected and the 3029 return slot is admitted; these are different roles, so no conflict.
  - dynamic-001546 `direction:` is a comment.

### Record-text notes
- dynamic-001360, -001361, -001363, -001454 and 001356: the `reason` is boilerplate ("carries a scalar; neither chooses nor reads a docs target" or "no fixed census document root; preserve formatting"). It contradicts the ADMIT and the specific blockedReason. Align the reason with the park text.
- reference-000264 and dynamic-001341 are rejected with nonDocumentUse `comment-or-type`. In fact the original `git cat-file -e HEAD:...` occurrences were replaced by existsAtHead, so the label should say "occurrence removed before the author pin", not comment-or-type.
- reference-000230 and 000233 say "retained native path" while the output slots for the same path (2071, 2074, 3029) are parked on a retention-or-move decision. Say that the comments move with that unit.
- reference-000232 and the other joined parks quote census line numbers (1957, 3555) that differ from the pinned lines (1971, 3546). This is expected for a join, but the join text is dense.

### Lead-judgment questions
1. The three patches (000240, 000249, dynamic-001635) carry no diffHunk, and the file has no diff. Is target plus anchor enough for a comment or message patch? This is how inherited comment patches appear to be treated. If a patch must carry an exact diff, all three need one.
2. `existsAtHead(repoRoot, docPath)` at lines 1719 (attest) and 1814 (compound) probes a caller-supplied path and has no admitted item. Line 1658, which probes the registry `currentPath`, is admitted and parked. R5 plausibly covers the caller-supplied ones, but the split is worth confirming.

Status: DONE_WITH_CONCERNS
Summary: The manifest file is ok. In bin/fgos.mjs, one outcome defect: dynamic-001635 is a patch with no target, no diff and no successorNote, and it cites a retired ADR file that does not exist at the pin. The other items check out, with a few record-text notes and two questions for Lead.
